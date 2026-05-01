const GeneticLoop = () => {
  return (
    <div className="content-box mt-5 md:mt-10">
      <h2>Az evolúciós ciklus folyamata</h2>
      <div className="flex flex-col ml-2 md:ml-5 normal:ml-15 gap-5 md:gap-10 text-left">
        <div>
          <h4>Populáció inicializálása</h4>
          <p>
            A populáció inicializálása véletlenszerű vagy előre definiált
            egyedek generálásával.
          </p>
        </div>
        <div className="ml-5 md:ml-15 flex flex-col items-start gap-3 sm:gap-5 md:gap-10">
          <div>
            <h4>Egyedek kiértékelése</h4>
            <p>A kiértékelés során minden egyedet pontoz a fitnesz függvény.</p>
          </div>
          <div>
            <h4>Szülők kiválasztása</h4>
            <p>
              A populációból kiválasztjuk a szülőket. A jobb egyedeknek nagyobb
              esélyük van a kiválasztódásra.
            </p>
          </div>
          <div>
            <h4>Keresztezés</h4>
            <p>
              A kiválasztott szülők keresztezésével új egyedek jönnek létre.
            </p>
          </div>
          <div>
            <h4>Mutáció</h4>
            <p>Az utódok génjei véletlenszerűen módosulnak.</p>
          </div>
          <div>
            <h4>Új populáció</h4>
            <p>
              Az új populáció az utódokból áll, esetenként az előző generáció
              legjobb egyedeivel kiegészülve.
            </p>
          </div>
        </div>
        <div>
          <h4>Iteráció</h4>
          <p>
            A populációt újra kiértékeljük, és a ciklus kezdődik elölről, amíg a
            megállási feltételek teljesülnek. Ez lehet egy adott generációszám
            elérése, a kívánt egyed megjelenése, vagy a fitnesz érték
            stagnálása.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GeneticLoop;
