import { describe, expect, it } from 'vitest';
import {
    DamageNumberManager,
    damageNumberAlpha,
    damageNumberArcOffset,
} from '$lib/game/polish/damageNumbers.js';
import { horizontalDriftDirection } from '$lib/game/polish/damagePopups.js';

describe('damageNumberArcOffset', () => {
    it('starts at origin, peaks at 70%, and settles above origin', () => {
        expect(damageNumberArcOffset(0)).toBeCloseTo(0, 5);
        expect(damageNumberArcOffset(0.7)).toBeCloseTo(-30, 5);
        expect(damageNumberArcOffset(1)).toBeCloseTo(-21.6, 1);
    });

    it('rises before the peak and falls gently after it', () => {
        expect(damageNumberArcOffset(0.35)).toBeLessThan(damageNumberArcOffset(0));
        expect(damageNumberArcOffset(0.85)).toBeGreaterThan(damageNumberArcOffset(0.7));
        expect(damageNumberArcOffset(1)).toBeGreaterThan(damageNumberArcOffset(0.85));
    });

    it('has zero slope at the peak for smooth velocity', () => {
        const before = damageNumberArcOffset(0.69);
        const peak = damageNumberArcOffset(0.7);
        const after = damageNumberArcOffset(0.71);

        expect(Math.abs(peak - before)).toBeLessThan(0.6);
        expect(Math.abs(peak - after)).toBeLessThan(0.6);
    });
});

describe('horizontalDriftDirection', () => {
    it('drifts left when the source is left of the character', () => {
        expect(horizontalDriftDirection(100, 200)).toBe(-1);
    });

    it('drifts right when the source is right of the character', () => {
        expect(horizontalDriftDirection(300, 200)).toBe(1);
    });
});

describe('damageNumberAlpha', () => {
    it('fades in and out smoothly', () => {
        expect(damageNumberAlpha(0)).toBe(0);
        expect(damageNumberAlpha(0.2)).toBe(1);
        expect(damageNumberAlpha(0.9)).toBeLessThan(1);
        expect(damageNumberAlpha(1)).toBe(0);
    });
});

describe('DamageNumberManager', () => {
    it('spawns floating numbers and removes them after life expires', () => {
        const manager = new DamageNumberManager();
        manager.spawn([{ x: 100, y: 100, amount: 25, target: 'enemy', driftDirection: -1 }]);

        manager.update(0.2);
        expect(manager.count).toBe(1);

        manager.update(1);
        expect(manager.count).toBe(0);
    });

    it('ignores zero or negative amounts', () => {
        const manager = new DamageNumberManager();
        manager.spawn([
            { x: 0, y: 0, amount: 0, target: 'enemy', driftDirection: 1 },
            { x: 0, y: 0, amount: -5, target: 'player', driftDirection: -1 },
        ]);

        expect(manager.count).toBe(0);
    });
});
