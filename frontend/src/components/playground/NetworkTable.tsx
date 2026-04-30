interface NetworkTableProps {
  toggled: boolean;
  teachNetworkId: string | null;
  editNetworkId: string | null;
  networks: {
    id: string;
    name: string;
    nn: { layers: number[] };
    meta: { epochs_completed?: number; accuracy?: number; loss?: number };
  }[];
  editDisabled?: boolean;
  openEdit: (id: string) => void;
  openTrainMenu: (id: string) => void;
  deleteNetwork: (id: string) => void;
}
const NetworkTable = ({
  teachNetworkId,
  editNetworkId,
  networks,
  openEdit,
  openTrainMenu,
  deleteNetwork,
  toggled,
  editDisabled = false,
}: NetworkTableProps) => {
  const headerClass = "px-2 normal:px-6 py-3 text-center";
  const buttonColumnClass = "px-2 normal:px-6 py-4 text-center";
  return (
    <>
      {toggled && networks.length === 0 && (
        <p className="mt-4">Nem található hálózat. Hozz létre egyet!</p>
      )}
      {toggled && networks.length > 0 && (
        <div className="content-box p-0 overflow-x-auto mt-5">
          <table className="w-full text-sm text-left text-gray-950  overflow-hidden rounded-lg">
            <thead className="text-xs text-gray-900 uppercase bg-gray-300 border-b border-gray-400">
              <tr>
                <th scope="col" className="px-2 normal:px-6 py-3">
                  Név
                </th>
                <th scope="col" className="px-2 normal:px-6 py-3">
                  Rétegek
                </th>

                <th scope="col" className="px-2 normal:px-6 py-3">
                  Statisztikák
                </th>

                {!editDisabled && (
                  <th scope="col" className={headerClass}>
                    Szerkesztés
                  </th>
                )}
                <th scope="col" className={headerClass}>
                  Tanítás
                </th>
                <th scope="col" className={headerClass}>
                  Törlés
                </th>
              </tr>
            </thead>
            <tbody>
              {networks.map((network) => (
                <tr
                  key={network.id}
                  data-id={network.id}
                  className="odd:bg-white even:bg-gray-200 text-black-950 border-b border-gray-400"
                >
                  <th
                    scope="row"
                    className="px-2 normal:px-6 py-4 whitespace-nowrap"
                  >
                    {network.name}
                  </th>
                  <td className="px-2 normal:px-6 py-4">
                    {network.nn.layers.join(", ")}
                  </td>
                  <td className="px-2 normal:px-6 py-4">
                    {network.meta.epochs_completed ? (
                      <>
                        Iterációk: {network.meta.epochs_completed}, Pontosság:{" "}
                        {network.meta.accuracy
                          ? (network.meta.accuracy * 100).toFixed(2)
                          : 0}
                        %, Veszteség:{" "}
                        {network.meta.loss ? network.meta.loss.toFixed(2) : 0}
                      </>
                    ) : (
                      "Nem tanított"
                    )}
                  </td>
                  {!editDisabled && (
                    <td className={buttonColumnClass}>
                      <button
                        className={`btn ${
                          editNetworkId === network.id
                            ? "bg-blue-800"
                            : "hover:bg-blue-800"
                        }`}
                        onClick={() => openEdit(network.id)}
                      >
                        Szerkesztés
                      </button>
                    </td>
                  )}
                  <td className={buttonColumnClass}>
                    <button
                      className={`btn ${
                        teachNetworkId === network.id
                          ? "bg-blue-800"
                          : "hover:bg-blue-800"
                      }`}
                      onClick={() => openTrainMenu(network.id)}
                    >
                      Tanítás
                    </button>
                  </td>
                  <td className={buttonColumnClass}>
                    <button
                      className="btn bg-red-600 hover:bg-red-700"
                      onClick={() => deleteNetwork(network.id)}
                    >
                      Törlés
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};
export default NetworkTable;
