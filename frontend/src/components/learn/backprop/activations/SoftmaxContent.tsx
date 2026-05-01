import { useState, useMemo } from "react";
import MathLatex from "../../../MathLatex";
import SoftmaxVisual from "./SoftmaxVisual";
import MathWhere from "../../../MathWhere";
import { useWindowSize } from "../../../../contexts/WindowSizeContext";

const SoftmaxContent = () => {
  const [showSoftmax, setShowSoftmax] = useState(false);
  const inputs = useMemo(() => [0, 3, -1, 1], []);
  const { isAboveMd } = useWindowSize();
  return (
    <div className="mt-10 p-4 rounded border border-slate-700">
      <h4>Softmax</h4>
      <p>
        A softmax függvény egy olyan aktivációs függvény, amelyet gyakran
        használnak a neurális hálózatok kimeneti rétegében, különösen
        többosztályos osztályozási problémák esetén, a Tic-Tac-Toe esete ilyen
        (9 "osztály" / mező van). A softmax függvény a bemeneti vektor elemeit
        valószínűségi eloszlássá alakítja, ahol az egyes elemek értékei 0 és 1
        között vannak, és az összegük 1. Az előzőekkel ellentétben a softmax nem
        egyetlen neuronon van alkalmazva, hanem egy teljes rétegen.
      </p>
      <div className="mt-4" />
      <div className="flex w-full items-center flex-col">
        <MathLatex
          style="text-xl"
          content={
            "\\( Softmax(x_{i}) = \\dfrac{e^{x_{i}}}{\\sum^{K}_{j} e^{x_{j}}} \\)"
          }
          inline={false}
        />
        <MathWhere
          style="w-full flex flex-row justify-center md:gap-20 sm:gap-10 gap-2 mt-2"
          content={[
            ["K", " az osztályok száma"],
            ["x", " a bemeneti vektor"],
          ]}
        />
      </div>
      <div className="mt-6" />
      <SoftmaxVisual
        showSoftmax={showSoftmax}
        inputs={inputs}
        fontSize={isAboveMd ? 14 : 25}
      />
      <div className="mb-1 flex flex-col items-center justify-center">
        <label className="block text-white mb-2 mt-2">
          Softmax alkalmazása
        </label>
        <input
          type="checkbox"
          checked={showSoftmax}
          onChange={(e) => setShowSoftmax(e.target.checked)}
          className="w-5 h-5 bg-slate-700 rounded-lg cursor-pointer accent-cyan-400"
        />
      </div>
    </div>
  );
};
export default SoftmaxContent;
