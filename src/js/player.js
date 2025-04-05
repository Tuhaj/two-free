import { GRAVITY, JUMP_FORCE, MOVEMENT_SPEED, TILE_SIZE } from './constants.js';
import { isColliding, getTileAtPosition } from './world.js';
import { createDigEffect } from './renderer.js';
import { createCollectEffect, createEnemyHitEffect } from './effects.js';
import { updateEnergyDisplay, updateDiamondDisplay } from './ui.js';
import { playSound } from './audio.js';

// Create the player object with default state
export const createPlayer = () => ({
    x: 0,
    y: 0,
    width: TILE_SIZE,
    height: TILE_SIZE * 1.5,
    velocityX: 0,
    velocityY: 0,
    energy: 30,
    isJumping: false,
    isDigging: false,
    facingRight: true,
    isDead: false,
    deathTime: 0,
    deathAnimationComplete: false
});

// Initialize player at a specific position
export const initPlayer = (player, x, y) => {
    player.x = x;
    player.y = y;
    player.velocityX = 0;
    player.velocityY = 0;
    return player;
};

// Update player state based on input and physics
export function updatePlayer(player, world, worldWidth, worldHeight, keys, touchControls, treasures, gamePaused, totalDiamonds = 0, enemies = []) {
    if (gamePaused) return { allCollected: false, totalDiamonds };
    
    // Handle horizontal movement - make sure only one direction is active at a time
    let movingLeft = keys['ArrowLeft'] || keys['a'] || touchControls.left;
    let movingRight = keys['ArrowRight'] || keys['d'] || touchControls.right;
    
    // If both left and right are pressed, prioritize the last pressed direction
    if (movingLeft && movingRight) {
        // For touch controls, prefer the most recently activated one
        if (touchControls.left && touchControls.right) {
            const lastLeftTouch = touchControls.lastLeftTouch || 0;
            const lastRightTouch = touchControls.lastRightTouch || 0;
            
            if (lastLeftTouch > lastRightTouch) {
                movingRight = false;
            } else {
                movingLeft = false;
            }
        } 
        // For keyboard, use most recent key press
        else {
            const lastLeftPress = keys.lastLeftPress || 0;
            const lastRightPress = keys.lastRightPress || 0;
            
            if (lastLeftPress > lastRightPress) {
                movingRight = false;
            } else {
                movingLeft = false;
            }
        }
    }
    
    // Apply movement
    if (movingLeft) {
        player.velocityX = -MOVEMENT_SPEED * (1 + player.energy / 50);
        player.facingRight = false;
        if (keys['ArrowLeft'] || keys['a']) {
            keys.lastLeftPress = Date.now();
        }
    } else if (movingRight) {
        player.velocityX = MOVEMENT_SPEED * (1 + player.energy / 50);
        player.facingRight = true;
        if (keys['ArrowRight'] || keys['d']) {
            keys.lastRightPress = Date.now();
        }
    } else {
        player.velocityX = 0;
    }
    
    // Handle jumping
    if ((keys['ArrowUp'] || keys['w'] || keys[' '] || touchControls.jump) && !player.isJumping) {
        player.velocityY = JUMP_FORCE;
        player.isJumping = true;
        
        // Play jump sound
        playSound('jump');
    }
    
    // Handle digging
    player.isDigging = keys['ArrowDown'] || keys['s'] || touchControls.dig;
    if (player.isDigging && player.energy > 0) {
        dig(player, world, worldWidth, worldHeight, enemies);
    }
    
    // Apply gravity
    player.velocityY += GRAVITY;
    
    // Update position - move X and Y separately to allow sliding along walls
    player.x += player.velocityX;
    
    // Boundary checks for X
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > worldWidth * TILE_SIZE) player.x = worldWidth * TILE_SIZE - player.width;
    
    // Check horizontal collisions
    handleHorizontalCollisions(player, world, worldWidth, worldHeight);
    
    // Now move Y
    player.y += player.velocityY;
    
    // Check vertical collisions
    handleVerticalCollisions(player, world, worldWidth, worldHeight);
    
    // Collect treasures
    const collectionResult = collectTreasures(player, treasures, totalDiamonds);
    
    return collectionResult;
}

