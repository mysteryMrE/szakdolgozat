import { render, screen, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "../../src/contexts/AuthContext";
import { useError } from "../../src/contexts/ErrorContext";
import api from "../../src/api";
import { user } from "../utils";
import { jwtDecode } from "jwt-decode";
import { useState } from "react";

vi.mock("../../src/contexts/ErrorContext", () => ({
  useError: vi.fn(),
}));

vi.mock("../../src/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
  },
}));

vi.mock("jwt-decode", () => ({
  jwtDecode: vi.fn(),
}));

const mockJwtDecode = vi.mocked(jwtDecode);

const mockApiGet = vi.mocked(api.get);
const mockApiPost = vi.mocked(api.post);
const mockAddError = vi.fn();
const mockedUseError = vi.mocked(useError);
mockedUseError.mockReturnValue({ addError: mockAddError });

const userName = "Jack";
const userID = "Sparrow";

const TestComponent = () => {
  const { user, login, register, logout, guestID, getFreshToken, refreshAuth } =
    useAuth();
  const [freshTokenResult, setFreshTokenResult] = useState<string | null>(null);
  return (
    <div>
      <div data-testid="user">{user ? user.username : "No User"}</div>
      <div data-testid="guest-id">{guestID || "No Guest ID"}</div>
      <div data-testid="access-token">{freshTokenResult || "No Token"}</div>
      <button onClick={async () => await login(userName, "password")}>
        Login
      </button>
      <button onClick={async () => await register(userName, "password")}>
        Register
      </button>
      <button onClick={async () => await logout()}>Logout</button>
      <button onClick={async () => setFreshTokenResult(await getFreshToken())}>
        Get Fresh Token
      </button>
      <button onClick={async () => await refreshAuth()}>Refresh Auth</button>
    </div>
  );
};

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes with guest ID if refresh fails", async () => {
    mockApiPost.mockRejectedValue(new Error("Refresh failed"));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("guest-id")).toHaveTextContent(
        new RegExp("guest", "i"),
      );
      expect(screen.getByTestId("user")).toHaveTextContent("No User");
      expect(mockApiPost).toHaveBeenCalledWith(
        "/users/refresh",
        {},
        { withCredentials: true },
      );
    });
  });

  it("refreshAuth retrives access token sets state right", async () => {
    mockApiPost.mockResolvedValue({
      data: { tokens: { accessToken: "access", refreshToken: "not used" } },
    });
    mockApiGet.mockResolvedValue({
      data: { username: userName, id: userID },
    });
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );
    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith(
        "/users/refresh",
        {},
        { withCredentials: true },
      );
      expect(mockApiGet).toHaveBeenCalledWith("/users/me");
      expect(screen.getByTestId("user")).toHaveTextContent(userName);
      expect(screen.getByTestId("guest-id")).toHaveTextContent("No Guest ID");
    });
  });

  it("refreshAuth piggybacks multiple calls, only when pending", async () => {
    let accessToken = "access-token-1";

    let resolve: any;

    const postPromise = new Promise((res) => {
      resolve = res;
    });

    mockApiPost.mockReturnValue(postPromise);

    mockApiGet.mockResolvedValue({
      data: { username: userName, id: userID },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    expect(mockApiPost).toHaveBeenCalledTimes(1); // auto refresh on mount

    const refreshButton = screen.getByRole("button", { name: "Refresh Auth" });
    await user.click(refreshButton);

    expect(mockApiPost).toHaveBeenCalledTimes(1); // piggy live

    resolve({
      data: { tokens: { accessToken, refreshToken: "not used" } },
    });

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent(userName);
    });

    const postPromise2 = new Promise((res) => {
      resolve = res;
    });
    mockApiPost.mockReturnValue(postPromise2);

    accessToken = "access-token-2";

    await user.click(refreshButton);
    expect(mockApiPost).toHaveBeenCalledTimes(2);

    resolve({
      data: { tokens: { accessToken, refreshToken: "not used" } },
    });

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent(userName);
    });
  });

  it("logs in successfully with credentials", async () => {
    const mockUser = { id: userID, username: userName };
    const mockTokens = {
      accessToken: "access-token",
      refreshToken: "not used",
    };
    mockApiPost.mockResolvedValue({
      data: { user: mockUser, tokens: mockTokens },
    }); // covers refresh and login

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    expect(screen.getByTestId("user")).toHaveTextContent("No User");

    await waitFor(() => {
      expect(screen.getByTestId("guest-id")).toHaveTextContent(
        new RegExp("guest", "i"),
      );
    });

    const loginButton = screen.getByText(/Login/i);

    await user.click(loginButton);

    expect(screen.getByTestId("user")).toHaveTextContent(
      new RegExp(mockUser.username, "i"),
    );

    expect(api.post).toHaveBeenCalledWith(
      "/users/login",
      {
        username: userName,
        password: "password",
      },
      { withCredentials: true },
    );
    const fresh = screen.getByRole("button", { name: "Get Fresh Token" });
    await user.click(fresh);
    expect(screen.getByTestId("access-token")).toHaveTextContent(
      "access-token",
    );
    expect(screen.getByTestId("guest-id")).toHaveTextContent("No Guest ID");
  });

  it.each(["Invalid credentials", "Nem sikerült kapcsolódni a szerverhez"])(
    "handles login failure and calls addError with %s error message",
    async (errorMessage) => {
      mockApiPost.mockRejectedValue(new Error(errorMessage));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      const loginButton = screen.getByText("Login");
      await user.click(loginButton);

      expect(mockAddError).toHaveBeenCalledWith(errorMessage);
      expect(screen.getByTestId("user")).toHaveTextContent("No User");
      expect(screen.getByTestId("access-token")).toHaveTextContent("No Token");
      expect(screen.getByTestId("guest-id")).toHaveTextContent(/guest/);
    },
  );

  it("registers successfully", async () => {
    mockApiPost.mockResolvedValue({});

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    const registerButton = screen.getByText("Register");
    await user.click(registerButton);
    expect(mockApiPost).toHaveBeenCalledTimes(2);
    expect(mockApiPost).toHaveBeenCalledWith("/users/register", {
      username: userName,
      password: "password",
    });
  });

  it.each([["Password too short"], ["Nem sikerült kapcsolódni a szerverhez"]])(
    "handles register failure and shows %s error message",
    async (errorMessage) => {
      mockApiPost.mockRejectedValue(new Error(errorMessage));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      const registerButton = screen.getByText("Register");
      await user.click(registerButton);

      expect(mockAddError).toHaveBeenCalledWith(errorMessage);
    },
  );

  it("logs out successfully, makes guest ID and clears user data", async () => {
    mockApiPost.mockResolvedValue({
      data: { tokens: { accessToken: "access-token", refreshToken: "" } },
    });

    mockApiGet.mockResolvedValue({
      data: { username: userName, id: userID },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent(userName);
    });

    expect(screen.getByTestId("guest-id")).toHaveTextContent("No Guest ID");

    const logoutButton = screen.getByText("Logout");
    await user.click(logoutButton);

    expect(api.post).toHaveBeenCalledWith(
      "/users/logout",
      {},
      { withCredentials: true },
    );

    expect(screen.getByTestId("user")).toHaveTextContent("No User");
    expect(screen.getByTestId("guest-id")).toHaveTextContent(
      new RegExp("guest", "i"),
    );
  });

  it.each(["Password too short", "Nem sikerült kapcsolódni a szerverhez"])(
    "handles logout failure and shows %s error message",
    async (errorMessage) => {
      mockApiPost.mockImplementation((url: string) => {
        if (url === "/users/refresh") {
          return Promise.resolve({
            data: { tokens: { accessToken: "access-token", refreshToken: "" } },
          });
        }
        return Promise.reject(new Error(errorMessage));
      });

      mockApiGet.mockResolvedValue({
        data: { username: userName, id: userID },
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("user")).toHaveTextContent(userName);
      });
      const getFreshTokenButton = screen.getByRole("button", {
        name: "Get Fresh Token",
      });
      await user.click(getFreshTokenButton);

      expect(screen.getByTestId("access-token")).toHaveTextContent(
        "access-token",
      );
      expect(screen.getByTestId("guest-id")).toHaveTextContent("No Guest ID");

      const logoutButton = screen.getByText("Logout");
      await user.click(logoutButton);

      expect(mockApiPost).toHaveBeenCalledWith(
        "/users/logout",
        {},
        { withCredentials: true },
      );

      expect(screen.getByTestId("user")).toHaveTextContent("No User");
      expect(screen.getByTestId("guest-id")).toHaveTextContent(
        new RegExp("guest"),
      );

      expect(mockAddError).toHaveBeenCalledWith(errorMessage);
    },
  );

  it("getFreshToken returns existing token if not expiring", async () => {
    mockJwtDecode.mockReturnValue({
      exp: Math.floor(Date.now() / 1000) + 3600,
    }); // 1 hour in the future

    mockApiPost.mockResolvedValue({
      data: {
        tokens: { accessToken: "valid-token", refreshToken: "not used" },
      },
    });

    mockApiGet.mockResolvedValue({
      data: { id: userID, username: userName },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent(userName);
    });

    expect(mockApiPost).toHaveBeenCalledTimes(1);

    const getFreshTokenButton = screen.getByText("Get Fresh Token");
    await user.click(getFreshTokenButton);

    expect(mockApiPost).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("access-token")).toHaveTextContent("valid-token");
  });

  it("getFreshToken calls refresh if expiring", async () => {
    mockJwtDecode.mockReturnValue({
      exp: Math.floor(Date.now() / 1000) - 3600,
    });

    mockApiPost.mockResolvedValue({
      data: { tokens: { accessToken: "old-access-token", refreshToken: "" } },
    });

    mockApiGet.mockResolvedValue({
      data: { id: userID, username: userName },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent(userName);
    });

    mockApiPost.mockClear();

    const getFreshTokenButton = screen.getByText("Get Fresh Token");
    await user.click(getFreshTokenButton);

    expect(mockApiPost).toHaveBeenCalledWith(
      "/users/refresh",
      {},
      {
        withCredentials: true,
      },
    );
  });
});
