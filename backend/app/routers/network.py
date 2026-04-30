import uuid
from fastapi import APIRouter, HTTPException, Request, status
from app.schemas import (
    NetworkCreateRequest,
    NetworkDoc,
    NetworkUpdateRequest,
    NetworkDeleteResponse,
)
from app.schemas.networks import NetworkConfig
from app.core.dependencies import (
    UserDep,
    NetworkDBDep,
    rate_limiter,
    get_app_config,
)
from app.utils import init_network
from app.utils.error_wrappers import db_http_handler


router = APIRouter()
MAX_NUM_OF_NETWORKS = get_app_config().get_max_networks_per_user()
MAX_NUM_OF_NETWORK_NODES = get_app_config().get_max_network_nodes()


@router.get("/list_networks", response_model=list[NetworkDoc])
@rate_limiter("50/minute")
async def list_networks(
    request: Request,
    user: UserDep,
    db: NetworkDBDep,
):
    """
    Endpoint to list all networks for the authenticated user.

    Args:
        request (Request): The incoming HTTP request object.
        user (User): The authenticated user (injected via UserDep).
        db (NetworkDao): The database dao for network operations (injected via NetworkDBDep).

    Returns:
        list[NetworkDoc]: A list of NetworkDoc objects representing the user's networks

    Raises:
        HTTPException: 401 if Authorization header is missing, if token is invalid, expired, user doesn't exist,
                       or user has no active session
        HTTPException: 500 for internal errors
    """
    networks = await db_http_handler(db.list_networks_for_user)(
        user_id=user.id, limit=MAX_NUM_OF_NETWORKS
    )
    if not networks:
        return []
    parsed_networks = []
    for net in networks:
        parsed_networks.append(
            NetworkDoc(
                id=net["id"],
                userId=net["user_id"],
                name=net["name"],
                nn=NetworkConfig.model_validate(net["nn_json"]),
                meta=net["meta_json"],
                createdAt=net["created_at"],
                updatedAt=net["updated_at"],
            )
        )
    return parsed_networks


@router.post(
    "/create_network", response_model=NetworkDoc, status_code=status.HTTP_201_CREATED
)
@rate_limiter("10/minute")
async def create_network(
    request: Request,
    req: NetworkCreateRequest,
    user: UserDep,
    db: NetworkDBDep,
):
    """
    Endpoint to create a new network for the authenticated user.

    Enforces a maximum number of networks per user and validates the network structure.

    Args:
        request (Request): The incoming HTTP request object.
        req (NetworkCreateRequest): The network creation request payload
        user (User): The authenticated user (injected via UserDep).
        db (NetworkDao): The database dao for network operations (injected via NetworkDBDep).
    Returns:
        NetworkDoc: The created network document
    Raises:
        HTTPException: 422 for invalid network data
        HTTPException: 409 if limit of networks is reached
        HTTPException: 401 if Authorization header is missing, if token is invalid, expired, user doesn't exist,
                       or user has no active session
        HTTPException: 500 for internal errors
    """
    if req.layers and (
        not isinstance(req.layers, list)
        or len(req.layers) < 2
        or req.layers[0] != 18
        or req.layers[-1] != 9
    ):
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid layers: must be a list with at least two elements, input layer must have 18 neurons and output layer must have 9 neurons",
        )
    if req.layers and sum(req.layers) > MAX_NUM_OF_NETWORK_NODES:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid layers: total number of neurons must not exceed {MAX_NUM_OF_NETWORK_NODES}",
        )

    network_count = await db_http_handler(db.count_networks_for_user)(user_id=user.id)
    if network_count >= MAX_NUM_OF_NETWORKS:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail=f"Maximum number of networks reached. Please delete an existing network before creating a new one.",
        )
    net_id = str(uuid.uuid4())
    values = init_network(req.layers)

    net = await db_http_handler(
        db.insert_network,
        "Failed to find network after creation, failed to create network.",
    )(
        network_id=net_id,
        user_id=user.id,
        name=req.name,
        nn=values.model_dump(),
        meta={},
    )

    return NetworkDoc(
        id=net["id"],
        userId=net["user_id"],
        name=net["name"],
        nn=NetworkConfig.model_validate(net["nn_json"]),
        meta=net["meta_json"],
        createdAt=net["created_at"],
        updatedAt=net["updated_at"],
    )


