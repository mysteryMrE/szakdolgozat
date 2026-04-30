import { render, screen } from "@testing-library/react";
import { user } from "../utils";
import Password from "../../src/components/Password";

const mockSetPassword = vi.fn();

const defaultProps = {
  password: "",
  setPassword: mockSetPassword,
};

describe("Password Component", () => {
  it("renders correctly with default props", () => {
    render(<Password {...defaultProps} />);

    expect(screen.getByLabelText("Jelszó")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Add meg a jelszavad"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Jelszó")).toHaveAttribute("type", "password");
  });

  it("renders with custom label and placeholder", () => {
    render(
      <Password
        {...defaultProps}
        label="Custom Label"
        placeholder="Custom Placeholder"
      />,
    );

    expect(screen.getByLabelText("Custom Label")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Custom Placeholder"),
    ).toBeInTheDocument();
  });

  it("calls setPassword when input changes", async () => {
    const mockSetPassword = vi.fn();

    render(<Password password="" setPassword={mockSetPassword} />);

    const input = screen.getByPlaceholderText("Add meg a jelszavad");
    await user.type(input, "newpassword");

    expect(mockSetPassword).toHaveBeenCalled();
  });

  it("shows the right value", async () => {
    render(<Password {...defaultProps} password="mypassword" />);

    const input = screen.getByPlaceholderText("Add meg a jelszavad");
    expect(input).toHaveValue("mypassword");
  });

  it("toggles the input type between password and text", async () => {
    render(<Password {...defaultProps} />);

    const input = screen.getByLabelText("Jelszó");
    const toggleButton = screen.getByTestId("password-toggle");

    expect(input).toHaveAttribute("type", "password");

    await user.click(toggleButton);
    expect(input).toHaveAttribute("type", "text");

    await user.click(toggleButton);
    expect(input).toHaveAttribute("type", "password");
  });
});
