const gameScreen = document.querySelector("[data-game-screen]");
const player = document.querySelector("[data-player]");
const obstacleContainer = document.querySelector("[data-obstacles]");
const scoreDisplay = document.querySelector("[data-score]");
const message = document.querySelector("[data-message]");
const startButton = document.querySelector("[data-start-button]");
let gameRunning = false;
let lastFrameTime = 0;
let score = 0;

const GRAVITY = 300;
const PLAYER_STATE = {
    yPosition: 0,
    yVelocity: 0,
    jumping: false,
    jumpVelocity: 250,
};
const OBSTACLES = {
    width: 40,
    inactivePosition: 0,
    maxSpawns: 6,
    spawnRate: 2000,
    lastSpawnTime: 0,
    speed: 200,
    instances: [],
};


function setupObstacles() {
    OBSTACLES.inactivePosition = obstacleContainer.clientWidth + OBSTACLES.width;

    for (let i=0; i < OBSTACLES.maxSpawns; i++) {
        const obstacle_element = document.createElement('div');
        obstacle_element.classList.add("game__obstacle");
        
        const new_instance = {
            xPosition: 0,  // r to l
            element: obstacle_element,
            active: false,
        };

        OBSTACLES.instances.push(new_instance);
    }
}

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
    setupObstacles();
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
    PLAYER_STATE.yVelocity -= GRAVITY * deltaTime;
    PLAYER_STATE.yPosition += PLAYER_STATE.yVelocity * deltaTime;

    if (PLAYER_STATE.yPosition <= 0) {
        PLAYER_STATE.yPosition = 0;
        PLAYER_STATE.yVelocity = 0;
        PLAYER_STATE.jumping = false;
    }

    player.style.bottom = `${PLAYER_STATE.yPosition}px`;
}

function jump() {
    // The player's jump start
    if (PLAYER_STATE.jumping) return;

    PLAYER_STATE.jumping = true;
    PLAYER_STATE.yVelocity = PLAYER_STATE.jumpVelocity;
}

function spawnObstacle() {
    const nextObstacle = OBSTACLES.instances.filter(obj => !obj.active)[0];

    if (nextObstacle) {
        nextObstacle.xPosition = -OBSTACLES.width;
        nextObstacle.element.style.right = `-${OBSTACLES.width}px`;
        nextObstacle.active = true;
        obstacleContainer.appendChild(nextObstacle.element);
    }
}

function updateObstacles(deltaTime) {
    // Obstacle generation and movement
    const currentTime = performance.now();

    // Spawning - time since last
    if (currentTime - OBSTACLES.lastSpawnTime > OBSTACLES.spawnRate) {
        OBSTACLES.lastSpawnTime = currentTime;

        spawnObstacle();
    }

    // Movement
    OBSTACLES.instances.forEach((obstacle) => {
        // Set positions
        if (obstacle.active) {
            obstacle.xPosition += OBSTACLES.speed * deltaTime;
            obstacle.element.style.right = `${obstacle.xPosition}px`;
    
            if (obstacle.xPosition >= OBSTACLES.inactivePosition) {
                obstacle.active = false;
            }
        }
    });
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