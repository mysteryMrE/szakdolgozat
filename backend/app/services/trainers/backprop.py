from app.utils.backprop import get_training_data
from collections import deque
from app.neural_networks import NeuralNetwork
import numpy as np
import random
from app.schemas import NetworkConfig
from app.core.logger import AppLogger

# logging will only be visible if the trainer is used in the main process, as child processes do not call setup
# and training level is much lower than logger's default warning level
logger = AppLogger(__name__)


class BackpropTrainer:
    """
    Neural network trainer using backpropagation algorithm.
    """

    @staticmethod
    def train_backprop(
        network: NetworkConfig,
        epochs: int = 20_000,
        learning_rate: float = 0.01,
        early_stopping_threshold: float = 0.01,
        batch_size: int = 1,
    ) -> tuple[NetworkConfig, dict]:
        """
        Wrapper that runs the generator to completion and returns the result.
        """

        trainer_gen = BackpropTrainer.train_backprop_generator(
            network.model_dump(),
            epochs,
            learning_rate,
            early_stopping_threshold,
            batch_size,
        )
        try:
            while True:
                progress_data = next(trainer_gen)
                if progress_data["epoch"] % 100 == 0:
                    logger.training(f"Epoch {progress_data['epoch']}...")
        except StopIteration as e:
            updated_network_dict, stats = e.value
            return NetworkConfig(**updated_network_dict), stats

    @staticmethod
    def _forward_pass(nn: NeuralNetwork, input_vector: list) -> tuple:
        """
        Perform forward pass through the network
        Args:
            nn (NeuralNetwork): The neural network instance
            input_vector (list): Input vector to the network
        Returns:
            tuple (activations, z_values): List of activations and pre-activation Z values at each layer
        """
        activations = [np.array(input_vector, dtype=np.float64)]
        z_values = []

        current_output = np.array(input_vector, dtype=np.float64)

        MAX_VALUE = 1e4

        # Hidden layers
        for i in range(len(nn.layers) - 2):
            weights_matrix = np.array(nn.weights[i], dtype=np.float64)
            biases_vector = np.array(nn.biases[i], dtype=np.float64)
            z = np.dot(weights_matrix, current_output) + biases_vector
            z = np.clip(z, -MAX_VALUE, MAX_VALUE)
            z_values.append(z)
            current_output = np.maximum(0, z)  # ReLU activation
            activations.append(current_output)

        # Output layer
        weights_matrix = np.array(nn.weights[-1], dtype=np.float64)
        biases_vector = np.array(nn.biases[-1], dtype=np.float64)
        final_z = np.dot(weights_matrix, current_output) + biases_vector
        final_z = np.clip(final_z, -MAX_VALUE, MAX_VALUE)
        z_values.append(final_z)

        # Softmax activation for output
        output_probs = nn.softmax(final_z)

        activations.append(output_probs)

        return activations, z_values

    @staticmethod
    def _backward_pass(
        nn: NeuralNetwork, activations: list, z_values: list, target_one_hot: np.ndarray
    ) -> tuple:
        """
        Perform backward pass to calculate gradients.
        Args:
            nn (NeuralNetwork): The neural network instance
            activations (list): List of activations at each layer from forward pass
            z_values (list): List of pre-activation Z values at each layer from forward pass
            target_one_hot (np.ndarray): One-hot encoded target vector
        Returns:
            tuple (gradients_w, gradients_b): Gradients for weights and biases at each layer
        """
        gradients_w: list[np.ndarray] = [np.zeros_like(w) for w in nn.weights]
        gradients_b: list[np.ndarray] = [np.zeros_like(b) for b in nn.biases]

        # Output layer preactivattion error (derivative of cross-entropy loss with softmax)
        # https://www.youtube.com/watch?v=znqbtL0fRA0
        # dE/dZ_k = O_k - y_k
        # Error with respect to preactivation Z values in the output layer
        # = softmax output - target one-hot
        pre_activation_output_layer_error = activations[-1] - target_one_hot

        # Output layer gradients
        # Z11 output layer neuron 1 preactivation
        # Z21 previous layer neuron 1 activation
        # W11 weight from previous layer neuron 1 to output neuron 1
        # W21 weight from previous layer neuron 2 to output neuron 1
        # dE/dW_11 = dE/Z11 * dZ11/dW_11
        # dE/Z11 = O1 - y1
        # dZ11/dW11 = d(Z21 * W11 + Z22 * W21 + Z23 * W31 + B11) / dW11 = Z21
        # SO dE/dW11 = (O1 - y1) * Z21 = output_error[0] * activations[-2][0]
        # output_error = vector of size output layer
        # activations[-2] = vector of size previous layer
        # np.outer gives matrix of size (output layer, previous layer)
        # a matrix where each row has the given output_neurons weight gradients
        # each row is just the output_error[j] * activations[-2] =
        # output error of j neuron * all activations of previous layer
        gradients_w[-1] = np.outer(pre_activation_output_layer_error, activations[-2])
        gradients_b[-1] = pre_activation_output_layer_error.astype(np.float64)
        # output layer done

        # Backpropagate through hidden layers
        current_error = pre_activation_output_layer_error

        for layer_id in range(len(nn.weights) - 2, -1, -1):
            # Propagate error to previous layer - convert to numpy array and transpose
            # using chain rule
            weights_matrix = np.array(nn.weights[layer_id + 1], dtype=np.float64)
            current_error = np.dot(weights_matrix.T, current_error)
            # Apply derivative of ReLU activation still part of the chain rule
            relu_derivative = (z_values[layer_id] > 0).astype(np.float64)
            current_error = current_error * relu_derivative
            # now current_error is the error with respect to preactivation Z values of this layer

            # Calculate gradients for this layer (ensure float64)
            gradients_w[layer_id] = np.outer(
                current_error, activations[layer_id]
            ).astype(np.float64)
            gradients_b[layer_id] = current_error.astype(np.float64)

        return gradients_w, gradients_b

    @staticmethod
    def train_backprop_generator(
        network: dict,
        epochs: int = 20_000,
        learning_rate: float = 0.01,
        early_stopping_threshold: float = 0.01,
        batch_size: int = 1,
    ):
        """
        Train a neural network using backpropagation.

        Yields progress updates after each epoch.

        Args:
            network (dict): Neural network structure with weights and biases
            epochs (int): Number of training epochs
            learning_rate (float): Learning rate for weight updates
            early_stopping_threshold (float): Loss threshold for early stopping
            batch_size (int): Number of samples to process in each batch
        Returns:
            tuple (dict, dict): Trained network and training statistics

        """

        # Get training data
        input_target_pairs = get_training_data()

        avg_loss = 0.0
        accuracy = 0.0
        epoch = -1

        if len(input_target_pairs) == 0:
            logger.training("No training data generated for backpropagation.")
            return network, {
                "final_loss": 0.0,
                "final_accuracy": 0.0,
                "epochs": 0,
                "final_learning_rate": learning_rate,
            }

        # Create neural network instance
        nn = NeuralNetwork(network)
        recent_losses = deque(maxlen=10)
        current_learning_rate = learning_rate

        # Training loop with yield for progress
        for epoch in range(epochs):
            total_loss = 0
            correct_predictions = 0

            random.shuffle(input_target_pairs)

            for batch_start in range(0, len(input_target_pairs), batch_size):
                batch = input_target_pairs[batch_start : batch_start + batch_size]

                accum_w = [
                    np.zeros_like(np.array(w, dtype=np.float64)) for w in nn.weights
                ]
                accum_b = [
                    np.zeros_like(np.array(b, dtype=np.float64)) for b in nn.biases
                ]

                for input_vector, target in batch:
                    # Forward pass
                    activations, z_values = BackpropTrainer._forward_pass(
                        nn, input_vector
                    )

                    # Calculate loss (cross-entropy)
                    output_probs = activations[-1]
                    target_one_hot = np.zeros(len(output_probs), dtype=np.float64)
                    target_one_hot[target] = 1.0
                    loss = -np.sum(target_one_hot * np.log(output_probs + 1e-10))
                    total_loss += float(loss)

                    # Check if prediction is correct
                    predicted_move = np.argmax(output_probs)
                    if predicted_move == target:
                        correct_predictions += 1

                    # Backward pass
                    gradients_w, gradients_b = BackpropTrainer._backward_pass(
                        nn, activations, z_values, target_one_hot
                    )
                    for i in range(len(nn.weights)):
                        accum_w[i] += np.array(gradients_w[i], dtype=np.float64)
                        accum_b[i] += np.array(gradients_b[i], dtype=np.float64)

                # Update weights and biases
                for i in range(len(nn.weights)):
                    weights_np = np.array(
                        nn.weights[i], dtype=np.float64
                    ) - current_learning_rate * accum_w[i] / len(batch)

                    biases_np = np.array(
                        nn.biases[i], dtype=np.float64
                    ) - current_learning_rate * accum_b[i] / len(batch)

                    nn.weights[i] = weights_np
                    nn.biases[i] = biases_np

            # Calculate metrics
            avg_loss = total_loss / len(input_target_pairs)
            accuracy = correct_predictions / len(input_target_pairs)
            recent_losses.append(avg_loss)

            # Yield progress update
            progress_data = {
                "epoch": epoch,
                "progress": (epoch + 1) / epochs,
                "avg_loss": avg_loss,
                "accuracy": accuracy,
                "learning_rate": current_learning_rate,
                "total_epochs": epochs,
                "early_stopping": False,
            }
            yield progress_data

            # Print progress every 100 epochs
            if epoch % 100 == 0:
                logger.training(
                    f"Epoch {epoch}, Average Loss: {avg_loss:.4f}, Accuracy: {accuracy:.1%} ({correct_predictions}/{len(input_target_pairs)}), LR: {current_learning_rate:.4f}"
                )

            if epoch != epochs - 1:
                current_learning_rate = learning_rate * (1 - epoch / epochs)

            # Early stopping
            if len(recent_losses) == 10 and all(
                loss < early_stopping_threshold for loss in recent_losses
            ):
                progress_data["early_stopping"] = True
                progress_data["progress"] = 1.0
                yield progress_data
                logger.training(
                    f"Early stopping at epoch {epoch} with average loss {avg_loss:.4f}"
                )
                break

        # Update the network dictionary with trained weights and biases
        conf = nn.to_config()
        network["weights"] = conf["weights"]
        network["biases"] = conf["biases"]

        # Return final results
        return network, {
            "final_loss": avg_loss,
            "final_accuracy": accuracy,
            "epochs": epoch + 1,
            "final_learning_rate": current_learning_rate,
        }
