from neuralnet import NeuralNet, Generation, LearningDatabase, RoundType

ld = LearningDatabase(2, 2)
ld.add_item([1,1], [1,1])
ld.add_item([0,1], [0,1])
ld.add_item([1,0], [1,0])

gen = Generation(2, 2, [2,2,2], 40, RoundType.NO_ROUND, RoundType.TANH, RoundType.TANH, ld)

for i in range(0, 50):
    print(f"Error: {gen.calculate_error(gen.best_nn(ld), ld)}")
    gen.pass_one_generation(0.001, 0.001, False, ld)