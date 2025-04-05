import { TILE_SIZE } from './constants.js';
import { playSound } from './audio.js';
import { registerEnemyKill } from './achievements.js';
import { createEnemyHitEffect } from './effects.js';

// Enemy robot properties
const ENEMY_SPEED = 1.5;
const ENEMY_DAMAGE = 15;
const ENEMY_SIZE = TILE_SIZE;
const ENEMY_ATTACK_COOLDOWN = 1000; // 1 second between attacks
const ENEMY_SPAWN_RATE = 12000; // Reduced from 15000 to spawn enemies more frequently

// Array to track all active enemies
let enemies = [];
let lastEnemySpawn = 0;

// Create an enemy robot
export function createEnemy(x, y) {
    return {
        x: x,
        y: y,
        width: ENEMY_SIZE,
        height: ENEMY_SIZE * 1.2,
        velocityX: 0,
        velocityY: 0,
        speed: ENEMY_SPEED,
        damage: ENEMY_DAMAGE,
        health: 40,
        lastAttackTime: 0,
        isPatrolling: true,
        patrolDirection: Math.random() > 0.5 ? 1 : -1, // Random initial direction
        facingRight: Math.random() > 0.5, // Random initial facing
        seesPlayer: false,
        attackRange: TILE_SIZE * 3 // How close the enemy needs to be to attack
    };
}

// Spawn enemies based on level difficulty
export function spawnEnemies(world, worldWidth, worldHeight, currentLevel) {
    const now = Date.now();
    
    // Increase spawn rate based on level
    const adjustedSpawnRate = Math.max(ENEMY_SPAWN_RATE - (currentLevel * 1000), 5000);
    
    // Only spawn new enemies if enough time has passed
    if (now - lastEnemySpawn < adjustedSpawnRate) {
        return enemies;
    }
    
    // Number of enemies scales with level
    const maxEnemies = Math.min(2 + Math.floor(currentLevel / 2), 8);
    
    if (enemies.length < maxEnemies) {
        // Find a valid spawn location on the surface
        let spawnX = Math.floor(Math.random() * (worldWidth - 4)) + 2; // Avoid edges
        let spawnY = 0;
        
        // Find the ground level at this x position
        while (spawnY < worldHeight - 1 && (world[spawnY][spawnX] === 0)) {
            spawnY++;
        }
        
        // Only spawn on the surface, not inside dirt
        if (spawnY > 0 && world[spawnY - 1][spawnX] === 0) {
            const enemy = createEnemy(spawnX * TILE_SIZE, (spawnY - 1) * TILE_SIZE - ENEMY_SIZE * 0.2);
            enemies.push(enemy);
            lastEnemySpawn = now;
        }
    }
    
    return enemies;
}

