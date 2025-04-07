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
let entryScreen;
let startGameBtn;

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
    entryScreen = document.getElementById(DOM_IDS.ENTRY_SCREEN);
    startGameBtn = document.getElementById(DOM_IDS.START_GAME_BTN);
    
    // Initial update
    updateLevelDisplay(1);
    updateEnergyDisplay(10);
    updateDiamondDisplay(0);
    
    // Initially hide the pause button until game starts
    if (pauseBtn) {
        pauseBtn.style.display = 'none';
    }
}

// Show entry screen
export function showEntryScreen() {
    if (entryScreen) {
        entryScreen.style.display = 'flex';
    }
}

// Hide entry screen with transition
export function hideEntryScreen() {
    if (entryScreen) {
        // Add fade out transition
        entryScreen.style.opacity = '0';
        entryScreen.style.transition = 'opacity 0.8s ease';
        
        // Remove from DOM after transition
        setTimeout(() => {
            entryScreen.style.display = 'none';
            
            // Show the pause button after game starts
            if (pauseBtn) {
                pauseBtn.style.display = 'flex';
            }
        }, 800);
    }
}

// Set up entry screen event handlers
export function setupEntryScreen(startGameCallback) {
    if (startGameBtn) {
        // Add hover effect
        startGameBtn.addEventListener('mouseover', () => {
            startGameBtn.style.backgroundColor = 'rgba(102, 204, 255, 0.5)';
            startGameBtn.style.transform = 'scale(1.05)';
        });
        
        startGameBtn.addEventListener('mouseout', () => {
            startGameBtn.style.backgroundColor = 'rgba(102, 204, 255, 0.3)';
            startGameBtn.style.transform = 'scale(1)';
        });
        
        // Add click effect
        startGameBtn.addEventListener('mousedown', () => {
            startGameBtn.style.transform = 'scale(0.95)';
        });
        
        startGameBtn.addEventListener('mouseup', () => {
            startGameBtn.style.transform = 'scale(1.05)';
        });
        
        // Start game when button is clicked
        startGameBtn.addEventListener('click', () => {
            hideEntryScreen();
            
            // Add a slight delay before starting the game
            setTimeout(startGameCallback, 400);
        });
    }
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

// Show level complete overlay
export function showLevelComplete(levelBonus, totalDiamonds) {
    const levelCompleteElement = document.getElementById('level-complete');
    const levelBonusElement = document.getElementById('levelBonus');
    const totalDiamondsElement = document.getElementById('totalDiamonds');
    const touchControls = document.getElementById('touch-controls');
    
    levelBonusElement.textContent = levelBonus;
    totalDiamondsElement.textContent = totalDiamonds;
    
    // Hide touch controls when showing level complete
    if (touchControls) {
        touchControls.style.display = 'none';
    }
    
    // Show with fade
    levelCompleteElement.style.display = 'block';
    levelCompleteElement.style.opacity = 0;
    
    // Smooth fade in
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            levelCompleteElement.style.transition = 'opacity 0.5s ease';
            levelCompleteElement.style.opacity = 1;
        });
    });
}

