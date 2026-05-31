import { describe, expect, it } from 'vitest';
import {
    applySpriteFrameLayout,
    getSpriteFrameOverrides,
    getSpriteFrameSrc,
    mergeSpriteFrameLayout,
} from '$lib/game/animation/spriteFrame.js';

const BASE_LAYOUT = {
    heightScale: 3.5,
    zoom: 1.05,
};

describe('spriteFrame', () => {
    it('reads src from string and object frames', () => {
        expect(getSpriteFrameSrc('/a.png')).toBe('/a.png');
        expect(getSpriteFrameSrc({ src: '/b.png', x: 2 })).toBe('/b.png');
    });

    it('extracts per-frame overrides', () => {
        expect(getSpriteFrameOverrides('/a.png')).toEqual({});
        expect(getSpriteFrameOverrides({ src: '/b.png', x: 2, y: -1, zoom: 1.2 })).toEqual({
            x: 2,
            y: -1,
            zoom: 1.2,
        });
    });

    it('merges layout overrides onto the base layout', () => {
        expect(mergeSpriteFrameLayout(BASE_LAYOUT, '/a.png')).toEqual(BASE_LAYOUT);
        expect(
            applySpriteFrameLayout(BASE_LAYOUT, { zoom: 1.2, heightScale: 4 }),
        ).toEqual({
            heightScale: 4,
            zoom: 1.2,
        });
    });
});
