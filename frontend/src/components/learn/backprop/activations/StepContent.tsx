import { useState, useMemo } from "react";
import MathLatex from "../../../MathLatex";
import StepVisual from "./StepVisual";
import { useWindowSize } from "../../../../contexts/WindowSizeContext";

const StepContent = () => {
  const [x, setX] = useState(0);
  const rangeX = useMemo(() => [-10, 10] as [number, number], []);
  const { isAboveMd } = useWindowSize();
  return (
    <div className="mt-10 p-4 rounded border border-slate-700">
      <h4>Heaviside-lépcsőfüggvény</h4>
      <p>
        A Heaviside-lépcsőfüggvény vagy egységugrásos függvény egy egyszerű
        küszöbérték függvény, amely a bemeneti értékeket két kategóriába
        sorolja: 0 vagy 1. Ha a bemeneti érték egy adott küszöbérték (általában
        0) alatt van, a kimenet 0, ha pedig a küszöbérték felett van, a kimenet
        1.
      </p>
      <div className="mt-4" />
      <div className="flex w-full items-center flex-col">
        <MathLatex
          style="text-lg"
          content={
            "\\( H(x) = \\begin{cases} 0 & \\text{ha } x < 0 \\\\ 1 & \\text{ha } x \\geq 0 \\end{cases} \\)"
          }
          inline={false}
        />
      </div>
      <div className="mt-4" />
      <StepVisual
        width={500}
        height={300}
        rangeX={rangeX}
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
export default StepContent;
