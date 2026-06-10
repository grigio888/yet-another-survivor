import { Mage, type Character } from '../entities/characters/index.js';
import type { Enemy } from '../entities/enemies/index.js';
import {
    type CharacterSpriteSet,
} from '../rendering/characterSprites.js';
import { drawArenaEntities } from '../rendering/arenaRender.js';
import {
    drawProjectiles,
    type ProjectileSpriteSet,
} from '../rendering/projectileSprites.js';
import { separateEntities, type Projectile } from '../systems/collision.js';
import { processCombat, applyCombatKills, type CombatStats } from '../systems/combat.js';
import { spawnItemEffects } from '../systems/itemEffects.js';
import type { ItemEffect } from '../items/effects/types.js';
import { splitItemUseResults } from '../items/Inventory.js';
import { ITEMS } from '../items/registry.js';
import { drawItemEffectVisual, type ItemVisualLibrary } from '../rendering/itemSprites.js';
import { SpawningSystem } from '../systems/spawning.js';
import type { GamePhase } from '../screens/types.js';
import { GamePolish } from '../polish/GamePolish.js';
import { HitKnockback } from '../systems/knockback.js';
import { clampShadowCenter, getEntityAnchorPoint } from '../rendering/shadow.js';
import { ENEMY_HP_BAR_OFFSET } from '../systems/arenaBounds.js';
import type { EnemySpriteType } from '../entities/enemies/index.js';
import type { EnemySpriteLibrary } from '../rendering/enemySprites.js';

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
    readonly polish = new GamePolish();
    readonly hitKnockback = new HitKnockback();

    phase: GamePhase = 'menu';
    character: Character | null = null;
    playerProjectiles: Projectile[] = [];
    enemyProjectiles: Projectile[] = [];
    itemEffects: ItemEffect[] = [];
    stats = createInitialStats();
    timeAlive = 0;
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
        this.itemEffects = [];
        this.stats = createInitialStats();
        this.timeAlive = 0;
        this.character = new Mage(this.arenaWidth / 2, this.arenaHeight / 2);
        this.phase = 'playing';
        this.polish.onGameStart();
        this.spawning.startGame({ x: this.arenaWidth / 2, y: this.arenaHeight / 2 });
    }

    returnToMenu() {
        this.phase = 'menu';
        this.spawning.endGame();
        this.playerProjectiles = [];
        this.enemyProjectiles = [];
        this.itemEffects = [];
        this.character = null;
        this.stats = createInitialStats();
        this.timeAlive = 0;
        this.polish.onReturnToMenu();
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

    updatePolish(dt: number) {
        this.polish.update(dt);
    }

    tick(dt: number, movement: { dx: number; dy: number; sprint: boolean }) {
        if (this.phase !== 'playing' || !this.character) return;

        this.timeAlive += dt;

        const spawnResult = this.spawning.update(dt);
        if (spawnResult.waveEnded) {
            this.stats.wave = this.spawning.getWave();
        }

        const enemies = this.spawning.getEnemyList();

        this.hitKnockback.apply(enemies, dt, this.arenaWidth, this.arenaHeight);

        const canShoot = this.character.update(dt, movement);

        this.clampCharacter();
        this.invincible = this.character.isInvincible();

        if (canShoot) {
            const target = this.nearestEnemyInRange(enemies);
            if (target) {
                if (movement.dx === 0 && movement.dy === 0) {
                    const origin = getEntityAnchorPoint(this.character);
                    const aim = getEntityAnchorPoint(target);
                    this.character.faceToward(aim.x - origin.x, aim.y - origin.y);
                }
                const results = this.character.useItems(target);
                const { projectiles, effects } = splitItemUseResults(results);
                if (projectiles.length > 0 || effects.length > 0) {
                    this.playerProjectiles.push(...projectiles);
                    if (effects.length > 0) {
                        const spawned = spawnItemEffects(
                            effects,
                            enemies,
                            getEntityAnchorPoint(this.character).x,
                        );
                        this.itemEffects.push(...spawned.effects);
                        applyCombatKills(this.stats, spawned.kills, 0);
                        this.polish.spawnDamagePopups(spawned.damagePopups);
                    }
                    this.polish.onShoot();
                }
            }
        }

        const playerAnchor = getEntityAnchorPoint(this.character);
        const { projectiles } = this.spawning.updateAllEnemies(
            dt,
            playerAnchor.x,
            playerAnchor.y,
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

        const combatResult = processCombat(
            this.playerProjectiles,
            this.enemyProjectiles,
            enemies,
            this.character,
            this.stats,
            dt,
            this.itemEffects,
        );
        this.itemEffects = combatResult.itemEffects;

        this.applyCombatResult(combatResult);
        this.polish.onCombatResult(combatResult, enemies, this.character);

        if (combatResult.characterDamaged) {
            this.hitKnockback.trigger(
                playerAnchor.x,
                playerAnchor.y,
                this.character.range,
                enemies,
            );
            this.hitKnockback.apply(enemies, dt, this.arenaWidth, this.arenaHeight);
        }

        this.stats.wave = this.spawning.getWave();

        if (this.character.lives <= 0) {
            if (this.phase === 'playing') {
                this.polish.onGameOver();
            }
            this.phase = 'gameover';
            this.spawning.endGame();
        }
    }

    draw(
        ctx: CanvasRenderingContext2D,
        sprites: CharacterSpriteSet | null,
        projectileSprites: ProjectileSpriteSet | null,
        enemySprites: Partial<Record<EnemySpriteType, EnemySpriteLibrary>> | null = null,
        itemVisuals: ItemVisualLibrary | null = null,
    ) {
        const width = this.arenaWidth;
        const height = this.arenaHeight;

        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, width, height);

        const shake = this.polish.effects.getShakeOffset();
        ctx.save();
        ctx.translate(shake.x, shake.y);

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

        if (!this.character) {
            ctx.restore();
            return;
        }

        const enemies = this.spawning.getEnemyList();

        drawArenaEntities(ctx, this.character, sprites, enemies, {
            showRange: false,
            showHitbox: false,
            characterInvincible: this.invincible,
            enemySprites,
        });

        drawProjectiles(ctx, this.playerProjectiles, projectileSprites);

        for (const effect of this.itemEffects) {
            const item = ITEMS[effect.itemId as keyof typeof ITEMS];
            if (item) {
                drawItemEffectVisual(ctx, effect, item, itemVisuals);
            }
        }

        ctx.fillStyle = '#f97316';
        for (const projectile of this.enemyProjectiles) {
            ctx.beginPath();
            ctx.arc(projectile.x, projectile.y, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        this.polish.particles.draw(ctx);
        this.polish.damageNumbers.draw(ctx);
        ctx.restore();
    }

    destroy() {
        this.spawning.endGame();
        this.polish.destroy();
    }

    private clampCharacter() {
        if (!this.character) return;
        clampShadowCenter(this.character, this.arenaWidth, this.arenaHeight, ENEMY_HP_BAR_OFFSET);
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
