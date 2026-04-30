import MathLatex from "../../MathLatex";
import MathWhere from "../../MathWhere";

const BackpropInputToOutput = () => {
  return (
    <div className="content-box mt-4">
      <h2>Bemenetből Kimenet</h2>
      <p>
        A bemeneti réteg neuronjai tartalmazzák a bemenetet. Minden további
        neuron az előző réteg kimenetét használja bemenetként. A réteg kimenete
        a tartalmazott neuronok kimenetének vektora. Egy neuron kimenetét,
        aktivációs értékét így számítjuk:
      </p>
      <MathLatex
        style="text-lg w-full flex justify-center mt-3"
        content={"\\( z = \\sum_{i}^{n} w_{i} \\\\ x_i + b \\)"}
        inline={false}
      />
      <MathLatex
        style="text-lg w-full flex justify-center"
        content={"\\(a = f(z)\\)"}
        inline={false}
      />
      <div className="mt-2" />
      <div className="flex flex-col justify-center items-center">
        <MathWhere
          style="mt-3 md:flex md:flex-row md:justify-around md:gap-1 grid grid-cols-2 gap-2"
          content={[
            ["n", " bemenet és súly szám"],
            ["w", " súly vektor"],
            ["x", " bemenet vektor"],
            ["b", " torzítás"],
            ["z", " aktiváció előtti érték"],
            ["f(z)", " aktivációs függvény"],
            ["a", " aktivációs érték"],
          ]}
        />
      </div>
    </div>
  );
};
export default BackpropInputToOutput;
