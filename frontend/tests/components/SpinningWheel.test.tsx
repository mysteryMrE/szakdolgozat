import { render, screen } from "@testing-library/react";
import { user } from "../utils";
import SpinningWheel, { duration } from "../../src/components/SpinningWheel";

/**
 * AI assisted mocking of performance.now and requestAnimationFrame.
 */

const isSpinning = vi.fn();
const setChoice = vi.fn();
const defaultProps = {
  values: [10, 2, 7, 2],
  probabilities: [100, 80, 3, 7],
  isSpinning: isSpinning,
  setChoice: setChoice,
};

describe("SpinningWheel Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders correctly with default props", () => {
    render(<SpinningWheel {...defaultProps} />);

    const canvas = screen.getByRole("button");
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveAttribute(
      "aria-label",
      "Spinning Wheel, no selection",
    );
    expect(canvas).not.toHaveAttribute("aria-disabled");
  });

  it("does not render when values and probabilities length mismatch", () => {
    const { container } = render(
      <SpinningWheel
        values={[10, 2, 7]}
        probabilities={[10, 80, 3, 7]}
        isSpinning={isSpinning}
        setChoice={setChoice}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders when there are no values", () => {
    const { container } = render(
      <SpinningWheel
        values={[]}
        probabilities={[]}
        isSpinning={isSpinning}
        setChoice={setChoice}
      />,
    );
    expect(container).toBeInTheDocument();
  });

  it("calls setChoice on spin", async () => {
    vi.spyOn(performance, "now").mockReturnValue(0);
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      cb(duration);
      return 1;
    });
    render(<SpinningWheel {...defaultProps} probabilities={[1, 0, 0, 0]} />);
    const canvas = screen.getByRole("button");

    await user.click(canvas);
    expect(setChoice).toHaveBeenCalledWith(null);
    expect(setChoice).toHaveBeenLastCalledWith(10);
  });

  it("does not spin for user when disabled", async () => {
    render(<SpinningWheel {...defaultProps} disabled={true} />);

    const canvas = screen.getByRole("button");
    expect(canvas).toHaveAttribute("aria-disabled", "true");
    expect(canvas).toHaveAttribute("tabIndex", "-1");

    await user.click(canvas);

    expect(isSpinning).not.toHaveBeenCalled();
    expect(setChoice).not.toHaveBeenCalled();
  });

  it("does not spin for user when forbidden", async () => {
    render(<SpinningWheel {...defaultProps} forbidden />);

    const canvas = screen.getByRole("button");
    expect(canvas).toHaveAttribute("aria-disabled", "true");
    expect(canvas).toHaveAttribute("tabIndex", "-1");

    await user.click(canvas);

    expect(isSpinning).not.toHaveBeenCalled();
    expect(setChoice).not.toHaveBeenCalled();
  });

  it("spins to the forced target", async () => {
    vi.spyOn(performance, "now").mockReturnValue(0);
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      cb(duration);
      return 1;
    });

    render(
      <SpinningWheel
        {...defaultProps}
        probabilities={[0, 0, 1, 0]}
        forcedTarget={7}
      />,
    );

    expect(isSpinning).toHaveBeenCalledWith(true);
    expect(setChoice).toHaveBeenCalledWith(null);
    expect(setChoice).toHaveBeenLastCalledWith(7);
    expect(isSpinning).toHaveBeenLastCalledWith(false);
  });

  it("spins to the forced target when forbidden", async () => {
    vi.spyOn(performance, "now").mockReturnValue(0);
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      cb(duration);
      return 1;
    });

    render(
      <SpinningWheel
        {...defaultProps}
        forbidden={true}
        probabilities={[0, 0, 1, 0]}
        forcedTarget={7}
      />,
    );

    expect(isSpinning).toHaveBeenCalledWith(true);
    expect(setChoice).toHaveBeenCalledWith(null);
    expect(setChoice).toHaveBeenLastCalledWith(7);
    expect(isSpinning).toHaveBeenLastCalledWith(false);
  });

  it("does not spins to the forced target when disabled", async () => {
    vi.spyOn(performance, "now").mockReturnValue(0);
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      cb(duration);
      return 1;
    });

    render(
      <SpinningWheel
        {...defaultProps}
        disabled={true}
        probabilities={[0, 0, 1, 0]}
        forcedTarget={7}
      />,
    );

    expect(isSpinning).not.toHaveBeenCalled();
    expect(setChoice).not.toHaveBeenCalled();
  });
});
