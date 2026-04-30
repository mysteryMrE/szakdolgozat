import { screen, waitFor } from "@testing-library/react";
import { render as renderWithProviders } from "../utils";
import PrivateRoute from "../../src/PrivateRoutes";
import { Link, Route, Routes } from "react-router-dom";
import api from "../../src/api";
import { user } from "../utils";
import { useAuth } from "../../src/contexts/AuthContext";

vi.mock("../../src/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
  },
}));
const mockApiGet = vi.mocked(api.get);
const mockApiPost = vi.mocked(api.post);

const TestComponent = () => {
  const { user, logout } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<div>Home Page</div>} />
      <Route
        path="/start"
        element={
          <>
            <div>Start Page</div>
            <Link to="/protected">Go to Protected</Link>
            <Link to="/">Go to Home</Link>
            <Link to="/login">Go to Login</Link>
            <div data-testid="username">{user?.username}</div>
          </>
        }
      />
      <Route
        path="/protected"
        element={
          <PrivateRoute>
            <>
              <div>Protected Content</div>
              <button onClick={logout}>Logout</button>
            </>
          </PrivateRoute>
        }
      />
      <Route path="/login" element={<div>Login Page</div>} />
    </Routes>
  );
};

describe("Private Routes Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders null while auth state is initializing", () => {
    let reject: any;

    const authPromise = new Promise((_, rej) => {
      reject = rej;
    });

    mockApiPost.mockReturnValue(authPromise);

    renderWithProviders(
      <PrivateRoute>
        <div>Protected Content</div>
      </PrivateRoute>,
    );

    expect(
      screen.queryByText(new RegExp("Protected Content", "i")),
    ).not.toBeInTheDocument();
    reject();
  });

  it("redirects to login if not authenticated", async () => {
    renderWithProviders(<TestComponent />);

    expect(screen.getByTestId("username")).toHaveTextContent("");
    expect(screen.getByText(new RegExp("Start Page", "i"))).toBeInTheDocument();

    const link = screen.getByText(new RegExp("Go to Protected", "i"));

    await user.click(link);

    expect(screen.getByText(new RegExp("Login Page", "i"))).toBeInTheDocument();
  });

  it("renders content if authenticated", async () => {
    mockApiPost.mockResolvedValue({
      data: { tokens: { accessToken: "access", refreshToken: "not used" } },
    });
    mockApiGet.mockResolvedValue({
      data: { username: "Jack", id: "Sparrow" },
    });

    renderWithProviders(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId("username")).toHaveTextContent("Jack");
    });

    expect(screen.getByText(/Start Page/i)).toBeInTheDocument();

    const link = screen.getByText(/Go to Protected/i);

    await user.click(link);

    expect(screen.getByText(/Protected Content/i)).toBeInTheDocument();
  });

  it("redirects to login if user becomes unauthenticated", async () => {
    mockApiPost.mockResolvedValue({
      data: {
        tokens: {
          accessToken: "access-token",
          refreshToken: "does not matter",
        },
      },
    }); // logout will also be called but that can be resolved with this value as well
    mockApiGet.mockResolvedValue({
      data: { username: "Jack", id: "Sparrow" },
    });

    renderWithProviders(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId("username")).toHaveTextContent("Jack");
    });

    expect(screen.getByText(new RegExp("Start Page", "i"))).toBeInTheDocument();

    const link = screen.getByText(new RegExp("Go to Protected", "i"));

    await user.click(link);

    expect(
      screen.getByText(new RegExp("Protected Content", "i")),
    ).toBeInTheDocument();

    const logoutButton = screen.getByText(new RegExp("Logout", "i"));
    await user.click(logoutButton);
    await waitFor(() => {
      expect(
        screen.getByText(new RegExp("Login Page", "i")),
      ).toBeInTheDocument();
    });
  });
});
