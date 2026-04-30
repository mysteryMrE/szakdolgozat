import { render, screen } from "@testing-library/react";
import LearnPage from "../../src/pages/LearnPage";
import type { Mock } from "vitest";
import { user } from "../utils";

vi.mock("../../src/components/learn/random/RandomContent", () => ({
  default: () => <div data-testid="random-content">Random Content</div>,
}));
vi.mock("../../src/components/learn/menace/MenaceContent", () => ({
  default: () => <div data-testid="menace-content">Menace Content</div>,
}));
vi.mock("../../src/components/learn/minimax/MinimaxContent", () => ({
  default: () => <div data-testid="minimax-content">Minimax Content</div>,
}));
vi.mock(
  "../../src/components/learn/neuralnetwork/NeuralNetworkContent",
  () => ({
    default: () => (
      <div data-testid="neural-content">Neural Network Content</div>
    ),
  }),
);
vi.mock("../../src/components/learn/genetic/GeneticContent", () => ({
  default: () => <div data-testid="genetic-content">Genetic Content</div>,
}));
vi.mock("../../src/components/learn/backprop/BackpropagationContent", () => ({
  default: () => (
    <div data-testid="backprop-content">Backpropagation Content</div>
  ),
}));

vi.mock("../../src/pages/SmallScreen", () => ({
  default: ({ text }: any) => <div data-testid="fallback-content">{text}</div>,
}));

vi.mock("../../src/components/learn/LearnMenu", () => ({
  default: ({ handleTopicChange, topics }: any) => (
    <div data-testid="learn-menu">
      {Object.entries(topics).map(([key, label]: any) => (
        <button key={key} onClick={() => handleTopicChange(label)}>
          {label}
        </button>
      ))}
      <button onClick={() => handleTopicChange("INVALID_TOPIC")}>
        Invalid Topic
      </button>
    </div>
  ),
}));

// AI assisted mock solution
vi.mock("better-react-mathjax", () => ({
  MathJaxContext: ({ children }: any) => <div>{children}</div>,
}));

let scrollToSpy: Mock;

describe("LearnPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    scrollToSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it.each([["Random", "random content"]])(
    "renders page with default topic %s",
    (_, content) => {
      render(<LearnPage />);
      expect(screen.getByText(new RegExp(content, "i"))).toBeInTheDocument();
    },
  );

  it.each([
    ["Random", "random content"],
    ["Menace", "menace content"],
    ["Minimax", "minimax content"],
    ["Neuronháló", "neural network content"],
    ["Genetikus algoritmus", "genetic content"],
    ["Visszaterjesztés", "backpropagation content"],
  ])(
    "renders page with topic %s when selected from menu",
    async (topic, content) => {
      render(<LearnPage />);

      const button = screen.getByText(topic);
      await user.click(button);

      expect(screen.getByText(new RegExp(content, "i"))).toBeInTheDocument();
    },
  );

  it("scrolls to top of the window when the topic changes", async () => {
    render(<LearnPage />);
    scrollToSpy.mockClear();

    const menaceButton = screen.getByText("Menace");
    await user.click(menaceButton);

    expect(scrollToSpy).toHaveBeenCalledTimes(1);
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: "instant" });
  });

  it("renders fallback content for invalid topic", async () => {
    render(<LearnPage />);

    const invalidButton = screen.getByText("Invalid Topic");
    await user.click(invalidButton);

    expect(screen.getByTestId("fallback-content")).toHaveTextContent(
      "Ez a tartalom nem létezik.",
    );
  });
});
