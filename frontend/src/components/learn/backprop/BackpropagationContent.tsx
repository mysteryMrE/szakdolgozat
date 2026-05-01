import BackpropInputToOutput from "./BackpropInputToOutput";
import BackpropActivationFunctions from "./BackpropActivationFunctions";
import BackpropErrors from "./BackpropErrors";
import BackpropBackward from "./BackpropBackward";
import BackpropFull from "./BackpropFull";

const BackpropagationContent = () => {
  return (
    <div className="content-container">
      <h1 className="mb-5 md:mb-10">Visszaterjesztés</h1>
      <div className="content-box">
        <p>
          A visszaterjesztés (backpropagation) egy algoritmus, amelyet a
          neurális hálózatok tanítására használnak. Célja, hogy minimalizálja a
          kimeneti réteg és a várt kimenet közötti hibát. Ezt úgy teszi, hogy a
          veszteséget visszaterjeszti a hálózat rétegein, az utolsó réteg felől
          az első rétegig, és frissíti a súlyokat és a torzításokat.
        </p>
        <p className="note">
          A hiba egy általános fogalom, általában a várt és a kapott eredmény
          eltérésére utal. A veszteség pedig a veszteségfüggvény által számított
          érték, amely számszerűsíti a hibát.
        </p>
      </div>
      <BackpropInputToOutput />
      <BackpropActivationFunctions />
      <BackpropErrors />
      <BackpropBackward />
      <BackpropFull />
    </div>
  );
};
export default BackpropagationContent;
