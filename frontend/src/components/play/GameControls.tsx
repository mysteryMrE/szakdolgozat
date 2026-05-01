import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  type GameSettings,
  type GameState,
  type UpdateSettings,
  type Player,
} from "../../types";
import PlayerSelector from "./PlayerSelector";
import api from "../../api";
import { useAuth } from "../../contexts/AuthContext";
import { useError } from "../../contexts/ErrorContext";
import NumberInputWithLabel from "./NumberInputWithLabel";
import { handleApiError } from "../../utils";

interface GameControlsProps {
  gameState: GameState | null;
  status: string;
  settings: GameSettings | null;
  createGame: (settings: GameSettings) => boolean;
  updateSettings: (newSettings: UpdateSettings) => boolean;
}

const GameControls = ({
  gameState,
  status,
  settings,
  createGame,
  updateSettings,
}: GameControlsProps) => {
  const [player1, setPlayer1] = useState<Player | null>(
    settings?.player1 ?? null,
  );
  const [player2, setPlayer2] = useState<Player | null>(
    settings?.player2 ?? null,
  );
  const [rounds, setRounds] = useState<number>(1);
  const [auto, setAuto] = useState<boolean>(false);
  const [playerDelayS, setPlayerDelayS] = useState<number>(2);
  const [roundDelayS, setRoundDelayS] = useState<number>(3);
  const [updateActive, setUpdateActive] = useState<boolean>(false);
  const [defaultPlayers, setDefaultPlayers] = useState<Record<string, Player>>(
    {},
  );
  const [userNetworks, setUserNetworks] = useState<Record<string, Player>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user } = useAuth();
  const { addError } = useError();

  useEffect(() => {
    const fetchDefaultPlayers = async () => {
      try {
        const response = await api.get("/game/default_players");
        console.log("Response data:", response.data);
        setDefaultPlayers(response.data.defaultPlayers);
        setPlayer1((prev) => {
          return prev === null ? response.data.defaultPlayers["human"] : prev;
        });
        setPlayer2((prev) => {
          return prev === null ? response.data.defaultPlayers["random"] : prev;
        });
        setIsLoading(false);
      } catch (error) {
        handleApiError(error, {
          fallbackMessage: "Hiba a játékosok betöltésekor",
          addErrorCallback: addError,
        });
        setIsLoading(false);
      }
    };

    fetchDefaultPlayers();
  }, []);

  useEffect(() => {
    const fetchUserNetworks = async () => {
      if (!user) {
        setUserNetworks({});
        return;
      }
      try {
        console.log(
          "[GAMECONTROL] Fetching user networks for user:",
          user.username,
        );
        const response = await api.get("/networks/list_networks");
        const networkIDs = response.data.map((net: any) => net.id);
        const networkNames = response.data.map((net: any) => net.name);
        console.log("Fetched user networks:", networkIDs);
        const networks: Record<string, Player> = {};
        networkIDs.forEach((id: string, index: number) => {
          networks[`backprop_nn_${index}`] = {
            id: id,
            type: "backprop_nn",
            name: networkNames[index],
          };
        });
        console.log("Processed user networks:", networks);
        setUserNetworks(networks);
      } catch (error) {
        handleApiError(error, {
          fallbackMessage: "Hiba a felhasználói hálózatok betöltésekor",
          addErrorCallback: addError,
        });
      }
    };
    fetchUserNetworks();
  }, [user]);

  const createGameSettings = (): GameSettings => {
    if (!player1 || !player2) {
      console.log("Player1 or Player2 is null");
      throw new Error("Player1 or Player2 is null");
    }
    return {
      player1: player1,
      player2: player2,
      rounds: rounds,
      auto: auto,
      player_delay_ms: Math.round(playerDelayS * 1000),
      round_delay_ms: Math.round(roundDelayS * 1000),
    };
  };
  const equalPlayers = useCallback((p1: Player, p2: Player): boolean => {
    return p1.id === p2.id && p1.type === p2.type && p1.name === p2.name;
  }, []);

  useEffect(() => {
    if (!settings) {
      setRounds(1);
      setAuto(false);
      setPlayerDelayS(2);
      setRoundDelayS(3);
      setUpdateActive(false);
      if (defaultPlayers["human"]) {
        setPlayer1(defaultPlayers["human"]);
      }
      if (defaultPlayers["random"]) {
        setPlayer2(defaultPlayers["random"]);
      }
      return;
    }

    // Only override when we have valid settings (coming from server)
    if (settings?.player1) {
      setPlayer1(settings.player1);
    }
    if (settings?.player2) {
      setPlayer2(settings.player2);
    }
    if (settings?.rounds) {
      setRounds(settings.rounds);
    }
    if (settings?.player_delay_ms) {
      setPlayerDelayS(settings.player_delay_ms / 1000);
    }
    if (settings?.round_delay_ms) {
      setRoundDelayS(settings.round_delay_ms / 1000);
    }
    if (settings?.auto !== undefined) {
      setAuto(settings.auto);
    }
  }, [settings, defaultPlayers]);

  useEffect(() => {
    if (!settings || !player1 || !player2) return;
    if (
      !equalPlayers(settings.player1, player1) ||
      !equalPlayers(settings.player2, player2) ||
      settings.auto !== auto
    ) {
      setUpdateActive(false); // in this case, we don't allow updating, only creating a new game
      return;
    }
    if (
      settings.rounds !== rounds ||
      settings.player_delay_ms !== Math.round(playerDelayS * 1000) ||
      settings.round_delay_ms !== Math.round(roundDelayS * 1000)
    ) {
      setUpdateActive(true);
      return;
    }
    setUpdateActive(false);
  }, [player1, player2, rounds, auto, playerDelayS, roundDelayS, settings]);

  const createUpdateSettings = (): UpdateSettings => {
    const newSettings: UpdateSettings = {};
    if (rounds !== settings?.rounds) newSettings.rounds = rounds;
    if (Math.round(playerDelayS * 1000) !== settings?.player_delay_ms) {
      newSettings.player_delay_ms = Math.round(playerDelayS * 1000);
    }
    if (Math.round(roundDelayS * 1000) !== settings?.round_delay_ms) {
      newSettings.round_delay_ms = Math.round(roundDelayS * 1000);
    }
    return newSettings;
  };

  useEffect(() => {
    if (!player1 || !player2) return;
    if (player1.type === "human" || player2.type === "human") {
      setAuto(false);
    } else {
      setAuto(true);
    }
  }, [player1, player2]);

  const handleChangeP1 = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const allPlayers = { ...defaultPlayers, ...(userNetworks || {}) };
      const value = e.target.value as keyof typeof allPlayers;
      setPlayer1(allPlayers[value] ?? player1);
    },
    [defaultPlayers, player1, userNetworks],
  );

  const handleChangeP2 = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const allPlayers = { ...defaultPlayers, ...(userNetworks || {}) };
      const value = e.target.value as keyof typeof allPlayers;
      setPlayer2(allPlayers[value] ?? player2);
    },
    [defaultPlayers, player2, userNetworks],
  );

  /*
  player dicts look like this:
  {
    "human": {
      id: "human",
      type: "human",
      name: "Te"
    },
    "backprop_nn_0": {
      id: "123e4567-e89b-12d3-a456-426614174000",
      type: "backprop_nn",
      name: "My Neural Network"
    },
  }
  dict key is the value, dict value is name
  */

  const player1Value = useMemo(() => {
    if (!player1) return undefined;
    const allPlayers = { ...defaultPlayers, ...(userNetworks || {}) };
    return Object.entries(allPlayers).find(([, p]) =>
      equalPlayers(p, player1),
    )?.[0];
  }, [player1, defaultPlayers, userNetworks, equalPlayers]);

  const player2Value = useMemo(() => {
    if (!player2) return undefined;
    const allPlayers = { ...defaultPlayers, ...(userNetworks || {}) };
    return Object.entries(allPlayers).find(([, p]) =>
      equalPlayers(p, player2),
    )?.[0];
  }, [player2, defaultPlayers, userNetworks, equalPlayers]);

  const playerNames = useMemo(
    () =>
      Object.values({ ...defaultPlayers, ...userNetworks }).map(
        (player) => player.name,
      ),
    [defaultPlayers, userNetworks],
  );
  const playerValues = useMemo(
    () => Object.keys({ ...defaultPlayers, ...userNetworks }),
    [defaultPlayers, userNetworks],
  );

  const gameNotFinished = (): boolean => {
    return (
      gameState?.status === "ongoing" ||
      gameState?.curr_round !== gameState?.rounds
    );
  };

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold mb-4">Beállítások</h2>
        <div className="flex justify-center items-center">
          <div className="text-gray-400">Betöltés...</div>
        </div>
      </div>
    );
  }

  return (
    player1 &&
    player2 && (
      <div className="bg-gray-800 rounded-lg p-3 sm:p-6">
        <h2 className="text-xl font-semibold mb-3 sm:mb-6">Beállítások</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <PlayerSelector
            names={playerNames}
            values={playerValues}
            disabledOptions={player2?.type === "human" ? ["human"] : []}
            handleChange={handleChangeP1}
            selectedValue={player1Value}
            playerIndex={1}
          />
          <PlayerSelector
            names={playerNames}
            values={playerValues}
            disabledOptions={player1?.type === "human" ? ["human"] : []}
            handleChange={handleChangeP2}
            selectedValue={player2Value}
            playerIndex={2}
          />

          <NumberInputWithLabel
            value={rounds}
            setValue={setRounds}
            min={1}
            max={100}
            step={1}
            label="Körök száma"
            title="A körök száma (1-100)."
            blurValueFixer={(n) => Math.round(n)}
          />

          <NumberInputWithLabel
            value={playerDelayS}
            setValue={setPlayerDelayS}
            min={0.02}
            max={10}
            step={0.01}
            label="Lépéskésleltetés (mp)"
            title="A lépések közötti szünet hossza másodpercben (0.02-10)."
          />

          <NumberInputWithLabel
            value={roundDelayS}
            setValue={setRoundDelayS}
            min={0.02}
            max={10}
            step={0.01}
            label="Körkésleltetés (mp)"
            title="A körök közötti szünet hossza másodpercben (0.02-10)."
          />
        </div>
        <div className="flex gap-4 justify-end">
          {settings && updateActive && gameNotFinished() && (
            <button
              onClick={() => updateSettings(createUpdateSettings())}
              disabled={status !== "connected"}
              className="btn disabled:opacity-50 bg-gray-700 hover:bg-gray-600"
            >
              Beállítások frissítése
            </button>
          )}
          <button
            onClick={() => createGame(createGameSettings())}
            disabled={status !== "connected"}
            className="btn disabled:opacity-50 bg-blue-600 hover:bg-blue-700"
          >
            {!gameState ? "Játék létrehozása" : "Új játék"}
          </button>
        </div>
      </div>
    )
  );
};

export default GameControls;
