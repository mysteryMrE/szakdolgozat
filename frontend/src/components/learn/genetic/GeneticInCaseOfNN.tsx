import NeuralNetworkVisual from "../../NeuralNetworkVisual";
import SingleNeuronVisual from "../../SingleNeuronVisual";
import { useWindowSize } from "../../../contexts/WindowSizeContext";

const GeneticInCaseOfNN = () => {
  const { isAboveSm } = useWindowSize();
  return (
    <div className="content-box mt-4 text-base leading-relaxed mt-8">
      <h2>Neuronháló esetén</h2>
      <p>
        A feladatokra sokféle megoldás adható, a megoldás lehet például egy
        neuron vagy egy neurális hálózat is. A neurális hálót többek között
        reprezentálhatjuk a súly és torzítás értékeinek sorozatával.
      </p>
      <div className="flex flex-col md:flex-row mt-4 items-center justify-center w-full">
        <div className="w-9/10 sm:w-6/10 lg:w-4/10 flex-shrink-0">
          <SingleNeuronVisual onlyParameters={true} />
        </div>

        <p className="mt-3 md:mt-0 md:p-2 md:pl-10 text-center md:text-left">
          A képen látható neuron kódolása: <br /> [ 0.5, -0.5, 1.0 ], tehát [
          súly1, súly2, torzítás ] <br />
          Egy neurális hálózat kódolását ilyen sorozatokból tudjuk
          összeállítani.
        </p>
      </div>
      <div className="mt-4 ">
        Az alábbi ábra egy két bemenettel, két rejtett neuronnal és egy kimeneti
        neuronnal rendelkező neurális hálót mutat. A bemeneteket nem kell
        kódolni, a maradék két réteg kódolása így néz ki:
        <ul>
          <li>Rejtett réteg: [ [0.5, -0.5, 1.0], [0.3, 0.8, -1.0] ]</li>
          <li>Kimeneti réteg: [ [0.6, 0.9, 0.2] ]</li>
        </ul>
        Így a teljes egyed kódja:
        <br />[ [ [0.5, -0.5, 1.0], [0.3, 0.8, -1.0] ] , [ [0.6, 0.9, 0.2] ] ]
      </div>
      <div className="flex items-center justify-center gap-4">
        <div className="w-9/10 md:w-4/5 mt-3">
          <NeuralNetworkVisual
            network={{
              name: "Két neuron",
              weightsInputToHidden: [
                [0.5, -0.5],
                [0.3, 0.8],
              ],
              biasesHidden: [1.0, -1.0],
              weightsHiddenToOutput: [0.6, 0.9],
              biasOutput: 0.2,
              activation: (x: number) => (x > 0 ? 1 : 0),
            }}
            onlyParameters={true}
            smallScreen={!isAboveSm}
          />
        </div>
      </div>
    </div>
  );
};
export default GeneticInCaseOfNN;
