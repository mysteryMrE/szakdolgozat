import { useState, useRef, useMemo, useEffect } from "react";
import type {
  BoardStateWithNumbers,
  CellWithNumbers,
  MenaceAnimStep as AnimStep,
} from "../../../types";
import SimpleBoard from "../../SimpleBoard";
import SpinningWheel from "../../SpinningWheel";

import { useWindowSize } from "../../../contexts/WindowSizeContext";
import DropDown from "../../DropDown";

type RewardType = 0 | 2 | 4;

interface MenaceTrainSimulationProps {
  wheelSize: number;
}

const choiceIndexToNameMap: { [key: number]: string } = {
  2: "Győzelem",
  1: "Döntetlen",
  0: "Vereség",
};

interface AnimationContext {
  board: BoardStateWithNumbers;
  setBoard: (board: BoardStateWithNumbers) => void;
  picks: number[];
  pickIndex: number;
  setPickIndex: (index: number) => void;
  spinChoice: number | undefined;
  setSpinChoice: (choice: number | undefined) => void;
  forcedTarget: number | undefined;
  setForcedTarget: (target: number | undefined) => void;
  wheelKey: number;
  incrementWheelKey: () => void;
  frozenWheelValues: number[];
  setFrozenWheelValues: (values: number[]) => void;
  frozenWheelProbs: number[];
  setFrozenWheelProbs: (probs: number[]) => void;
  rewardAmount: RewardType;
  calcAndSetFrozenWheel: (boardState: BoardStateWithNumbers | null) => void;
}

interface StateConfig {
  id: AnimStep;
  buttonText: string;
  /**
   * Handles effects and state transitions
   * @param {AnimationContext} ctx
   * @returns Return true to advance to next index, false to stop, or specific step to jump to
   */
  handler: (ctx: AnimationContext) => Promise<boolean | AnimStep>;
}

const FORWARD_STEP_ORDER: AnimStep[] = [
  "select_matchbox",
  "spin_wheel",
  "make_move",
  "opponent_move",
  "forward_end",
];

const TEACHING_STEP_ORDER: AnimStep[] = [
  "remove_opponent_move",
  "remove_menace_move",
  "select_matchbox_for_reward",
  "add_reward_beads",
  "put_back_matchbox",
  "animation_end",
];

const getStepIndex = (step: AnimStep, order: AnimStep[]): number => {
  return order.indexOf(step);
};

const getNextStep = (
  currentStep: AnimStep,
  order: AnimStep[],
): AnimStep | null => {
  const currentIndex = getStepIndex(currentStep, order);
  if (currentIndex === -1 || currentIndex === order.length - 1) {
    return null;
  }
  return order[currentIndex + 1] ?? null;
};

const BASE_BEADS_AMOUNT = 3;

const createForwardStates = (): StateConfig[] => [
  {
    id: "select_matchbox",
    buttonText: "Gyufásdoboz kiválasztása",
    handler: async (ctx) => {
      console.log("Step: Select matchbox");

      const boardWithNumbers = ctx.board.map((cell) => {
        if (cell === null) return BASE_BEADS_AMOUNT;
        return cell;
      }) as BoardStateWithNumbers;

      ctx.setBoard(boardWithNumbers);
      ctx.calcAndSetFrozenWheel(boardWithNumbers);

      return true;
    },
  },
  {
    id: "spin_wheel",
    buttonText: "Gyöngy kihúzása",
    handler: async (ctx) => {
      const targetIndex = ctx.picks[ctx.pickIndex];
      if (targetIndex === undefined) {
        return false;
      }

      console.log("Step: Spin wheel, targeting index:", targetIndex);

      ctx.incrementWheelKey();
      ctx.setForcedTarget(targetIndex + 1);

      await new Promise((resolve) => setTimeout(resolve, 3500));
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const newBoard = ctx.board.slice();
      if (typeof newBoard[targetIndex] === "number") {
        newBoard[targetIndex] = (newBoard[targetIndex] as number) - 1;
        ctx.setBoard(newBoard as BoardStateWithNumbers);
      }

      return true;
    },
  },
  {
    id: "make_move",
    buttonText: "MENACE lépés megtétele",
    handler: async (ctx) => {
      const targetIndex = ctx.picks[ctx.pickIndex];

      console.log("Step: Make MENACE move at index:", targetIndex);

      ctx.setSpinChoice(undefined);

      const newBoard = ctx.board.map((cell, idx) => {
        if (idx === targetIndex) return "X";
        if (typeof cell === "number") return null;
        return cell;
      }) as CellWithNumbers[];
      ctx.setBoard(newBoard as BoardStateWithNumbers);

      ctx.calcAndSetFrozenWheel(null);
      ctx.setForcedTarget(undefined);

      ctx.setPickIndex(ctx.pickIndex + 1);

      // Potential ending state
      if (ctx.pickIndex + 1 >= ctx.picks.length) {
        return "forward_end";
      } else {
        return true;
      }
    },
  },
  {
    id: "opponent_move",
    buttonText: "Ellenfél lépése",
    handler: async (ctx) => {
      const targetIndex = ctx.picks[ctx.pickIndex];
      if (targetIndex === undefined) {
        return false;
      }

      console.log("Step: Opponent move at index:", targetIndex);

      const newBoard = ctx.board.slice();
      newBoard[targetIndex] = "O";
      ctx.setBoard(newBoard as BoardStateWithNumbers);

      ctx.setPickIndex(ctx.pickIndex + 1);

      // potential ending state + loop back
      if (ctx.pickIndex + 1 >= ctx.picks.length) {
        return "forward_end";
      } else {
        return "select_matchbox";
      }
    },
  },
  {
    id: "forward_end",
    buttonText: "Tanítás",
    handler: async () => {
      // this won't be called because the button onclick changes
      // in this state
      return false;
    },
  },
];

