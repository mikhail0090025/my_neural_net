const playerSpeed = 0.8;
const playerRotateSpeed = 30;
const mapSize = 30;
const playersSize = 0.3;
const playersCount = 30;
const framesForOneGen = 1500;

const nnInputsCount = 13;
const nnOutputsCount = 4;
const nnLayersCount = 3;
const nnLayersSize = 30;

let frames = 0;
let generations = 0;
let mutationScale = 0.01;
let mutationRate = 0.01;
let bestScore = -Infinity;

// STATS
let deaths = [];
let kills = [];
const calculateKD = () => {
    return kills.map((value, index) => value / (deaths[index] == 0 ? 1 : deaths[index]));
};

class Point{
    constructor(x, y){
        this.x = x;
        this.y = y;
    }
    distance(other_point){
        if(!(other_point instanceof Point)) throw new Error("Given object is not valid point");
        return Math.sqrt(Math.pow(other_point.x - this.x, 2) + Math.pow(other_point.y - this.y, 2));
    }
    add(otherPoint) {
        return new Point(this.x + otherPoint.x, this.y + otherPoint.y);
    }
    multiply(scalar) {
        return new Point(this.x * scalar, this.y * scalar);
    }
    toNormalizedVector(){
        var length = this.distance(new Point(0, 0));
        return new Point(this.x / length, this.y / length);
    }
    toDegree(){
        var normVector = this.toNormalizedVector();
        var x = normVector.x;
        var y = normVector.y;
        if(x > 0 && y >= 0) return Math.asin(normVector.x)/ (Math.PI / 180);
        else if (x > 0 && y < 0) return (Math.asin(normVector.x)/ (Math.PI / 180)) + 90;
        else if (x < 0 && y < 0) return Math.abs((Math.asin(normVector.x)/ (Math.PI / 180))) + 180;
        else if (x < 0 && y >= 0) return (90-Math.abs((Math.asin(normVector.x)/ (Math.PI / 180)))) + 270;
        else if (x == 0 && y > 0) return 0;
        else if (x == 0 && y < 0) return 180;
        else if (x == 0 && y == 0) return 0;
    }
    length(){
        return this.distance(new Point(0, 0));
    }
    distanceToVector(A, V) {
        const AP = new Point(this.x - A.x, this.y - A.y);
        const crossProduct = Math.abs(AP.x * V.y - AP.y * V.x);
        const vectorLength = Math.sqrt(V.x * V.x + V.y * V.y);
        return crossProduct / vectorLength;
    }
}

class Direction{
    constructor(dir){
        this.direction = dir;
    }
    getVector(){
        return new Point(
            Math.sin(this.direction * (Math.PI / 180)),
            Math.cos(this.direction * (Math.PI / 180))
        );
    }
}

class Player{
    constructor(position, direction = new Direction(0)){
        this.position = position;
        this.direction = direction;
        this.reset();
    }
    reset(){
        this.score = 0;
        this.kills = 0;
        this.deaths = 0;
    }
    step(forward, right, limit){
        forward = Math.min(forward, 1);
        forward = Math.max(forward, -1);
        right = Math.min(right, 1);
        right = Math.max(right, -1);
        this.position = this.position.add(this.direction.getVector().multiply(forward * playerSpeed));
        this.position = this.position.add(new Direction(this.direction.direction + 90).getVector().multiply(right * playerSpeed));
        if(this.position.x < 0) this.position.x = 0;
        if(this.position.x > limit) this.position.x = limit;
        if(this.position.y < 0) this.position.y = 0;
        if(this.position.y > limit) this.position.y = limit;
    }
    rotate(rotation){
        rotation = Math.min(rotation, 1);
        rotation = Math.max(rotation, -1);
        this.direction.direction += rotation * playerRotateSpeed;
    }
    distance(other_player){
        if(!(other_player instanceof Player)) throw new Error("Given object is not valid player");
        return Math.sqrt(Math.pow(other_player.position.x - this.position.x, 2) + Math.pow(other_player.position.y - this.position.y, 2));
    }
}

