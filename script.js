// Game Configuration
const GAME_WIDTH = 600;
const GAME_HEIGHT = 400;
const TARGET_SPEED = 4;
const BALL_SPEED = 12;

// DOM Elements
const target = document.getElementById('target');
const ball = document.getElementById('ball');
const goalkeeper = document.getElementById('goalkeeper');
const goalsDisplay = document.getElementById('goals');
const missesDisplay = document.getElementById('misses');
const messageDisplay = document.getElementById('message-display');

// Game State
let state = {
    isAiming: true,       // Phase 1: Target moves, waiting for spacebar
    isBallMoving: false,  // Phase 2: Ball travels to goal

    // Target
    targetX: 0,
    targetDirection: 1,

    // Ball
    ballX: 285,           // Starts at center (pitch width 600 / 2 - ball width 15)
    ballY: 100,           // Starts at penalty spot
    ballTargetX: 0,       // Where the ball is headed

    // Score
    goals: 0,
    misses: 0
};

// Game Loop
function gameLoop() {
    if (state.isAiming) {
        moveTarget();
    } else if (state.isBallMoving) {
        moveBall();
    }
    requestAnimationFrame(gameLoop);
}

// 1. Target Movement
function moveTarget() {
    state.targetX += (TARGET_SPEED * state.targetDirection);

    // Bounce off walls
    const maxRight = GAME_WIDTH - 20; // Target width is 20px
    if (state.targetX >= maxRight) {
        state.targetX = maxRight;
        state.targetDirection = -1;
    } else if (state.targetX <= 0) {
        state.targetX = 0;
        state.targetDirection = 1;
    }

    target.style.left = state.targetX + 'px';
}

// 2. Input Handling
document.addEventListener('keydown', (event) => {
    if (event.code === 'Space' && state.isAiming) {
        shoot();
    }
});

function shoot() {
    state.isAiming = false;
    state.isBallMoving = true;

    // The ball should fly towards where the target IS right now.
    // We calculate the path so it reaches the target X when it reaches the goal Y.
    state.ballTargetX = state.targetX;

    // Choose a random spot for the goalkeeper to dive to!
    // Goal is 300px wide, centered at X=150 relative to game container is tricky?
    // Let's keep it simple: Goalkeeper moves randomly left or right.
    decideGoalkeeperMove();

    messageDisplay.innerText = "SHOOT!";
}

// 3. Goalkeeper Logic
let goalkeeperX = 125; // Center of goal (300px goal / 2 - 50px keeper / 2)
let goalkeeperTargetX = 125;

function decideGoalkeeperMove() {
    // Random number between 0 and 250 (Goal width 300 - Keeper width 50)
    goalkeeperTargetX = Math.floor(Math.random() * 250);
}

// 4. Ball Physics & Collision
function moveBall() {
    // Move Up
    state.ballY += BALL_SPEED;

    // Move Sideways (Interpolate towards target)
    // Simple approach: Move X directly proportional to Y progress
    // Total Y distance needed = 350 (Goal) - 100 (Spot) = 250px
    // Current Y progress = state.ballY - 100
    const progress = (state.ballY - 100) / 250;

    // Lerp (Linear Interpolation) for X
    // Start X = 285. End X = state.ballTargetX.
    const currentBallX = 285 + (state.ballTargetX - 285) * progress;

    // Move Goalkeeper towards his target
    const keeperSpeed = 3;
    if (goalkeeperX < goalkeeperTargetX) goalkeeperX += keeperSpeed;
    if (goalkeeperX > goalkeeperTargetX) goalkeeperX -= keeperSpeed;
    goalkeeper.style.left = goalkeeperX + 'px';

    // Apply Ball Position
    ball.style.bottom = state.ballY + 'px';
    ball.style.left = currentBallX + 'px';

    // Check if ball reached the goal line
    if (state.ballY >= 350) {
        checkGoal(currentBallX);
    }
}

function checkGoal(finalBallX) {
    state.isBallMoving = false; // Stop ball

    // Goal logic:
    // The goal is centered on the screen.
    // Screen Width: 600. Goal Width: 300.
    // Goal Starts at X: 150. Ends at X: 450.
    // Goalkeeper is relative to the GOAL DIV (which is at 150).
    // BUT our ball X is relative to the GAME CONTAINER (0-600).
    // We need to convert Goalkeeper X to Game Container X.
    // Keeper absolute X = 150 (Goal Left) + goalkeeperX (Relative Left).

    const absoluteKeeperLeft = 150 + goalkeeperX;
    const absoluteKeeperRight = absoluteKeeperLeft + 50; // Keeper width

    const ballLeft = finalBallX;
    const ballRight = finalBallX + 30; // Ball width

    // Collision Check (AABB)
    const hitKeeper = (ballRight > absoluteKeeperLeft && ballLeft < absoluteKeeperRight);

    // Check if missed the goal entirely (left or right)
    // Goal absolute range: 150 to 450
    const missedGoal = (ballRight < 150 || ballLeft > 450);

    if (hitKeeper) {
        messageDisplay.innerText = "SAVED BY THE KEEPER!";
        messageDisplay.style.color = "orange";
        state.misses++;
    } else if (missedGoal) {
        messageDisplay.innerText = "MISSED!";
        messageDisplay.style.color = "red";
        state.misses++;
    } else {
        messageDisplay.innerText = "GOAAALLL!!!";
        messageDisplay.style.color = "#4CAF50"; // Green
        state.goals++;

        // TRIGGER CELEBRATION!
        document.getElementById('goal-area').classList.add('celebrating');
    }

    // Update UI
    goalsDisplay.innerText = state.goals;
    missesDisplay.innerText = state.misses;

    // Reset after 2 seconds
    setTimeout(resetTurn, 2000);
}

function resetTurn() {
    // STOP CELEBRATION
    document.getElementById('goal-area').classList.remove('celebrating');

    state.ballY = 100;
    state.ballX = 285;
    state.isAiming = true;

    ball.style.bottom = '100px';
    ball.style.left = '285px';
    ball.style.transform = 'none';

    messageDisplay.innerText = "PRESS SPACE TO SHOOT";
    messageDisplay.style.color = "white";

    // Reset Keeper to center
    goalkeeperX = 125;
    goalkeeper.style.left = '125px';
}

// Start
gameLoop();

