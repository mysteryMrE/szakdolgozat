const BackpropBackward = () => {
  return (
    <div className="content-box mt-4 ">
      <h2>A visszaterjesztés folyamata</h2>
      <p>
        Képzeljünk el egy ambiciózus kuktát! A kukta lehetőséget kap arra, hogy
        egy elismert ételkritikus véleményezze a főztjét. A kifinomult ízlésű
        kritikus nemcsak egy pontszámot ad ("Ez 3/10-es"), hanem konkrét, segítő
        visszajelzést is: "túl sós, de nem elég édes". A kukta visszamegy a
        konyhába és a kritika alapján módosítja a receptet. Ez a folyamat addig
        ismétlődik, amíg a kritikus elégedett nem lesz az étellel.
      </p>
      <div className="mt-4 flex flex-col items-center leading-relaxed">
        <p className="mt-4 font-semibold ">
          A neuronhálók esetén egy nagyon hasonló folyamat zajlik le:
        </p>
        <ul className="list-decimal list-inside mt-2 text-left w-5/6 space-y-3">
          <li>
            <span className="font-semibold">Az étel elkészítése:</span> A
            neurális hálózat a bemeneti adatok alapján elvégzi a számításokat,
            és előállít egy kimenetet (ez a "főzés").
          </li>
          <li>
            <span className="font-semibold">A kritikus véleménye:</span> A
            veszteségfüggvény (a "kritikus") összehasonlítja a hálózat kimenetét
            a várt, helyes eredménnyel, és kiszámolja a veszteség mértékét. Ez
            olyan, mint a kritikus 3/10-es pontszáma - megmondja, mekkora a
            "baj", de önmagában nem árulja el, hogy az egyes összetevők milyen
            mértékben járultak hozzá.
          </li>
          <li>
            <span className="font-semibold">
              A segítő kritika - A Gradiens:
            </span>{" "}
            Ennek a lépésnek a célja, hogy megkapjuk a "segítő kritikát", ami
            megmondja, melyik "hozzávalón" (súlyon és torzításon) és hogyan kell
            változtatni. Erre a "kritikára" hasonlít a gradiens. <br />A
            gradiens egy vektor, ahol minden egyes szám egy-egy "hozzávalóhoz"
            (paraméterhez) tartozik. Ez a számsor, lista a hiba leggyorsabb
            növelésének "receptje" (a gradiens tehát egy X dimenziós felület
            legmeredekebb emelkedőjének irányát mutatja meg egy adott pontban).
            Például, ha a gradiens sóra vonatkozóan +2.5, a borsnál pedig -0.1,
            az azt jelenti, hogy a hiba a leggyorsabban úgy nő, ha növeljük a só
            mennyiségét és csökkentjük a borsét. A számokból az is kiderül, hogy
            a só mennyiségének kis változtatása sokkal nagyobb változást okoz a
            hibában, mint a borsé.
          </li>
          <li>
            <span className="font-semibold">
              A recept módosítása - Gradiens Ereszkedés:
            </span>{" "}
            Mivel a célunk a hiba csökkentése, a hálózat pont a gradienssel
            ellentétes irányba módosítja a paramétereit (súlyok és torzítások).
            Ezt hívják gradiens ereszkedésnek (gradient descent). Azt, hogy
            mekkorát lépjünk ebben az ellentétes irányban (a kukta hány grammal
            csökkentse a sót), a tanulási ráta (learning rate) határozza meg.
          </li>
          <li>
            <span className="font-semibold">
              Ízkavalkád - A visszaterjesztés és a láncszabály szerepe:
            </span>{" "}
            A hozzávalók (paraméterek) sokasága és összetettsége (több lépéses
            recept - több réteg) miatt a gradiens kiszámítása nem egyszerű. A
            sütőből kivett csokitortából (a kimenetből) nem lehet közvetlenül
            megállapítani minden egyes hozzávaló pontos hatását a végső ízre.
            Itt jön képbe a visszaterjesztés algoritmusa, amely a deriválási
            láncszabályt használja. Maga a "visszaterjesztés" onnan kapta a
            nevét, hogy a hibát a kimeneti rétegnél kezdjük el elemezni, majd a
            deriválási láncszabály segítségével haladunk visszafelé, rétegről
            rétegre, egészen a bemenetig. Így minden egyes súly és torzítás
            gradiense kiszámításra kerül, és a hálózat tudja, hogyan módosítsa
            ezeket a paramétereket a hiba csökkentése érdekében. <br />
            Térjünk vissza a csokitortához, legyen rajta eper is. A szeletbe
            harapva valami nem stimmel. A torta 3 fő része a csokis borítás, a
            friss eper és a puha piskóta. Az eper tökéletes, így a hibát a
            csokis borítás és a piskóta között keressük. Külön-külön kóstolva
            egyik sem állja meg igazán a helyét. A torta{" "}
            <span className="italic">szétszerelése</span> közben számontartjuk,
            hogy az egyes részeket hogyan érdemes változtatni az íz javításához.
            Végül arra jutunk, hogy ha a piskótában csökkentenénk, a csokis
            borításban pedig növelnénk a vaj mennyiségét, akkor javulna az íz.
          </li>
        </ul>
        <p className="mt-4">
          Ez a folyamat ismétlődik több százszor, ezerszer vagy milliószor, amíg
          a hálózat "receptje" elég kifinomult nem lesz ahhoz, hogy a kritikus
          (a veszteségfüggvény) alacsony hibát adjon, azaz a hálózat pontos
          előrejelzéseket tegyen.
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
