// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const energyDisplay = document.getElementById('energyDisplay');
const levelDisplay = document.getElementById('levelDisplay');
const scoreDisplay = document.getElementById('scoreDisplay');
const levelCompleteDiv = document.getElementById('level-complete');
const levelBonusSpan = document.getElementById('levelBonus');
const totalScoreSpan = document.getElementById('totalScore');
const countdownSpan = document.getElementById('countdown');

// Touch control elements
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const jumpBtn = document.getElementById('jumpBtn');
const digBtn = document.getElementById('digBtn');

// Game settings
const GRAVITY = 0.5;
const JUMP_FORCE = -12;
const MOVEMENT_SPEED = 5;
const DIG_SPEED = 3;
const TILE_SIZE = 32;

// Game state
let currentLevel = 1;
let totalScore = 0;
let levelComplete = false;
let levelTransitionTimer = 0;

// Player
let player = {
    x: canvas.width / 2,
    y: 300,
    width: TILE_SIZE,
    height: TILE_SIZE * 1.5,
    velocityX: 0,
    velocityY: 0,
    energy: 10,
    isJumping: false,
    isDigging: false,
    facingRight: true
};

// Game world
const worldWidth = Math.ceil(canvas.width / TILE_SIZE);
const worldHeight = Math.ceil(canvas.height / TILE_SIZE);
let world = [];
let treasures = [];

// Controls
const keys = {};
const touchControls = {
    left: false,
    right: false,
    jump: false,
    dig: false
};

// Game loop variables
let lastTimestamp = 0;
const FPS = 60;
const frameTime = 1000 / FPS;

// Visual effects
let particles = [];
let digEffect = null;

// Initialize game
function init() {
    // Reset game state
    currentLevel = 1;
    totalScore = 0;
    
    // Update displays
    updateLevelDisplay();
    scoreDisplay.textContent = "0";
    
    // Generate world terrain
    generateWorld();
    
    // Add event listeners for keyboard controls
    window.addEventListener('keydown', e => keys[e.key] = true);
    window.addEventListener('keyup', e => keys[e.key] = false);
    
    // Add event listeners for touch controls
    setupTouchControls();
    
    // Handle window resize
    window.addEventListener('resize', handleResize);
    handleResize();
    
    // Start game loop
    requestAnimationFrame(gameLoop);
    
    // Update energy display
    updateEnergyDisplay();
}

// Setup touch controls
function setupTouchControls() {
    // Prevent default touch behaviors on the control buttons
    const controlButtons = document.querySelectorAll('.control-btn');
    controlButtons.forEach(btn => {
        btn.addEventListener('touchstart', e => e.preventDefault());
        btn.addEventListener('touchend', e => e.preventDefault());
        btn.addEventListener('touchmove', e => e.preventDefault());
    });
    
    // Left button
    leftBtn.addEventListener('touchstart', () => {
        touchControls.left = true;
        touchControls.lastLeftTouch = Date.now();
    });
    leftBtn.addEventListener('touchend', () => {
        touchControls.left = false;
    });
    
    // Right button
    rightBtn.addEventListener('touchstart', () => {
        touchControls.right = true;
        touchControls.lastRightTouch = Date.now();
    });
    rightBtn.addEventListener('touchend', () => {
        touchControls.right = false;
    });
    
    // Jump button
    jumpBtn.addEventListener('touchstart', () => {
        touchControls.jump = true;
    });
    jumpBtn.addEventListener('touchend', () => {
        touchControls.jump = false;
    });
    
    // Dig button
    digBtn.addEventListener('touchstart', () => {
        touchControls.dig = true;
    });
    digBtn.addEventListener('touchend', () => {
        touchControls.dig = false;
    });
    
    // Also add mouse events for testing on desktop
    leftBtn.addEventListener('mousedown', () => {
        touchControls.left = true;
        touchControls.lastLeftTouch = Date.now();
    });
    leftBtn.addEventListener('mouseup', () => touchControls.left = false);
    leftBtn.addEventListener('mouseleave', () => touchControls.left = false);
    
    rightBtn.addEventListener('mousedown', () => {
        touchControls.right = true;
        touchControls.lastRightTouch = Date.now();
    });
    rightBtn.addEventListener('mouseup', () => touchControls.right = false);
    rightBtn.addEventListener('mouseleave', () => touchControls.right = false);
    
    jumpBtn.addEventListener('mousedown', () => touchControls.jump = true);
    jumpBtn.addEventListener('mouseup', () => touchControls.jump = false);
    jumpBtn.addEventListener('mouseleave', () => touchControls.jump = false);
    
    digBtn.addEventListener('mousedown', () => touchControls.dig = true);
    digBtn.addEventListener('mouseup', () => touchControls.dig = false);
    digBtn.addEventListener('mouseleave', () => touchControls.dig = false);
}