// Handle horizontal collisions separately
function handleHorizontalCollisions(player, world, worldWidth, worldHeight) {
    // Store original position to check if we've moved
    const originalX = player.x;
    
    // Get player's tile position
    const tileX = Math.floor(player.x / TILE_SIZE);
    const tileY = Math.floor(player.y / TILE_SIZE);
    
    // Flag to track if we've found a collision
    let collisionDetected = false;
    
    // Check tiles around player
    for (let y = tileY; y <= tileY + 1; y++) {
        for (let x = tileX - 1; x <= tileX + 2; x++) {
            // Skip if outside world bounds
            if (x < 0 || x >= worldWidth || y < 0 || y >= worldHeight) continue;
            
            // Skip empty tiles
            if (world[y][x] === 0) continue;
            
            // Calculate tile boundaries
            const tileLeft = x * TILE_SIZE;
            const tileRight = tileLeft + TILE_SIZE;
            const tileTop = y * TILE_SIZE;
            const tileBottom = tileTop + TILE_SIZE;
            
            // Check collision
            if (
                player.x + player.width > tileLeft &&
                player.x < tileRight &&
                player.y + player.height > tileTop &&
                player.y < tileBottom
            ) {
                collisionDetected = true;
                
                // Horizontal collision resolution based on movement direction and overlap
                const overlapRight = player.x + player.width - tileLeft;
                const overlapLeft = tileRight - player.x;
                
                // Only apply collision resolution based on player's current movement direction
                if (player.velocityX > 0 && overlapRight < overlapLeft) {
                    player.x = tileLeft - player.width;
                } else if (player.velocityX < 0 && overlapLeft < overlapRight) {
                    player.x = tileRight;
                }
                
                player.velocityX = 0;
                break;
            }
        }
        if (collisionDetected) break;
    }
    
    // If we detected a collision but ended up moving the player backward, restore position
    if (
        (player.velocityX > 0 && player.x < originalX) || 
        (player.velocityX < 0 && player.x > originalX)
    ) {
        player.x = originalX;
        player.velocityX = 0;
    }
}

// Handle vertical collisions separately
function handleVerticalCollisions(player, world, worldWidth, worldHeight) {
    // Store original position to check if we've moved
    const originalY = player.y;
    
    // Get player's tile position
    const tileX = Math.floor(player.x / TILE_SIZE);
    const tileY = Math.floor(player.y / TILE_SIZE);
    
    // Flag to track if we've found a collision
    let collisionDetected = false;
    
    // Check tiles around player
    for (let y = tileY - 1; y <= tileY + 2; y++) {
        for (let x = tileX; x <= tileX + 1; x++) {
            // Skip if outside world bounds
            if (x < 0 || x >= worldWidth || y < 0 || y >= worldHeight) continue;
            
            // Skip empty tiles
            if (world[y][x] === 0) continue;
            
            // Calculate tile boundaries
            const tileLeft = x * TILE_SIZE;
            const tileRight = tileLeft + TILE_SIZE;
            const tileTop = y * TILE_SIZE;
            const tileBottom = tileTop + TILE_SIZE;
            
            // Check collision
            if (
                player.x + player.width > tileLeft &&
                player.x < tileRight &&
                player.y + player.height > tileTop &&
                player.y < tileBottom
            ) {
                collisionDetected = true;
                
                // Vertical collision resolution based on movement direction and overlap
                const overlapBottom = player.y + player.height - tileTop;
                const overlapTop = tileBottom - player.y;
                
                // Only apply collision resolution based on player's current movement direction
                if (player.velocityY > 0 && overlapBottom < overlapTop) {
                    player.y = tileTop - player.height;
                    player.velocityY = 0;
                    player.isJumping = false;
                } else if (player.velocityY < 0 && overlapTop < overlapBottom) {
                    player.y = tileBottom;
                    player.velocityY = 0;
                }
                
                break;
            }
        }
        if (collisionDetected) break;
    }
    
    // If we detected a collision but ended up moving the player incorrectly, restore position
    if (
        (player.velocityY > 0 && player.y < originalY) || 
        (player.velocityY < 0 && player.y > originalY)
    ) {
        player.y = originalY;
        player.velocityY = 0;
    }
}

