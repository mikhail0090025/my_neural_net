const RoundType = {
    NO_ROUND: 1,
    TANH: 2,
    TO_INT: 3,
    ZERO_ONE: 4,
    RELU: 5,
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
            else if (round_type === RoundType.TO_INT) {
                this.value = Math.round(this.value);
            }
            else if (round_type === RoundType.ZERO_ONE) {
                this.value = this.value <= 0 ? 0 : 1;
            }
            else if (round_type === RoundType.RELU) {
                this.value = Math.max(0, this.value);
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

        // Save variables for the network
        this.inputs_round_type = inp_round_type;
        this.neural_round_type = n_round_type;
        this.outputs_round_type = out_round_type;
        this.inputs_count = inputs_count;
        this.outputs_count = outputs_count;
        this.neurals_count = neurals_count;
        this.hidden_layers_count = hidden_layers_count;
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

    LearnByLD(learning_database, learning_sensivity) {
        learning_database.inputs.forEach((inputs, i) => {
            const expected_outputs = learning_database.outputs[i];
            const actual_outputs = this.calculate(inputs);
    
            // Обучение выходного слоя
            let output_errors = [];
            for (let j = 0; j < this.outputs_layer.length; j++) {
                output_errors[j] = expected_outputs[j] - actual_outputs[j];
    
                // Корректируем веса
                for (let k = 0; k < this.hidden_layer[this.hidden_layer.length - 1].length; k++) {
                    this.coefficients[this.coefficients.length - 1][k][j] += learning_sensivity * output_errors[j] * this.hidden_layer[this.hidden_layer.length - 1][k].getValue();
                }
            }
    
            // Обучение скрытых слоев (обратное распространение)
            let layer_errors = output_errors;
            for (let l = this.hidden_layer.length - 1; l >= 0; l--) {
                let next_layer_errors = new Array(this.hidden_layer[l].length).fill(0);
    
                for (let j = 0; j < this.hidden_layer[l].length; j++) {
                    let error = 0;
                    for (let k = 0; k < layer_errors.length; k++) {
                        error += layer_errors[k] * this.coefficients[l + 1][j][k];
                    }
                    next_layer_errors[j] = error;
    
                    // Корректируем веса
                    let prev_layer = (l === 0) ? this.inputs_layer : this.hidden_layer[l - 1];
                    for (let k = 0; k < prev_layer.length; k++) {
                        this.coefficients[l][k][j] += learning_sensivity * error * prev_layer[k].getValue();
                    }
                }
                layer_errors = next_layer_errors;
            }
        });
    }
}

class LearningDatabase{
    constructor(inputs_count, outputs_count){
        this.inputs = [];
        this.outputs = [];
        this.inputs_count = inputs_count;
        this.outputs_count = outputs_count;
        this.multiplier = 1;
    }
    isValidList(value, length) {
        //return Array.isArray(value) && value.length === length && value.every(item => typeof item === 'number');
        return Array.isArray(value) && value.length === length;
    }    
    AddItem(learning_inputs, expected_outputs){
        if(this.isValidList(learning_inputs, this.inputs_count) && this.isValidList(expected_outputs, this.outputs_count)){
            this.inputs.push(learning_inputs);
            this.outputs.push(expected_outputs);
        }
        else {
            console.log("N1");
            console.log(learning_inputs, this.inputs_count);
            console.log("N2");
            console.log(expected_outputs, this.outputs_count);
            throw new Error("Given lists are bad");
        }
    }
    get Size() {return this.inputs.length;}
    multiplyAll(number){
        this.inputs.forEach((val, i) => {
            this.inputs[i] = val.map((val2) => val2 * number);
        });
        this.outputs.forEach((val, i) => {
            this.outputs[i] = val.map((val2) => val2 * number);
        });
        this.multiplier *= number;
    }
    getWithoutMultiplier(){
        const inverseMultiplier = 1 / this.multiplier;
        const newInputs = this.inputs.map(val => val.map((val2) => val2 * inverseMultiplier));
        const newOutputs = this.outputs.map(val => val.map((val2) => val2 * inverseMultiplier));

        const newDatabase = new LearningDatabase(this.inputs_count, this.outputs_count);
        newDatabase.inputs = newInputs;
        newDatabase.outputs = newOutputs;
        newDatabase.multiplier = 1;

        return newDatabase;
    }
}

class Generation{
    constructor(inputs_count, outputs_count, neurals_count, hidden_layers_count, inp_round_type, n_round_type, out_round_type, generation_size, learning_database){
        this.generation = [];
        this.inputs_count = inputs_count;
        this.outputs_count = outputs_count;
        this.neurals_count = neurals_count;
        this.hidden_layers_count = hidden_layers_count;
        this.learning_database = learning_database;
        for (let index = 0; index < generation_size; index++) {
            this.generation.push(new NeuralNet(inputs_count, outputs_count, neurals_count, hidden_layers_count, inp_round_type, n_round_type, out_round_type));
        }
    }

    bestNN(negativeSelection, learning_database = this.learning_database) {
        var the_smallest_error = this.calculateError(this.generation[0], learning_database);
        var index_nn = 0;
        
        this.generation.forEach((element, index) => {
            var error_nn = this.calculateError(element, learning_database);  // Используем calculateError для вычисления ошибки
    
            if ((negativeSelection && error_nn > the_smallest_error) || (!negativeSelection && error_nn < the_smallest_error)) {
                the_smallest_error = error_nn;
                index_nn = index;
            }
        });
        
        document.getElementById('error_nn').innerText = "Error: " + the_smallest_error +
        "\nAverage error on one output: " + this.reverseErrorCalculation(the_smallest_error / this.outputs_count) + 
        "\nFactual error on one output (considering multiplier): " + (this.reverseErrorCalculation(the_smallest_error / this.outputs_count) / learning_database.multiplier);
        return this.generation[index_nn];
    }

    calculateError(nn, learning_database = this.learning_database) {
        return learning_database.inputs.reduce((totalError, inputs_, i) => {
            const outputs_ = learning_database.outputs[i];
            const result = nn.calculate(inputs_);
            /*return totalError + outputs_.reduce((sum, value, idx) => {
                let diff = value - result[idx];
                return sum + Math.pow(diff, 2);
            }, 0);*/
            return totalError + outputs_.reduce((sum, value, idx) => {
                let diff = Math.abs(value - result[idx]);
                return (diff > 1) ? (sum + Math.pow(diff, 2)) : (sum + Math.sqrt(diff));
            }, 0);
        }, 0) / learning_database.Size;
    }

    reverseErrorCalculation(num) {
        if (num > 1) {
            return Math.sqrt(num);
        } else {
            return Math.pow(num, 2);
        }
    }    

    passOneGeneration(mutationRate = 0.01, mutationScale = 0.1, negativeSelection = false, learning_database = this.learning_database) {
        var best_nn = this.bestNN(negativeSelection, learning_database);
        this.generation.forEach((nn, index) => {
            nn.copy(best_nn, index !== 0, mutationRate, mutationScale);
        });
    }
}

function updateDatasetDropdown() {
    let select = document.getElementById('dataset_chosen');
    select.innerHTML = '';

    all_LDBs.forEach((ds, index) => {
        let option = document.createElement("option");
        option.value = index;
        option.textContent = "Dataset " + (index + 1);
        select.appendChild(option);
    });
}

function Backpropagation(sensivity){
    neural_net.LearnByLD(currentDataset(), sensivity);
    document.getElementById('error_nn2').innerText = "Error: " + gen.calculateError(neural_net) + 
    "\nError on one output: " + gen.reverseErrorCalculation(gen.calculateError(neural_net) / neural_net.outputs_count) + 
    "\nFactual error on one output: " + (gen.reverseErrorCalculation(gen.calculateError(neural_net) / neural_net.outputs_count) / currentDataset().multiplier);
}

document.addEventListener("DOMContentLoaded", function() {
    updateDatasetDropdown();
});

function currentDataset() {
    return all_LDBs[document.getElementById('dataset_chosen').value];
}

function imageToArray(imgSrc, width = 150, height = 150, grayscale = true) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous"; // Чтобы можно было загружать изображения с других источников
        img.src = imgSrc;

        img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            const imageData = ctx.getImageData(0, 0, width, height).data;
            let pixelArray = [];

            if (grayscale) {
                // Преобразуем в черно-белый (одно значение на пиксель)
                for (let i = 0; i < imageData.length; i += 4) {
                    let gray = (imageData[i] + imageData[i + 1] + imageData[i + 2]) / 3;
                    pixelArray.push(gray / 255); // Нормализация [0, 1]
                }
            } else {
                // RGB (три значения на пиксель)
                for (let i = 0; i < imageData.length; i += 4) {
                    pixelArray.push(imageData[i] / 255, imageData[i + 1] / 255, imageData[i + 2] / 255);
                }
            }

            resolve(pixelArray);
        };

        img.onerror = () => reject("Ошибка загрузки изображения");
    });
}

