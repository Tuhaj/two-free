// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const energyDisplay = document.getElementById('energyDisplay');
const levelDisplay = document.getElementById('levelDisplay');
const diamondDisplay = document.getElementById('diamondDisplay');
const levelCompleteDiv = document.getElementById('level-complete');
const levelBonusSpan = document.getElementById('levelBonus');
const totalDiamondsSpan = document.getElementById('totalDiamonds');
const countdownSpan = document.getElementById('countdown');
const achievementsDiv = document.getElementById('achievements');

// Touch control elements
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const jumpBtn = document.getElementById('jumpBtn');
const digBtn = document.getElementById('digBtn');
const pauseBtn = document.getElementById('pauseBtn');

// Game settings
const GRAVITY = 0.5;
const JUMP_FORCE = -12;
const MOVEMENT_SPEED = 5;
const DIG_SPEED = 3;
const TILE_SIZE = 32;

// War background elements
let warBackgroundElements = {
    explosions: [],
    missiles: [],
    smokeClouds: []
};

// Missile attack system
const MISSILE_ATTACK_INTERVAL_MIN = 8000; // 8 seconds minimum between attacks
const MISSILE_ATTACK_INTERVAL_MAX = 12000; // 12 seconds maximum between attacks
const WARNING_DURATION = 3000; // 3 seconds of warning before missile hits
let nextMissileAttack = Date.now() + getRandomInterval();
let missileWarning = false;
let missileWarningStarted = 0;
let incomingMissile = null;
let playerHit = false;
let hitTime = 0;

// Game state
let currentLevel = 1;
let totalDiamonds = 0;
let levelComplete = false;
let levelTransitionTimer = 0;
let gamePaused = false;

// Achievements system
const achievements = [
    {id: 'first_treasure', title: 'First Treasure', description: 'Find your first treasure', icon: '💎', reached: false, threshold: 1},
    {id: 'treasure_hunter', title: 'Treasure Hunter', description: 'Collect 10 diamonds', icon: '🏆', reached: false, threshold: 10},
    {id: 'master_digger', title: 'Master Digger', description: 'Collect 25 diamonds', icon: '⛏️', reached: false, threshold: 25},
    {id: 'diamond_expert', title: 'Diamond Expert', description: 'Collect 50 diamonds', icon: '👑', reached: false, threshold: 50},
    {id: 'millionaire', title: 'Millionaire', description: 'Collect 100 diamonds', icon: '💰', reached: false, threshold: 100},
    {id: 'level_5', title: 'Deep Explorer', description: 'Reach level 5', icon: '🔍', reached: false, threshold: 5, isLevel: true},
    {id: 'level_10', title: 'Core Dweller', description: 'Reach level 10', icon: '🔥', reached: false, threshold: 10, isLevel: true},
    {id: 'energy_max', title: 'Power Up', description: 'Reach 50 energy', icon: '⚡', reached: false, threshold: 50, isEnergy: true},
    {id: 'energy_super', title: 'Super Charged', description: 'Reach 100 energy', icon: '⚡⚡', reached: false, threshold: 100, isEnergy: true}
];

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
    totalDiamonds = 0;
    gamePaused = false;
    
    // Reset achievements
    achievements.forEach(achievement => {
        achievement.reached = false;
    });
    
    // Update displays
    updateLevelDisplay();
    updateDiamondDisplay();
    updatePauseButtonAppearance();
    
    // Generate world terrain
    generateWorld();
    
    // Create initial background war elements
    createInitialWarBackground();
    
    // Add event listeners for keyboard controls
    window.addEventListener('keydown', e => keys[e.key] = true);
    window.addEventListener('keyup', e => keys[e.key] = false);
    
    // Add event listeners for touch controls
    setupTouchControls();
    
    // Handle window resize
    window.addEventListener('resize', handleResize);
    handleResize();
    
    // Auto-pause when window loses focus
    window.addEventListener('blur', () => {
        if (!gamePaused) {
            gamePaused = true;
        }
    });
    
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
    
    // Pause button
    pauseBtn.addEventListener('touchstart', () => {
        togglePause();
    });
    pauseBtn.addEventListener('mousedown', () => {
        togglePause();
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
    
    // Keyboard pause
    window.addEventListener('keydown', (e) => {
        if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
            togglePause();
        }
    });
}