// Teaching mode states (rewarding)
const createTeachingStates = (): StateConfig[] => [
  {
    id: "remove_opponent_move",
    buttonText: "Ellenfél lépés törlése",
    handler: async (ctx) => {
      const targetIndex = ctx.picks[ctx.pickIndex - 1];

      if (targetIndex === undefined) {
        return false;
      }

      console.log(
        "Teaching: Remove opponent move at index:",
        targetIndex,
        "pickIndex before:",
        ctx.pickIndex,
      );

      const newBoard = ctx.board.slice();
      newBoard[targetIndex] = null;
      ctx.setBoard(newBoard as BoardStateWithNumbers);

      ctx.setPickIndex(ctx.pickIndex - 1);
      console.log("Teaching: pickIndex after decrement:", ctx.pickIndex - 1);

      return true;
    },
  },
  {
    id: "remove_menace_move",
    buttonText: "MENACE lépés törlése",
    handler: async (ctx) => {
      const targetIndex = ctx.picks[ctx.pickIndex - 1];

      if (targetIndex === undefined) {
        console.log(
          "ERROR: targetIndex is undefined!",
          "pickIndex:",
          ctx.pickIndex,
          "picks:",
          ctx.picks,
        );
        return false;
      }

      console.log(
        "Teaching: Remove MENACE move at index:",
        targetIndex,
        "pickIndex before:",
        ctx.pickIndex,
        "Board before:",
        ctx.board,
        "Cell value:",
        ctx.board[targetIndex],
      );

      const newBoard = ctx.board.slice();
      if (newBoard[targetIndex] !== "X") {
        console.log(
          "WARNING: Expected X at position",
          targetIndex,
          "but found:",
          newBoard[targetIndex],
        );
      }
      newBoard[targetIndex] = null;
      ctx.setBoard(newBoard as BoardStateWithNumbers);

      ctx.setPickIndex(ctx.pickIndex - 1);
      console.log("Teaching: pickIndex after decrement:", ctx.pickIndex - 1);

      return true;
    },
  },
  {
    id: "select_matchbox_for_reward",
    buttonText: "Gyufásdoboz kiválasztása",
    handler: async (ctx) => {
      const targetIndex = ctx.picks[ctx.pickIndex];

      if (targetIndex === undefined) {
        return false;
      }

      console.log(
        "Teaching: Select matchbox with reward for index:",
        targetIndex,
      );

      const boardWithNumbers = ctx.board.map((cell, idx) => {
        if (cell === null) {
          return idx === targetIndex
            ? BASE_BEADS_AMOUNT - 1
            : BASE_BEADS_AMOUNT;
        }
        return cell;
      }) as BoardStateWithNumbers;

      ctx.setBoard(boardWithNumbers);
      ctx.calcAndSetFrozenWheel(boardWithNumbers);

      return true;
    },
  },
  {
    id: "add_reward_beads",
    buttonText: "Jutalomgyöngyök",
    handler: async (ctx) => {
      const targetIndex = ctx.picks[ctx.pickIndex];

      if (targetIndex === undefined) {
        return false;
      }

      console.log("Teaching: Add reward beads, amount:", ctx.rewardAmount);

      ctx.setSpinChoice(targetIndex + 1);

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const newBoard = ctx.board.slice();
      if (typeof newBoard[targetIndex] === "number") {
        newBoard[targetIndex] =
          (newBoard[targetIndex] as number) + ctx.rewardAmount;
        ctx.setBoard(newBoard as BoardStateWithNumbers);
      }

      ctx.calcAndSetFrozenWheel(newBoard as BoardStateWithNumbers);
      ctx.setSpinChoice(undefined);

      return true;
    },
  },
  {
    id: "put_back_matchbox",
    buttonText: "Gyufásdoboz visszahelyezése",
    handler: async (ctx) => {
      console.log("Teaching: Put back matchbox, pickIndex:", ctx.pickIndex);

      ctx.setSpinChoice(undefined);

      const cleanBoard = ctx.board.map((cell) => {
        if (typeof cell === "number") return null;
        return cell;
      }) as BoardStateWithNumbers;

      ctx.setBoard(cleanBoard);
      ctx.calcAndSetFrozenWheel(null);

      // potential ending state / loop back
      if (ctx.pickIndex > 0) {
        return "remove_opponent_move";
      } else {
        console.log("No more moves, ending teaching 2.");
        return "animation_end";
      }
    },
  },
  {
    id: "animation_end",
    buttonText: "Tanítás befejezve",
    handler: async () => {
      // this won't be called because the button gets disabled
      return false;
    },
  },
];
// Because of the promises, if the component unmounts during an animation step,
// setStates will be executed, but they fail silently and there are no leaks.

