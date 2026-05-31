import { describe, expect, it } from 'vitest';
import { circleHitsHitbox, cloneHitbox, getHitboxBounds, hitboxCollidesWithCircle, hitboxesOverlap, separateHitboxEntities } from '$lib/game/systems/hitbox.js';

describe('hitbox', () => {
    const enemy = {
        x: 100,
        y: 100,
        shadow: { anchor: { x: 50, y: 50 }, size: { x: 40, y: 20 } },
        hitbox: { x: 40, y: 20 },
    };

    it('detects a circle overlapping the hitbox center', () => {
        expect(circleHitsHitbox(100, 95, 5, enemy)).toBe(true);
    });

    it('detects a circle overlapping a wide but short edge', () => {
        expect(circleHitsHitbox(118, 100, 3, enemy)).toBe(true);
    });

    it('returns false when the circle is outside the hitbox', () => {
        expect(circleHitsHitbox(140, 100, 2, enemy)).toBe(false);
    });

    it('returns false when the circle is below the shadow anchor', () => {
        expect(circleHitsHitbox(100, 108, 5, enemy)).toBe(false);
    });

    it('collides with a circular character using the hitbox helper', () => {
        expect(
            hitboxCollidesWithCircle(enemy, { x: 118, y: 100, size: 10 }),
        ).toBe(true);
    });

    it('detects overlap between two hitboxes', () => {
        const character = {
            x: 0,
            y: 0,
            shadow: { anchor: { x: 50, y: 50 }, size: { x: 20, y: 20 } },
            hitbox: { x: 20, y: 20 },
        };

        expect(hitboxesOverlap(enemy, character)).toBe(false);

        const nearCharacter = {
            x: 95,
            y: 100,
            shadow: { anchor: { x: 50, y: 50 }, size: { x: 20, y: 20 } },
            hitbox: { x: 20, y: 20 },
        };

        expect(hitboxesOverlap(enemy, nearCharacter)).toBe(true);
    });

    it('separates overlapping hitboxes until they only touch', () => {
        const shadow = { anchor: { x: 50, y: 50 }, size: { x: 40, y: 20 } };
        const hitbox = { x: 40, y: 20 };
        const a = { x: 100, y: 100, shadow, hitbox };
        const b = { x: 100, y: 100, shadow, hitbox };

        separateHitboxEntities([a, b], 4);

        expect(hitboxesOverlap(a, b)).toBe(false);
        expect(Math.abs(a.x - b.x)).toBeLessThan(40);
    });

    it('applies hitbox offset from the sprite-start anchor', () => {
        const entity = {
            x: 100,
            y: 100,
            shadow: { anchor: { x: 50, y: 50 }, size: { x: 40, y: 20 } },
            hitbox: { x: 40, y: 20, offset: { x: 5, y: -3 } },
        };

        const bounds = getHitboxBounds(entity);

        expect(bounds.bottom).toBe(97);
        expect(bounds.top).toBe(77);
        expect(bounds.left).toBe(85);
        expect(bounds.right).toBe(125);
    });

    it('cloneHitbox copies offset', () => {
        const cloned = cloneHitbox({ x: 10, y: 10, offset: { x: 1, y: -2 } });
        expect(cloned).toEqual({ x: 10, y: 10, offset: { x: 1, y: -2 } });
    });
});
