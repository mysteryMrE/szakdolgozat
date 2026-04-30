import { render, screen } from "@testing-library/react";
import LoginPage from "../../src/pages/LoginPage";
import { MemoryRouter } from "react-router-dom";
import { useAuth } from "../../src/contexts/AuthContext";
import { user } from "../utils";

vi.mock("../../src/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));
const mockUseAuth = vi.mocked(useAuth);

// AI assisted mock

const mockNavigate = vi.fn();
vi.mock(import("react-router-dom"), async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockLogin = vi.fn().mockResolvedValue(true);

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login form correctly", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      login: mockLogin,
    } as any);

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: new RegExp("bejelentkezés", "i") }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(new RegExp("név", "i"))).toBeInTheDocument();
    expect(
      screen.getByLabelText(new RegExp("jelszó", "i")),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: new RegExp("bejelentkezés", "i") }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp("nincs még fiókod", "i")),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: new RegExp("regisztrálj itt", "i") }),
    ).toBeInTheDocument();
  });

  it("redirects to home if user is already logged in", () => {
    mockUseAuth.mockReturnValue({
      user: { username: "Jack", id: "1" },
      login: mockLogin,
    } as any);

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("updates input fields", async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      login: mockLogin,
    } as any);

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    const usernameInput = screen.getByLabelText(
      new RegExp("név", "i"),
    ) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(
      new RegExp("jelszó", "i"),
    ) as HTMLInputElement;

    await user.type(usernameInput, "testuser");
    await user.type(passwordInput, "password123");

    expect(usernameInput.value).toBe("testuser");
    expect(passwordInput.value).toBe("password123");
  });

  it("calls login function with correct credentials on submit", async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      login: mockLogin,
    } as any);

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    const usernameInput = screen.getByLabelText(new RegExp("név", "i"));
    const passwordInput = screen.getByLabelText(new RegExp("jelszó", "i"));
    const submitButton = screen.getByRole("button", {
      name: new RegExp("bejelentkezés", "i"),
    });

    await user.type(usernameInput, "testuser");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);
    console.log("clicked submit");

    expect(mockLogin).toHaveBeenCalledWith("testuser", "password123");
  });

  it("calls navigate after login updates user", async () => {
    const { rerender } = render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    mockUseAuth.mockReturnValue({
      user: { username: "Jack Sparrow", id: "1" },
      login: mockLogin,
    } as any);

    // rerender to trigger useEffect after login updated mockUser
    rerender(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it.each(["noname", "nopassword", "nothing"])(
    "does not call login if fields are empty (%s)",
    async (fields) => {
      mockUseAuth.mockReturnValue({
        user: null,
        login: mockLogin,
      } as any);
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>,
      );
      if (fields !== "noname" && fields !== "nothing") {
        const usernameInput = screen.getByLabelText(/név/i);
        await user.type(usernameInput, "testuser");
      }
      if (fields !== "nopassword" && fields !== "nothing") {
        const passwordInput = screen.getByLabelText(/jelszó/i);
        await user.type(passwordInput, "password123");
      }
      const submitButton = screen.getByRole("button", {
        name: /bejelentkezés/i,
      });

      await user.click(submitButton);
      expect(mockLogin).not.toHaveBeenCalled();
    },
  );
});