// Collect treasures
function collectTreasures(player, treasures, totalDiamonds = 0) {
    let allCollected = true;
    
    for (let i = 0; i < treasures.length; i++) {
        const treasure = treasures[i];
        if (!treasure.collected) {
            allCollected = false;
            
            // Check collision with player
            if (
                player.x + player.width > treasure.x &&
                player.x < treasure.x + TILE_SIZE &&
                player.y + player.height > treasure.y &&
                player.y < treasure.y + TILE_SIZE
            ) {
                // Collect treasure
                treasure.collected = true;
                
                // Increase energy and diamonds (reduced energy gain)
                player.energy += treasure.value * 0.7; // Only get 70% of the treasure value as energy
                totalDiamonds += treasure.value;
                
                // Update displays
                updateEnergyDisplay(player.energy);
                updateDiamondDisplay(totalDiamonds);
                
                // Create collection effect
                createCollectEffect(treasure.x + TILE_SIZE/2, treasure.y + TILE_SIZE/2, treasure.value);
                
                // Play collect sound with pitch based on value
                const pitch = 0.8 + (treasure.value / 25) * 0.4; // Higher pitch for more valuable treasures
                playSound('collectTreasure', 0.7, pitch);
            }
        }
    }
    
    return { allCollected: allCollected && treasures.length > 0, totalDiamonds };
}

// Dig through terrain
export function dig(player, world, worldWidth, worldHeight, enemies = []) {
    if (player.isDigging && player.energy > 0) {
        // Calculate dig position based on player facing direction
        const digX = Math.floor((player.x + (player.facingRight ? player.width : 0)) / TILE_SIZE);
        const digY = Math.floor((player.y + player.height) / TILE_SIZE);
        
        // First check if there's a treasure at dig location
        let treasureFound = false;
        
        // Check if valid dig location
        if (
            digX >= 0 && digX < worldWidth &&
            digY >= 0 && digY < worldHeight &&
            world[digY][digX] === 1 // Only dig through dirt
        ) {
            // Remove the block
            world[digY][digX] = 0;
            
            // Create digging effect at the center of the tile
            createDigEffect(digX * TILE_SIZE + TILE_SIZE/2, digY * TILE_SIZE + TILE_SIZE/2);
            
            // Play digging sound with slight pitch variation
            playSound('dig', 0.6, 0.9 + Math.random() * 0.2);
            
            // Decrease energy only if no treasure was found
            if (!treasureFound) {
                player.energy -= 0.3;
            }
            
            // Check if digging attack hits any enemies
            attackEnemiesWithDigging(player, enemies, digX, digY);
        }
    }
}

// Attack enemies with digging
function attackEnemiesWithDigging(player, enemies, digX, digY) {
    // Only attack if we have enemies array
    if (!enemies || !enemies.length) return;
    
    // Calculate digging attack area
    const attackX = digX * TILE_SIZE;
    const attackY = digY * TILE_SIZE;
    const attackRange = TILE_SIZE * 1.5; // Slightly larger than a tile
    
    // Check each enemy
    for (const enemy of enemies) {
        // Calculate enemy center position
        const enemyCenterX = enemy.x + enemy.width / 2;
        const enemyCenterY = enemy.y + enemy.height / 2;
        
        // Calculate distance to attack point
        const dx = enemyCenterX - (attackX + TILE_SIZE / 2);
        const dy = enemyCenterY - (attackY + TILE_SIZE / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If enemy is close enough to the digging point, damage it
        if (distance < attackRange) {
            // Deal damage per dig hit (adjusted for new enemy health of 40)
            enemy.health -= 13; // Was 10 for 30 health, now 13 for 40 health - still requires about 3 hits
            
            // Add knockback effect
            const knockDirection = dx < 0 ? -1 : 1;
            enemy.velocityX = knockDirection * 5;
            
            // Create hit effect
            createEnemyHitEffect(enemyCenterX, enemyCenterY);
            
            // Play sound effect
            playSound('enemyHit');
        }
    }
}

// Check if player is hidden (safe from missile)
export function isPlayerHidden(player, world) {
    // Player is considered hidden if there's dirt above them
    const playerTileX = Math.floor(player.x / TILE_SIZE);
    const playerTileY = Math.floor(player.y / TILE_SIZE);
    
    // Check if there's dirt above the player
    for (let y = 0; y < playerTileY; y++) {
        if (
            world[y] && 
            world[y][playerTileX] === 1 && 
            world[y][playerTileX + 1] === 1
        ) {
            return true;
        }
    }
    
    return false;
} 