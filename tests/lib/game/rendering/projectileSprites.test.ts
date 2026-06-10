import { describe, expect, it } from 'vitest';
import { FIREBALL_ITEM, isActiveItemVisuals } from '$lib/game/items';
import { createProjectileFromAttack } from '$lib/game/items/types';
import { projectileTravelAngle } from '$lib/game/rendering/projectileSprites';

describe('FIREBALL_ITEM', () => {
    it('is an active projectile item', () => {
        expect(FIREBALL_ITEM.kind).toBe('active');
        expect(FIREBALL_ITEM.active?.kind).toBe('projectile');
        expect(FIREBALL_ITEM.active?.projectileType).toBe('fireball');
    });

    it('uses the fireball sprite via item visuals', () => {
        expect(isActiveItemVisuals(FIREBALL_ITEM.visuals!)).toBe(true);
        if (isActiveItemVisuals(FIREBALL_ITEM.visuals!)) {
            expect(FIREBALL_ITEM.visuals.world.kind).toBe('projectile');
            expect(String(FIREBALL_ITEM.visuals.world.sprite)).toContain('fireball');
            expect(FIREBALL_ITEM.visuals.world.size).toBe(20);
        }
    });
});

describe('createProjectileFromAttack', () => {
    it('copies sprite metadata onto the projectile', () => {
        const projectile = createProjectileFromAttack({
            origin: { x: 0, y: 0 },
            target: { x: 40, y: 0 },
            attack: {
                range: 100,
                cooldownMs: 400,
                projectileDamage: 25,
                projectileSpeed: 75,
                projectileType: 'fireball',
                sprite: '/fireball.png',
                spriteSize: 32,
                projectileColor: '#f97316',
            },
        });

        expect(projectile?.sprite).toBe('/fireball.png');
        expect(projectile?.spriteSize).toBe(32);
        expect(projectile?.color).toBe('#f97316');
    });
});

describe('projectileTravelAngle', () => {
    it('keeps a north-facing sprite upright when traveling up', () => {
        expect(projectileTravelAngle({ dx: 0, dy: -1 })).toBeCloseTo(0);
    });

    it('rotates a north-facing sprite toward travel direction', () => {
        expect(projectileTravelAngle({ dx: 1, dy: 0 })).toBeCloseTo(Math.PI / 2);
        expect(projectileTravelAngle({ dx: 0, dy: 1 })).toBeCloseTo(Math.PI);
        expect(projectileTravelAngle({ dx: -1, dy: 0 })).toBeCloseTo((3 * Math.PI) / 2);
    });
});
