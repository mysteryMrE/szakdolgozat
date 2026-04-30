import { render, screen } from "@testing-library/react";
import Notification from "../../src/components/Notification";
import { type NotificationMessage } from "../../src/types";

// AI assisted mock for framer-motion

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children }: any) => <div data-testid="alertDiv">{children}</div>,
  },
  AnimatePresence: ({ children }: any) => (
    <div data-testid="animateDiv">{children}</div>
  ),
}));

describe("Notification Component", () => {
  it("renders no messages when messages array is empty", () => {
    render(<Notification messages={[]} />);
    expect(screen.queryByTestId("alertDiv")).not.toBeInTheDocument();
    expect(screen.queryByTestId("animateDiv")).toBeInTheDocument();
  });

  it("renders messages correctly", () => {
    const messages: NotificationMessage[] = [
      { id: "1", message: "Test error message 1" },
      { id: "2", message: "Test error message 2" },
    ];

    render(<Notification messages={messages} />);
    expect(screen.queryAllByTestId("alertDiv")).toHaveLength(messages.length);
    for (const msg of messages) {
      expect(screen.getByText(msg.message)).toBeInTheDocument();
    }
  });

  it("translates known error messages", () => {
    const messages: NotificationMessage[] = [
      { id: "1", message: "Password is too long" },
      { id: "2", message: "Username taken" },
    ];
    const translations: Record<string, string> = {
      "Password is too long": "A jelszó túl hosszú",
      "Username taken": "A felhasználónév foglalt",
    };

    render(<Notification messages={messages} />);

    for (const msg of messages) {
      expect(screen.getByText(translations[msg.message]!)).toBeInTheDocument();
    }
  });

  it("renders unknown messages as is", () => {
    const message: NotificationMessage = {
      id: "1",
      message: "Unknown server error",
    };
    render(<Notification messages={[message]} />);

    expect(screen.getByText(message.message)).toBeInTheDocument();
  });
});
