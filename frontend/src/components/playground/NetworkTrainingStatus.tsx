import { type TrainStatus } from "../../types";
import LineGraph from "./LineGraph";

interface NetworkTrainingStatusProps {
  job: TrainStatus | null;
  toggled: boolean;
}

const NetworkTrainingStatus = ({
  job,
  toggled,
}: NetworkTrainingStatusProps) => {
  const statusMap = {
    done: "Kész",
    error: "Hiba",
    running: "Folyamatban",
    queued: "Várakozás",
  };

  return (
    <>
      {job && toggled && (
        <div className="content-box flex flex-col gap-2 mt-6 text-slate-300">
          <dl className="mx-auto grid gap-2">
            <div className="flex gap-2">
              <dt className="font-medium">Név:</dt>
              <dd>{job.networkName}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium">Státusz:</dt>
              <dd
                className={`font-medium ${
                  job.status === "done"
                    ? "text-green-400"
                    : job.status === "error"
                    ? "text-red-400"
                    : job.status === "running"
                    ? "text-blue-400"
                    : "text-yellow-400"
                }`}
              >
                {statusMap[job.status]}
              </dd>
            </div>
            {job.progress !== undefined && (
              <div className="flex gap-2 items-center">
                <span className="font-medium">Előrehaladás:</span>
                <div className="mt-1 h-2 w-32 rounded-full bg-slate-700">
                  <div
                    className="h-2 rounded-full bg-green-400 transition-all duration-300"
                    style={{ width: `${job.progress * 100}%` }}
                  />
                </div>
              </div>
            )}
            {job.accuracy !== undefined && job.accuracy !== null && (
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <dt className="font-medium">Pontosság:</dt>
                  <dd className="font-medium text-green-400">
                    {(job.accuracy * 100).toFixed(2)}%
                  </dd>
                </div>

                {(job.history?.length ?? 0) > 0 && (
                  <dd>
                    <LineGraph data={job.history?.slice(-50)} />
                  </dd>
                )}
              </div>
            )}
            {job.loss !== undefined && job.loss !== null && (
              <div className="flex gap-2">
                <dt className="font-medium">Veszteség: {}</dt>
                <dd className="font-medium text-green-400">
                  {job.loss.toFixed(5)}
                </dd>
              </div>
            )}
          </dl>
          {job.status === "error" && (
            <div className="text-red-400 font-bold text-center">
              Hiba: {job.error || "Sikertelen tanítás, ismeretlen hiba."}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default NetworkTrainingStatus;
