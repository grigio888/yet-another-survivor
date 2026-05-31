// Enemy spawning and wave management system
// Controls wave progression, enemy creation, and spawn positions

import { CANVAS, ENEMIES, WAVES } from '../config/index.js';
import { sortByDepth } from '../rendering/depthSort.js';
import { Grunt, Shooter, Chief, type Enemy } from '../entities/enemies/index.js';
import { ENEMY_HP_BAR_OFFSET, isOutsideCanvasView } from './arenaBounds.js';

export { isInsideCanvasView, isOutsideCanvasView } from './arenaBounds.js';

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

const MAX_ENEMY_SIZE = Math.max(ENEMIES.grunt.size, ENEMIES.shooter.size, ENEMIES.chief.size);

/**
 * Pick a random spawn position outside the visible canvas area.
 * Samples anywhere in the margin band around the arena so spawns vary
 * by edge and corner, not only along the four sides.
 */
export function pickSpawnPosition(
    width: number = CANVAS.width,
    height: number = CANVAS.height,
    margin: number = WAVES.spawnMargin,
    entitySize: number = MAX_ENEMY_SIZE,
): { x: number; y: number } {
    const pad = entitySize / 2 + ENEMY_HP_BAR_OFFSET + margin;
    const minX = -pad;
    const maxX = width + pad;
    const minY = -pad;
    const maxY = height + pad;

    // Rejection sample until the full enemy visual sits outside the viewport
    for (let attempt = 0; attempt < 32; attempt++) {
        const x = minX + Math.random() * (maxX - minX);
        const y = minY + Math.random() * (maxY - minY);

        if (isOutsideCanvasView(x, y, entitySize, width, height)) {
            return { x, y };
        }
    }

    // Fallback: random edge spawn
    const edge = Math.floor(Math.random() * 4);
    const along = Math.random();

    switch (edge) {
        case 0:
            return { x: along * width, y: -pad };
        case 1:
            return { x: along * width, y: height + pad };
        case 2:
            return { x: -pad, y: along * height };
        default:
            return { x: width + pad, y: along * height };
    }
}

export type EnemyType = 'grunt' | 'shooter' | 'chief';

/**
 * Create a new enemy instance of the given type at the specified position.
 */
export function createEnemy(type: EnemyType, x: number, y: number): Enemy {
    switch (type) {
        case 'grunt':
            return new Grunt(x, y);
        case 'shooter':
            return new Shooter(x, y);
        case 'chief':
            return new Chief(x, y);
    }
}

/** Spawn an enemy fully outside the canvas viewport. */
export function spawnEnemy(
    type: EnemyType,
    width: number = CANVAS.width,
    height: number = CANVAS.height,
): Enemy {
    const size = ENEMIES[type].size;
    const pos = pickSpawnPosition(width, height, WAVES.spawnMargin, size);
    return createEnemy(type, pos.x, pos.y);
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
    private arenaWidth: number = CANVAS.width;
    private arenaHeight: number = CANVAS.height;
    
    // Timing state
    private waveStartTime: number = 0;
    private spawnTimer: number = 0;
    private spawnedThisWave: number = 0;
    private waveEnemyCount: number = 0;
    
    // State flags
    private spawning: boolean = false;

    /** Match spawn bounds to the live arena size. */
    setArenaSize(width: number, height: number): void {
        this.arenaWidth = width;
        this.arenaHeight = height;
    }

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
            const size = ENEMIES[type].size;
            const pos = pickSpawnPosition(
                this.arenaWidth,
                this.arenaHeight,
                WAVES.spawnMargin,
                size,
            );
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

    /** Enemy quota for the current wave */
    getWaveQuota(): number {
        return this.waveEnemyCount;
    }

    /** Live enemy list owned by the spawning system (same reference each frame). */
    getEnemyList(): Enemy[] {
        return this.enemies;
    }

    /** Drop enemies killed during combat resolution. */
    pruneDeadEnemies(): void {
        this.enemies = this.enemies.filter((e) => e.isAlive());
    }

    /** Spawn a single enemy off-screen (manual debug spawn). */
    spawnManualEnemy(type: EnemyType): Enemy {
        const enemy = spawnEnemy(type, this.arenaWidth, this.arenaHeight);
        this.enemies.push(enemy);
        return enemy;
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