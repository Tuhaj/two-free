import { DOM_IDS } from './constants.js';

// DOM element references
let leftBtn;
let rightBtn;
let jumpBtn;
let digBtn;
let shootBtn;
let pauseBtn;

// Control states
export const keys = {};
export const touchControls = {
    left: false,
    right: false,
    jump: false,
    dig: false,
    shoot: false,
    fire: false,
    lastLeftTouch: 0,
    lastRightTouch: 0
};

// Setup controls
export function setupControls(togglePauseCallback) {
    // Get DOM elements
    leftBtn = document.getElementById(DOM_IDS.LEFT_BTN);
    rightBtn = document.getElementById(DOM_IDS.RIGHT_BTN);
    jumpBtn = document.getElementById(DOM_IDS.JUMP_BTN);
    digBtn = document.getElementById(DOM_IDS.DIG_BTN);
    shootBtn = document.getElementById(DOM_IDS.SHOOT_BTN);
    pauseBtn = document.getElementById(DOM_IDS.PAUSE_BTN);
    
    // Clear any existing control states
    for (const key in keys) {
        delete keys[key];
    }
    
    touchControls.left = false;
    touchControls.right = false;
    touchControls.jump = false;
    touchControls.dig = false;
    touchControls.shoot = false;
    touchControls.fire = false;
    
    // Add keyboard event listeners
    window.addEventListener('keydown', e => keys[e.key] = true);
    window.addEventListener('keyup', e => keys[e.key] = false);
    
    // Add special keyboard events for tracking press time
    window.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'a') {
            keys.lastLeftPress = Date.now();
        } else if (e.key === 'ArrowRight' || e.key === 'd') {
            keys.lastRightPress = Date.now();
        } else if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
            togglePauseCallback();
        }
    });
    
    // Setup touch controls
    setupTouchControls(togglePauseCallback);
    
    // Handle window blur/focus
    window.addEventListener('blur', () => {
        // Auto-pause game when window loses focus
        if (!window.gamePaused) {
            togglePauseCallback();
        }
    });
    
    // Set up pause button click handler
    if (pauseBtn) {
        // Remove any existing listeners
        const newPauseBtn = pauseBtn.cloneNode(true);
        pauseBtn.parentNode.replaceChild(newPauseBtn, pauseBtn);
        pauseBtn = newPauseBtn;
        
        // Add click handler for mouse
        pauseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            togglePauseCallback();
        });
        
        // Add touch handler for mobile
        pauseBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            togglePauseCallback();
        });
    }
}

// Setup touch controls
function setupTouchControls(togglePauseCallback) {
    if (!leftBtn || !rightBtn || !jumpBtn || !digBtn || !shootBtn) {
        console.error('Touch control elements not found');
        return;
    }
    
    // Prevent default touch behaviors on the control buttons
    const controlButtons = document.querySelectorAll('.control-btn');
    controlButtons.forEach(btn => {
        btn.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
        btn.addEventListener('touchend', e => e.preventDefault(), { passive: false });
        btn.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
    });
    
    // Left button
    leftBtn.addEventListener('touchstart', () => {
        touchControls.left = true;
        touchControls.lastLeftTouch = Date.now();
    }, { passive: true });
    leftBtn.addEventListener('touchend', () => {
        touchControls.left = false;
    }, { passive: true });
    
    // Right button
    rightBtn.addEventListener('touchstart', () => {
        touchControls.right = true;
        touchControls.lastRightTouch = Date.now();
    }, { passive: true });
    rightBtn.addEventListener('touchend', () => {
        touchControls.right = false;
    }, { passive: true });
    
    // Jump button
    jumpBtn.addEventListener('touchstart', () => {
        touchControls.jump = true;
    }, { passive: true });
    jumpBtn.addEventListener('touchend', () => {
        touchControls.jump = false;
    }, { passive: true });
    
    // Dig button
    digBtn.addEventListener('touchstart', () => {
        touchControls.dig = true;
    }, { passive: true });
    digBtn.addEventListener('touchend', () => {
        touchControls.dig = false;
    }, { passive: true });
    
    // Shoot button
    shootBtn.addEventListener('touchstart', () => {
        touchControls.shoot = true;
    }, { passive: true });
    shootBtn.addEventListener('touchend', () => {
        touchControls.shoot = false;
    }, { passive: true });
    
    // Pause button
    pauseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        togglePauseCallback();
    });
    
    // Also handle touch events for mobile
    pauseBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        togglePauseCallback();
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
    
    shootBtn.addEventListener('mousedown', () => touchControls.shoot = true);
    shootBtn.addEventListener('mouseup', () => touchControls.shoot = false);
    shootBtn.addEventListener('mouseleave', () => touchControls.shoot = false);
} 