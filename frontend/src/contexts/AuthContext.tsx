import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import api from "../api";
import { useError } from "./ErrorContext";
import { v4 as uuidv4 } from "uuid";
import { jwtDecode } from "jwt-decode";
import { handleApiError } from "../utils";

/**
 * Credits: https://dev.to/shieldstring/how-to-use-axios-interceptors-to-handle-api-error-responses-2gn1
 * Used in creating the interceptor system
 */

let refreshPromise: Promise<TokenPair | void> | null = null;

interface AuthContextType {
  user: User | null;
  guestID: string | null;
  isReady: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  me: () => Promise<User | null>;
  refreshAuth: () => Promise<TokenPair | void>;
  getFreshToken: () => Promise<string | null>;
  //accessToken: string | null;
}

interface User {
  username: string;
  id: string;
}

interface AuthProviderProps {
  children: ReactNode;
}

interface LoginResponse {
  user: User;
  tokens: TokenPair;
}

interface RefreshResponse {
  tokens: TokenPair;
}

interface TokenPair {
  accessToken: string | null;
  refreshToken: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [guestID, setGuestID] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false); // without this private routes would send us to login page and from there to main page = url navigation would not work to playground. If flag is set and the context is loading, wait for the refresh to finish
  //() => localStorage.getItem("isLoggedIn") !== "true",
  const { addError } = useError();
  //const [accessToken, setAccessToken] = useState<string | null>(null);

  //to avoid staleness in interceptors
  const accessTokenRef = useRef<string | null>(null);

  /**
   * Updates tokens in state and refs.
   *
   * Requests guest ID creation if access token is null.
   *
   * @param {string | null} newAccessToken
   */
  const updateTokensOrMakeGuest = (newAccessToken: string | null) => {
    accessTokenRef.current = newAccessToken;

    if (newAccessToken) {
      if (guestID) {
        setGuestID(null);
        console.log("Cleared guest ID due to login.");
      }
    } else {
      makeGuest();
    }
  };

  /**
   * Generates and sets a new guest ID.
   */
  const makeGuest = () => {
    const newGuestID = uuidv4();
    console.log("Generated guest ID:", newGuestID);
    setGuestID("guest" + newGuestID);
  };

  function retryNeeded(url: string | undefined): boolean {
    if (!url) return false;
    const noRetryEndpoints = [
      "/users/login",
      "/users/logout",
      "/users/refresh",
    ];
    return !noRetryEndpoints.some((endpoint) => url.startsWith(endpoint));
  }

  const login = async (
    username: string,
    password: string,
  ): Promise<boolean> => {
    try {
      const response = await api.post(
        "/users/login",
        { username, password },
        { withCredentials: true },
      );
      const data: LoginResponse = response.data;
      setUser(data.user);
      updateTokensOrMakeGuest(data.tokens.accessToken);
      //localStorage.setItem("isLoggedIn", "true");
      return true;
    } catch (error) {
      handleApiError(error, { addErrorCallback: addError });
      return false;
    }
  };

  const register = async (
    username: string,
    password: string,
  ): Promise<boolean> => {
    try {
      console.log("Attempting to register user:", username);
      await api.post("/users/register", {
        username,
        password,
      });
      return true;
    } catch (error) {
      handleApiError(error, { addErrorCallback: addError });
      return false;
    }
  };

  const me = async (): Promise<User | null> => {
    try {
      const response = await api.get("/users/me");
      console.log("User info refreshed.");
      console.log(response.data);
      setUser(response.data);
      return response.data;
    } catch (error) {
      handleApiError(error, { addErrorCallback: addError });
      return null;
    }
  };

  const logout = async () => {
    try {
      await api.post("/users/logout", {}, { withCredentials: true });
    } catch (error) {
      handleApiError(error, { addErrorCallback: addError });
    } finally {
      setUser(null);
      //localStorage.removeItem("isLoggedIn");
      updateTokensOrMakeGuest(null);
    }
  };

  const refreshAuth = useCallback(async () => {
    //const isLoggedIn = localStorage.getItem("isLoggedIn");
    // if (isLoggedIn !== "true") {
    //   console.log("No session flag found, skipping refresh.");
    //   makeGuest();
    //   return;
    // }

    if (refreshPromise) {
      // piggy back
      console.log("Joining existing refresh request...");
      return refreshPromise;
    }

    console.log("Attempting to refresh cookie...");

    const tryToRefresh = async () => {
      try {
        console.log("[AUTH] Sending refresh request to backend");
        const refreshResponse = await api.post(
          "/users/refresh",
          {},
          { withCredentials: true },
        );
        const refreshData: RefreshResponse = refreshResponse.data;

        updateTokensOrMakeGuest(refreshData.tokens.accessToken);

        // Get user data using the new access token
        try {
          const userData = await api.get("/users/me");
          setUser(userData.data);
          console.log("User session successfully restored.");
        } catch (error) {
          console.warn("Failed to fetch user data after refresh, logging out.");
          handleApiError(error);
          setUser(null);
          updateTokensOrMakeGuest(null);
          return;
        }
        return refreshData.tokens;
      } catch (error) {
        console.warn("Session refresh failed, user is not logged in.");
        handleApiError(error);
        setUser(null);
        updateTokensOrMakeGuest(null);
        //localStorage.removeItem("isLoggedIn");
      } finally {
        refreshPromise = null;
      }
    };
    refreshPromise = tryToRefresh();
    return refreshPromise;
  }, []); // No dependencies needed since we use refs for tokens

  function isJwtExpiringSoon(jwt: string, thresholdSeconds = 15): boolean {
    try {
      const payload = jwtDecode(jwt);
      if (!payload.exp) throw new Error("Token has no exp");

      const now = Math.floor(Date.now() / 1000);
      return payload.exp - now <= thresholdSeconds;
    } catch (err) {
      console.error("Error decoding token", err);
      return true;
    }
  }

  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        const currentAccessToken = accessTokenRef.current;
        if (currentAccessToken) {
          config.headers["Authorization"] = `Bearer ${currentAccessToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        console.debug("Response interceptor caught an error");
        if (!originalRequest) {
          return Promise.reject(error);
        }
        if (
          error.response?.status === 401 &&
          retryNeeded(originalRequest.url) &&
          !originalRequest._retryFlag
        ) {
          console.debug(originalRequest.url);
          originalRequest._retryFlag = true;
          console.warn("Access token expired, attempting to refresh...");

          try {
            const tokens = await refreshAuth();
            if (tokens && tokens.accessToken) {
              console.debug(
                "Access token refreshed. Retrying original request...",
              );
              return api(originalRequest);
            } else {
              console.warn("Token refresh failed, cannot retry request.");
              return Promise.reject(error);
            }
          } catch (refreshError) {
            console.debug("Refresh failed in interceptor");
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      },
    );
    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  /**
   * Gets a fresh access token, refreshing if needed.
   *
   * Useful when axios interceptors can't be used, e.g. in WebSocket and in EventSource connections.
   * Returns the fresh token by reference to avoid staleness.
   *
   * @example
   * // good
   * const token = await getFreshToken();
   * const url = `${backendUrl}/jobs/train/${jobId}/events?token=${token}`;
   * const eventSource = new EventSource(url);
   *
   * @returns The fresh access token or null if unable to get one.
   */
  const getFreshToken = useCallback(async (): Promise<string | null> => {
    const needNew =
      !accessTokenRef.current || isJwtExpiringSoon(accessTokenRef.current, 15);
    if (needNew) {
      console.log("Needing new access token");
      try {
        const tokens = await refreshAuth();
        return tokens?.accessToken || null;
      } catch (error) {
        console.error("Failed to get fresh token:", error);
        return null;
      }
    }

    // Return existing token if we have one
    return accessTokenRef.current;
  }, [refreshAuth]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await refreshAuth();
      } finally {
        setIsReady(true);
      }
    };

    initializeAuth();
  }, [refreshAuth]);

  const value = {
    user,
    guestID,
    isReady,
    login,
    register,
    logout,
    refreshAuth,
    getFreshToken,
    //accessToken,
    me,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook for using the AuthContext.
 *
 * Used to manage user authentication state and actions.
 *
 * @returns {AuthContextType} The auth context values.
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
