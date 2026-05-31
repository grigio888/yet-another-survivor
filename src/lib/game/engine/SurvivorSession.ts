import { Mage, type Character } from '../entities/characters/index.js';
import type { Enemy } from '../entities/enemies/index.js';
import {
    snapEightDirection,
    type CharacterSpriteSet,
    type FacingDirection,
} from '../rendering/characterSprites.js';
import { drawArenaEntities } from '../rendering/arenaRender.js';
import {
    drawProjectiles,
    type ProjectileSpriteSet,
} from '../rendering/projectileSprites.js';
import { separateEntities, type Projectile } from '../systems/collision.js';
import { processCombat, type CombatStats } from '../systems/combat.js';
import { SpawningSystem } from '../systems/spawning.js';
import type { GamePhase } from '../screens/types.js';

const PROJECTILE_MARGIN = 50;

export function createInitialStats(): CombatStats {
    return {
        score: 0,
        kills: 0,
        wave: 1,
        combo: 0,
        lastKillTime: Date.now(),
        timeSurvived: 0,
    };
}

export interface SurvivorSnapshot {
    phase: GamePhase;
    stats: CombatStats;
    timeAlive: number;
    lives: number;
    wave: number;
    character: Character | null;
}

export class SurvivorSession {
    readonly spawning = new SpawningSystem();

    phase: GamePhase = 'menu';
    character: Character | null = null;
    playerProjectiles: Projectile[] = [];
    enemyProjectiles: Projectile[] = [];
    stats = createInitialStats();
    timeAlive = 0;
    facing: FacingDirection = { dx: 0, dy: 1 };
    invincible = false;

    private arenaWidth = 0;
    private arenaHeight = 0;

    setArenaSize(width: number, height: number) {
        if (width <= 0 || height <= 0) return;
        this.arenaWidth = width;
        this.arenaHeight = height;
        this.spawning.setArenaSize(width, height);
    }

    getSnapshot(): SurvivorSnapshot {
        return {
            phase: this.phase,
            stats: this.stats,
            timeAlive: this.timeAlive,
            lives: this.character?.lives ?? 0,
            wave: this.spawning.getWave(),
            character: this.character,
        };
    }

    startGame() {
        if (this.arenaWidth <= 0 || this.arenaHeight <= 0) return;

        this.playerProjectiles = [];
        this.enemyProjectiles = [];
        this.stats = createInitialStats();
        this.timeAlive = 0;
        this.facing = { dx: 0, dy: 1 };
        this.character = new Mage(this.arenaWidth / 2, this.arenaHeight / 2);
        this.phase = 'playing';
        this.spawning.startGame({ x: this.arenaWidth / 2, y: this.arenaHeight / 2 });
    }

    returnToMenu() {
        this.phase = 'menu';
        this.spawning.endGame();
        this.playerProjectiles = [];
        this.enemyProjectiles = [];
        this.character = null;
        this.stats = createInitialStats();
        this.timeAlive = 0;
    }

    togglePause() {
        if (this.phase === 'playing') {
            this.phase = 'paused';
            return;
        }
        if (this.phase === 'paused') {
            this.phase = 'playing';
        }
    }

