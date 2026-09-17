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
    borderSpacing: 40,
    inactivePosition: 0,
    maxSpawns: 6,
    spawnRate: 2000,
    lastSpawnTime: 0,
    speed: 200,
    instances: [],
};
const AUDIO = new AudioContext();

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
    components.osc.stop(components.now + 0.12);
}

function playJumpSound() {
    const components = createAudioComponents();
    
    // Short upward pitch sweep
    components.osc.type = "square";
    components.osc.frequency.setValueAtTime(250, components.now);
    components.osc.frequency.exponentialRampToValueAtTime(600, components.now + 0.12);

    components.gain.gain.setValueAtTime(0.15, components.now);
    components.gain.gain.exponentialRampToValueAtTime(0.001, components.now + 0.12);

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

    playSound(components);
}

// SETUP
function setupObstacles() {
    OBSTACLES.inactivePosition = obstacleContainer.clientWidth + OBSTACLES.borderSpacing;

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

// CORE LOOP
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
    playJumpSound();
}

function spawnObstacle() {
    const nextObstacle = OBSTACLES.instances.filter(obj => !obj.active)[0];

    if (nextObstacle) {
        nextObstacle.xPosition = -OBSTACLES.borderSpacing;
        nextObstacle.element.style.right = `-${OBSTACLES.borderSpacing}px`;
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

// COLLISION
function isColliding(a, b) {
    // Simple & short collision check between 2 bounding rects
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x && 
        a.y < b.y + b.height && 
        a.y + a.height > b.y
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
function updateScore(deltaTime) {
    // Score calculation and display update
}

// END LOOP
function endGame() {
    playDeathSound();
    gameRunning = false;
    message.textContent = `Game over! Score: ${Math.floor(score)}`;
    startButton.textContent = "Restart Game";
    startButton.disabled = false;
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