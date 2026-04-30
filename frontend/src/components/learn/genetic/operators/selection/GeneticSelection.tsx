import GeneticWheelSelection from "./GeneticWheelSelection";
import GeneticTournamentSelection from "./GeneticTournamentSelection";

interface GeneticSelectionProps {
  values: number[];
  probabilities: number[];
}

const GeneticSelection = ({ values, probabilities }: GeneticSelectionProps) => {
  return (
    <div className="mt-4 md:mt-15">
      <h3>Kiválasztás</h3>
      <p>
        Számos kiválasztási módszer létezik a genetikus algoritmusok esetén.
        Ezek közül kettőt mutatok be.
      </p>
      <GeneticWheelSelection values={values} probabilities={probabilities} />
      <GeneticTournamentSelection values={values} scores={probabilities} />
    </div>
  );
};
export default GeneticSelection;
