import NeuronContent from "./NeuronContent";
import NetworkContent from "./NetworkContent";
import { useWindowSize } from "../../../contexts/WindowSizeContext";

const NeuralNetworkContent = () => {
  const { isAboveMd } = useWindowSize();
  return (
    <div className="content-container">
      <h1 className="mb-5 md:mb-10">Neuron és Neuronháló</h1>
      <div className="content-box mt-6 flex flex-col gap-4">
        <p>
          A neuron egy alapvető egysége a mesterséges neurális hálóknak. A
          neuronháló pedig neuronok összekapcsolásával jön létre.
        </p>
      </div>
      <NeuronContent smallScreen={!isAboveMd} />
      <NetworkContent />
      <div className="content-box mt-6 ">
        <h2 className="mt-5">Alkalmazása a tic-tac-toe játékban</h2>
        <p>
          Az ellenfélként használható neuronhálók a 9 mezőt 18 bemeneti értékké
          alakítják, ha egy mező üres akkor (0,0), ha X akkor (1,0), ha O akkor
          (0,1). Ezt a bemenetet dolgozzák fel, a kimenetük pedig 9 érték, ahol
          a legmagasabb értékű kimenetnek megfelelő sorszámú lépést választják.
        </p>
        <p className="mt-4">
          A tábla → lépés feladat egy klasszifikációs feladatnak tekinthető,
          ezért a kimeneti réteg <span className="font-bold">softmax</span>{" "}
          aktivációs függvényt használ. Ennek a függvénynek az az előnye, hogy a
          kimeneti értékeket 0 és 1 közé képzi úgy, hogy összegük 1 lesz, így
          könnyen értelmezhető a kimenet valószínűségként.
        </p>
      </div>
    </div>
  );
};

export default NeuralNetworkContent;
