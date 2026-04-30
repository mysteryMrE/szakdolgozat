import { useState, useCallback, useRef, useEffect } from "react";
import type { ConnectionStatus } from "./types";

interface MessageHandler {
  (data: any): void;
}

interface AddMessageHandler {
  (callback: MessageHandler): () => void;
}

interface WebSocketHookReturn {
  status: ConnectionStatus;
  sendMessage: (message: any) => boolean;
  addMessageHandler: AddMessageHandler;
}

interface UseWebSocketOptions {
  shouldConnect?: boolean;
  connectSignal?: number;
}

/**
 * Custom hook to manage WebSocket connections.
 * @param url - The WebSocket URL to connect to.
 * @param options - Connection options.
 * @returns An object containing the connection status, a function to send messages, and a function to add message handlers.
 */
const useWebSocket = (
  url: string,
  options: UseWebSocketOptions = {},
): WebSocketHookReturn => {
  const { shouldConnect = true, connectSignal = 0 } = options;
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const messageHandlers = useRef<Set<MessageHandler>>(new Set());

  // Validates URL, establishes WebSocket connection, 
  // sets up event listeners, and handles cleanup
  useEffect(() => {
    if (!shouldConnect) {
      setStatus("idle");
      return;
    }
    if (!url || !url.startsWith("ws")) {
      console.error("Invalid WebSocket URL:", url);
      setStatus("error");
      return;
    }

    let websocket: WebSocket | null = null;
    let isMounted = true;

    try {
      console.log("Connecting to WebSocket at:", url);
      websocket = new WebSocket(url);
    } catch (err) {
      console.error("Failed to create WebSocket:", err);
      setStatus("error");
      return;
    }
    console.log("WebSocket instance created");

    setWs(websocket);
    setStatus("connecting");

    websocket.onopen = () => {
      if (!isMounted) return;
      console.log("Connected to WebSocket");
      setStatus("connected");
    };

    websocket.onmessage = (event) => {
      if (!isMounted) return;
      try {
        const message = JSON.parse(event.data);
        messageHandlers.current.forEach((handler) => handler(message));
      } catch (e) {
        console.error("Failed to parse message:", e);
      }
    };

    websocket.onclose = (event) => {
      if (!isMounted) return;
      console.log("Disconnected from WebSocket", event.reason);
      setWs(null);
      setStatus("idle");
    };

    websocket.onerror = (error) => {
      if (!isMounted) return;
      console.warn("WebSocket error (possibly due to early disconnect):", error);
      if (websocket?.readyState === WebSocket.CLOSED) {
        setStatus("idle");
      } else {
        setStatus("error");
      }
    };

    return () => {
      isMounted = false;
      if (websocket) {
        websocket.onopen = websocket.onmessage = websocket.onerror = websocket.onclose = null;
        if (websocket.readyState === WebSocket.OPEN || websocket.readyState === WebSocket.CONNECTING) {
          websocket.close();
        }
      }
      setWs(null);
      setStatus("idle");
    };
  }, [url, shouldConnect, connectSignal]);

 
  /**
   * Adds a message handler to be called on incoming messages.
   * @param callback - The function to handle incoming messages.
   * @returns A function to remove the added message handler.
   */
  const addMessageHandler: AddMessageHandler = useCallback(
    (callback: MessageHandler) => {
      messageHandlers.current.add(callback);
      return () => messageHandlers.current.delete(callback);
    },
    []
  );

  /**
   * Sends a message through the WebSocket connection.
   * @param message - The message to send.
   * @returns True if the message was sent, false otherwise.
   */
  const sendMessage = useCallback(
    (message: any) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
        return true;
      }
      console.warn("WebSocket not connected");
      return false;
    },
    [ws]
  );

  return { status, sendMessage, addMessageHandler };
};

export default useWebSocket;
