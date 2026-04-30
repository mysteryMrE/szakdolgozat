import { useEffect, useRef, useState, type ReactNode } from "react";
import useWebSocket from "../websocket";
import ConnectionStatus from "../components/play/ConnectionStatus";
import { useAuth } from "../contexts/AuthContext";
import GameBoard from "../components/play/GameBoard";
import GameStats from "../components/play/GameStats";
import {
  type GameSettings,
  type GameState,
  type UpdateSettings,
} from "../types";
import GameControls from "../components/play/GameControls";
import { useError } from "../contexts/ErrorContext";

/**
 * Component representing the main page where users can connect to a game via WebSocket.
 * @returns The rendered PlayPage component.
 */
const PlayPage = (): ReactNode => {
  const wsBaseUrl = import.meta.env.VITE_BACKEND_WS || "ws://localhost:8000";
  const [wsUrl, setWsUrl] = useState<string>("");
  const [connectSignal, setConnectSignal] = useState(1);

  const { addError } = useError();
  const { guestID, user, getFreshToken } = useAuth();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [settings, setSettings] = useState<GameSettings | null>(null);

  const autoConnectTriggered = useRef(false);

  const shouldConnect = wsUrl.length > 0;

  const { status, sendMessage, addMessageHandler } = useWebSocket(wsUrl, {
    shouldConnect,
    connectSignal,
  });

  /**
   * Handles sending messages over the WebSocket connection.
   * @param message The message to send.
   * @returns Whether the message was sent successfully.
   */
  const handleSendMessage = (message: any): boolean => {
    const success = sendMessage(message);

    if (success) {
      console.log("Message sent successfully!");
    } else {
      console.error("Failed to send message");
    }
    return success;
  };

  const createGame = (config: GameSettings): boolean => {
    return handleSendMessage({ type: "new", config: config });
  };

  const updateSettings = (newSettings: UpdateSettings): boolean => {
    return handleSendMessage({
      type: "update",
      config: newSettings,
    });
  };

  const newRound = (): boolean => {
    return handleSendMessage({ type: "new_round" });
  };
  const continueGame = (): boolean => {
    return handleSendMessage({ type: "continue" });
  };

  /**
   * Toggles the WebSocket connection based on the current connection status.
   */
  const toggleConnection = async () => {
    if (status === "connecting") {
      return; // Don't allow toggling while connecting
    }

    if (status === "connected") {
      console.log("Disconnecting...");
      setWsUrl("");
    } else {
      // Configure wsUrl and trigger a new connection attempt.
      // connectSignal forces the hook effect to rerun even when URL is unchanged.
      if (user) {
        // Authenticated user - get fresh token
        console.log("Getting fresh token for WebSocket connection...");
        const token = await getFreshToken();
        if (token) {
          const newUrl = `${wsBaseUrl}/game/${user.id}?token=${token}`;
          console.log("Connecting with authenticated URL");
          setWsUrl(newUrl);
          setConnectSignal((prev) => (prev === 2 ? 1 : 2));
        } else {
          console.error("Failed to get fresh token for WebSocket");
        }
      } else if (guestID) {
        // Guest connection
        const guestUrl = `${wsBaseUrl}/game/${guestID}`;
        console.log("Connecting with guest URL");
        setWsUrl(guestUrl);
        setConnectSignal((prev) => (prev === 2 ? 1 : 2));
      }
    }
  };

  // Handles automatic connection and disconnection based on user authentication state
  useEffect(() => {
    if (!user && wsUrl.length > 0 && !wsUrl.includes("guest")) {
      console.log(
        "User logged out, disconnecting WebSocket and resetting state...",
      );
      setWsUrl("");
      setGameState(null);
      setSettings(null);
      autoConnectTriggered.current = false;
    } else if (!guestID && wsUrl.length > 0 && wsUrl.includes("guest")) {
      console.log(
        "Guest logged out (user logged in), disconnecting WebSocket and resetting state...",
      );
      setWsUrl("");
      setGameState(null);
      setSettings(null);
      autoConnectTriggered.current = false;
    } else if (
      (user || guestID) &&
      wsUrl.length === 0 &&
      !autoConnectTriggered.current
    ) {
      console.log("User or guest logged in, autoconnecting...");
      autoConnectTriggered.current = true;
      toggleConnection();
    } else {
      console.log("No user or guest.");
    }
  }, [user, guestID]);

  // Sets up message handler for incoming WebSocket messages
  useEffect(() => {
    if (!addMessageHandler) return;

    const unsubscribe = addMessageHandler((message: any) => {
      if (!shouldConnect || (!user && !guestID)) {
        return; //race condition check - for eg. if we click logout -> state = null -> message arrives -> state != null
      }

      console.log("Received message:", message);

      if (
        message.type === "game_created" ||
        message.type === "config" ||
        message.type === "game_updated"
      ) {
        setGameState(message.state);
        setSettings(message.settings);
      } else if ("error" in message) {
        console.error("Error message received:", message);
        addError(message.error);
      } else if ("warning" in message) {
        console.warn("Warning message received:", message);
        addError(message.warning);
      } else if (
        message.type === "state" ||
        message.type === "new_round" ||
        message.type === "game_over" ||
        message.type === "continue"
      ) {
        setGameState(message.state);
      }
    });

    return unsubscribe;
  }, [addMessageHandler, shouldConnect, user, guestID, addError]);

  // Sends a "resume" message when the WebSocket connection is established
  useEffect(() => {
    if (!sendMessage || !status || status !== "connected") return;
    const success = sendMessage({
      type: "resume",
    });
    if (success) {
      console.log("Sent resume message upon connection.");
    } else {
      console.log("Failed to send resume message upon connection.");
    }
  }, [status, sendMessage]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 rounded-2xl">
      <div className="max-w-2xl mx-auto grid gap-4 md:gap-6 ">
        <h1 className="text-3xl font-bold text-center">Játék</h1>
        <div className="flex justify-center">
          <ConnectionStatus status={status} tryReconnect={toggleConnection} />
        </div>
        <GameControls
          gameState={gameState}
          status={status}
          settings={settings}
          createGame={createGame}
          updateSettings={updateSettings}
        />
        <span className="block"></span>
        <GameStats gameState={gameState} />
      </div>
      <GameBoard
        gameState={gameState}
        disabled={status !== "connected" || gameState?.status !== "ongoing"}
        onCellClick={(pos) => {
          handleSendMessage({
            type: "move",
            position: pos,
          });
        }}
      />

      {gameState?.status.startsWith("paused") && (
        <button
          onClick={continueGame}
          disabled={status !== "connected"}
          className="btn mt-6"
        >
          Játék folytatása
        </button>
      )}
      {(gameState?.status === "X_won" ||
        gameState?.status === "O_won" ||
        gameState?.status === "draw") &&
        !settings?.auto &&
        gameState?.curr_round !== gameState.rounds && (
          <button
            onClick={newRound}
            disabled={status !== "connected"}
            className="btn mt-6"
          >
            Következő kör
          </button>
        )}
    </div>
  );
};
export default PlayPage;
