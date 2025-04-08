import { TILE_SIZE, FRAME_TIME, DOM_IDS } from './constants.js';
import { createPlayer, updatePlayer, isPlayerHidden } from './player.js';
import { generateWorld } from './world.js';
import { initUI, updateEnergyDisplay, updateLevelDisplay, updateDiamondDisplay, 
         showLevelComplete, hideLevelComplete, updateCountdown, updatePauseButtonAppearance, 
         handleResize, showEntryScreen, setupEntryScreen, showGameOver } from './ui.js';
import { initRenderer, draw, drawPauseOverlay } from './renderer.js';
import { setupControls, keys, touchControls } from './controls.js';
import { checkAchievements, resetAchievements } from './achievements.js';
import { initMissileSystem, updateMissiles } from './missiles.js';
import { createInitialWarBackground } from './effects.js';
import { spawnEnemies, updateEnemies, checkCollisions, resetEnemies, getEnemies } from './enemies.js';
import audioManager, { playSound, toggleMute, setupAudio } from './audio.js';

// Game state
let canvas;
let ctx;
let player;
let world = [];
let worldWidth;
let worldHeight;
let treasures = [];
let currentLevel = 1;
let totalDiamonds = 0;
let levelComplete = false;
let levelTransitionTimer = 0;
let gamePaused = false;
let lastTimestamp = 0;
let warBackgroundElements;
let enemies = [];
let gameStarted = false;

// Initialize game
function init() {
    // Get canvas and context
    canvas = document.getElementById(DOM_IDS.CANVAS);
    ctx = canvas.getContext('2d');
    
    // Initialize UI
    initUI();
    
    // Initialize renderer
    initRenderer(ctx, canvas);
    
    // Set up the entry screen
    setupEntryScreen(startGame);
    
    // Show the entry screen
    showEntryScreen();
    
    // Handle window resize
    window.addEventListener('resize', () => handleResize(canvas));
    handleResize(canvas);
}

// Start the game after the entry screen
function startGame() {
    // Reset game state
    currentLevel = 1;
    totalDiamonds = 0;
    gamePaused = false;
    gameStarted = true;
    
    // Reset achievements
    resetAchievements();
    
    // Compute world dimensions
    worldWidth = Math.ceil(canvas.width / TILE_SIZE);
    worldHeight = Math.ceil(canvas.height / TILE_SIZE);
    
    // Generate world
    const result = generateWorld(worldWidth, worldHeight, currentLevel);
    world = result.world;
    treasures = result.treasures;
    
    // Create player
    player = createPlayer();
    player.x = canvas.width / 2;
    player.y = 300;
    
    // Initialize missile system
    warBackgroundElements = initMissileSystem();
    
    // Create initial background war elements
    createInitialWarBackground(canvas, warBackgroundElements);
    
    // Reset enemies
    enemies = resetEnemies();
    
    // Set up controls
    setupControls(togglePause);
    
    // Make gamePaused globally available for animation pausing
    window.gamePaused = gamePaused;
    
    // Update displays
    updateEnergyDisplay(player.energy);
    updateLevelDisplay(currentLevel);
    updateDiamondDisplay(totalDiamonds);
    updatePauseButtonAppearance(gamePaused);
    
    // Show the pause button
    const pauseBtn = document.getElementById(DOM_IDS.PAUSE_BTN);
    if (pauseBtn) {
        pauseBtn.style.display = 'flex';
    }
    
    // Start game loop
    lastTimestamp = 0;
    requestAnimationFrame(gameLoop);
}

// Make startGame globally available for restarting the game
window.startGame = startGame;

// Toggle pause state
function togglePause() {
    // Only allow pausing if the game has started
    if (gameStarted) {
        gamePaused = !gamePaused;
        window.gamePaused = gamePaused;
        updatePauseButtonAppearance(gamePaused);
    }
}

// Make togglePause globally available
window.togglePause = togglePause;

// Complete the current level with success
function completeLevelWithSuccess() {
    console.log("Level complete!");
    levelComplete = true;
    
    // Calculate bonus based on energy and level
    const levelBonus = Math.floor(player.energy * currentLevel);
    totalDiamonds += levelBonus;
    
    // Update UI
    showLevelComplete(levelBonus, totalDiamonds);
    updateDiamondDisplay(totalDiamonds);
    
    // Check for achievements
    checkAchievements(totalDiamonds, currentLevel, player.energy);
    
    // Start countdown to next level
    levelTransitionTimer = 3;
    updateCountdown(levelTransitionTimer);
    startLevelCountdown();
}

// Update the countdown timer
function startLevelCountdown() {
    if (levelTransitionTimer > 0) {
        setTimeout(() => {
            // Only decrease the timer if the game is not paused
            if (!gamePaused) {
                levelTransitionTimer--;
                updateCountdown(levelTransitionTimer);
                
                if (levelTransitionTimer > 0) {
                    startLevelCountdown();
                } else {
                    startNextLevel();
                }
            } else {
                // If game is paused, check again later
                startLevelCountdown();
            }
        }, 1000);
    } else {
        startNextLevel();
    }
}

