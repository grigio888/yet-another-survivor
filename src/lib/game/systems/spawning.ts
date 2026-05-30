// Enemy spawning and wave management system
// Controls wave progression, enemy creation, and spawn positions

import { CANVAS, WAVES } from '../config/index.js';
import { sortByDepth } from '../rendering/depthSort.js';
import { Grunt, Shooter, Chief, type Enemy } from '../entities/enemies/index.js';

// Probability weights for enemy types at each wave tier
// Keys represent the minimum wave number where that distribution applies
const WAVE_COMPOSITION = {
    1: { grunt: 1.0, shooter: 0, chief: 0 },
    2: { grunt: 0.7, shooter: 0.3, chief: 0 },
    3: { grunt: 0.5, shooter: 0.4, chief: 0.1 },
    5: { grunt: 0.3, shooter: 0.5, chief: 0.2 },
    8: { grunt: 0.2, shooter: 0.4, chief: 0.4 },
    12: { grunt: 0.1, shooter: 0.3, chief: 0.6 },
};

function getComposition(wave: number): { grunt: number; shooter: number; chief: number } {
    let best = WAVE_COMPOSITION[1];
    for (const [key, value] of Object.entries(WAVE_COMPOSITION)) {
        if (wave >= parseInt(key)) {
            best = value;
        }
    }
    return best;
}

/**
 * Selects an enemy type based on wave composition weights.
 */
function selectEnemyType(wave: number): 'grunt' | 'shooter' | 'chief' {
    const comp = getComposition(wave);
    const r = Math.random();
    
    if (r < comp.grunt) return 'grunt';
    if (r < comp.grunt + comp.shooter) return 'shooter';
    return 'chief';
}

/**
 * Pick a random spawn position outside the visible canvas area.
 * Spawns enemies from the perimeter just outside the canvas bounds.
 */
function pickSpawnPosition(): { x: number; y: number } {
    const w = CANVAS.width;
    const h = CANVAS.height;
    const margin = 40; // spawn slightly outside the canvas edge
    
    // Choose one of four edges randomly
    const edge = Math.floor(Math.random() * 4);
    
    switch (edge) {
        case 0: // top
            return { x: Math.random() * w, y: -margin };
        case 1: // bottom
            return { x: Math.random() * w, y: h + margin };
        case 2: // left
            return { x: -margin, y: Math.random() * h };
        case 3: // right
            return { x: w + margin, y: Math.random() * h };
    }
}

/**
 * Create a new enemy instance of the given type at the specified position.
 */
function createEnemy(type: 'grunt' | 'shooter' | 'chief', x: number, y: number): Enemy {
    switch (type) {
        case 'grunt':
            return new Grunt(x, y);
        case 'shooter':
            return new Shooter(x, y);
        case 'chief':
            return new Chief(x, y);
    }
}

/**
 * Compute the total number of enemies to spawn in a given wave.
 * Starts at initialEnemies and increases by increasePerWave each wave.
 */
function getWaveEnemyCount(wave: number): number {
    return WAVES.initialEnemies + (wave - 1) * WAVES.increasePerWave;
}

/**
 * Compute the spawn interval for the current wave.
 * Later waves spawn enemies faster.
 */
function getWaveSpawnInterval(wave: number): number {
    return Math.max(400, WAVES.spawnInterval / wave);
}

export interface SpawnResult {
    spawned: Enemy[];
    waveEnded: boolean;
}

export class SpawningSystem {
    private enemies: Enemy[] = [];
    private wave: number = 1;
    
    // Timing state
    private waveStartTime: number = 0;
    private spawnTimer: number = 0;
    private spawnedThisWave: number = 0;
    private waveEnemyCount: number = 0;
    
    // State flags
    private spawning: boolean = false;

    /**
     * Initialize a new game session. Resets all state.
     */
    startGame(canvasCenter: { x: number; y: number }): void {
        this.enemies = [];
        this.wave = 1;
        this.waveStartTime = Date.now();
        this.spawnTimer = 0;
        this.spawnedThisWave = 0;
        this.waveEnemyCount = getWaveEnemyCount(1);
        this.spawning = true;
    }

