    // Base class for all enemy types
    import { Entity } from './Entity.js';
    import type { Projectile } from '../systems/collision.js';

    export class Enemy extends Entity {
        public type: string;
        public lastShot: number;
        public range: number;
        public scoreValue: number;

        constructor(options: {
            x?: number;
            y?: number;
            type: string;
            size?: number;
            hp?: number;
            maxHp?: number;
            speed?: number;
            damage?: number;
            range?: number;
            color?: string;
            scoreValue?: number;
        } = {}) {
            super({
                x: options.x ?? 0,
                y: options.y ?? 0,
                size: options.size ?? 20,
                hp: options.hp ?? 100,
                maxHp: options.maxHp ?? options.hp ?? 100,
                speed: options.speed ?? 100,
                damage: options.damage ?? 0,
                color: options.color ?? '#888888',
            });

            this.type = options.type;
            this.lastShot = 0;
            this.range = options.range ?? 0;
            this.scoreValue = options.scoreValue ?? 0;
        }

        // Returns a projectile when the enemy fires this frame, otherwise null.
        // Subclasses that move/shoot override this and call super.update().
        update(dt: number, targetX: number, targetY: number): Projectile | null {
            // Update internal timers
            this.lastShot += dt * 1000;
            return null;
        }

        canShoot() {
            return false; // Override in subclasses that shoot
        }

        shoot(targetX: number, targetY: number): Projectile | null {
            const dx = targetX - this.x;
            const dy = targetY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 0 && dist <= this.range) {
                const nx = dx / dist;
                const ny = dy / dist;

                return {
                    x: this.x,
                    y: this.y,
                    direction: { dx: nx, dy: ny },
                    speed: this.speed * 1.5,
                    damage: this.damage,
                };
            }

            return null;
        }
    }