const playerSize = 0.5;
const outputsCount = 7;
const mapSize = 50;
const finishSize = 2;
const framesForOneGen = 500;
const playersCount = 7;

const walkSpeed = 1.5;
const sideWalkSpeed = 1;
const rotationSpeed = 90;

// STATS
let totalKills = 0;
let enemyKills = 0;
let friendlyKills = 0;
let framesPassed = 0;
let generationsPassed = 0;
let enemyKillsPerGen = [];
let friendlyKillsPerGen = [];

// OTHER
let mutationRate = 0.1;
let mutationScale = 0.1;

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    distanceTo(other) {
        return Math.sqrt((this.x - other.x) ** 2 + (this.y - other.y) ** 2);
    }

    copy(){
        return new Point(this.x, this.y);
    }

    add(v){
        return new Point(
            this.x + v.x,
            this.y + v.y
        );
    }
}

class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(v) {
        return new Vector(this.x + v.x, this.y + v.y);
    }

    subtract(v) {
        return new Vector(this.x - v.x, this.y - v.y);
    }

    multiply(scalar) {
        return new Vector(this.x * scalar, this.y * scalar);
    }

    magnitude() {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }

    normalize() {
        let mag = this.magnitude();
        return mag === 0 ? new Vector(0, 0) : this.multiply(1 / mag);
    }

    static VectorFromPoints(point1, point2) {
        return new Vector(point1.x - point2.x, point1.y - point2.y);
    }

    angleInDegrees() {
        let angleInRadians = Math.atan2(this.y, this.x); // угол в радианах
        let angleInDegrees = radiansToDegrees(angleInRadians); // переводим в градусы
        return angleInDegrees;
    }

    angleInRadians() {
        let angleInRadians = Math.atan2(this.y, this.x); // угол в радианах
        return angleInRadians;
    }
}

const degreesToRadians = (deg) => deg / 57.29577951;
const radiansToDegrees = (rad) => rad * 57.29577951;
const degreesToVector = (deg) => {
    var rad = degreesToRadians(deg);
    var direction = new Vector(Math.cos(rad), Math.sin(rad));
    return direction;
};

class Wall {
    constructor(centerX, centerY, width, height) {
        this.center = new Point(centerX, centerY);
        this.width = width;
        this.height = height;
    }

    getBounds() {
        return {
            left: this.center.x - this.width / 2,
            right: this.center.x + this.width / 2,
            top: this.center.y - this.height / 2,
            bottom: this.center.y + this.height / 2
        };
    }

    contains(point) {
        let bounds = this.getBounds();
        return point.x >= bounds.left && point.x <= bounds.right &&
               point.y >= bounds.top && point.y <= bounds.bottom;
    }
}

