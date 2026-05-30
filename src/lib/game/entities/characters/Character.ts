// Base class for all playable character types
import { Entity } from '../Entity.js';
import type { CharacterId } from '../../config/index.js';

export type CharacterStats = {
    type: CharacterId;
    maxLives: number;
    maxHp: number;
    size: number;
    color: string;
    speed: number;
    shootCooldown: number;
    invincibleFrames: number;
    projectileSpeed: number;
    projectileDamage: number;
};

export class Character extends Entity {
    public type: CharacterId;
    public lives: number;
    public lastShot: number;
    public invincibleUntil: number;
    protected stats: CharacterStats;

    constructor(options: {
        x?: number;
        y?: number;
        stats: CharacterStats;
    }) {
        const { stats } = options;

        super({
            x: options.x ?? 0,
            y: options.y ?? 0,
            size: stats.size,
            hp: stats.maxHp,
            maxHp: stats.maxHp,
            speed: stats.speed,
            damage: stats.projectileDamage,
            color: stats.color,
        });

        this.type = stats.type;
        this.stats = stats;
        this.lives = stats.maxLives;
        this.lastShot = 0;
        this.invincibleUntil = 0;
    }

    update(dt: number, movement: { dx: number; dy: number; sprint: boolean }) {
        const { dx, dy, sprint } = movement;
        const effectiveSpeed = sprint ? this.stats.speed * 2 : this.stats.speed;

        this.x += dx * effectiveSpeed * dt;
        this.y += dy * effectiveSpeed * dt;

        const now = Date.now();
        if (this.invincibleUntil > 0 && now > this.invincibleUntil) {
            this.invincibleUntil = 0;
        }

        this.hp = this.lives > 0 ? this.maxHp : 0;

        this.lastShot += dt * 1000;
        return this.lastShot >= this.stats.shootCooldown;
    }

    shoot(target: { x: number; y: number }) {
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            const nx = dx / dist;
            const ny = dy / dist;

            this.lastShot = 0;

            return {
                x: this.x,
                y: this.y,
                direction: { dx: nx, dy: ny },
                speed: this.stats.projectileSpeed,
                damage: this.stats.projectileDamage,
            };
        }

        return null;
    }

    takeDamage(amount: number) {
        if (this.isInvincible()) {
            return;
        }

        this.lives--;
        this.hp = this.lives > 0 ? this.maxHp : 0;
        this.invincibleUntil = Date.now() + this.stats.invincibleFrames;
    }

    draw(ctx: CanvasRenderingContext2D) {
        super.draw(ctx);

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
