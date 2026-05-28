import { describe, it, expect } from 'vitest';
import {
    circlesCollide,
    entityCollidesWith,
    projectileHitsEntity,
    projectilesCollide,
    findCollisions,
    findCharacterHits,
    findMeleeHits,
} from '$lib/game/systems/collision';

// Helper to create mock entities
function createEntity(x: number, y: number, size: number, damage: number = 1) {
    return { x, y, size, damage };
}

// Helper to create mock projectiles
function createProjectile(x: number, y: number, speed: number, dx: number, dy: number, damage: number = 10) {
    return { x, y, direction: { dx, dy }, speed, damage };
}

describe('circlesCollide', () => {
    it('detects collision when circles overlap', () => {
        expect(circlesCollide(0, 0, 10, 0, 0, 10, 10)).toBe(true);
    });

    it('detects collision when circles touch at edges', () =>
        expect(circlesCollide(0, 0, 5, 10, 0, 5)).toBe(true));

    it('returns false when circles are far apart', () =>
        expect(circlesCollide(0, 0, 5, 100, 0, 5, 5)).toBe(false));

    it('handles different radius circles', () =>
        expect(circlesCollide(0, 0, 10, 14, 0, 5, 5)).toBe(true));

    it('collision detection is symmetric', () => {
        const forward = circlesCollide(0, 0, 5, 10, 0, 3);
        const reverse = circlesCollide(10, 0, 3, 0, 0, 5);
        expect(forward).toBe(reverse);
    });
});

describe('entityCollidesWith', () => {
    it('detects collision between overlapping entities', () =>
        expect(entityCollidesWith(createEntity(0, 0, 20), createEntity(5, 0, 20))).toBe(true));

    it('returns false for distant entities', () =>
        expect(entityCollidesWith(createEntity(0, 0, 20), createEntity(100, 0, 20))).toBe(false));

    it('handles different sized entities', () =>
        expect(entityCollidesWith(createEntity(0, 0, 40), createEntity(25, 0, 20))).toBe(true));

    it('boundary case - just touching', () =>
        expect(entityCollidesWith(createEntity(0, 0, 20), createEntity(20, 0, 20))).toBe(true));

    it('boundary case - just outside collision', () =>
        expect(entityCollidesWith(createEntity(0, 0, 20), createEntity(22, 0, 20))).toBe(false));
});

describe('projectileHitsEntity', () => {
    it('detects projectile hitting entity center', () =>
        expect(projectileHitsEntity(createProjectile(10, 10, 400, 0, 0), createEntity(10, 10, 20))).toBe(true));

    it('detects projectile hitting within entity radius', () =>
        expect(projectileHitsEntity(createProjectile(15, 10, 400, 0, 0), createEntity(10, 10, 20))).toBe(true));

    it('returns false when projectile misses entity', () =>
        expect(projectileHitsEntity(createProjectile(-100, 0, 400, 0, 0), createEntity(0, 0, 20))).toBe(false));

    it('boundary case - projectile at entity edge', () =>
        expect(projectileHitsEntity(createProjectile(12, 10, 400, 0, 0), createEntity(10, 10, 20))).toBe(true));

    it('boundary case - projectile just outside entity', () =>
        expect(projectileHitsEntity(createProjectile(24, 10, 400, 0, 0), createEntity(10, 10, 20))).toBe(false));
});

describe('projectilesCollide', () => {
    it('detects collision between overlapping projectiles', () =>
        expect(projectilesCollide(createProjectile(0, 0, 400, 1, 0), createProjectile(3, 0, 400, -1, 0))).toBe(true));

    it('returns false when projectiles are far apart', () =>
        expect(projectilesCollide(createProjectile(0, 0, 400, 1, 0), createProjectile(100, 0, 400, -1, 0))).toBe(false));

    it('collision detection is symmetric', () => {
        const p1 = createProjectile(0, 0, 400, 1, 0);
        const p2 = createProjectile(3, 0, 400, -1, 0);
        expect(projectilesCollide(p1, p2)).toBe(projectilesCollide(p2, p1));
    });
});