class Player{
    constructor(position, team, game_){
        this.rotation = 0;
        this.position = position;
        this.spawnpoint = this.position.copy();
        this.team = team;
        this.score = 0;
        this.game = game_;
    }
    initNN(){
        this.NN = new NeuralNet(this.getInputs().length, [174, 128, 64, 32, 16], outputsCount, RoundType.NO_ROUND, RoundType.TANH, RoundType.TANH);
        console.log("Inputs count: " + this.getInputs().length);
    }
    rotationVector(){
        return new Vector(Math.cos(degreesToRadians(this.rotation)), Math.sin(degreesToRadians(this.rotation)));
    }
    getInputs(){
        // PLAYERS DATA
        var inputs = [];
        inputs.push(this.position.x / mapSize);
        inputs.push(this.position.y / mapSize);
        inputs.push(Math.sin(degreesToRadians(this.rotation)));

        // OTHER PLAYERS
        var other_players = this.getOtherPlayers();
        other_players.forEach(player => {
            var data = this.otherPlayerData(player);
            inputs.push(...data);
        });

        // RADAR
        var radar = this.getRadar();
        inputs.push(...radar);

        // FINISH DATA
        var finish_vector = Vector.VectorFromPoints(this.position, this.game.finish).normalize();
        inputs.push(this.game.finish.distanceTo(this.position) / mapSize);
        inputs.push(finish_vector.x);
        inputs.push(finish_vector.y);
        inputs.push(Math.sin(finish_vector.angleInRadians()));
        inputs.push(Math.sin(finish_vector.angleInRadians() - degreesToRadians(this.rotation)));
        
        return inputs;
    }
    step(){
        // CALCULATION
        var result = this.NN.calculateOutput(this.getInputs());
        var forwardVector = this.rotationVector().multiply(result[1] > 0 ? result[0] * walkSpeed : 0);
        var sideVector = new Vector(forwardVector.y, -forwardVector.x).normalize().multiply((result[3] > 0) ? (result[2] * sideWalkSpeed) : 0);
        var moveVector = forwardVector.add(sideVector);

        // APPLYING
        if(result[5] > 0) this.rotation += result[4] * rotationSpeed;
        var newPos = this.position.add(moveVector);
        if(!this.game.isPointInWall(newPos)) this.position = newPos;
        if(result[6] > 0) this.Shoot();

        // FINISH CHECKING
        if(this.position.distanceTo(this.game.finish) < playerSize + finishSize) {
            this.position = this.spawnpoint.copy();
            this.score += 200;
        }
    }
    getRadar(){
        var result = [];
        for (let index = 0; index < 360; index+=10) {
            let origin = this.position;
            let direction = degreesToVector(index + this.rotation).normalize();
            var value = this.game.castRay(origin, direction) / mapSize;
            //console.log("Distance: " + value);
            result.push(value);
        }
        return result;
    }
    otherPlayerData(player_other) {
        if(player_other === this) throw new Error("You cant give here this player!");
        var result = [];
        var vector = Vector.VectorFromPoints(player_other.position, this.position).normalize();
        result.push(player_other.position.x / mapSize);
        result.push(player_other.position.y / mapSize);
        result.push(vector.x);
        result.push(vector.y);
        result.push(Math.sin(degreesToRadians(player_other.rotation)));
        result.push(Math.sin(vector.angleInRadians()));
        result.push(Math.sin(vector.angleInRadians() - degreesToRadians(player_other.rotation)));
        result.push(player_other.position.distanceTo(this.position) / mapSize);
        result.push(this.game.sameTeam(this, player_other) ? 1 : 0);
        result.push(this.canSeePlayer(player_other) ? 1 : 0);
        
        return result;
    }
    canSeePlayer(player_other){
        var vector = Vector.VectorFromPoints(player_other.position, this.position).normalize();
        var value = this.game.castRay(this.position, vector);
        return this.position.distanceTo(player_other.position) <= value;
    }
    die(){
        this.position = this.spawnpoint.copy();
        this.score -= 10;
    }
    getOtherPlayers(){
        var all_players = [...this.game.teamA.players, ...this.game.teamB.players];
        all_players = all_players.filter(player => player !== this);
        
        return all_players;
    }

    Shoot() {
        // Направление луча на основе угла поворота игрока
        const direction = new Vector(Math.cos(degreesToRadians(this.rotation)), Math.sin(degreesToRadians(this.rotation)));
    
        // Проходим по всем игрокам
        this.getOtherPlayers().forEach(player => {
            // Вычисляем расстояние от луча до игрока
            const distanceToRay = this.distanceFromRay(player);
    
            // Вычисляем длину луча от игрока в направлении выстрела
            const rayLength = this.game.castRay(this.position, direction);
    
            // Если расстояние до луча меньше размера игрока, проверяем столкновение с препятствиями
            if (distanceToRay < playerSize) {
                // Если луч не уперся в стену (длина луча больше расстояния до игрока), то проверяем попадание
                if (rayLength >= this.position.distanceTo(player.position)) {
                    // Проверяем, если игрок враг
                    if (this.game.sameTeam(this, player)) {
                        this.score -= 10 * distanceToRay; // Уменьшаем счет за попадание в своего
                        friendlyKills++;
                    } else {
                        this.score += 10 * distanceToRay; // Увеличиваем счет за попадание в врага
                        enemyKills++;
                    }
                    player.die();
                    totalKills++;
                }
            }
        });
    }
    
    // Метод для вычисления расстояния от игрока до луча
    distanceFromRay(player) {
        const playerToOrigin = new Vector(player.position.x - this.position.x, player.position.y - this.position.y);
        const direction = new Vector(Math.cos(degreesToRadians(this.rotation)), Math.sin(degreesToRadians(this.rotation)));

        // Перпендикулярное расстояние от точки до прямой
        return Math.abs(playerToOrigin.x * direction.y - playerToOrigin.y * direction.x);
    }
    reset(){
        this.score = 0;
        this.position = this.spawnpoint.copy();
    }
}

