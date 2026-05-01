import SigmoidContent from "./activations/SigmoidContent";
import ReluContent from "./activations/ReluContent";
import StepContent from "./activations/StepContent";
import SoftmaxContent from "./activations/SoftmaxContent";

const BackpropActivationFunctions = () => {
  return (
    <div className="content-box mt-4">
      <h2>Aktivációs függvény</h2>
      <p>
        Az aktivációs függvény határozza meg, hogy a neuron milyen mértékben
        aktiválódik, mi lesz a kimenete. Az aktivációs függvények kulcsszerepet
        játszanak a neurális hálózatok teljesítményében, mert velük képesek a
        neurális hálók nemlineáris összefüggések felfedezésére. Például
        aktivációs függvény nélküli háló nem tudná közelíteni a négyzet
        függvényt, méretétől és tanításától függetlenül.
      </p>
      <SigmoidContent />
      <ReluContent />
      <StepContent />
      <SoftmaxContent />
    </div>
  );
};

export default BackpropActivationFunctions;
