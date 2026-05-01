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
          A visszaterjesztés (backpropagation) a neurális hálózatok tanításában
          használt algoritmus, amely a modell kimenete és a várt kimenet alapján
          számított veszteségből kiindulva, a láncszabály segítségével rétegről
          rétegre visszafelé haladva meghatározza, hogy az egyes súlyok és
          torzítások milyen mértékben járultak hozzá a veszteséghez. Ezt az
          összefüggést a veszteségfüggvény adott paraméterre vonatkozó gradiense
          fejezi ki. A tanítás során ezeket a gradienseket használjuk fel arra,
          hogy a paramétereket a veszteség csökkenésének irányába módosítsuk.
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
