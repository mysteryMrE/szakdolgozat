import { render, screen, waitFor } from "@testing-library/react";
import GameControls from "../../../src/components/play/GameControls";
import { useAuth } from "../../../src/contexts/AuthContext";
import { useError } from "../../../src/contexts/ErrorContext";
import api from "../../../src/api";
import { user, clearAndType } from "../../utils";
import { type GameState } from "../../../src/types";

vi.mock("../../../src/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));
vi.mock("../../../src/contexts/ErrorContext", () => ({
  useError: vi.fn(),
}));

vi.mock("../../../src/api", () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockUseError = vi.mocked(useError);
const mockUseAuth = vi.mocked(useAuth);
const mockApiGet = vi.mocked(api.get);

const mockCreateGame = vi.fn();
const mockUpdateSettings = vi.fn();
const mockAddError = vi.fn();

const defaultPlayersData = {
  defaultPlayers: {
    human: { id: "human1", type: "human", name: "Te" },
    random: { id: "random1", type: "random", name: "Random" },
  },
};

const mockGameState: GameState = {
  board: [
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ],
  current_turn: "X",
  rounds: 10,
  curr_round: 1,
  x_o_draw: { X: 0, O: 0, draw: 0 },
  status: "ongoing",
};

describe("GameControls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseError.mockReturnValue({ addError: mockAddError });
    mockUseAuth.mockReturnValue({ user: null } as any);
    mockApiGet.mockResolvedValue({ data: defaultPlayersData });
  });

  it("renders loading state initially", () => {
    mockApiGet.mockImplementation(() => new Promise(() => {}));

    render(
      <GameControls
        gameState={null}
        status="connected"
        settings={null}
        createGame={mockCreateGame}
        updateSettings={mockUpdateSettings}
      />,
    );

    expect(screen.getByText("Betöltés...")).toBeInTheDocument();
  });

  it("renders controls after fetching default players", async () => {
    render(
      <GameControls
        gameState={null}
        status="connected"
        settings={null}
        createGame={mockCreateGame}
        updateSettings={mockUpdateSettings}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByText("Betöltés...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Beállítások")).toBeInTheDocument();
    expect(screen.getByText("Körök száma")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Játék létrehozása" }),
    ).toBeInTheDocument();
  });

  it("calls createGame with correct settings when button is clicked", async () => {
    render(
      <GameControls
        gameState={null}
        status="connected"
        settings={null}
        createGame={mockCreateGame}
        updateSettings={mockUpdateSettings}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByText("Betöltés...")).not.toBeInTheDocument();
    });

    const createButton = screen.getByRole("button", {
      name: "Játék létrehozása",
    });
    await user.click(createButton);

    expect(mockCreateGame).toHaveBeenCalledWith(
      expect.objectContaining({
        rounds: 1,
        player_delay_ms: 2000,
        round_delay_ms: 3000,
      }),
    );
  });

  it("fetches user networks if user is logged in", async () => {
    mockUseAuth.mockReturnValue({
      user: { username: "TestUser" },
    } as any);

    const userNetworksData = [{ id: "Captain", name: "Levi" }];

    mockApiGet.mockImplementation((url: string) => {
      if (url === "/game/default_players")
        return Promise.resolve({ data: defaultPlayersData });
      if (url === "/networks/list_networks")
        return Promise.resolve({ data: userNetworksData });
      return Promise.reject(new Error("Unknown URL"));
    });

    render(
      <GameControls
        gameState={null}
        status="connected"
        settings={null}
        createGame={mockCreateGame}
        updateSettings={mockUpdateSettings}
      />,
    );

    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledWith("/networks/list_networks");
      expect(mockApiGet).toHaveBeenCalledWith("/game/default_players");
    });
  });

  it("does not fetch user networks if user is not logged in", async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url === "/game/default_players")
        return Promise.resolve({ data: defaultPlayersData });
      if (url === "/networks/list_networks")
        return Promise.resolve({ data: defaultPlayersData });
      return Promise.reject(new Error("Unknown URL"));
    });
    render(
      <GameControls
        gameState={null}
        status="connected"
        settings={null}
        createGame={mockCreateGame}
        updateSettings={mockUpdateSettings}
      />,
    );
    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledWith("/game/default_players");
      expect(mockApiGet).not.toHaveBeenCalledWith("/networks/list_networks");
    });
  });

  it("calls addError when server connection fails", async () => {
    mockApiGet.mockRejectedValue(new Error("Wall Maria has been breached!"));

    render(
      <GameControls
        gameState={null}
        status="connected"
        settings={null}
        createGame={mockCreateGame}
        updateSettings={mockUpdateSettings}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByText("Betöltés...")).not.toBeInTheDocument();
    });
    expect(mockAddError).toHaveBeenCalledWith("Wall Maria has been breached!");
  });

  it("calls addError when fetching default players fails", async () => {
    mockApiGet.mockRejectedValue(new Error("Titans inside wall Rose!"));

    render(
      <GameControls
        gameState={null}
        status="connected"
        settings={null}
        createGame={mockCreateGame}
        updateSettings={mockUpdateSettings}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByText("Betöltés...")).not.toBeInTheDocument();
    });
    expect(mockAddError).toHaveBeenCalledWith("Titans inside wall Rose!");
  });

  it("update button is not visible when settings do not change", async () => {
    const activeSettings = {
      player1: { id: "human1", type: "human", name: "Te" },
      player2: { id: "random1", type: "random", name: "Random" },
      rounds: 10,
      auto: false,
      player_delay_ms: 1000,
      round_delay_ms: 2000,
    };

    render(
      <GameControls
        gameState={mockGameState}
        status="connected"
        settings={activeSettings}
        createGame={mockCreateGame}
        updateSettings={mockUpdateSettings}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByText("Betöltés...")).not.toBeInTheDocument();
    });

    expect(
      screen.queryByRole("button", { name: "Beállítások frissítése" }),
    ).not.toBeInTheDocument();
  });

  it("update button appears when Rounds input is changed", async () => {
    const activeSettings = {
      player1: { id: "human1", type: "human", name: "Te" },
      player2: { id: "random1", type: "random", name: "Random" },
      rounds: 10,
      auto: false,
      player_delay_ms: 1000,
      round_delay_ms: 2000,
    };

    render(
      <GameControls
        gameState={mockGameState}
        status="connected"
        settings={activeSettings}
        createGame={mockCreateGame}
        updateSettings={mockUpdateSettings}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByText("Betöltés...")).not.toBeInTheDocument();
    });

    const roundsInput = screen.getByLabelText("Körök száma");
    await clearAndType(user, roundsInput, "15");
    await user.tab();

    const updateButton = await screen.findByRole("button", {
      name: "Beállítások frissítése",
    });

    expect(updateButton).toBeInTheDocument();
    expect(updateButton).toBeEnabled();
  });

  it("calls updateSettings with correct data when button is clicked", async () => {
    const activeSettings = {
      player1: { id: "human1", type: "human", name: "Te" },
      player2: { id: "random1", type: "random", name: "Random" },
      rounds: 10,
      auto: false,
      player_delay_ms: 1000,
      round_delay_ms: 2000,
    };

    render(
      <GameControls
        gameState={mockGameState}
        status="connected"
        settings={activeSettings}
        createGame={mockCreateGame}
        updateSettings={mockUpdateSettings}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByText("Betöltés...")).not.toBeInTheDocument();
    });

    const playerDelayInput = screen.getByLabelText("Lépéskésleltetés (mp)");
    await clearAndType(user, playerDelayInput, "5");
    await user.tab();

    const roundsInput = screen.getByLabelText("Körök száma");
    await clearAndType(user, roundsInput, "12");
    await user.tab();

    const updateButton = await screen.findByRole("button", {
      name: "Beállítások frissítése",
    });

    await user.click(updateButton);

    expect(mockUpdateSettings).toHaveBeenCalledTimes(1);
    expect(mockUpdateSettings).toHaveBeenCalledWith({
      rounds: 12,
      player_delay_ms: 5000,
    });
  });

  it.each(["player1", "player2"])(
    "does not show update settings if %s is changed, even if rounds / delay is changed",
    async (changedSetting) => {
      const activeSettings = {
        player1: { id: "human1", type: "human", name: "Te" },
        player2: { id: "random1", type: "random", name: "Random" },
        rounds: 10,
        auto: false,
        player_delay_ms: 1000,
        round_delay_ms: 2000,
      };

      render(
        <GameControls
          gameState={mockGameState}
          status="connected"
          settings={activeSettings}
          createGame={mockCreateGame}
          updateSettings={mockUpdateSettings}
        />,
      );

      await waitFor(() => {
        expect(screen.queryByText("Betöltés...")).not.toBeInTheDocument();
      });

      const playerDelayInput = screen.getByLabelText("Lépéskésleltetés (mp)");
      await clearAndType(user, playerDelayInput, "5");
      await user.tab();

      const roundsInput = screen.getByLabelText("Körök száma");
      await clearAndType(user, roundsInput, "12");
      await user.tab();

      const player1Selector = screen.getByLabelText(
        new RegExp("X játékos", "i"),
      );
      await user.selectOptions(player1Selector, "random");
      await user.tab();
      if (changedSetting === "player2") {
        // he was already random, first we needed to make player 1 random
        const player2Selector = screen.getByLabelText(
          new RegExp("O játékos", "i"),
        );
        await user.selectOptions(player2Selector, "human");
        await user.tab();
      }

      const updateButton = screen.queryByRole("button", {
        name: "Beállítások frissítése",
      });

      expect(updateButton).not.toBeInTheDocument();
    },
  );
});
