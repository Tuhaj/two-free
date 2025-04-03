// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const energyDisplay = document.getElementById('energyDisplay');

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

// Initialize game
function init() {
    // Generate world terrain
    generateWorld();
    
    // Add event listeners for controls
    window.addEventListener('keydown', e => keys[e.key] = true);
    window.addEventListener('keyup', e => keys[e.key] = false);
    
    // Start game loop
    requestAnimationFrame(gameLoop);
    
    // Update energy display
    updateEnergyDisplay();
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
    // Handle horizontal movement
    if (keys['ArrowLeft'] || keys['a']) {
        player.velocityX = -MOVEMENT_SPEED * (1 + player.energy / 50);
        player.facingRight = false;
    } else if (keys['ArrowRight'] || keys['d']) {
        player.velocityX = MOVEMENT_SPEED * (1 + player.energy / 50);
        player.facingRight = true;
    } else {
        player.velocityX = 0;
    }
    
    // Handle jumping
    if ((keys['ArrowUp'] || keys['w'] || keys[' ']) && !player.isJumping) {
        player.velocityY = JUMP_FORCE;
        player.isJumping = true;
    }
    
    // Handle digging
    player.isDigging = keys['ArrowDown'] || keys['s'];
    if (player.isDigging && player.energy > 0) {
        dig();
    }
    
    // Apply gravity
    player.velocityY += GRAVITY;
    
    // Update position
    player.x += player.velocityX;
    player.y += player.velocityY;
    
    // Boundary checks
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    
    // Collision detection with terrain
    handleCollisions();
    
    // Collect treasures
    collectTreasures();
}

// Handle player collision with terrain
function handleCollisions() {
    // Get player's tile position
    const tileX = Math.floor(player.x / TILE_SIZE);
    const tileY = Math.floor(player.y / TILE_SIZE);
    
    // Check tiles around player
    for (let y = tileY - 1; y <= tileY + 2; y++) {
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
                // Horizontal collision resolution
                if (player.velocityX > 0) {
                    player.x = tileLeft - player.width;
                } else if (player.velocityX < 0) {
                    player.x = tileRight;
                }
                
                // Vertical collision resolution
                if (player.velocityY > 0) {
                    player.y = tileTop - player.height;
                    player.velocityY = 0;
                    player.isJumping = false;
                } else if (player.velocityY < 0) {
                    player.y = tileBottom;
                    player.velocityY = 0;
                }
            }
        }
    }
}

// Dig through terrain
function dig() {
    if (player.isDigging && player.energy > 0) {
        // Calculate dig position based on player facing direction
        const digX = Math.floor((player.x + (player.facingRight ? player.width : 0)) / TILE_SIZE);
        const digY = Math.floor((player.y + player.height) / TILE_SIZE);
        
        // Check if valid dig location
        if (
            digX >= 0 && digX < worldWidth &&
            digY >= 0 && digY < worldHeight &&
            world[digY][digX] === 1 // Only dig through dirt
        ) {
            // Remove the block
            world[digY][digX] = 0;
            
            // Decrease energy
            player.energy -= 0.1;
            updateEnergyDisplay();
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
function gameLoop() {
    updatePlayer();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start the game
init(); 