// Handle window resize
function handleResize() {
    // Make sure the canvas maintains aspect ratio but fits the screen
    const gameContainer = document.getElementById('game-container');
    const containerWidth = gameContainer.clientWidth;
    
    if (containerWidth < canvas.width) {
        const scale = containerWidth / canvas.width;
        canvas.style.width = `${canvas.width * scale}px`;
        canvas.style.height = `${canvas.height * scale}px`;
    } else {
        canvas.style.width = `${canvas.width}px`;
        canvas.style.height = `${canvas.height}px`;
    }
}

// Generate world with terrain and treasures
function generateWorld() {
    // Clear existing treasures
    treasures = [];
    
    // Reset level completion state
    levelComplete = false;
    
    // Initialize empty world
    for (let y = 0; y < worldHeight; y++) {
        world[y] = [];
        for (let x = 0; x < worldWidth; x++) {
            // Sky
            if (y < worldHeight - 6) {
                world[y][x] = 0; // 0 = air
            }
            // Dirt layer
            else if (y < worldHeight - 1) {
                world[y][x] = 1; // 1 = dirt
                
                // Random treasures in dirt - increased chance based on level
                if (Math.random() < 0.1 + (currentLevel * 0.01)) {
                    treasures.push({
                        x: x * TILE_SIZE,
                        y: y * TILE_SIZE,
                        collected: false,
                        value: Math.floor(Math.random() * currentLevel) + 5 // Value increases with level
                    });
                }
            }
            // Bottom layer (stone)
            else {
                world[y][x] = 2; // 2 = stone
            }
        }
    }
}

// Update player position and handle input
function updatePlayer() {
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
    }
    
    // Handle digging
    player.isDigging = keys['ArrowDown'] || keys['s'] || touchControls.dig;
    if (player.isDigging && player.energy > 0) {
        dig();
    }
    
    // Apply gravity
    player.velocityY += GRAVITY;
    
    // Update position - move X and Y separately to allow sliding along walls
    player.x += player.velocityX;
    
    // Boundary checks for X
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    
    // Check horizontal collisions
    handleHorizontalCollisions();
    
    // Now move Y
    player.y += player.velocityY;
    
    // Check vertical collisions
    handleVerticalCollisions();
    
    // Collect treasures
    collectTreasures();
}

