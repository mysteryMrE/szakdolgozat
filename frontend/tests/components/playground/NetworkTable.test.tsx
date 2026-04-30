import { render, screen } from "@testing-library/react";
import { user } from "../../utils";
import NetworkTable from "../../../src/components/playground/NetworkTable";

const mockOpenEdit = vi.fn();
const mockOpenTrainMenu = vi.fn();
const mockDeleteNetwork = vi.fn();

const networks = [
  {
    id: "Black",
    name: "Clover",
    nn: { layers: [18, 10, 9] },
    meta: { epochs_completed: 100, accuracy: 0.95, loss: 0.05 },
  },
  {
    id: "Vinland",
    name: "Saga",
    nn: { layers: [18, 9] },
    meta: {},
  },
];

const defaultProps = {
  toggled: true,
  teachNetworkId: null,
  editNetworkId: null,
  networks: networks,
  openEdit: mockOpenEdit,
  openTrainMenu: mockOpenTrainMenu,
  deleteNetwork: mockDeleteNetwork,
};

describe("NetworkTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when toggled is false", () => {
    render(<NetworkTable {...defaultProps} toggled={false} />);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("renders empty message when networks list is empty", () => {
    render(<NetworkTable {...defaultProps} networks={[]} />);
    expect(
      screen.getByText("Nem található hálózat. Hozz létre egyet!"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("renders table with networks when toggled is true and networks exist", () => {
    render(<NetworkTable {...defaultProps} />);

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Clover")).toBeInTheDocument();
    expect(screen.getByText("Saga")).toBeInTheDocument();
    expect(screen.getByText("Név")).toBeInTheDocument();
    expect(screen.getByText("Rétegek")).toBeInTheDocument();
    expect(screen.getByText("Statisztikák")).toBeInTheDocument();
    expect(screen.getByText("18, 10, 9")).toBeInTheDocument();
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBe(6);
  });

  it("displays statistics correctly", () => {
    render(<NetworkTable {...defaultProps} />);

    expect(screen.getByText(new RegExp("Iterációk: 100"))).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp("Pontosság: 95.00%")),
    ).toBeInTheDocument();
    expect(screen.getByText(new RegExp("Veszteség: 0.05"))).toBeInTheDocument();
    expect(screen.getByText(new RegExp("Nem tanított"))).toBeInTheDocument();
  });

  it("calls openEdit when edit button is clicked", async () => {
    render(<NetworkTable {...defaultProps} />);

    const editButtons = screen.getAllByRole("button", { name: "Szerkesztés" });
    await user.click(editButtons[0]!);

    expect(mockOpenEdit).toHaveBeenCalledWith("Black");
  });

  it("calls openTrainMenu when train button is clicked", async () => {
    render(<NetworkTable {...defaultProps} />);

    const trainButtons = screen.getAllByRole("button", { name: "Tanítás" });
    await user.click(trainButtons[0]!);

    expect(mockOpenTrainMenu).toHaveBeenCalledWith("Black");
  });

  it("calls deleteNetwork when delete button is clicked", async () => {
    render(<NetworkTable {...defaultProps} />);

    const deleteButtons = screen.getAllByRole("button", { name: "Törlés" });
    await user.click(deleteButtons[1]!);

    expect(mockDeleteNetwork).toHaveBeenCalledWith("Vinland");
  });

  it("highlights active edit/train buttons", () => {
    render(
      <NetworkTable
        {...defaultProps}
        editNetworkId="Black"
        teachNetworkId="Vinland"
      />,
    );

    const editButtons = screen.getAllByRole("button", { name: "Szerkesztés" });
    const trainButtons = screen.getAllByRole("button", { name: "Tanítás" });

    expect(editButtons[0]).toHaveClass("bg-blue-800");
    expect(editButtons[1]).not.toHaveClass("bg-blue-800");

    expect(trainButtons[0]).not.toHaveClass("bg-blue-800");
    expect(trainButtons[1]).toHaveClass("bg-blue-800");
  });
});
