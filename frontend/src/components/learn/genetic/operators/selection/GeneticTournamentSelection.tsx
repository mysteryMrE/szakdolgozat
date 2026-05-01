import GeneticTournamentVisual from "./GeneticTournamentVisual";
interface GeneticTournamentSelectionProps {
  values?: number[];
  scores?: number[];
}

const GeneticTournamentSelection = ({
  values,
  scores,
}: GeneticTournamentSelectionProps) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mt-5">
      <div className="md:w-1/2">
        <h4>Verseny</h4>
        <p>
          A versenyszelekció (Tournament Selection) során a populációból k
          egyedet véletlenszerűen kiválasztunk. Az így létrejött csoportnak a
          legnagyobb fitnesz értékű egyed a nyertese. Ezt a folyamatot
          ismételjük, amíg el nem érjük a kívánt számú szülőt. <br />
          <span className="text-sm text-gray-500">
            Kisebb k mellett a gyengébb egyedek nagyobb eséllyel kerülnek
            kiválasztásra. Magas k mellett az erősebb egyedek többször kerülnek
            versenybe, ahol kiszorítják a gyengébbeket. Például k=3 esetén
            Neuron 1 és Neuron 3 soha nem kerülnek kiválasztásra.
          </span>
        </p>
      </div>
      <div className="md:w-1/2">
        <GeneticTournamentVisual
          values={values ? values : []}
          scores={scores ? scores : []}
        />
      </div>
    </div>
  );
};

export default GeneticTournamentSelection;
