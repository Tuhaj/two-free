import { showAchievementNotification } from './ui.js';

// Define base achievement thresholds - significantly increased difficulty
const baseAchievements = [
    {id: 'first_treasure', title: 'First Treasure', description: 'Find your first treasure', icon: '💎', baseThreshold: 1},
    {id: 'treasure_hunter', title: 'Treasure Hunter', description: 'Collect diamonds', icon: '🏆', baseThreshold: 25}, // Increased from 10
    {id: 'master_digger', title: 'Master Digger', description: 'Collect diamonds', icon: '⛏️', baseThreshold: 50}, // Increased from 25
    {id: 'diamond_expert', title: 'Diamond Expert', description: 'Collect diamonds', icon: '👑', baseThreshold: 100}, // Increased from 50
    {id: 'diamond_king', title: 'Diamond King', description: 'Collect diamonds', icon: '💎👑', baseThreshold: 200}, // New tier
    {id: 'millionaire', title: 'Millionaire', description: 'Collect diamonds', icon: '💰', baseThreshold: 500}, // Increased from 100
    {id: 'billionaire', title: 'Billionaire', description: 'Collect diamonds', icon: '💰💰', baseThreshold: 1000}, // New tier
    {id: 'level_5', title: 'Deep Explorer', description: 'Reach level 5', icon: '🔍', baseThreshold: 5, isLevel: true},
    {id: 'level_10', title: 'Core Dweller', description: 'Reach level 10', icon: '🔥', baseThreshold: 10, isLevel: true},
    {id: 'level_15', title: 'Abyss Diver', description: 'Reach level 15', icon: '🌋', baseThreshold: 15, isLevel: true}, // New tier
    {id: 'level_20', title: 'Earth\'s Heart', description: 'Reach level 20', icon: '🌍', baseThreshold: 20, isLevel: true}, // New tier
    {id: 'energy_max', title: 'Power Up', description: 'Reach 75 energy', icon: '⚡', baseThreshold: 75, isEnergy: true}, // Increased from 50
    {id: 'energy_super', title: 'Super Charged', description: 'Reach 150 energy', icon: '⚡⚡', baseThreshold: 150, isEnergy: true}, // Increased from 100
    {id: 'energy_ultimate', title: 'Ultimate Power', description: 'Reach 250 energy', icon: '⚡⚡⚡', baseThreshold: 250, isEnergy: true}, // New tier
    {id: 'robot_slayer', title: 'Robot Slayer', description: 'Defeat 10 enemy robots', icon: '🤖', baseThreshold: 10, isKills: true}, // New achievement
    {id: 'robot_destroyer', title: 'Robot Destroyer', description: 'Defeat 50 enemy robots', icon: '🤖💥', baseThreshold: 50, isKills: true}, // New achievement
];

// Create achievements array with dynamic thresholds
export let achievements = [];
// Track enemy kills
let enemyKills = 0;

// Initialize achievements with dynamic descriptions and thresholds
function initializeAchievements() {
    achievements = baseAchievements.map(achievement => {
        const newAchievement = { ...achievement, reached: false };
        newAchievement.threshold = achievement.baseThreshold;
        
        // Update descriptions for diamond-based achievements
        if (!achievement.isLevel && !achievement.isEnergy && !achievement.isKills) {
            newAchievement.description = `Collect ${newAchievement.threshold} diamonds`;
        } else if (achievement.isKills) {
            newAchievement.description = `Defeat ${newAchievement.threshold} enemy robots`;
        }
        
        return newAchievement;
    });
    
    // Reset enemy kills
    enemyKills = 0;
}

// Calculate scaled threshold based on progress - more aggressive scaling
function calculateDynamicThreshold(baseThreshold, totalDiamonds) {
    // First achievement is always at threshold 1
    if (baseThreshold === 1) return 1;
    
    // For other achievements, scale up based on progress
    // Start scaling up sooner, after just 10 diamonds collected
    if (totalDiamonds < 10) {
        return baseThreshold;
    }
    
    // More aggressive scaling
    const scaleFactor = 1 + (totalDiamonds / 50); // Stronger scaling (reduced from 100)
    return Math.ceil(baseThreshold * scaleFactor);
}

// Register an enemy kill
export function registerEnemyKill() {
    enemyKills++;
    return enemyKills;
}

// Check if any achievements have been reached
export function checkAchievements(totalDiamonds, currentLevel, playerEnergy) {
    let newAchievements = false;
    
    // Update dynamic thresholds based on current progress
    achievements.forEach(achievement => {
        if (!achievement.reached) {
            // Don't update thresholds for level, energy, and kill based achievements
            if (!achievement.isLevel && !achievement.isEnergy && !achievement.isKills) {
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
                (achievement.isKills && enemyKills >= achievement.threshold) ||
                (!achievement.isLevel && !achievement.isEnergy && !achievement.isKills && totalDiamonds >= achievement.threshold)
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

// Get current enemy kill count
export function getEnemyKills() {
    return enemyKills;
}

// Initialize achievements on module load
initializeAchievements(); 