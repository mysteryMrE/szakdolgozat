import type {
  BoardStateWithNumbers,
  CellWithNumbers,
  SimpleBoardState,
  CellWithUnknown,
} from "../types";

interface SimpleBoardProps {
  board?: SimpleBoardState;
  onCellClick: (index: number) => void;
  disabled: boolean;
  choice?: number;
  boardWithNumbers?: BoardStateWithNumbers;
  pulseColor?: "cyan-400" | "fuchsia-400";
  targetable?: boolean;
}

const SimpleBoard = ({
  board,
  onCellClick,
  disabled,
  boardWithNumbers,
  choice,
  pulseColor,
  targetable,
}: SimpleBoardProps) => {
  const renderCell = (
    value: CellWithUnknown | CellWithNumbers,
    row: number,
    col: number,
  ) => {
    return (
      <button
        aria-label={`Sor ${row + 1} Oszlop ${col + 1}: ${
          value === "?" ? "foglalt" : value === null ? "üres" : value
        } `}
        key={`${row}-${col}`}
        onClick={() => onCellClick(row * 3 + col)}
        className={`flex relative h-16 w-16 normal:h-24 normal:w-24 items-center justify-center rounded-xl border text-4xl font-bold transition-colors ${
          value === null
            ? `border-slate-700 bg-slate-900 ${
                disabled ? "" : "hover:bg-slate-800 active:bg-slate-700"
              }`
            : `border-slate-700 bg-slate-800`
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} `}
        disabled={disabled}
      >
        {row * 3 + col === (choice ?? -1) - 1 && (
          <span
            aria-hidden="true"
            className={`absolute inset-0 ring-3 ${
              pulseColor === "cyan-400"
                ? "ring-cyan-400 "
                : pulseColor === "fuchsia-400"
                  ? "ring-fuchsia-400"
                  : "ring-rose-700"
            } animate-pulse rounded-xl`}
          ></span>
        )}
        <span
          className={`text-5xl font-bold ${
            value === "?"
              ? "bg-gradient-to-b from-fuchsia-400 to-cyan-400 bg-clip-text text-transparent"
              : ""
          } ${
            value === "O"
              ? "text-fuchsia-400"
              : value === "X"
                ? "text-cyan-400"
                : ""
          }
           ${
             value !== "O" && value !== "X" && value !== "?" ? "text-white" : ""
           }
          `}
        >
          {value ? value : ""}
        </span>
      </button>
    );
  };
  if (!board && !boardWithNumbers) {
    return <div>Loading...</div>;
  }
  const boardToUse = board ? board : boardWithNumbers!;
  return (
    <div
      inert={targetable === false ? true : undefined}
      className="flex justify-center bg-slate-900 p-3 lg:p-8 rounded-2xl shadow-1xl"
      data-testid="simple-board-container"
      aria-label="Simple game board"
    >
      <div className="grid grid-cols-3 gap-1">
        {boardToUse.map((cell, index) =>
          renderCell(cell, Math.floor(index / 3), index % 3),
        )}
      </div>
    </div>
  );
};

export default SimpleBoard;
