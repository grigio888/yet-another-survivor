import { KNOCKBACK } from '../config/index.js';
import { ENEMY_HP_BAR_OFFSET } from './arenaBounds.js';
import { getHitboxHorizontalRadius } from './hitbox.js';
import type { Enemy } from '../entities/enemies/Enemy.js';

/** Cubic ease-out: fast start, gentle settle */
function easeOutCubic(t: number): number {
    const clamped = Math.max(0, Math.min(1, t));
    return 1 - (1 - clamped) ** 3;
}

interface KnockbackTarget {
    enemy: Enemy;
    dirX: number;
    dirY: number;
}

export class HitKnockback {
    private durationMs = 0;
    private elapsedMs = 0;
    private lastProgress = 0;
    private targets: KnockbackTarget[] = [];

    trigger(
        x: number,
        y: number,
        range: number,
        enemies: Enemy[],
        durationMs: number = KNOCKBACK.durationMs,
    ) {
        const rangeSq = range * range;
        this.targets = [];

        for (const enemy of enemies) {
            if (!enemy.isAlive()) continue;

            const dx = enemy.x - x;
            const dy = enemy.y - y;
            const distSq = dx * dx + dy * dy;

            if (distSq === 0 || distSq > rangeSq) continue;

            const dist = Math.sqrt(distSq);
            this.targets.push({ enemy, dirX: dx / dist, dirY: dy / dist });
        }

        this.durationMs = durationMs;
        this.elapsedMs = 0;
        this.lastProgress = 0;
    }

    get active(): boolean {
        return this.durationMs > 0 && this.lastProgress < 1;
    }

    apply(
        _enemies: Enemy[],
        dt: number,
        arenaWidth: number,
        arenaHeight: number,
    ) {
        if (!this.active) return;

        this.elapsedMs = Math.min(this.durationMs, this.elapsedMs + dt * 1000);
        const progress = easeOutCubic(this.elapsedMs / this.durationMs);
        const displacement = KNOCKBACK.maxDistance * (progress - this.lastProgress);
        this.lastProgress = progress;

        if (displacement <= 0) return;

        for (const { enemy, dirX, dirY } of this.targets) {
            if (!enemy.isAlive()) continue;

            const halfW = getHitboxHorizontalRadius(enemy.hitbox);
            enemy.x += dirX * displacement;
            enemy.y += dirY * displacement;

            enemy.x = Math.max(halfW, Math.min(arenaWidth - halfW, enemy.x));
            enemy.y = Math.max(
                enemy.hitbox.y,
                Math.min(arenaHeight - ENEMY_HP_BAR_OFFSET, enemy.y),
            );
        }
    }
}