    /**
     * End the game session. Cleans up all state.
     */
    endGame(): void {
        this.enemies = [];
        this.wave = 0;
        this.spawning = false;
    }

    /**
     * Update the spawning system each frame.
     * Returns information about newly spawned enemies and wave status.
     */
    update(dt: number): SpawnResult {
        const result: SpawnResult = { spawned: [], waveEnded: false };
        
        const now = Date.now();
        
        // Check if wave timer has expired – advance to next wave
        if (now - this.waveStartTime >= WAVES.waveInterval) {
            this.advanceWave();
            result.waveEnded = true;
            result.spawned = [...this.enemies];
            return result;
        }
        
        if (!this.spawning) return result;
        
        // Tick the spawn interval timer
        this.spawnTimer += dt * 1000;
        const spawnInterval = getWaveSpawnInterval(this.wave);
        
        // Spawn enemy if timer elapsed and quota not reached
        if (
            this.spawnTimer >= spawnInterval &&
            this.spawnedThisWave < this.waveEnemyCount
        ) {
            this.spawnTimer = 0;
            this.spawnedThisWave++;
            
            const type = selectEnemyType(this.wave);
            const pos = pickSpawnPosition();
            const enemy = createEnemy(type, pos.x, pos.y);
            
            this.enemies.push(enemy);
            result.spawned.push(enemy);
        }
        
        // Remove dead enemies
        this.enemies = this.enemies.filter(e => e.isAlive());
        
        // Check if all enemies spawned are either dead or the wave timer expired
        // This handles the case where player kills all enemies before wave ends
        const aliveCount = this.enemies.length;
        if (this.spawnedThisWave >= this.waveEnemyCount && aliveCount === 0) {
            this.advanceWave();
            result.waveEnded = true;
        }
        
        result.spawned = [...this.enemies];
        return result;
    }

    /**
     * Transition to the next wave. Resets spawn counters.
     */
    private advanceWave(): void {
        this.wave++;
        this.waveStartTime = Date.now();
        this.spawnTimer = 0;
        this.spawnedThisWave = 0;
        this.waveEnemyCount = getWaveEnemyCount(this.wave);
    }

    /**
     * Tick all active enemies by their AI update.
     * Shooter enemies may return projectiles.
     */
    updateAllEnemies(dt: number, targetX: number, targetY: number): { projectiles: any[] } {
        const projectiles: any[] = [];
        
        for (const enemy of this.enemies) {
            const result = enemy.update(dt, targetX, targetY);
            if (result) {
                projectiles.push(result);
            }
        }
        
        // Remove dead enemies
        this.enemies = this.enemies.filter(e => e.isAlive());
        
        return { projectiles };
    }

    /**
     * Draw all active enemies on the canvas.
     */
    drawAll(ctx: CanvasRenderingContext2D): void {
        for (const enemy of sortByDepth(this.enemies)) {
            enemy.draw(ctx);
        }
    }

    // --- Getters ---
    
    /** Current enemies array (for collision/combat systems) */
    getEnemies(): ReadonlyArray<Enemy> {
        return [...this.enemies];
    }
    
    /** Current wave number */
    getWave(): number {
        return this.wave;
    }
    
    /** Number of enemies currently alive */
    getAliveCount(): number {
        return this.enemies.filter(e => e.isAlive()).length;
    }
    
    /** Total enemies spawned this wave */
    getSpawnedThisWave(): number {
        return this.spawnedThisWave;
    }

    /** Reset for a new game, preserving score/combo */
    reset(): void {
        this.enemies = [];
        this.wave = 1;
        this.waveStartTime = Date.now();
        this.spawnTimer = 0;
        this.spawnedThisWave = 0;
        this.waveEnemyCount = getWaveEnemyCount(1);
        this.spawning = true;
    }
}