import { useState, useMemo, type ReactNode } from "react";
import SimpleBoard from "../../SimpleBoard";
import type {
  SimpleBoardState,
  GameStanding,
  PlayerSymbol,
  TreeNode,
  GameOutcome,
  BoardIndex,
} from "../../../types";

import BeanStalk from "./BeanStalk";

const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];
const checkWinner = (b: SimpleBoardState): GameStanding => {
  for (const [a, b2, c] of WIN_LINES) {
    if (b[a!] && b[a!] === b[b2!] && b[a!] === b[c!])
      return b[a!] as PlayerSymbol;
  }
  if (b.every((cell) => cell !== null)) return "draw";
  return null;
};

const buildTree = (
  board: SimpleBoardState,
  player: PlayerSymbol,
  nextId: { v: number },
  depth = 0,
): TreeNode => {
  const id = nextId.v++;
  const node: TreeNode = {
    id,
    board: board.slice() as SimpleBoardState,
    player,
    children: [],
    depth,
  };
  const result = checkWinner(board);
  if (result) {
    node.score =
      result === "draw" ? 0 : result === "X" ? 10 - depth : depth - 10;
    return node;
  }
  const moves = board
    .map((cell, i) => (cell === null ? i : -1))
    .filter((i) => i >= 0);
  for (const i of moves) {
    const boardDeepCopy = board.slice() as SimpleBoardState;
    boardDeepCopy[i] = player;
    const child = buildTree(
      boardDeepCopy,
      player === "X" ? "O" : "X",
      nextId,
      depth + 1,
    );
    child.moveIndex = i as BoardIndex;
    node.children.push(child);
  }
  if (node.children.length) {
    if (player === "X") {
      node.score = Math.max(
        ...node.children.map((c) => c.score ?? 0),
      ) as GameOutcome;
    } else {
      node.score = Math.min(
        ...node.children.map((c) => c.score ?? 0),
      ) as GameOutcome;
    }
  } else {
    console.error("no children found for non-terminal node", node);
  }
  return node;
};

const baseBoard: SimpleBoardState = [
  null,
  "O",
  "X",
  null,
  "O",
  null,
  null,
  "X",
  null,
] as SimpleBoardState;

const pulseColors: Record<PlayerSymbol, "cyan-400" | "fuchsia-400"> = {
  X: "cyan-400",
  O: "fuchsia-400",
};

const InfoRow = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <div className="flex flex-row justify-between bg-slate-900 py-2 px-4 rounded-lg">
    <span className="text-slate-300">{label}</span>
    {children}
  </div>
);

