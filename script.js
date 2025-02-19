const RoundType = {
    NO_ROUND: 1,
    TANH: 2
};

function isValidRoundType(value) {
    return Object.values(RoundType).includes(value);
}

class Neural {
    constructor() {
        this.value = 0;
        this.rounded = false;
    }
    set_value(value_) {
        if (isFinite(value_)) {
            this.rounded = false;
            this.value = value_;
        } else throw new Error("Given value is not a number!");
    }
    round(round_type) {
        if (isValidRoundType(round_type)) {
            this.rounded = true;
            if (round_type === RoundType.TANH) {
                this.value = Math.tanh(this.value);
            }
        } else throw new Error("Given value is not valid round type!");
    }
    reset() {
        this.value = 0;
        this.rounded = false;
    }
    getValue() {
        return this.value;
    }
    add(value_) {
        if (isFinite(value_)) {
            this.value += value_;
        } else throw new Error("Given value is not a number!");
    }
}

class NeuralNet {
    constructor(inputs_count, outputs_count, neurals_count, hidden_layers_count, inp_round_type, n_round_type, out_round_type) {
        if (!Number.isInteger(inputs_count)) throw new Error("Given value for an inputs_count is not valid integer!");
        if (!Number.isInteger(outputs_count)) throw new Error("Given value for an outputs_count is not valid integer!");
        if (!Number.isInteger(neurals_count)) throw new Error("Given value for a neurals_count is not valid integer!");
        if (!Number.isInteger(hidden_layers_count)) throw new Error("Given value for a hidden_layers_count is not valid integer!");
        if (!isValidRoundType(inp_round_type)) throw new Error("Given value for a inp_round_type is not valid round type!");
        if (!isValidRoundType(n_round_type)) throw new Error("Given value for a n_round_type is not valid round type!");
        if (!isValidRoundType(out_round_type)) throw new Error("Given value for a out_round_type is not valid round type!");

        this.inputs_layer = [];
        this.hidden_layer = [];
        this.outputs_layer = [];
        this.coefficients = [];

        // Initialize layers
        for (let index = 0; index < inputs_count; index++) this.inputs_layer.push(new Neural());
        for (let index = 0; index < outputs_count; index++) this.outputs_layer.push(new Neural());
        for (let i = 0; i < hidden_layers_count; i++) {
            var index = this.hidden_layer.push([]) - 1;
            for (let j = 0; j < neurals_count; j++) {
                this.hidden_layer[index].push(new Neural());
            }
        }

        // Generate random coefficients between layers
        this.generateCoefficients(inputs_count, neurals_count, hidden_layers_count, outputs_count);

        // Save round types for the network
        this.inputs_round_type = inp_round_type;
        this.neural_round_type = n_round_type;
        this.outputs_round_type = out_round_type;
    }

    // Function to generate random coefficients between layers
    generateCoefficients(inputs_count, neurals_count, hidden_layers_count, outputs_count) {
        // Random coefficients between inputs and first hidden layer
        this.coefficients.push(this.createRandomMatrix(inputs_count, neurals_count));

        // Random coefficients between hidden layers
        for (let i = 0; i < hidden_layers_count - 1; i++) {
            this.coefficients.push(this.createRandomMatrix(neurals_count, neurals_count));
        }

        // Random coefficients between the last hidden layer and outputs layer
        this.coefficients.push(this.createRandomMatrix(neurals_count, outputs_count));
    }

    // Helper function to create a random matrix (coefficients)
    createRandomMatrix(rows, cols) {
        const matrix = [];
        for (let i = 0; i < rows; i++) {
            const row = [];
            for (let j = 0; j < cols; j++) {
                row.push(Math.random()); // Random number between 0 and 1
            }
            matrix.push(row);
        }
        return matrix;
    }

    // Function to copy the values from another NeuralNet instance
    copy(otherNet, changeCoefficient = false, mutationRate = 0.01, mutationScale = 0.1) {
        if (!(otherNet instanceof NeuralNet)) throw new Error("The argument is not a valid NeuralNet instance!");
    
        // Copy inputs_layer
        this.inputs_layer = otherNet.inputs_layer.map(neural => {
            const newNeural = new Neural();
            newNeural.set_value(neural.getValue());
            return newNeural;
        });
    
        // Copy hidden_layer
        this.hidden_layer = otherNet.hidden_layer.map(layer => layer.map(neural => {
            const newNeural = new Neural();
            newNeural.set_value(neural.getValue());
            return newNeural;
        }));
    
        // Copy outputs_layer
        this.outputs_layer = otherNet.outputs_layer.map(neural => {
            const newNeural = new Neural();
            newNeural.set_value(neural.getValue());
            return newNeural;
        });
    
        // Copy coefficients
        this.coefficients = otherNet.coefficients.map(matrix => matrix.map(row => [...row]));
    
        // Apply mutation to coefficients if changeCoefficient is true
        if (changeCoefficient) {
            for (let i = 0; i < this.coefficients.length; i++) {
                for (let j = 0; j < this.coefficients[i].length; j++) {
                    for (let k = 0; k < this.coefficients[i][j].length; k++) {
                        // Apply mutation based on mutationRate and mutationScale
                        if (Math.random() < mutationRate) {
                            this.coefficients[i][j][k] += (Math.random() - 0.5) * mutationScale; // Small random change
                        }
                    }
                }
            }
        }
    }    

