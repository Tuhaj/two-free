import { showAchievementNotification } from './ui.js';

// Define base achievement thresholds
const baseAchievements = [
    {id: 'first_treasure', title: 'First Treasure', description: 'Find your first treasure', icon: '💎', baseThreshold: 1},
    {id: 'treasure_hunter', title: 'Treasure Hunter', description: 'Collect diamonds', icon: '🏆', baseThreshold: 10},
    {id: 'master_digger', title: 'Master Digger', description: 'Collect diamonds', icon: '⛏️', baseThreshold: 25},
    {id: 'diamond_expert', title: 'Diamond Expert', description: 'Collect diamonds', icon: '👑', baseThreshold: 50},
    {id: 'millionaire', title: 'Millionaire', description: 'Collect diamonds', icon: '💰', baseThreshold: 100},
    {id: 'level_5', title: 'Deep Explorer', description: 'Reach level 5', icon: '🔍', baseThreshold: 5, isLevel: true},
    {id: 'level_10', title: 'Core Dweller', description: 'Reach level 10', icon: '🔥', baseThreshold: 10, isLevel: true},
    {id: 'energy_max', title: 'Power Up', description: 'Reach 50 energy', icon: '⚡', baseThreshold: 50, isEnergy: true},
    {id: 'energy_super', title: 'Super Charged', description: 'Reach 100 energy', icon: '⚡⚡', baseThreshold: 100, isEnergy: true}
];

// Create achievements array with dynamic thresholds
export let achievements = [];

// Initialize achievements with dynamic descriptions and thresholds
function initializeAchievements() {
    achievements = baseAchievements.map(achievement => {
        const newAchievement = { ...achievement, reached: false };
        newAchievement.threshold = achievement.baseThreshold;
        
        // Update descriptions for diamond-based achievements
        if (!achievement.isLevel && !achievement.isEnergy) {
            newAchievement.description = `Collect ${newAchievement.threshold} diamonds`;
        }
        
        return newAchievement;
    });
}

// Calculate scaled threshold based on progress
function calculateDynamicThreshold(baseThreshold, totalDiamonds) {
    // First achievement is always at threshold 1
    if (baseThreshold === 1) return 1;
    
    // For other achievements, scale up based on progress
    // Start scaling up after 20 diamonds collected
    if (totalDiamonds < 20) {
        return baseThreshold;
    }
    
    // Progressive scaling: the more diamonds collected, the harder the achievements
    const scaleFactor = 1 + (totalDiamonds / 100);
    return Math.ceil(baseThreshold * scaleFactor);
}

// Check if any achievements have been reached
export function checkAchievements(totalDiamonds, currentLevel, playerEnergy) {
    let newAchievements = false;
    
    // Update dynamic thresholds based on current progress
    achievements.forEach(achievement => {
        if (!achievement.reached) {
            // Don't update thresholds for level and energy based achievements
            if (!achievement.isLevel && !achievement.isEnergy) {
                const newThreshold = calculateDynamicThreshold(achievement.baseThreshold, totalDiamonds);
                
                // Only update description if threshold changed
                if (newThreshold !== achievement.threshold) {
                    achievement.threshold = newThreshold;
                    achievement.description = `Collect ${achievement.threshold} diamonds`;
                }
            }
            
            // Check if achievement is reached
            if (
                (achievement.isLevel && currentLevel >= achievement.threshold) || 
                (achievement.isEnergy && playerEnergy >= achievement.threshold) ||
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

// Reset all achievements to unreached
export function resetAchievements() {
    initializeAchievements();
}

// Get achievement by ID
export function getAchievement(id) {
    return achievements.find(achievement => achievement.id === id);
}

// Get all reached achievements
export function getReachedAchievements() {
    return achievements.filter(achievement => achievement.reached);
}

// Initialize achievements on module load
initializeAchievements(); 