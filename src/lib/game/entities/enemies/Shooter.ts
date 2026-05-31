// Enemy that shoots at player when in range
import { CANVAS } from '../../config/index.js';
import { isInsideShadowEntityView } from '../../systems/arenaBounds.js';
import { Enemy } from './Enemy.js';
import type { EnemyStats } from './types.js';
import type { Projectile } from '../../systems/collision.js';

export const SHOOTER_STATS = {
    hp: 20,
    speed: 50,
    damage: 15, // projectile damage
    range: 250, // max distance to shoot at the player
    shootCooldown: 2000, // ms between enemy shots
    scoreValue: 25,
    color: '#f97316', // orange
    size: 20,
    shadow: { anchor: { x: 50, y: 50 }, size: { x: 20, y: 10 } },
    hitbox: { x: 20, y: 20 },
    stagger: 12,
    staggerTime: 350,
} as const satisfies EnemyStats;

export class Shooter extends Enemy {
    constructor(x?: number, y?: number) {
        super({
            x: x ?? 0,
            y: y ?? 0,
            type: 'shooter',
            size: SHOOTER_STATS.size,
            hp: SHOOTER_STATS.hp,
            maxHp: SHOOTER_STATS.hp,
            speed: SHOOTER_STATS.speed,
            damage: SHOOTER_STATS.damage,
            range: SHOOTER_STATS.range,
            color: SHOOTER_STATS.color,
            scoreValue: SHOOTER_STATS.scoreValue,
            stagger: SHOOTER_STATS.stagger,
            staggerTime: SHOOTER_STATS.staggerTime,
            hitbox: SHOOTER_STATS.hitbox,
            shadow: SHOOTER_STATS.shadow,
        });
    }

    update(
        dt: number,
        targetX: number,
        targetY: number,
        arenaWidth: number = CANVAS.width,
        arenaHeight: number = CANVAS.height,
    ): Projectile | null {
        if (this.isStaggered()) {
            super.update(dt, targetX, targetY, arenaWidth, arenaHeight);
            this.tickStaggered(dt);
            return null;
        }

        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const elapsed = this.lastShot;
        const insideCanvas = isInsideShadowEntityView(
            this.x,
            this.y,
            this.shadow,
            this.hitbox.x,
            this.hitbox.y,
            arenaWidth,
            arenaHeight,
        );
        const canShoot = insideCanvas && dist > 0 && dist <= this.range;

        if (!canShoot) {
            let moved = false;
            if (dist > 0) {
                moved = true;
                this.faceToward(dx, dy);
                this.x += (dx / dist) * this.speed * dt;
                this.y += (dy / dist) * this.speed * dt;
            }

            super.update(dt, targetX, targetY, arenaWidth, arenaHeight);
            this.tickAnimator(dt, moved);
            return null;
        }

        this.faceToward(dx, dy);

        if (elapsed >= SHOOTER_STATS.shootCooldown) {
            this.lastShot = 0;
            super.update(dt, targetX, targetY, arenaWidth, arenaHeight);
            this.tickAnimator(dt, false, true);

            return {
                x: this.x,
                y: this.y,
                direction: { dx: dx / dist, dy: dy / dist },
                speed: this.speed * 1.5,
                damage: this.damage,
                type: 'enemy',
            };
        }

        super.update(dt, targetX, targetY, arenaWidth, arenaHeight);
        this.tickAnimator(dt, false);
        return null;
    }
}
