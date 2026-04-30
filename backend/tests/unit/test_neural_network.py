from app.neural_networks import NeuralNetwork
from app.utils import init_network


class TestNeuralNetwork:

    def test_network_initialization_simple(self):
        network_data = init_network([18, 9])

        nn = NeuralNetwork(network_data.model_dump())

        assert nn.layers == [18, 9]
        assert len(nn.weights) == 1
        assert len(nn.biases) == 1
        assert len(nn.weights[0]) == 9
        assert len(nn.weights[0][0]) == 18
        assert len(nn.biases[0]) == 9

    def test_network_initialization_with_hidden_layer(self):
        network_data = init_network([18, 11, 9])

        nn = NeuralNetwork(network_data.model_dump())

        assert nn.layers == [18, 11, 9]
        assert len(nn.weights) == 2
        assert len(nn.biases) == 2
        assert len(nn.weights[0]) == 11
        assert len(nn.weights[0][0]) == 18
        assert len(nn.biases[0]) == 11
        assert len(nn.weights[1]) == 9
        assert len(nn.weights[1][0]) == 11
        assert len(nn.biases[1]) == 9

    def test_predict_argmax(self):
        network_data = {
            "layers": [2, 2],
            "weights": [[[1.0, 0.0], [0.0, 1.0]]],
            "biases": [[0.0, 0.0]],
        }

        nn = NeuralNetwork(network_data)
        input_vector = [1, 2]

        output = nn.predict(input_vector, argmax=True)

        assert isinstance(output, int)
        assert 0 <= output <= 1
        assert output == 1

    def test_predict_output_is_probability_distribution(self):
        network_data = {
            "layers": [22, 9],
            "weights": [[[0.1] * 22 for _ in range(9)]],
            "biases": [[0.0] * 9],
        }

        nn = NeuralNetwork(network_data)
        input_vector = [1] * 22
        output = nn.predict_stats(input_vector)

        assert len(output) == 9
        assert all(isinstance(x, float) for x in output)
        assert 0.99 <= sum(output) <= 1.01
