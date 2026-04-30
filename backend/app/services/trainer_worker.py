from multiprocessing.connection import Connection
from .trainers.backprop import BackpropTrainer
from app.schemas import TrainWorkerRequest


def train_worker(job_id: str, req: TrainWorkerRequest, conn: Connection):
    """
    Worker function to train a neural network using backpropagation.
    Uses a backpropagation trainer as a generator that yields progress updates.
    Sends updates back through the provided connection.

    Args:
        job_id (str): Unique identifier for the training job
        req (TrainWorkerRequest): Training request parameters
        conn (Connection): Multiprocessing connection for communication
    """

    try:
        network = req.network
        params = req.params
        epochs = params.epochs
        learning_rate = params.learning_rate
        early_stopping_threshold = params.early_stopping_threshold

        if not network:
            raise ValueError("Network configuration is required")

        conn.send({"type": "progress", "value": 0.0})
        conn.send(
            {
                "type": "log",
                "level": "info",
                "message": f"Worker {job_id}: Starting training with {epochs} epochs",
            }
        )

        trainer_generator = BackpropTrainer.train_backprop_generator(
            network=network,
            epochs=epochs,
            learning_rate=learning_rate,
            early_stopping_threshold=early_stopping_threshold,
        )
        final_result = None
        while True:
            try:
                progress_data = next(trainer_generator)
            except StopIteration as e:
                final_result = e.value
                break

            # Send progress updates
            conn.send({"type": "progress", "value": progress_data["progress"]})
            conn.send(
                {
                    "type": "metric",
                    "accuracy": progress_data["accuracy"],
                    "loss": progress_data["avg_loss"],
                }
            )

            # Send log every 100 epochs or on early stopping
            if progress_data["epoch"] % 100 == 0 or progress_data["early_stopping"]:
                conn.send(
                    {
                        "type": "log",
                        "level": "info",
                        "message": f"Worker {job_id}: Epoch {progress_data['epoch'] + 1}/{progress_data['total_epochs']}, "
                        f"Loss: {progress_data['avg_loss']:.4f}, Accuracy: {progress_data['accuracy']:.1%}, "
                        f"LR: {progress_data['learning_rate']:.4f}",
                    }
                )

        trained_network, training_stats = final_result

        # Send completion message
        conn.send(
            {
                "type": "log",
                "level": "info",
                "message": f"Worker {job_id}: Training completed after {training_stats['epochs']} epochs",
            }
        )

        # Send final results
        conn.send(
            {
                "type": "done",
                "accuracy": training_stats["final_accuracy"],
                "loss": training_stats["final_loss"],
                "nn": trained_network,
                "meta": {
                    "final_loss": round(float(training_stats["final_loss"]), 4),
                    "epochs_completed": training_stats["epochs"],
                    "final_learning_rate": round(
                        float(training_stats["final_learning_rate"]), 8
                    ),
                    "accuracy": round(float(training_stats["final_accuracy"]), 4),
                },
            }
        )

    except Exception as e:
        print(f"[TRAINER WORKER] CRITICAL WORKER ERROR {job_id}: {str(e)}")
        try:
            conn.send(
                {
                    "type": "log",
                    "level": "error",
                    "message": f"Worker {job_id} crashed: {str(e)}",
                }
            )
            conn.send({"type": "error", "message": str(e)})
        except Exception:
            pass

    finally:
        try:
            conn.close()
        except Exception:
            pass
