import { useState, useMemo } from "react";
import SigmoidVisual from "./SigmoidVisual";
import MathLatex from "../../../MathLatex";
import { useWindowSize } from "../../../../contexts/WindowSizeContext";

const SigmoidContent = () => {
  const [x, setX] = useState(0);
  const { isAboveMd } = useWindowSize();
  const rangeX = useMemo(() => [-10, 10] as [number, number], []);
  return (
    <div className="mt-10 p-4 rounded border border-slate-700">
      <h4>Sigmoid</h4>
      <p>
        A sigmoid függvény egy S-alakú görbe, amely a bemeneti értékeket 0 és 1
        közé transzformálja. A kimeneti érték a bemeneti érték függvényében
        folyamatosan változik, és soha nem éri el a 0 vagy 1 értéket. <br />
        <span className="note">
          A kerekítések miatt az alábbi ábra fog 0-át és 1-et is mutatni.
        </span>
      </p>
      <div className="mt-4" />
      <MathLatex
        style="text-lg w-full flex justify-center"
        content={"\\( \\sigma(x) = \\dfrac{1}{1 \\ + \\ e^{-x}} \\)"}
        inline={false}
      />
      <div className="mt-4" />
      <SigmoidVisual
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
export default SigmoidContent;
