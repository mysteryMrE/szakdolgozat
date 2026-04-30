import MathLatex from "../../../MathLatex";
import MathWhere from "../../../MathWhere";
import MSEVisual from "./MSEVisual";
import { useWindowSize } from "../../../../contexts/WindowSizeContext";

const MSEContent = () => {
  const { isAboveMd } = useWindowSize();
  const fontSize = isAboveMd ? 14 : 18;
  return (
    <div className="mt-10 p-4 rounded border border-slate-700 space-y-4">
      <h4>Átlagos négyzetes hiba</h4>
      <p>
        Az átlagos négyzetes hiba (MSE) egy gyakran használt veszteségfüggvény
        regressziós feladatoknál. Az MSE a kimeneti réteg és a várt kimenet
        közötti különbséget méri úgy, hogy kiszámítja az egyes különbségek
        négyzetét, majd ezeket az értékeket átlagolja. A nagyobb eltérések
        nagyobb mértékben emelik a veszteséget a négyzetre emelés miatt.
      </p>

      <div className="flex w-full items-center flex-col justify-center">
        <MathLatex
          style="text-lg mb-4"
          content={`\\(MSE = \\frac{1}{n} \\sum_{i=1}^{n} (y_i - \\hat{y}_i)^2\\)`}
          inline={false}
        />
        <MathWhere
          style="w-full flex flex-row justify-center md:gap-20 sm:gap-10 gap-2"
          content={[
            ["n", " az adatok száma"],
            ["y", " a várt kimenet vektor"],
            ["\\hat{y}", " a kapott kimenet vektor"],
          ]}
        />
      </div>

      <div className="mt-8" />
      <MSEVisual fontSize={fontSize} />
      <div className="mt-2 note">
        A piros négyzetek az egyes adatokhoz tartozó négyzetes hibát jelölik. Az
        MSE ezeknek az átlaga.
      </div>
    </div>
  );
};
export default MSEContent;
