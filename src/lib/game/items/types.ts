import type { Projectile } from '../systems/collision.js';

export const MAX_ACTIVE_ITEMS = 4;
export const MAX_PASSIVE_ITEMS = 4;

export type ItemKind = 'active' | 'passive';

/** Stats that passive perks may modify. */
export type ModifiableStat =
    | 'speed'
    | 'maxLives'
    | 'maxHp'
    | 'range'
    | 'cooldownMs'
    | 'projectileDamage'
    | 'projectileSpeed';

export type PassivePerk = {
    stat: ModifiableStat;
    op: 'add' | 'mul';
    value: number;
};

export type ProjectileActivePerk = {
    kind: 'projectile';
    damage: number;
    speed: number;
    range: number;
    cooldownMs: number;
    projectileColor?: string;
    projectileType?: string;
};

export type ActivePerk = ProjectileActivePerk;

export type ItemSprite = {
    url: string;
    size: number;
};

export type ItemDefinition = {
    id: string;
    name: string;
    description: string;
    kind: ItemKind;
    passives: PassivePerk[];
    active: ActivePerk | null;
    sprite?: ItemSprite | null;
};

export type AttackStats = {
    range: number;
    cooldownMs: number;
    projectileDamage: number;
    projectileSpeed: number;
    projectileColor?: string;
    projectileType?: string;
    sprite?: string;
    spriteSize?: number;
};

export type CharacterBaseStats = {
    speed: number;
    maxLives: number;
    maxHp: number;
};

export type FireProjectileContext = {
    origin: { x: number; y: number };
    target: { x: number; y: number };
    attack: AttackStats;
};

export function createProjectileFromAttack(ctx: FireProjectileContext): Projectile | null {
    const { origin, target, attack } = ctx;
    const dx = target.x - origin.x;
    const dy = target.y - origin.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= 0 || dist > attack.range) {
        return null;
    }

    return {
        x: origin.x,
        y: origin.y,
        direction: { dx: dx / dist, dy: dy / dist },
        speed: attack.projectileSpeed,
        damage: attack.projectileDamage,
        type: attack.projectileType,
        sprite: attack.sprite,
        spriteSize: attack.spriteSize,
        color: attack.projectileColor,
    };
}

export function isInAttackRange(
    origin: { x: number; y: number },
    target: { x: number; y: number },
    range: number,
): boolean {
    const dx = target.x - origin.x;
    const dy = target.y - origin.y;
    return dx * dx + dy * dy <= range * range;
}
