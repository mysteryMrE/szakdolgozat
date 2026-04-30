import GeneticConceptsTable from "./GeneticConceptsTable";
import GeneticInCaseOfNN from "./GeneticInCaseOfNN";
import GeneticOperatorsWithNeurons from "./GeneticOperatorsWithNeurons";
import GeneticLoop from "./GeneticLoop";

const GeneticContent = () => {
  return (
    <div className="content-container">
      <h1 className="mb-5 md:mb-10">Genetikus algoritmus</h1>
      <div className="content-box mt-4 text-base leading-relaxed">
        <p>
          A genetikus algoritmus (genetic algorithm - GA) az evolúciós
          algoritmusok (EA) egy típusa, amely olyan operátorokat alkalmaz,
          melyeket az evolúció ihletett. Az algoritmus egyedekkel dolgozik,
          melyek egy adott problémára adott megoldást reprezentálnak. A
          legjobban teljesítő megoldások "szaporodnak", míg a gyengébben
          teljesítők "kihalnak".
        </p>
      </div>
      <div className="content-box mt-4 text-base leading-relaxed">
        <h2>Fogalmak</h2>
        <p>
          Vegyünk egy feladatot, amely egy két jegyű szám kitalálása. Az alábbi
          táblázat bemutatja a fontosabb fogalmakat a feladaton keresztül.
        </p>
        <GeneticConceptsTable />
      </div>
      <GeneticInCaseOfNN />
      <GeneticOperatorsWithNeurons />
      <GeneticLoop />
    </div>
  );
};

export default GeneticContent;
