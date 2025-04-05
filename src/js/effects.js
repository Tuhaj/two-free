import { createTextParticle } from './renderer.js';

// Create treasure collection effect
export function createCollectEffect(x, y, value) {
    // Create a text effect showing value
    const text = `+${value} 💎`;
    
    // Create floating text effect
    createTextParticle(x, y, text);
    
    // Create sparkle effect - implementation depends on renderer
    createSparkles(x, y);
}

// Create background explosion effect
export function createBackgroundExplosion(x, y, size, warBackgroundElements) {
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
            size * 0.7 + Math.random() * size * 0.5,
            warBackgroundElements
        );
    }
}

// Create a smoke cloud
export function createSmokeCloud(x, y, size, warBackgroundElements) {
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
export function createDistantMissile(canvas, warBackgroundElements) {
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

// Create sparkles for special effects
function createSparkles(x, y) {
    // This should be implemented if we have a global particle system
    // For now it's left as a placeholder
}

// Initialize war background elements
export function createInitialWarBackground(canvas, warBackgroundElements) {
    // Create some initial explosions
    for (let i = 0; i < 5; i++) {
        createBackgroundExplosion(
            Math.random() * canvas.width,
            Math.random() * canvas.height * 0.4,
            30 + Math.random() * 20,
            warBackgroundElements
        );
    }
    
    // Create initial smoke clouds
    for (let i = 0; i < 10; i++) {
        createSmokeCloud(
            Math.random() * canvas.width,
            Math.random() * canvas.height * 0.3,
            20 + Math.random() * 30,
            warBackgroundElements
        );
    }
    
    // Create initial missiles
    for (let i = 0; i < 3; i++) {
        createDistantMissile(canvas, warBackgroundElements);
    }
} 