import { useState } from "react";
import MiniBoard from "./MiniBoard";
import type { TreeNode } from "../../../types";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useWindowSize } from "../../../contexts/WindowSizeContext";

interface BeanStalkProps {
  node: TreeNode;
}

const BeanStalk = ({ node }: BeanStalkProps) => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const { isAboveSm } = useWindowSize();
  const hasChildren = node.children.length > 0;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setExpanded((prev) => !prev);
    }
  };

  return (
    <>
      <div
        role={hasChildren ? "button" : undefined}
        tabIndex={hasChildren ? 0 : undefined}
        aria-expanded={hasChildren ? expanded : undefined}
        onKeyDown={hasChildren ? handleKeyDown : undefined}
        onClick={hasChildren ? () => setExpanded((prev) => !prev) : undefined}
        className={`select-none ${
          hasChildren ? "cursor-pointer" : ""
        } mt-5 h-auto bg-slate-800 border border-slate-700 rounded-lg p-1 md:p-5 flex flex-row gap-1 sm:gap-2 sm:gap-5 normal:gap-10 text-sm sm:text-base`}
      >
        {hasChildren && (
          <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-sm bg-gray-900 self-center">
            {expanded ? (
              <ChevronDown size={isAboveSm ? 24 : 18} />
            ) : (
              <ChevronRight size={isAboveSm ? 24 : 18} />
            )}
          </div>
        )}

        <MiniBoard key={node.id} board={node.board} />
        <div className="flex flex-col justify-between ml-1 sm:ml-0">
          <span className="text-slate-300">
            {node.moveIndex !== undefined
              ? `Lépés: ${node.moveIndex + 1}`
              : "Kezdő állás"}
          </span>

          <span className="text-slate-300">
            Játékos:{" "}
            <span
              className={`font-semibold ${
                node.player === "X" ? "text-cyan-400" : "text-fuchsia-400"
              }`}
            >
              {node.player} {node.player === "X" ? "(Max)" : "(Min)"}
            </span>
          </span>

          {node.score !== undefined && (
            <span className="text-slate-300 text-left">
              Pontszám:{" "}
              {node.score > 0 ? (
                <>
                  1 (<span className="text-cyan-400">X</span> nyer)
                </>
              ) : node.score === 0 ? (
                "0 (Döntetlen)"
              ) : (
                <>
                  -1 (<span className="text-fuchsia-400">O</span> nyer)
                </>
              )}
            </span>
          )}
        </div>
      </div>
      {expanded && node.children.length > 0 && (
        <div className="ml-1 md:ml-4 normal:ml-8 space-y-2 border-l-2 border-slate-700 pl-2 md:pl-4 mt-4">
          {node.children.map((child) => (
            <BeanStalk key={child.id} node={child} />
          ))}
        </div>
      )}
    </>
  );
};

export default BeanStalk;
