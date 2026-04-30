import { render, screen } from "@testing-library/react";
import NetworkTrainingStatus from "../../../src/components/playground/NetworkTrainingStatus";
import { type TrainStatus } from "../../../src/types";

const defaultJob: TrainStatus = {
  jobId: "job1",
  status: "running",
  progress: 0.5,
  accuracy: 0.85,
  loss: 0.15,
  networkName: "My Network",
  history: [],
};

describe("NetworkTrainingStatus", () => {
  it("renders nothing when job is null", () => {
    const { container } = render(
      <NetworkTrainingStatus job={null} toggled={true} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when toggled is false", () => {
    const { container } = render(
      <NetworkTrainingStatus job={defaultJob} toggled={false} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders job details correctly", () => {
    render(<NetworkTrainingStatus job={defaultJob} toggled={true} />);

    expect(screen.getByText(new RegExp("My Network", "i"))).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp("Folyamatban", "i")),
    ).toBeInTheDocument();
    expect(screen.getByText(new RegExp("85.00%", "i"))).toBeInTheDocument();
    expect(screen.getByText(new RegExp("0.15000", "i"))).toBeInTheDocument();
  });

  it("does not render graph, if history is empty", () => {
    render(<NetworkTrainingStatus job={defaultJob} toggled={true} />);

    const progress = screen.queryByTestId("line-graph-empty");
    expect(progress).not.toBeInTheDocument();
  });

  it("renders line graph, if history is not empty", () => {
    const jobWithHistory: TrainStatus = {
      ...defaultJob,
      history: [0.1, 0.2, 0.3, 0.4, 0.5],
    };
    render(<NetworkTrainingStatus job={jobWithHistory} toggled={true} />);

    const progress = screen.getByRole("img", {
      name: new RegExp("Line chart", "i"),
    });
    expect(progress).toBeInTheDocument();
  });

  it("renders error status correctly", () => {
    const errorJob: TrainStatus = {
      ...defaultJob,
      status: "error",
      error: "Something went wrong",
    };

    render(<NetworkTrainingStatus job={errorJob} toggled={true} />);

    expect(screen.getByText("Hiba")).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp("Something went wrong", "i")),
    ).toBeInTheDocument();
  });

  it("renders done status correctly", () => {
    const doneJob: TrainStatus = {
      ...defaultJob,
      status: "done",
      progress: 1,
    };

    render(<NetworkTrainingStatus job={doneJob} toggled={true} />);

    expect(screen.getByText("Kész")).toBeInTheDocument();
  });

  it("renders queued status correctly", () => {
    const queuedJob: TrainStatus = {
      ...defaultJob,
      status: "queued",
      progress: 0,
    };

    render(<NetworkTrainingStatus job={queuedJob} toggled={true} />);

    expect(screen.getByText("Várakozás")).toBeInTheDocument();
  });

  it("does not render accuracy if undefined", () => {
    const jobWithoutAccuracy: TrainStatus = {
      ...defaultJob,
      accuracy: undefined,
    };
    render(<NetworkTrainingStatus job={jobWithoutAccuracy} toggled={true} />);

    expect(
      screen.queryByText(new RegExp("Pontosság", "i")),
    ).not.toBeInTheDocument();
  });
});
