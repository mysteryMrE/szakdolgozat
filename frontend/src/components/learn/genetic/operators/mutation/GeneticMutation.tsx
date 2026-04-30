import GeneticMutationVisual from "./GeneticMutationVisual";

interface GeneticMutationProps {
  neuron: number[];
}

const GeneticMutation = ({ neuron }: GeneticMutationProps) => {
  return (
    <div className="mt-10 mb-10">
      <h3>Mutáció</h3>
      <p className="mb-4">
        A mutáció során a gének véletlenszerűen módosulnak, ami új
        tulajdonságokat eredményezhet. Megadhatjuk a mutációs rátát, ami azt
        jelzi, hogy a gének mekkora részét érintheti a mutáció, és a mutáció
        erejét, ami azt jelzi, hogy a gén értéke mennyivel változhat meg.
      </p>
      <GeneticMutationVisual neuron={neuron} />
    </div>
  );
};

export default GeneticMutation;
