import { useState } from "react";
import NeuronChromosome from "../NeuronChromosome";
import type { ChildNode } from "../../../../../types";

interface GeneticMutationVisualProps {
  neuron: number[];
}

const GeneticMutationVisual = ({ neuron }: GeneticMutationVisualProps) => {
  const [mutationRate, setMutationRate] = useState(0.1);
  const [mutationStrength, setMutationStrength] = useState(0.5);
  const mutationMask = neuron.map(() => Math.random() < mutationRate);
  const [mutatedNeuron, setMutatedNeuron] = useState<ChildNode[]>(
    neuron.map((val) => ({ value: val, color: "cyan-400" })),
  );

  const applyMutation = () => {
    const newNeuron = neuron.map((gene, id) =>
      mutationMask[id]
        ? {
            value: Number(
              (gene + (Math.random() * 2 - 1) * mutationStrength).toFixed(1),
            ),
            color: "emerald-400",
          }
        : { value: gene, color: "cyan-400" },
    );
    setMutatedNeuron(newNeuron);
  };

  return (
    <>
      <div className="mb-5 space-y-2 md:space-y-4">
        <div className="flex flex-col items-center justify-center">
          <label className="block text-white mb-2 mt-2">
            Mutációs ráta: {mutationRate.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={mutationRate}
            onChange={(e) => setMutationRate(Number(e.target.value))}
            className="w-5/6 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>
        <div className="flex flex-col items-center justify-center">
          <label className="block text-white mb-2 ">
            Mutációs erősség: {mutationStrength.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={mutationStrength}
            onChange={(e) => setMutationStrength(Number(e.target.value))}
            className="w-5/6 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>
      </div>
      <div className="flex justify-center w-full">
        <button
          className="btn bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-2 rounded-lg transition-colors mt-4 mb-4 md:mt-8 md:mb-8"
          onClick={applyMutation}
        >
          Mutáció
        </button>
      </div>
      <div className="flex flex-col md:flex-row justify-center gap-3 md:gap-20 md:items-left items-center text-center">
        <NeuronChromosome
          name="Neuron"
          neuron={neuron.map((val) => ({ value: val, color: "cyan-400" }))}
          textColor="cyan-400"
        />

        <NeuronChromosome
          name="Mutált Neuron"
          neuron={mutatedNeuron}
          textColor="emerald-400"
        />
      </div>
    </>
  );
};

export default GeneticMutationVisual;
