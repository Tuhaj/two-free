// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const energyDisplay = document.getElementById('energyDisplay');

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

// Initialize game
function init() {
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
                
                // Random treasures in dirt
                if (Math.random() < 0.1) {
                    treasures.push({
                        x: x * TILE_SIZE,
                        y: y * TILE_SIZE,
                        collected: false
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
        for (let i = 0; i < treasures.length; i++) {
            const treasure = treasures[i];
            if (!treasure.collected) {
                const treasureTileX = Math.floor(treasure.x / TILE_SIZE);
                const treasureTileY = Math.floor(treasure.y / TILE_SIZE);
                
                if (treasureTileX === digX && treasureTileY === digY) {
                    // Collect treasure through digging
                    treasure.collected = true;
                    player.energy += 5;
                    updateEnergyDisplay();
                    treasureFound = true;
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
            
            // Decrease energy only if no treasure was found
            if (!treasureFound) {
                player.energy -= 0.1;
                updateEnergyDisplay();
            }
        }
    }
}

// Collect treasures
function collectTreasures() {
    for (let i = 0; i < treasures.length; i++) {
        const treasure = treasures[i];
        if (!treasure.collected) {
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
                player.energy += 5;
                updateEnergyDisplay();
            }
        }
    }
}

// Update energy display
function updateEnergyDisplay() {
    energyDisplay.textContent = Math.floor(player.energy);
}

// Draw game elements
function draw() {
    // Clear canvas
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw world
    for (let y = 0; y < worldHeight; y++) {
        for (let x = 0; x < worldWidth; x++) {
            if (world[y][x] === 0) continue; // Skip air
            
            const tileX = x * TILE_SIZE;
            const tileY = y * TILE_SIZE;
            
            if (world[y][x] === 1) {
                // Draw dirt
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
            } else if (world[y][x] === 2) {
                // Draw stone
                ctx.fillStyle = '#696969';
                ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
            }
        }
    }
    
    // Draw treasures
    for (let i = 0; i < treasures.length; i++) {
        const treasure = treasures[i];
        if (!treasure.collected) {
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(
                treasure.x + TILE_SIZE / 2,
                treasure.y + TILE_SIZE / 2,
                TILE_SIZE / 3,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
    }
    
    // Draw player
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Draw player eye (to show direction)
    ctx.fillStyle = '#FFFFFF';
    if (player.facingRight) {
        ctx.fillRect(player.x + player.width - 10, player.y + 10, 5, 5);
    } else {
        ctx.fillRect(player.x + 5, player.y + 10, 5, 5);
    }
}

// Game loop
function gameLoop(timestamp) {
    // Calculate time elapsed
    if (!lastTimestamp) lastTimestamp = timestamp;
    const elapsed = timestamp - lastTimestamp;
    
    // Only update at our target frame rate
    if (elapsed > frameTime) {
        // Update game state
        updatePlayer();
        
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