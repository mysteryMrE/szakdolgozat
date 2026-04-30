import { useState, useEffect } from "react";
import SpinningWheel from "../../SpinningWheel";

import type { SimpleBoardState } from "../../../types";
import SimpleBoard from "../../SimpleBoard";

const RandomContent = () => {
  const [board, setBoard] = useState<SimpleBoardState>(
    Array.from({ length: 9 }, () => null) as SimpleBoardState,
  );
  const [isSpinning, setIsSpinning] = useState(false);
  const [choice, setChoice] = useState<number | null>(null);

  const smallWheel = 199;
  const bigWheel = 296;

  const [wheelSize, setWheelSize] = useState(
    window.innerWidth < 1024 ? smallWheel : bigWheel,
  );

  useEffect(() => {
    const handleResize = () => {
      setWheelSize(window.innerWidth < 1024 ? smallWheel : bigWheel);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const emptyCells = board.filter((cell) => cell === null).length;

  console.log("Current choice:", choice);
  return (
    <div className="content-container flex flex-col gap-5 md:gap-10 min-h-fit">
      <h1>Random Ellenfél</h1>
      <div className="content-box">
        <p>
          A random ellenfél veszi a játéktábla üres mezőit, és véletlenszerűen
          választ egyet közülük. A választás során nem veszi figyelembe a játék
          állását, minden mezőt ugyanakkora valószínűséggel választ.
        </p>
      </div>
      <div className="content-box">
        <p>
          Az alábbi játéktábla mezőire kattintva beállíthatóak a foglalt/üres
          mezők. A kerékre kattintva a random ellenfél kiválaszt egy üres mezőt.
        </p>
      </div>
      <div className="content-box flex flex-col md:flex-row gap-5 md:gap-10">
        <SimpleBoard
          board={board}
          disabled={isSpinning}
          choice={choice === null ? undefined : choice}
          onCellClick={(index) => {
            const newBoard = [...board] as SimpleBoardState;
            newBoard[index] = newBoard[index] === null ? "?" : null;
            setBoard(newBoard);
            setChoice(null);
          }}
        />
        <SpinningWheel
          values={board.reduce((indexes, cell, index) => {
            if (cell === null) {
              indexes.push(index + 1);
            }
            return indexes;
          }, [] as number[])}
          probabilities={Array.from({ length: emptyCells }, () => 1)}
          size={wheelSize}
          isSpinning={setIsSpinning}
          setChoice={setChoice}
        />
      </div>
    </div>
  );
};

export default RandomContent;
