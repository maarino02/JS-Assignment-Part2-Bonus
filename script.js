// Elements
const gameScreen = document.querySelector("[data-game-screen]");
const player = document.querySelector("[data-player]");
const obstacleContainer = document.querySelector("[data-obstacles]");
const scoreDisplay = document.querySelector("[data-score]");
const highScoreDisplay = document.querySelector("[data-high-score]");
const message = document.querySelector("[data-message]");
const startButton = document.querySelector("[data-start-button]");

// Data
const GRAVITY = 1500;
const COLLISION_TOLERANCE = 2;  // A little leeway to stop visual misses being calculated as hits.
const MAX_SCALE = 3.0;
const DIFFICULTY_STEP = 5;
const PLAYER_STATE = {
    xPosition: 40,
    yPosition: 0,
    yVelocity: 0,
    jumping: false,
    jumpVelocity: 600,
};
const OBSTACLES = {
    baseHeight: 45,
    heightVariance: 30,
    borderSpacing: 40,
    inactivePosition: -40,
    maxSpawns: 6,
    spawnRate: 2000,
    lastSpawnTime: 0,
    speed: 200,
    baseSpeed: 200,
    instances: [],
};
const AUDIO = new AudioContext();

// Variable data
let currentScale = 1.0;
let gameRunning = false;
let lastFrameTime = 0;
let score = 0;
let highScore = 0;
let scoreUpdated = true;
let gameWidth = getGameWidth();


// RANDOMISATION
function randomNumber(limit) {
    return Math.floor(Math.random() * limit);
}

function randomColour() {
    return `rgb(${randomNumber(256)} ${randomNumber(256)} ${randomNumber(256)})`;
}

// MEASURES
function getGameWidth() {
    return gameScreen.getBoundingClientRect().width;
}

// AUDIO
function createAudioComponents() {
    return {
        now: AUDIO.currentTime,
        osc: AUDIO.createOscillator(),
        gain: AUDIO.createGain(),
    };
}

function playSound(components) {
    components.osc.connect(components.gain);
    components.gain.connect(AUDIO.destination);

    components.osc.start(components.now);
    components.osc.stop(components.now + components.duration);
}

function playJumpSound() {
    const components = createAudioComponents();
    
    // Short upward pitch sweep
    components.osc.type = "square";
    components.osc.frequency.setValueAtTime(250, components.now);
    components.osc.frequency.exponentialRampToValueAtTime(600, components.now + 0.12);

    components.gain.gain.setValueAtTime(0.15, components.now);
    components.gain.gain.exponentialRampToValueAtTime(0.001, components.now + 0.12);

    components.duration = 0.12;

    playSound(components);
}

function playDeathSound() {
    const components = createAudioComponents();
    
    // Descending, lower-pitched sound
    components.osc.type = "sawtooth";
    components.osc.frequency.setValueAtTime(300, components.now);
    components.osc.frequency.exponentialRampToValueAtTime(70, components.now + 0.4);

    components.gain.gain.setValueAtTime(0.2, components.now);
    components.gain.gain.exponentialRampToValueAtTime(0.001, components.now + 0.4);
    
    components.duration = 0.4;

    playSound(components);
}

function playScoreSound() {
    const components = createAudioComponents();

    components.osc.type = "square";
    components.osc.frequency.setValueAtTime(500, components.now);
    components.osc.frequency.exponentialRampToValueAtTime(900, components.now + 0.12);

    components.gain.gain.setValueAtTime(0.15, components.now);
    components.gain.gain.exponentialRampToValueAtTime(0.001, components.now + 0.12);

    components.duration = 0.12;

    playSound(components);

}

function playHighScoreSound() {
    const components = createAudioComponents();

    components.osc.type = "square";
    components.osc.frequency.setValueAtTime(500, components.now);
    components.osc.frequency.setValueAtTime(700, components.now + 0.10);
    components.osc.frequency.setValueAtTime(1000, components.now + 0.20);

    components.gain.gain.setValueAtTime(0.15, components.now);
    components.gain.gain.setValueAtTime(0.15, components.now + 0.20);
    components.gain.gain.exponentialRampToValueAtTime(0.001, components.now + 0.35);

    components.duration = 0.35;

    playSound(components);
}

