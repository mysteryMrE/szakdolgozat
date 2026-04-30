import type { SimpleBoardState } from "../../../types";

interface MiniBoardProps {
  board: SimpleBoardState;
}

const MiniBoard = ({ board }: MiniBoardProps) => {
  return (
    <div className="flex justify-center items-center rounded-lg shadow-xs shrink-0">
      <div className="grid grid-cols-3 gap-0.5 md:gap-1">
        {board.map((cell, index) => (
          <span
            key={index}
            className={`bg-slate-900 h-5 w-5 sm:h-10 sm:w-10 rounded-sm flex items-center justify-center text-xs sm:text-xl font-semibold
              ${
                cell === "X"
                  ? "text-cyan-400"
                  : cell === "O"
                    ? "text-fuchsia-400"
                    : "text-slate-700"
              }
            `}
          >
            {cell ?? ""}
          </span>
        ))}
      </div>
    </div>
  );
};

export default MiniBoard;
