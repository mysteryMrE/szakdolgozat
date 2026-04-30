import { useState, useMemo } from "react";
import MathLatex from "../../../MathLatex";
import ReluVisual from "./ReluVisual";
import { useWindowSize } from "../../../../contexts/WindowSizeContext";

const ReluContent = () => {
  const [x, setX] = useState(0);
  const rangeX = useMemo(() => [-10, 10] as [number, number], []);
  const rangeY = useMemo(() => [0, 10] as [number, number], []);
  const { isAboveMd } = useWindowSize();

  return (
    <div className="mt-10 p-4 rounded border border-slate-700">
      <h4>ReLU</h4>
      <p>
        A ReLU (Rectified Linear Unit) függvény a bemeneti értékeket 0 és ∞ közé
        transzformálja.
      </p>
      <div className="mt-4" />
      <div className="flex w-full items-center flex-col">
        <MathLatex
          style="text-lg"
          content={"\\( ReLU(x) = \\max(0, x) \\)"}
          inline={false}
        />
      </div>
      <div className="mt-4" />
      <ReluVisual
        rangeX={rangeX}
        rangeY={rangeY}
        x={x}
        dotRadius={isAboveMd ? 7 : 12}
      />
      <div className="mb-1 flex flex-col items-center justify-center w-full">
        <label className="block text-white mb-2 mt-2">X: {x}</label>
        <input
          type="range"
          min={rangeX[0]}
          step="0.5"
          max={rangeX[1]}
          value={x}
          onChange={(e) => setX(Number(e.target.value))}
          className=" max-w-[490px] w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />
      </div>
    </div>
  );
};
export default ReluContent;
