import { render, screen } from "@testing-library/react";
import type { GameState, BoardState } from "../../../src/types";
import GameStats from "../../../src/components/play/GameStats";

const defaultProps: GameState = {
  board: Array.from({ length: 3 }, () => Array(3).fill(null)) as BoardState,
  current_turn: "X",
  status: "in_progress",
  curr_round: 2,
  rounds: 5,
  x_o_draw: { X: 4, O: 3, draw: 40 },
};

describe("GameStats", () => {
  it("does not render if prop is null", () => {
    const { container } = render(<GameStats gameState={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders if prop is provided", () => {
    const { container } = render(<GameStats gameState={defaultProps} />);
    expect(container).not.toBeEmptyDOMElement();
  });

  it("displays correct titles", () => {
    render(<GameStats gameState={defaultProps} />);
    expect(screen.getByText("X Győzelmek")).toBeInTheDocument();
    expect(screen.getByText("O Győzelmek")).toBeInTheDocument();
    expect(screen.getByText("Döntetlenek")).toBeInTheDocument();
  });

  it("displays correct round information", () => {
    render(<GameStats gameState={defaultProps} />);
    expect(screen.getByText("2 / 5")).toBeInTheDocument();
  });

  it("displays correct scores", () => {
    render(<GameStats gameState={defaultProps} />);
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("40")).toBeInTheDocument();
  });
});