describe('findCollisions', () => {
    it('returns empty array when no collisions occur', () => {
        const projectiles = [createProjectile(0, 0, 400, 1, 0)];
        const enemies = [createEntity(200, 0, 20)];
        expect(findCollisions(projectiles, enemies)).toEqual([]);
    });

    it('detects single collision pair', () => {
        const projectiles = [createProjectile(5, 0, 400, 1, 0, 25)];
        const enemies = [createEntity(0, 0, 20, 1)];
        const collision = findCollisions(projectiles, enemies);

        expect(collision.length).toBe(1);
        expect(collision[0].pIndex).toBe(0);
        expect(collision[0].eIndex).toBe(0);
        expect(collision[0].pDamage).toBe(25);
        expect(collision[0].eDamage).toBe(1);
    });

    it('detects multiple collision pairs', () => {
        const projectiles = [
            createProjectile(5, 0, 400, 1, 0, 25),
            createProjectile(0, 5, 400, 0, 1, 15),
        ];
        const enemies = [
            createEntity(0, 0, 20, 1),
            createEntity(0, 0, 20, 5),
        ];
        const collision = findCollisions(projectiles, enemies);

        // Each projectile hits both enemies (4 colliding pairs total)
        expect(collision.length).toBe(4);
    });

    it('correctly identifies indices in large sets', () => {
        const projectiles = [
            createProjectile(0, 0, 400, 1, 0, 10),
            createProjectile(100, 0, 400, 1, 0, 20),
            createProjectile(200, 0, 400, 1, 0, 30),
        ];
        const enemies = [
            createEntity(5, 0, 20, 1),   // No collision with any projectile
            createEntity(100, 0, 20, 2), // Collides with projectile index 1
            createEntity(200, 0, 20, 3), // Collides with projectile index 2
        ];
        const collision = findCollisions(projectiles, enemies);

        // p1->e1, p1->e2 (only p2 collides)... wait let me reconsider
        // p0 at (0,0), e0 at (5,0) size=20 => radius=10 => collide
        // p0 at (0,0), e1 at (100,0) => no collision
        // p0 at (0,0), e2 at (200,0) => no collision
        // p1 at (100,0), e0 at (5,0) => no collision
        // p1 at (100,0), e1 at (100,0) size=20 => collide
        // p1 at (100,0), e2 at (200,0) => no collision
        // p2 at (200,0), e0 at (5,0) => no collision
        // p2 at (200,0), e1 at (100,0) => no collision
        // p2 at (200,0), e2 at (200,0) size=20 => collide

        expect(collision.length).toBe(3);
        expect(collision[0]).toEqual({ pIndex: 0, eIndex: 0, pDamage: 10, eDamage: 1 });
        expect(collision[1]).toEqual({ pIndex: 1, eIndex: 1, pDamage: 20, eDamage: 2 });
        expect(collision[2]).toEqual({ pIndex: 2, eIndex: 2, pDamage: 30, eDamage: 3 });
    });
});

describe('findCharacterHits', () => {
    const character = { x: 50, y: 50, size: 20 };

    it('returns empty array when no projectiles hit character', () => {
        const projectiles = [createProjectile(0, 0, 400, 1, 0)];
        expect(findCharacterHits(projectiles, character)).toEqual([]);
    });

    it('detects single projectile hitting character', () => {
        const projectiles = [createProjectile(50, 50, 400, 0, 0, 15)];
        const hits = findCharacterHits(projectiles, character);

        expect(hits.length).toBe(1);
        expect(hits[0].pIndex).toBe(0);
        expect(hits[0].damage).toBe(15);
    });

    it('detects multiple projectiles hitting character', () => {
        const projectiles = [
            createProjectile(50, 50, 400, 0, 0, 15),
            createProjectile(52, 50, 400, 0, 0, 20),
            createProjectile(0, 0, 400, 1, 0, 25), // misses character
        ];
        const hits = findCharacterHits(projectiles, character);

        expect(hits.length).toBe(2);
        expect(hits[0].pIndex).toBe(0);
        expect(hits[1].pIndex).toBe(1);
    });
});

describe('findMeleeHits', () => {
    const character = { x: 0, y: 0, size: 20 };

    it('returns empty array when no enemies touching character', () => {
        const enemies = [createEntity(100, 0, 20)];
        expect(findMeleeHits(enemies, character)).toEqual([]);
    });

    it('detects single enemy colliding with character', () => {
        const enemies = [createEntity(5, 0, 20, 2)];
        const hits = findMeleeHits(enemies, character);

        expect(hits.length).toBe(1);
        expect(hits[0].eIndex).toBe(0);
        expect(hits[0].damage).toBe(2);
    });

    it('detects multiple enemies colliding with character', () => {
        const enemies = [
            createEntity(-5, 0, 20, 1),
            createEntity(5, 0, 20, 2),
            createEntity(100, 0, 20, 3), // not touching
        ];
        const hits = findMeleeHits(enemies, character);

        expect(hits.length).toBe(2);
        expect(hits[0].eIndex).toBe(0);
        expect(hits[1].eIndex).toBe(1);
    });
});

describe('distance calculations', () => {
    // Tests for diagonal position checks
    it('detects collision at diagonal positions', () => {
        // Two circles at (0,0) and (10,10) with radii of 8 each
        // distance = sqrt(100 + 100) = sqrt(200) ≈ 14.14
        // threshold = 8 + 8 = 16 => should collide
        expect(circlesCollide(0, 0, 8, 10, 10, 8)).toBe(true);
    });

    it('detects no collision at diagonal positions when too far', () => {
        // Two circles at (0,0) and (10,10) with radii of 5 each  
        // distance = sqrt(200) ≈ 14.14
        // threshold = 5 + 5 = 10 => should not collide
        expect(circlesCollide(0, 0, 5, 10, 10, 5)).toBe(false);
    });
});
