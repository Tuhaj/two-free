import { TILE_SIZE, TILE_AIR, TILE_DIRT, TILE_STONE } from './constants.js';

// Generate world with terrain and treasures
export function generateWorld(worldWidth, worldHeight, currentLevel) {
    // Initialize world and treasures
    const world = [];
    const treasures = [];
    
    // Initialize empty world
    for (let y = 0; y < worldHeight; y++) {
        world[y] = [];
        for (let x = 0; x < worldWidth; x++) {
            // Sky
            if (y < worldHeight - 6) {
                world[y][x] = TILE_AIR; // 0 = air
            }
            // Dirt layer
            else if (y < worldHeight - 1) {
                world[y][x] = TILE_DIRT; // 1 = dirt
                
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
                world[y][x] = TILE_STONE; // 2 = stone
            }
        }
    }
    
    return { world, treasures };
}

// Get the tile at a given position
export function getTileAtPosition(world, x, y, worldWidth, worldHeight) {
    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor(y / TILE_SIZE);
    
    if (tileX < 0 || tileX >= worldWidth || tileY < 0 || tileY >= worldHeight) {
        return null;
    }
    
    return { 
        value: world[tileY][tileX],
        x: tileX,
        y: tileY,
        left: tileX * TILE_SIZE,
        top: tileY * TILE_SIZE,
        right: (tileX + 1) * TILE_SIZE,
        bottom: (tileY + 1) * TILE_SIZE
    };
}

// Check if an object is colliding with a tile
export function isColliding(x, y, width, height, tileX, tileY) {
    const tileLeft = tileX * TILE_SIZE;
    const tileRight = tileLeft + TILE_SIZE;
    const tileTop = tileY * TILE_SIZE;
    const tileBottom = tileTop + TILE_SIZE;
    
    return (
        x + width > tileLeft &&
        x < tileRight &&
        y + height > tileTop &&
        y < tileBottom
    );
}

// Create a missile impact in the world - destroying blocks
export function createMissileImpact(world, worldWidth, worldHeight, x, y, impactRadius) {
    // Destroy terrain in a radius around the impact
    const centerTileX = Math.floor(x / TILE_SIZE);
    const centerTileY = Math.floor(y / TILE_SIZE);
    const destroyedTiles = [];
    
    for (let ty = Math.max(0, centerTileY - impactRadius); ty <= Math.min(worldHeight - 1, centerTileY + impactRadius); ty++) {
        for (let tx = Math.max(0, centerTileX - impactRadius); tx <= Math.min(worldWidth - 1, centerTileX + impactRadius); tx++) {
            // Calculate distance from center
            const distance = Math.sqrt(Math.pow(tx - centerTileX, 2) + Math.pow(ty - centerTileY, 2));
            
            // Remove blocks within the radius
            if (distance <= impactRadius && world[ty][tx] === TILE_DIRT) {
                // Sometimes leave blocks at the edge for a more natural look
                if (distance > impactRadius - 0.5 && Math.random() < 0.3) {
                    continue;
                }
                
                // Store info about the destroyed tile
                destroyedTiles.push({
                    x: tx * TILE_SIZE + TILE_SIZE / 2,
                    y: ty * TILE_SIZE + TILE_SIZE / 2,
                    type: world[ty][tx]
                });
                
                // Remove the block
                world[ty][tx] = TILE_AIR;
            }
        }
    }
    
    return destroyedTiles;
} 