class Team{
    constructor(size, startPoint, game_){
        this.size = size;
        this.startPoint = startPoint;
        this.players = [];
        this.game = game_;
    }
    spawnTeam(){
        this.players = [];
        let squareSize = Math.ceil(Math.sqrt(this.size));
        let squareSize2 = Math.ceil(squareSize / 2.0);
        let spawned = 0;
        for (let x = 0; x < squareSize; x++) {
            for (let y = 0; y < squareSize; y++) {
                if(spawned >= this.size) break;
                this.players.push(new Player(new Point(-squareSize2 + x + this.startPoint.x, -squareSize2 + y + this.startPoint.y), this, this.game));
                spawned++;
            }
        }
    }
}

class Game {
    constructor(teamSize, spawnpoint1, spawnpoint2, walls) {
        this.teamA = new Team(teamSize, spawnpoint1, this);
        this.teamB = new Team(teamSize, spawnpoint2, this);
        this.teamA.spawnTeam();
        this.teamB.spawnTeam();
        this.finish = new Point(mapSize / 2, mapSize / 2);
        this.walls = walls;
        this.teamA.players.forEach(player => player.initNN());
        this.teamB.players.forEach(player => player.initNN());
    }

    getBestPlayers() {
        let allPlayers = [...this.teamA.players, ...this.teamB.players];
        var bestAPlayer1 = this.teamA.players.reduce((best, player) => 
            (best === null || player.score > best.score) ? player : best, null);
        var bestAPlayer2 = this.teamA.players.reduce((best, player) => 
            (best === null || (player.score > best.score && player !== bestAPlayer1)) ? player : best, null);
        var bestBPlayer1 = this.teamB.players.reduce((best, player) => 
            (best === null || player.score > best.score) ? player : best, null);
        var bestBPlayer2 = this.teamB.players.reduce((best, player) => 
            (best === null || (player.score > best.score && player !== bestBPlayer1)) ? player : best, null);
        return [
            bestAPlayer1,
            bestAPlayer2,
            bestBPlayer1,
            bestBPlayer2
        ];
    }
    sameTeam(player1, player2){
        if(this.teamA.players.indexOf(player1) !== -1 && this.teamA.players.indexOf(player2) !== -1) return true;
        else if(this.teamB.players.indexOf(player1) !== -1 && this.teamB.players.indexOf(player2) !== -1) return true;
        return false;
    }
    isPointInWall(point){
        return this.walls.some((wall) => wall.contains(point));
    }
    render(ctx) {
        const scale = ctx.canvas.width / mapSize; // Пропорциональное масштабирование
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
        // Рендер стен
        ctx.fillStyle = "gray";
        ctx.strokeStyle = "black";
        this.walls.forEach(wall => {
            let bounds = wall.getBounds();
            ctx.fillRect(bounds.left * scale, bounds.top * scale, wall.width * scale, wall.height * scale);
            ctx.strokeRect(bounds.left * scale, bounds.top * scale, wall.width * scale, wall.height * scale);
        });
    
        // Рендер финиша
        ctx.fillStyle = "turquoise";
        ctx.beginPath();
        ctx.arc(this.finish.x * scale, this.finish.y * scale, finishSize * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "black";
        ctx.stroke();
    
        // Рендер игроков
        this.teamA.players.forEach(player => this.drawPlayer(ctx, player, "blue", scale));
        this.teamB.players.forEach(player => this.drawPlayer(ctx, player, "red", scale));
    }
    
    drawPlayer(ctx, player, color, scale) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(player.position.x * scale, player.position.y * scale, playerSize * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "black";
        ctx.stroke();

        // Рассчитываем направление
        const direction = new Vector(Math.cos(degreesToRadians(player.rotation)), Math.sin(degreesToRadians(player.rotation)));

        // Рисуем маленькую полоску направления
        const lineLength = playerSize * 2;  // длина полоски в 2 раза больше радиуса игрока
        const endX = player.position.x + direction.x * lineLength;
        const endY = player.position.y + direction.y * lineLength;

        // Настройка цвета для направления
        ctx.strokeStyle = "darkgoldenrod";  // Цвет полоски направления
        ctx.lineWidth = 2;  // Толщина полоски

        // Рисуем линию направления
        ctx.beginPath();
        ctx.moveTo(player.position.x * scale, player.position.y * scale);  // Начало в центре игрока
        ctx.lineTo(endX * scale, endY * scale);  // Конец на линии направления
        ctx.stroke();
    }

    castRay(origin, direction) {
        let minDistance = Infinity;
        let hitPoint = null;

        this.walls.forEach(wall => {
            let bounds = wall.getBounds();
            let wallEdges = [
                { start: new Point(bounds.left, bounds.top), end: new Point(bounds.right, bounds.top) },  // Верхняя грань
                { start: new Point(bounds.right, bounds.top), end: new Point(bounds.right, bounds.bottom) }, // Правая грань
                { start: new Point(bounds.right, bounds.bottom), end: new Point(bounds.left, bounds.bottom) }, // Нижняя грань
                { start: new Point(bounds.left, bounds.bottom), end: new Point(bounds.left, bounds.top) } // Левая грань
            ];

            wallEdges.forEach(edge => {
                let intersection = this.rayIntersectsSegment(origin, direction, edge.start, edge.end);
                if (intersection) {
                    let distance = origin.distanceTo(intersection);
                    if (distance < minDistance) {
                        minDistance = distance;
                        hitPoint = intersection;
                    }
                }
            });
        });

        return minDistance === Infinity ? null : minDistance;
    }

    rayIntersectsSegment(origin, direction, A, B) {
        let x1 = A.x, y1 = A.y, x2 = B.x, y2 = B.y;
        let x3 = origin.x, y3 = origin.y;
        let x4 = origin.x + direction.x, y4 = origin.y + direction.y;

        let denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (denom === 0) return null; // Луч и отрезок параллельны

        let t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
        let u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

        if (t >= 0 && t <= 1 && u >= 0) {
            return new Point(x1 + t * (x2 - x1), y1 + t * (y2 - y1));
        }
        return null;
    }
    Frame(redraw = true){
        this.teamA.players.forEach(player => player.step());
        this.teamB.players.forEach(player => player.step());
        framesPassed++;
        if(redraw) this.UpdateUI();
    }
    UpdateUI(){
        game.render(document.getElementById("main_canvas").getContext("2d"));
        document.getElementById("Game_info").innerText = "Total kills: " + totalKills + 
        "\nFriendly kills: " + friendlyKills + 
        "\nEnemy kills: " + enemyKills + 
        "\nFrames passed: " + framesPassed + 
        "\nGenerations passed: " + generationsPassed;
    }
    passOneGeneration(){
        this.teamA.players.forEach(player => player.reset());
        this.teamB.players.forEach(player => player.reset());
        var currFK = friendlyKills;
        var currEK = enemyKills;
        for (let index = 0; index < framesForOneGen; index++) {
            this.Frame(false);
        }
        var bests = this.getBestPlayers();
        this.teamA.players.forEach(player => {
            let index = Math.random() < 0.5 ? 0 : 1;
            if(player !== bests[index]) player.NN = bests[index].NN.copy(mutationRate, mutationScale);
        });
        this.teamB.players.forEach(player => {
            let index = Math.random() < 0.5 ? 2 : 3;
            if(player !== bests[index]) player.NN = bests[index].NN.copy(mutationRate, mutationScale);
        });
        var bestScore = bests.reduce((best, player) => 
            (best === null || player.score > best.score) ? player : best, null).score;
        console.log("Generation passed! Best score: " + bestScore);
        generationsPassed++;
        enemyKillsPerGen.push(enemyKills - currEK);
        friendlyKillsPerGen.push(friendlyKills - currFK);
        this.UpdateUI();
    }
}

var walls = [
    // borders
    new Wall(-2, mapSize / 2, 4.5, mapSize),
    new Wall(mapSize + 2, mapSize / 2, 4.5, mapSize),
    new Wall(mapSize / 2, -2, mapSize, 5),
    new Wall(mapSize / 2, mapSize + 2, mapSize, 5),

    // other walls
    new Wall(15, 20, 2, 27),
    new Wall(mapSize - 15, mapSize - 20, 2, 27),
    new Wall(26, 7.5, 20, 2),
    new Wall(mapSize - 26, mapSize - 7.5, 20, 2)
];

var game = new Game(playersCount, new Point(45, 5), new Point(45, 45), walls);
game.UpdateUI();