import { describe, expect, it } from 'vitest';
import {
    defaultEntityShadow,
    getShadowBounds,
    getSpriteStartPoint,
    resolveEntityLayout,
} from '$lib/game/rendering/shadow.js';

describe('shadow', () => {
    const jellyShadow = {
        anchor: { x: 50, y: 50 },
        size: { x: 50, y: 25 },
    };

    it('centers the shadow on the entity position', () => {
        const bounds = getShadowBounds({
            x: 100,
            y: 200,
            shadow: jellyShadow,
        });

        expect(bounds.centerX).toBe(100);
        expect(bounds.centerY).toBe(200);
        expect(bounds.left).toBe(75);
        expect(bounds.top).toBe(187.5);
    });

    it('resolves sprite start from shadow anchor', () => {
        expect(getSpriteStartPoint({ x: 100, y: 200, shadow: jellyShadow })).toEqual({
            x: 100,
            y: 200,
        });

        expect(
            getSpriteStartPoint({
                x: 100,
                y: 200,
                shadow: { anchor: { x: 50, y: 100 }, size: { x: 40, y: 20 } },
            }),
        ).toEqual({ x: 100, y: 210 });
    });

    it('exposes layout through a single resolver', () => {
        const layout = resolveEntityLayout({ x: 100, y: 200, shadow: jellyShadow });
        expect(layout.shadow.centerX).toBe(100);
        expect(layout.spriteStart).toEqual({ x: 100, y: 200 });
    });

    it('builds a circular default shadow from entity size', () => {
        expect(defaultEntityShadow(24)).toEqual({
            anchor: { x: 50, y: 50 },
            size: { x: 24, y: 24 },
        });
    });
});
