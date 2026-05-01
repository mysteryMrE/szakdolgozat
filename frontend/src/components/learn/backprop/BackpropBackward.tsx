const BackpropBackward = () => {
  return (
    <div className="content-box mt-4 ">
      <h2>A visszaterjesztés folyamata</h2>
      <p>
        Képzeljünk el egy ambiciózus kuktát, aki lehetőséget kap arra, hogy egy
        elismert ételkritikus véleményezze a főztjét. A kifinomult ízlésű
        kritikus nemcsak egy pontszámot ad, például azt, hogy az étel "3/10-es",
        hanem konkrét visszajelzést is megfogalmaz: "túl sós, és nem elég édes".
        A pontszám megmutatja, hogy az étel mennyire tér el az elvárttól, a
        részletesebb kritika pedig segít eldönteni, milyen irányban kell
        módosítani a receptet. A kukta ezután visszamegy a konyhába, a konkrét
        visszajelzés alapján módosítja a receptet, majd elkészíti újra az ételt.
        Ez a folyamat addig ismétlődik, amíg a kritikus elégedett nem lesz az
        étellel.
      </p>
      <div className="mt-4 flex flex-col items-center leading-relaxed">
        <p className="mt-4 font-semibold ">
          A neurális hálók esetén egy nagyon hasonló folyamat zajlik le:
        </p>
        <ul className="list-decimal list-inside mt-2 text-left w-5/6 space-y-3">
          <li>
            <span className="font-semibold">Az étel elkészítése:</span> A
            neurális hálózat a bemeneti adatok alapján elvégzi a számításokat,
            és előállít egy kimenetet.
          </li>
          <li>
            <span className="font-semibold">A kritikus pontszáma:</span>A
            veszteségfüggvény összehasonlítja a hálózat kimenetét a várt, helyes
            eredménnyel, és kiszámítja a veszteség mértékét. Ez megmondja,
            mekkora a baj, de nem árulja el, hogyan lehetne a helyzeten
            javítani.
          </li>
          <li>
            <span className="font-semibold">A segítő kritika:</span> A neurális
            hálózatban ezt az információt a gradiens adja meg. A gradiens egy
            vektor, ahol minden egyes szám egy-egy paraméterhez ("hozzávalóhoz")
            tartozik. Ez a számsor a veszteség leggyorsabb növelésének irányát
            adja meg. A gradiens tehát egy többdimenziós felület legmeredekebb
            emelkedőjének irányát mutatja meg egy adott pontban. Például, ha a
            gradiens sóra vonatkozóan +2.5, a borsnál pedig -0.1, az azt
            jelenti, hogy a veszteség a leggyorsabban úgy nő, ha növeljük a só
            mennyiségét és csökkentjük a borsét. A számokból az is kiderül, hogy
            a só mennyiségének kis változtatása sokkal nagyobb változást okoz a
            veszteségben, mint a borsé.
          </li>
          <li>
            <span className="font-semibold">A recept módosítása:</span> Mivel a
            célunk a veszteség csökkentése, a hálózat pont a gradienssel
            ellentétes irányba módosítja a paramétereit (súlyok és torzítások).
            Ezt a gradienscsökkenés módszerének (gradient descent) nevezzük.
            Azt, hogy mekkora módosítást végzünk (a kukta hány grammal
            csökkentse a sót), a tanulási ráta (learning rate) határozza meg.
          </li>
          <li>
            <span className="font-semibold">
              Ízkavalkád - a láncszabály szerepe:
            </span>{" "}
            Egy többrétegű neurális hálózatban azonban nem egyszerű
            megállapítani, hogy egy korábbi rétegben található súly vagy
            torzítás mennyiben járult hozzá a végső veszteséghez. Ez olyan,
            mintha a kukta egy süteményt készítene, például egy epres
            csokitortát. A kész torta ízéből érződik, hogy valami nem megfelelő,
            de nem nyilvánvaló, hogy a csokis borításon, a piskótán vagy
            valamelyik apróbb összetevőn kellene változtatni. Itt jelenik meg a
            visszaterjesztés szerepe. A visszaterjesztés a láncszabály
            segítségével a kimeneti rétegtől indulva, rétegről rétegre
            visszafelé haladva számítja ki, hogy az egyes súlyok és torzítások
            milyen mértékben befolyásolták a veszteséget. A torta esetében ez
            ahhoz hasonlítható, mintha a kukta a kész süteményből kiindulva
            elkezdené <span className="italic">szétszerelni</span> a tortát és
            úgy vizsgálná a részeit. Először a borítást, az epret és a piskótát
            vizsgálja, majd tovább bontja a piskótát és a borítást az egyes
            összetevőkre. Így jut el például ahhoz a következtetéshez, hogy ha a
            piskótában csökkenti, a csokis borításban pedig növeli a vaj
            mennyiségét, az az íz javulását eredményezi.
          </li>
        </ul>
        <p className="mt-4">
          Ez a folyamat ismétlődik több százszor, ezerszer vagy milliószor, amíg
          a hálózat "receptje" nem lesz elég kifinomult ahhoz, hogy a kritikus
          (a veszteségfüggvény) alacsony veszteséget adjon.
        </p>
        <p className="mt-2 note">
          A deriválás miatt differenciálható aktivációs és veszteségfüggvények
          szükségesek, a lépcsős aktivációs függvények ezért nem használhatók.
        </p>
      </div>
    </div>
  );
};

export default BackpropBackward;