@router.get("/{net_id}", response_model=NetworkDoc)
@rate_limiter("30/minute")
async def get_network(
    request: Request,
    net_id: str,
    user: UserDep,
    db: NetworkDBDep,
):
    """
    Endpoint to retrieve a specific network by ID for the authenticated user.

    Args:
        request (Request): The incoming HTTP request object.
        net_id (str): The ID of the network to retrieve
        user (User): The authenticated user (injected via UserDep).
        db (NetworkDao): The database dao for network operations (injected via NetworkDBDep).
    Returns:
        NetworkDoc: The requested network document
    Raises:
        HTTPException: 404 if the network is not found
        HTTPException: 401 if Authorization header is missing, if token is invalid, expired, user doesn't exist,
                       or user has no active session
        HTTPException: 500 for internal errors
    """
    network = await db_http_handler(db.get_network_by_id_user)(
        network_id=net_id, user_id=user.id
    )

    if not network:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Network not found")
    return NetworkDoc(
        id=network["id"],
        userId=network["user_id"],
        name=network["name"],
        nn=NetworkConfig.model_validate(network["nn_json"]),
        meta=network["meta_json"],
        createdAt=network["created_at"],
        updatedAt=network["updated_at"],
    )


@router.delete("/{net_id}", response_model=NetworkDeleteResponse)
@rate_limiter("10/minute")
async def delete_network(
    request: Request,
    net_id: str,
    user: UserDep,
    db: NetworkDBDep,
):
    """
    Endpoint to delete a specific network by ID for the authenticated user.

    Args:
        request (Request): The incoming HTTP request object.
        net_id (str): The ID of the network to delete
        user (UserDep): The authenticated user (injected via UserDep).
        db (NetworkDao): The database dao for network operations (injected via NetworkDBDep).
    Returns:
        dict: A confirmation message upon successful deletion
    Raises:
        HTTPException: 404 if the network is not found
        HTTPException: 401 if Authorization header is missing, if token is invalid, expired, user doesn't exist,
                       or user has no active session
        HTTPException: 500 for internal errors
    """
    net = await db_http_handler(db.get_network_by_id_user)(
        network_id=net_id, user_id=user.id
    )
    if not net:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Network not found")
    await db_http_handler(db.delete_network)(network_id=net_id, user_id=user.id)
    return {"detail": "Network deleted"}


@router.put("/{net_id}", response_model=NetworkDoc)
@rate_limiter("40/minute")
async def update_network(
    request: Request,
    net_id: str,
    req: NetworkUpdateRequest,
    user: UserDep,
    db: NetworkDBDep,
):
    """
    Endpoint to update a specific network by ID for the authenticated user.

    Before updating, validates the neural network structure.

    Args:
        request (Request): The incoming HTTP request object.
        net_id (str): The ID of the network to update.
        req (NetworkUpdateRequest): The network update request payload.
        user (User): The authenticated user (injected via UserDep).
        db (NetworkDao): The database dao for network operations (injected via NetworkDBDep).
    Returns:
        NetworkDoc: The updated network document
    Raises:
        HTTPException: 404 if the network is not found
        HTTPException: 422 for invalid network data
        HTTPException: 401 if Authorization header is missing, if token is invalid, expired, user doesn't exist,
                       or user has no active session
        HTTPException: 500 for internal errors
    """
    net = await db_http_handler(db.get_network_by_id_user)(
        network_id=net_id, user_id=user.id
    )
    if not net:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Network not found")
    if req.nn is not None:
        nn_dict = req.nn.model_dump()
        if (
            len(nn_dict["layers"]) < 2
            or nn_dict["layers"][0] != 18
            or nn_dict["layers"][-1] != 9
        ):
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid nn format: input layer must have 18 neurons and output layer must have 9 neurons",
            )
        if sum(nn_dict["layers"]) > MAX_NUM_OF_NETWORK_NODES:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid nn format: total number of neurons must not exceed {MAX_NUM_OF_NETWORK_NODES}",
            )
        for i in range(len(nn_dict["layers"]) - 1):
            if (
                len(nn_dict["weights"][i]) != nn_dict["layers"][i + 1]
                or len(nn_dict["weights"][i][0]) != nn_dict["layers"][i]
                or len(nn_dict["biases"][i]) != nn_dict["layers"][i + 1]
            ):
                raise HTTPException(
                    status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Invalid nn format shape",
                )
    net = await db_http_handler(db.update_network)(
        network_id=net_id,
        name=req.name,
        nn=req.nn.model_dump() if req.nn is not None else None,
        meta=req.meta if req.meta is not None else None,
    )
    if not net:
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to find network after update",
        )

    return NetworkDoc(
        id=net["id"],
        userId=net["user_id"],
        name=net["name"],
        nn=NetworkConfig.model_validate(net["nn_json"]),
        meta=net["meta_json"],
        createdAt=net["created_at"],
        updatedAt=net["updated_at"],
    )