// Start the next level
function startNextLevel() {
    currentLevel++;
    updateLevelDisplay(currentLevel);
    
    // Check for level-based achievements
    checkAchievements(totalDiamonds, currentLevel, player.energy);
    
    // Reset player position but keep energy and score
    player.x = canvas.width / 2;
    player.y = 300;
    player.velocityX = 0;
    player.velocityY = 0;
    
    // Generate new world
    const result = generateWorld(worldWidth, worldHeight, currentLevel);
    world = result.world;
    treasures = result.treasures;
    
    // Reset level state
    levelComplete = false;
    
    // Reset enemies for new level
    enemies = resetEnemies();
    
    // Hide level complete overlay
    hideLevelComplete();
}

// Game loop
function gameLoop(timestamp) {
    // Calculate time elapsed
    if (!lastTimestamp) lastTimestamp = timestamp;
    const elapsed = timestamp - lastTimestamp;
    
    // Only update at our target frame rate
    if (elapsed > FRAME_TIME) {
        // Skip physics updates if game is paused, but still draw
        if (!gamePaused && gameStarted) {
            // Update missiles and war background elements
            warBackgroundElements = updateMissiles(
                warBackgroundElements, 
                world, 
                worldWidth, 
                worldHeight, 
                canvas, 
                player, 
                gamePaused
            );
            
            // Check if player is hidden
            player.isHidden = isPlayerHidden(player, world);
            
            // Spawn and update enemies
            if (!levelComplete && !player.isDead) {
                // Spawn new enemies based on level
                enemies = spawnEnemies(world, worldWidth, worldHeight, currentLevel);
                
                // Update existing enemies
                enemies = updateEnemies(enemies, player, world, worldWidth, worldHeight, player.isHidden);
                
                // Check for enemy-player collisions
                checkCollisions(player, enemies);
                
                // Check if player is dead
                if (player.energy <= 0 && !player.isDead) {
                    // Trigger death sequence
                    player.isDead = true;
                    player.deathTime = Date.now();
                    player.energy = 0; // Prevent negative energy
                    updateEnergyDisplay(player.energy);
                }
            }
            
            // Handle player death animation completion
            if (player.isDead && player.deathAnimationComplete && !player.gameOverTriggered) {
                // Show game over screen
                showGameOver(totalDiamonds, currentLevel);
                
                // Play game over sound with reduced volume
                playSound('gameOver', 0.3);
                
                // Set flag to prevent multiple triggers
                player.gameOverTriggered = true;
                player.deathAnimationComplete = false;
                // We don't pause the game because we want background animations to continue
            }
            
            // Only update player if level is not complete, not hit by missile, and not dead
            if (!levelComplete && !player.isDead && !(warBackgroundElements.playerHit && Date.now() - warBackgroundElements.hitTime < 500)) {
                // Update player state
                const updateResult = updatePlayer(
                    player, 
                    world, 
                    worldWidth, 
                    worldHeight, 
                    keys, 
                    touchControls, 
                    treasures, 
                    gamePaused, 
                    totalDiamonds,
                    enemies
                );
                
                // Update total diamonds if changed
                if (updateResult.totalDiamonds !== totalDiamonds) {
                    totalDiamonds = updateResult.totalDiamonds;
                    updateDiamondDisplay(totalDiamonds);
                    
                    // Check for achievement updates
                    checkAchievements(totalDiamonds, currentLevel, player.energy);
                }
                
                // Check if all treasures were collected
                if (updateResult.allCollected && !levelComplete) {
                    console.log("Level complete detected in game loop!");
                    completeLevelWithSuccess();
                }
                
                // Update energy display after player update
                updateEnergyDisplay(player.energy);
            }
        }
        
        // Draw everything if game has started
        if (gameStarted) {
            draw(
                world, 
                worldWidth, 
                worldHeight, 
                player, 
                treasures, 
                warBackgroundElements, 
                levelComplete, 
                warBackgroundElements.playerHit, 
                warBackgroundElements.hitTime, 
                warBackgroundElements.incomingMissile, 
                warBackgroundElements.missileWarning,
                gamePaused,
                enemies
            );
            
            // Draw pause overlay if paused
            if (gamePaused) {
                drawPauseOverlay();
            }
        }
        
        // Reset timestamp
        lastTimestamp = timestamp;
    }
    
    // Request next frame
    requestAnimationFrame(gameLoop);
}

// Start the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Export game state for debugging
window.gameState = {
    player,
    world,
    treasures,
    currentLevel,
    totalDiamonds,
    warBackgroundElements
};

// Initialize everything
window.onload = function() {
    // Init canvas and context
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Init renderer with canvas context
    initRenderer(ctx, canvas);
    
    // Setup audio system
    setupAudio();
    setupSoundButton();
    
    // Initialize game
    init();
    
    // Handle window resize
    window.addEventListener('resize', () => handleResize(canvas));
    handleResize(canvas);
};

// Set up sound toggle button
function setupSoundButton() {
    const soundBtn = document.getElementById('soundBtn');
    
    soundBtn.addEventListener('click', function() {
        const isMuted = toggleMute();
        soundBtn.innerHTML = isMuted ? '🔇' : '🔊';
    });
} 