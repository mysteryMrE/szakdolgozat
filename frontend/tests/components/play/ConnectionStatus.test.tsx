import { render, screen } from "@testing-library/react";
import type { ConnectionStatus as ConnectionStatusType } from "../../../src/types";
import { user } from "../../utils";
import ConnectionStatus from "../../../src/components/play/ConnectionStatus";

const tryReconnect = vi.fn();
const statuses: ConnectionStatusType[] = [
  "connected",
  "error",
  "connecting",
  "idle",
];
const statusMap = {
  connected: "Csatlakozva",
  error: "Hiba történt",
  connecting: "Csatlakozás",
  idle: "Nincs kapcsolat",
};

describe("ConnectionStatus", () => {
  it.each(statuses)(
    "renders correct translated status message for status: %s",
    (status) => {
      render(<ConnectionStatus status={status} tryReconnect={tryReconnect} />);
      expect(
        screen.getByText(new RegExp(statusMap[status])),
      ).toBeInTheDocument();
    },
  );

  it("is a button when tryReconnect is provided and status is idle", async () => {
    render(<ConnectionStatus status="idle" tryReconnect={tryReconnect} />);

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("is a button when tryReconnect is provided and status is error", async () => {
    render(<ConnectionStatus status="error" tryReconnect={tryReconnect} />);

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("is not a button when tryReconnect is provided and status is connected", async () => {
    render(<ConnectionStatus status="connected" tryReconnect={tryReconnect} />);

    const button = screen.queryByRole("button");
    expect(button).not.toBeInTheDocument();
  });

  it("is not a button when tryReconnect is provided and status is connecting", async () => {
    render(
      <ConnectionStatus status="connecting" tryReconnect={tryReconnect} />,
    );

    const button = screen.queryByRole("button");
    expect(button).not.toBeInTheDocument();
  });

  it("is a not a button when tryReconnect is not provided", () => {
    render(<ConnectionStatus status="idle" />);

    const button = screen.queryByRole("button");

    expect(button).not.toBeInTheDocument();
  });

  it("calls tryReconnect when clicked", async () => {
    render(<ConnectionStatus status="idle" tryReconnect={tryReconnect} />);
    const button = screen.getByRole("button");

    await user.click(button);
    expect(tryReconnect).toHaveBeenCalled();
  });
});
