import GeneticFitness from "./GeneticFitness";
import GeneticSelection from "./operators/selection/GeneticSelection";
import GeneticCrossover from "./operators/crossover/GeneticCrossover";
import GeneticMutation from "./operators/mutation/GeneticMutation";
import type { TwoInputsOneNeuron } from "../../../types";

const GeneticOperatorsWithNeurons = () => {
  const network1: TwoInputsOneNeuron = {
    weight1: 0.2,
    weight2: 0.5,
    bias: 1.0,
  };
  const network2: TwoInputsOneNeuron = {
    weight1: 0.8,
    weight2: 0.8,
    bias: -1.0,
  };
  const network3: TwoInputsOneNeuron = {
    weight1: 0.5,
    weight2: 0.2,
    bias: -0.1,
  };
  const network4: TwoInputsOneNeuron = {
    weight1: 0.5,
    weight2: 0.5,
    bias: -1.8,
  };

  const neuronToList = (neuron: TwoInputsOneNeuron) => [
    neuron.weight1,
    neuron.weight2,
    neuron.bias,
  ];

  const getParents = () => {
    const fitnesses = [
      fitnessFunction(network1),
      fitnessFunction(network2),
      fitnessFunction(network3),
      fitnessFunction(network4),
    ];
    const topTwo = fitnesses
      .map((fit, idx) => ({ fit, idx }))
      .sort((a, b) => b.fit - a.fit)
      .slice(0, 2)
      .map(({ idx }) => [network1, network2, network3, network4][idx]);
    return topTwo;
  };

  const neuralNetworkPredict = (
    network: TwoInputsOneNeuron,
    input1: number,
    input2: number,
  ) => {
    const { weight1, weight2, bias } = network;
    const output = weight1 * input1 + weight2 * input2 + bias;
    return output > 0 ? 1 : 0;
  };

  const fitnessFunction = (network: TwoInputsOneNeuron) => {
    const testCases = [
      { input1: 0, input2: 0, expected: 0 },
      { input1: 0, input2: 1, expected: 0 },
      { input1: 1, input2: 0, expected: 0 },
      { input1: 1, input2: 1, expected: 1 },
    ];

    let fitness = 0;

    testCases.forEach(({ input1, input2, expected }) => {
      const output = neuralNetworkPredict(network, input1, input2);
      fitness += output === expected ? 1 : 0;
    });

    return fitness;
  };

  return (
    <div className="content-box mt-4 text-base leading-relaxed">
      <h2>Operátorok neuronokkal</h2>
      <p>
        Az operátorokat az ÉS (AND) kapu segítségével nézzük meg. <br />{" "}
        <span className="note">
          A genetikus algoritmus nem a legjobb választás ennek a feladatnak a
          megoldására. Egyrészt nagyon erőforrás igényes a probléma nehézségéhez
          képest, másrészt a fitness értékek (4-ből hány esetben ad jó választ)
          diszkrét természetűek, ami megnehezíti a folyamatos optimalizálást.
        </span>{" "}
        <br />A példa neuronok lépcsős aktivációs függvényt használnak.
      </p>
      <GeneticFitness
        networks={[network1, network2, network3, network4]}
        fitnessFunction={fitnessFunction}
      />
      <hr className="mt-4" />
      <GeneticSelection
        values={[network1, network2, network3, network4].map((_, i) => i + 1)}
        probabilities={[network1, network2, network3, network4].map(
          fitnessFunction,
        )}
      />
      <hr className="mt-4" />
      <GeneticCrossover
        parent1={neuronToList(getParents()[0]!)}
        parent2={neuronToList(getParents()[1]!)}
      />
      <hr className="mt-4" />
      <GeneticMutation neuron={neuronToList(network1)} />
    </div>
  );
};

export default GeneticOperatorsWithNeurons;
