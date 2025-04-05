import { createBackgroundExplosion, createDistantMissile } from './effects.js';
import { createMissileImpact } from './world.js';
import { isPlayerHidden } from './player.js';
import { MISSILE_ATTACK_INTERVAL_MIN, MISSILE_ATTACK_INTERVAL_MAX, WARNING_DURATION } from './constants.js';

// Initialize war background elements
export function initMissileSystem() {
    return {
        explosions: [],
        missiles: [],
        smokeClouds: [],
        nextMissileAttack: Date.now() + getRandomInterval(),
        missileWarning: false,
        missileWarningStarted: 0,
        incomingMissile: null,
        playerHit: false,
        hitTime: 0
    };
}

// Get random interval for missile attacks
function getRandomInterval() {
    return MISSILE_ATTACK_INTERVAL_MIN + Math.random() * (MISSILE_ATTACK_INTERVAL_MAX - MISSILE_ATTACK_INTERVAL_MIN);
}

// Create an incoming missile attack targeted at player
export function createIncomingMissile(player, canvas, world, worldHeight, missileSystem) {
    // Only create if there isn't already an incoming missile
    if (!missileSystem.incomingMissile) {
        // Target a bit ahead of player's position
        const playerDirection = player.velocityX > 0 ? 1 : (player.velocityX < 0 ? -1 : 0);
        const targetX = player.x + player.width / 2 + (playerDirection * player.width * 2);
        
        const missile = {
            x: targetX + (Math.random() - 0.5) * 300, // Start a bit randomly to sides
            y: -50,
            targetX: targetX,
            targetY: 0, // Will be set to ground level at impact point
            speed: 5,
            size: 6,
            trail: [],
            isBackground: false,
            exploded: false,
            warningFrame: 0
        };
        
        // Find the ground level at the target X position
        for (let y = 0; y < worldHeight; y++) {
            const tileX = Math.floor(missile.targetX / 32); // Using TILE_SIZE constant would be better
            if (
                tileX >= 0 && 
                tileX < world[0].length && 
                world[y] && 
                world[y][tileX] && 
                world[y][tileX] !== 0
            ) {
                missile.targetY = y * 32; // Using TILE_SIZE constant would be better
                break;
            }
        }
        
        // Calculate the angle
        const dx = missile.targetX - missile.x;
        const dy = missile.targetY - missile.y;
        missile.angle = Math.atan2(dy, dx);
        
        // Set the missile
        missileSystem.incomingMissile = missile;
        
        // Start the warning
        missileSystem.missileWarning = true;
        missileSystem.missileWarningStarted = Date.now();
    }
    
    return missileSystem;
}

