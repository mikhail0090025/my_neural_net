// var max_value = 17+8+8+8;
var max_value = 12*2*2*2;

// Arythmetic progression
for (let startNum = -16; startNum <= 17; startNum++) {
    for (let step = -8; step <= 8; step++) {
        switch (Math.abs(startNum) % 2) {
            case 0:
                learningDatabase.AddItem([startNum, startNum + step, startNum + step + step], [startNum + (step * 3), step]);
                break;
            case 1:
                learningDatabase2.AddItem([startNum, startNum + step, startNum + step + step], [startNum + (step * 3), step]);
                break;
        }
    }
}

// Geometric progression
for (let startNum = -11; startNum <= 12; startNum++) {
    for (let step = -2; step <= 2; step++) {
        switch (Math.abs(startNum) % 2) {
            case 0:
                learningDatabase.AddItem([startNum, startNum * step, startNum * step * step], [startNum * step * step * step, step]);
                break;
            case 1:
                learningDatabase2.AddItem([startNum, startNum * step, startNum * step * step], [startNum * step * step * step, step]);
                break;
        }
    }
}

learningDatabase.multiplyAll(1.0 / max_value);
learningDatabase2.multiplyAll(1.0 / max_value);

function Test(numbers) {
    return "Next number: " + Math.round(gen.generation[0].calculate([numbers[0] / max_value,numbers[1] / max_value,numbers[2] / max_value])[0] * max_value) + ", step: " + Math.round(gen.generation[0].calculate([numbers[0] / max_value,numbers[1] / max_value,numbers[2] / max_value])[1] * max_value) + 
    "\nNext number: " + Math.round(neural_net.calculate([numbers[0] / max_value,numbers[1] / max_value,numbers[2] / max_value])[0] * max_value) + ", step: " + Math.round(neural_net.calculate([numbers[0] / max_value,numbers[1] / max_value,numbers[2] / max_value])[1] * max_value);
}

/*
console.log(Test([10, 3, -4]));
console.log(Test([5, -2, -9]));
console.log(Test([-20, 0, 20]));
console.log(Test([-12, 0, 12]));
*/

all_LDBs.forEach((value, index) => {
    console.log("Database " + (index + 1) + " size: " + value.Size);
});
