import { render, screen } from "@testing-library/react";
import { JobProvider, useJob } from "../../src/contexts/JobContext";
import { useAuth } from "../../src/contexts/AuthContext";
import { user } from "../utils";

vi.mock("../../src/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));
const mockUseAuth = vi.mocked(useAuth);

const TestComponent = () => {
  const { jobID, jobNetworkName, setJobID, setJobNetworkName, clearJob } =
    useJob();
  return (
    <div>
      <div data-testid="job-id">{jobID ?? "No Job ID"}</div>
      <div data-testid="job-network-name">
        {jobNetworkName ?? "No Network Name"}
      </div>
      <button data-testid="set-job-id" onClick={() => setJobID("job-123")}>
        Set Job ID
      </button>
      <button
        data-testid="set-job-network-name"
        onClick={() => setJobNetworkName("Test Network")}
      >
        Set Network Name
      </button>
      <button data-testid="clear-job" onClick={() => clearJob()}>
        Clear Job
      </button>
    </div>
  );
};

describe("JobContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: "id-123", username: "testuser" },
    } as any);
  });

  it("starts with empty state", () => {
    render(
      <JobProvider>
        <TestComponent />
      </JobProvider>,
    );

    expect(screen.getByTestId("job-id")).toHaveTextContent("No Job ID");
    expect(screen.getByTestId("job-network-name")).toHaveTextContent(
      "No Network Name",
    );
  });

  it("sets jobID", async () => {
    render(
      <JobProvider>
        <TestComponent />
      </JobProvider>,
    );

    const setJobIDButton = screen.getByTestId("set-job-id");
    await user.click(setJobIDButton);

    expect(screen.getByTestId("job-id")).toHaveTextContent(/job-123/i);
  });

  it("sets jobNetworkName", async () => {
    render(
      <JobProvider>
        <TestComponent />
      </JobProvider>,
    );

    const setJobNetworkNameButton = screen.getByTestId("set-job-network-name");
    await user.click(setJobNetworkNameButton);

    expect(screen.getByTestId("job-network-name")).toHaveTextContent(
      /Test Network/i,
    );
  });

  it("clears job state if clearJob is called", async () => {
    render(
      <JobProvider>
        <TestComponent />
      </JobProvider>,
    );

    const setJobIDButton = screen.getByTestId("set-job-id");
    const setJobNetworkNameButton = screen.getByTestId("set-job-network-name");
    const clearJobButton = screen.getByTestId("clear-job");

    await user.click(setJobIDButton);
    await user.click(setJobNetworkNameButton);
    await user.click(clearJobButton);

    expect(screen.getByTestId("job-id")).toHaveTextContent(
      new RegExp("No Job ID", "i"),
    );
    expect(screen.getByTestId("job-network-name")).toHaveTextContent(
      new RegExp("No Network Name", "i"),
    );
  });

  it("clears state if user is null", async () => {
    const { rerender } = render(
      <JobProvider>
        <TestComponent />
      </JobProvider>,
    );

    const setJobIDButton = screen.getByTestId("set-job-id");
    const setJobNetworkNameButton = screen.getByTestId("set-job-network-name");
    await user.click(setJobIDButton);
    await user.click(setJobNetworkNameButton);

    mockUseAuth.mockReturnValue({
      user: null,
    } as any);

    rerender(
      <JobProvider>
        <TestComponent />
      </JobProvider>,
    );

    expect(screen.getByTestId("job-id")).toHaveTextContent(
      new RegExp("No Job ID", "i"),
    );
    expect(screen.getByTestId("job-network-name")).toHaveTextContent(
      new RegExp("No Network Name", "i"),
    );
  });
});
