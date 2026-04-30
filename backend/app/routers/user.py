import uuid
from fastapi import APIRouter, Header, HTTPException, Request, Response, Cookie, status
from datetime import datetime, timedelta, timezone

from app.core.dependencies import (
    AuthDep,
    ResourceManagerDep,
    UserSessionDBDep,
    UserDep,
    rate_limiter,
)
from app.schemas import (
    User,
    RegisterRequest,
    LoginRequest,
    LoginResponse,
    TokenPair,
    RefreshResponse,
    NameAvailableResponse,
    LogoutResponse,
)
from app.utils.error_wrappers import db_http_handler

router = APIRouter()


@router.get("/me", response_model=User)
@rate_limiter("30/minute")
async def me(request: Request, user: UserDep):
    """
    Endpoint to retrieve information about the currently authenticated user.

    Args:
        request (Request): The incoming HTTP request object.
        user (User): The currently authenticated user (injected via UserDep).
    Returns:
        User: The user information
    Raises:
        HTTPException: 401 if Authorization header is missing, if token is invalid, expired, user doesn't exist,
                       or user has no active session
        HTTPException: 500 for internal errors
    """
    return user


@router.post("/refresh", response_model=RefreshResponse)
@rate_limiter("20/minute")
async def refresh(
    request: Request,
    response: Response,
    auth: AuthDep,
    db: UserSessionDBDep,
    refresh_token: str | None = Cookie(alias="refreshToken", default=None),
    x_requested_with: str | None = Header(default=None),
):
    """
    Endpoint to refresh access and refresh tokens.

    Verifies the provided refresh token, checks session validity, and issues new tokens.

    Args:
        request (Request): The incoming HTTP request object.
        response (Response): The response object to set the cookie
        auth (Authenticator): Authenticator instance for token validation and generation (injected via AuthDep).
        db (UserSessionDao): The database dao for session and user operations (injected via UserSessionDBDep).
        refreshToken (str): The refresh token from the cookie
        x_requested_with (str): The X-Requested-With header value

    Returns:
        RefreshResponse: The new access and refresh tokens
    Raises:
        HTTPException: 401 if refresh token is missing, invalid, expired, or user/session issues
        HTTPException: 500 for internal errors
        HTTPException: 501 for unexpected time data types
    """
    if x_requested_with != "XMLHttpRequest":
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing X-Requested-With header",
        )
    if not refresh_token:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, detail="Refresh token missing"
        )
    payload = auth.decode_refresh(refresh_token)
    if not payload:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )

    sid = payload.get("sid")
    srow = await db_http_handler(db.get_session)(session_id=sid)
    if not srow:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Session revoked")

    last_seen = srow["last_seen"]
    # IMPORTANT db dao must return datetime object here

    if last_seen.tzinfo is not None:
        last_seen = last_seen.astimezone(timezone.utc).replace(tzinfo=None)
    if datetime.now(timezone.utc).replace(tzinfo=None) - last_seen > timedelta(
        seconds=auth.get_refresh_ttl()
    ):
        await db_http_handler(db.revoke_session)(session_id=sid)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Session expired")
    if not auth.verify_refresh(refresh_token, srow["refresh_hash"]):
        await db_http_handler(db.revoke_session)(session_id=sid)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh hash")

    user_id = srow["user_id"]
    if not user_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid session")
    urow = await db_http_handler(db.get_user_by_id)(user_id=user_id)
    if not urow:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid user")
    uname = urow["username"]
    if not uname:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid user")

    new_access = auth.issue_access_token(user_id, uname, str(sid))
    new_refresh = auth.issue_refresh_token(str(sid))
    if not new_access or not new_refresh:
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error"
        )
    refresh_hash = auth.hash_refresh(new_refresh)
    await db_http_handler(db.update_session_refresh)(
        session_id=str(sid), refresh_hash=refresh_hash
    )
    await db_http_handler(db.touch_session)(session_id=str(sid))

    response.set_cookie(
        key="refreshToken",
        value=new_refresh,
        httponly=True,
        samesite="none",
        secure=True,
        max_age=auth.get_refresh_ttl(),
    )

    return RefreshResponse(tokens=TokenPair(accessToken=new_access, refreshToken=""))


@router.post("/login", response_model=LoginResponse)
@rate_limiter("5/minute")
@rate_limiter("50/hour")
async def login(
    request: Request,
    req: LoginRequest,
    response: Response,
    auth: AuthDep,
    db: UserSessionDBDep,
    resources: ResourceManagerDep,
):
    """
    Endpoint to authenticate a user and issue access and refresh tokens.

    Args:
        request (Request): The incoming HTTP request object.
        req (LoginRequest): The login request payload
        response (Response): The response object to set the cookie
        auth (Authenticator): Authenticator instance for password verification and token generation (injected via AuthDep).
        db (UserSessionDao): The database dao for user and session operations (injected via UserSessionDBDep).

    Returns:
        LoginResponse: The authenticated user information and issued tokens

    Raises:
        HTTPException: 401 if credentials are invalid
        HTTPException: 500 for internal errors
    """
    uname = req.username.strip()
    row = await db_http_handler(db.get_user_by_name)(user_name=uname)
    if not row or not row["password_hash"]:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    pw_ok = await resources.run_blocking_task(
        auth.verify_password, req.password, row["password_hash"]
    )
    if not pw_ok:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    user_id = row["id"]

    await db_http_handler(db.revoke_sessions_for_user)(user_id=user_id)

    session_id = str(uuid.uuid4())
    refresh_token = auth.issue_refresh_token(session_id)
    if not refresh_token:
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error"
        )
    refresh_hash = auth.hash_refresh(refresh_token)
    await db_http_handler(db.insert_session)(
        session_id=session_id,
        user_id=user_id,
        refresh_hash=refresh_hash,
    )
    access_token = auth.issue_access_token(user_id, uname, session_id)
    if not access_token:
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error"
        )
    response.set_cookie(
        key="refreshToken",
        value=refresh_token,
        httponly=True,
        samesite="none",
        secure=True,
        max_age=auth.get_refresh_ttl(),
    )

    return LoginResponse(
        user=User(id=user_id, username=uname),
        tokens=TokenPair(accessToken=access_token, refreshToken=""),
    )


