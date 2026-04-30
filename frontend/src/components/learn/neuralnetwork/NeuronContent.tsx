import SingleNeuronVisual from "../../SingleNeuronVisual";

const NeuronContent = ({ smallScreen = false }: { smallScreen: boolean }) => {
  return (
    <>
      <h2 className="mt-5">Neuron</h2>
      <div className="content-box mt-2">
        <p className="">
          A neuron egy alapvető egysége a mesterséges neurális hálóknak. A
          neuronra lehet úgy tekinteni, mint egy matematikai függvényre, amely
          bemeneteket fogad (egyet, kettőt vagy nagyon sokat), ezeket
          feldolgozza, majd kiad egyetlen számot.
        </p>
        <p className=" mt-4">
          A neuron először összeszorozza a bemeneteket (inputs) és a súlyokat
          (weights) (fontos, hogy a bemenetek és a súlyok száma egyezzen), ezek
          után az eredményhez hozzáadja a torzítás értékét (bias). A neuron
          aktivációs függvénye (activation function) pedig az utóbbi érték
          alapján meghatározza a kimenetet.
        </p>
        <SingleNeuronVisual smallScreen={smallScreen} />
      </div>
    </>
  );
};

export default NeuronContent;
