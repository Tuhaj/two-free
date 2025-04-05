import { DOM_IDS } from './constants.js';

// DOM element references
let energyDisplay;
let levelDisplay;
let diamondDisplay;
let levelCompleteDiv;
let levelBonusSpan;
let totalDiamondsSpan;
let countdownSpan;
let achievementsDiv;
let pauseBtn;

// Initialize UI elements
export function initUI() {
    // Get all DOM elements
    energyDisplay = document.getElementById(DOM_IDS.ENERGY_DISPLAY);
    levelDisplay = document.getElementById(DOM_IDS.LEVEL_DISPLAY);
    diamondDisplay = document.getElementById(DOM_IDS.DIAMOND_DISPLAY);
    levelCompleteDiv = document.getElementById(DOM_IDS.LEVEL_COMPLETE);
    levelBonusSpan = document.getElementById(DOM_IDS.LEVEL_BONUS);
    totalDiamondsSpan = document.getElementById(DOM_IDS.TOTAL_DIAMONDS);
    countdownSpan = document.getElementById(DOM_IDS.COUNTDOWN);
    achievementsDiv = document.getElementById(DOM_IDS.ACHIEVEMENTS);
    pauseBtn = document.getElementById(DOM_IDS.PAUSE_BTN);
    
    // Initial update
    updateLevelDisplay(1);
    updateEnergyDisplay(10);
    updateDiamondDisplay(0);
}

// Update energy display
export function updateEnergyDisplay(energy) {
    if (energyDisplay) {
        energyDisplay.textContent = Math.floor(energy);
    }
}

// Update level display
export function updateLevelDisplay(level) {
    if (levelDisplay) {
        levelDisplay.textContent = level;
    }
}

// Update diamond display with visual diamonds
export function updateDiamondDisplay(totalDiamonds = 0) {
    if (!diamondDisplay) return;
    
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
}

// Show level complete UI
export function showLevelComplete(levelBonus, totalDiamonds) {
    if (!levelCompleteDiv || !levelBonusSpan || !totalDiamondsSpan) return;
    
    // Update UI values
    levelBonusSpan.textContent = levelBonus;
    totalDiamondsSpan.textContent = totalDiamonds;
    
    // Show the div
    levelCompleteDiv.style.display = 'block';
}

// Hide level complete UI
export function hideLevelComplete() {
    if (levelCompleteDiv) {
        levelCompleteDiv.style.display = 'none';
    }
}

// Update countdown timer
export function updateCountdown(time) {
    if (countdownSpan) {
        countdownSpan.textContent = time;
    }
}

// Show achievement notification
export function showAchievementNotification(achievement) {
    if (!achievementsDiv) return;
    
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
}

// Update pause button appearance
export function updatePauseButtonAppearance(isPaused) {
    if (pauseBtn) {
        pauseBtn.innerHTML = isPaused ? '▶️' : '⏸️';
    }
}

// Handle window resize
export function handleResize(canvas) {
    // Make sure the canvas maintains aspect ratio but fits the screen
    const gameContainer = document.getElementById('game-container');
    if (!gameContainer || !canvas) return;
    
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