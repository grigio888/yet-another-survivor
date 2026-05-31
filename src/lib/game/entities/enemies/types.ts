import type { Hitbox } from '../../systems/hitbox.js';

export type EnemyType = 'grunt' | 'shooter' | 'chief' | 'jelly' | 'goblinArcher';

/** Width/height plus optional pixel offset from the sprite-start anchor */
export type EnemyHitbox = Hitbox;

export type EnemyShadow = {
    /** Horizontal attach + vertical sprite start on the shadow, percent (0–100). Y = where the sprite base begins. */
    anchor: { x: number; y: number };
    /** Shadow ellipse size in pixels — entity (x, y) is the shadow center */
    size: { x: number; y: number };
};

export type EnemyStats = {
    hp: number;
    speed: number;
    damage: number;
    range: number;
    shootCooldown: number;
    scoreValue: number;
    color: string;
    size: number;
    shadow: EnemyShadow;
    hitbox: EnemyHitbox;
    /** Minimum hit damage required to trigger stagger */
    stagger: number;
    /** How long the enemy is stunned after a qualifying hit (ms) */
    staggerTime: number;
};