// Handle horizontal collisions separately
function handleHorizontalCollisions() {
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
function handleVerticalCollisions() {
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

// Dig through terrain
function dig() {
    if (player.isDigging && player.energy > 0) {
        // Calculate dig position based on player facing direction
        const digX = Math.floor((player.x + (player.facingRight ? player.width : 0)) / TILE_SIZE);
        const digY = Math.floor((player.y + player.height) / TILE_SIZE);
        
        // First check if there's a treasure at dig location
        let treasureFound = false;
        let treasureValue = 0;
        
        for (let i = 0; i < treasures.length; i++) {
            const treasure = treasures[i];
            if (!treasure.collected) {
                const treasureTileX = Math.floor(treasure.x / TILE_SIZE);
                const treasureTileY = Math.floor(treasure.y / TILE_SIZE);
                
                if (treasureTileX === digX && treasureTileY === digY) {
                    // Collect treasure through digging
                    treasure.collected = true;
                    treasureFound = true;
                    treasureValue = treasure.value;
                    
                    // Increase energy
                    player.energy += treasureValue;
                    updateEnergyDisplay();
                    
                    // Create special treasure collection effect
                    createCollectEffect(treasure.x + TILE_SIZE/2, treasure.y + TILE_SIZE/2, treasureValue);
                    
                    break;
                }
            }
        }
        
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
            
            // Decrease energy only if no treasure was found
            if (!treasureFound) {
                player.energy -= 0.1;
                updateEnergyDisplay();
            }
        }
        
        // Check if all treasures have been collected
        let allCollected = true;
        for (let i = 0; i < treasures.length; i++) {
            if (!treasures[i].collected) {
                allCollected = false;
                break;
            }
        }
        
        if (allCollected && treasures.length > 0 && !levelComplete) {
            completeLevelWithSuccess();
        }
    }
}

// Create treasure collection effect
function createCollectEffect(x, y, value) {
    // Create a text effect showing value
    const text = `+${value}`;
    
    // Create floating text effect
    const textEffect = {
        x: x,
        y: y,
        text: text,
        life: 40,
        vy: -1.5
    };
    
    // Add the text effect to particles array for easy management
    particles.push(textEffect);
    
    // Create sparkles
    for (let i = 0; i < 12; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 2;
        
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1, // Slight upward bias
            size: 2 + Math.random() * 2,
            color: `hsl(${30 + Math.random() * 30}, 100%, 50%)`, // Gold-like colors
            life: 20 + Math.random() * 20
        });
    }
}

// Collect treasures
function collectTreasures() {
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
                
                // Increase energy
                player.energy += treasure.value;
                updateEnergyDisplay();
            }
        }
    }
    
    // Check if all treasures have been collected
    if (allCollected && treasures.length > 0 && !levelComplete) {
        completeLevelWithSuccess();
    }
}

// Complete the current level with success
function completeLevelWithSuccess() {
    console.log("Level complete!");
    levelComplete = true;
    
    // Force the level complete div to be visible
    levelCompleteDiv.style.display = 'block';
    
    // Calculate bonus based on energy and level
    const levelBonus = Math.floor(player.energy * currentLevel);
    totalScore += levelBonus;
    
    // Update UI
    levelBonusSpan.textContent = levelBonus;
    totalScoreSpan.textContent = totalScore;
    scoreDisplay.textContent = totalScore;
    
    // Start countdown to next level
    levelTransitionTimer = 3;
    updateCountdown();
}

// Update the countdown timer
function updateCountdown() {
    countdownSpan.textContent = levelTransitionTimer;
    
    if (levelTransitionTimer > 0) {
        setTimeout(() => {
            levelTransitionTimer--;
            updateCountdown();
        }, 1000);
    } else {
        // Start next level
        startNextLevel();
    }
}

// Start the next level
function startNextLevel() {
    currentLevel++;
    updateLevelDisplay();
    
    // Reset player position but keep energy and score
    player.x = canvas.width / 2;
    player.y = 300;
    player.velocityX = 0;
    player.velocityY = 0;
    
    // Generate new world
    generateWorld();
    
    // Hide level complete overlay
    levelCompleteDiv.style.display = 'none';
}

// Update level display
function updateLevelDisplay() {
    levelDisplay.textContent = currentLevel;
}

// Update energy display
function updateEnergyDisplay() {
    energyDisplay.textContent = Math.floor(player.energy);
}

