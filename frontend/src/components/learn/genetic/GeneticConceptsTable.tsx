const paddings = "py-1 px-2 md:px-4 md:py-3";

const core = [
  {
    concept: "Keresési tér",
    description: "A lehetséges megoldások halmaza.",
    example: "10-től 99-ig terjedő számok",
  },
  {
    concept: "Gén",
    description: "Alapegység, egyetlen paramétert vagy változót reprezentál.",
    example: "0-9 közötti számjegy",
  },
  {
    concept: "Kromoszóma",
    description: "Egy teljes megoldás kódolása, gének sorozata.",
    example: "Két génből álló sorozat, pl. [3, 5]",
  },
  {
    concept: "Egyed",
    description:
      "A megoldások egy példánya a keresési térből, melyet egy kromoszóma ír le.",
    example: "Egy két jegyű szám, pl. 27, 64, 89",
  },
  {
    concept: "Populáció",
    description:
      "A problémára adott lehetséges megoldások, azaz egyedek halmaza.",
    example: "Adott számú két jegyű szám, pl. [27, 64, 89, 19, 27]",
  },
  {
    concept: "Generáció",
    description: "A populáció egy iterációban.",
    example:
      "Például kezdeti populáció: [27, 64, 89, 19, 27], következő generáció: [64, 89, 15, 57, 64]",
  },
  {
    concept: "fitnesz függvény / érték",
    description:
      "A fitnesz függvény a megoldás minőségét méri. Minél magasabb a fitnesz érték, annál jobb a megoldás.",
    example:
      "Az f(egyed) = 100-|GondoltSzám-egyed| függvény például alkalmas a fitnesz mérésére. A közelebbi egyedek magasabb értéket kapnak.",
  },
];

const operators = [
  {
    concept: "Kiválasztódás",
    description:
      "A következő generáció előállításához szükséges egyedek kiválasztása a jelenlegi populációból. A magasabb fitnesz értékkel rendelkező egyedek nagyobb valószínűséggel kerülnek kiválasztásra.",
    example:
      "Ha a gondolt szám 72, és a populáció [68, 19, 95], akkor 68-nak van a legnagyobb esélye a kiválasztódásra.",
  },
  {
    concept: "Keresztezés",
    description:
      "A kiválasztódás operátorral választott egyedek kombinálása új egyedek létrehozásához.",
    example:
      "72 és 19 keresztezése (a két számjegy közötti egy-pontos keresztezéssel) 79-et és 12-őt eredményez.",
  },
  {
    concept: "Mutáció",
    description:
      "A kromoszóma egy vagy több génjének véletlenszerű módosítása új, diverz egyed létrehozásához.",
    example:
      "A 79 egyed mutációja (például a második gén véletlenszerű megváltoztatásával) 75-öt eredményezhet.",
  },
];

const GeneticConceptsTable = () => {
  return (
    <div className="overflow-x-auto mt-2 md:mt-10">
      <table className="text-base text-gray-200 overflow-hidden text-left  border-separate border-spacing-y-3">
        <thead>
          <tr className="bg-gray-900 text-center font-semibold">
            <th className={paddings}>Fogalom</th>
            <th className={paddings}>Leírás</th>
            <th className={paddings}>Példa</th>
          </tr>
        </thead>
        <tbody>
          {core.map(({ concept, description, example }) => (
            <tr key={concept}>
              <td className={`${paddings} font-medium text-cyan-400`}>
                {concept}
              </td>
              <td className={`${paddings} min-w-[200px] md:min-w-0`}>
                {description}
              </td>
              <td className={`${paddings} min-w-[200px] md:min-w-0`}>
                {example}
              </td>
            </tr>
          ))}
          <tr className="bg-gray-900 text-center font-semibold">
            <td className="py-2" colSpan={3}>
              Operátorok
            </td>
          </tr>
          {operators.map(({ concept, description, example }) => (
            <tr key={concept}>
              <td className={`${paddings} font-medium text-cyan-400`}>
                {concept}
              </td>
              <td className={`${paddings} min-w-[200px] md:min-w-0`}>
                {description}
              </td>
              <td className={`${paddings} min-w-[200px] md:min-w-0`}>
                {example}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GeneticConceptsTable;
