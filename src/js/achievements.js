import { showAchievementNotification } from './ui.js';

// Define base achievement thresholds - significantly increased difficulty
const baseAchievements = [
    // Basic achievements
    {id: 'first_treasure', title: 'First Steps', description: 'Find your first treasure', icon: '💎', baseThreshold: 1},
    
    // Diamond collection achievements - significantly increased
    {id: 'treasure_hunter', title: 'Treasure Hunter', description: 'Collect diamonds', icon: '🏆', baseThreshold: 50},
    {id: 'master_digger', title: 'Master Digger', description: 'Collect diamonds', icon: '⛏️', baseThreshold: 150},
    {id: 'diamond_expert', title: 'Diamond Expert', description: 'Collect diamonds', icon: '👑', baseThreshold: 300},
    {id: 'diamond_king', title: 'Diamond King', description: 'Collect diamonds', icon: '💎👑', baseThreshold: 500},
    {id: 'millionaire', title: 'Millionaire', description: 'Collect diamonds', icon: '💰', baseThreshold: 1000},
    {id: 'billionaire', title: 'Billionaire', description: 'Collect diamonds', icon: '💰💰', baseThreshold: 2500},
    {id: 'diamond_god', title: 'Diamond God', description: 'Collect diamonds', icon: '👑💎👑', baseThreshold: 5000},
    
    // Level achievements - more challenging progression
    {id: 'level_5', title: 'Deep Explorer', description: 'Reach level 5', icon: '🔍', baseThreshold: 5, isLevel: true},
    {id: 'level_10', title: 'Core Dweller', description: 'Reach level 10', icon: '🔥', baseThreshold: 10, isLevel: true},
    {id: 'level_20', title: 'Abyss Diver', description: 'Reach level 20', icon: '🌋', baseThreshold: 20, isLevel: true},
    {id: 'level_30', title: 'Earth\'s Heart', description: 'Reach level 30', icon: '🌍', baseThreshold: 30, isLevel: true},
    {id: 'level_50', title: 'Core Master', description: 'Reach level 50', icon: '🌟', baseThreshold: 50, isLevel: true},
    
    // Energy achievements - higher thresholds
    {id: 'energy_max', title: 'Power Up', description: 'Reach 100 energy', icon: '⚡', baseThreshold: 100, isEnergy: true},
    {id: 'energy_super', title: 'Super Charged', description: 'Reach 200 energy', icon: '⚡⚡', baseThreshold: 200, isEnergy: true},
    {id: 'energy_ultimate', title: 'Ultimate Power', description: 'Reach 500 energy', icon: '⚡⚡⚡', baseThreshold: 500, isEnergy: true},
    {id: 'energy_infinite', title: 'Infinite Power', description: 'Reach 1000 energy', icon: '🌠', baseThreshold: 1000, isEnergy: true},
    
    // Combat achievements - more challenging
    {id: 'robot_slayer', title: 'Robot Slayer', description: 'Defeat enemy robots', icon: '🤖', baseThreshold: 25, isKills: true},
    {id: 'robot_destroyer', title: 'Robot Destroyer', description: 'Defeat enemy robots', icon: '🤖💥', baseThreshold: 100, isKills: true},
    {id: 'robot_terminator', title: 'Robot Terminator', description: 'Defeat enemy robots', icon: '💥🤖💥', baseThreshold: 250, isKills: true},
    {id: 'robot_apocalypse', title: 'Robot Apocalypse', description: 'Defeat enemy robots', icon: '☠️', baseThreshold: 500, isKills: true},
    
    // New special achievements with much higher requirements
    {id: 'speed_runner', title: 'Speed Runner', description: 'Complete level 5+ in under 20 seconds', icon: '⚡', baseThreshold: 5, isSpeedrun: true, requiresLevel: 5},
    {id: 'perfect_run', title: 'Perfect Run', description: 'Complete level 3+ without taking damage', icon: '��️', baseThreshold: 3, isPerfect: true, requiresLevel: 3},
    {id: 'energy_master', title: 'Energy Master', description: 'Complete level 3+ using less than 5 energy', icon: '✨', baseThreshold: 3, isEfficient: true, requiresLevel: 3},
    {id: 'survivor', title: 'Survivor', description: 'Survive 5 missile attacks in one level 4+', icon: '🚀', baseThreshold: 5, isSurvival: true, requiresLevel: 4},
    {id: 'chain_collector', title: 'Chain Collector', description: 'Collect 15 diamonds without touching ground', icon: '🎯', baseThreshold: 15, isChain: true}
];

