import { render, screen } from "@testing-library/react";
import NetworkTrainingForm from "../../../src/components/playground/NetworkTrainingForm";
import { type TrainStatus } from "../../../src/types";
import { user, clearAndType } from "../../utils";

const mockOnTrainNetwork = vi.fn();

const defaultProps = {
  networkId: "Eagle 1",
  networkName: "POTUS",
  onTrainNetwork: mockOnTrainNetwork,
  job: null,
};

describe("NetworkTrainingForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders form correctly when networkId is present", () => {
    render(<NetworkTrainingForm {...defaultProps} />);

    expect(screen.getByText(defaultProps.networkName)).toBeInTheDocument();
    expect(
      screen.getByLabelText(new RegExp("Iterációk száma", "i")),
    ).toHaveValue(10);
    expect(
      screen.getByLabelText(new RegExp("Kezdeti tanulási ráta", "i")),
    ).toHaveValue(0.01);
    expect(
      screen.getByLabelText(new RegExp("Korai terminálási határ", "i")),
    ).toHaveValue(0.01);
    expect(
      screen.getByRole("button", { name: new RegExp("tanítás indítása", "i") }),
    ).toBeInTheDocument();
  });

  it("does not render form when networkId is null", () => {
    const { container } = render(
      <NetworkTrainingForm {...defaultProps} networkId={null} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("updates epochs value on change", async () => {
    render(<NetworkTrainingForm {...defaultProps} />);

    const epochsInput = screen.getByLabelText(
      new RegExp("Iterációk száma", "i"),
    );
    await clearAndType(user, epochsInput, "500");

    expect(epochsInput).toHaveValue(500);
  });

  it("updates learning rate value on change", async () => {
    render(<NetworkTrainingForm {...defaultProps} />);
    const LosRatonesInput = screen.getByLabelText(
      new RegExp("Kezdeti tanulási ráta", "i"),
    );
    await clearAndType(user, LosRatonesInput, "0.05");
    expect(LosRatonesInput).toHaveValue(0.05);
  });

  it("updates early stopping value on change", async () => {
    render(<NetworkTrainingForm {...defaultProps} />);
    const stopInput = screen.getByLabelText(
      "Korai terminálási határ (veszteség)",
    );
    await clearAndType(user, stopInput, "10");
    expect(stopInput).toHaveValue(10);
  });

  it("clamps epochs value on blur", async () => {
    render(
      <NetworkTrainingForm {...defaultProps} minEpochs={10} maxEpochs={1000} />,
    );
    const epochsInput = screen.getByLabelText(
      new RegExp("Iterációk száma", "i"),
    );
    await clearAndType(user, epochsInput, "5000");
    await user.tab();
    expect(epochsInput).toHaveValue(1000);

    await clearAndType(user, epochsInput, "5");
    await user.tab();
    expect(epochsInput).toHaveValue(10);
  });

  it("clamps learning rate value on blur", async () => {
    render(
      <NetworkTrainingForm
        {...defaultProps}
        minLearningRate={0.001}
        maxLearningRate={10}
      />,
    );
    const LosRatonesInput = screen.getByLabelText(
      new RegExp("Kezdeti tanulási ráta", "i"),
    );
    await clearAndType(user, LosRatonesInput, "20");
    await user.tab();
    expect(LosRatonesInput).toHaveValue(10);

    await clearAndType(user, LosRatonesInput, "0.0001");
    await user.tab();
    expect(LosRatonesInput).toHaveValue(0.001);
  });

  it("clamps early stopping value on blur", async () => {
    render(
      <NetworkTrainingForm
        {...defaultProps}
        minEarlyStopping={1}
        maxEarlyStopping={15}
      />,
    );
    const stopInput = screen.getByLabelText(
      new RegExp("Korai terminálási határ", "i"),
    );
    await clearAndType(user, stopInput, "20");
    await user.tab();
    expect(stopInput).toHaveValue(15);

    await clearAndType(user, stopInput, "0");
    await user.tab();
    expect(stopInput).toHaveValue(1);
  });

  it("clamps values on submit and passes normalized payload", async () => {
    render(
      <NetworkTrainingForm
        {...defaultProps}
        minEpochs={10}
        maxEpochs={1000}
        minLearningRate={0.001}
        maxLearningRate={10}
        minEarlyStopping={1}
        maxEarlyStopping={15}
      />,
    );
    const epochsInput = screen.getByLabelText(
      new RegExp("Iterációk száma", "i"),
    );
    const LosRatonesInput = screen.getByLabelText(
      new RegExp("Kezdeti tanulási ráta", "i"),
    );
    const stopInput = screen.getByLabelText(
      new RegExp("Korai terminálási határ", "i"),
    );
    const submitButton = screen.getByRole("button", {
      name: /tanítás indítása/i,
    });

    await clearAndType(user, epochsInput, "5000");
    await clearAndType(user, LosRatonesInput, "20");
    await clearAndType(user, stopInput, "0");
    await user.click(submitButton);

    expect(epochsInput).toHaveValue(1000);
    expect(LosRatonesInput).toHaveValue(10);
    expect(stopInput).toHaveValue(1);
    expect(mockOnTrainNetwork).toHaveBeenCalledWith(
      defaultProps.networkId,
      1000,
      10,
      1,
    );
  });

  it("calls onTrainNetwork on submit", async () => {
    render(<NetworkTrainingForm {...defaultProps} />);

    const submitButton = screen.getByRole("button", {
      name: new RegExp("tanítás indítása", "i"),
    });
    await user.click(submitButton);

    expect(mockOnTrainNetwork).toHaveBeenCalled();
  });

  it("disables submit button when job is running", () => {
    const runningJob: TrainStatus = {
      jobId: "job1",
      status: "running",
      progress: 0.5,
    };

    render(<NetworkTrainingForm {...defaultProps} job={runningJob} />);
    const submitButton = screen.getByRole("button", {
      name: new RegExp("tanítás indítása", "i"),
    });

    expect(submitButton).toBeDisabled();
  });

  it("does not call onTrainNetwork if job is running", async () => {
    const runningJob: TrainStatus = {
      jobId: "job1",
      status: "running",
      progress: 0.5,
    };

    render(<NetworkTrainingForm {...defaultProps} job={runningJob} />);
    const submitButton = screen.getByRole("button", {
      name: new RegExp("tanítás indítása", "i"),
    });

    await user.click(submitButton);
    expect(mockOnTrainNetwork).not.toHaveBeenCalled();
  });
});
