import SingleNeuronVisual from "../../SingleNeuronVisual";
import type { TwoInputsOneNeuron } from "../../../types";

interface GeneticFitnessProps {
  networks?: TwoInputsOneNeuron[];
  fitnessFunction: (network: TwoInputsOneNeuron) => number;
}

const GeneticFitness = ({ networks, fitnessFunction }: GeneticFitnessProps) => {
  return (
    <div className="mt-5 md:mt-10">
      <h3>fitnesz függvény</h3>
      <p>
        Az ÉS logikai kapunak 4 bemeneti esete van: (0,0), (0,1), (1,0), (1,1),
        ezekre a kimenetek rendre 0, 0, 0, 1. A neuron fitnesz értéke az
        eltalált kimenetek számával egyenlő.
      </p>
      <div className={`mt-5 grid grid-cols-1 sm-plus:grid-cols-2 gap-5`}>
        {networks?.map((network, i) => (
          <div key={i} className="relative">
            <SingleNeuronVisual
              key={i}
              onlyParameters={true}
              weightInit1={network.weight1}
              weightInit2={network.weight2}
              biasInit={network.bias}
            />
            <div className="absolute bottom-2 right-2 bg-gray-800 text-base px-2 py-1 rounded">
              <p>Fitness: {fitnessFunction(network)}</p>
            </div>
            <div className="absolute top-2 left-2 bg-gray-800 text-base px-2 py-1 rounded">
              <p>Neuron {i + 1}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GeneticFitness;
