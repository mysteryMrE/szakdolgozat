import { render, screen, act } from "@testing-library/react";
import {
  ErrorProvider,
  useError,
  showDuration,
} from "../../src/contexts/ErrorContext";
import { useEffect } from "react";

vi.mock("../../src/components/Notification", () => ({
  default: ({ messages }: any) => (
    <div data-testid="notification-container">
      {messages.map((msg: any) => (
        <div
          key={msg.id}
          data-testid={`notification-message`}
          data-keyid={msg.id}
        >
          {msg.message}
        </div>
      ))}
    </div>
  ),
}));

const TestComponent = ({ messages }: any) => {
  const { addError } = useError();

  useEffect(() => {
    if (messages && messages.length > 0) {
      messages.forEach((message: string) => {
        addError(message);
      });
    }
  }, [messages]);

  return <div>Test Component</div>;
};

const ttl = showDuration;

describe("ErrorContext", () => {
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

  it("add errors and tries to displays them", () => {
    render(
      <ErrorProvider>
        <TestComponent messages={["Test Error", "Another Error"]} />
      </ErrorProvider>,
    );
    const messages = screen.getAllByTestId("notification-message");
    expect(messages).toHaveLength(2);
    expect(messages[0]).toHaveTextContent("Test Error");
    expect(messages[1]).toHaveTextContent("Another Error");
  });

  it("uses unique IDs for each error", () => {
    render(
      <ErrorProvider>
        <TestComponent messages={["Error 1", "Error 2", "Error 3"]} />
      </ErrorProvider>,
    );
    const messages = screen.getAllByTestId("notification-message");
    expect(messages).toHaveLength(3);
    const keys = messages.map((msg) => msg.getAttribute("data-keyid"));
    expect(keys).toHaveLength(3);
    expect(keys[0]).not.toBe(keys[1]);
    expect(keys[0]).not.toBe(keys[2]);
    expect(keys[1]).not.toBe(keys[2]);
  });

  it.each([ttl])("removes the error after %d milliseconds", (milliseconds) => {
    render(
      <ErrorProvider>
        <TestComponent messages={["Test Error"]} />
      </ErrorProvider>,
    );

    expect(screen.getByTestId("notification-message")).toHaveTextContent(
      "Test Error",
    );

    act(() => {
      vi.advanceTimersByTime(milliseconds);
    });
    const messages = screen.queryAllByTestId("notification-message");
    expect(messages.length).toBe(0);
    expect(screen.queryByTestId("notification-container")).toBeInTheDocument();
  });

  it.each([ttl])(
    "removes only the correct error after %d milliseconds",
    (milliseconds) => {
      const { rerender } = render(
        <ErrorProvider>
          <TestComponent messages={["Error 1"]} />
        </ErrorProvider>,
      );

      expect(screen.queryAllByTestId("notification-message")).toHaveLength(1);

      vi.advanceTimersByTime(Math.floor(milliseconds / 2));

      rerender(
        <ErrorProvider>
          <TestComponent messages={["Error 2"]} />
        </ErrorProvider>,
      );

      expect(screen.queryAllByTestId("notification-message")).toHaveLength(2);

      act(() => {
        vi.advanceTimersByTime(Math.floor(milliseconds / 2) + 1);
      });

      expect(screen.queryAllByTestId("notification-message")).toHaveLength(1);
      expect(screen.getByTestId("notification-message")).toHaveTextContent(
        "Error 2",
      );

      act(() => {
        vi.advanceTimersByTime(Math.floor(milliseconds / 2) + 1);
      });

      expect(screen.queryAllByTestId("notification-message")).toHaveLength(0);
    },
  );
});