    tick(dt: number, movement: { dx: number; dy: number; sprint: boolean }) {
        if (this.phase !== 'playing' || !this.character) return;

        if (movement.dx !== 0 || movement.dy !== 0) {
            this.facing = snapEightDirection(movement.dx, movement.dy);
        }

        this.timeAlive += dt;

        const spawnResult = this.spawning.update(dt);
        if (spawnResult.waveEnded) {
            this.stats.wave = this.spawning.getWave();
        }

        const enemies = this.spawning.getEnemyList();
        const canShoot = this.character.update(dt, movement);

        this.clampCharacter();
        this.invincible = this.character.isInvincible();

        if (canShoot) {
            const target = this.nearestEnemyInRange(enemies);
            if (target) {
                if (movement.dx === 0 && movement.dy === 0) {
                    this.facing = snapEightDirection(
                        target.x - this.character.x,
                        target.y - this.character.y,
                    );
                }
                const projectiles = this.character.shoot(target);
                if (projectiles.length > 0) {
                    this.playerProjectiles.push(...projectiles);
                }
            }
        }

        const { projectiles } = this.spawning.updateAllEnemies(
            dt,
            this.character.x,
            this.character.y,
        );
        this.enemyProjectiles.push(...projectiles);

        separateEntities(enemies, 2);

        for (const projectile of this.playerProjectiles) {
            projectile.x += projectile.direction.dx * projectile.speed * dt;
            projectile.y += projectile.direction.dy * projectile.speed * dt;
        }
        for (const projectile of this.enemyProjectiles) {
            projectile.x += projectile.direction.dx * projectile.speed * dt;
            projectile.y += projectile.direction.dy * projectile.speed * dt;
        }

        this.applyCombatResult(
            processCombat(
                this.playerProjectiles,
                this.enemyProjectiles,
                enemies,
                this.character,
                this.stats,
                dt,
            ),
        );

        this.stats.wave = this.spawning.getWave();

        if (this.character.lives <= 0) {
            this.phase = 'gameover';
            this.spawning.endGame();
        }
    }

    draw(
        ctx: CanvasRenderingContext2D,
        sprites: CharacterSpriteSet | null,
        projectileSprites: ProjectileSpriteSet | null,
    ) {
        const width = this.arenaWidth;
        const height = this.arenaHeight;

        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = 'rgba(0,0,0,0.05)';
        ctx.lineWidth = 1;
        for (let gx = 0; gx < width; gx += 50) {
            ctx.beginPath();
            ctx.moveTo(gx, 0);
            ctx.lineTo(gx, height);
            ctx.stroke();
        }
        for (let gy = 0; gy < height; gy += 50) {
            ctx.beginPath();
            ctx.moveTo(0, gy);
            ctx.lineTo(width, gy);
            ctx.stroke();
        }

        if (!this.character) return;

        const enemies = this.spawning.getEnemyList();

        drawArenaEntities(ctx, this.character, this.facing, sprites, enemies, {
            showRange: false,
            showHitbox: false,
            characterInvincible: this.invincible,
        });

        drawProjectiles(ctx, this.playerProjectiles, projectileSprites);

        ctx.fillStyle = '#f97316';
        for (const projectile of this.enemyProjectiles) {
            ctx.beginPath();
            ctx.arc(projectile.x, projectile.y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    destroy() {
        this.spawning.endGame();
    }

    private clampCharacter() {
        if (!this.character) return;
        const half = this.character.size / 2;
        this.character.x = Math.max(half, Math.min(this.arenaWidth - half, this.character.x));
        this.character.y = Math.max(half, Math.min(this.arenaHeight - half, this.character.y));
    }

    private nearestEnemyInRange(enemies: Enemy[]): Enemy | null {
        if (!this.character) return null;
        return this.character.findNearestInRange(enemies.filter((enemy) => enemy.isAlive()));
    }

    private offscreen(projectile: Projectile): boolean {
        return (
            projectile.x < -PROJECTILE_MARGIN ||
            projectile.x > this.arenaWidth + PROJECTILE_MARGIN ||
            projectile.y < -PROJECTILE_MARGIN ||
            projectile.y > this.arenaHeight + PROJECTILE_MARGIN
        );
    }

    private applyCombatResult(result: ReturnType<typeof processCombat>) {
        this.playerProjectiles = this.playerProjectiles.filter(
            (projectile, index) =>
                !result.combat.projectilesToRemove.has(index) && !this.offscreen(projectile),
        );
        this.enemyProjectiles = this.enemyProjectiles.filter(
            (projectile, index) =>
                !result.combat.enemyProjectilesToRemove.has(index) && !this.offscreen(projectile),
        );
        this.spawning.pruneDeadEnemies();
    }
}
