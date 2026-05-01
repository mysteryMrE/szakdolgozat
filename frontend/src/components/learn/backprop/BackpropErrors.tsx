import MSEContent from "./errors/MSEContent";
import CrossEntropyContent from "./errors/CrossEntropyContent";

const BackpropErrors = () => {
  return (
    <div className="content-box mt-4">
      <h2>Veszteség</h2>
      <p>
        A veszteségfüggvény (loss function) méri a hálózat kimenetének és a várt
        kimenetnek a különbségét. A visszaterjesztés során a veszteség függvény
        gradiensét számítjuk ki, hogy meghatározzuk, hogyan kell frissíteni a
        súlyokat és a torzításokat. Gyakran használt veszteségfüggvények az
        átlagos négyzetes hiba (Mean Squared Error) és a keresztentrópia
        veszteség (Cross-Entropy Loss). Utóbbit klasszifikációs feladatoknál
        használják, sokszor a softmax függvénnyel kombinálva. A Tic-Tac-Toe
        esetén mi is ezt használjuk.
      </p>
      <MSEContent />
      <CrossEntropyContent />
    </div>
  );
};

export default BackpropErrors;
