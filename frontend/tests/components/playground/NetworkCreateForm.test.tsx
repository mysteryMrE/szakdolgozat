import { render, screen } from "@testing-library/react";
import NetworkCreateForm from "../../../src/components/playground/NetworkCreateForm";
import { user, clearAndType } from "../../utils";

const mockOnCreateNetwork = vi.fn();

describe("NetworkCreateForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders form correctly", () => {
    render(<NetworkCreateForm onCreateNetwork={mockOnCreateNetwork} />);

    expect(screen.getByLabelText("Hálózat neve")).toBeInTheDocument();
    expect(screen.getByLabelText("Rétegek")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Neuronháló létrehozása" }),
    ).toBeInTheDocument();
  });

  it("updates name based on user input", async () => {
    render(<NetworkCreateForm onCreateNetwork={mockOnCreateNetwork} />);

    const nameInput = screen.getByLabelText("Hálózat neve");
    await clearAndType(user, nameInput, "Eren");

    expect(nameInput).toHaveValue("Eren");
  });

  it("updates layers based on user input", async () => {
    render(<NetworkCreateForm onCreateNetwork={mockOnCreateNetwork} />);

    const layersInput = screen.getByLabelText("Rétegek");
    await clearAndType(user, layersInput, "18, 10, 9");

    expect(layersInput).toHaveValue("18, 10, 9");
  });

  it.each([
    ["18,9,afasf", "18,9"],
    ["  18  ,  9  ", "18,9"],
    ["1,9,9.5", "1,9,9"],
    ["18,9,abc", "18,9"],
    ["18,,9", "18,9"],
    ["ab,c", ""],
    [" ", ""],
    ["a,1,b,c,2,   ", "1,2"],
  ])("normalizes layers on blur", async (input, expected) => {
    render(<NetworkCreateForm onCreateNetwork={mockOnCreateNetwork} />);

    const layersInput = screen.getByLabelText("Rétegek");
    await clearAndType(user, layersInput, input);
    await user.tab();

    expect(layersInput).toHaveValue(expected);
  });

  it("calls onCreateNetwork on submit", async () => {
    render(<NetworkCreateForm onCreateNetwork={mockOnCreateNetwork} />);

    const nameInput = screen.getByLabelText("Hálózat neve");
    const layersInput = screen.getByLabelText("Rétegek");

    await clearAndType(user, nameInput, "Eren");
    await clearAndType(user, layersInput, "18, 9");

    const submitButton = screen.getByRole("button", {
      name: "Neuronháló létrehozása",
    });
    await user.click(submitButton);

    expect(mockOnCreateNetwork).toHaveBeenCalledWith("Eren", [18, 9]);
  });
});
