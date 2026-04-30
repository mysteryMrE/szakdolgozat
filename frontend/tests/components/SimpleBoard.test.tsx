import { render, screen } from "@testing-library/react";
import { user } from "../utils";
import SimpleBoard from "../../src/components/SimpleBoard";
import type { SimpleBoardState, BoardStateWithNumbers } from "../../src/types";

const onCellClick = vi.fn();
const defaultProps = {
  board: ["X", "O", null, "?", "X", "O", "X", "O", "X"] as SimpleBoardState,
  onCellClick: onCellClick,
  disabled: false,
  boardWithNumbers: undefined,
  choice: undefined,
  pulseColor: undefined,
  targetable: false,
};
const boardWithNumbers: BoardStateWithNumbers = [
  "X",
  "O",
  1,
  null,
  "O",
  "X",
  "O",
  "X",
  null,
];

describe("SimpleBoard Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders component", () => {
    render(<SimpleBoard {...defaultProps} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(9);
  });

  it("does not render when boards are null", () => {
    render(
      <SimpleBoard
        {...defaultProps}
        board={undefined}
        boardWithNumbers={undefined}
      />,
    );
    const buttons = screen.queryAllByRole("button");
    const div = screen.getByText(new RegExp("loading", "i"));
    expect(div).toBeInTheDocument();
    expect(buttons).toHaveLength(0);
  });

  it("renders simple board correctly", () => {
    render(<SimpleBoard {...defaultProps} />);
    const cells = screen.getAllByRole("button");
    expect(cells).toHaveLength(9);
    expect(cells[0]).toHaveTextContent("X");
    expect(cells[1]).toHaveTextContent("O");
    expect(cells[2]).toHaveTextContent("");
    expect(cells[3]).toHaveTextContent("?");
    expect(cells[4]).toHaveTextContent("X");
    expect(cells[5]).toHaveTextContent("O");
    expect(cells[6]).toHaveTextContent("X");
    expect(cells[7]).toHaveTextContent("O");
    expect(cells[8]).toHaveTextContent("X");
  });

  it("renders board with numbers correctly", () => {
    render(
      <SimpleBoard
        {...defaultProps}
        board={undefined}
        boardWithNumbers={boardWithNumbers}
      />,
    );
    const cells = screen.getAllByRole("button");
    expect(cells).toHaveLength(9);
    expect(cells[0]).toHaveTextContent("X");
    expect(cells[1]).toHaveTextContent("O");
    expect(cells[2]).toHaveTextContent("1");
    expect(cells[3]).toHaveTextContent("");
    expect(cells[4]).toHaveTextContent("O");
    expect(cells[5]).toHaveTextContent("X");
    expect(cells[6]).toHaveTextContent("O");
    expect(cells[7]).toHaveTextContent("X");
    expect(cells[8]).toHaveTextContent("");
  });

  it("should prioritize board over boardWithNumbers", () => {
    render(
      <SimpleBoard
        {...defaultProps}
        board={defaultProps.board}
        boardWithNumbers={boardWithNumbers}
      />,
    );
    const cells = screen.getAllByRole("button");
    expect(cells).toHaveLength(9);
    expect(cells[2]).toHaveTextContent("");
    expect(cells[3]).toHaveTextContent("?");
    expect(cells[8]).toHaveTextContent("X");
  });

  it("should be disabled when disabled prop is true", () => {
    render(<SimpleBoard {...defaultProps} disabled={true} />);
    const cells = screen.getAllByRole("button");
    for (const cell of cells) {
      expect(cell).toBeDisabled();
      expect(cell).toHaveClass("cursor-not-allowed");
    }
  });

  it("should be enabled when disabled prop is false", () => {
    render(<SimpleBoard {...defaultProps} disabled={false} />);
    const cells = screen.getAllByRole("button");
    for (const cell of cells) {
      expect(cell).toBeEnabled();
      expect(cell).toHaveClass("cursor-pointer");
    }
  });

  it("should not be targetable when targetable prop is false", () => {
    render(<SimpleBoard {...defaultProps} targetable={false} />);
    const container = screen.getByTestId("simple-board-container");
    expect(container).toHaveAttribute("inert");
  });

  it("should be targetable when targetable prop is true", () => {
    render(<SimpleBoard {...defaultProps} targetable={true} />);
    const container = screen.getByTestId("simple-board-container");
    expect(container).not.toHaveAttribute("inert");
  });

  it("should highlight choice cell", () => {
    render(
      <SimpleBoard {...defaultProps} choice={5} pulseColor="fuchsia-400" />,
    );
    const cells = screen.getAllByRole("button");
    expect(cells[4]!.firstChild).toHaveClass("animate-pulse");
  });

  it("should not highlight any cell when choice is undefined", () => {
    render(<SimpleBoard {...defaultProps} choice={undefined} />);
    const cells = screen.getAllByRole("button");
    for (const cell of cells) {
      expect(cell.firstChild).not.toHaveClass("animate-pulse");
    }
  });

  it("should use the correct default pulse color", () => {
    render(<SimpleBoard {...defaultProps} choice={3} />);
    const cells = screen.getAllByRole("button");
    expect(cells[2]!.firstChild).toHaveClass("ring-rose-700");
  });

  it("should use the correct pulse color when provided", () => {
    render(<SimpleBoard {...defaultProps} choice={2} pulseColor="cyan-400" />);
    const cells = screen.getAllByRole("button");
    expect(cells[1]!.firstChild).toHaveClass("ring-cyan-400");
  });

  it("calls onCellClick when any cell is clicked", async () => {
    render(<SimpleBoard {...defaultProps} />);
    const cells = screen.getAllByRole("button");
    await user.click(cells[0]!); // occupied cell
    expect(onCellClick).toHaveBeenCalledWith(0);
    await user.click(cells[2]!); // empty cell
    expect(onCellClick).toHaveBeenCalledWith(2);
  });

  it("does not call onCellClick when disabled", async () => {
    render(<SimpleBoard {...defaultProps} disabled={true} />);
    const cells = screen.getAllByRole("button");
    await user.click(cells[0]!);
    await user.click(cells[2]!);
    expect(onCellClick).not.toHaveBeenCalled();
  });
});