@router.post("/logout", response_model=LogoutResponse)
@rate_limiter("100/minute")
async def logout(
    request: Request,
    response: Response,
    auth: AuthDep,
    db: UserSessionDBDep,
    refresh_token: str | None = Cookie(alias="refreshToken", default=None),
    x_requested_with: str | None = Header(default=None),
):
    """
    Endpoint to log out a user by revoking their session, invalidating the refresh token.

    Args:
        request (Request): The incoming HTTP request object.
        response (Response): The response object to delete the cookie
        auth (Authenticator): Authenticator instance for token decoding (injected via AuthDep).
        db (UserSessionDao): The database dao for session operations (injected via UserSessionDBDep).
        refreshToken (str): The refresh token from the cookie.
        x_requested_with (str): The X-Requested-With header value.
    Returns:
        dict: Confirmation of successful logout
    Raises:
        HTTPException: 401 if refresh token is invalid or session issues
        HTTPException: 500 for internal errors
    """
    if x_requested_with != "XMLHttpRequest":
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing X-Requested-With header",
        )
    if not refresh_token:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, detail="Missing refresh token"
        )
    payload = auth.decode_refresh(refresh_token)
    if not payload:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )
    sid = payload.get("sid")

    # if a user OR attacker provides a good formed refresh token we revoke it,
    # no matter if the refresh token is valid, session id will change so attacker
    # can't keep logging out the user
    await db_http_handler(db.revoke_session)(session_id=sid)
    response.delete_cookie(
        key="refreshToken", samesite="none", secure=True, httponly=True
    )
    return {"ok": True}


@router.get("/username_available/{username}", response_model=NameAvailableResponse)
@rate_limiter("20/minute")
async def username_available(request: Request, username: str, db: UserSessionDBDep):
    """
    Endpoint to check if a username is available for registration.

    Checks the database for the existence of the given username (case-insensitive).

    Args:
        request (Request): The incoming HTTP request object.
        username (str): The username to check
        db (UserSessionDao): The database dao for user operations (injected via UserSessionDBDep).
    Returns:
        dict: Availability status of the username

    Raises:
        HTTPException: 500 for internal errors
    """
    user = await db_http_handler(db.get_user_by_name_lower)(
        user_name_lower=username.strip().lower()
    )
    return {"available": user is None}


@router.post("/register", response_model=User)
@rate_limiter("3/minute")
@rate_limiter("50/day")
async def register(
    request: Request,
    req: RegisterRequest,
    db: UserSessionDBDep,
    auth: AuthDep,
    resources: ResourceManagerDep,
):
    """
    Endpoint to register a new user.
    Validates the provided username and password, checks for username availability,
    hashes the password, and creates a new user in the database.

    Args:
        request (Request): The incoming HTTP request object.
        req (RegisterRequest): The registration request payload
        db (UserSessionDao): The database dao for user operations (injected via UserSessionDBDep).
        auth (Authenticator): Authenticator instance for password hashing (injected via AuthDep).
    Returns:
        User: The newly created user information

    Raises:
        HTTPException: 422 for invalid username or password criteria
        HTTPException: 409 if username is already taken
        HTTPException: 500 for internal errors
    """
    uname = req.username.strip()
    if not uname or len(uname) < 3 or len(uname) > 32 or not uname.isalnum():
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid username"
        )

    password_checks = [
        (len(req.password) >= 8, "Password must be at least 8 characters long"),
        (
            any(c.isdigit() for c in req.password),
            "Password must contain at least one number",
        ),
        (
            any(c.isupper() for c in req.password),
            "Password must contain at least one uppercase letter",
        ),
        (
            any(c.islower() for c in req.password),
            "Password must contain at least one lowercase letter",
        ),
        (len(req.password.encode("utf-8")) <= 72, "Password is too long"),
    ]

    for check, error_message in password_checks:
        if not check:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY, detail=error_message
            )
    user_exists = await db_http_handler(db.get_user_by_name_lower)(
        user_name_lower=uname.lower()
    )
    if user_exists:
        raise HTTPException(status.HTTP_409_CONFLICT, detail="Username taken")

    uid = str(uuid.uuid4())
    pw_hash = await resources.run_blocking_task(auth.hash_password, req.password)
    await db_http_handler(db.create_user)(
        user_id=uid, user_name=uname, password_hash=pw_hash
    )
    return User(id=uid, username=uname)


@router.delete("/{user_id}", response_model=dict)
async def delete_user(user_id: str, db: UserSessionDBDep, user: UserDep):
    """
    Endpoint to delete a user.
    Validates the user identity and deletes the user from the database.

    Args:
        request (Request): The incoming HTTP request object.
        user_id (str): The ID of the user to delete
        db (UserSessionDao): The database dao for user operations (injected via UserSessionDBDep).
        user (User): The authenticated user making the request (injected via UserDep).
    Returns:
        dict: A success message indicating the user was deleted

    Raises:
        HTTPException: 403 if attempting to delete another user
        HTTPException: 500 for internal errors
    """

    if user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Cannot delete other users",
        )
    await db_http_handler(db.delete_user)(user_id=user_id)
    return {"success": True}
