import { TILE_SIZE, FRAME_TIME, DOM_IDS } from './constants.js';
import { createPlayer, updatePlayer, isPlayerHidden } from './player.js';
import { generateWorld } from './world.js';
import { initUI, updateEnergyDisplay, updateLevelDisplay, updateDiamondDisplay, 
         showLevelComplete, hideLevelComplete, updateCountdown, updatePauseButtonAppearance, 
         handleResize } from './ui.js';
import { initRenderer, draw, drawPauseOverlay } from './renderer.js';
import { setupControls, keys, touchControls } from './controls.js';
import { checkAchievements, resetAchievements } from './achievements.js';
import { initMissileSystem, updateMissiles } from './missiles.js';
import { createInitialWarBackground } from './effects.js';

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

// Initialize game
function init() {
    // Reset game state
    currentLevel = 1;
    totalDiamonds = 0;
    gamePaused = false;
    
    // Get canvas and context
    canvas = document.getElementById(DOM_IDS.CANVAS);
    ctx = canvas.getContext('2d');
    
    // Initialize UI
    initUI();
    
    // Reset achievements
    resetAchievements();
    
    // Initialize renderer
    initRenderer(ctx, canvas);
    
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
    
    // Set up controls
    setupControls(togglePause);
    
    // Handle window resize
    window.addEventListener('resize', () => handleResize(canvas));
    handleResize(canvas);
    
    // Make gamePaused globally available for animation pausing
    window.gamePaused = gamePaused;
    
    // Update displays
    updateEnergyDisplay(player.energy);
    updateLevelDisplay(currentLevel);
    updateDiamondDisplay(totalDiamonds);
    updatePauseButtonAppearance(gamePaused);
    
    // Start game loop
    requestAnimationFrame(gameLoop);
}

// Toggle pause state
function togglePause() {
    gamePaused = !gamePaused;
    window.gamePaused = gamePaused;
    updatePauseButtonAppearance(gamePaused);
}

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
        if (!gamePaused) {
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
            
            // Only update player if level is not complete and not hit by missile
            if (!levelComplete && !(warBackgroundElements.playerHit && Date.now() - warBackgroundElements.hitTime < 500)) {
                // Update player state
                const updateResult = updatePlayer(player, world, worldWidth, worldHeight, keys, touchControls, treasures, gamePaused, totalDiamonds);
                
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
        
        // Draw everything
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
            gamePaused
        );
        
        // Draw pause overlay if paused
        if (gamePaused) {
            drawPauseOverlay();
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