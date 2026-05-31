import { describe, expect, it } from 'vitest';
import { circleHitsHitbox, hitboxCollidesWithCircle } from '$lib/game/systems/hitbox.js';

describe('hitbox', () => {
    const enemy = {
        x: 100,
        y: 100,
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
});