const MinimaxContent = () => {
  const [board, setBoard] = useState<SimpleBoardState>(baseBoard);
  const [currentPlayer, setCurrentPlayer] = useState<"X" | "O">("X");

  const { bestMove, expectedOutcome, treeTop } = useMemo(() => {
    const treeTop = buildTree(board, currentPlayer, { v: 1 }, 0);

    let expected: GameOutcome = 0;
    if (treeTop.score !== undefined) {
      expected = treeTop.score > 0 ? 1 : treeTop.score < 0 ? -1 : 0;
    }

    let bestMove: BoardIndex | undefined = undefined;
    if (treeTop.children.length > 0) {
      for (const child of treeTop.children) {
        if (child.score === treeTop.score) {
          bestMove = child.moveIndex as BoardIndex;
          break;
        }
      }
    }

    return {
      bestMove: bestMove,
      expectedOutcome: expected,
      treeTop: treeTop,
    };
  }, [board, currentPlayer]);

  const choice = bestMove !== undefined ? bestMove + 1 : undefined;

  return (
    <div className="content-container">
      <h1 className="mb-5 md:mb-10">Minimax</h1>
      <div className="content-box">
        <h2>Mi az a Minimax?</h2>
        <p>
          A minimax algoritmus egy döntéshozatali stratégia, amelyet olyan
          kétjátékos játékokban használnak, ahol a játékosok felváltva lépnek.
          Az algoritmus feltételezi, hogy mindkét játékos optimálisan játszik -
          azaz mindig a legjobb lépéseket teszik meg a győzelem és a vereség
          elkerülésének érdekében.
        </p>
        <p className="mt-4">
          A Maximizer (Max) megpróbálja elérni a lehető legmagasabb pontszámot.
          A Minimizer (Min) megpróbálja elérni a lehető legalacsonyabb
          pontszámot. A tic-tac-toe játékban jellemzően X a Max és O a Min.
        </p>
        <p>
          A tic-tac-toe pontozása általában az X szemszögéből, a következőképpen
          történik: győzelem +1, vereség -1, döntetlen 0. Egyes esetekben
          érdemes bővíteni a pontozást a gyorsabb győzelem és a késleltetett
          vereség érdekében.
        </p>
      </div>
      <div className="content-box mt-4 text-left">
        <h2 className="text-center">Hogy is működik?</h2>
        <p>
          A minimax algoritmus rekurzió segítségével valósítható meg. Minden
          játékos figyelembe veszi az összes lehetséges lépést, és az algoritmus
          kiértékeli a játékfát, hogy meghatározza a legjobb lépést. Az
          algoritmus fő lépései a következők:
        </p>
        <ol className="list-decimal ml-6 mt-4 flex flex-col gap-2">
          <li>
            Az algoritmus veszi az aktuális játékállapotot, és összegyűjti az
            összes lehetséges lépést.
          </li>
          <li>
            Minden lépést megtesz és átadja az új játékállapotot a másik
            játékosnak.
          </li>
          <li>
            Ha a játék nem ért véget, a másik játékos veszi az aktuális
            játékállapotot, és összegyűjti az összes lehetséges lépést.
          </li>
          <li>
            Minden lépést megtesz és visszaadja a lépést az előző játékosnak.
          </li>
          <li>
            Ha egy lépés után a játék véget ér, az algoritmus kiértékeli az
            eredményt.
          </li>
          <li>
            Ha egy útvonalon, ágon végigértünk, az eredmény elkezd visszafelé
            terjedni. Minden játékos figyelembe veszi az összes lehetséges lépés
            által elért eredményt, és kiválasztja a számára legjobb eredményt
            (Max a legmagasabbat, Min a legalacsonyabbat).
          </li>
          <li>
            Ez a folyamat addig folytatódik, amíg vissza nem érünk az útvonal
            elejére / a fa gyökeréhez, ami az eredetileg vizsgált állapot. Az
            algoritmus így az összes lehetséges jövőbeli állapotot figyelembe
            véve választja ki a legjobb lépést.
          </li>
        </ol>
      </div>
      <div className="content-box mt-8 flex flex-col gap-4">
        <p>
          Itt kipróbálhatod a minimax algoritmust élesben! A kiemelt mező a
          soron következő játékos legjobb lépését mutatja. <br />
          Ha mindig a legjobb lépést választod, akkor a játék kimenetele már az
          elején tudható. Figyeld meg, hogyan tudod egyes lépésekkel
          befolyásolni a "Várható eredmény"-t!
        </p>
        <div className="flex flex-col items-center gap-5 md:items-stretch md:flex-row">
          <div className="flex justify-center w-full md:w-1/2">
            <SimpleBoard
              board={board}
              choice={choice}
              onCellClick={(index) => {
                if (board[index] === null) {
                  const newBoard = [...board];
                  newBoard[index] = currentPlayer;
                  setBoard(newBoard as SimpleBoardState);
                  setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
                }
              }}
              disabled={bestMove === undefined}
              pulseColor={pulseColors[currentPlayer]}
            />
          </div>

          <div className="flex flex-col gap-5 normal:gap-10 w-full sm:w-4/6 md:w-1/2">
            <InfoRow label="Jelenlegi játékos:">
              <span
                className={`text-${pulseColors[currentPlayer]} font-semibold`}
              >
                {currentPlayer} ({currentPlayer === "X" ? "Max" : "Min"})
              </span>
            </InfoRow>
            <InfoRow label="Legjobb lépés:">
              <span className="text-slate-300 font-semibold">
                {choice ?? "Vége a játéknak"}
              </span>
            </InfoRow>
            <InfoRow label={choice ? "Várható eredmény:" : "Eredmény:"}>
              <span
                className={`text-${expectedOutcome === 1 ? "cyan-400" : expectedOutcome === -1 ? "fuchsia-400" : "slate-300"} font-semibold`}
              >
                {expectedOutcome === 1
                  ? "X nyer"
                  : expectedOutcome === -1
                    ? "O nyer"
                    : "Döntetlen"}
              </span>
            </InfoRow>
            <div className="w-full rounded-lg mt-auto">
              <button
                className="btn w-full"
                onClick={() => {
                  setBoard(baseBoard);
                  setCurrentPlayer("X");
                }}
              >
                Törlés
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="content-box mt-10">
        <h2>Minimax Fa</h2>
        <p className="mt-2">
          Itt a fenti táblához tartozó rekurzívan felépített minimax fa látható,
          amelyet az algoritmus a döntés meghozatalához használ. Amennyiben a
          állás játékosa X, a "gyerek" állások közül a legmagasabb pontszámot
          választja, ha O, akkor a legalacsonyabbat. A Lépés mező mutatja, hogy
          az adott állás hogyan keletkezett az őt megelőzőből.
        </p>

        <BeanStalk node={treeTop} />
      </div>
    </div>
  );
};
export default MinimaxContent;
