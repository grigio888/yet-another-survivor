import { describe, it, expect } from 'vitest';
import { compareDepth, sortByDepth } from '$lib/game/rendering/depthSort';

describe('depthSort', () => {
    it('sorts entities with lower y before higher y', () => {
        const entities = [{ y: 300, id: 'a' }, { y: 100, id: 'b' }, { y: 200, id: 'c' }];

        expect(sortByDepth(entities)).toEqual([
            { y: 100, id: 'b' },
            { y: 200, id: 'c' },
            { y: 300, id: 'a' },
        ]);
    });

    it('compareDepth orders ascending by y', () => {
        expect(compareDepth({ y: 50 }, { y: 100 })).toBeLessThan(0);
        expect(compareDepth({ y: 100 }, { y: 50 })).toBeGreaterThan(0);
    });
});
