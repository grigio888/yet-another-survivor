import { describe, expect, it } from 'vitest';
import { facingToSpriteKey, snapEightDirection } from '$lib/game/rendering/characterSprites';

describe('characterSprites helpers', () => {
    describe('facingToSpriteKey', () => {
        it('maps positive x and y to se', () => {
            expect(facingToSpriteKey({ dx: 1, dy: 1 })).toBe('se');
        });

        it('maps negative x and positive y to sw', () => {
            expect(facingToSpriteKey({ dx: -1, dy: 1 })).toBe('sw');
        });

        it('maps negative x and y to nw', () => {
            expect(facingToSpriteKey({ dx: -1, dy: -1 })).toBe('nw');
        });

        it('maps positive x and negative y to ne', () => {
            expect(facingToSpriteKey({ dx: 1, dy: -1 })).toBe('ne');
        });
    });

    describe('snapEightDirection', () => {
        it('snaps pure right movement', () => {
            expect(snapEightDirection(1, 0)).toEqual({ dx: 1, dy: 0 });
        });

        it('snaps pure up movement', () => {
            expect(snapEightDirection(0, -1)).toEqual({ dx: 0, dy: -1 });
        });

        it('normalizes diagonal movement', () => {
            const facing = snapEightDirection(1, 1);
            const inv = 1 / Math.SQRT2;

            expect(facing.dx).toBeCloseTo(inv);
            expect(facing.dy).toBeCloseTo(inv);
        });
    });
});