const MenaceTrainSimulation = ({ wheelSize }: MenaceTrainSimulationProps) => {
  const baseBoard = useMemo<BoardStateWithNumbers>(
    () =>
      [
        "O",
        null,
        "X",
        null,
        "X",
        null,
        null,
        "O",
        null,
      ] as BoardStateWithNumbers,
    [],
  );
  const [board, setBoard] = useState<BoardStateWithNumbers>(baseBoard);
  const losePicks = useMemo<number[]>(() => [5, 3, 1, 6], []);
  const drawPicks = useMemo<number[]>(() => [1, 6, 8, 5, 3], []);
  const winPicks = useMemo<number[]>(() => [3, 6, 5], []);
  const choice = useRef<number | null>(null);
  const [spinChoice, setSpinChoice] = useState<number | undefined>(undefined);
  const [forcedTarget, setForcedTarget] = useState<number | undefined>(
    undefined,
  );
  const [wheelKey, setWheelKey] = useState(0);
  const [pickIndex, setPickIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState<AnimStep>("select_matchbox");
  const [isAnimating, setIsAnimating] = useState(false);
  const [frozenWheelValues, setFrozenWheelValues] = useState<number[]>([]);
  const [frozenWheelProbs, setFrozenWheelProbs] = useState<number[]>([]);
  const [isTeachingMode, setIsTeachingMode] = useState(false);
  const [rewardAmount, setRewardAmount] = useState<RewardType>(0);

  const nextButtonRef = useRef<HTMLButtonElement>(null);

  const { isAboveMd } = useWindowSize();

  const forwardStates = useMemo(() => createForwardStates(), []);
  const teachingStates = useMemo(() => createTeachingStates(), []);

  const calcAndSetFrozenWheel = (boardState: BoardStateWithNumbers | null) => {
    if (!boardState) {
      setFrozenWheelValues([]);
      setFrozenWheelProbs([]);
      return;
    }

    const currentValues = boardState
      .map((cell, index) => (typeof cell === "number" ? index + 1 : -1))
      .filter((v) => v > -1) as number[];
    const currentProbs = boardState
      .map((cell) => (typeof cell === "number" ? cell : 0))
      .filter((val) => val > 0);

    setFrozenWheelValues(currentValues);
    setFrozenWheelProbs(currentProbs);
  };

  const winAnim = () => {
    setPickIndex(0);
    setBoard(baseBoard);
    choice.current = 2;
    setSpinChoice(undefined);
    setForcedTarget(undefined);
    setCurrentStep("select_matchbox");
    setFrozenWheelValues([]);
    setFrozenWheelProbs([]);
    setIsTeachingMode(false);
    setRewardAmount(4);
  };

  const drawAnim = () => {
    setPickIndex(0);
    setBoard(baseBoard);
    choice.current = 1;
    setSpinChoice(undefined);
    setForcedTarget(undefined);
    setCurrentStep("select_matchbox");
    setFrozenWheelValues([]);
    setFrozenWheelProbs([]);
    setIsTeachingMode(false);
    setRewardAmount(2);
  };

  const loseAnim = () => {
    setPickIndex(0);
    setBoard(baseBoard);
    choice.current = 0;
    setSpinChoice(undefined);
    setForcedTarget(undefined);
    setCurrentStep("select_matchbox");
    setFrozenWheelValues([]);
    setFrozenWheelProbs([]);
    setIsTeachingMode(false);
    setRewardAmount(0);
  };

  const startTeaching = () => {
    console.log("Starting teaching mode, pickIndex:", pickIndex);
    setIsTeachingMode(true);

    const lastMoveIndex = pickIndex - 1;

    if (lastMoveIndex % 2 === 1) {
      setCurrentStep("remove_opponent_move");
    } else {
      setCurrentStep("remove_menace_move");
    }
  };

  const nextStep = async () => {
    if (choice.current === null) {
      return;
    }

    const picks =
      choice.current === 0
        ? losePicks
        : choice.current === 1
          ? drawPicks
          : winPicks;

    if (currentStep === "animation_end") {
      console.log("Animation already ended");
      return;
    }

    setIsAnimating(true);

    const states = isTeachingMode ? teachingStates : forwardStates;
    const currentStateConfig = states.find((state) => state.id === currentStep);

    if (!currentStateConfig) {
      console.error("State not found:", currentStep);
      setIsAnimating(false);
      return;
    }

    const context: AnimationContext = {
      board,
      setBoard,
      picks,
      pickIndex,
      setPickIndex,
      spinChoice,
      setSpinChoice,
      forcedTarget,
      setForcedTarget,
      wheelKey,
      incrementWheelKey: () => setWheelKey((prev) => prev + 1),
      frozenWheelValues,
      setFrozenWheelValues,
      frozenWheelProbs,
      setFrozenWheelProbs,
      rewardAmount,
      calcAndSetFrozenWheel,
    };

    const result = await currentStateConfig.handler(context);

    if (result === true) {
      const stepOrder = isTeachingMode
        ? TEACHING_STEP_ORDER
        : FORWARD_STEP_ORDER;
      const nextStep = getNextStep(currentStep, stepOrder);
      if (nextStep) {
        setCurrentStep(nextStep);
      }
    } else if (result !== false) {
      setCurrentStep(result);
    }

    setIsAnimating(false);
  };

  useEffect(() => {
    if (!isAnimating && nextButtonRef.current) {
      if (currentStep !== "animation_end") {
        nextButtonRef.current.focus();
      }
    }
  }, [isAnimating, currentStep]);

  const getCurrentButtonText = () => {
    const states = isTeachingMode ? teachingStates : forwardStates;
    const currentStateConfig = states.find((state) => state.id === currentStep);
    return currentStateConfig?.buttonText || "Unknown";
  };

  return (
    <div className="content-box mt-10 flex flex-col gap-5 items-center">
      <p>
        Ez a szimuláció bemutatja, hogyan tanul a MENACE egy adott játszmán
        keresztül. A lenti gombokkal különböző eredményeket szimulálhatunk
        lépésről lépésre. A szimuláció nem színes, hanem számozott gyöngyöket
        használ. <br />
      </p>
      <p className="note -mt-4 -mb-2">
        Az üres mezőkben megjelenő számok azt jelölik, hogy az adott mezőt hány
        gyöngy "képviseli" a dobozban. <br />A keréken megjelenő számozott
        szelet a megegyező számú mezőnek felel meg, a szeletek mérete a gyöngyök
        számával arányos.
      </p>
      <div className="flex flex-col md:flex-row gap-2 items-center justify-around w-full">
        <SimpleBoard
          boardWithNumbers={board}
          onCellClick={() => {}}
          disabled={false}
          targetable={false}
          choice={spinChoice}
        />
        <SpinningWheel
          key={wheelKey}
          forbidden={true}
          size={wheelSize}
          values={
            frozenWheelValues.length > 0
              ? frozenWheelValues
              : (board
                  .map((cell, index) =>
                    typeof cell === "number" ? index + 1 : -1,
                  )
                  .filter((val) => val > -1) as number[])
          }
          probabilities={
            frozenWheelProbs.length > 0
              ? frozenWheelProbs
              : Array.from(
                  {
                    length: board.filter((cell) => cell === BASE_BEADS_AMOUNT)
                      .length,
                  },
                  () => 1,
                )
          }
          isSpinning={() => {}}
          setChoice={(value) =>
            setSpinChoice(value === null ? undefined : value)
          }
          forcedTarget={forcedTarget}
        />
      </div>
      <div className="flex flex-col gap-3 items-center w-full">
        {choice.current !== null && (
          <div className="flex flex-row items-center justify-center">
            <button
              ref={nextButtonRef}
              className={`btn ${
                isAnimating || currentStep === "animation_end"
                  ? "cursor-not-allowed opacity-50"
                  : ""
              }`}
              onClick={() => {
                if (isAnimating || currentStep === "animation_end") {
                  return;
                }
                if (currentStep === "forward_end" && !isTeachingMode) {
                  startTeaching();
                } else {
                  nextStep();
                }
              }}
              aria-disabled={isAnimating || currentStep === "animation_end"}
            >
              {getCurrentButtonText()}
            </button>
          </div>
        )}
        {isAboveMd && (
          <div className="flex flex-row space-x-6">
            <button
              className={`btn ${choice.current === 2 ? "bg-green-900 hover:bg-green-900" : ""} ${
                isAnimating ? "cursor-not-allowed opacity-50" : ""
              } `}
              onClick={() => {
                if (!isAnimating) winAnim();
              }}
              aria-disabled={isAnimating}
            >
              Győzelem
            </button>
            <button
              className={`btn  ${choice.current === 1 ? "bg-green-900 hover:bg-green-900" : ""} ${
                isAnimating ? "cursor-not-allowed opacity-50" : ""
              } `}
              onClick={() => {
                if (!isAnimating) drawAnim();
              }}
              aria-disabled={isAnimating}
            >
              Döntetlen
            </button>
            <button
              className={`btn ${choice.current === 0 ? "bg-green-900 hover:bg-green-900" : ""} ${
                isAnimating ? "cursor-not-allowed opacity-50" : ""
              } `}
              onClick={() => {
                if (!isAnimating) loseAnim();
              }}
              aria-disabled={isAnimating}
            >
              Vereség
            </button>
            <button
              className={`btn ${
                isAnimating ? "cursor-not-allowed opacity-50" : ""
              }`}
              onClick={() => {
                if (!isAnimating) {
                  setBoard(baseBoard);
                  setSpinChoice(undefined);
                  setForcedTarget(undefined);
                  setFrozenWheelValues([]);
                  setFrozenWheelProbs([]);
                  setCurrentStep("select_matchbox");
                  setPickIndex(0);
                  choice.current = null;
                  setIsTeachingMode(false);
                }
              }}
              aria-disabled={isAnimating}
            >
              Alaphelyzet
            </button>
          </div>
        )}
        {!isAboveMd && (
          <div className="flex flex-col sm:flex-row gap-3 w-8/10">
            <DropDown
              options={["Győzelem", "Döntetlen", "Vereség"]}
              actions={[winAnim, drawAnim, loseAnim]}
              activeOption={
                choice.current !== null
                  ? choiceIndexToNameMap[choice.current]!
                  : "Válassz"
              }
              disabled={isAnimating}
            />
            <button
              className={`btn ${
                isAnimating ? "cursor-not-allowed opacity-50" : ""
              }`}
              onClick={() => {
                setBoard(baseBoard);
                setSpinChoice(undefined);
                setForcedTarget(undefined);
                setFrozenWheelValues([]);
                setFrozenWheelProbs([]);
                setCurrentStep("select_matchbox");
                setPickIndex(0);
                choice.current = null;
                setIsTeachingMode(false);
              }}
              disabled={isAnimating}
            >
              Alaphelyzet
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
export default MenaceTrainSimulation;
