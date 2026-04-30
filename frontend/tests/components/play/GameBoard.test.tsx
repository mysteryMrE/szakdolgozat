import { render, screen } from "@testing-library/react";
import GameBoard from "../../../src/components/play/GameBoard";
import { type BoardState, type GameState } from "../../../src/types";
import { user } from "../../utils";

const mockOnCellClick = vi.fn();

describe("GameBoard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const emptyGameState: GameState = {
    board: Array.from({ length: 3 }, () => Array(3).fill(null)) as BoardState,
    current_turn: "X",
    status: "ongoing",
    rounds: 1,
    curr_round: 1,
    x_o_draw: { X: 0, O: 0, draw: 0 },
  };

  it("renders an empty board initially", () => {
    render(
      <GameBoard
        gameState={null}
        onCellClick={mockOnCellClick}
        disabled={false}
      />,
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(9);
    buttons.forEach((button) => {
      expect(button).toHaveTextContent("");
    });
  });

  it("renders board state correctly", () => {
    const gameState: GameState = {
      ...emptyGameState,
      board: [
        ["X", "O", null],
        [null, "X", null],
        [null, null, "O"],
      ],
    };

    render(
      <GameBoard
        gameState={gameState}
        onCellClick={mockOnCellClick}
        disabled={false}
      />,
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(9);
    expect(buttons[0]!).toHaveTextContent("X");
    expect(buttons[1]!).toHaveTextContent("O");
    expect(buttons[2]!).toHaveTextContent("");
    expect(buttons[3]!).toHaveTextContent("");
    expect(buttons[4]!).toHaveTextContent("X");
    expect(buttons[5]!).toHaveTextContent("");
    expect(buttons[6]!).toHaveTextContent("");
    expect(buttons[7]!).toHaveTextContent("");
    expect(buttons[8]!).toHaveTextContent("O");
  });

  it("calls onCellClick when an empty cell is clicked", async () => {
    render(
      <GameBoard
        gameState={emptyGameState}
        onCellClick={mockOnCellClick}
        disabled={false}
      />,
    );

    const buttons = screen.getAllByRole("button");
    await user.click(buttons[0]!);
    expect(mockOnCellClick).toHaveBeenCalledWith(0);

    await user.click(buttons[4]!);
    expect(mockOnCellClick).toHaveBeenCalledWith(4);
  });

  it("does not call onCellClick when a filled cell is clicked", async () => {
    const gameState: GameState = {
      ...emptyGameState,
      board: [
        ["X", null, null],
        [null, null, null],
        [null, null, null],
      ],
    };

    render(
      <GameBoard
        gameState={gameState}
        onCellClick={mockOnCellClick}
        disabled={false}
      />,
    );

    const buttons = screen.getAllByRole("button");
    await user.click(buttons[0]!);
    expect(mockOnCellClick).not.toHaveBeenCalled();
  });

  it("does not call onCellClick when disabled is true", async () => {
    render(
      <GameBoard
        gameState={emptyGameState}
        onCellClick={mockOnCellClick}
        disabled={true}
      />,
    );

    const buttons = screen.getAllByRole("button");
    await user.click(buttons[0]!);
    expect(mockOnCellClick).not.toHaveBeenCalled();
  });

  it("highlights winning cells", () => {
    const gameState: GameState = {
      ...emptyGameState,
      board: [
        ["X", "X", "X"],
        [null, "O", "O"],
        [null, null, null],
      ],
      status: "finished",
    };

    const { container } = render(
      <GameBoard
        gameState={gameState}
        onCellClick={mockOnCellClick}
        disabled={true}
      />,
    );

    const winningGlow = container.querySelectorAll(".animate-pulse");
    expect(winningGlow).toHaveLength(3);
  });

  it("applies correct player color classes", () => {
    const gameState: GameState = {
      ...emptyGameState,
      board: [
        ["X", "O", null],
        [null, null, null],
        [null, null, null],
      ],
    };
    render(
      <GameBoard
        gameState={gameState}
        onCellClick={mockOnCellClick}
        disabled={false}
      />,
    );
    const buttons = screen.getAllByRole("button");
    const xButton = buttons[0]!;
    const oButton = buttons[1]!;
    const emptyButton = buttons[2]!;

    const xColor = "text-cyan-400";
    const oColor = "text-fuchsia-400";

    const xSpan = xButton.querySelector("span");
    expect(xSpan).toHaveClass(xColor);
    const oSpan = oButton.querySelector("span");
    expect(oSpan).toHaveClass(oColor);
    const emptySpan = emptyButton.querySelector("span");
    expect(emptySpan).not.toHaveClass(xColor);
    expect(emptySpan).not.toHaveClass(oColor);
    expect(emptySpan!.className).toBe("");
  });
});
