const gameScreen = document.querySelector("[data-game-screen]");
const player = document.querySelector("[data-player]");
const obstacleContainer = document.querySelector("[data-obstacles]");
const scoreDisplay = document.querySelector("[data-score]");
const message = document.querySelector("[data-message]");
const startButton = document.querySelector("[data-start-button]");
let gameRunning = false;
let lastFrameTime = 0;
let score = 0;

function startGame() {
    if (gameRunning) {
        return;
    }
    gameRunning = true;
    lastFrameTime = performance.now();
    score = 0;
    obstacleContainer.replaceChildren();
    scoreDisplay.textContent = score;
    message.textContent = "";
    startButton.disabled = true;
    requestAnimationFrame(gameLoop);
}

function gameLoop(currentTime) {
    if (!gameRunning) {
        return;
    }

    const deltaTime = (currentTime - lastFrameTime) / 1000;
    lastFrameTime = currentTime;
    updatePlayer(deltaTime);
    updateObstacles(deltaTime);
    if (checkCollisions()) {
        endGame();
        return;
    }
    updateScore(deltaTime);
    requestAnimationFrame(gameLoop);
}

function updatePlayer(deltaTime) {
    // Jumping and gravity
}

function jump() {
    // The player's jump start
}

function updateObstacles(deltaTime) {
    // Obstacle generation and movement
}

function checkCollisions() {
    // Collision detection
    return false;
}

function updateScore(deltaTime) {
    // Score calculation and display update
}

function endGame() {
    gameRunning = false;
    message.textContent = `Game over! Score: ${Math.floor(score)}`;
    startButton.textContent = "Restart Game";
    startButton.disabled = false;
}

startButton.addEventListener("click", startGame);
document.addEventListener("keydown", (event) => {
    if (event.code === "Space" || event.code === "ArrowUp") {
        event.preventDefault();
        if (gameRunning) {
            jump();
        }
    }
});