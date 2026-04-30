import { render, screen, fireEvent } from "@testing-library/react";
import { user, clearAndType } from "../../utils";
import NumberInputWithLabel from "../../../src/components/play/NumberInputWithLabel";

const setValue = vi.fn();

const defaultProps = {
  value: 5,
  setValue,
  min: 0,
  max: 10,
  step: 1,
  label: "Sheeps",
  title: "AOT",
};

describe("NumberInputWithLabel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ["step is non positive", { step: 0 }],
    ["min is greater than max", { min: 10, max: 5 }],
  ])("does not render when %s", (_, props) => {
    const { container } = render(
      <NumberInputWithLabel {...defaultProps} {...props} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders with correct label and title", () => {
    render(<NumberInputWithLabel {...defaultProps} />);
    const label = screen.getByText("Sheeps");
    expect(label).toBeInTheDocument();
    const input = screen.getByText("AOT");
    expect(input).toBeInTheDocument();
  });

  it("renders correct initial value", () => {
    render(<NumberInputWithLabel {...defaultProps} />);
    const input = screen.getByLabelText("Sheeps");
    expect(input).toHaveValue(defaultProps.value);
  });

  it("calls setValue with correct value on blur after user input", async () => {
    render(<NumberInputWithLabel {...defaultProps} />);
    const input = screen.getByLabelText("Sheeps");

    await clearAndType(user, input, "8");
    await user.tab();

    expect(setValue).toHaveBeenCalledWith(8);
  });

  // AI assisted test for the step change logic to trigger internal change, and blur.
  it("calls setValue with correct value on step change after blur", async () => {
    render(<NumberInputWithLabel {...defaultProps} value={4} step={2} />);
    const input = screen.getByRole("spinbutton") as HTMLInputElement;

    await user.click(input);
    input.stepUp();
    fireEvent.input(input, { target: { value: input.value } });
    await user.tab();
    expect(setValue).toHaveBeenCalledWith(6);

    await user.click(input);
    input.stepDown();
    input.stepDown();
    fireEvent.input(input, { target: { value: input.value } });
    await user.tab();

    expect(setValue).toHaveBeenLastCalledWith(2);
  });

  it("enforces min and max boundaries", async () => {
    render(<NumberInputWithLabel {...defaultProps} min={3} max={7} />);
    const input = screen.getByLabelText("Sheeps");

    await clearAndType(user, input, "10");
    await user.tab();
    expect(setValue).toHaveBeenLastCalledWith(7);

    await clearAndType(user, input, "1");
    await user.tab();
    expect(setValue).toHaveBeenLastCalledWith(3);
  });

  it("resets to previous value on invalid input", async () => {
    render(<NumberInputWithLabel {...defaultProps} />);
    const input = screen.getByLabelText("Sheeps");
    await clearAndType(user, input, "abc");
    await user.tab();
    expect(setValue).toHaveBeenLastCalledWith(5);
  });

  it("rounds to nearest step on blur", async () => {
    render(
      <NumberInputWithLabel
        {...defaultProps}
        min={1}
        max={10}
        value={5}
        step={0.5}
      />,
    );
    const input = screen.getByLabelText("Sheeps");
    await clearAndType(user, input, "5.3");
    await user.tab();
    expect(setValue).toHaveBeenLastCalledWith(5.5);
  });
});
