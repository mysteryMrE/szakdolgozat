import { screen, act, fireEvent } from "@testing-library/react";
import { render } from "../utils";
import { useError, showDuration } from "../../src/contexts/ErrorContext";

/**
 * AI assisted mocking
 */

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children }: any) => <div data-testid="alertDiv">{children}</div>,
  },
  AnimatePresence: ({ children }: any) => (
    <div data-testid="animateDiv">{children}</div>
  ),
}));

const TestComponent = ({ message }: any) => {
  const { addError } = useError();
  return <button onClick={() => addError(message)}>Add Error</button>;
};

const ttl = showDuration;

describe("Error Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    let time = 0;
    vi.spyOn(Date, "now").mockImplementation(() => {
      time += 100;
      return time;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it.each([ttl])(
    "displays and removes notification when error is triggered",
    async (ttl) => {
      const message = "Not a translated error!";
      render(<TestComponent message={message} />);

      expect(screen.queryByTestId("alertDiv")).not.toBeInTheDocument();
      expect(screen.queryByTestId("animateDiv")).toBeInTheDocument();

      const button = screen.getByText(/add error/i);
      fireEvent.click(button); // synchronous, better with the fake timers

      expect(screen.getByText(new RegExp(message, "i"))).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(ttl);
      });

      expect(
        screen.queryByText(new RegExp(message, "i")),
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId("alertDiv")).not.toBeInTheDocument();
      expect(screen.queryByTestId("animateDiv")).toBeInTheDocument();
    },
  );

  it.each([ttl])(
    "handles multiple errors correctly, with %d timeout",
    (ttl) => {
      const messages = [
        "First Error",
        "Second Error",
        "Third Error",
        "Fourth Error",
        "Fifth Error",
      ];
      const { rerender } = render(<TestComponent message="" />);
      const button = screen.getByText(/add error/i);

      expect(screen.queryByTestId("alertDiv")).not.toBeInTheDocument();
      expect(screen.queryByTestId("animateDiv")).toBeInTheDocument();

      const spacing = Math.floor(ttl / messages.length);
      const expiryTimes: number[] = [];

      messages.forEach((msg, i) => {
        const currentTime = i * spacing;
        if (i > 0) {
          act(() => {
            vi.advanceTimersByTime(spacing);
          });
        }
        rerender(<TestComponent message={msg} />);
        fireEvent.click(button);

        expiryTimes.push(currentTime + ttl);
        expect(screen.getByText(new RegExp(msg, "i"))).toBeInTheDocument();
      });

      // remaining time is 1 spacing, so all messages should still be there
      let currentTime = spacing * (messages.length - 1);
      expect(screen.getAllByTestId("alertDiv")).toHaveLength(messages.length);

      messages.forEach((msg, i) => {
        const timeToExpiry = expiryTimes[i]! - currentTime;

        act(() => {
          vi.advanceTimersByTime(timeToExpiry);
        });

        currentTime = expiryTimes[i]!;

        // i should fall
        expect(
          screen.queryByText(new RegExp(msg, "i")),
        ).not.toBeInTheDocument();

        // others remain
        for (let j = i + 1; j < messages.length; j++) {
          expect(
            screen.getByText(new RegExp(messages[j]!, "i")),
          ).toBeInTheDocument();
        }
      });
      // "and there were none"
      expect(screen.queryByTestId("alertDiv")).not.toBeInTheDocument();
      expect(screen.queryByTestId("animateDiv")).toBeInTheDocument();
    },
  );
});