    // Calculate function
    calculate(inputs) {
        if (inputs.length !== this.inputs_layer.length) {
            throw new Error("The number of input values does not match the number of input neurons!");
        }

        // Step 1: Assign input values to the input layer
        for (let i = 0; i < inputs.length; i++) {
            this.inputs_layer[i].set_value(inputs[i]);
            this.inputs_layer[i].round(this.inputs_round_type); // Round inputs based on the input round type
        }

        // Step 2: Calculate values for the hidden layers
        let previous_layer_values = this.inputs_layer;
        for (let i = 0; i < this.hidden_layer.length; i++) {
            let current_layer = this.hidden_layer[i];
            for (let j = 0; j < current_layer.length; j++) {
                let value = 0;
                for (let k = 0; k < previous_layer_values.length; k++) {
                    value += previous_layer_values[k].getValue() * this.coefficients[i][k][j];
                }
                current_layer[j].set_value(value);
                current_layer[j].round(this.neural_round_type); // Round hidden neurons based on the neural round type
            }
            previous_layer_values = current_layer; // Update previous layer
        }

        // Step 3: Calculate values for the output layer
        for (let i = 0; i < this.outputs_layer.length; i++) {
            let value = 0;
            for (let j = 0; j < previous_layer_values.length; j++) {
                value += previous_layer_values[j].getValue() * this.coefficients[this.coefficients.length - 1][j][i];
            }
            this.outputs_layer[i].set_value(value);
            this.outputs_layer[i].round(this.outputs_round_type); // Round output neurons based on the output round type
        }

        // Step 4: Return output values
        return this.outputs_layer.map(neural => neural.getValue());
    }
}

class LearningDatabase{
    constructor(inputs_count, outputs_count){
        this.inputs = [];
        this.outputs = [];
        this.inputs_count = inputs_count;
        this.outputs_count = outputs_count;
    }
    isValidList(value, length) {
        return Array.isArray(value) && value.length === length && value.every(item => typeof item === 'number');
    }    
    AddItem(learning_inputs, expected_outputs){
        if(this.isValidList(learning_inputs, this.inputs_count) && this.isValidList(expected_outputs, this.outputs_count)){
            this.inputs.push(learning_inputs);
            this.outputs.push(expected_outputs);
        }
        else throw new Error("Given lists are bad");
    }
}

class Generation{
    constructor(inputs_count, outputs_count, neurals_count, hidden_layers_count, inp_round_type, n_round_type, out_round_type, generation_size, learning_database){
        this.generation = [];
        this.learning_database = learning_database;
        for (let index = 0; index < generation_size; index++) {
            this.generation.push(new NeuralNet(inputs_count, outputs_count, neurals_count, hidden_layers_count, inp_round_type, n_round_type, out_round_type));
        }
    }
    bestNN() {
        var the_smallest_error = Infinity;
        var index_nn = 0;
        for (let index = 0; index < this.generation.length; index++) {
            const element = this.generation[index];
            var error_nn = 0;
            for (let i = 0; i < this.learning_database.inputs.length; i++) {
                const inputs_ = this.learning_database.inputs[i];
                const outputs_ = this.learning_database.outputs[i];
                var result = element.calculate(inputs_);
                var error_ = outputs_.reduce((sum, value, idx) => {
                    const diff = value - result[idx];
                    return sum + Math.pow(diff, 2);
                }, 0);
                error_nn += error_;
            }
            if(the_smallest_error > error_nn) {
                the_smallest_error = error_nn;
                index_nn = index;
            }
        }
        console.log("Error: " + the_smallest_error);
        document.getElementById('error_nn').innerText = "Error: " + the_smallest_error;
        return this.generation[index_nn];
    }
    passOneGeneration(mutationRate = 0.01, mutationScale = 0.1){
        var best_nn = this.bestNN();
        this.generation.forEach((nn, index) => {
            nn.copy(best_nn, index != 0, mutationRate, mutationScale);
        });
    }
}

var learningDatabase = new LearningDatabase(1, 1);
for (let index = 0; index < 100; index++) {
    learningDatabase.AddItem([index], [Math.sqrt(index)]);
}

var gen = new Generation(1, 1, 5, 5, RoundType.NO_ROUND, RoundType.TANH, RoundType.NO_ROUND, 50, learningDatabase);

console.log(learningDatabase);