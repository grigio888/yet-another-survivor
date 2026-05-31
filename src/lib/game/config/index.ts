// Game constants and tunable configuration values

// Canvas settings
export const CANVAS = {
    width: 800,
    height: 600,
    fps: 60,
};

// Wave settings
export const WAVES = {
    initialEnemies: 3,
    increasePerWave: 2,
    spawnInterval: 2000, // ms between enemy spawns within a wave
    waveInterval: 15000, // ms between wave flushes
    /** Extra distance beyond canvas corner + enemy radius when spawning */
    spawnMargin: 100,
};

// Scoring configuration
export const SCORING = {
    timeBonusPerSec: 1, // points per second survived
    comboMultiplier: 1.2, // multiplier per consecutive kill streak
    comboDecayTime: 3000, // ms before combo resets
};

/** Repulsion applied to nearby enemies when the player takes damage */
export const KNOCKBACK = {
    durationMs: 1200,
    maxDistance: 90, // total outward displacement over the eased duration
};