import { render, screen } from "@testing-library/react";
import RegisterPage from "../../src/pages/RegisterPage";
import { useAuth } from "../../src/contexts/AuthContext";
import { useError } from "../../src/contexts/ErrorContext";
import { user } from "../utils";

vi.mock("../../src/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../src/contexts/ErrorContext", () => ({
  useError: vi.fn(),
}));

const mockUseAuth = vi.mocked(useAuth);
const mockUseError = vi.mocked(useError);

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

const mockLogin = vi.fn().mockResolvedValue(true);
const mockRegister = vi.fn().mockResolvedValue(true);
const mockAddError = vi.fn();

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseError.mockReturnValue({
      addError: mockAddError,
    });

    mockUseAuth.mockReturnValue({
      user: null,
      login: mockLogin,
      register: mockRegister,
    } as any);
  });

  it("renders register page correctly", () => {
    render(<RegisterPage />);

    expect(
      screen.getByRole("heading", { name: new RegExp("regisztráció", "i") }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(new RegExp("név", "i"))).toBeInTheDocument();
    expect(screen.getByLabelText("Jelszó")).toBeInTheDocument();
    expect(
      screen.getByLabelText(new RegExp("jelszó megerősítése", "i")),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: new RegExp("regisztráció", "i") }),
    ).toBeInTheDocument();
  });

  it("redirects to home if user is already logged in", () => {
    mockUseAuth.mockReturnValue({
      user: { username: "Jack", id: "1" },
      login: mockLogin,
      register: mockRegister,
    } as any);

    render(<RegisterPage />);

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("updates input fields", async () => {
    render(<RegisterPage />);

    const usernameInput = screen.getByLabelText(
      new RegExp("név", "i"),
    ) as HTMLInputElement;
    const passwordInputs = screen.getAllByLabelText(
      new RegExp("jelszó", "i"),
    ) as HTMLInputElement[];
    expect(passwordInputs).toHaveLength(2);

    await user.type(usernameInput, "testuser");
    await user.type(passwordInputs[0]!, "password123");
    await user.type(passwordInputs[1]!, "password456");

    expect(usernameInput.value).toBe("testuser");
    expect(passwordInputs[0]!.value).toBe("password123");
    expect(passwordInputs[1]!.value).toBe("password456");
  });

  it("calls register function with correct credentials on submit", async () => {
    render(<RegisterPage />);

    const usernameInput = screen.getByLabelText(
      new RegExp("név", "i"),
    ) as HTMLInputElement;
    const passwordInputs = screen.getAllByLabelText(
      new RegExp("jelszó", "i"),
    ) as HTMLInputElement[];
    expect(passwordInputs).toHaveLength(2);

    await user.type(usernameInput, "testuser");
    await user.type(passwordInputs[0]!, "password123");
    await user.type(passwordInputs[1]!, "password123");

    const submitButton = screen.getByRole("button", {
      name: new RegExp("regisztráció", "i"),
    });
    await user.click(submitButton);

    expect(mockRegister).toHaveBeenCalledWith("testuser", "password123");
    expect(mockAddError).not.toHaveBeenCalled();
  });

  it("calls addError if passwords do not match on submit", async () => {
    render(<RegisterPage />);

    const usernameInput = screen.getByLabelText(/név/i) as HTMLInputElement;
    const passwordInputs = screen.getAllByLabelText(
      /jelszó/i,
    ) as HTMLInputElement[];
    expect(passwordInputs).toHaveLength(2);

    await user.type(usernameInput, "testuser");
    await user.type(passwordInputs[0]!, "password123");
    await user.type(passwordInputs[1]!, "password456");

    const submitButton = screen.getByRole("button", {
      name: new RegExp("regisztráció", "i"),
    });
    await user.click(submitButton);

    expect(mockAddError).toHaveBeenCalledWith(
      expect.stringMatching(new RegExp("A jelszavak nem egyeznek", "i")),
    );
    expect(mockRegister).not.toHaveBeenCalled();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("calls login after successful registration", async () => {
    render(<RegisterPage />);
    const usernameInput = screen.getByLabelText(
      new RegExp("név", "i"),
    ) as HTMLInputElement;
    const passwordInputs = screen.getAllByLabelText(
      new RegExp("jelszó", "i"),
    ) as HTMLInputElement[];
    expect(passwordInputs).toHaveLength(2);
    await user.type(usernameInput, "testuser");
    await user.type(passwordInputs[0]!, "password123");
    await user.type(passwordInputs[1]!, "password123");
    const submitButton = screen.getByRole("button", {
      name: new RegExp("regisztráció", "i"),
    });
    await user.click(submitButton);
    expect(mockRegister).toHaveBeenCalledWith("testuser", "password123");
    expect(mockLogin).toHaveBeenCalledWith("testuser", "password123");
  });

  it("does not call login if registration fails", async () => {
    const mockRegister = vi.fn().mockResolvedValue(false);
    mockUseAuth.mockReturnValue({
      user: null,
      login: mockLogin,
      register: mockRegister,
    } as any);
    render(<RegisterPage />);
    const usernameInput = screen.getByLabelText(
      new RegExp("név", "i"),
    ) as HTMLInputElement;
    const passwordInputs = screen.getAllByLabelText(
      new RegExp("jelszó", "i"),
    ) as HTMLInputElement[];
    expect(passwordInputs).toHaveLength(2);
    await user.type(usernameInput, "testuser");
    await user.type(passwordInputs[0]!, "password123");
    await user.type(passwordInputs[1]!, "password123");
    const submitButton = screen.getByRole("button", {
      name: new RegExp("regisztráció", "i"),
    });
    await user.click(submitButton);
    expect(mockRegister).toHaveBeenCalledWith("testuser", "password123");
    expect(mockLogin).not.toHaveBeenCalled();
    expect(mockAddError).not.toHaveBeenCalled();
  });

  it("calls navigate after user changes", async () => {
    const { rerender } = render(<RegisterPage />);

    mockUseAuth.mockReturnValue({
      user: { username: "Jack", id: "Sparrow" },
      login: mockLogin,
      register: mockRegister,
    } as any);

    rerender(<RegisterPage />);

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});
