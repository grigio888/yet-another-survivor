    // Enemy that shoots at player when in range
    import { ENEMIES } from '../config/index.js';
    import { Enemy } from './Enemy.js';
    import type { Projectile } from '../systems/collision.js';

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

            // Move toward target if out of range
            if (dist > this.range * 2) {
                if (dist > 0) {
                    const moveX = (dx / dist) * this.speed * dt;
                    const moveY = (dy / dist) * this.speed * dt;

                    this.x += moveX;
                    this.y += moveY;
                }

                super.update(dt, targetX, targetY);
                return null;
            }

            // Shoot when in range and cooldown expired
            if (dist <= this.range && elapsed >= ENEMIES.shooter.shootCooldown) {
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