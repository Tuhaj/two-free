// Audio context initialization
let audioContext;
let sounds = {};
let isMuted = false;

// Initialize audio context
function initAudio() {
    // Only create AudioContext on user interaction
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Load all sound effects
            loadSounds();
            
            console.log("Audio context initialized");
        } catch (e) {
            console.error("Error initializing audio context:", e);
        }
    }
}

// Load sound effects
async function loadSounds() {
    try {
        await Promise.all([
            createSound('playerHit', generatePlayerHitSound),
            createSound('enemyHit', generateEnemyHitSound),
            createSound('gameOver', generateGameOverSound),
            createSound('collectTreasure', generateCollectSound),
            createSound('dig', generateDigSound),
            createSound('jump', generateJumpSound)
        ]);
        
        console.log("All sounds loaded");
    } catch (e) {
        console.error("Error loading sounds:", e);
    }
}

// Create a sound from a generator function
async function createSound(name, generatorFunction) {
    if (!audioContext) return;
    
    try {
        const buffer = await generatorFunction(audioContext);
        sounds[name] = buffer;
    } catch (e) {
        console.error(`Error creating sound '${name}':`, e);
    }
}

// Play a sound with optional parameters
export function playSound(name, volume = 1.0, rate = 1.0, pan = 0) {
    if (isMuted || !audioContext || !sounds[name]) return;
    
    try {
        // Create source
        const source = audioContext.createBufferSource();
        source.buffer = sounds[name];
        source.playbackRate.value = rate;
        
        // Create gain node for volume
        const gainNode = audioContext.createGain();
        gainNode.gain.value = volume;
        
        // Create panner if needed
        if (pan !== 0) {
            const panner = audioContext.createStereoPanner();
            panner.pan.value = pan;
            source.connect(panner);
            panner.connect(gainNode);
        } else {
            source.connect(gainNode);
        }
        
        // Connect to destination
        gainNode.connect(audioContext.destination);
        
        // Play the sound
        source.start();
        
        return source;
    } catch (e) {
        console.error(`Error playing sound '${name}':`, e);
        return null;
    }
}

// Toggle mute state
export function toggleMute() {
    isMuted = !isMuted;
    return isMuted;
}

// Set mute state
export function setMute(state) {
    isMuted = state;
    return isMuted;
}

// Initialize on user interaction
export function setupAudio() {
    // Initialize on first user interaction
    window.addEventListener('click', initAudio, { once: true });
    window.addEventListener('keydown', initAudio, { once: true });
    window.addEventListener('touchstart', initAudio, { once: true });
}

// Generate a "hit" sound effect for player damage
function generatePlayerHitSound(ctx) {
    const duration = 0.3;
    const sampleRate = ctx.sampleRate;
    const numSamples = duration * sampleRate;
    const buffer = ctx.createBuffer(1, numSamples, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const frequency = 150 + Math.exp(-t * 10) * 400;
        data[i] = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 10) * 0.5;
        
        // Add distortion/glitch effect
        if (i % 10 < 3) {
            data[i] *= 0.8 + Math.random() * 0.4;
        }
    }
    
    return buffer;
}

// Generate a hit sound for damaging enemies
function generateEnemyHitSound(ctx) {
    const duration = 0.2;
    const sampleRate = ctx.sampleRate;
    const numSamples = duration * sampleRate;
    const buffer = ctx.createBuffer(1, numSamples, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const frequency = 300 + Math.sin(t * 50) * 100;
        
        data[i] = (
            Math.sin(2 * Math.PI * frequency * t) * 0.5 +
            Math.sin(2 * Math.PI * (frequency * 1.5) * t) * 0.3
        ) * Math.exp(-t * 20);
        
        // Add metallic effect
        if (i % 8 < 4) {
            data[i] *= 0.7 + Math.random() * 0.6;
        }
    }
    
    return buffer;
}

// Generate a clean game over sound
function generateGameOverSound(ctx) {
    const duration = 0.4; // Short duration
    const sampleRate = ctx.sampleRate;
    const numSamples = duration * sampleRate;
    const buffer = ctx.createBuffer(1, numSamples, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        // Simple descending tone from 400Hz to 100Hz
        const frequency = 400 - t * 750;
        // Smooth amplitude envelope
        const amplitude = Math.exp(-t * 4) * 0.7;
        // Clean sine wave
        data[i] = Math.sin(2 * Math.PI * frequency * t) * amplitude;
    }
    
    return buffer;
}

// Generate treasure collect sound
function generateCollectSound(ctx) {
    const duration = 0.3;
    const sampleRate = ctx.sampleRate;
    const numSamples = duration * sampleRate;
    const buffer = ctx.createBuffer(1, numSamples, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        // Rising pitch effect
        const frequency = 400 + t * 1200;
        data[i] = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 8) * 0.5;
        
        // Add a harmonic
        data[i] += Math.sin(2 * Math.PI * (frequency * 1.5) * t) * Math.exp(-t * 10) * 0.3;
    }
    
    return buffer;
}

// Generate digging sound
function generateDigSound(ctx) {
    const duration = 0.15;
    const sampleRate = ctx.sampleRate;
    const numSamples = duration * sampleRate;
    const buffer = ctx.createBuffer(1, numSamples, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        // Noise + low rumble
        data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 20) * 0.3;
        data[i] += Math.sin(2 * Math.PI * 80 * t) * Math.exp(-t * 15) * 0.2;
        
        // Add some grit
        if (i % 5 < 2) {
            data[i] *= 1.4;
        }
    }
    
    return buffer;
}

// Generate jump sound
function generateJumpSound(ctx) {
    const duration = 0.2;
    const sampleRate = ctx.sampleRate;
    const numSamples = duration * sampleRate;
    const buffer = ctx.createBuffer(1, numSamples, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        // Woosh effect with falling pitch
        const frequency = 300 - t * 200;
        data[i] = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 10) * 0.25;
        
        // Add some air movement
        data[i] += (Math.random() * 2 - 1) * Math.exp(-t * 5) * 0.1;
    }
    
    return buffer;
}

export default {
    setupAudio,
    playSound,
    toggleMute,
    setMute
}; 