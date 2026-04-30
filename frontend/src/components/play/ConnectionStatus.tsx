import type { ConnectionStatus as ConnectionStatusType } from "../../types";

interface ConnectionStatusProps {
  status: ConnectionStatusType;
  tryReconnect?: () => void;
}

const StatusMap: Record<ConnectionStatusType, string> = {
  connected: "Csatlakozva",
  error: "Hiba történt",
  connecting: "Csatlakozás",
  idle: "Nincs kapcsolat",
};

const ConnectionStatus = ({ status, tryReconnect }: ConnectionStatusProps) => {
  const isActionable =
    tryReconnect !== undefined &&
    status !== "connected" &&
    status !== "connecting";

  const Tag = isActionable ? "button" : "div";

  return (
    <Tag
      role={!isActionable ? "status" : undefined}
      className={`
        inline-flex items-center select-none gap-2 px-3 py-1 rounded-full text-sm
        ${
          status === "connected"
            ? "bg-green-900/20 text-green-400 border border-green-700/50"
            : "bg-red-900/20 text-red-400 border border-red-700/50"
        }
        ${isActionable ? "cursor-pointer" : "cursor-default"}
      `}
      onClick={isActionable ? tryReconnect : undefined}
    >
      <div
        className={`w-2 h-2 rounded-full flex-shrink-0 ${
          status === "connected" ? "bg-green-400" : "bg-red-400"
        }`}
      />
      <span>
        {StatusMap[status]}
        {isActionable ? " (kattints az újracsatlakozáshoz)" : ""}
      </span>
    </Tag>
  );
};
export default ConnectionStatus;
