import { TILE_SIZE, TILE_AIR, TILE_DIRT, TILE_STONE } from './constants.js';
import { isPlayerHidden } from './player.js';

// Module state
let ctx;
let canvas;
let particles = [];
let digEffect = null;

// Initialize renderer with canvas context
export function initRenderer(canvasContext, canvasElement) {
    ctx = canvasContext;
    canvas = canvasElement;
    particles = [];
    digEffect = null;
}

// Main draw function
export function draw(
    world, 
    worldWidth, 
    worldHeight, 
    player, 
    treasures, 
    warBackgroundElements, 
    levelComplete, 
    playerHit, 
    hitTime,
    incomingMissile, 
    missileWarning,
    gamePaused,
    enemies = []
) {
    // Draw background with gradient sky
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, '#1e3a5a'); // Darker blue for war sky
    skyGradient.addColorStop(1, '#576b84'); // Grayish blue at bottom
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw distant mountains
    drawMountains();
    
    // Draw war background elements (explosions, missiles, smoke)
    drawWarBackground(warBackgroundElements);
    
    // Draw world
    for (let y = 0; y < worldHeight; y++) {
        for (let x = 0; x < worldWidth; x++) {
            if (world[y][x] === 0) continue; // Skip air
            
            const tileX = x * TILE_SIZE;
            const tileY = y * TILE_SIZE;
            
            if (world[y][x] === 1) {
                // Draw dirt with texture
                drawDirtTile(tileX, tileY);
            } else if (world[y][x] === 2) {
                // Draw stone with texture
                drawStoneTile(tileX, tileY);
            }
        }
    }
    
    // Draw treasures with different colors based on value
    drawTreasures(treasures);
    
    // Draw digging effect if active
    updateAndDrawEffects();
    
    // Draw missile warning or incoming missile
    drawMissileWarning(incomingMissile, missileWarning);
    
    // Draw enemies
    for (const enemy of enemies) {
        drawEnemy(enemy);
    }
    
    // Draw player as Wall-E inspired robot
    drawRobot(player, playerHit);
    
    // Draw "hidden" indicator if player is hidden underground
    if (player.isHidden) {
        // Show a shield or safety indicator above the player
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = 'rgba(0, 255, 100, 0.8)';
        ctx.textAlign = 'center';
        ctx.fillText('⛨ HIDDEN', player.x + player.width / 2, player.y - 10);
        
        // Add a subtle shield effect around player
        ctx.strokeStyle = 'rgba(0, 255, 100, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2, player.y + player.height / 2, 
                player.width * 0.8, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // Draw player hit effect (red overlay, screen shake)
    if (playerHit) {
        drawPlayerHitEffect(hitTime);
    }
    
    // Draw overlay when level is complete
    if (levelComplete) {
        // Draw slightly transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

// Draw the background
function drawBackground() {
    // Sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, '#1e3a5a'); // Darker blue for war sky
    skyGradient.addColorStop(1, '#576b84'); // Grayish blue at bottom
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw distant mountains and ruins
    drawMountains();
}

// Draw world tiles
function drawWorld(world, worldWidth, worldHeight) {
    for (let y = 0; y < worldHeight; y++) {
        for (let x = 0; x < worldWidth; x++) {
            if (world[y][x] === TILE_AIR) continue; // Skip air
            
            const tileX = x * TILE_SIZE;
            const tileY = y * TILE_SIZE;
            
            if (world[y][x] === TILE_DIRT) {
                drawDirtTile(tileX, tileY);
            } else if (world[y][x] === TILE_STONE) {
                drawStoneTile(tileX, tileY);
            }
        }
    }
}

// Draw treasures
function drawTreasures(treasures) {
    for (let i = 0; i < treasures.length; i++) {
        const treasure = treasures[i];
        if (!treasure.collected) {
            // Color based on value
            const colorValue = Math.min(255, 100 + (treasure.value * 10));
            
            // Draw shiny treasure with gradient
            const centerX = treasure.x + TILE_SIZE / 2;
            const centerY = treasure.y + TILE_SIZE / 2;
            const radius = TILE_SIZE / 3;
            
            // Make treasures pulsate slightly
            const pulsate = 1 + Math.sin(Date.now() / 200) * 0.1;
            
            const gradient = ctx.createRadialGradient(
                centerX - 2, centerY - 2, 1,
                centerX, centerY, radius * pulsate
            );
            gradient.addColorStop(0, 'white');
            gradient.addColorStop(0.2, `rgb(${colorValue}, ${colorValue}, 50)`);
            gradient.addColorStop(1, `rgb(${colorValue}, ${Math.floor(colorValue/2)}, 0)`);
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * pulsate, 0, Math.PI * 2);
            ctx.fill();
            
            // Add a shine effect
            ctx.beginPath();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.arc(centerX - radius / 3, centerY - radius / 3, radius / 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// Draw the player
function drawPlayer(player) {
    drawRobot(player.x, player.y, player.width, player.height, 
              player.facingRight, player.isDigging, player.energy);
    
    // Draw "hidden" indicator if player is hidden underground
    if (player.isHidden) {
        // Show a shield or safety indicator above the player
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = 'rgba(0, 255, 100, 0.8)';
        ctx.textAlign = 'center';
        ctx.fillText('⛨ HIDDEN', player.x + player.width / 2, player.y - 10);
        
        // Add a subtle shield effect around player
        ctx.strokeStyle = 'rgba(0, 255, 100, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2, player.y + player.height / 2, 
                player.width * 0.8, 0, Math.PI * 2);
        ctx.stroke();
    }
}

// Draw the pause overlay
export function drawPauseOverlay() {
    // Semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw pause message
    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText('GAME PAUSED', canvas.width / 2, canvas.height / 2 - 20);
    
    // Draw instructions to resume
    ctx.font = '20px Arial';
    ctx.fillText('Tap pause button to resume', canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillText('or press P / ESC key', canvas.width / 2, canvas.height / 2 + 50);
}

// Create digging effect
export function createDigEffect(x, y) {
    digEffect = {
        x: x,
        y: y,
        radius: 10,
        maxRadius: 15,
        opacity: 0.7,
        growing: true
    };
    
    // Create particles
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2) * (i / 8);
        const speed = 1 + Math.random() * 2;
        
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1, // Slight upward bias
            size: 3 + Math.random() * 3,
            color: '#8B4513',
            life: 30 + Math.random() * 20
        });
    }
}

// Draw digging effect
function drawDigEffect(gamePaused) {
    if (digEffect) {
        // Draw circular blast
        ctx.beginPath();
        ctx.arc(digEffect.x, digEffect.y, digEffect.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(150, 75, 0, ${digEffect.opacity})`;
        ctx.fill();
        
        // Update effect if not paused
        if (!gamePaused) {
            if (digEffect.growing) {
                digEffect.radius += 1;
                if (digEffect.radius >= digEffect.maxRadius) {
                    digEffect.growing = false;
                }
            } else {
                digEffect.opacity -= 0.1;
                if (digEffect.opacity <= 0) {
                    digEffect = null;
                }
            }
        }
    }
}

// Draw mountains in the background
function drawMountains() {
    // First mountain range (far)
    ctx.fillStyle = '#2d3b4a'; // Dark blue-gray mountains
    ctx.beginPath();
    ctx.moveTo(0, canvas.height * 0.5);
    
    // Create jagged mountain peaks with some ruined/destroyed areas
    for (let x = 0; x < canvas.width; x += 60) {
        const height = canvas.height * 0.15 + Math.sin(x / 50) * canvas.height * 0.1;
        
        // Add some destroyed peaks (gaps) to represent war damage
        if (Math.random() < 0.2) {
            // Lower height for destroyed areas
            ctx.lineTo(x, canvas.height * 0.5 - height * 0.6);
        } else {
            ctx.lineTo(x, canvas.height * 0.5 - height);
        }
    }
    
    ctx.lineTo(canvas.width, canvas.height * 0.5);
    ctx.closePath();
    ctx.fill();
    
    // Draw some smoke/fires on the distant mountains
    for (let i = 0; i < 5; i++) {
        const x = Math.random() * canvas.width;
        const y = canvas.height * 0.4;
        
        // Draw glow for distant fires
        const fireGlow = ctx.createRadialGradient(x, y, 0, x, y, 15);
        fireGlow.addColorStop(0, 'rgba(255, 200, 50, 0.3)');
        fireGlow.addColorStop(1, 'rgba(255, 50, 0, 0)');
        
        ctx.fillStyle = fireGlow;
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Second mountain range (closer, darker)
    ctx.fillStyle = '#1a2530'; 
    ctx.beginPath();
    ctx.moveTo(0, canvas.height * 0.55);
    
    // Create more detailed mountains with damaged appearance
    for (let x = 0; x < canvas.width; x += 40) {
        const height = canvas.height * 0.12 + Math.cos(x / 40) * canvas.height * 0.08;
        
        // Add jagged war-torn look
        if (Math.random() < 0.3) {
            // Create crater or gap
            ctx.lineTo(x, canvas.height * 0.55 - height * 0.7);
            ctx.lineTo(x + 10, canvas.height * 0.55 - height * 0.5);
        } else {
            ctx.lineTo(x, canvas.height * 0.55 - height);
        }
    }
    
    ctx.lineTo(canvas.width, canvas.height * 0.55);
    ctx.closePath();
    ctx.fill();
    
    // Draw ruined buildings/structures in silhouette
    drawRuinedStructures();
}

// Draw ruined buildings and structures in silhouette
function drawRuinedStructures() {
    ctx.fillStyle = '#0a1520'; // Almost black silhouettes
    
    // Draw a few destroyed buildings/structures
    for (let i = 0; i < 4; i++) {
        const x = i * (canvas.width / 4) + Math.random() * 50;
        const baseY = canvas.height * 0.55;
        const baseWidth = 30 + Math.random() * 50;
        const maxHeight = 60 + Math.random() * 40;
        
        // Draw building base
        ctx.beginPath();
        ctx.rect(x, baseY - maxHeight * 0.6, baseWidth, maxHeight * 0.6);
        ctx.fill();
        
        // Draw a damaged/jagged top
        ctx.beginPath();
        ctx.moveTo(x, baseY - maxHeight * 0.6);
        
        // Create a jagged, war-damaged roofline
        let currentX = x;
        while (currentX < x + baseWidth) {
            const segmentWidth = 5 + Math.random() * 10;
            const height = maxHeight * (0.6 + Math.random() * 0.4);
            ctx.lineTo(currentX, baseY - height);
            currentX += segmentWidth;
        }
        
        ctx.lineTo(x + baseWidth, baseY - maxHeight * 0.6);
        ctx.closePath();
        ctx.fill();
        
        // Sometimes add a destroyed tower or chimney
        if (Math.random() < 0.5) {
            const towerX = x + Math.random() * baseWidth;
            const towerWidth = 5 + Math.random() * 10;
            const towerHeight = maxHeight * (0.8 + Math.random() * 0.2);
            
            ctx.beginPath();
            ctx.moveTo(towerX, baseY - maxHeight * 0.6);
            ctx.lineTo(towerX, baseY - towerHeight);
            ctx.lineTo(towerX + towerWidth / 2, baseY - towerHeight * 0.9);
            ctx.lineTo(towerX + towerWidth, baseY - towerHeight);
            ctx.lineTo(towerX + towerWidth, baseY - maxHeight * 0.6);
            ctx.closePath();
            ctx.fill();
        }
    }
}

// Draw dirt tile with texture
function drawDirtTile(x, y) {
    // Base color
    ctx.fillStyle = '#8B4513'; // Brown dirt
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    
    // Add texture details
    ctx.fillStyle = '#7B3503'; // Darker brown
    
    // Use a consistent pattern based on position
    const seed = (x * 3 + y * 7) % 100;
    
    // Draw small darker patches
    for (let i = 0; i < 5; i++) {
        const patchX = x + ((seed + i * 13) % TILE_SIZE);
        const patchY = y + ((seed + i * 17) % TILE_SIZE);
        const size = 3 + (seed % 4);
        
        // Only draw if within tile bounds
        if (patchX + size < x + TILE_SIZE && patchY + size < y + TILE_SIZE) {
            ctx.fillRect(patchX, patchY, size, size);
        }
    }
    
    // Add a highlight edge on top for 3D effect
    ctx.fillStyle = '#9B5523';
    ctx.fillRect(x, y, TILE_SIZE, 2);
}

// Draw stone tile with texture
function drawStoneTile(x, y) {
    // Base color
    ctx.fillStyle = '#696969'; // Dark gray stone
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    
    // Add texture details
    ctx.fillStyle = '#555555'; // Darker gray
    
    // Use position for consistent pattern
    const seed = (x * 5 + y * 11) % 100;
    
    // Draw cracks and textures
    for (let i = 0; i < 3; i++) {
        const lineX = x + ((seed + i * 10) % TILE_SIZE);
        const lineY = y + ((seed + i * 15) % TILE_SIZE);
        const length = 5 + (seed % 6);
        const thickness = 1 + (seed % 2);
        
        // Draw crack lines
        if (lineX + length < x + TILE_SIZE && lineY + thickness < y + TILE_SIZE) {
            ctx.fillRect(lineX, lineY, length, thickness);
        }
    }
    
    // Add highlights for 3D effect
    ctx.fillStyle = '#7A7A7A';
    ctx.fillRect(x, y, TILE_SIZE, 1);
    ctx.fillRect(x, y, 1, TILE_SIZE);
}

// Draw the war background elements
function drawWarBackground(warBackgroundElements) {
    if (!warBackgroundElements) return;
    
    // Draw background explosions
    for (let explosion of warBackgroundElements.explosions || []) {
        const radius = explosion.size * (1 - explosion.frame / explosion.maxFrames);
        const alpha = 1 - explosion.frame / explosion.maxFrames;
        
        // Draw explosion glow
        const gradient = ctx.createRadialGradient(
            explosion.x, explosion.y, 0,
            explosion.x, explosion.y, radius
        );
        gradient.addColorStop(0, `rgba(255, 255, 200, ${alpha})`);
        gradient.addColorStop(0.5, `${explosion.color.replace(')', `, ${alpha * 0.7})`).replace('hsl', 'hsla')}`);
        gradient.addColorStop(1, `rgba(100, 50, 0, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Draw smoke clouds
    for (let cloud of warBackgroundElements.smokeClouds || []) {
        const alpha = (cloud.life / cloud.maxLife) * 0.7;
        ctx.fillStyle = cloud.color.replace(')', `, ${alpha})`).replace('rgba', 'rgba');
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Draw background missiles and trails
    for (let missile of warBackgroundElements.missiles || []) {
        // Draw trail
        for (let i = 0; i < missile.trail.length; i++) {
            const point = missile.trail[i];
            const alpha = 1 - point.age / 20;
            ctx.fillStyle = `rgba(255, 100, 50, ${alpha * 0.5})`;
            ctx.beginPath();
            ctx.arc(point.x, point.y, missile.size / 2 * (1 - point.age / 20), 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw missile
        ctx.fillStyle = '#FF3300';
        ctx.beginPath();
        ctx.arc(missile.x, missile.y, missile.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Draw the warning indicator and incoming missile
function drawMissileWarning(incomingMissile, missileWarning) {
    if (missileWarning && incomingMissile) {
        // Flash warning indicator
        incomingMissile.warningFrame = (incomingMissile.warningFrame || 0) + 1;
        const warningOpacity = (incomingMissile.warningFrame % 20 < 10) ? 1 : 0.3;
        
        // Calculate warning position - where the missile will hit
        const x = incomingMissile.targetX;
        const y = incomingMissile.targetY;
        
        // Draw warning circle
        ctx.strokeStyle = `rgba(255, 0, 0, ${warningOpacity})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, 40, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw crosshairs
        ctx.beginPath();
        ctx.moveTo(x - 50, y);
        ctx.lineTo(x + 50, y);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x, y - 50);
        ctx.lineTo(x, y + 50);
        ctx.stroke();
        
        // Draw warning text
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = `rgba(255, 0, 0, ${warningOpacity})`;
        ctx.textAlign = 'center';
        ctx.fillText('⚠️ INCOMING!', x, y - 60);
    }
    
    // Draw incoming missile
    if (incomingMissile && !missileWarning) {
        // Draw trail
        for (let i = 0; i < incomingMissile.trail.length; i++) {
            const point = incomingMissile.trail[i];
            const alpha = 1 - point.age / 20;
            ctx.fillStyle = `rgba(255, 0, 0, ${alpha * 0.7})`;
            ctx.beginPath();
            ctx.arc(point.x, point.y, incomingMissile.size / 2 * (1 - point.age / 20), 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw missile
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(incomingMissile.x, incomingMissile.y, incomingMissile.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Draw the player hit effect
function drawPlayerHitEffect(hitTime) {
    const elapsedTime = Date.now() - hitTime;
    if (elapsedTime < 2000) {
        // Shake the canvas
        const shakeAmount = Math.max(0, 10 - elapsedTime / 200);
        ctx.save();
        ctx.translate(
            (Math.random() - 0.5) * shakeAmount, 
            (Math.random() - 0.5) * shakeAmount
        );
        
        // Red overlay
        const alpha = Math.max(0, 0.7 - elapsedTime / 2000);
        ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.restore();
    }
}

// Draw the player robot
function drawRobot(player, playerHit) {
    const x = player.x;
    const y = player.y;
    const width = player.width;
    const height = player.height;
    const facingRight = player.facingRight;
    const isDigging = player.isDigging;
    
    // Handle death animation
    if (player.isDead) {
        const timeSinceDeath = Date.now() - player.deathTime;
        
        // Death animation phases
        if (timeSinceDeath < 1500) {
            // Flash red and show explosion effects
            const flashFrequency = 100; // milliseconds
            const isVisible = Math.floor(timeSinceDeath / flashFrequency) % 2 === 0;
            
            if (isVisible) {
                // Draw damaged robot with red tint
                drawDamagedRobot(x, y, width, height, facingRight, timeSinceDeath);
                
                // Create explosion particles
                if (timeSinceDeath < 1000 && Math.random() < 0.3) {
                    createExplosionParticle(
                        x + width/2 + (Math.random() - 0.5) * width,
                        y + height/2 + (Math.random() - 0.5) * height
                    );
                }
            }
            
            // Create some smoke during the explosion
            if (Math.random() < 0.2) {
                createSmokeParticle(
                    x + width/2 + (Math.random() - 0.5) * width,
                    y + height/2 + (Math.random() - 0.5) * height
                );
            }
        } else if (timeSinceDeath < 3000) {
            // Show broken robot parts
            drawBrokenRobotParts(x, y, width, height, facingRight, timeSinceDeath);
            
            // Create occasional smoke
            if (Math.random() < 0.05) {
                createSmokeParticle(
                    x + width/2 + (Math.random() - 0.5) * width,
                    y + height/4 + (Math.random() - 0.5) * height/2
                );
            }
        } else {
            // Animation is complete
            player.deathAnimationComplete = true;
        }
        
        return;
    }
    
    // Normal robot drawing for live robot
    // Add digging animation
    const diggingOffset = isDigging ? Math.sin(Date.now() / 100) * 2 : 0;
    
    // Flash effect when hit
    const isFlashing = playerHit && (Math.floor(Date.now() / 100) % 2 === 0);
    
    // Main body (slightly compressed cube)
    ctx.fillStyle = isFlashing ? '#FF5555' : '#E8A30C'; // Wall-E yellow or flash red when hit
    ctx.fillRect(x + width * 0.1, y + height * 0.2 + diggingOffset, width * 0.8, height * 0.6);
    
    // Treads/wheels
    ctx.fillStyle = '#333333';
    ctx.fillRect(x, y + height * 0.8 + diggingOffset, width, height * 0.2);
    
    // Tread details
    ctx.fillStyle = '#555555';
    for (let i = 0; i < 4; i++) {
        ctx.fillRect(x + width * 0.2 * i, y + height * 0.82 + diggingOffset, width * 0.15, height * 0.16);
    }
    
    // Head
    ctx.fillStyle = isFlashing ? '#FF5555' : '#E8A30C';
    ctx.fillRect(x + width * 0.15, y + diggingOffset/2, width * 0.7, height * 0.25);
    
    // Eyes (binoculars style)
    ctx.fillStyle = '#333';
    if (facingRight) {
        // Right-facing eyes
        ctx.fillRect(x + width * 0.6, y + height * 0.05 + diggingOffset/2, width * 0.25, height * 0.15);
        
        // Eye details - orange when digging, blue normally
        ctx.fillStyle = isFlashing ? '#FFFFFF' : (isDigging ? '#FF9900' : '#66CCFF');
        ctx.fillRect(x + width * 0.65, y + height * 0.07 + diggingOffset/2, width * 0.15, height * 0.1);
        
        // Eyebrow - angled down when digging
        ctx.fillStyle = '#333';
        ctx.save();
        if (isDigging) {
            ctx.translate(x + width * 0.72, y - height * 0.02 + diggingOffset/2);
            ctx.rotate(Math.PI / 30); // Slight angle for effort
            ctx.fillRect(-width * 0.12, 0, width * 0.25, height * 0.04);
        } else {
            ctx.fillRect(x + width * 0.6, y - height * 0.02, width * 0.25, height * 0.04);
        }
        ctx.restore();
        
        // Arm (digging tool) - animated when digging
        ctx.fillStyle = isFlashing ? '#FF5555' : '#E8A30C';
        if (isDigging) {
            // Animated digging motion
            const digAngle = Math.sin(Date.now() / 150) * 15;
            ctx.save();
            ctx.translate(x + width * 0.95, y + height * 0.38);
            ctx.rotate(digAngle * Math.PI / 180);
            ctx.fillRect(0, -height * 0.07, width * 0.3, height * 0.15);
            
            // Digging claw
            ctx.fillStyle = '#555';
            ctx.beginPath();
            ctx.moveTo(width * 0.3, -height * 0.05);
            ctx.lineTo(width * 0.4, -height * 0.1);
            ctx.lineTo(width * 0.45, height * 0.1);
            ctx.lineTo(width * 0.3, height * 0.08);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            
            // Add digging particles
            if (Math.random() < 0.3 && !gamePaused) {
                createParticle(
                    x + width * 1.3 + Math.random() * 10,
                    y + height * 0.4 + Math.random() * 10,
                    (Math.random() - 0.5) * 2,
                    -Math.random() * 3,
                    2 + Math.random() * 3,
                    '#8B4513',
                    10 + Math.random() * 20
                );
            }
        } else {
            ctx.fillRect(x + width * 0.8, y + height * 0.3, width * 0.3, height * 0.15);
            
            // Digging claw
            ctx.fillStyle = '#555';
            ctx.beginPath();
            ctx.moveTo(x + width * 1.1, y + height * 0.3);
            ctx.lineTo(x + width * 1.2, y + height * 0.25);
            ctx.lineTo(x + width * 1.2, y + height * 0.5);
            ctx.lineTo(x + width * 1.1, y + height * 0.45);
            ctx.closePath();
            ctx.fill();
        }
    } else {
        // Left-facing eyes
        ctx.fillRect(x + width * 0.15, y + height * 0.05 + diggingOffset/2, width * 0.25, height * 0.15);
        
        // Eye details - orange when digging, blue normally
        ctx.fillStyle = isFlashing ? '#FFFFFF' : (isDigging ? '#FF9900' : '#66CCFF');
        ctx.fillRect(x + width * 0.2, y + height * 0.07 + diggingOffset/2, width * 0.15, height * 0.1);
        
        // Eyebrow - angled down when digging
        ctx.fillStyle = '#333';
        ctx.save();
        if (isDigging) {
            ctx.translate(x + width * 0.28, y - height * 0.02 + diggingOffset/2);
            ctx.rotate(-Math.PI / 30); // Slight angle for effort
            ctx.fillRect(-width * 0.12, 0, width * 0.25, height * 0.04);
        } else {
            ctx.fillRect(x + width * 0.15, y - height * 0.02, width * 0.25, height * 0.04);
        }
        ctx.restore();
        
        // Arm (digging tool) - animated when digging
        ctx.fillStyle = isFlashing ? '#FF5555' : '#E8A30C';
        if (isDigging) {
            // Animated digging motion
            const digAngle = Math.sin(Date.now() / 150) * 15;
            ctx.save();
            ctx.translate(x + width * 0.05, y + height * 0.38);
            ctx.rotate(-digAngle * Math.PI / 180);
            ctx.fillRect(-width * 0.3, -height * 0.07, width * 0.3, height * 0.15);
            
            // Digging claw
            ctx.fillStyle = '#555';
            ctx.beginPath();
            ctx.moveTo(-width * 0.3, -height * 0.05);
            ctx.lineTo(-width * 0.4, -height * 0.1);
            ctx.lineTo(-width * 0.45, height * 0.1);
            ctx.lineTo(-width * 0.3, height * 0.08);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            
            // Add digging particles
            if (Math.random() < 0.3 && !gamePaused) {
                createParticle(
                    x - width * 0.5 - Math.random() * 10,
                    y + height * 0.4 + Math.random() * 10,
                    (Math.random() - 0.5) * 2,
                    -Math.random() * 3,
                    2 + Math.random() * 3,
                    '#8B4513',
                    10 + Math.random() * 20
                );
            }
        } else {
            ctx.fillRect(x - width * 0.3, y + height * 0.3, width * 0.3, height * 0.15);
            
            // Digging claw
            ctx.fillStyle = '#555';
            ctx.beginPath();
            ctx.moveTo(x - width * 0.3, y + height * 0.3);
            ctx.lineTo(x - width * 0.4, y + height * 0.25);
            ctx.lineTo(x - width * 0.4, y + height * 0.5);
            ctx.lineTo(x - width * 0.3, y + height * 0.45);
            ctx.closePath();
            ctx.fill();
        }
    }
    
    // Solar panel back
    ctx.fillStyle = '#444';
    ctx.fillRect(x + width * 0.2, y + height * 0.1 + diggingOffset/2, width * 0.6, height * 0.1);
    
    // Details on body (controls/buttons)
    ctx.fillStyle = '#444';
    ctx.fillRect(x + width * 0.3, y + height * 0.4 + diggingOffset, width * 0.4, height * 0.1);
    
    // Small lights - blink faster when digging
    const blinkRate = isDigging ? 150 : 500;
    const blinkPhase = Math.floor(Date.now() / blinkRate) % 2;
    
    ctx.fillStyle = isDigging && blinkPhase === 0 ? '#ff6666' : 'red';
    ctx.beginPath();
    ctx.arc(x + width * 0.35, y + height * 0.45 + diggingOffset, width * 0.05, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = isDigging && blinkPhase === 1 ? '#66ff66' : 'green';
    ctx.beginPath();
    ctx.arc(x + width * 0.65, y + height * 0.45 + diggingOffset, width * 0.05, 0, Math.PI * 2);
    ctx.fill();
    
    // Energy meter - pulsing when digging
    const energyPercentage = Math.min(1, player.energy / 100);
    const meterPulse = isDigging ? 1 + Math.sin(Date.now() / 100) * 0.1 : 1;
    
    ctx.fillStyle = '#333';
    ctx.fillRect(x + width * 0.25, y + height * 0.6 + diggingOffset, width * 0.5, height * 0.1);
    
    // Energy level
    ctx.fillStyle = energyPercentage < 0.2 ? 'red' : (energyPercentage < 0.5 ? 'yellow' : 'green');
    ctx.fillRect(x + width * 0.27, y + height * 0.62 + diggingOffset, 
                width * 0.46 * energyPercentage * meterPulse, height * 0.06);
    
    // Add sweat drops when digging
    if (isDigging && Math.random() < 0.05 && !gamePaused) {
        createParticle(
            x + width * 0.5 + (Math.random() - 0.5) * width * 0.3,
            y + height * 0.1,
            (Math.random() - 0.5) * 1,
            1 + Math.random() * 2,
            2 + Math.random() * 2,
            'rgba(150, 220, 255, 0.7)',
            20 + Math.random() * 15
        );
    }
}

// Draw damaged robot during death animation
function drawDamagedRobot(x, y, width, height, facingRight, timeSinceDeath) {
    // Calculate explosion force
    const explosionForce = Math.min(1, timeSinceDeath / 1000) * 5;
    const jitter = Math.sin(timeSinceDeath / 30) * explosionForce;
    
    // Draw with red tint and jittering
    ctx.fillStyle = '#FF3333';
    ctx.fillRect(
        x + width * 0.1 + jitter, 
        y + height * 0.2 + jitter, 
        width * 0.8, 
        height * 0.6
    );
    
    // Damaged treads
    ctx.fillStyle = '#555555';
    ctx.fillRect(
        x + jitter, 
        y + height * 0.8 - jitter, 
        width, 
        height * 0.2
    );
    
    // Damaged head
    ctx.fillStyle = '#FF3333';
    ctx.fillRect(
        x + width * 0.15 - jitter, 
        y + jitter/2, 
        width * 0.7, 
        height * 0.25
    );
    
    // Sparking eyes
    ctx.fillStyle = '#FFFF00';
    if (facingRight) {
        ctx.fillRect(
            x + width * 0.6 + jitter, 
            y + height * 0.05 + jitter/2, 
            width * 0.25, 
            height * 0.15
        );
    } else {
        ctx.fillRect(
            x + width * 0.15 - jitter, 
            y + height * 0.05 + jitter/2, 
            width * 0.25, 
            height * 0.15
        );
    }
    
    // Cracks and damage detail
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + width * 0.3, y + height * 0.3);
    ctx.lineTo(x + width * 0.7, y + height * 0.6);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x + width * 0.7, y + height * 0.3);
    ctx.lineTo(x + width * 0.3, y + height * 0.5);
    ctx.stroke();
}

// Draw broken robot parts
function drawBrokenRobotParts(x, y, width, height, facingRight, timeSinceDeath) {
    const fadeOut = Math.max(0, 1 - (timeSinceDeath - 1500) / 1500);
    
    // Body parts scattered
    ctx.globalAlpha = fadeOut;
    
    // Main body - broken in half
    ctx.fillStyle = '#AA2200';
    ctx.fillRect(
        x + width * 0.1, 
        y + height * 0.4, 
        width * 0.4, 
        height * 0.4
    );
    
    // Other half of body
    ctx.fillRect(
        x + width * 0.6, 
        y + height * 0.5, 
        width * 0.3, 
        height * 0.3
    );
    
    // Head - detached
    ctx.fillStyle = '#AA2200';
    ctx.fillRect(
        x + width * 0.2, 
        y + height * 0.1, 
        width * 0.5, 
        height * 0.2
    );
    
    // Treads - broken
    ctx.fillStyle = '#333333';
    ctx.fillRect(
        x, 
        y + height * 0.9, 
        width * 0.7, 
        height * 0.1
    );
    
    // Arm - detached
    ctx.fillStyle = '#AA2200';
    if (facingRight) {
        ctx.fillRect(
            x + width * 0.9, 
            y + height * 0.6, 
            width * 0.2, 
            height * 0.1
        );
    } else {
        ctx.fillRect(
            x - width * 0.1, 
            y + height * 0.6, 
            width * 0.2, 
            height * 0.1
        );
    }
    
    // Restore alpha
    ctx.globalAlpha = 1.0;
}

// Create an explosion particle
function createExplosionParticle(x, y) {
    // Create glowing red/orange particle
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    
    createParticle(
        x,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        2 + Math.random() * 4,
        `hsl(${10 + Math.random() * 30}, 100%, ${50 + Math.random() * 50}%)`,
        10 + Math.random() * 15
    );
}

// Create a smoke particle
function createSmokeParticle(x, y) {
    const angle = -Math.PI/2 + (Math.random() - 0.5) * Math.PI/4; // Mostly upward
    const speed = 0.5 + Math.random() * 1;
    
    createParticle(
        x,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        5 + Math.random() * 8,
        `rgba(${50 + Math.random() * 50}, ${50 + Math.random() * 50}, ${50 + Math.random() * 50}, ${0.5 + Math.random() * 0.5})`,
        30 + Math.random() * 30
    );
}

// Update and draw particles
function updateAndDrawParticles(gamePaused) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        
        // Update position if not paused
        if (!gamePaused) {
            p.x += p.vx || 0;
            p.y += p.vy || 0;
            if (p.vy !== undefined && !p.text) {
                p.vy += 0.1; // Gravity for non-text particles
            }
            p.life -= 1;
        }
        
        // Draw the particle
        if (p.text) {
            // Draw text particle (for points)
            ctx.font = 'bold 16px Arial';
            ctx.fillStyle = 'gold';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            
            const alpha = Math.min(1, p.life / 20);
            ctx.globalAlpha = alpha;
            
            ctx.strokeText(p.text, p.x - ctx.measureText(p.text).width / 2, p.y);
            ctx.fillText(p.text, p.x - ctx.measureText(p.text).width / 2, p.y);
            ctx.globalAlpha = 1;
        } else {
            // Draw regular particle
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.min(1, p.life / 30);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
        
        // Remove dead particles
        if (p.life <= 0 && !gamePaused) {
            particles.splice(i, 1);
        }
    }
}

// Draw level complete overlay
function drawLevelCompleteOverlay() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Create text particle
export function createTextParticle(x, y, text, upwardVelocity = -1.5) {
    particles.push({
        x: x,
        y: y,
        text: text,
        life: 40,
        vy: upwardVelocity
    });
}

// Draw enemy robot
export function drawEnemy(enemy) {
    // Enemy position
    const x = enemy.x;
    const y = enemy.y;
    const width = enemy.width;
    const height = enemy.height;
    const facingRight = enemy.facingRight;
    const isAttacking = Date.now() - enemy.lastAttackTime < 500; // Animation for 500ms after attack
    const isPatrolling = enemy.isPatrolling;
    const seesPlayer = enemy.seesPlayer;
    
    // Calculate animation offset for more robot-like movement
    const patrolOffset = isPatrolling ? Math.sin(Date.now() / 150) * 2 : 0;
    const chaseOffset = seesPlayer && !isPatrolling ? Math.sin(Date.now() / 100) * 3 : 0;
    const offset = patrolOffset + chaseOffset;
    
    // Draw evil robot - slightly larger and red-themed
    
    // Main body - evil version is darker and red-tinted
    ctx.fillStyle = '#8B0000'; // Dark red
    ctx.fillRect(x + width * 0.1, y + height * 0.2 + offset, width * 0.8, height * 0.6);
    
    // Treads/wheels
    ctx.fillStyle = '#333333';
    ctx.fillRect(x, y + height * 0.8 + offset, width, height * 0.2);
    
    // Tread details
    ctx.fillStyle = '#555555';
    for (let i = 0; i < 4; i++) {
        ctx.fillRect(x + width * 0.2 * i, y + height * 0.82 + offset, width * 0.15, height * 0.16);
    }
    
    // Head
    ctx.fillStyle = '#8B0000'; // Dark red
    ctx.fillRect(x + width * 0.15, y + offset/2, width * 0.7, height * 0.25);
    
    // Eyes - red glowing for enemy
    ctx.fillStyle = '#333';
    if (facingRight) {
        // Right-facing eyes
        ctx.fillRect(x + width * 0.6, y + height * 0.05 + offset/2, width * 0.25, height * 0.15);
        
        // Eye details - red when attacking, glowing red normally
        ctx.fillStyle = isAttacking ? '#FF0000' : '#DD0000';
        ctx.fillRect(x + width * 0.65, y + height * 0.07 + offset/2, width * 0.15, height * 0.1);
        
        // Angry eyebrow
        ctx.fillStyle = '#333';
        ctx.save();
        ctx.translate(x + width * 0.72, y - height * 0.02 + offset/2);
        ctx.rotate(Math.PI / 20); // Angry angle
        ctx.fillRect(-width * 0.12, 0, width * 0.25, height * 0.04);
        ctx.restore();
        
        // Evil arm (weapon)
        if (isAttacking) {
            // Attack animation
            ctx.fillStyle = '#B22222'; // FireBrick
            ctx.save();
            ctx.translate(x + width * 0.95, y + height * 0.38);
            ctx.rotate((Math.PI / 6) * Math.sin(Date.now() / 50)); // Fast attack motion
            ctx.fillRect(0, -height * 0.07, width * 0.4, height * 0.15);
            
            // Weapon tip - blaster or laser
            ctx.fillStyle = '#FF3300';
            ctx.beginPath();
            ctx.moveTo(width * 0.4, -height * 0.07);
            ctx.lineTo(width * 0.5, -height * 0.12);
            ctx.lineTo(width * 0.5, height * 0.08);
            ctx.lineTo(width * 0.4, height * 0.08);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        } else {
            // Regular arm position
            ctx.fillStyle = '#B22222'; // FireBrick
            ctx.fillRect(x + width * 0.8, y + height * 0.3, width * 0.3, height * 0.15);
            
            // Weapon tip - blaster or laser
            ctx.fillStyle = '#FF3300';
            ctx.beginPath();
            ctx.moveTo(x + width * 1.1, y + height * 0.3);
            ctx.lineTo(x + width * 1.2, y + height * 0.25);
            ctx.lineTo(x + width * 1.2, y + height * 0.5);
            ctx.lineTo(x + width * 1.1, y + height * 0.45);
            ctx.closePath();
            ctx.fill();
        }
    } else {
        // Left-facing version
        ctx.fillRect(x + width * 0.15, y + height * 0.05 + offset/2, width * 0.25, height * 0.15);
        
        // Eye details - red when attacking, glowing red normally
        ctx.fillStyle = isAttacking ? '#FF0000' : '#DD0000';
        ctx.fillRect(x + width * 0.2, y + height * 0.07 + offset/2, width * 0.15, height * 0.1);
        
        // Angry eyebrow
        ctx.fillStyle = '#333';
        ctx.save();
        ctx.translate(x + width * 0.28, y - height * 0.02 + offset/2);
        ctx.rotate(-Math.PI / 20); // Angry angle
        ctx.fillRect(-width * 0.12, 0, width * 0.25, height * 0.04);
        ctx.restore();
        
        // Evil arm (weapon)
        if (isAttacking) {
            // Attack animation
            ctx.fillStyle = '#B22222'; // FireBrick
            ctx.save();
            ctx.translate(x + width * 0.05, y + height * 0.38);
            ctx.rotate((-Math.PI / 6) * Math.sin(Date.now() / 50)); // Fast attack motion
            ctx.fillRect(-width * 0.4, -height * 0.07, width * 0.4, height * 0.15);
            
            // Weapon tip - blaster or laser
            ctx.fillStyle = '#FF3300';
            ctx.beginPath();
            ctx.moveTo(-width * 0.4, -height * 0.07);
            ctx.lineTo(-width * 0.5, -height * 0.12);
            ctx.lineTo(-width * 0.5, height * 0.08);
            ctx.lineTo(-width * 0.4, height * 0.08);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        } else {
            // Regular arm position
            ctx.fillStyle = '#B22222'; // FireBrick
            ctx.fillRect(x - width * 0.3, y + height * 0.3, width * 0.3, height * 0.15);
            
            // Weapon tip - blaster or laser
            ctx.fillStyle = '#FF3300';
            ctx.beginPath();
            ctx.moveTo(x - width * 0.3, y + height * 0.3);
            ctx.lineTo(x - width * 0.4, y + height * 0.25);
            ctx.lineTo(x - width * 0.4, y + height * 0.5);
            ctx.lineTo(x - width * 0.3, y + height * 0.45);
            ctx.closePath();
            ctx.fill();
        }
    }
    
    // Evil robot details/markings
    ctx.fillStyle = '#333';
    ctx.fillRect(x + width * 0.3, y + height * 0.4 + offset, width * 0.4, height * 0.1);
    
    // Red evil lights
    ctx.fillStyle = isAttacking ? '#FF0000' : (Math.floor(Date.now() / 300) % 2 === 0 ? '#DD0000' : '#880000');
    ctx.beginPath();
    ctx.arc(x + width * 0.35, y + height * 0.45 + offset, width * 0.05, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = isAttacking ? '#FF0000' : (Math.floor(Date.now() / 300) % 2 === 1 ? '#DD0000' : '#880000');
    ctx.beginPath();
    ctx.arc(x + width * 0.65, y + height * 0.45 + offset, width * 0.05, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw a health bar above enemy
    const healthPercent = enemy.health / 40; // Updated from 30 to match new max health
    const barWidth = width * 0.8;
    const barHeight = height * 0.05;
    
    // Bar background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x + width * 0.1, y - barHeight - 5, barWidth, barHeight);
    
    // Health fill
    ctx.fillStyle = healthPercent > 0.5 ? '#00DD00' : (healthPercent > 0.25 ? '#DDDD00' : '#DD0000');
    ctx.fillRect(x + width * 0.1, y - barHeight - 5, barWidth * healthPercent, barHeight);
    
    // If enemy sees player, draw an alert indicator
    if (seesPlayer && !isPatrolling) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.moveTo(x + width / 2, y - height * 0.2);
        ctx.lineTo(x + width / 2 - 8, y - height * 0.4);
        ctx.lineTo(x + width / 2 + 8, y - height * 0.4);
        ctx.closePath();
        ctx.fill();
        
        // Exclamation mark
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('!', x + width / 2, y - height * 0.25);
    }
}

// Update and draw all effects
function updateAndDrawEffects() {
    // Draw dig effect
    drawDigEffect(window.gamePaused);
    
    // Update and draw particles
    updateAndDrawParticles(window.gamePaused);
}

// Create a particle
export function createParticle(x, y, vx, vy, size, color, life) {
    particles.push({
        x: x,
        y: y,
        vx: vx,
        vy: vy,
        size: size,
        color: color,
        life: life
    });
} 