// Draw game elements
function draw() {
    // Draw background with gradient sky
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, '#1e90ff'); // Dodger blue at top
    skyGradient.addColorStop(1, '#87CEEB'); // Sky blue at bottom
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw distant mountains
    drawMountains();
    
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
    
    // Draw digging effect if active
    if (digEffect) {
        drawDigEffect();
    }
    
    // Draw particles
    updateAndDrawParticles();
    
    // Draw player as Wall-E inspired robot
    drawRobot(player.x, player.y, player.width, player.height, player.facingRight);
    
    // Draw overlay when level is complete
    if (levelComplete) {
        // Draw slightly transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

// Draw mountains in the background
function drawMountains() {
    // Set mountain properties
    ctx.fillStyle = '#4a6d8c'; // Bluish gray mountains
    
    // First mountain range (far)
    ctx.beginPath();
    ctx.moveTo(0, canvas.height * 0.5);
    
    // Create jagged mountain peaks
    for (let x = 0; x < canvas.width; x += 80) {
        const height = canvas.height * 0.2 + Math.sin(x / 50) * canvas.height * 0.1;
        ctx.lineTo(x, canvas.height * 0.5 - height);
    }
    
    ctx.lineTo(canvas.width, canvas.height * 0.5);
    ctx.closePath();
    ctx.fill();
    
    // Second mountain range (closer, darker)
    ctx.fillStyle = '#3a5d7c'; 
    ctx.beginPath();
    ctx.moveTo(0, canvas.height * 0.55);
    
    for (let x = 0; x < canvas.width; x += 60) {
        const height = canvas.height * 0.15 + Math.cos(x / 40) * canvas.height * 0.08;
        ctx.lineTo(x, canvas.height * 0.55 - height);
    }
    
    ctx.lineTo(canvas.width, canvas.height * 0.55);
    ctx.closePath();
    ctx.fill();
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

// Create digging effect
function createDigEffect(x, y) {
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
function drawDigEffect() {
    if (digEffect) {
        // Draw circular blast
        ctx.beginPath();
        ctx.arc(digEffect.x, digEffect.y, digEffect.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(150, 75, 0, ${digEffect.opacity})`;
        ctx.fill();
        
        // Update effect
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

// Update and draw particles
function updateAndDrawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        
        // Update position
        p.x += p.vx || 0;
        p.y += p.vy || 0;
        if (p.vy !== undefined && !p.text) {
            p.vy += 0.1; // Gravity for non-text particles
        }
        p.life -= 1;
        
        // Check if it's a text particle
        if (p.text) {
            // Draw floating text
            ctx.font = 'bold 16px Arial';
            ctx.fillStyle = 'gold';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            
            // Calculate fade out
            const alpha = Math.min(1, p.life / 20);
            ctx.globalAlpha = alpha;
            
            // Draw text with outline
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
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// Draw a Wall-E inspired robot
function drawRobot(x, y, width, height, facingRight) {
    // Add digging animation
    const diggingOffset = player.isDigging ? Math.sin(Date.now() / 100) * 2 : 0;
    
    // Main body (slightly compressed cube)
    ctx.fillStyle = '#E8A30C'; // Wall-E yellow
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
    ctx.fillStyle = '#E8A30C';
    ctx.fillRect(x + width * 0.15, y + diggingOffset/2, width * 0.7, height * 0.25);
    
    // Eyes (binoculars style)
    ctx.fillStyle = '#333';
    if (facingRight) {
        // Right-facing eyes
        ctx.fillRect(x + width * 0.6, y + height * 0.05 + diggingOffset/2, width * 0.25, height * 0.15);
        
        // Eye details - orange when digging, blue normally
        ctx.fillStyle = player.isDigging ? '#FF9900' : '#66CCFF';
        ctx.fillRect(x + width * 0.65, y + height * 0.07 + diggingOffset/2, width * 0.15, height * 0.1);
        
        // Eyebrow - angled down when digging
        ctx.fillStyle = '#333';
        ctx.save();
        if (player.isDigging) {
            ctx.translate(x + width * 0.72, y - height * 0.02 + diggingOffset/2);
            ctx.rotate(Math.PI / 30); // Slight angle for effort
            ctx.fillRect(-width * 0.12, 0, width * 0.25, height * 0.04);
        } else {
            ctx.fillRect(x + width * 0.6, y - height * 0.02, width * 0.25, height * 0.04);
        }
        ctx.restore();
        
        // Arm (digging tool) - animated when digging
        ctx.fillStyle = '#E8A30C';
        if (player.isDigging) {
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
            if (Math.random() < 0.3) {
                particles.push({
                    x: x + width * 1.3 + Math.random() * 10,
                    y: y + height * 0.4 + Math.random() * 10,
                    vx: (Math.random() - 0.5) * 2,
                    vy: -Math.random() * 3,
                    size: 2 + Math.random() * 3,
                    color: '#8B4513',
                    life: 10 + Math.random() * 20
                });
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
        ctx.fillStyle = player.isDigging ? '#FF9900' : '#66CCFF';
        ctx.fillRect(x + width * 0.2, y + height * 0.07 + diggingOffset/2, width * 0.15, height * 0.1);
        
        // Eyebrow - angled down when digging
        ctx.fillStyle = '#333';
        ctx.save();
        if (player.isDigging) {
            ctx.translate(x + width * 0.28, y - height * 0.02 + diggingOffset/2);
            ctx.rotate(-Math.PI / 30); // Slight angle for effort
            ctx.fillRect(-width * 0.12, 0, width * 0.25, height * 0.04);
        } else {
            ctx.fillRect(x + width * 0.15, y - height * 0.02, width * 0.25, height * 0.04);
        }
        ctx.restore();
        
        // Arm (digging tool) - animated when digging
        ctx.fillStyle = '#E8A30C';
        if (player.isDigging) {
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
            if (Math.random() < 0.3) {
                particles.push({
                    x: x - width * 0.5 - Math.random() * 10,
                    y: y + height * 0.4 + Math.random() * 10,
                    vx: (Math.random() - 0.5) * 2,
                    vy: -Math.random() * 3,
                    size: 2 + Math.random() * 3,
                    color: '#8B4513',
                    life: 10 + Math.random() * 20
                });
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
    const blinkRate = player.isDigging ? 150 : 500;
    const blinkPhase = Math.floor(Date.now() / blinkRate) % 2;
    
    ctx.fillStyle = player.isDigging && blinkPhase === 0 ? '#ff6666' : 'red';
    ctx.beginPath();
    ctx.arc(x + width * 0.35, y + height * 0.45 + diggingOffset, width * 0.05, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = player.isDigging && blinkPhase === 1 ? '#66ff66' : 'green';
    ctx.beginPath();
    ctx.arc(x + width * 0.65, y + height * 0.45 + diggingOffset, width * 0.05, 0, Math.PI * 2);
    ctx.fill();
    
    // Energy meter - pulsing when digging
    const energyPercentage = Math.min(1, player.energy / 100);
    const meterPulse = player.isDigging ? 1 + Math.sin(Date.now() / 100) * 0.1 : 1;
    
    ctx.fillStyle = '#333';
    ctx.fillRect(x + width * 0.25, y + height * 0.6 + diggingOffset, width * 0.5, height * 0.1);
    
    // Energy level
    ctx.fillStyle = energyPercentage < 0.2 ? 'red' : (energyPercentage < 0.5 ? 'yellow' : 'green');
    ctx.fillRect(x + width * 0.27, y + height * 0.62 + diggingOffset, 
                width * 0.46 * energyPercentage * meterPulse, height * 0.06);
    
    // Add sweat drops when digging
    if (player.isDigging && Math.random() < 0.05) {
        particles.push({
            x: x + width * 0.5 + (Math.random() - 0.5) * width * 0.3,
            y: y + height * 0.1,
            vx: (Math.random() - 0.5) * 1,
            vy: 1 + Math.random() * 2,
            size: 2 + Math.random() * 2,
            color: 'rgba(150, 220, 255, 0.7)',
            life: 20 + Math.random() * 15
        });
    }
}

// Game loop
function gameLoop(timestamp) {
    // Calculate time elapsed
    if (!lastTimestamp) lastTimestamp = timestamp;
    const elapsed = timestamp - lastTimestamp;
    
    // Only update at our target frame rate
    if (elapsed > frameTime) {
        // Only update player if level is not complete
        if (!levelComplete) {
            // Update game state
            updatePlayer();
            
            // Check if all treasures have been collected (additional check)
            let allCollected = true;
            let hasTreasures = false;
            
            for (let i = 0; i < treasures.length; i++) {
                if (treasures[i]) {
                    hasTreasures = true;
                    if (!treasures[i].collected) {
                        allCollected = false;
                        break;
                    }
                }
            }
            
            if (hasTreasures && allCollected && !levelComplete) {
                console.log("Level complete detected in game loop!");
                completeLevelWithSuccess();
            }
        }
        
        // Draw everything
        draw();
        
        // Reset timestamp
        lastTimestamp = timestamp;
    }
    
    // Request next frame
    requestAnimationFrame(gameLoop);
}

// Start the game
init(); 