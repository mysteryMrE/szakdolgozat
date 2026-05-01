import { useEffect, useState, useRef } from "react";
import SpinningWheel from "../../SpinningWheel";
import { chooseWeighted } from "../../../utils";

import type { SimpleBoardState } from "../../../types";
import SimpleBoard from "../../SimpleBoard";
import MenaceTrainSimulation from "./MenaceTrainSimulation";

const tableHeadStyle = "px-1 py-1 md:px-4 md:py-2 text-sm text-slate-100";
const tableRowStyle = "px-1 py-1 md:px-4 md:py-2 text-sm text-slate-200";

const symMaps = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8],
  [6, 3, 0, 7, 4, 1, 8, 5, 2],
  [8, 7, 6, 5, 4, 3, 2, 1, 0],
  [2, 5, 8, 1, 4, 7, 0, 3, 6],
  [2, 1, 0, 5, 4, 3, 8, 7, 6],
  [6, 7, 8, 3, 4, 5, 0, 1, 2],
  [0, 3, 6, 1, 4, 7, 2, 5, 8],
  [8, 5, 2, 7, 4, 1, 6, 3, 0],
];

const canonicalWithMap = (
  board: string,
): { canonBoard: string; mapping: number[] } => {
  let bestMapping: number[] = symMaps[0]!;
  let bestBoard = bestMapping.map((index) => board[index]).join("");

  for (const mapping of symMaps) {
    const candi = mapping.map((index) => board[index]).join("");
    if (candi < bestBoard) {
      bestBoard = candi;
      bestMapping = mapping;
    }
  }

  return { canonBoard: bestBoard, mapping: bestMapping };
};

const checkWinner = (
  board: SimpleBoardState,
): "X" | "O" | "draw" | null | "?" => {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (const [a, b, c] of lines) {
    if (
      board[a as number] &&
      board[a as number] === board[b as number] &&
      board[a as number] === board[c as number] &&
      board[a as number] !== null
    ) {
      return board[a as number] ?? null;
    }
  }
  return board.every((cell) => cell !== null) ? "draw" : null;
};

const validBoard = (board: string): boolean => {
  const xCount = board.split("X").length - 1;
  const oCount = board.split("O").length - 1;
  return xCount === oCount || xCount === oCount + 1;
};

