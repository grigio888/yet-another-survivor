import { GRUNT_STATS } from './Grunt.js';
import { SHOOTER_STATS } from './Shooter.js';
import { CHIEF_STATS } from './Chief.js';
import { JELLY_SPRITE, JELLY_STATS } from './Jelly.js';
import { GOBLIN_ARCHER_SPRITE, GOBLIN_ARCHER_STATS } from './GoblinArcher.js';
import type { EntitySpriteConfig } from '../../animation/spriteConfig.js';
import type { EnemyStats, EnemyType } from './types.js';

export const ENEMY_CATALOG: { label: string; type: EnemyType }[] = [
    { label: 'Grunt', type: 'grunt' },
    { label: 'Shooter', type: 'shooter' },
    { label: 'Chief', type: 'chief' },
    { label: 'Jelly', type: 'jelly' },
    { label: 'Goblin Archer', type: 'goblinArcher' },
];

export const ENEMY_STATS: Record<EnemyType, EnemyStats> = {
    grunt: GRUNT_STATS,
    shooter: SHOOTER_STATS,
    chief: CHIEF_STATS,
    jelly: JELLY_STATS,
    goblinArcher: GOBLIN_ARCHER_STATS,
};

/** Sprite configs registered on each enemy file that has art. */
export const ENEMY_SPRITES = {
    jelly: JELLY_SPRITE,
    goblinArcher: GOBLIN_ARCHER_SPRITE,
} as const satisfies Partial<Record<EnemyType, EntitySpriteConfig>>;

export type EnemySpriteType = keyof typeof ENEMY_SPRITES;

export function getEnemyStats(type: EnemyType): EnemyStats {
    return ENEMY_STATS[type];
}

export function getEnemySpriteConfig(type: EnemyType): EntitySpriteConfig | null {
    return ENEMY_SPRITES[type as EnemySpriteType] ?? null;
}

export function enemyHasSpriteArt(type: EnemyType): boolean {
    return type in ENEMY_SPRITES;
}

export function enemyShoots(type: EnemyType): boolean {
    const stats = ENEMY_STATS[type];
    return stats.range > 0 && stats.shootCooldown > 0;
}

export function enemyProjectileSpeed(type: EnemyType): number {
    return ENEMY_STATS[type].speed * 1.5;
}

export function getEnemySpriteTypes(): EnemySpriteType[] {
    return Object.keys(ENEMY_SPRITES) as EnemySpriteType[];
}

export function getEnemySpawnExtent(type: EnemyType): number {
    const { hitbox } = ENEMY_STATS[type];
    return Math.max(hitbox.x, hitbox.y);
}