// Hide level complete overlay
export function hideLevelComplete() {
    const levelCompleteElement = document.getElementById('level-complete');
    const touchControls = document.getElementById('touch-controls');
    
    // Fade out
    levelCompleteElement.style.opacity = 0;
    
    // Hide after fade completes
    setTimeout(() => {
        levelCompleteElement.style.display = 'none';
        
        // Show touch controls again
        if (touchControls) {
            touchControls.style.display = 'block';
        }
    }, 500);
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
    notification.style.backgroundColor = 'rgba(0, 20, 40, 0.95)';
    notification.style.color = '#fff';
    notification.style.padding = '15px 20px';
    notification.style.borderRadius = '10px';
    notification.style.marginBottom = '10px';
    notification.style.boxShadow = '0 0 20px rgba(102, 204, 255, 0.7), 0 0 40px rgba(102, 204, 255, 0.3)';
    notification.style.border = '2px solid #66CCFF';
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-50px)';
    notification.style.transition = 'all 0.5s ease';
    notification.style.maxWidth = '80%';
    notification.style.textAlign = 'center';
    
    // Add content
    notification.innerHTML = `
        <div style="text-align: center; margin-bottom: 5px; font-size: 0.8em; color: #66CCFF;">ACHIEVEMENT UNLOCKED!</div>
        <div style="display: flex; align-items: center; justify-content: center;">
            <div style="font-size: 36px; margin-right: 15px;">${achievement.icon}</div>
            <div>
                <div style="font-weight: bold; color: gold; font-size: 1.2em;">${achievement.title}</div>
                <div style="font-size: 0.9em;">${achievement.description}</div>
            </div>
        </div>
    `;
    
    // Play a sound effect if available
    tryPlayAchievementSound();
    
    // Add to achievements div
    achievementsDiv.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
        
        // Add pulse animation after appearing
        setTimeout(() => {
            notification.style.transform = 'translateY(0) scale(1.05)';
            notification.style.boxShadow = '0 0 30px rgba(102, 204, 255, 0.9), 0 0 50px rgba(102, 204, 255, 0.4)';
            
            setTimeout(() => {
                notification.style.transform = 'translateY(0) scale(1)';
                notification.style.boxShadow = '0 0 20px rgba(102, 204, 255, 0.7), 0 0 40px rgba(102, 204, 255, 0.3)';
            }, 150);
        }, 300);
    }, 50);
    
    // Remove after delay
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-50px)';
        
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 5000);
}

// Try to play a sound effect for achievements if audio API is available
function tryPlayAchievementSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create oscillator for a "success" sound
        const oscillator1 = audioContext.createOscillator();
        oscillator1.type = 'sine';
        oscillator1.frequency.setValueAtTime(587.33, audioContext.currentTime); // D5
        
        const oscillator2 = audioContext.createOscillator();
        oscillator2.type = 'sine';
        oscillator2.frequency.setValueAtTime(880, audioContext.currentTime); // A5
        
        // Create gain node to control volume
        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        // Connect everything
        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Play the sound
        oscillator1.start();
        oscillator2.start();
        
        // Stop after a short time
        oscillator1.stop(audioContext.currentTime + 0.5);
        oscillator2.stop(audioContext.currentTime + 0.5);
    } catch (error) {
        // If audio API isn't available or fails, just continue silently
        console.log("Audio not available for achievement sound");
    }
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

// Show game over screen
export function showGameOver(totalDiamonds, currentLevel) {
    const gameOverElement = document.getElementById('game-over');
    const finalDiamondsElement = document.getElementById('finalDiamonds');
    const levelsCompletedElement = document.getElementById('levelsCompleted');
    const touchControls = document.getElementById('touch-controls');
    
    // Update stats
    finalDiamondsElement.textContent = totalDiamonds;
    levelsCompletedElement.textContent = currentLevel - 1;
    
    // Hide touch controls when showing game over to avoid interaction issues
    if (touchControls) {
        touchControls.style.display = 'none';
    }
    
    // Show the game over screen with fade-in effect
    gameOverElement.style.display = 'block';
    gameOverElement.style.opacity = 0;
    
    // Smoother fade-in with fewer animation steps
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            gameOverElement.style.transition = 'opacity 0.5s ease';
            gameOverElement.style.opacity = 1;
        });
    });
    
    // Add event listener for restart button
    const restartBtn = document.getElementById('restart-game-btn');
    
    // Remove any existing listeners to prevent duplicates
    const newRestartBtn = restartBtn.cloneNode(true);
    restartBtn.parentNode.replaceChild(newRestartBtn, restartBtn);
    newRestartBtn.addEventListener('click', restartGame);
}

// Hide game over screen
export function hideGameOver() {
    const gameOverElement = document.getElementById('game-over');
    const touchControls = document.getElementById('touch-controls');
    
    // Fade out
    gameOverElement.style.opacity = 0;
    
    // Hide after fade
    setTimeout(() => {
        gameOverElement.style.display = 'none';
        
        // Show touch controls again
        if (touchControls) {
            touchControls.style.display = 'block';
        }
    }, 500);
}

// Restart game from game over
function restartGame() {
    hideGameOver();
    // Call the startGame function from main.js
    window.startGame();
} 