// SETUP
function setupObstacles() {
    OBSTACLES.speed = OBSTACLES.baseSpeed;
    OBSTACLES.instances = [];

    for (let i=0; i < OBSTACLES.maxSpawns; i++) {
        const obstacle_element = document.createElement('div');
        obstacle_element.classList.add("game__obstacle");
        
        const new_instance = {
            xPosition: 0,
            element: obstacle_element,
            active: false,
            scored: false,
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
    currentScale = 1.0;
    
    obstacleContainer.replaceChildren();
    setupObstacles();

    scoreDisplay.textContent = score;
    message.textContent = "";
    startButton.disabled = true;
    requestAnimationFrame(gameLoop);
}

// CORE LOOP
function gameLoop(currentTime) {
    if (!gameRunning) {
        return;
    }

    const deltaTime = (currentTime - lastFrameTime) / 1000;
    lastFrameTime = currentTime;
    updateDifficulty();
    updatePlayer(deltaTime);
    updateObstacles(deltaTime);
    if (checkCollisions()) {
        endGame();
        return;
    }
    updateScore();
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
    playJumpSound();
}

function spawnObstacle() {
    const nextObstacle = OBSTACLES.instances.filter(obj => !obj.active)[0];

    if (nextObstacle) {
        const randomHeight = OBSTACLES.baseHeight + (randomNumber(OBSTACLES.heightVariance * 2) - OBSTACLES.heightVariance);

        nextObstacle.xPosition = gameWidth + OBSTACLES.borderSpacing;
        nextObstacle.element.style.left = `${nextObstacle.xPosition}px`;
        nextObstacle.element.style.backgroundColor = randomColour();
        nextObstacle.element.style.height = `${randomHeight}px`;
        nextObstacle.active = true;
        nextObstacle.scored = false;
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
            obstacle.xPosition -= OBSTACLES.speed * deltaTime;
            obstacle.element.style.left = `${obstacle.xPosition}px`;
            let obstacleWidth = obstacle.element.getBoundingClientRect().width;
    
            if (obstacle.xPosition < OBSTACLES.inactivePosition) {
                obstacle.active = false;
            }

            // Obstacle safely passed
            if (obstacle.xPosition < PLAYER_STATE.xPosition - obstacleWidth && !obstacle.scored) {
                incrementScore();
                obstacle.scored = true;
            }
        }
    });
}

function updateDifficulty() {
    const difficultyLevel = Math.floor(score / DIFFICULTY_STEP);
    const newScale = 1 + (difficultyLevel / 10);

    if (currentScale < newScale && newScale <= MAX_SCALE) {
        currentScale = newScale;

        OBSTACLES.speed *= currentScale;
    }
}

// COLLISION
function isColliding(a, b) {
    // Simple & short collision check between 2 bounding rects
    const t = COLLISION_TOLERANCE / 2;

    const aLeft = a.x + t;
    const aRight = a.x + a.width - t;
    const aTop = a.y + t;
    const aBottom = a.y + a.height - t;

    const bLeft = b.x + t;
    const bRight = b.x + b.width - t;
    const bTop = b.y + t;
    const bBottom = b.y + b.height - t;

    return (
        aLeft < bRight &&
        aRight > bLeft &&
        aTop < bBottom &&
        aBottom > bTop
    );
}

function checkCollisions() {
    // Collision detection
    const playerBox = player.getBoundingClientRect();
    const obstacles = OBSTACLES.instances.filter(obj => obj.active);

    const hasCollided = obstacles.some(obs => isColliding(playerBox, obs.element.getBoundingClientRect()));

    return hasCollided;
}

// SCORE
function incrementScore() {
    score += 1;
    scoreUpdated = true;
    playScoreSound();
}

function updateScore() {
    // Update UI
    if (scoreUpdated) {
        scoreDisplay.textContent = score.toLocaleString();
        scoreUpdated = false;
    }
}

// END LOOP
function endGame() {
    gameRunning = false;
    startButton.textContent = "Restart Game";
    startButton.disabled = false;
    
    if (score > highScore) {
        highScore = score;
        highScoreDisplay.textContent = highScore.toLocaleString();
        message.textContent = `New high score! ${Math.floor(score)}`;
        playHighScoreSound();
    } else {
        message.textContent = `Game over! Score: ${Math.floor(score)}`;
        playDeathSound();
    }
}

// EVENTS
startButton.addEventListener("click", startGame);
document.addEventListener("keydown", (event) => {
    if (event.code === "Space" || event.code === "ArrowUp") {
        event.preventDefault();
        if (gameRunning) {
            jump();
        }
    }
});
window.addEventListener("resize", () => {
    gameWidth = getGameWidth();
});