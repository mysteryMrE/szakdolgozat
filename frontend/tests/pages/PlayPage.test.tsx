import { render, screen, waitFor, act } from "@testing-library/react";
import PlayPage from "../../src/pages/PlayPage";
import { user } from "../utils";

import { useAuth } from "../../src/contexts/AuthContext";
import { useError } from "../../src/contexts/ErrorContext";
import useWebSocket from "../../src/websocket";
vi.stubEnv("VITE_BACKEND_WS", "ws:test");
vi.mock("../../src/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));
vi.mock("../../src/contexts/ErrorContext", () => ({
  useError: vi.fn(),
}));
vi.mock("../../src/websocket", () => ({
  default: vi.fn(),
}));

const mockUseAuth = vi.mocked(useAuth);
const mockUseError = vi.mocked(useError);
const mockWebSocket = vi.mocked(useWebSocket);

vi.mock("../../src/components/play/ConnectionStatus", () => ({
  default: ({ status, tryReconnect }: any) => (
    <div data-testid="connection-status">
      Status: {status}
      <button onClick={tryReconnect}>Reconnect</button>
    </div>
  ),
}));

vi.mock("../../src/components/play/GameControls", () => ({
  default: ({ createGame, updateSettings, settings }: any) => (
    <div data-testid="game-controls">
      <button onClick={() => createGame("create")}>Create Game</button>
      <button onClick={() => updateSettings("update")}>Update Settings</button>
      <p>{settings ? JSON.stringify(settings) : "No Settings"}</p>
    </div>
  ),
}));

vi.mock("../../src/components/play/GameStats", () => ({
  default: ({ gameState }: any) => (
    <div data-testid="game-stats">
      Stats: {gameState ? gameState.status : "No Game"}
    </div>
  ),
}));

vi.mock("../../src/components/play/GameBoard", () => ({
  default: ({ onCellClick }: any) => (
    <div data-testid="game-board">
      <button onClick={() => onCellClick(0)}>Click Cell</button>
    </div>
  ),
}));

const mockGetFreshToken = vi.fn().mockResolvedValue("hmm refreshing!");
const mockAddError = vi.fn();
const mockSendMessage = vi.fn();
const mockAddMessageHandler = vi.fn();

describe("PlayPage", () => {
  let capturedMessageHandler: (msg: any) => void = () => {};

  beforeEach(() => {
    vi.clearAllMocks();

    capturedMessageHandler = () => {};

    mockUseAuth.mockReturnValue({
      user: { id: "Julius" },
      guestID: null,
      getFreshToken: mockGetFreshToken,
    } as any);

    mockUseError.mockReturnValue({
      addError: mockAddError,
    });

    mockWebSocket.mockReturnValue({
      status: "disconnected",
      sendMessage: mockSendMessage,
      addMessageHandler: mockAddMessageHandler,
    } as any);

    mockAddMessageHandler.mockImplementation((handler: any) => {
      capturedMessageHandler = handler;
      return () => {};
    });
  });

  it("renders initial state", async () => {
    render(<PlayPage />);

    expect(screen.getByText("Játék")).toBeInTheDocument();
    expect(screen.getByTestId("connection-status")).toHaveTextContent(
      /disconnected/i,
    );
    expect(screen.getByTestId("game-stats")).toHaveTextContent(/No Game/i);
    expect(screen.getByTestId("game-board")).toBeInTheDocument();
    expect(screen.getByTestId("game-controls")).toBeInTheDocument();
    expect(screen.getByText("No Settings")).toBeInTheDocument();
  });

  it("autoconnects when user is logged in", async () => {
    render(<PlayPage />);

    // hard to test internal useEffect, freshToken is only called during autoconnect
    // setup has a user and a disconnected state, so it should autoconnect
    await waitFor(() => {
      expect(mockGetFreshToken).toHaveBeenCalled();
    });
  });

  it("requests a fresh token when reconnect is clicked", async () => {
    render(<PlayPage />);

    await waitFor(() => {
      expect(mockGetFreshToken).toHaveBeenCalled();
    });

    mockGetFreshToken.mockClear();

    await user.click(screen.getByText("Reconnect"));

    await waitFor(() => {
      expect(mockGetFreshToken).toHaveBeenCalled();
    });
  });

  it("sends resume game message if connected", async () => {
    mockWebSocket.mockReturnValue({
      status: "connected",
      sendMessage: mockSendMessage,
      addMessageHandler: mockAddMessageHandler,
    });

    render(<PlayPage />);

    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith({
        type: "resume",
      });
    });
  });

  it("sends create game message", async () => {
    mockWebSocket.mockReturnValue({
      status: "connected",
      sendMessage: mockSendMessage,
      addMessageHandler: mockAddMessageHandler,
    });

    render(<PlayPage />);

    const createButton = screen.getByText(/Create Game/i);
    await user.click(createButton);

    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith({
        type: "new",
        config: "create",
      });
    });
  });

  it("sends move message when cell is clicked", async () => {
    mockWebSocket.mockReturnValue({
      status: "connected",
      sendMessage: mockSendMessage,
      addMessageHandler: mockAddMessageHandler,
    });

    render(<PlayPage />);

    const cellButton = screen.getByText(/Click Cell/i);
    await user.click(cellButton);

    expect(mockSendMessage).toHaveBeenCalledWith({
      type: "move",
      position: 0,
    });
  });

  it("updates game state on receiving 'game_created' message", async () => {
    const mockGameState = {
      status: "ongoing",
      rounds: 1,
      curr_round: 1,
    };
    const mockSettings = { player: "human" };

    const message = {
      type: "game_created",
      state: mockGameState,
      settings: mockSettings,
    };
    render(<PlayPage />);

    await waitFor(() => {
      expect(mockWebSocket).toHaveBeenCalledWith(
        expect.stringMatching(/^ws:test/),
        expect.objectContaining({ shouldConnect: true }),
      );
    });

    act(() => {
      capturedMessageHandler(message);
    });

    expect(screen.getByTestId("game-stats")).toHaveTextContent(
      "Stats: ongoing",
    );
  });

  it("updates game state on receiving 'config' message", async () => {
    const mockGameState = {
      status: "ongoing",
      rounds: 1,
      curr_round: 1,
    };
    const mockSettings = { player: "human" };

    const message = {
      type: "config",
      state: mockGameState,
      settings: mockSettings,
    };

    render(<PlayPage />);

    await waitFor(() => {
      expect(mockWebSocket).toHaveBeenCalledWith(
        expect.stringMatching(/^ws:test/),
        expect.objectContaining({ shouldConnect: true }),
      );
    });

    act(() => {
      capturedMessageHandler(message);
    });

    expect(screen.getByText(/human/i)).toBeInTheDocument();
  });

  it.each([
    ["state", 1],
    ["new_round", 2],
    ["game_over", 3],
    ["continue", 4],
  ])("updates game state on %s message", async (msgType, rounds) => {
    const mockGameState = {
      status: msgType,
      rounds: rounds,
      curr_round: 1,
    };
    render(<PlayPage />);
    await waitFor(() => {
      expect(mockWebSocket).toHaveBeenCalledWith(
        expect.stringMatching(/^ws:test/),
        expect.objectContaining({ shouldConnect: true }),
      );
    });

    act(() => {
      capturedMessageHandler({
        type: msgType,
        state: mockGameState,
      });
    });

    expect(screen.getByTestId("game-stats")).toHaveTextContent(
      `Stats: ${msgType}`,
    );

    expect(mockAddError).not.toHaveBeenCalled();
    expect(screen.getByText(/no settings/i)).toBeInTheDocument();
  });

  it("handles error message from server", async () => {
    render(<PlayPage />);
    await waitFor(() => {
      expect(mockWebSocket).toHaveBeenCalledWith(
        expect.stringMatching(/^ws:test/),
        expect.objectContaining({ shouldConnect: true }),
      );
    });

    const message = {
      error: "Test error message",
    };
    act(() => {
      capturedMessageHandler(message);
    });

    expect(mockAddError).toHaveBeenCalledWith("Test error message");
  });

  it("handles warning message from server", async () => {
    render(<PlayPage />);
    await waitFor(() => {
      expect(mockWebSocket).toHaveBeenCalledWith(
        expect.stringMatching(/^ws:test/),
        expect.objectContaining({ shouldConnect: true }),
      );
    });

    const message = {
      warning: "Test warning message",
    };
    act(() => {
      capturedMessageHandler(message);
    });
    expect(mockAddError).toHaveBeenCalledWith("Test warning message");
  });
});
