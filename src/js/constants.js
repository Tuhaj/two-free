// Game settings
export const GRAVITY = 0.5;
export const JUMP_FORCE = -12;
export const MOVEMENT_SPEED = 5;
export const DIG_SPEED = 3;
export const TILE_SIZE = 32;
export const FPS = 60;
export const FRAME_TIME = 1000 / FPS;

// War background constants
export const MISSILE_ATTACK_INTERVAL_MIN = 8000; // 8 seconds minimum between attacks
export const MISSILE_ATTACK_INTERVAL_MAX = 12000; // 12 seconds maximum between attacks
export const WARNING_DURATION = 3000; // 3 seconds of warning before missile hits

// Tile types
export const TILE_AIR = 0;
export const TILE_DIRT = 1;
export const TILE_STONE = 2;

// DOM element IDs
export const DOM_IDS = {
    CANVAS: 'gameCanvas',
    ENERGY_DISPLAY: 'energyDisplay',
    LEVEL_DISPLAY: 'levelDisplay',
    DIAMOND_DISPLAY: 'diamondDisplay',
    LEVEL_COMPLETE: 'level-complete',
    LEVEL_BONUS: 'levelBonus',
    TOTAL_DIAMONDS: 'totalDiamonds',
    COUNTDOWN: 'countdown',
    ACHIEVEMENTS: 'achievements',
    LEFT_BTN: 'leftBtn',
    RIGHT_BTN: 'rightBtn',
    JUMP_BTN: 'jumpBtn',
    DIG_BTN: 'digBtn',
    SHOOT_BTN: 'shootBtn',
    PAUSE_BTN: 'pauseBtn',
    ENTRY_SCREEN: 'entry-screen',
    START_GAME_BTN: 'start-game-btn'
}; 