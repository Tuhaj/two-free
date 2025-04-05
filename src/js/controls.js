import { DOM_IDS } from './constants.js';

// Controls state
export const keys = {};
export const touchControls = {
    left: false,
    right: false,
    jump: false,
    dig: false,
    lastLeftTouch: 0,
    lastRightTouch: 0
};

// DOM element references
let leftBtn;
let rightBtn;
let jumpBtn;
let digBtn;
let pauseBtn;

// Setup controls
export function setupControls(togglePauseCallback) {
    // Get DOM elements
    leftBtn = document.getElementById(DOM_IDS.LEFT_BTN);
    rightBtn = document.getElementById(DOM_IDS.RIGHT_BTN);
    jumpBtn = document.getElementById(DOM_IDS.JUMP_BTN);
    digBtn = document.getElementById(DOM_IDS.DIG_BTN);
    pauseBtn = document.getElementById(DOM_IDS.PAUSE_BTN);
    
    // Clear any existing control states
    for (const key in keys) {
        delete keys[key];
    }
    
    touchControls.left = false;
    touchControls.right = false;
    touchControls.jump = false;
    touchControls.dig = false;
    
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
}

// Setup touch controls
function setupTouchControls(togglePauseCallback) {
    if (!leftBtn || !rightBtn || !jumpBtn || !digBtn || !pauseBtn) {
        console.error('Touch control elements not found');
        return;
    }
    
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
    
    pauseBtn.addEventListener('mousedown', () => {
        togglePauseCallback();
    });
} 