// Update missile positions and effects
export function updateMissiles(missileSystem, world, worldWidth, worldHeight, canvas, player, gamePaused) {
    if (gamePaused) return missileSystem;
    
    const currentTime = Date.now();
    
    // Create random background missiles
    if (Math.random() < 0.01 && missileSystem.missiles.length < 5) {
        createDistantMissile(canvas, missileSystem);
    }
    
    // Check if it's time for a missile attack
    if (currentTime >= missileSystem.nextMissileAttack && !missileSystem.missileWarning && !missileSystem.incomingMissile) {
        createIncomingMissile(player, canvas, world, worldHeight, missileSystem);
    }
    
    // Update background missiles
    missileSystem.missiles = missileSystem.missiles.filter(missile => {
        if (missile.exploded) return false;
        
        // Move missile
        const vx = Math.cos(missile.angle) * missile.speed;
        const vy = Math.sin(missile.angle) * missile.speed;
        missile.x += vx;
        missile.y += vy;
        
        // Add to trail
        missile.trail.push({x: missile.x, y: missile.y, age: 0});
        
        // Check if missile has reached its target
        const dx = missile.targetX - missile.x;
        const dy = missile.targetY - missile.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If target reached, explode
        if (distance < 5) {
            missile.exploded = true;
            
            // If it's a background missile, just make a small explosion
            if (missile.isBackground) {
                createBackgroundExplosion(missile.targetX, missile.targetY, 30 + Math.random() * 20, missileSystem);
            }
            return false;
        }
        
        // Remove if offscreen
        if (missile.x < -50 || missile.x > canvas.width + 50 || missile.y > canvas.height + 50) {
            return false;
        }
        
        return true;
    });
    
    // Update incoming missile
    if (missileSystem.incomingMissile) {
        // If warning phase is complete, move the missile
        if (currentTime - missileSystem.missileWarningStarted >= WARNING_DURATION) {
            missileSystem.missileWarning = false;
            
            // Move missile
            const vx = Math.cos(missileSystem.incomingMissile.angle) * missileSystem.incomingMissile.speed;
            const vy = Math.sin(missileSystem.incomingMissile.angle) * missileSystem.incomingMissile.speed;
            missileSystem.incomingMissile.x += vx;
            missileSystem.incomingMissile.y += vy;
            
            // Add to trail
            missileSystem.incomingMissile.trail.push({
                x: missileSystem.incomingMissile.x, 
                y: missileSystem.incomingMissile.y, 
                age: 0
            });
            
            // Check if missile has reached its target
            const dx = missileSystem.incomingMissile.targetX - missileSystem.incomingMissile.x;
            const dy = missileSystem.incomingMissile.targetY - missileSystem.incomingMissile.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // If target reached, explode
            if (distance < 5) {
                // Create missile impact
                const destroyedTiles = createMissileImpact(world, worldWidth, worldHeight, 
                                                       missileSystem.incomingMissile.targetX, 
                                                       missileSystem.incomingMissile.targetY, 3);
                
                // Create explosion
                createBackgroundExplosion(missileSystem.incomingMissile.targetX, 
                                        missileSystem.incomingMissile.targetY, 80, 
                                        missileSystem);
                
                // Check if player is hit
                checkPlayerHit(player, world, missileSystem.incomingMissile.targetX, 
                              missileSystem.incomingMissile.targetY, 3, missileSystem);
                
                // Reset for next missile
                missileSystem.incomingMissile = null;
                missileSystem.nextMissileAttack = currentTime + getRandomInterval();
            }
        }
    }
    
    // Update missile trails
    for (let missile of missileSystem.missiles.concat(missileSystem.incomingMissile ? [missileSystem.incomingMissile] : [])) {
        if (!missile) continue;
        
        missile.trail = missile.trail.filter(point => {
            point.age++;
            return point.age < 20; // Trail length
        });
    }
    
    // Update background explosions
    missileSystem.explosions = missileSystem.explosions.filter(explosion => {
        explosion.frame++;
        return explosion.frame < explosion.maxFrames;
    });
    
    // Update smoke clouds
    missileSystem.smokeClouds = missileSystem.smokeClouds.filter(cloud => {
        cloud.x += cloud.vx;
        cloud.life--;
        return cloud.life > 0;
    });
    
    return missileSystem;
}

// Check if player is hit by missile
function checkPlayerHit(player, world, missileX, missileY, impactRadius, missileSystem) {
    // Calculate tile-based radius
    const tileRadius = impactRadius * 32; // TILE_SIZE
    
    // Check if player is in blast radius
    const playerCenterX = player.x + player.width / 2;
    const playerCenterY = player.y + player.height / 2;
    const dx = playerCenterX - missileX;
    const dy = playerCenterY - missileY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // If player is near the impact and not hidden
    if (distance < tileRadius && !isPlayerHidden(player, world)) {
        // Player is hit!
        missileSystem.playerHit = true;
        missileSystem.hitTime = Date.now();
        
        // Apply knockback to player
        const knockbackDirection = dx < 0 ? -1 : 1;
        player.velocityX = knockbackDirection * 15;
        player.velocityY = -10;
        
        // Reduce player energy
        player.energy = Math.max(0, player.energy - 25);
        
        return true;
    }
    
    return false;
} 