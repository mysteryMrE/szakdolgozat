import { render, screen } from "@testing-library/react";
import { useState } from "react";
import PlayerSelector from "../../../src/components/play/PlayerSelector";
import { user } from "../../utils";

const mockHandleChange = vi.fn();
const names = ["Te", "Random", "AI"];
const values = ["human", "random", "ai"];

describe("PlayerSelector", () => {
  beforeEach(() => {
    mockHandleChange.mockClear();
  });

  it("renders nothing if names and values lengths do not match", () => {
    const { container } = render(
      <PlayerSelector
        names={["Te", "Random"]}
        values={["human", "random", "ai"]}
        disabledOptions={[]}
        handleChange={mockHandleChange}
        selectedValue="random"
        playerIndex={1}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders correctly with given props", () => {
    render(
      <PlayerSelector
        names={names}
        values={values}
        disabledOptions={[]}
        handleChange={mockHandleChange}
        selectedValue="random"
        playerIndex={1}
      />,
    );

    expect(screen.getByLabelText("X játékos")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveValue("random");
    expect(screen.getAllByRole("option")).toHaveLength(values.length);
  });

  it("displays correct label for player 2", () => {
    render(
      <PlayerSelector
        names={names}
        values={values}
        disabledOptions={[]}
        handleChange={mockHandleChange}
        selectedValue="random"
        playerIndex={2}
      />,
    );

    expect(screen.getByLabelText("O játékos")).toBeInTheDocument();
  });

  it("disables human option when humanDisabled is true", () => {
    render(
      <PlayerSelector
        names={names}
        values={values}
        disabledOptions={["human"]}
        handleChange={mockHandleChange}
        selectedValue="random"
        playerIndex={1}
      />,
    );

    const humanOption = screen.getByRole("option", { name: "Te" });
    expect(humanOption).toBeDisabled();

    const randomOption = screen.getByRole("option", { name: "Random" });
    expect(randomOption).not.toBeDisabled();
  });

  it("calls handleChange when selection changes", async () => {
    render(
      <PlayerSelector
        names={names}
        values={values}
        disabledOptions={[]}
        handleChange={mockHandleChange}
        selectedValue="human"
        playerIndex={1}
      />,
    );
    const select = screen.getByRole("combobox");
    await user.selectOptions(select, "ai");

    expect(mockHandleChange).toHaveBeenCalledTimes(1);
  });

  it("updates selected value after handleChange", async () => {
    const BurgerKing = () => {
      const [value, setValue] = useState("human");

      return (
        <PlayerSelector
          names={names}
          values={values}
          selectedValue={value}
          playerIndex={1}
          handleChange={(e) => setValue(e.target.value)}
        />
      );
    };
    render(<BurgerKing />);
    const select = screen.getByRole("combobox");
    expect(select).toHaveValue("human");
    await user.selectOptions(select, "ai");
    expect(select).toHaveValue("ai");
  });
});
