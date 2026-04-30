import { render, screen } from "@testing-library/react";
import LearnMenu, { jumpVisible } from "../../src/components/learn/LearnMenu";
import { user } from "../utils";
import type { Mock } from "vitest";
import { fireEvent } from "@testing-library/react";

vi.mock("react-icons/io", () => ({
  IoIosArrowUp: () => <div data-testid="arrow-icon" />,
}));

vi.mock("../../src/components/DropDown", () => ({
  default: ({ options, actions, activeOption }: any) => (
    <div data-testid="mock-dropdown">
      <div data-testid="active-option">{activeOption}</div>
      {options.map((option: string, index: number) => (
        <button key={option} onClick={actions[index]}>
          {option}
        </button>
      ))}
    </div>
  ),
}));

const mockHandleTopicChange = vi.fn();
const topics = {
  t1: "Topic 1",
  t2: "Topic 2",
  t3: "Topic 3",
};
let scrollToSpy: Mock;

describe("LearnMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    scrollToSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders DropDown with options", () => {
    render(
      <LearnMenu
        activeTopic="Topic 1"
        topics={topics}
        handleTopicChange={mockHandleTopicChange}
      />,
    );

    expect(screen.getByTestId("mock-dropdown")).toBeInTheDocument();
    Object.values(topics).forEach((topic) => {
      expect(screen.getByRole("button", { name: topic })).toBeInTheDocument();
    });
  });

  it.each(Object.values(topics))("passes %s as active to DropDown", (value) => {
    render(
      <LearnMenu
        activeTopic={value}
        topics={topics}
        handleTopicChange={mockHandleTopicChange}
      />,
    );

    expect(screen.getByTestId("active-option")).toHaveTextContent(value);
  });

  it.each(Object.values(topics))(
    "calls handleTopicChange when option %s is clicked",
    async (topic) => {
      render(
        <LearnMenu
          activeTopic="Topic 1"
          topics={topics}
          handleTopicChange={mockHandleTopicChange}
        />,
      );
      const button = screen.getByRole("button", { name: topic });
      await user.click(button);
      expect(mockHandleTopicChange).toHaveBeenCalledWith(topic);
    },
  );

  it(`shows button only after scrolling down > ${jumpVisible}px`, () => {
    render(
      <LearnMenu
        activeTopic="Topic 1"
        topics={topics}
        handleTopicChange={mockHandleTopicChange}
      />,
    );

    expect(screen.queryByLabelText("Scroll to top")).not.toBeInTheDocument();

    fireEvent.scroll(window, { target: { scrollY: jumpVisible + 1 } });

    expect(screen.getByLabelText("Scroll to top")).toBeInTheDocument();

    fireEvent.scroll(window, { target: { scrollY: 100 } });

    expect(screen.queryByLabelText("Scroll to top")).not.toBeInTheDocument();
  });

  it("scrolls to top when clicked", async () => {
    render(
      <LearnMenu
        activeTopic="Topic 1"
        topics={topics}
        handleTopicChange={mockHandleTopicChange}
      />,
    );

    fireEvent.scroll(window, { target: { scrollY: jumpVisible + 1 } });

    const scrollButton = screen.getByLabelText("Scroll to top");
    await user.click(scrollButton);

    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });
});
