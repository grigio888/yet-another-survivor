    // Player character class
    import { Entity } from './Entity.js';
    import { PLAYER } from '../config/index.js';

    export class Character extends Entity {
        public lives: number;
        public lastShot: number;
        public invincibleUntil: number;

        constructor(options: { x?: number; y?: number } = {}) {
            super({
                x: options.x ?? 0,
                y: options.y ?? 0,
                size: PLAYER.size ?? 20,
                hp: PLAYER.maxHp ?? 100,
                maxHp: PLAYER.maxHp ?? 100,
                speed: PLAYER.speed,
                damage: PLAYER.projectileDamage,
                color: PLAYER.color ?? '#60a5fa',
            });

            this.lives = PLAYER.maxLives;
            this.lastShot = 0;
            this.invincibleUntil = 0;
        }

        update(dt: number, movement: { dx: number; dy: number; sprint: boolean }) {
            const { dx, dy, sprint } = movement;
            const effectiveSpeed = sprint ? PLAYER.speed * 2 : PLAYER.speed;

            // Move character
            this.x += dx * effectiveSpeed * dt;
            this.y += dy * effectiveSpeed * dt;

            // Check if invincibility has expired
            const now = Date.now();
            if (this.invincibleUntil > 0 && now > this.invincibleUntil) {
                this.invincibleUntil = 0;
            }

            // Update HP from lives
            this.hp = this.lives > 0 ? this.maxHp : 0;

            // Can shoot? Check cooldown
            this.lastShot += dt * 1000;
            return this.lastShot >= PLAYER.shootCooldown;
        }

        shoot(target: { x: number; y: number }) {
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 0) {
                // Normalize direction
                const nx = dx / dist;
                const ny = dy / dist;

                // Reset the auto-fire cooldown now that we've fired
                this.lastShot = 0;

                return {
                    x: this.x,
                    y: this.y,
                    direction: { dx: nx, dy: ny },
                    speed: PLAYER.projectileSpeed,
                    damage: PLAYER.projectileDamage,
                };
            }

            return null;
        }

        takeDamage(amount: number) {
            // Only take damage if not invincible
            if (this.isInvincible()) {
                return;
            }

            // Each hit costs one life, then grants invulnerability frames
            this.lives--;
            this.hp = this.lives > 0 ? this.maxHp : 0;
            this.invincibleUntil = Date.now() + PLAYER.invincibleFrames;
        }

        draw(ctx: CanvasRenderingContext2D) {
            super.draw(ctx);

            // Draw crosshair at character position
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.x - 3, this.y);
            ctx.lineTo(this.x + 3, this.y);
            ctx.moveTo(this.x, this.y - 3);
            ctx.lineTo(this.x, this.y + 3);
            ctx.stroke();
        }

        isInvincible() {
            return Date.now() < this.invincibleUntil;
        }
    }