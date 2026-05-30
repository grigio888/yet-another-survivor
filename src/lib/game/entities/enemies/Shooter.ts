// Enemy that shoots at player when in range
import { ENEMIES } from '../../config/index.js';
import { isInsideCanvasView } from '../../systems/arenaBounds.js';
import { Enemy } from './Enemy.js';
import type { Projectile } from '../../systems/collision.js';

export class Shooter extends Enemy {
    constructor(x?: number, y?: number) {
        super({
            x: x ?? 0,
            y: y ?? 0,
            type: 'shooter',
            size: ENEMIES.shooter.size,
            hp: ENEMIES.shooter.hp,
            maxHp: ENEMIES.shooter.hp,
            speed: ENEMIES.shooter.speed,
            damage: ENEMIES.shooter.damage,
            range: ENEMIES.shooter.range,
            color: ENEMIES.shooter.color,
            scoreValue: ENEMIES.shooter.scoreValue,
        });
    }

    update(dt: number, targetX: number, targetY: number): Projectile | null {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const elapsed = this.lastShot;
        const insideCanvas = isInsideCanvasView(this.x, this.y, this.size);
        const canShoot = insideCanvas && dist > 0 && dist <= this.range;

        // Keep walking until on-screen and close enough to fire
        if (!canShoot) {
            if (dist > 0) {
                this.x += (dx / dist) * this.speed * dt;
                this.y += (dy / dist) * this.speed * dt;
            }

            super.update(dt, targetX, targetY);
            return null;
        }

        if (elapsed >= ENEMIES.shooter.shootCooldown) {
            this.lastShot = 0;

            return {
                x: this.x,
                y: this.y,
                direction: { dx: dx / dist, dy: dy / dist },
                speed: this.speed * 1.5,
                damage: this.damage,
                type: 'enemy',
            };
        }

        super.update(dt, targetX, targetY);
        return null;
    }
}
