import { render, screen, waitFor } from "@testing-library/react";
import PlaygroundPage from "../../src/pages/PlaygroundPage";
import { useAuth } from "../../src/contexts/AuthContext";
import { useError } from "../../src/contexts/ErrorContext";
import { useJob } from "../../src/contexts/JobContext";
import api from "../../src/api";
import { user } from "../utils";

vi.mock("../../src/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));
vi.mock("../../src/contexts/ErrorContext", () => ({
  useError: vi.fn(),
}));
vi.mock("../../src/contexts/JobContext", () => ({
  useJob: vi.fn(),
}));

vi.mock("../../src/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
  },
}));

const mockApiGet = vi.mocked(api.get);
const mockApiPost = vi.mocked(api.post);
const mockApiDelete = vi.mocked(api.delete);

const mockUseAuth = vi.mocked(useAuth);
const mockUseError = vi.mocked(useError);
const mockUseJob = vi.mocked(useJob);

vi.mock("../../src/components/playground/NetworkTable", () => ({
  default: ({ networks, deleteNetwork, openEdit, openTrainMenu }: any) => (
    <div data-testid="network-table">
      {networks.map((network: any) => (
        <div key={network.id} data-testid={`network-${network.id}`}>
          {network.name}
          <button onClick={() => deleteNetwork(network.id)}>Delete</button>
          <button onClick={() => openEdit(network.id)}>Edit</button>
          <button onClick={() => openTrainMenu(network.id)}>Train</button>
        </div>
      ))}
    </div>
  ),
}));

vi.mock("../../src/components/playground/NetworkCreateForm", () => ({
  default: ({ onCreateNetwork }: any) => (
    <div data-testid="network-create-form">
      <input data-testid="create-name-input" />
      <button onClick={() => onCreateNetwork("New Network", [18, 9])}>
        Create
      </button>
    </div>
  ),
}));

vi.mock("../../src/components/playground/NetworkTrainingForm", () => ({
  default: ({ onTrainNetwork, networkId }: any) => (
    <div hidden={networkId ? false : true} data-testid="network-training-form">
      <button onClick={() => onTrainNetwork(networkId, 10, 0.01, 0.01)}>
        Start Training
      </button>
    </div>
  ),
}));

vi.mock("../../src/components/playground/NetworkTrainingStatus", () => ({
  default: ({ job, toggled }: any) => (
    <div hidden={toggled ? false : true} data-testid="network-training-status">
      {job ? `Status: ${job.status}` : "No Job"}
      {toggled ? "true" : "false"}
    </div>
  ),
}));

vi.mock("../../src/components/playground/NetworkEditor", () => ({
  default: ({ networkDoc, saveNetwork }: any) => (
    <div data-testid="network-editor">
      {networkDoc ? `Editing: ${networkDoc.name}` : "No Network Selected"}
      <button
        onClick={() => saveNetwork({ ...networkDoc, name: "Updated Name" })}
      >
        Save
      </button>
    </div>
  ),
}));
const mockGetFreshToken = vi.fn();
const mockAddError = vi.fn();
const mockSetJobID = vi.fn();
const mockSetJobNetworkName = vi.fn();
const mockClearJob = vi.fn();
const mockEventSource = vi.fn(() => ({
  close: vi.fn(),
}));

