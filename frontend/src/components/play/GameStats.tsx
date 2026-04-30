import { type GameState } from "../../types";
import { useWindowSize } from "../../contexts/WindowSizeContext";

interface GameStatsProps {
  gameState: GameState | null;
}

const GameStats = ({ gameState }: GameStatsProps) => {
  const { isAboveSm } = useWindowSize();
  if (!gameState) return null;

  const { curr_round, rounds, x_o_draw } = gameState;

  const colorClass = (player: string) =>
    player === "X" ? "text-cyan-400" : player === "O" ? "text-fuchsia-400" : "";

  return (
    <div
      aria-label="Game statistics"
      data-testid="game-stats"
      className="bg-gray-800 rounded-2xl p-4 mx-auto w-full max-w-md"
    >
      <div
        aria-label="Rounds information"
        data-testid="stats-rounds"
        className="text-center text-gray-300 text-lg font-semibold mb-3"
      >
        {curr_round} / {rounds}
      </div>

      {isAboveSm && (
        <div className="grid grid-cols-3 gap-10 text-center">
          <dl>
            <dt
              className={`uppercase text-sm font-semibold ${colorClass("X")}`}
            >
              X Győzelmek
            </dt>
            <dd
              data-testid="stats-x-wins"
              className={`text-xl font-bold ${colorClass("X")}`}
            >
              {x_o_draw.X}
            </dd>
          </dl>
          <dl>
            <dt className="uppercase text-sm font-semibold text-gray-300">
              Döntetlenek
            </dt>
            <dd
              data-testid="stats-draw"
              className="text-xl font-bold text-gray-200"
            >
              {x_o_draw.draw}
            </dd>
          </dl>
          <dl>
            <dt
              className={`uppercase text-sm font-semibold ${colorClass("O")}`}
            >
              O Győzelmek
            </dt>
            <dd
              data-testid="stats-o-wins"
              className={`text-xl font-bold ${colorClass("O")}`}
            >
              {x_o_draw.O}
            </dd>
          </dl>
        </div>
      )}
      {!isAboveSm && (
        <div className="flex flex-col text-center">
          <dl>
            <dt className="uppercase text-sm font-semibold text-gray-300">
              Döntetlenek
            </dt>
            <dd
              data-testid="stats-draw"
              className="text-xl font-bold text-gray-200"
            >
              {x_o_draw.draw}
            </dd>
          </dl>
          <div className="flex flex-row mt-0 justify-around gap-10">
            <dl>
              <dt
                className={`uppercase text-sm font-semibold ${colorClass("X")}`}
              >
                X Győzelmek
              </dt>
              <dd
                data-testid="stats-x-wins"
                className={`text-xl font-bold ${colorClass("X")}`}
              >
                {x_o_draw.X}
              </dd>
            </dl>
            <dl>
              <dt
                className={`uppercase text-sm font-semibold ${colorClass("O")}`}
              >
                O Győzelmek
              </dt>
              <dd
                data-testid="stats-o-wins"
                className={`text-xl font-bold ${colorClass("O")}`}
              >
                {x_o_draw.O}
              </dd>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameStats;
