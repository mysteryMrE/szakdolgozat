import { useState } from "react";
import type { ChildNode } from "../../../../../types";
import NeuronChromosome from "../NeuronChromosome";

interface CrossOverVisualProps {
  points: number;
  parent1: number[];
  parent2: number[];
}

const CrossOverVisual = ({
  points,
  parent1,
  parent2,
}: CrossOverVisualProps) => {
  const color1 = "cyan-400";
  const color2 = "fuchsia-400";
  const color3 = "emerald-400";
  const length = parent1.length;
  const crossoverPoints = points;
  const [point1, setPoint1] = useState(1);
  const [point2Start, setPoint2Start] = useState(1);
  const [point2End, setPoint2End] = useState(2);
  const [uniformMask, setUniformMask] = useState(
    Array.from({ length }, () => Math.random() < 0.5),
  );

  if (parent1.length !== parent2.length) {
    return <div>Error: Parents must be of the same length</div>;
  }
  const generateUniformSwaps = () => {
    setUniformMask(parent1.map(() => Math.random() < 0.5));
  };

  const performCrossover = () => {
    if (crossoverPoints === 0) {
      const child1: ChildNode[] = parent1.map((val, id) =>
        uniformMask[id]
          ? { value: val, color: color1 }
          : { value: parent2[id] as number, color: color2 },
      );
      const child2: ChildNode[] = parent2.map((val, id) =>
        uniformMask[id]
          ? { value: val, color: color2 }
          : { value: parent1[id] as number, color: color1 },
      );
      return { child1, child2 };
    }

    const child1: ChildNode[] = parent1.map((val) => ({
      value: val as number,
      color: color1,
    }));
    const child2: ChildNode[] = parent2.map((val) => ({
      value: val as number,
      color: color2,
    }));

    if (crossoverPoints === 1) {
      for (let i = point1; i < parent1.length; i++) {
        child1[i] = { value: parent2[i] as number, color: color2 };
        child2[i] = { value: parent1[i] as number, color: color1 };
      }
    } else if (crossoverPoints === 2) {
      for (let i = point2Start; i < point2End; i++) {
        child1[i] = { value: parent2[i] as number, color: color2 };
        child2[i] = { value: parent1[i] as number, color: color1 };
      }
    }

    return { child1, child2 };
  };

  const { child1, child2 } = performCrossover();

  return (
    <>
      {crossoverPoints === 0 && (
        <div className="mb-4 md:mb-0 mt-4">
          <button
            onClick={generateUniformSwaps}
            className="btn bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-2 rounded-lg transition-colors"
          >
            Gyerekek újragenerálása
          </button>
        </div>
      )}

      {crossoverPoints === 1 && (
        <div className="mb-1 flex flex-col items-center justify-center">
          <label className="block text-white mb-2 mt-2">
            Keresztező pont: {point1}
          </label>
          <input
            type="range"
            min="0"
            step="1"
            max={parent1.length}
            value={point1}
            onChange={(e) => setPoint1(Number(e.target.value))}
            className="w-5/6 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between text-sm text-slate-400 mt-1 w-5/6">
            {parent1.map((_, id) => (
              <span key={id}>{id}</span>
            ))}
            <span>{parent1.length}</span>
          </div>
        </div>
      )}

      {crossoverPoints === 2 && (
        <div className="mb-1 space-y-4">
          <div className="flex flex-col items-center justify-center">
            <label className="block text-white mb-2 mt-2">
              Kezdő pont: {point2Start}
            </label>
            <input
              type="range"
              min="0"
              max={parent1.length}
              value={point2Start}
              onChange={(e) => {
                const val = Number(e.target.value);
                setPoint2Start(val);
                if (val >= point2End)
                  setPoint2End(Math.min(val + 1, parent1.length));
              }}
              className="w-5/6 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-sm text-slate-400 mt-1 w-5/6">
              {parent1.map((_, id) => (
                <span key={id}>{id}</span>
              ))}
              <span>{parent1.length}</span>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center">
            <label className="block text-white mb-2">
              Vég pont: {point2End}
            </label>
            <input
              type="range"
              min="0"
              max={parent1.length}
              value={point2End}
              onChange={(e) => {
                const val = Number(e.target.value);
                setPoint2End(val);
                if (val <= point2Start) setPoint2Start(Math.max(val - 1, 0));
              }}
              className="w-5/6 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex w-5/6 justify-between text-sm text-slate-400 mt-1">
              {parent1.map((_, id) => (
                <span key={id}>{id}</span>
              ))}
              <span>{parent1.length}</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <NeuronChromosome
          name="Szülő 1"
          neuron={parent1.map((val) => ({ value: val, color: color1 }))}
          textColor={color1}
        />
        <NeuronChromosome
          name="Szülő 2"
          neuron={parent2.map((val) => ({ value: val, color: color2 }))}
          textColor={color2}
        />
        <NeuronChromosome name="Gyerek 1" neuron={child1} textColor={color3} />
        <NeuronChromosome name="Gyerek 2" neuron={child2} textColor={color3} />
      </div>
    </>
  );
};

export default CrossOverVisual;