// Update all enemies
export function updateEnemies(enemies, player, world, worldWidth, worldHeight, isPlayerHidden) {
    // Update each enemy
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        // Check if enemy is dead
        if (enemy.health <= 0) {
            // Create death effect
            const enemyCenterX = enemy.x + enemy.width / 2;
            const enemyCenterY = enemy.y + enemy.height / 2;
            createEnemyHitEffect(enemyCenterX, enemyCenterY);
            
            // Play explosion sound
            playSound('enemyHit', 0.8, 0.6 + Math.random() * 0.4);
            
            // Register kill for achievements
            registerEnemyKill();
            
            // Remove enemy
            enemies.splice(i, 1);
            continue;
        }
        
        // Calculate player distance
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        const enemyCenterX = enemy.x + enemy.width / 2;
        const enemyCenterY = enemy.y + enemy.height / 2;
        
        const dx = playerCenterX - enemyCenterX;
        const dy = playerCenterY - enemyCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Detection range is larger than attack range
        const detectionRange = TILE_SIZE * 6;
        
        // Enemy behavior
        if (!isPlayerHidden && distance < detectionRange) {
            // Enemy sees player
            enemy.seesPlayer = true;
            enemy.isPatrolling = false;
            
            // Face the player
            enemy.facingRight = dx > 0;
            
            // Move towards player horizontally
            if (Math.abs(dx) > TILE_SIZE / 2) { // Small buffer to prevent jittering
                enemy.velocityX = (dx > 0 ? 1 : -1) * enemy.speed;
            } else {
                enemy.velocityX = 0;
            }
            
            // Attack if in range and cooldown complete
            if (distance < enemy.attackRange && Date.now() - enemy.lastAttackTime > ENEMY_ATTACK_COOLDOWN) {
                // Attack logic - player will lose energy when checkCollisions is called
                enemy.lastAttackTime = Date.now();
                // Could add attack animation or effect here
            }
        } else {
            // Lose track of player if hidden
            enemy.seesPlayer = false;
            
            // Return to patrol behavior
            enemy.isPatrolling = true;
            
            // Patrol back and forth
            enemy.velocityX = enemy.patrolDirection * enemy.speed * 0.7; // Slower patrol
            enemy.facingRight = enemy.patrolDirection > 0;
            
            // Reverse direction if at edge or obstacle
            const nextTileX = Math.floor((enemy.x + (enemy.patrolDirection > 0 ? enemy.width + 5 : -5)) / TILE_SIZE);
            const tileY = Math.floor((enemy.y + enemy.height - 5) / TILE_SIZE);
            
            // Check if next position would be an edge or a wall
            if (nextTileX < 0 || nextTileX >= worldWidth || 
                tileY + 1 >= worldHeight || 
                world[tileY + 1][nextTileX] === 0 || // Would walk off edge
                (world[tileY][nextTileX] !== 0 && nextTileX !== Math.floor((enemy.x + enemy.width / 2) / TILE_SIZE))) { // Would hit wall
                
                enemy.patrolDirection *= -1;
                enemy.facingRight = enemy.patrolDirection > 0;
            }
        }
        
        // Apply movement
        enemy.x += enemy.velocityX;
        
        // Simple collision detection with world
        const enemyTileX = Math.floor(enemy.x / TILE_SIZE);
        const enemyTileY = Math.floor((enemy.y + enemy.height) / TILE_SIZE);
        
        // Ensure enemy stays on solid ground
        if (enemyTileY < worldHeight - 1 && enemyTileX >= 0 && enemyTileX < worldWidth) {
            // If there's no ground under enemy, place it on ground
            if (world[enemyTileY][enemyTileX] === 0) {
                // Find the ground
                let groundY = enemyTileY;
                while (groundY < worldHeight - 1 && world[groundY][enemyTileX] === 0) {
                    groundY++;
                }
                // Place on ground
                if (groundY < worldHeight) {
                    enemy.y = groundY * TILE_SIZE - enemy.height;
                }
            }
        }
        
        // Apply boundaries
        if (enemy.x < 0) {
            enemy.x = 0;
            enemy.patrolDirection *= -1;
        }
        if (enemy.x + enemy.width > worldWidth * TILE_SIZE) {
            enemy.x = worldWidth * TILE_SIZE - enemy.width;
            enemy.patrolDirection *= -1;
        }
    }
    
    return enemies;
}

// Check for collisions between player and enemies
export function checkCollisions(player, enemies) {
    for (const enemy of enemies) {
        // Simple rectangle collision
        if (
            player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y
        ) {
            // Only deal damage if not already attacking recently
            if (Date.now() - enemy.lastAttackTime > ENEMY_ATTACK_COOLDOWN) {
                player.energy -= enemy.damage;
                enemy.lastAttackTime = Date.now();
                
                // Apply knock-back to player
                const knockDirection = player.x < enemy.x ? -1 : 1;
                player.velocityX = knockDirection * 10;
                player.velocityY = -5;
                
                // Play hit sound
                playSound('playerHit');
            }
        }
    }
}

// Reset enemies when starting a new level
export function resetEnemies() {
    enemies = [];
    lastEnemySpawn = 0;
    return enemies;
}

// Get the current enemies array
export function getEnemies() {
    return enemies;
}

// Set enemies array (useful for loading saved games)
export function setEnemies(newEnemies) {
    enemies = newEnemies;
    return enemies;
} 