const MenaceContent = () => {
  const [board, setBoard] = useState<SimpleBoardState>(
    Array(9).fill(null) as SimpleBoardState,
  );
  const [gamesTrained, setGamesTrained] = useState(0);
  const [probabilities, setProbabilities] = useState<number[]>([]);
  const boards = useRef<Record<string, Record<number, number>>>({});
  const [isSpinning, setIsSpinning] = useState(false);
  const [choice, setChoice] = useState<number | null>(null);
  const [stats, setStats] = useState<
    Record<"X" | "O", Record<"X" | "O" | "draw", number>>
  >({ X: { X: 0, O: 0, draw: 0 }, O: { X: 0, O: 0, draw: 0 } });
  const [wheelResetToken, setWheelResetToken] = useState(0);
  const isPlayingRef = useRef(false);

  const generateStringBoard = () => {
    const results: string[] = [];
    board.forEach((cell) => {
      if (cell === null) {
        results.push("_");
      } else if (cell === "X") {
        results.push("X");
      } else if (cell === "O") {
        results.push("O");
      } else {
        console.warn("Unexpected cell value:", cell);
      }
    });
    return results.join("");
  };

  const ensureMatchbox = (stringBoard: string) => {
    const { canonBoard } = canonicalWithMap(stringBoard);
    if (!(canonBoard in boards.current)) {
      if (validBoard(canonBoard) && canonBoard.includes("_")) {
        const empties = [...canonBoard]
          .map((value, index) => (value === "_" ? index : -1))
          .filter((index) => index !== -1);
        const matchbox: Record<number, number> = {};
        empties.forEach((indexValue) => {
          matchbox[indexValue] = 3;
        });
        boards.current[canonBoard] = matchbox;
      }
    }
    return canonicalWithMap(stringBoard);
  };

  const generateProbabilities = () => {
    const stringBoard = generateStringBoard();
    const { canonBoard, mapping } = ensureMatchbox(stringBoard);
    if (canonBoard in boards.current) {
      const matchbox = boards.current[canonBoard]!;
      const inverseMapping = Object.fromEntries(
        mapping.map((realIndex, canonicalIndex) => [realIndex, canonicalIndex]),
      );
      return board
        .map((cell, realIndex) => {
          if (cell === null) {
            const canonIndex = inverseMapping[realIndex]!;
            const beadCount = matchbox[canonIndex] ?? 1;
            return beadCount;
          }
          return null;
        })
        .filter((value): value is number => value !== null);
    } else {
      console.error("No existing board, impossible code path.");
      return board.map((cell) => (cell === null ? 1 : 0));
    }
  };

  useEffect(() => {
    setProbabilities(generateProbabilities());
  }, [board]);

  const pickMenaceMove = (
    stringBoard: string,
  ): { board: string; move: number; realMove: number } => {
    const { canonBoard, mapping } = ensureMatchbox(stringBoard);
    if (!validBoard(stringBoard)) {
      console.error("Invalid board in pickMenaceMove:", stringBoard);
    }

    const matchbox = boards.current[canonBoard]!;
    const entries = Object.entries(matchbox);
    const move = chooseWeighted(
      entries.map(([pos]) => Number(pos)),
      entries.map(([, beadCount]) => beadCount),
    );

    return {
      board: canonBoard,
      move,
      realMove: mapping[move]!,
    };
  };

  const playOneGame = (
    menacePlaysAs: "X" | "O",
    drawReward: number,
    winReward: number,
    losePunishment: number,
  ): "X" | "O" | "draw" | null => {
    const board: SimpleBoardState = Array(9).fill(null) as SimpleBoardState;
    const history: { board: string; move: number }[] = [];
    let current: "X" | "O" = "X";
    let result: "X" | "O" | "draw" | null | "?" = null;
    while (true) {
      result = checkWinner(board);
      if (result) {
        if (!(drawReward === 0 && winReward === 0 && losePunishment === 0)) {
          for (const { board: b, move } of history) {
            const matchbox = boards.current[b]!;
            if (result === "draw") {
              matchbox[move]! += drawReward;
            } else if (result === menacePlaysAs) {
              matchbox[move]! += winReward;
            } else {
              matchbox[move]! = Math.max(1, matchbox[move]! - losePunishment);
            }
          }
        }
        break;
      }

      if (current === menacePlaysAs) {
        const stringBoard = board.map((c) => c ?? "_").join("");
        const {
          board: canonicalBoard,
          move,
          realMove,
        } = pickMenaceMove(stringBoard);
        history.push({ board: canonicalBoard, move });
        board[realMove] = menacePlaysAs;
      } else {
        const empties = board
          .map((cell, i) => (cell === null ? i : -1))
          .filter((i) => i !== -1);
        const randMove = empties[Math.floor(Math.random() * empties.length)]!;
        board[randMove] = menacePlaysAs === "X" ? "O" : "X";
      }

      current = current === "X" ? "O" : "X";
    }
    return result != "?" ? result : null;
  };

  const playAndTrain = (
    numGames: number,
    winReward: number,
    drawReward: number,
    losePunishment: number,
  ) => {
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;
    try {
      for (let i = 0; i < numGames; i++) {
        playOneGame("X", drawReward, winReward, losePunishment);
        playOneGame("O", drawReward, winReward, losePunishment);
      }
      setProbabilities(generateProbabilities());
      setChoice(null);
      console.log("Training completed over", numGames * 2, "games.");
      console.log("Current boards state:", boards.current);
      setGamesTrained((prev) => prev + numGames);
    } finally {
      setTimeout(() => {
        isPlayingRef.current = false;
      }, 250);
    }
  };

  const play = (
    numGames: number,
    drawReward: number,
    winReward: number,
    losePunishment: number,
  ) => {
    const stats: Record<"X" | "O" | "draw", number> = { X: 0, O: 0, draw: 0 };
    const stats2: Record<"X" | "O" | "draw", number> = { X: 0, O: 0, draw: 0 };
    for (let i = 0; i < numGames; i++) {
      const result = playOneGame("X", drawReward, winReward, losePunishment);
      if (result) {
        stats[result as "X" | "O" | "draw"]++;
      }
      const result2 = playOneGame("O", drawReward, winReward, losePunishment);
      if (result2) {
        stats2[result2 as "X" | "O" | "draw"]++;
      }
    }
    console.log("Stats after", numGames, "games:", stats);
    console.log("Stats after", numGames, "games:", stats2);
    setStats({ X: stats, O: stats2 });
  };

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

  useEffect(() => {
    setWheelResetToken((prev) => prev + 1);
  }, [board, probabilities]);

  const currentBoardKey = generateStringBoard();
  const boardWinner = checkWinner(board);
  const hasEmptyCell = board.includes(null);
  const isBoardValid = validBoard(currentBoardKey);
  const isBoardPlayable = isBoardValid && hasEmptyCell && boardWinner === null;
  const wheelValues = isBoardPlayable
    ? board.reduce((indexes, cell, index) => {
        if (cell === null) {
          indexes.push(index + 1);
        }
        return indexes;
      }, [] as number[])
    : [];
  const wheelProbabilitiesRaw = isBoardPlayable ? probabilities : [];
  const wheelProbabilities =
    wheelValues.length === wheelProbabilitiesRaw.length
      ? wheelProbabilitiesRaw
      : wheelValues.map(() => 1);

  return (
    <div className="content-container min-h-fit">
      <h1 className="mb-5 md:mb-10">MENACE</h1>
      <div className="content-box ">
        <p>
          A MENACE (angolul Matchbox Educable Noughts And Crosses Engine) egy
          egyszerű, de "okos" tic-tac-toe játékos, amelyet Donald Michie talált
          ki 1961-ben.
        </p>
        <p className="mt-2">
          Donald Michie MENACE-e egy gyufásdobozokból álló gép, ahol minden
          doboz egy adott játéktáblát reprezentál. Az egyes dobozokban színes
          gyöngyök vannak, a különböző színek a különböző üres mezőket, azaz a
          lehetséges lépéseket jelölik. Amikor a MENACE játszik, kiválasztja a
          jelenlegi játéktáblának megfelelő gyufásdobozt, majd a dobozban lévő
          gyöngyök közül véletlenszerűen kihúz egyet, és megteszi a gyöngy által
          reprezentált lépést. <br />A menet végén attól függően, hogy a menet
          kimenetele győzelem, vereség vagy döntetlen volt, a MENACE jutalmat
          vagy büntetést kap. <br />
          Győzelem esetén a kihúzott gyöngyök visszakerülnek a megfelelő
          dobozokba, és minden ilyen dobozba még három, a megtett lépést
          reprezentáló gyöngyöt teszünk. <br />
          Döntetlen esetén minden kihúzott gyöngy visszakerül a dobozába, plusz
          egy azonos színű gyöngy. <br />
          Vereség esetén egyik gyöngy sem kerül vissza a dobozába.
          <br />
        </p>
        <p className="">
          Donald Michie MENACE-e ezzel a tanulási mechanizmussal képes volt
          javítani a játékán, a győzelemhez vezető lépéseknek egyre nagyobb, a
          vereséghez vezető lépéseknek pedig egyre kisebb esélye lett. <br /> A
          MENACE az egyik első példa volt a megerősítéses gépi tanulásra.
        </p>
      </div>
      <MenaceTrainSimulation wheelSize={wheelSize} />
      <div className="content-box mt-10">
        <p>
          Alább egy egyszerű MENACE bemutató látható. <br />A táblán
          előállítható egy játékállás, ahol a következő lépés megtétele a MENACE
          feladata. <br />A szerencsekerék szeletei a játéktáblának megfelelő
          gyufásdobozban lévő különböző gyöngyöket (azaz lehetséges lépéseket)
          reprezentálják. A körszeletek mérete a gyöngyök számától függ, így a
          jobbnak ítélt lépések nagyobb eséllyel kerülnek kiválasztásra.
        </p>
        <p className="mt-4">
          A mező értéke lehet X, O vagy üres, a mezőre kattintva lehet váltani a
          három állapot között. <br />A szerencsekerék akkor lesz aktív, ha a
          táblán egy olyan érvényes állás van, ahol a játék még nem ért véget.
          <br />A "Törlés" gombbal a tábla alaphelyzetbe állítható.
          <br />A "Tanítás" gomb megnyomásával a MENACE 10 000 játékot játszik
          le véletlenszerűen lépő ellenfél ellen, mindkét oldalon. <br />A
          "Statisztika" gomb megnyomásával a MENACE 1000 játékot játszik le
          random ellenfél ellen, mindkét oldalon. <br />A "Nullázás" gombbal
          minden gyufásdoboz alaphelyzetbe kerül, ilyenkor a MENACE úgy játszik,
          mint egy véletlenszerűen lépő játékos.
        </p>
      </div>

      <div className="content-box mt-10 flex flex-col items-center">
        <div className="flex flex-col gap-4 md:flex-row items-center md:justify-around md:gap-0 w-full">
          <SimpleBoard
            board={board}
            onCellClick={(index) => {
              const newBoard = [...board] as SimpleBoardState;
              newBoard[index] =
                newBoard[index] === null
                  ? "X"
                  : newBoard[index] === "X"
                    ? "O"
                    : null;
              setBoard(newBoard);
              setChoice(null);
            }}
            disabled={isSpinning}
            choice={choice === null ? undefined : choice}
          />
          <SpinningWheel
            values={wheelValues}
            probabilities={wheelProbabilities}
            size={wheelSize}
            isSpinning={setIsSpinning}
            setChoice={setChoice}
            disabled={!isBoardPlayable}
            resetToken={wheelResetToken}
          />
        </div>
        <div className="grid grid-cols-2 mt-3 mb-3 md:mt-4 md:mb-4 md:flex md:flex-row gap-3 md:gap-8">
          <button
            className="btn"
            onClick={() => {
              setBoard(Array(9).fill(null) as SimpleBoardState);
              setChoice(null);
            }}
          >
            Törlés
          </button>
          <button
            className={`btn ${isSpinning || gamesTrained >= 500_000 ? "btn-disabled opacity-50" : ""}`}
            onClick={() => playAndTrain(10000, 3, 1, 1)}
            disabled={isSpinning || gamesTrained >= 500_000}
          >
            Tanítás
          </button>
          <button
            className="btn"
            onClick={() => {
              play(1000, 0, 0, 0);
            }}
          >
            Statisztika
          </button>
          <button
            className="btn"
            onClick={() => {
              boards.current = {};
              setBoard(Array(9).fill(null) as SimpleBoardState);
              setProbabilities([]);
              setChoice(null);
              setIsSpinning(false);
              setStats({
                X: { X: 0, O: 0, draw: 0 },
                O: { X: 0, O: 0, draw: 0 },
              });
              setGamesTrained(0);
            }}
          >
            Nullázás
          </button>
        </div>

        <div className="w-full max-w-2xl overflow-x-auto mt-3 md:mt-5">
          <table
            aria-label="Statisztika random ellen"
            className="w-full text-center border-separate border-spacing-y-2"
          >
            <caption className="mb-1 text-sm text-slate-300">
              Random ellen - {gamesTrained} oktató játék után
            </caption>
            <thead>
              <tr>
                <th className={tableHeadStyle}>Játékos</th>
                <th className={tableHeadStyle}>Győzelem</th>
                <th className={tableHeadStyle}>Vereség</th>
                <th className={tableHeadStyle}>Döntetlen</th>
              </tr>
            </thead>
            <tbody>
              {(["X", "O"] as const).map((key) => {
                const stat = stats[key];
                const wins = key === "X" ? stat.X : stat.O;
                const losses = key === "X" ? stat.O : stat.X;

                return (
                  <tr key={key} className="bg-slate-900 ">
                    <th
                      scope="row"
                      className={`${tableRowStyle} rounded-l-md md:rounded-l-xl ${key === "X" ? "!text-cyan-300" : "!text-fuchsia-400"}`}
                    >
                      {key}
                    </th>
                    <td className={`${tableRowStyle} `}>
                      {(wins / 10).toFixed(1)}%
                    </td>
                    <td className={`${tableRowStyle} `}>
                      {(losses / 10).toFixed(1)}%
                    </td>
                    <td
                      className={`${tableRowStyle} rounded-r-md md:rounded-r-xl`}
                    >
                      {(stat.draw / 10).toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="content-box mt-10">
        <p>
          A tanítás eredményeként MENACE sokkal jobban játszik, mint egy
          véletlenszerűen lépő játékos, de nem tökéletes. Például bizonyos
          esetekben megfigyelhető, hogy nem blokkolja az ellenfél azonnali
          győzelmét, hanem inkább a saját győzelmét készíti elő. Ennek oka, hogy
          egy véletlenszerűen lépő ellenfél sokszor nem bünteti meg ezt a hibát,
          és a győzelemért járó jutalom nagyobb, mint a vereségért járó
          büntetés, így MENACE vállalja a kockázatot. A kezdőlapon kipróbálható
          MENACE, ezért a véletlenszerűen játszó játékoson felül saját maga
          ellen is tanítva lett.
        </p>
      </div>
    </div>
  );
};

export default MenaceContent;