// Toggle pause state
function togglePause() {
    gamePaused = !gamePaused;
    updatePauseButtonAppearance();
}

// Update pause button appearance based on game state
function updatePauseButtonAppearance() {
    if (pauseBtn) {
        pauseBtn.innerHTML = gamePaused ? '▶️' : '⏸️';
    }
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
                
                // Increase energy and diamonds
                player.energy += treasure.value;
                totalDiamonds += treasure.value;
                
                // Update displays
                updateEnergyDisplay();
                updateDiamondDisplay();
                
                // Create collection effect
                createCollectEffect(treasure.x + TILE_SIZE/2, treasure.y + TILE_SIZE/2, treasure.value);
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
    totalDiamonds += levelBonus;
    
    // Update UI
    levelBonusSpan.textContent = levelBonus;
    totalDiamondsSpan.textContent = totalDiamonds;
    updateDiamondDisplay();
    
    // Check for level-related achievements
    checkAchievements();
    
    // Start countdown to next level
    levelTransitionTimer = 3;
    updateCountdown();
}

// Update the countdown timer
function updateCountdown() {
    countdownSpan.textContent = levelTransitionTimer;
    
    if (levelTransitionTimer > 0) {
        setTimeout(() => {
            // Only decrease the timer if the game is not paused
            if (!gamePaused) {
                levelTransitionTimer--;
            }
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
    
    // Check for level-based achievements
    checkAchievements();
    
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
    skyGradient.addColorStop(0, '#1e3a5a'); // Darker blue for war sky
    skyGradient.addColorStop(1, '#576b84'); // Grayish blue at bottom
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw distant mountains
    drawMountains();
    
    // Draw war background elements (explosions, missiles, smoke)
    drawWarBackground();
    
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
    
    // Draw missile warning or incoming missile
    drawMissileWarning();
    
    // Draw player as Wall-E inspired robot
    drawRobot(player.x, player.y, player.width, player.height, player.facingRight);
    
    // Draw "hidden" indicator if player is hidden underground
    if (isPlayerHidden()) {
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
    drawPlayerHitEffect();
    
    // Draw overlay when level is complete
    if (levelComplete) {
        // Draw slightly transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
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

// Update and draw particles
function updateAndDrawParticles() {
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
        
        // Remove dead particles only if not paused
        if (p.life <= 0 && !gamePaused) {
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
        // Skip updates if game is paused, but still draw
        if (!gamePaused) {
            // Update missiles and war background elements
            updateMissiles();
            
            // Only update player if level is not complete and not hit by missile
            if (!levelComplete && !(playerHit && Date.now() - hitTime < 500)) {
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
        }
        
        // Draw everything
        draw();
        
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

// Draw pause overlay
function drawPauseOverlay() {
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

// Start the game
init();

// Update diamond display with visual diamonds
function updateDiamondDisplay() {
    // Generate diamond icons based on count
    let diamondHTML = '';
    const displayDiamonds = Math.min(totalDiamonds, 50); // Cap visual display at 50 diamonds
    
    // Show diamond icons for small numbers
    if (displayDiamonds <= 10) {
        for (let i = 0; i < displayDiamonds; i++) {
            diamondHTML += '💎';
        }
    } else {
        // For larger numbers, show some diamonds and the number
        diamondHTML = '💎'.repeat(5) + ' x' + totalDiamonds;
    }
    
    // Update the display
    diamondDisplay.innerHTML = diamondHTML;
    
    // Check achievements
    checkAchievements();
}

// Check if any achievements have been reached
function checkAchievements() {
    let newAchievements = false;
    
    achievements.forEach(achievement => {
        if (!achievement.reached) {
            if (
                (achievement.isLevel && currentLevel >= achievement.threshold) || 
                (achievement.isEnergy && player.energy >= achievement.threshold) ||
                (!achievement.isLevel && !achievement.isEnergy && totalDiamonds >= achievement.threshold)
            ) {
                achievement.reached = true;
                showAchievementNotification(achievement);
                newAchievements = true;
            }
        }
    });
    
    return newAchievements;
}

// Show achievement notification
function showAchievementNotification(achievement) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.style.backgroundColor = 'rgba(0, 20, 40, 0.9)';
    notification.style.color = '#fff';
    notification.style.padding = '15px';
    notification.style.borderRadius = '10px';
    notification.style.marginBottom = '10px';
    notification.style.boxShadow = '0 0 20px rgba(102, 204, 255, 0.7)';
    notification.style.border = '2px solid #66CCFF';
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100px)';
    notification.style.transition = 'all 0.5s ease';
    
    // Add content
    notification.innerHTML = `
        <div style="display: flex; align-items: center;">
            <div style="font-size: 32px; margin-right: 10px;">${achievement.icon}</div>
            <div>
                <div style="font-weight: bold; color: gold;">${achievement.title}</div>
                <div style="font-size: 0.8em;">${achievement.description}</div>
            </div>
        </div>
    `;
    
    // Add to achievements div
    achievementsDiv.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 50);
    
    // Remove after delay
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100px)';
        
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 5000);
    
    // Play achievement sound (could be implemented later)
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
                    
                    // Increase energy and diamonds
                    player.energy += treasureValue;
                    totalDiamonds += treasureValue;
                    
                    // Update displays
                    updateEnergyDisplay();
                    updateDiamondDisplay();
                    
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
                
                // Check energy achievements
                checkAchievements();
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
    const text = `+${value} 💎`;
    
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
            color: `hsl(${200 + Math.random() * 40}, 100%, 50%)`, // Blue diamond-like colors
            life: 20 + Math.random() * 20
        });
    }
}

// Get random interval for missile attacks
function getRandomInterval() {
    return MISSILE_ATTACK_INTERVAL_MIN + Math.random() * (MISSILE_ATTACK_INTERVAL_MAX - MISSILE_ATTACK_INTERVAL_MIN);
}

// Check if player is hidden (safe from missile)
function isPlayerHidden() {
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

// Create a background explosion
function createBackgroundExplosion(x, y, size) {
    warBackgroundElements.explosions.push({
        x: x,
        y: y,
        size: size,
        frame: 0,
        maxFrames: 20,
        color: `hsl(${30 + Math.random() * 20}, 100%, ${50 + Math.random() * 50}%)`
    });
    
    // Create smoke clouds from explosion
    for (let i = 0; i < 3; i++) {
        createSmokeCloud(
            x + (Math.random() - 0.5) * size * 2,
            y + (Math.random() - 0.5) * size,
            size * 0.7 + Math.random() * size * 0.5
        );
    }
}

// Create a smoke cloud
function createSmokeCloud(x, y, size) {
    warBackgroundElements.smokeClouds.push({
        x: x,
        y: y,
        size: size,
        vx: (Math.random() - 0.5) * 0.5, // Slight horizontal drift
        life: 100 + Math.random() * 200,
        maxLife: 100 + Math.random() * 200,
        color: `rgba(${100 + Math.random() * 50}, ${100 + Math.random() * 50}, ${100 + Math.random() * 50}, 0.7)`
    });
}

// Create a distant missile for background effect
function createDistantMissile() {
    const missile = {
        x: Math.random() * canvas.width,
        y: -20,
        targetX: Math.random() * canvas.width,
        targetY: canvas.height * 0.4 + Math.random() * canvas.height * 0.1,
        speed: 3 + Math.random() * 2,
        size: 2 + Math.random() * 3,
        trail: [],
        isBackground: true,
        exploded: false
    };
    
    // Calculate the angle
    const dx = missile.targetX - missile.x;
    const dy = missile.targetY - missile.y;
    missile.angle = Math.atan2(dy, dx);
    
    warBackgroundElements.missiles.push(missile);
}

// Create an incoming missile attack targeted at player
function createIncomingMissile() {
    // Only create if there isn't already an incoming missile
    if (!incomingMissile) {
        // Target a bit ahead of player's position
        const playerDirection = player.velocityX > 0 ? 1 : (player.velocityX < 0 ? -1 : 0);
        const targetX = player.x + player.width / 2 + (playerDirection * player.width * 2);
        
        incomingMissile = {
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
            const tileX = Math.floor(incomingMissile.targetX / TILE_SIZE);
            if (
                tileX >= 0 && 
                tileX < worldWidth && 
                world[y] && 
                world[y][tileX] && 
                world[y][tileX] !== 0
            ) {
                incomingMissile.targetY = y * TILE_SIZE;
                break;
            }
        }
        
        // Calculate the angle
        const dx = incomingMissile.targetX - incomingMissile.x;
        const dy = incomingMissile.targetY - incomingMissile.y;
        incomingMissile.angle = Math.atan2(dy, dx);
        
        // Start the warning
        missileWarning = true;
        missileWarningStarted = Date.now();
    }
}

// Update missile positions
function updateMissiles() {
    const currentTime = Date.now();
    
    // Create random background missiles
    if (!gamePaused && Math.random() < 0.01 && warBackgroundElements.missiles.length < 5) {
        createDistantMissile();
    }
    
    // Check if it's time for a missile attack
    if (!gamePaused && currentTime >= nextMissileAttack && !levelComplete && !missileWarning && !incomingMissile) {
        createIncomingMissile();
    }
    
    // Update background missiles
    warBackgroundElements.missiles = warBackgroundElements.missiles.filter(missile => {
        if (missile.exploded) return false;
        
        // Move missile (only if game not paused)
        if (!gamePaused) {
            const vx = Math.cos(missile.angle) * missile.speed;
            const vy = Math.sin(missile.angle) * missile.speed;
            missile.x += vx;
            missile.y += vy;
            
            // Add to trail
            missile.trail.push({x: missile.x, y: missile.y, age: 0});
        }
        
        // Check if missile has reached its target
        const dx = missile.targetX - missile.x;
        const dy = missile.targetY - missile.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If target reached, explode
        if (distance < 5) {
            missile.exploded = true;
            
            // If it's a background missile, just make a small explosion
            if (missile.isBackground) {
                createBackgroundExplosion(missile.targetX, missile.targetY, 30 + Math.random() * 20);
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
    if (incomingMissile) {
        // If warning phase is complete, move the missile
        if (!gamePaused && currentTime - missileWarningStarted >= WARNING_DURATION) {
            missileWarning = false;
            
            // Move missile
            const vx = Math.cos(incomingMissile.angle) * incomingMissile.speed;
            const vy = Math.sin(incomingMissile.angle) * incomingMissile.speed;
            incomingMissile.x += vx;
            incomingMissile.y += vy;
            
            // Add to trail
            incomingMissile.trail.push({x: incomingMissile.x, y: incomingMissile.y, age: 0});
            
            // Check if missile has reached its target
            const dx = incomingMissile.targetX - incomingMissile.x;
            const dy = incomingMissile.targetY - incomingMissile.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // If target reached, explode
            if (distance < 5) {
                createMissileImpact(incomingMissile.targetX, incomingMissile.targetY);
                incomingMissile = null;
                nextMissileAttack = currentTime + getRandomInterval();
            }
        }
    }
    
    // Update missile trails
    for (let missile of warBackgroundElements.missiles.concat(incomingMissile ? [incomingMissile] : [])) {
        if (missile && !gamePaused) {
            missile.trail = missile.trail.filter(point => {
                point.age++;
                return point.age < 20; // Trail length
            });
        }
    }
    
    // Update background explosions
    warBackgroundElements.explosions = warBackgroundElements.explosions.filter(explosion => {
        if (!gamePaused) explosion.frame++;
        return explosion.frame < explosion.maxFrames;
    });
    
    // Update smoke clouds
    warBackgroundElements.smokeClouds = warBackgroundElements.smokeClouds.filter(cloud => {
        if (!gamePaused) {
            cloud.x += cloud.vx;
            cloud.life--;
        }
        return cloud.life > 0;
    });
}

// Create a missile impact - destroys terrain and possibly damages player
function createMissileImpact(x, y) {
    // Create a large explosion
    createBackgroundExplosion(x, y, 80);
    
    // Destroy terrain in a radius around the impact
    const impactRadius = 3; // In tiles
    const centerTileX = Math.floor(x / TILE_SIZE);
    const centerTileY = Math.floor(y / TILE_SIZE);
    
    for (let ty = Math.max(0, centerTileY - impactRadius); ty <= Math.min(worldHeight - 1, centerTileY + impactRadius); ty++) {
        for (let tx = Math.max(0, centerTileX - impactRadius); tx <= Math.min(worldWidth - 1, centerTileX + impactRadius); tx++) {
            // Calculate distance from center
            const distance = Math.sqrt(Math.pow(tx - centerTileX, 2) + Math.pow(ty - centerTileY, 2));
            
            // Remove blocks within the radius
            if (distance <= impactRadius && world[ty][tx] === 1) {
                // Sometimes leave blocks at the edge for a more natural look
                if (distance > impactRadius - 0.5 && Math.random() < 0.3) {
                    continue;
                }
                
                world[ty][tx] = 0;
                
                // Create debris particles
                for (let i = 0; i < 3; i++) {
                    particles.push({
                        x: tx * TILE_SIZE + TILE_SIZE / 2,
                        y: ty * TILE_SIZE + TILE_SIZE / 2,
                        vx: (Math.random() - 0.5) * 8,
                        vy: (Math.random() - 0.5) * 8 - 2,
                        size: 2 + Math.random() * 4,
                        color: '#8B4513',
                        life: 30 + Math.random() * 30
                    });
                }
            }
        }
    }
    
    // Check if player is hit
    const playerCenterX = player.x + player.width / 2;
    const playerCenterY = player.y + player.height / 2;
    const dx = playerCenterX - x;
    const dy = playerCenterY - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // If player is near the impact and not hidden
    if (distance < impactRadius * TILE_SIZE && !isPlayerHidden()) {
        // Player is hit!
        playerHit = true;
        hitTime = Date.now();
        
        // Reduce energy
        player.energy = Math.max(0, player.energy - 25);
        updateEnergyDisplay();
        
        // Apply knockback
        const knockbackDirection = dx < 0 ? -1 : 1;
        player.velocityX = knockbackDirection * 15;
        player.velocityY = -10;
    }
}

// Draw the war background elements
function drawWarBackground() {
    // Draw background explosions
    for (let explosion of warBackgroundElements.explosions) {
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
    for (let cloud of warBackgroundElements.smokeClouds) {
        const alpha = (cloud.life / cloud.maxLife) * 0.7;
        ctx.fillStyle = cloud.color.replace(')', `, ${alpha})`).replace('rgba', 'rgba');
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Draw background missiles and trails
    for (let missile of warBackgroundElements.missiles) {
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
function drawMissileWarning() {
    if (missileWarning && incomingMissile) {
        // Flash warning indicator
        incomingMissile.warningFrame++;
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
function drawPlayerHitEffect() {
    if (playerHit) {
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
        } else {
            playerHit = false;
        }
    }
}

// Create initial background war elements
function createInitialWarBackground() {
    // Create some initial explosions
    for (let i = 0; i < 5; i++) {
        createBackgroundExplosion(
            Math.random() * canvas.width,
            Math.random() * canvas.height * 0.4,
            30 + Math.random() * 20
        );
    }
    
    // Create initial smoke clouds
    for (let i = 0; i < 10; i++) {
        createSmokeCloud(
            Math.random() * canvas.width,
            Math.random() * canvas.height * 0.3,
            20 + Math.random() * 30
        );
    }
    
    // Create initial missiles
    for (let i = 0; i < 3; i++) {
        createDistantMissile();
    }
} 