import random
import math
from enum import IntEnum

class RoundType(IntEnum):
    NO_ROUND = 1
    TANH = 2
    TO_INT = 3
    ZERO_ONE = 4
    RELU = 5

def is_valid_round_type(value):
    return value in RoundType

class NeuralNet:
    def __init__(self, inputs_count, hidden_layer_sizes, outputs_count, inp_round_type, n_round_type, out_round_type):
        self.inputs_count = inputs_count
        self.hidden_layer_sizes = hidden_layer_sizes
        self.outputs_count = outputs_count
        self.inp_round_type = inp_round_type
        self.n_round_type = n_round_type
        self.out_round_type = out_round_type

        self.layers = []
        self.weights = []

        self.create_layers()
        self.generate_weights()

    def create_layers(self):
        self.layers.append(self.inputs_count)
        self.layers.extend(self.hidden_layer_sizes)
        self.layers.append(self.outputs_count)

    def generate_weights(self):
        for i in range(len(self.layers) - 1):
            layer_input_count = self.layers[i]
            layer_output_count = self.layers[i + 1]
            weights_layer = [
                [random.uniform(-1, 1) for _ in range(layer_input_count)]
                for _ in range(layer_output_count)
            ]
            self.weights.append(weights_layer)

    def apply_activation(self, value, round_type):
        if round_type == RoundType.TANH:
            return math.tanh(value)
        elif round_type == RoundType.RELU:
            return max(0, value)
        elif round_type == RoundType.ZERO_ONE:
            return 0 if value <= 0 else 1
        elif round_type == RoundType.NO_ROUND:
            return value
        else:
            return value

    def calculate_output(self, inputs):
        current_input = inputs
        for layer_weights in self.weights:
            next_layer_output = []
            for neuron_weights in layer_weights:
                neuron_input = sum(i * w for i, w in zip(current_input, neuron_weights))
                next_layer_output.append(self.apply_activation(neuron_input, self.n_round_type))
            current_input = next_layer_output
        return current_input

    def get_weights(self):
        return self.weights

    def copy(self, mutation_rate, mutation_scale):
        new_net = NeuralNet(
            self.inputs_count,
            self.hidden_layer_sizes,
            self.outputs_count,
            self.inp_round_type,
            self.n_round_type,
            self.out_round_type
        )
        for i in range(len(self.weights)):
            for j in range(len(self.weights[i])):
                for k in range(len(self.weights[i][j])):
                    new_net.weights[i][j][k] = self.weights[i][j][k]
                    if random.random() < mutation_rate:
                        new_net.weights[i][j][k] += random.uniform(-1, 1) * mutation_scale
        return new_net

class LearningDatabase:
    def __init__(self, inputs_count, outputs_count):
        self.inputs = []
        self.outputs = []
        self.inputs_count = inputs_count
        self.outputs_count = outputs_count
        self.multiplier = 1

    def is_valid_list(self, value, length):
        return isinstance(value, list) and len(value) == length

    def add_item(self, learning_inputs, expected_outputs):
        if self.is_valid_list(learning_inputs, self.inputs_count) and self.is_valid_list(expected_outputs, self.outputs_count):
            self.inputs.append(learning_inputs)
            self.outputs.append(expected_outputs)
        else:
            print("N1", learning_inputs, self.inputs_count)
            print("N2", expected_outputs, self.outputs_count)
            raise ValueError("Given lists are bad")

    @property
    def size(self):
        return len(self.inputs)

    def multiply_all(self, number):
        self.inputs = [[val * number for val in row] for row in self.inputs]
        self.outputs = [[val * number for val in row] for row in self.outputs]
        self.multiplier *= number

    def get_without_multiplier(self):
        inverse = 1 / self.multiplier
        new_inputs = [[val * inverse for val in row] for row in self.inputs]
        new_outputs = [[val * inverse for val in row] for row in self.outputs]
        db = LearningDatabase(self.inputs_count, self.outputs_count)
        db.inputs = new_inputs
        db.outputs = new_outputs
        db.multiplier = 1
        return db

class Generation:
    def __init__(self, inputs_count, outputs_count, hidden_layer_sizes, generation_size, inp_round_type, n_round_type, out_round_type, learning_database):
        self.generation = [
            NeuralNet(inputs_count, hidden_layer_sizes, outputs_count, inp_round_type, n_round_type, out_round_type)
            for _ in range(generation_size)
        ]
        self.inputs_count = inputs_count
        self.outputs_count = outputs_count
        self.hidden_layer_sizes = hidden_layer_sizes
        self.learning_database = learning_database
        self.generations_passed = 0

    def best_nn(self, negative_selection=False, learning_database=None):
        if learning_database is None:
            learning_database = self.learning_database
        best_error = self.calculate_error(self.generation[0], learning_database)
        best_index = 0

        for index, net in enumerate(self.generation):
            err = self.calculate_error(net, learning_database)
            if (negative_selection and err > best_error) or (not negative_selection and err < best_error):
                best_error = err
                best_index = index

        self.the_smallest_error = best_error
        return self.generation[best_index]

    def data_in_text(self):
        avg_error = self.the_smallest_error / self.outputs_count
        factual_error = self.reverse_error_calculation(avg_error) / self.learning_database.multiplier
        return f"Error: {self.the_smallest_error}\nAverage error on one output: {self.reverse_error_calculation(avg_error)}\nFactual error on one output (considering multiplier): {factual_error}\nGenerations passed: {self.generations_passed}"

    def calculate_error(self, nn, learning_database=None):
        if learning_database is None:
            learning_database = self.learning_database
        total_error = 0
        for inputs_, expected_outputs in zip(learning_database.inputs, learning_database.outputs):
            result = nn.calculate_output(inputs_)
            for expected, output in zip(expected_outputs, result):
                diff = abs(expected - output)
                total_error += diff ** 2 if diff > 1 else math.sqrt(diff)
        return total_error / learning_database.size

    def reverse_error_calculation(self, num):
        return math.sqrt(num) if num > 1 else num ** 2

    def pass_one_generation(self, mutation_rate=0.01, mutation_scale=0.1, negative_selection=False, learning_database=None):
        best = self.best_nn(negative_selection, learning_database)
        self.generation = [
            nn if nn is best else best.copy(mutation_rate, mutation_scale)
            for nn in self.generation
        ]
        self.generations_passed += 1
