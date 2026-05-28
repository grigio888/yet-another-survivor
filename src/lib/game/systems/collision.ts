// Collision detection system
// Provides helper functions for detecting collisions between
// projectiles and entities, and between entities themselves.

// Projectiles are emitted by Character and Shooter entities
// represented as simple data objects, not full Entity instances.
export interface Projectile {
    x: number;
    y: number;
    direction: { dx: number; dy: number };
    speed: number;
    damage: number;
    type?: string;
}

// squared Euclidean distance between two points
function distSq(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return dx * dx + dy * dy;
}

/**
 * Circle-based collision test between two circles.
 * Each circle is defined by its center (x, y) and radius r.
 * Collision occurs when distance < r1 + r2.
 */
export function circlesCollide(
    x1: number, y1: number, r1: number,
    x2: number, y2: number, r2: number
): boolean {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distSqVal = dx * dx + dy * dy;
    const threshold = r1 + r2;
    return distSqVal <= threshold * threshold;
}

/**
 * Check whether two entities are colliding.
 * Uses their positions and treats each entity as a circle
 * whose radius equals half its size.
 */
export function entityCollidesWith(
    a: { x: number; y: number; size: number },
    b: { x: number; y: number; size: number }
): boolean {
    return circlesCollide(a.x, a.y, a.size / 2, b.x, b.y, b.size / 2);
}

/**
 * Check whether a projectile collides with an entity.
 * Projectiles are treated as point-like (radius ≈ 0).
 */
export function projectileHitsEntity(
    p: Projectile,
    e: { x: number; y: number; size: number },
    projectileRadius: number = 2
): boolean {
    const er = e.size / 2;
    return circlesCollide(p.x, p.y, projectileRadius, e.x, e.y, er);
}

/**
 * Check whether two projectiles are colliding with each other.
 */
export function projectilesCollide(
    p1: Projectile,
    p2: Projectile,
    radius: number = 2
): boolean {
    return circlesCollide(p1.x, p1.y, radius, p2.x, p2.y, radius);
}

/**
 * Find all colliding pairs between a set of projectiles and a set of enemies.
 * Returns { projectiles, enemies } arrays with matching indices.
 */
export interface CollisionPair {
    pIndex: number;
    eIndex: number;
    pDamage: number;
    eDamage: number;
}

export function findCollisions(
    projectiles: Projectile[],
    enemies: { x: number; y: number; size: number; damage: number }[],
    projectileRadius: number = 2
): CollisionPair[] {
    const pairs: CollisionPair[] = [];
    for (let pi = 0; pi < projectiles.length; pi++) {
        for (let ei = 0; ei < enemies.length; ei++) {
            if (projectileHitsEntity(projectiles[pi], enemies[ei], projectileRadius)) {
                pairs.push({
                    pIndex: pi,
                    eIndex: ei,
                    pDamage: projectiles[pi].damage,
                    eDamage: enemies[ei].damage,
                });
            }
        }
    }
    return pairs;
}

/**
 * Find which projectiles hit the character.
 */
export interface CharacterHit {
    pIndex: number;
    damage: number;
}

export function findCharacterHits(
    projectiles: Projectile[],
    character: { x: number; y: number; size: number },
    projectileRadius: number = 2
): CharacterHit[] {
    const hits: CharacterHit[] = [];
    for (let pi = 0; pi < projectiles.length; pi++) {
        if (projectileHitsEntity(projectiles[pi], character, projectileRadius)) {
            hits.push({
                pIndex: pi,
                damage: projectiles[pi].damage,
            });
        }
    }
    return hits;
}

/**
 * Find which enemies are colliding with the character (melee damage).
 */
export interface MeleeHit {
    eIndex: number;
    damage: number;
}

export function findMeleeHits(
    enemies: { x: number; y: number; size: number; damage: number }[],
    character: { x: number; y: number; size: number }
): MeleeHit[] {
    const hits: MeleeHit[] = [];
    for (let ei = 0; ei < enemies.length; ei++) {
        if (entityCollidesWith(enemies[ei], character)) {
            hits.push({
                eIndex: ei,
                damage: enemies[ei].damage,
            });
        }
    }
    return hits;
}
