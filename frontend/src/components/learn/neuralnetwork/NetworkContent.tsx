import NeuralNetworkVisual from "../../NeuralNetworkVisual";
import { useState } from "react";
import { useWindowSize } from "../../../contexts/WindowSizeContext";

import type { TwoTwoOneNeuralNetwork } from "../../../types";

const NetworkContent = () => {
  const { isAboveMd } = useWindowSize();
  const isSmallScreen = !isAboveMd;
  const andGate: TwoTwoOneNeuralNetwork = {
    name: "ÉS (AND)",
    weightsInputToHidden: [
      [1, 0],
      [0, 1],
    ],
    weightsHiddenToOutput: [1, 1],
    biasesHidden: [-0.5, -0.5],
    biasOutput: -1.5,
    activation: (x: number) => (x > 0 ? 1 : 0),
  };
  const orGate: TwoTwoOneNeuralNetwork = {
    name: "VAGY (OR)",
    weightsInputToHidden: [
      [1, 0],
      [0, 1],
    ],
    weightsHiddenToOutput: [1, 1],
    biasesHidden: [-0.5, -0.5],
    biasOutput: -0.5,
    activation: (x: number) => (x > 0 ? 1 : 0),
  };
  const xorGate: TwoTwoOneNeuralNetwork = {
    name: "KIZÁRÓ VAGY (XOR)",
    weightsInputToHidden: [
      [1, 1],
      [-1, -1],
    ],
    weightsHiddenToOutput: [1, 1],
    biasesHidden: [-0.5, 1.5],
    biasOutput: -1.5,
    activation: (x: number) => (x > 0 ? 1 : 0),
  };
  const [chosenGate, setChosenGate] = useState<TwoTwoOneNeuralNetwork>();

  return (
    <>
      <h2 className="mt-10">Neuronháló</h2>
      <div className="content-box mt-2">
        <p>
          A neuronháló neuronok összekapcsolásával jön létre. A hálózat
          rétegekből (layers) áll, ahol az első réteg a bemeneti réteg (input
          layer), a középső rétegek a rejtett rétegek (hidden layers), a
          kimeneti réteg (output layer) pedig az utolsó réteg. A bemeneti réteg
          fogadja a bemeneteket, a további rétegek pedig feldolgozzák azokat, és
          a kimeneti réteg adja meg a hálózat végső kimenetét. Minden "valós"
          (nem bemeneti) réteg az előző réteg kimenetét használja bemenetként,
          az adat rétegenként halad előre, kerül feldolgozásra. <br />
          <span className="note">
            A példákban mindig teljesen összekötött (fully connected) hálókról
            lesz szó, ahol minden neuron az előző réteg minden neuronjához
            kapcsolódik.
          </span>
        </p>
        <p>
          {" "}
          Itt választhatsz 3 előre definiált neuronháló közül, mindegyiknek két
          bemeneti, két rejtett, és egy kimeneti neuronja van. A példa hálók
          minden neuronja lépcsős aktivációs függvényt használ, jelölje ezt{" "}
          <span className="font-bold">F</span>. A neuronhálók 3 jól ismert
          logikai kaput valósítanak meg: ÉS (AND), VAGY (OR) és KIZÁRÓ VAGY
          (XOR). A bemenet lehet 0 vagy 1, a kimenet is 0 vagy 1 lesz (1 igaz, 0
          hamis).
        </p>
        <div
          aria-label="Gate selection buttons"
          className="mt-4 mb-2 flex flex-row gap-4 justify-center"
        >
          <button
            className={`btn flex-1 ${chosenGate?.name === andGate.name ? "bg-blue-800" : ""}`}
            onClick={() => setChosenGate(andGate)}
            aria-label={`Select${chosenGate?.name === andGate.name ? "ed" : ""} AND gate`}
          >
            ÉS
          </button>
          <button
            className={`btn flex-1 ${chosenGate?.name === orGate.name ? "bg-blue-800" : ""}`}
            onClick={() => setChosenGate(orGate)}
            aria-label={`Select${chosenGate?.name === orGate.name ? "ed" : ""} OR gate`}
          >
            VAGY
          </button>
          <button
            className={`btn flex-1 ${chosenGate?.name === xorGate.name ? "bg-blue-800" : ""}`}
            onClick={() => setChosenGate(xorGate)}
            aria-label={`Select${chosenGate?.name === xorGate.name ? "ed" : ""} XOR gate`}
          >
            KIZÁRÓ VAGY
          </button>
        </div>
        <NeuralNetworkVisual network={chosenGate} smallScreen={isSmallScreen} />
        <div className="mt-10">
          A neuronok kimenete (y) általános formában:{" "}
          <span className="font-bold text-lg">y = F(x)</span>, ahol x a
          súlyozott bemenetek és a torzítás összege, F pedig a lépcsős
          aktivációs függvény.
        </div>
        <div className="note mt-3">
          Az ÉS és VAGY kapuk lineárisan elválaszthatóak (1 vonallal, két részre
          osztja a síkot), 1 neuronból álló hálózat is meg tudná valósítani
          ezeket. A KIZÁRÓ VAGY kapu nem lineárisan elválasztható (2 vonallal
          kell a síkot három részre osztani), ezért legalább 3 neuronra van
          szükség a megvalósításához. A rejtett rétegben van egy VAGY és egy NEM
          ÉS kapu, a kimeneti réteg neuronja ezeket egy ÉS kapuként kapcsolja
          össze.
        </div>
      </div>
    </>
  );
};

export default NetworkContent;
