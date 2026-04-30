import { type GameState, type CellValue, type BoardState } from "../../types";

interface BoardProps {
  gameState: GameState | null;
  onCellClick: (pos: number) => void;
  disabled?: boolean;
}

const renderCell = (
  value: CellValue,
  row: number,
  col: number,
  glow: boolean,
  glowColor: string,
  disabled: boolean,
  glowSize: string,
  onCellClick: (pos: number) => void,
) => {
  const playerColorClass =
    value === "X" ? "text-cyan-400" : value === "O" ? "text-fuchsia-400" : "";

  const isClickable = value === null && !disabled;
  const isDisabledClass = isClickable
    ? "cursor-pointer"
    : "cursor-not-allowed opacity-90";
  const buttonStyleClass =
    value === null
      ? `border-slate-700 bg-slate-900 ${
          isDisabledClass ? "" : "hover:bg-slate-800 active:bg-slate-700"
        }`
      : "border-slate-700 bg-slate-800";

  return (
    <button
      key={`${row}-${col}`}
      aria-label={`Sor ${row + 1} Oszlop ${col + 1}: ${value ?? "üres"} `}
      onClick={() => isClickable && onCellClick(row * 3 + col)}
      aria-disabled={!isClickable}
      className={`flex relative h-24 w-24 items-center justify-center rounded-xl border text-4xl font-bold transition-colors
          ${buttonStyleClass} ${isDisabledClass}
        `}
    >
      <div
        className={`absolute inset-0 rounded-xl pointer-events-none ${
          glow ? `animate-pulse ring ${glowSize} ${glowColor}` : ""
        }`}
      />
      <span className={playerColorClass} aria-hidden="true">
        {value}
      </span>
    </button>
  );
};

const GameBoard = ({
  gameState,
  onCellClick,
  disabled = false,
}: BoardProps) => {
  const defaultBoard: BoardState = [
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ];
  const currentBoard: BoardState = gameState?.board ?? defaultBoard;

  const getWinningPosition = (): [[number, number][], string] => {
    const lines: [number, number][][] = [
      // rows
      [
        [0, 0],
        [0, 1],
        [0, 2],
      ],
      [
        [1, 0],
        [1, 1],
        [1, 2],
      ],
      [
        [2, 0],
        [2, 1],
        [2, 2],
      ],
      // columns
      [
        [0, 0],
        [1, 0],
        [2, 0],
      ],
      [
        [0, 1],
        [1, 1],
        [2, 1],
      ],
      [
        [0, 2],
        [1, 2],
        [2, 2],
      ],
      // diagonals
      [
        [0, 0],
        [1, 1],
        [2, 2],
      ],
      [
        [0, 2],
        [1, 1],
        [2, 0],
      ],
    ];
    if (!currentBoard) return [[], ""];
    for (const line of lines) {
      const [a, b, c] = line;
      if (!a || !b || !c) continue;
      const valA = currentBoard[a[0]]?.[a[1]];
      const valB = currentBoard[b[0]]?.[b[1]];
      const valC = currentBoard[c[0]]?.[c[1]];
      if (
        valA !== null &&
        valA !== undefined &&
        valA === valB &&
        valA === valC
      ) {
        return [line, valA];
      }
    }
    return [[], ""];
  };

  const currentTurn: CellValue = gameState?.current_turn ?? null;
  const status: string = gameState?.status ?? "none";
  const winningPosition: [[number, number][], string] = getWinningPosition();
  const winningPos = (row: number, col: number): boolean => {
    if (!winningPosition || winningPosition[1].length === 0) return false;
    return winningPosition[0].some((pos) => pos[0] === row && pos[1] === col);
  };
  const winner = winningPosition[1];
  const glowColor =
    winner === "X"
      ? "ring-cyan-400/80"
      : winner === "O"
        ? "ring-fuchsia-400/80"
        : currentTurn === "X"
          ? "ring-cyan-400/30"
          : "ring-fuchsia-400/30";
  const glowSize = winner ? "ring-3" : "ring-2";
  return (
    <div className="flex justify-center mt-6">
      <div className="grid grid-cols-3 gap-1" aria-label="Game board">
        {currentBoard.flat().map((value, index) => {
          const rowIndex = Math.floor(index / 3);
          const colIndex = index % 3;
          return renderCell(
            value,
            rowIndex,
            colIndex,
            (status === "ongoing" && value === null) ||
              winningPos(rowIndex, colIndex),
            glowColor,
            disabled,
            glowSize,
            onCellClick,
          );
        })}
      </div>
    </div>
  );
};

export default GameBoard;