// Create achievements array with dynamic thresholds
export let achievements = [];
// Track enemy kills
let enemyKills = 0;

// New tracking variables for special achievements
let levelStartTime = 0;
let damageTakenInLevel = 0;
let energyUsedInLevel = 0;
let missilesSurvivedInLevel = 0;
let diamondsWithoutGround = 0;
let isOnGround = false;

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

// Reset level-specific tracking
export function resetLevelTracking() {
    levelStartTime = Date.now();
    damageTakenInLevel = 0;
    energyUsedInLevel = 0;
    missilesSurvivedInLevel = 0;
    diamondsWithoutGround = 0;
    isOnGround = false;
}

// Track when player touches the ground
export function setOnGround(onGround) {
    if (onGround && !isOnGround) {
        // Reset chain when landing
        diamondsWithoutGround = 0;
    }
    isOnGround = onGround;
}

// Track diamond collection without touching ground
export function trackDiamondCollection() {
    if (!isOnGround) {
        diamondsWithoutGround++;
    }
}

// Track damage taken
export function trackDamageTaken(amount) {
    damageTakenInLevel += amount;
}

// Track energy used
export function trackEnergyUsed(amount) {
    energyUsedInLevel += amount;
}

// Track missile survival
export function trackMissileSurvival() {
    missilesSurvivedInLevel++;
}

// Check if any achievements have been reached
export function checkAchievements(totalDiamonds, currentLevel, playerEnergy) {
    let newAchievements = false;
    
    // Update dynamic thresholds based on current progress
    achievements.forEach(achievement => {
        if (!achievement.reached) {
            // Don't update thresholds for level, energy, and special achievements
            if (!achievement.isLevel && !achievement.isEnergy && !achievement.isKills && 
                !achievement.isSpeedrun && !achievement.isPerfect && !achievement.isEfficient && 
                !achievement.isSurvival && !achievement.isChain) {
                const newThreshold = calculateDynamicThreshold(achievement.baseThreshold, totalDiamonds);
                
                // Only update description if threshold changed
                if (newThreshold !== achievement.threshold) {
                    achievement.threshold = newThreshold;
                    achievement.description = `Collect ${achievement.threshold} diamonds`;
                }
            }
            
            // Check if achievement is reached
            if (
                // Basic achievements
                (achievement.isLevel && currentLevel >= achievement.threshold) || 
                (achievement.isEnergy && playerEnergy >= achievement.threshold) ||
                (achievement.isKills && enemyKills >= achievement.threshold) ||
                (!achievement.isLevel && !achievement.isEnergy && !achievement.isKills && 
                 !achievement.isSpeedrun && !achievement.isPerfect && !achievement.isEfficient && 
                 !achievement.isSurvival && !achievement.isChain && totalDiamonds >= achievement.threshold) ||
                // Special achievement checks with level requirements
                (achievement.isSpeedrun && currentLevel >= achievement.requiresLevel && 
                 Date.now() - levelStartTime <= 20000) || // Reduced to 20 seconds
                (achievement.isPerfect && currentLevel >= achievement.requiresLevel && 
                 damageTakenInLevel === 0 && totalDiamonds >= 5) || // Must collect at least 5 diamonds
                (achievement.isEfficient && currentLevel >= achievement.requiresLevel && 
                 energyUsedInLevel < 5 && totalDiamonds >= 5) || // Must collect at least 5 diamonds with low energy
                (achievement.isSurvival && currentLevel >= achievement.requiresLevel && 
                 missilesSurvivedInLevel >= achievement.threshold) ||
                (achievement.isChain && diamondsWithoutGround >= achievement.threshold) // Now requires 15 diamonds
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