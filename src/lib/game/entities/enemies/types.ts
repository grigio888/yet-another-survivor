export type EnemyType = 'grunt' | 'shooter' | 'chief' | 'jelly';

export type EnemyHitbox = {
    /** Width in pixels, centered on the shadow anchor */
    x: number;
    /** Height in pixels, extending upward from the shadow anchor */
    y: number;
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
    hitbox: EnemyHitbox;
    /** Minimum hit damage required to trigger stagger */
    stagger: number;
    /** How long the enemy is stunned after a qualifying hit (ms) */
    staggerTime: number;
};
