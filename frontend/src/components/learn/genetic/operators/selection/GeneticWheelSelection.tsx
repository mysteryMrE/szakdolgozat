import { useEffect, useState } from "react";
import SpinningWheel from "../../../../SpinningWheel";

interface GeneticWheelSelectionProps {
  values: number[];
  probabilities: number[];
}

const GeneticWheelSelection = ({
  values,
  probabilities,
}: GeneticWheelSelectionProps) => {
  const smallWheel = 199;
  const bigWheel = 296;

  const [wheelSize, setWheelSize] = useState(
    window.innerWidth < 1024 ? smallWheel : bigWheel,
  );

  useEffect(() => {
    const handleResize = () => {
      setWheelSize(window.innerWidth < 1024 ? smallWheel : bigWheel);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return (
    <div className="flex flex-col md:flex-row gap-4 mt-5">
      <div className="md:w-1/2 flex flex-col items-center justify-center">
        <SpinningWheel
          values={values}
          probabilities={probabilities}
          isSpinning={() => {}}
          setChoice={() => {}}
          size={wheelSize}
        />
      </div>
      <div className="md:w-1/2">
        <h4>Kerékforgatásos</h4>
        <p>
          A kerékforgatásos kiválasztás (Roulette Wheel Selection) során a
          populáció egyedei a fitnesz értékük arányában kapnak körszeleteket egy
          keréken. Minél nagyobb egy egyed fitnesz értéke, annál nagyobb
          szeletet kap, így nagyobb eséllyel kerül kiválasztásra a következő
          generációba / annak generálására. <br />
          <span className="text-sm text-gray-500">
            A kerékre írt számok a fenti neuronok sorszámai, a szeletek mérete
            pedig a fitnesz értékükkel arányos.
          </span>
        </p>
      </div>
    </div>
  );
};

export default GeneticWheelSelection;