describe("PlaygroundPage", () => {
  const mockNetworks = [
    { id: "1", name: "Net 1", layers: [18, 9], nn: {} },
    { id: "2", name: "Net 2", layers: [18, 18, 9], nn: {} },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuth.mockReturnValue({
      getFreshToken: mockGetFreshToken,
    } as any);

    mockUseError.mockReturnValue({
      addError: mockAddError,
    });

    mockUseJob.mockReturnValue({
      jobID: null,
      jobNetworkName: null,
      setJobNetworkName: mockSetJobNetworkName,
      setJobID: mockSetJobID,
      clearJob: mockClearJob,
    });

    mockApiGet.mockResolvedValue({ data: mockNetworks });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders", async () => {
    render(<PlaygroundPage />);
    expect(screen.getByTestId("network-table")).toBeEmptyDOMElement();

    await waitFor(() => {
      expect(screen.getByText(/Barkácsolás/i)).toBeInTheDocument();
      expect(screen.getByTestId("network-training-form")).not.toBeVisible();
      expect(screen.getByTestId("network-training-status")).not.toBeVisible();
      expect(screen.getByTestId("network-table")).not.toBeEmptyDOMElement();
      expect(screen.queryByTestId("network-editor")).not.toBeInTheDocument();
    });
  });

  it("renders and fetches networks on mount", async () => {
    render(<PlaygroundPage />);

    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledWith("/networks/list_networks");
      expect(screen.getByTestId("network-1")).toHaveTextContent("Net 1");
      expect(screen.getByTestId("network-2")).toHaveTextContent("Net 2");
    });
  });

  it("creates a new network", async () => {
    const newNetwork = {
      // should match the shape used in the mock component
      id: "3",
      name: "New Network",
      layers: [18, 9],
      nn: {},
    };
    mockApiPost.mockResolvedValue({ data: newNetwork });

    render(<PlaygroundPage />);

    const createButton = screen.getByText("Create");
    await user.click(createButton);

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith("/networks/create_network", {
        name: newNetwork.name,
        layers: newNetwork.layers,
      });
      expect(screen.getByTestId("network-3")).toHaveTextContent(
        newNetwork.name,
      );
    });
  });

  it("deletes a network", async () => {
    mockApiDelete.mockResolvedValue({ data: { message: "Deleted" } });

    render(<PlaygroundPage />);

    await waitFor(() => {
      expect(screen.getByTestId("network-1")).toBeInTheDocument();
    });

    const deleteButton = screen.getAllByText("Delete")[0]!;
    await user.click(deleteButton);

    await waitFor(() => {
      expect(mockApiDelete).toHaveBeenCalledWith("/networks/1");
    });

    expect(screen.queryByTestId("network-1")).not.toBeInTheDocument();
  });

  it("opens edit mode", async () => {
    render(<PlaygroundPage />);

    await waitFor(() => {
      expect(screen.getByTestId("network-1")).toBeInTheDocument();
    });

    const editButton = screen.getAllByText("Edit")[0]!;
    await user.click(editButton);

    expect(screen.getByTestId("network-editor")).toHaveTextContent(
      "Editing: Net 1",
    );
  });

  it("starts training a network and opens EventSource", async () => {
    const mockJobStatus = { jobId: "job-123", status: "queued", progress: 0 };
    mockApiPost.mockResolvedValue({ data: mockJobStatus });
    mockGetFreshToken.mockResolvedValue("fresh-token");

    vi.stubGlobal("EventSource", mockEventSource);

    render(<PlaygroundPage />);

    await waitFor(() => {
      expect(screen.getByTestId("network-1")).toBeInTheDocument();
    });

    const trainMenuButton = screen.getAllByText("Train")[0]!;
    await user.click(trainMenuButton);

    const startButton = screen.getByText("Start Training");
    await user.click(startButton);

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith(
        "/jobs/train",
        expect.objectContaining({
          networkId: "1",
        }),
      );
      expect(mockSetJobID).toHaveBeenCalledWith("job-123");
      expect(mockSetJobNetworkName).toHaveBeenCalledWith("Net 1");
      expect(mockEventSource).toHaveBeenCalledTimes(1);
    });
  });

  it("reconnects to existing job on mount", async () => {
    mockUseJob.mockReturnValue({
      jobID: "existing-job",
      jobNetworkName: "Existing Net",
      setJobNetworkName: mockSetJobNetworkName,
      setJobID: mockSetJobID,
      clearJob: mockClearJob,
    });

    const mockStatus = {
      jobId: "existing-job",
      status: "running",
      progress: 0.5,
    };
    mockApiGet.mockImplementation((url: string) => {
      if (url === "/jobs/train/existing-job/status") {
        return Promise.resolve({ data: mockStatus });
      }
      if (url === "/networks/list_networks") {
        return Promise.resolve({ data: mockNetworks });
      }
      return Promise.reject(new Error("Not found"));
    });
    mockGetFreshToken.mockResolvedValue("fake-token");

    vi.stubGlobal("EventSource", mockEventSource);

    render(<PlaygroundPage />);

    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledWith(
        "/jobs/train/existing-job/status",
      );
    });
    expect(screen.getByTestId("network-training-status")).toHaveTextContent(
      /Status: running/i,
    );
    expect(screen.getByTestId("network-training-status")).toHaveTextContent(
      /true/i,
    );
    expect(screen.getByTestId("network-training-status")).toBeVisible();
    expect(mockGetFreshToken).toHaveBeenCalled();

    await waitFor(() => {
      expect(mockEventSource).toHaveBeenCalledTimes(1);
    });
  });

  it.each(["error", "done"])(
    "clears jobContext if jobstatus is %s, but shows the retrieved status",
    async (status) => {
      mockUseJob.mockReturnValue({
        jobID: "existing-job",
        jobNetworkName: "Net 1",
        setJobNetworkName: mockSetJobNetworkName,
        setJobID: mockSetJobID,
        clearJob: mockClearJob,
      });

      const mockStatus = {
        jobId: "existing-job",
        status: status,
        progress: 0.5,
      };
      mockApiGet.mockImplementation((url: string) => {
        if (url === "/jobs/train/existing-job/status") {
          return Promise.resolve({ data: mockStatus });
        }
        if (url === "/networks/list_networks") {
          return Promise.resolve({ data: mockNetworks });
        }
        return Promise.reject(new Error("Not found"));
      });
      mockGetFreshToken.mockResolvedValue("fake-token");

      vi.stubGlobal("EventSource", mockEventSource);

      render(<PlaygroundPage />);

      await waitFor(() => {
        expect(mockApiGet).toHaveBeenCalledWith(
          "/jobs/train/existing-job/status",
        );
      });
      expect(screen.getByTestId("network-training-status")).toHaveTextContent(
        new RegExp(`Status: ${status}`, "i"),
      );
      expect(screen.getByTestId("network-training-status")).toHaveTextContent(
        /true/i,
      );
      expect(screen.getByTestId("network-training-status")).toBeVisible();

      expect(mockGetFreshToken).not.toHaveBeenCalled();
      expect(mockClearJob).toHaveBeenCalled();
      expect(mockEventSource).toHaveBeenCalledTimes(0);
    },
  );

  it("does not reconnect if jobContext is empty", async () => {
    vi.stubGlobal("EventSource", mockEventSource);

    render(<PlaygroundPage />);

    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledExactlyOnceWith(
        "/networks/list_networks",
      );
    });
    expect(mockGetFreshToken).not.toHaveBeenCalled();
    expect(mockEventSource).toHaveBeenCalledTimes(0);
    expect(screen.getByTestId("network-training-status")).toHaveTextContent(
      /no job/i,
    );
    expect(screen.getByTestId("network-training-status")).toHaveTextContent(
      /false/i,
    );
    expect(screen.getByTestId("network-training-status")).not.toBeVisible();
  });
});
