import CrossOverVisual from "./CrossOverVisual";

interface GeneticCrossoverProps {
  parent1: number[];
  parent2: number[];
}

const GeneticCrossover = ({ parent1, parent2 }: GeneticCrossoverProps) => {
  return (
    <div className="mt-4 md:mt-10">
      <h3>Keresztezés</h3>
      <p>
        A keresztezés során a kiválasztott szülők génjei kombinálódnak, hogy új
        utódokat hozzanak létre. Ez lehet egy-pontos, több-pontos vagy uniform
        keresztezés.
      </p>
      <div className="mt-4 md:mt-10 p-4 rounded border border-slate-700">
        <h4>Egy-pontos keresztezés</h4>
        <p>
          Az egy-pontos keresztezés során egy ponton a szülők génjei
          kicserélődnek.
        </p>
        <div className="text-center">
          <CrossOverVisual points={1} parent1={parent1} parent2={parent2} />
        </div>
      </div>
      <div className="mt-4 md:mt-10 p-4 rounded border border-slate-700">
        <h4>Több-pontos keresztezés</h4>
        <p>
          A több-pontos keresztezés során több ponton történik a géncsere. Itt
          egy két pontos példa van, ilyenkor a gének a két kiválasztott pont
          között cserélődnek ki.
        </p>
        <div className="text-center">
          <CrossOverVisual points={2} parent1={parent1} parent2={parent2} />
        </div>
      </div>
      <div className="mt-10 p-4 rounded border border-slate-700">
        <h4>Uniform keresztezés</h4>
        <p>
          Az uniform keresztezés során a szülők génjei teljesen véletlenszerűen
          cserélődnek ki.
        </p>
        <div className="text-center">
          <CrossOverVisual points={0} parent1={parent1} parent2={parent2} />
        </div>
      </div>
    </div>
  );
};
export default GeneticCrossover;
