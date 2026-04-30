from app.neural_networks import NeuralNetwork
import numpy as np
import random


class Genome:
    """
    Encapsulates all genetic operations for Neural Networks.
    """

    @staticmethod
    def flatten(nn: NeuralNetwork) -> list[float]:
        """Flatten the neural network's weights and biases into a single 1D list."""
        flat = []
        for index, layer in enumerate(nn.weights):
            for neuron in layer:
                flat.extend(neuron)
            flat.extend(nn.biases[index])
        return flat

    @staticmethod
    def unflatten(flat: list[float], layer_sizes: list[int]) -> NeuralNetwork:
        """Reconstruct a NeuralNetwork from a flat list of weights and biases."""
        weights, biases = [], []
        index = 0

        for i in range(len(layer_sizes) - 1):
            input_size = layer_sizes[i]
            output_size = layer_sizes[i + 1]

            weight_count = output_size * input_size
            bias_count = output_size

            w_flat = flat[index : index + weight_count]
            index += weight_count
            b_flat = flat[index : index + bias_count]
            index += bias_count

            w = np.array(w_flat).reshape((output_size, input_size))
            b = np.array(b_flat)

            weights.append(w.tolist())
            biases.append(b.tolist())

        return NeuralNetwork(
            {"layers": layer_sizes, "weights": weights, "biases": biases}
        )

    @staticmethod
    def copy(nn: NeuralNetwork) -> NeuralNetwork:
        """Create a deep copy of the neural network."""
        return nn.copy()

    @classmethod
    def crossover(
        cls,
        parent1: NeuralNetwork,
        parent2: NeuralNetwork,
        layer_sizes: list[int],
        crossover_points: list[int],
    ) -> tuple[NeuralNetwork, NeuralNetwork]:
        """
        Perform crossover between two parent networks to create two children.
        70% of the time, a single point crossover
        30% of the time, a uniform crossover
        """
        flat_p1 = cls.flatten(parent1)
        flat_p2 = cls.flatten(parent2)

        if random.random() < 0.7:
            point = random.choice(crossover_points)
            flat_c1 = flat_p1[:point] + flat_p2[point:]
            flat_c2 = flat_p2[:point] + flat_p1[point:]
        else:
            flat_c1, flat_c2 = [], []
            for i in range(len(flat_p1)):
                if random.random() < 0.5:
                    flat_c1.append(flat_p1[i])
                    flat_c2.append(flat_p2[i])
                else:
                    flat_c1.append(flat_p2[i])
                    flat_c2.append(flat_p1[i])

        return (
            cls.unflatten(flat_c1, layer_sizes),
            cls.unflatten(flat_c2, layer_sizes),
        )

    @classmethod
    def mutate(
        cls,
        nn: NeuralNetwork,
        layer_sizes: list[int],
        mutation_prob: float,
        mutation_sigma: float,
    ) -> NeuralNetwork:
        """Apply Gaussian mutation to the network's weights and biases."""
        flat = cls.flatten(nn)
        for i in range(len(flat)):
            if random.random() < mutation_prob:
                flat[i] += random.gauss(0, mutation_sigma)

        return cls.unflatten(flat, layer_sizes)
