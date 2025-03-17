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

class NeuralNet {
    constructor(inputsCount, hiddenLayerSizes, outputsCount, inp_round_type, n_round_type, out_round_type) {
        this.inputsCount = inputsCount;
        this.hiddenLayerSizes = hiddenLayerSizes; // Список размеров скрытых слоев
        this.outputsCount = outputsCount;
        this.inp_round_type = inp_round_type;
        this.n_round_type = n_round_type;
        this.out_round_type = out_round_type;
        
        this.layers = [];
        this.weights = [];

        // Генерация слоев и весов
        this.createLayers();
        this.generateWeights();
    }

    // Генерация слоев
    createLayers() {
        // Входной слой
        this.layers.push(this.inputsCount);

        // Скрытые слои
        this.hiddenLayerSizes.forEach(size => this.layers.push(size));

        // Выходной слой
        this.layers.push(this.outputsCount);
    }

    // Генерация случайных весов для каждого слоя
    generateWeights() {
        for (let i = 0; i < this.layers.length - 1; i++) {
            const layerInputCount = this.layers[i];
            const layerOutputCount = this.layers[i + 1];

            // Генерация случайных коэффициентов для весов между слоями
            const weightsLayer = [];
            for (let j = 0; j < layerOutputCount; j++) {
                const weights = [];
                for (let k = 0; k < layerInputCount; k++) {
                    // Случайный коэффициент от -1 до 1
                    weights.push(Math.random() * 2 - 1);
                }
                weightsLayer.push(weights);
            }
            this.weights.push(weightsLayer);
        }
    }

    // Применение функции активации в зависимости от типа
    applyActivation(value, roundType) {
        switch(roundType) {
            case RoundType.TANH:
                return Math.tanh(value);
            case RoundType.RELU:
                return Math.max(0, value);
            case RoundType.ZERO_ONE:
                return value <= 0 ? 0 : 1;
            case RoundType.NO_ROUND:
                return value;
            default:
                return value;
        }
    }

    // Метод для получения выходных значений нейронной сети
    calculateOutput(inputs) {
        let currentInput = inputs;

        // Проходим через все слои
        for (let i = 0; i < this.weights.length; i++) {
            let nextLayerOutput = [];
            let currentLayerWeights = this.weights[i];

            // Процесс вычисления активаций для текущего слоя
            for (let j = 0; j < currentLayerWeights.length; j++) {
                let neuronInput = 0;

                // Вычисление суммы входов для нейрона
                for (let k = 0; k < currentLayerWeights[j].length; k++) {
                    neuronInput += currentInput[k] * currentLayerWeights[j][k];
                }

                // Применяем функцию активации
                nextLayerOutput.push(this.applyActivation(neuronInput, this.n_round_type));
            }

            // Теперь выход этого слоя становится входом для следующего слоя
            currentInput = nextLayerOutput;
        }

        // Возвращаем результат (выходной слой)
        return currentInput;
    }

    // Метод для получения весов (для отладки или использования)
    getWeights() {
        return this.weights;
    }

    copy(mutationRate, mutationScale) {
        // Создаём новую нейронную сеть с такими же параметрами
        const newNet = new NeuralNet(
            this.inputsCount, 
            this.hiddenLayerSizes, 
            this.outputsCount, 
            this.inp_round_type, 
            this.n_round_type, 
            this.out_round_type
        );

        // Копируем веса и применяем мутацию
        for (let i = 0; i < this.weights.length; i++) {
            for (let j = 0; j < this.weights[i].length; j++) {
                for (let k = 0; k < this.weights[i][j].length; k++) {
                    // Копирование веса
                    newNet.weights[i][j][k] = this.weights[i][j][k];

                    // Мутация с заданной вероятностью
                    if (Math.random() < mutationRate) {
                        // Применяем мутацию с масштабом
                        newNet.weights[i][j][k] += (Math.random() * 2 - 1) * mutationScale;
                    }
                }
            }
        }

        // Возвращаем новую нейронную сеть
        return newNet;
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
class Generation {
    constructor(inputs_count, outputs_count, hidden_layer_sizes, generation_size, inp_round_type, n_round_type, out_round_type, learning_database) {
        this.generation = [];
        this.inputs_count = inputs_count;
        this.outputs_count = outputs_count;
        this.hidden_layer_sizes = hidden_layer_sizes;
        this.learning_database = learning_database;
        this.generationsPassed = 0;
        //this.the_smallest_error = Infinity;
        
        // Создание начальной популяции нейронных сетей
        for (let index = 0; index < generation_size; index++) {
            this.generation.push(new NeuralNet(inputs_count, hidden_layer_sizes, outputs_count, inp_round_type, n_round_type, out_round_type));
        }
    }

    // Нахождение лучшей нейронной сети с минимальной ошибкой
    bestNN(negativeSelection = false, learning_database = this.learning_database) {
        this.the_smallest_error = this.calculateError(this.generation[0], learning_database);
        let index_nn = 0;
        
        this.generation.forEach((element, index) => {
            let error_nn = this.calculateError(element, learning_database);            
    
            if ((negativeSelection && error_nn > this.the_smallest_error) || (!negativeSelection && error_nn < this.the_smallest_error)) {
                this.the_smallest_error = error_nn;
                index_nn = index;
            }
        });
        return this.generation[index_nn];
    }

    // Вывод информации о самой лучшей сети
    dataInText() {
        return "Error: " + this.the_smallest_error +
            "\nAverage error on one output: " + this.reverseErrorCalculation(this.the_smallest_error / this.outputs_count) + 
            "\nFactual error on one output (considering multiplier): " + (this.reverseErrorCalculation(this.the_smallest_error / this.outputs_count) / this.learning_database.multiplier) +
            "\nGenerations passed: " + this.generationsPassed;
    }

    // Расчёт ошибки на всей базе данных
    calculateError(nn, learning_database = this.learning_database) {
        return learning_database.inputs.reduce((totalError, inputs_, i) => {
            const outputs_ = learning_database.outputs[i];
            const result = nn.calculateOutput(inputs_);  // Используем метод calculateOutput для получения результата сети
            
            return totalError + outputs_.reduce((sum, value, idx) => {
                let diff = Math.abs(value - result[idx]);
                return (diff > 1) ? (sum + Math.pow(diff, 2)) : (sum + Math.sqrt(diff));
            }, 0);
        }, 0) / learning_database.Size;
    }

    // Перевод ошибки в текстовое представление
    reverseErrorCalculation(num) {
        if (num > 1) {
            return Math.sqrt(num);
        } else {
            return Math.pow(num, 2);
        }
    }    

    // Метод для создания следующего поколения с мутацией
    passOneGeneration(mutationRate = 0.01, mutationScale = 0.1, negativeSelection = false, learning_database = this.learning_database) {
        const best_nn = this.bestNN(negativeSelection, learning_database);
        
        this.generation.forEach((nn, index) => {
            if (nn !== best_nn) {
                this.generation[index] = best_nn.copy(mutationRate, mutationScale);
            }
        });
        this.generationsPassed++;
    }
}