// Base class for all enemy types
import { Entity } from '../Entity.js';
import type { Projectile } from '../../systems/collision.js';
import { SpriteAnimator } from '../../animation/SpriteAnimator.js';
import type { EntitySpriteConfig } from '../../animation/spriteConfig.js';
import type { EnemyHitbox } from './types.js';
import { snapEightDirection, type FacingDirection } from '../../rendering/characterSprites.js';

export class Enemy extends Entity {
    public type: string;
    public lastShot: number;
    public range: number;
    public scoreValue: number;
    public readonly stagger: number;
    public readonly staggerTime: number;
    public readonly hitbox: EnemyHitbox;
    public facing: FacingDirection = { dx: 0, dy: 1 };
    public readonly animator: SpriteAnimator | null;
    private staggerRemainingMs = 0;

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
        stagger?: number;
        staggerTime?: number;
        hitbox?: EnemyHitbox;
        sprite?: EntitySpriteConfig;
    }) {
        const size = options.size ?? 20;
        super({
            x: options.x ?? 0,
            y: options.y ?? 0,
            size,
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
        this.stagger = options.stagger ?? Number.POSITIVE_INFINITY;
        this.staggerTime = options.staggerTime ?? 0;
        this.hitbox = options.hitbox ?? { x: size, y: size };
        this.animator = options.sprite ? new SpriteAnimator(options.sprite) : null;
    }

    isStaggered(): boolean {
        return this.staggerRemainingMs > 0;
    }

    update(
        dt: number,
        targetX: number,
        targetY: number,
        _arenaWidth?: number,
        _arenaHeight?: number,
    ): Projectile | null {
        this.lastShot += dt * 1000;
        this.tickStagger(dt);
        return null;
    }

    takeDamage(amount: number) {
        const wasAlive = this.isAlive();
        super.takeDamage(amount);

        if (!wasAlive) return;

        if (!this.isAlive()) {
            this.staggerRemainingMs = 0;
            this.animator?.lockState(null);
            this.animator?.update(0, { isMoving: false, isDead: true });
            return;
        }

        if (amount >= this.stagger) {
            this.applyStagger();
            return;
        }

        this.animator?.triggerHit();
    }

    tickDying(dt: number) {
        this.animator?.update(dt, { isMoving: false, isDead: true });
    }

    isReadyToRemove(): boolean {
        if (this.isAlive()) return false;
        if (!this.animator) return true;
        if (this.animator.getState() !== 'dying') return false;
        return !this.animator.isOneShotPlaying();
    }

    protected faceToward(dx: number, dy: number) {
        if (dx === 0 && dy === 0) return;
        this.facing = snapEightDirection(dx, dy);
    }

    protected tickStaggered(dt: number) {
        this.animator?.update(dt, { isMoving: false, isDead: false });
    }

    protected tickAnimator(dt: number, isMoving: boolean, attacked = false) {
        if (!this.animator || this.isStaggered()) return;

        if (attacked) {
            this.animator.triggerAttack();
        }

        this.animator.update(dt, {
            isMoving,
            isDead: !this.isAlive(),
        });
    }

    canShoot() {
        return false;
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

    private applyStagger() {
        this.staggerRemainingMs = this.staggerTime;
        this.animator?.lockState('hit');
    }

    private tickStagger(dt: number) {
        if (!this.isAlive() || this.staggerRemainingMs <= 0) return;

        this.staggerRemainingMs = Math.max(0, this.staggerRemainingMs - dt * 1000);
        if (this.staggerRemainingMs <= 0) {
            this.animator?.lockState(null);
        }
    }
}
