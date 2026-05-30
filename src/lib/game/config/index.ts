// Game constants and tunable configuration values

// Canvas settings
export const CANVAS = {
    width: 800,
    height: 600,
    fps: 60,
};

// Playable character types and their stats
export const CHARACTERS = {
    mage: {
        type: 'mage',
        maxLives: 3,
        maxHp: 70,
        size: 20,
        color: '#60a5fa', // blue
        speed: 160, // pixels per second
        shootCooldown: 400, // ms between auto-shoots
        invincibleFrames: 1000, // ms of iframe after hit
        projectileSpeed: 120, // pixels per second
        projectileDamage: 25,
    },
} as const;

export type CharacterId = keyof typeof CHARACTERS;

// Wave settings
export const WAVES = {
    initialEnemies: 3,
    increasePerWave: 2,
    spawnInterval: 2000, // ms between enemy spawns within a wave
    waveInterval: 15000, // ms between wave flushes
};

// Enemy types and their stats
export const ENEMIES = {
    grunt: {
        hp: 30,
        speed: 80, // pixels per second
        damage: 1, // reduces player life by this amount
        range: 0, // melee only
        shootCooldown: 0,
        scoreValue: 10,
        color: '#4ade8f', // green
        size: 24,
    },
    shooter: {
        hp: 20,
        speed: 50,
        damage: 15, // projectile damage
        range: 250, // min distance before shooting
        shootCooldown: 2000, // ms between enemy shots
        scoreValue: 25,
        color: '#f97316', // orange
        size: 20,
    },
    chief: {
        hp: 150,
        speed: 35,
        damage: 2,
        range: 0,
        shootCooldown: 0,
        scoreValue: 100,
        color: '#f43f5e', // pink/red
        size: 36,
    },
};

// Scoring configuration
export const SCORING = {
    timeBonusPerSec: 1, // points per second survived
    comboMultiplier: 1.2, // multiplier per consecutive kill streak
    comboDecayTime: 3000, // ms before combo resets
};