/////////////////////////////////////////////////////

var inputs_count = 50*50;
var outputs_count = 2;

var learningDatabase = new LearningDatabase(inputs_count, outputs_count);

var gen = new Generation(inputs_count, outputs_count, 500, 2, RoundType.NO_ROUND, RoundType.TANH, RoundType.NO_ROUND, 20, learningDatabase);
var neural_net = new NeuralNet(inputs_count, outputs_count, 500, 2, RoundType.NO_ROUND, RoundType.TANH, RoundType.NO_ROUND);

var all_LDBs = [learningDatabase];

///////////////////////////////////////////////////

var dogs = [
    "/dogs/images/Images/n02085620-Chihuahua/n02085620_7.jpg",
    "/dogs/images/Images/n02085620-Chihuahua/n02085620_199.jpg",
    "/dogs/images/Images/n02085620-Chihuahua/n02085620_242.jpg",
    "/dogs/images/Images/n02085620-Chihuahua/n02085620_275.jpg",
    "/dogs/images/Images/n02085620-Chihuahua/n02085620_326.jpg"
];
var cats = [
    "/cats/CAT_00/00000001_000.jpg",
    "/cats/CAT_00/00000001_005.jpg",
    "/cats/CAT_00/00000001_008.jpg",
    "/cats/CAT_00/00000001_011.jpg",
    "/cats/CAT_00/00000001_012.jpg"
];

dogs.forEach((url, index) => {
    imageToArray(url, 50, 50, true).then(pixelArray => {
        learningDatabase.AddItem(pixelArray, [1, 0]);
    }).catch(error => console.error(error));
});
cats.forEach((url, index) => {
    imageToArray(url, 50, 50, true).then(pixelArray => {
        learningDatabase.AddItem(pixelArray, [0, 1]);
    }).catch(error => console.error(error));
});

function Test(url) {
    imageToArray(url, 50, 50, true).then(pixelArray => {
        var answer1 = gen.generation[0].calculate(pixelArray);
        console.log(answer1[0], answer1[1]);
        console.log(answer1[0] > answer1[1] ? "Dog" : "Cat");
    }).catch(error => console.error(error));
}