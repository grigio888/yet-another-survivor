// Base class for all playable character types
import { Entity } from '../Entity.js';
import {
    DEFAULT_STARTING_ITEMS,
    ItemInventory,
    splitItemUseResults,
    type ItemId,
    type ItemUseResult,
} from '../../items/index.js';
import type { CharacterBaseStats } from '../../items/types.js';
import type { ResolvedActiveStats } from '../../items/resolveActive.js';
import type { Projectile } from '../../systems/collision.js';
import { SpriteAnimator } from '../../animation/SpriteAnimator.js';
import type {
    EntitySpriteConfig,
    SpriteFacing,
    SpriteLayout,
    SpriteUrls,
} from '../../animation/spriteConfig.js';
import type { EntityShadow } from '../../rendering/shadow.js';
import { getEntityAnchorPoint, type ShadowedEntity } from '../../rendering/shadow.js';
import { snapEightDirection, type FacingDirection } from '../../rendering/facing.js';
import type { Hitbox } from '../../systems/hitbox.js';
import { cloneHitbox } from '../../systems/hitbox.js';

export type { Hitbox as CharacterHitbox };

export type { SpriteFacing, SpriteLayout };
export type CharacterSpriteUrls = SpriteUrls;
export type CharacterSpriteLayout = SpriteLayout;
export type CharacterSpriteConfig = EntitySpriteConfig;

export type CharacterStats = {
    type: string;
    maxLives: number;
    maxHp: number;
    size: number;
    color: string;
    speed: number;
    invincibleFrames: number;
    shadow: EntityShadow;
    hitbox: Hitbox;
    sprite: CharacterSpriteConfig;
    startingItems?: readonly ItemId[];
};

export class Character extends Entity {
    public type: string;
    public range: number;
    public lives: number;
    public invincibleUntil: number;
    public readonly inventory: ItemInventory;
    public readonly animator: SpriteAnimator;
    public readonly shadow: EntityShadow;
    public readonly hitbox: Hitbox;
    public facing: FacingDirection = { dx: 0, dy: 1 };
    protected stats: CharacterStats;

    constructor(options: {
        x?: number;
        y?: number;
        stats: CharacterStats;
    }) {
        const { stats } = options;
        const inventory = new ItemInventory();
        inventory.equipAll(stats.startingItems ?? DEFAULT_STARTING_ITEMS);
        const baseStats = Character.baseStatsFrom(stats);

        super({
            x: options.x ?? 0,
            y: options.y ?? 0,
            size: stats.size,
            hp: stats.maxHp,
            maxHp: stats.maxHp,
            speed: stats.speed,
            damage: inventory.getMaxDamage(baseStats),
            color: stats.color,
        });

        this.type = stats.type;
        this.stats = stats;
        this.shadow = stats.shadow;
        this.hitbox = cloneHitbox(stats.hitbox);
        this.inventory = inventory;
        this.animator = new SpriteAnimator(stats.sprite);
        this.range = inventory.getMaxRange(baseStats);
        this.lives = stats.maxLives;
        this.invincibleUntil = 0;
    }

    static baseStatsFrom(stats: CharacterStats): CharacterBaseStats {
        return {
            speed: stats.speed,
            maxLives: stats.maxLives,
            maxHp: stats.maxHp,
        };
    }

    get sprite(): CharacterSpriteConfig {
        return this.stats.sprite;
    }

    get baseStats(): CharacterBaseStats {
        return Character.baseStatsFrom(this.stats);
    }

    get attackStats(): ResolvedActiveStats {
        return this.inventory.getAttackStats(this.baseStats);
    }

    update(dt: number, movement: { dx: number; dy: number; sprint: boolean }) {
        const { dx, dy, sprint } = movement;
        const effectiveSpeed = sprint ? this.stats.speed * 2 : this.stats.speed;

        this.x += dx * effectiveSpeed * dt;
        this.y += dy * effectiveSpeed * dt;

        if (dx !== 0 || dy !== 0) {
            this.facing = snapEightDirection(dx, dy);
        }

        const now = Date.now();
        if (this.invincibleUntil > 0 && now > this.invincibleUntil) {
            this.invincibleUntil = 0;
        }

        this.hp = this.lives > 0 ? this.maxHp : 0;

        this.inventory.tick(dt);
        this.range = this.inventory.getMaxRange(this.baseStats);
        this.damage = this.inventory.getMaxDamage(this.baseStats);

        this.animator.update(dt, {
            isMoving: dx !== 0 || dy !== 0,
            isDead: this.lives <= 0,
        });

        return this.inventory.canFireAny(this.baseStats);
    }

    faceToward(dx: number, dy: number) {
        if (dx !== 0 || dy !== 0) {
            this.facing = snapEightDirection(dx, dy);
        }
    }

    isInRange(target: ShadowedEntity) {
        const origin = getEntityAnchorPoint(this);
        const point = getEntityAnchorPoint(target);
        const dx = point.x - origin.x;
        const dy = point.y - origin.y;
        return dx * dx + dy * dy <= this.range * this.range;
    }

    findNearestInRange<T extends ShadowedEntity>(targets: readonly T[]): T | null {
        let best: T | null = null;
        let bestDistSq = Infinity;
        const rangeSq = this.range * this.range;
        const origin = getEntityAnchorPoint(this);

        for (const target of targets) {
            const point = getEntityAnchorPoint(target);
            const dx = point.x - origin.x;
            const dy = point.y - origin.y;
            const distSq = dx * dx + dy * dy;

            if (distSq <= rangeSq && distSq < bestDistSq) {
                bestDistSq = distSq;
                best = target;
            }
        }

        return best;
    }

    useItems(target: ShadowedEntity): ItemUseResult[] {
        const origin = getEntityAnchorPoint(this);
        const aim = getEntityAnchorPoint(target);
        const results = this.inventory.useAllActives(this.baseStats, origin, aim);
        if (results.length > 0) {
            this.animator.triggerAttack();
        }
        return results;
    }

    shoot(target: ShadowedEntity): Projectile[] {
        return splitItemUseResults(this.useItems(target)).projectiles;
    }

    takeDamage(amount: number) {
        if (this.isInvincible()) {
            return;
        }

        this.lives--;
        this.hp = this.lives > 0 ? this.maxHp : 0;
        this.invincibleUntil = Date.now() + this.stats.invincibleFrames;
        this.animator.triggerHit();
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
