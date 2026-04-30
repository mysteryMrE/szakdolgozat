type TrainStatus = {
  jobId: string;
  status: "queued" | "running" | "done" | "error";
  progress: number;
  accuracy?: number;
  loss?: number;
  error?: string;
  history?: any[];
  networkName?: string; // Server does not send this, we add it in the frontend, so keep it optional
};

interface NeuralNetwork {
  layers: number[];
  weights: number[][][];
  biases: number[][];
}

type NetworkDoc = {
  id: string;
  name: string;
  nn: NeuralNetwork;
  meta: { epochs_completed?: number; accuracy?: number; loss?: number };
};
type GameScore = {
  X: number;
  O: number;
  draw: number;
}

type GameState = {
  board: BoardState;
  current_turn: CellValue;
  rounds: number;
  curr_round: number;
  x_o_draw: GameScore;
  status: string;
};

type CellValue = null | "X" | "O";

type BoardState = [
  [CellValue, CellValue, CellValue],
  [CellValue, CellValue, CellValue],
  [CellValue, CellValue, CellValue]
];

type GameSettings = {
  auto: boolean;
  player_delay_ms: number;
  round_delay_ms: number;
  rounds: number;
  player1: Player;
  player2: Player;
};

type UpdateSettings = {
  player_delay_ms?: number;
  round_delay_ms?: number;
  rounds?: number;
};

type Player = {
  type: string;
  id: string;
  name: string;
};


type CellWithUnknown = '?' | CellValue

type SimpleBoardState = [CellWithUnknown, CellWithUnknown, CellWithUnknown, CellWithUnknown, CellWithUnknown, CellWithUnknown, CellWithUnknown, CellWithUnknown, CellWithUnknown]

type CellWithNumbers = CellValue | number

type BoardStateWithNumbers = [CellWithNumbers, CellWithNumbers, CellWithNumbers, CellWithNumbers, CellWithNumbers, CellWithNumbers, CellWithNumbers, CellWithNumbers, CellWithNumbers]



type BoardIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | undefined;
type GameOutcome = 1 | 0 | -1;
type PlayerSymbol = "X" | "O";
type GameStanding = PlayerSymbol | "draw" | null;


type TreeNode = {
  id: number;
  board: SimpleBoardState;
  moveIndex?: BoardIndex;
  player: PlayerSymbol;
  children: TreeNode[];
  score?: number;
  depth: number;
};
type TwoTwoOneNeuralNetwork = {
  name:string;
  weightsInputToHidden: [[number, number], [number, number]];
  biasesHidden: [number, number];
  weightsHiddenToOutput: [number, number];
  biasOutput: number;
  activation: (x: number) => number;
};

type TwoInputsOneNeuron = { weight1: number; weight2: number; bias: number };

type ChildNode = {
  value: number;
  color: string;
};

type BackpropAnimStep =
  | "inputs"
  | "inputToHidden"
  | "hiddenPreActivation"
  | "hiddenActivation"
  | "hiddenToOutput"
  | "outputPreActivation"
  | "outputSoftmax"
  | "errorCalculation"
  | "errorDerivativesWRTWeightedSumOutput"
  | "errorDerivativesWRTActivationHidden"
  | "errorDerivativesWRTWeightedSumHidden"
  | "weightAndBiasDeltas"
  | "weightBiasUpdate";

type MenaceAnimStep =
  | "select_matchbox"
  | "spin_wheel"
  | "make_move"
  | "opponent_move"
  | "animation_end"
  | "forward_end"
  | "remove_opponent_move"
  | "remove_menace_move"
  | "select_matchbox_for_reward"
  | "add_reward_beads"
  | "put_back_matchbox";

type NotificationMessage = {
  id: string;
  message: string;
};
type ConnectionStatus = "idle" | "connecting" | "connected" | "error";
export type { TrainStatus, NetworkDoc, GameState, CellValue, BoardState, GameScore, GameSettings, Player, UpdateSettings, NeuralNetwork , SimpleBoardState, CellWithUnknown, CellWithNumbers, BoardStateWithNumbers, TreeNode, BoardIndex, GameOutcome, PlayerSymbol, GameStanding, TwoTwoOneNeuralNetwork, TwoInputsOneNeuron, ChildNode, BackpropAnimStep, NotificationMessage, ConnectionStatus, MenaceAnimStep };