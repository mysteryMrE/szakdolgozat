import type { ChildNode } from "../../../../types";

const NumberDisplay = ({ value, color }: { value: number; color: string }) => {
  return (
    <div
      className={`flex items-center justify-center w-12 h-12 rounded-lg text-slate-900 text-normal sm:text-lg sm-plus:text-xl font-bold ${
        color === "cyan-400"
          ? "bg-cyan-400"
          : color === "fuchsia-400"
            ? "bg-fuchsia-400"
            : color === "emerald-400"
              ? "bg-emerald-400"
              : "bg-red-900"
      }`}
    >
      {value}
    </div>
  );
};

interface NeuronChromosomeProps {
  name: string;
  neuron: ChildNode[];
  textColor: string;
}

const NeuronChromosome = ({
  name,
  neuron,
  textColor,
}: NeuronChromosomeProps) => {
  return (
    <div>
      <h3
        className={`${
          textColor === "cyan-400"
            ? "text-cyan-400"
            : textColor === "fuchsia-400"
              ? "text-fuchsia-400"
              : textColor === "emerald-400"
                ? "text-emerald-400"
                : "text-red-900"
        } font-semibold mb-3 text-lg`}
      >
        {name}
      </h3>
      <div className="flex items-center justify-center gap-1.5 sm-plus:gap-3">
        {neuron.map((node, id) => (
          <NumberDisplay key={id} value={node.value} color={node.color} />
        ))}
      </div>
    </div>
  );
};

export default NeuronChromosome;
