import MathLatex from "../../../MathLatex";
import MathWhere from "../../../MathWhere";
import CrossEntropyVisual from "./CrossEntropyVisual";
import { useMemo, useState } from "react";
import { useWindowSize } from "../../../../contexts/WindowSizeContext";

const CrossEntropyContent = () => {
  const [target, setTarget] = useState([0, 1, 0]);
  const predicted = useMemo(() => [0.2, 0.1, 0.7], []);
  const colors = useMemo(() => ["#ef4444", "#3b82f6", "#10b981"], []);
  const tailwindColors = useMemo(
    () => ["bg-red-500", "bg-blue-500", "bg-emerald-500"],
    [],
  );
  const { isAboveMd } = useWindowSize();

  return (
    <div className="mt-10 p-4 rounded border border-slate-700 space-y-4">
      <h4>Keresztentrópia veszteség</h4>
      <p>
        A keresztentrópia veszteségfüggvény azt méri, mennyire tér el a
        jósolt/kapott valószínűségi eloszlás a valós/várt valószínűségi
        eloszlástól. A keresztentrópia logaritmikus természete miatt extrém
        módon bünteti, ha a modell nagy valószínűséggel jósol egy helytelen
        osztályt, illetve kis valószínűséggel jósolja a helyes osztályt.
      </p>

      <div className="flex w-full items-center flex-col justify-center">
        <MathLatex
          style="text-lg mb-4"
          content={`\\(CEL = - \\sum_{i=1}^{C} y_i \\log(\\hat{y}_i)\\)`}
          inline={false}
        />

        <MathWhere
          style="w-full flex flex-row justify-center md:gap-20 sm:gap-10 gap-2"
          content={[
            ["C", " az osztályok száma"],
            ["y", " a várt eloszlás vektor"],
            ["\\hat{y}", " a kapott eloszlás vektor"],
          ]}
        />
      </div>
      <div className="mt-8" />
      <CrossEntropyVisual
        target={target}
        predicted={predicted}
        colors={colors}
        fontSize={isAboveMd ? 12 : 20}
      />
      <p className="text-center">Kapott eloszlás</p>
      <div className="-mt-2 flex flex-row items-center justify-center gap-2 pointer-events-none">
        {Array.from({ length: target.length }, (_, i) => i).map((i) => (
          <div key={i} className={`target-display-button ${tailwindColors[i]}`}>
            {predicted[i]}
          </div>
        ))}
      </div>
      <p className="text-center">Határozd meg a várt eloszlást!</p>
      <div className="mt-4 flex flex-row items-center justify-center gap-2">
        {Array.from({ length: target.length }, (_, i) => i).map((i) => (
          <button
            key={i}
            className={`target-display-button ${
              target[i] === 1 ? tailwindColors[i] : "bg-slate-600"
            }`}
            onClick={() =>
              setTarget([0, 0, 0].map((_, j) => (j === i ? 1 : 0)))
            }
          >
            {target[i]}
          </button>
        ))}
      </div>

      <p className="note -mt-2 w-5/6 mx-auto text-center">
        A one-hot (egy darab 1-es van a vektorban, többi 0) kódolt várt eloszlás
        vektor miatt a keresztentrópia veszteség csak a helyes osztályhoz
        tartozó logaritmus értéktől függ.
      </p>
      <p className="note">
        A <span className="italic">log</span> informatikai és gépi tanulási
        kontextusban általában a természetes alapú (e alapú) logaritmust jelöli.
      </p>
    </div>
  );
};
export default CrossEntropyContent;
