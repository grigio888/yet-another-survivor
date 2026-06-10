import { describe, expect, it } from 'vitest';
import {
    facingAngle,
    itemTravelAngle,
} from '$lib/game/rendering/itemSprites';

describe('itemSprites angles', () => {
    it('itemTravelAngle points north-authored sprites along travel direction', () => {
        expect(itemTravelAngle({ dx: 1, dy: 0 })).toBeCloseTo(Math.PI / 2);
        expect(itemTravelAngle({ dx: 0, dy: 1 })).toBeCloseTo(Math.PI);
    });

    it('facingAngle aligns melee swings with character facing', () => {
        expect(facingAngle({ dx: 1, dy: 0 })).toBeCloseTo(0);
        expect(facingAngle({ dx: 0, dy: 1 })).toBeCloseTo(Math.PI / 2);
    });
});
