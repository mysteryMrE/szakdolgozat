import { render, screen } from "@testing-library/react";
import { user } from "../utils";
import NavBar from "../../src/components/NavBar";
import { useAuth } from "../../src/contexts/AuthContext";

vi.mock("../../src/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = vi.mocked(useAuth);

vi.mock("react-router-dom", () => ({
  useLocation: vi.fn(),
  NavLink: ({ children, to }: any) => (
    <a href={to} data-testid="navlink">
      {children}
    </a>
  ),
}));

describe("NavBar Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: null,
      logout: vi.fn(),
    } as any);
  });

  it("renders correctly when user is not logged in", () => {
    render(<NavBar />);

    expect(screen.getByText("TicTacToe")).toBeInTheDocument();

    expect(screen.getByText("Kezdőlap")).toBeInTheDocument();
    expect(screen.getByText("Tanulás")).toBeInTheDocument();

    expect(screen.queryByText("Barkácsolás")).not.toBeInTheDocument();

    expect(screen.getByText("Bejelentkezés")).toBeInTheDocument();
    expect(screen.queryByText("Kijelentkezés")).not.toBeInTheDocument();
  });

  it("renders correctly when user is logged in", () => {
    mockUseAuth.mockReturnValue({
      user: { username: "Jack", id: "Sparrow" },
      logout: vi.fn(),
    } as any);

    render(<NavBar />);

    expect(screen.getByText("Barkácsolás")).toBeInTheDocument();

    expect(screen.getByText("Jack")).toBeInTheDocument();

    expect(screen.getByText("Kijelentkezés")).toBeInTheDocument();
    expect(screen.queryByText("Bejelentkezés")).not.toBeInTheDocument();
  });

  it("calls logout function when logout button is clicked", async () => {
    const mockLogout = vi.fn();
    mockUseAuth.mockReturnValue({
      user: { username: "Jack", id: "Sparrow" },
      logout: mockLogout,
    } as any);

    render(<NavBar />);

    const logoutButton = screen.getByText("Kijelentkezés");

    await user.click(logoutButton);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("navlinks have the correct href attributes when user is not logged in", () => {
    render(<NavBar />);

    expect(screen.getByText("Kezdőlap")).toHaveAttribute("href", "/");

    expect(screen.getByText("Tanulás")).toHaveAttribute("href", "/learn");

    expect(screen.getByText("Bejelentkezés")).toHaveAttribute("href", "/login");
  });

  it("navlinks have the correct href attributes when user is logged in", () => {
    mockUseAuth.mockReturnValue({
      user: { username: "Jack", id: "Sparrow" },
      logout: vi.fn(),
    } as any);

    render(<NavBar />);

    expect(screen.getByText("Kezdőlap")).toHaveAttribute("href", "/");

    expect(screen.getByText("Tanulás")).toHaveAttribute("href", "/learn");

    expect(screen.getByText("Barkácsolás")).toHaveAttribute(
      "href",
      "/playground",
    );
  });
});
