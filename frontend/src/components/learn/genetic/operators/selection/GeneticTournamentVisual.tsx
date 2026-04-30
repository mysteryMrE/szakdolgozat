import { useEffect, useState } from "react";

interface GeneticTournamentVisualProps {
  values: number[];
  scores: number[];
}

const knuthIt = (array: number[]): number[] => {
  const arr = array.slice();

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    const temp = arr[i];
    arr[i] = arr[j]!;
    arr[j] = temp!;
  }
  return arr;
};

const getKIndividuals = (array: number[], k: number) => {
  const arr = knuthIt(array);
  return arr.slice(0, k);
};

const GeneticTournamentVisual = ({
  values,
  scores,
}: GeneticTournamentVisualProps) => {
  const [tournamentSize, setTournamentSize] = useState(1);
  const [selectedIndividuals, setSelectedIndividuals] = useState<number[]>([1]);
  const [winner, setWinner] = useState(1);

  useEffect(() => {
    const selected = getKIndividuals(values, tournamentSize);
    setSelectedIndividuals(selected);
  }, [tournamentSize, values]);

  useEffect(() => {
    const selectedScores = selectedIndividuals.map((val) => scores[val - 1]);
    const maxScore = Math.max(...selectedScores.map((s) => s ?? 0));
    const winnerIndex = selectedScores.indexOf(maxScore);
    setWinner(selectedIndividuals[winnerIndex]!);
  }, [selectedIndividuals, scores]);

  return (
    <div className="flex flex-col items-center justify-center gap-5">
      <div className="flex flex-col items-center justify-center w-full">
        <label className="block text-white mb-2 ">
          Verseny mérete: {tournamentSize}
        </label>
        <input
          type="range"
          min={1}
          max={values.length}
          step="1"
          value={tournamentSize}
          onChange={(e) => setTournamentSize(Number(e.target.value))}
          className="w-5/6 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <div className="flex justify-between text-sm text-slate-400 mt-1 w-5/6">
          {values.map((_, id) => (
            <span key={id}>{id + 1}</span>
          ))}
        </div>
      </div>

      <div
        aria-label="Individuals in the tournament"
        className="grid grid-cols-2 md:grid-cols-3 items-center justify-center gap-10"
      >
        {selectedIndividuals.map((val, id) => (
          <div
            aria-label={`Individual ${val} with fitness ${scores[val - 1]}`}
            key={id}
            className={`flex flex-col p-2 items-center justify-center ${
              winner === val ? "ring-2 ring-blue-500 rounded-lg" : ""
            }`}
          >
            <span className="text-white">{`Neuron ${val}`}</span>
            <span className="text-slate-400">{`fitnesz: ${
              scores[val - 1]
            }`}</span>
          </div>
        ))}
      </div>
      <button
        className="btn"
        onClick={() => {
          setSelectedIndividuals(getKIndividuals(values, tournamentSize));
        }}
      >
        Új verseny
      </button>
    </div>
  );
};
export default GeneticTournamentVisual;
