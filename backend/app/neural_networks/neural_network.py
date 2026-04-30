import numpy as np
import random
import copy


class NeuralNetwork:
    """
    A feedforward neural network implementation.

    Uses ReLU activation for hidden layers and softmax for output layer.
    """

    def __init__(self, config: dict):
        self.layers = config.get("layers", [])
        self.weights = [np.array(w) for w in config.get("weights", [])]
        self.biases = [np.array(b) for b in config.get("biases", [])]

    def to_config(self) -> dict:
        """Convert the network to a config dictionary."""
        return {
            "layers": copy.copy(self.layers),
            "weights": [w.tolist() for w in self.weights],
            "biases": [b.tolist() for b in self.biases],
        }

    def copy(self) -> "NeuralNetwork":
        """Create a deep copy of the network."""
        return NeuralNetwork(self.to_config())

    def softmax(self, z) -> np.ndarray:
        z_shifted = z - np.max(z)
        exp_z = np.exp(z_shifted)
        sum_exp = np.sum(exp_z) + 1e-15
        return exp_z / sum_exp

    def relu(self, z) -> np.ndarray:
        return np.maximum(0, z)

    def _forward_probabilities(self, input: list[int]) -> np.ndarray:
        """Run the forward pass and return output probabilities."""
        current_output = np.array(input)

        for i in range(len(self.layers) - 2):
            # for first layer: (x,18) dot (18,) -> (x,)
            z = np.dot(self.weights[i], current_output) + self.biases[i]
            current_output = self.relu(z)

        final_z = np.dot(self.weights[-1], current_output) + self.biases[-1]
        return self.softmax(final_z)

    def predict(self, input: list[int], argmax: bool = True) -> int:
        """
        Predicts the output class for the given input.

        In this case the classes are the possible moves (0-8).

        Args:
            input: The input data.
            argmax: If True, returns the index of the highest probability.
                           If False, samples from the probability distribution.

        Returns:
            int: The predicted class index.
        """
        probabilities = self._forward_probabilities(input)
        if argmax:
            return int(np.argmax(probabilities))
        population = [i for i in range(len(probabilities))]
        predicted_index = random.choices(
            population, weights=probabilities.tolist(), k=1
        )[0]
        return int(predicted_index)

    def predict_stats(self, input: list[int]) -> list[float]:
        """
        Predicts the output probabilities for each class for the given input.

        In this case the classes are the possible moves (0-8).

        Args:
            input: The input data.
        Returns:
            list[float]: The predicted probabilities for each class.
        """
        return self._forward_probabilities(input).tolist()