const degreeToRadians = value => value * (Math.PI / 180);
const radiansToDegree = value => value * (180 / Math.PI);

class Game{
    constructor(){
        this.players = [];
        for (let index = 0; index < playersCount; index++) {
            /*
            x = (index % (mapSize - 2)) + 1;
            y = Math.floor(((index / (mapSize - 2)) + 1));
            */
            var newPlayer = new Player(this.randomPoint());
            this.addPlayer(newPlayer);
        }
    }
    randomPoint(){
        var x = 0;
        var y = 0;
        x = (Math.random() * (mapSize - 2)) + 1;
        y = (Math.random() * (mapSize - 2)) + 1;
        return new Point(x, y);
    }
    addPlayer(player){
        if(player instanceof Player) {
            this.players.push({
                player: player,
                neuralNet: new NeuralNet(nnInputsCount, nnOutputsCount, nnLayersSize, nnLayersCount, RoundType.NO_ROUND, RoundType.TANH, RoundType.TANH)
            });
        }
        else throw new Error("Given object is not valid player");
    }
    calcNextStep(playerIndex){
        var player = this.players[playerIndex];
        var closestPlayer = this.players
        .filter((_, index) => index !== playerIndex)
        .reduce((nearest, current) => {
            return nearest.player.distance(player.player) > current.player.distance(player.player) ? current : nearest;
        });
        var vector = new Point(closestPlayer.player.position.x - player.player.position.x, closestPlayer.player.position.y - player.player.position.y);
        var distance = vector.length();
        var degree = vector.toDegree();
        var radians = degreeToRadians(degree);
        var delta = vector.toDegree() - player.player.direction.direction;
        
        var inputs = [
            Math.tanh(distance),
            Math.sin(isNaN(radians) ? 0 : radians),
            Math.cos(isNaN(radians) ? 0 : radians),
            // BOTH POSITIONS
            player.player.position.x / mapSize,
            player.player.position.y / mapSize,
            closestPlayer.player.position.x / mapSize,
            closestPlayer.player.position.y / mapSize,
            // BOTH DIRECTIONS
            Math.sin(degreeToRadians(player.player.direction.direction)),
            Math.cos(degreeToRadians(player.player.direction.direction)),
            Math.sin(degreeToRadians(closestPlayer.player.direction.direction)),
            Math.cos(degreeToRadians(closestPlayer.player.direction.direction)),
            // DELTA
            Math.sin(isNaN(degreeToRadians(delta) ? 0 : degreeToRadians(delta))),
            Math.cos(isNaN(degreeToRadians(delta) ? 0 : degreeToRadians(delta)))
        ];
        try {
            var res = player.neuralNet.calculate(inputs);
            player.player.step(res[0], res[1], mapSize);
            player.player.rotate(res[2]);
            if(res[3] > 0) this.Shoot(player.player, closestPlayer.player);
        } catch (error) {
            console.log(inputs);
            console.log(vector);
            throw error;
        }
    }
    Shoot(player, target){
        // CHECK
        //var wasFound = false;
        //this.players.forEach((player_) => {if(player_.player === player) {wasFound = true;}});
        if(!(player instanceof Player)) throw new Error("Given object is not player!");

        // Shot
        var pos_player = target.position;
        if(pos_player.distanceToVector(player.position, player.direction.getVector()) <= playersSize){
            var dist = pos_player.distance(player.position);
            player.score += dist / playersSize;
            player.kills++;
            target.score -= (dist / playersSize) * 0.1;
            target.position = this.randomPoint();
            target.deaths++;
            //console.log("Bot hit other one");
        }

    }
    Frame(update_ui = true){
        for (let index = 0; index < this.players.length; index++) {
            this.calcNextStep(index);
        }
        this.players.forEach(player => {
            if(player.player.position.x < playersSize || player.player.position.x > mapSize - playersSize) player.player.score -= 1;
            if(player.player.position.y < playersSize || player.player.position.y > mapSize - playersSize) player.player.score -= 1;
        });
        frames++;
        if(update_ui) this.updateUI();
    }
    updateUI(){
        this.renderGame("main_canvas");
        this.updateScoreboard();
        document.getElementById("information").innerText = "Frames: " + frames + "\nGenerations: " + generations + "\nBest score: " + bestScore;
    }
    renderGame(canvasId) {
        var canvas = document.getElementById(canvasId);
        var ctx = canvas.getContext('2d');
        var scale = canvas.width / mapSize;
    
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    
        this.players.forEach(playerObj => {
            var player = playerObj.player;
            var playerPosition = player.position;
    
            var playerX = playerPosition.x * scale;
            var playerY = playerPosition.y * scale;
    
            // Нарисуем красный круг (игрока)
            ctx.beginPath();
            ctx.arc(playerX, playerY, playersSize * scale, 0, 2 * Math.PI);
            ctx.fillStyle = 'red';
            ctx.fill();
            ctx.stroke();
    
            // Нарисуем зеленую полоску (направление взгляда игрока)
            var directionVector = player.direction.getVector(); // Получаем вектор направления
            var directionLength = playersSize * scale * 2; // Длина полоски
            var endX = playerX + directionVector.x * directionLength;
            var endY = playerY + directionVector.y * directionLength;
    
            ctx.beginPath();
            ctx.moveTo(playerX, playerY); // Начало полоски в центре игрока
            ctx.lineTo(endX, endY); // Конец полоски в направлении взгляда
            ctx.strokeStyle = 'green';
            ctx.lineWidth = 2; // Толщина линии
            ctx.stroke();
        });
    
        ctx.strokeStyle = 'black';
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
    }
    updateScoreboard() {
        const scoreboardTable = document.getElementById('scoreboard').getElementsByTagName('tbody')[0];

        while (scoreboardTable.rows.length > 0) {
            scoreboardTable.deleteRow(0);
        }

        this.players.forEach((player, index) => {
            const row = scoreboardTable.insertRow();
            const cell1 = row.insertCell(0);
            const cell2 = row.insertCell(1);
            
            cell1.textContent = `Player ${index + 1}`;
            cell2.textContent = Math.round(player.player.score);
        });
    }
    passOneGeneration(update_ui = true){
        // Preparation
        this.resetMap();

        // Generation
        for (let index = 0; index < framesForOneGen; index++) {
            this.Frame(update_ui);
        }

        //
        var best = this.findBest();
        this.players.forEach((current, index) => {
            if(current.neuralNet !== best.player.neuralNet){
                current.neuralNet.copy(best.player.neuralNet, true, mutationRate, mutationScale);
            }
        });
        generations++;
        console.log("Generation passed! Best score: " + best.score);
        kills.push(best.kills);
        deaths.push(best.deaths);
        if(best.score > bestScore){
            bestScore = best.score;
            console.log("New record: " + best.score);
        }
        this.updateUI();
    }
    learn(generationsCount, update_ui = true){
        for (let index = 0; index < generationsCount; index++) {
            this.passOneGeneration(update_ui);
            console.log(index + "/" + generationsCount);
        }
    }
    findBest(){
        var p = this.players.reduce((best, current) => current.player.score > best.player.score ? current : best);
        return {
            player: p,
            score: p.player.score,
            kills: p.player.kills,
            deaths: p.player.deaths
        };
    }
    resetMap(){
        this.players.forEach((current, index) => {
            current.player.position = this.randomPoint();
            current.player.direction.direction = 0;
            current.player.reset();
        });
    }
}

var game = new Game();

/*
renderGraph(kills, 'stats');
const kd => kills.map((value, index) => value / deaths[index]);
*/