import { describe, it, expect } from 'vitest';
import {
    drawAnimatedSprite,
    drawEntityFallback,
    drawEntityVisual,
    type EntitySpriteLibrary,
} from '$lib/game/rendering/entitySprites.js';
import { SpriteAnimator } from '$lib/game/animation/SpriteAnimator.js';
import { MAGE_STATS } from '$lib/game/entities/characters/Mage.js';

describe('entitySprites fallback', () => {
    it('drawEntityFallback renders a colored square', () => {
        const calls: { fillStyle: string | CanvasGradient | CanvasPattern; rect: number[] }[] = [];
        const ctx = {
            fillStyle: '',
            fillRect(...args: number[]) {
                calls.push({ fillStyle: this.fillStyle, rect: args });
            },
        } as unknown as CanvasRenderingContext2D;

        drawEntityFallback(ctx, { x: 50, y: 60, size: 20, color: '#ff0000' });

        expect(calls).toHaveLength(1);
        expect(calls[0].fillStyle).toBe('#ff0000');
        expect(calls[0].rect).toEqual([40, 50, 20, 20]);
    });

    it('drawEntityVisual uses the square fallback when no library is loaded', () => {
        const fillRects: number[][] = [];
        const drawImages: unknown[] = [];
        const ctx = {
            fillStyle: '',
            fillRect(...args: number[]) {
                fillRects.push(args);
            },
            drawImage(...args: unknown[]) {
                drawImages.push(args);
            },
            createRadialGradient() {
                return { addColorStop() {} };
            },
            beginPath() {},
            arc() {},
            fill() {},
        } as unknown as CanvasRenderingContext2D;

        const entity = {
            x: 10,
            y: 20,
            size: 16,
            color: '#00ff00',
            animator: new SpriteAnimator(MAGE_STATS.sprite),
        };

        drawEntityVisual(ctx, entity, { dx: 0, dy: 1 }, null);

        expect(fillRects).toHaveLength(1);
        expect(drawImages).toHaveLength(0);
    });

    it('drawAnimatedSprite mirrors SE facings when facingFlips.horizontal is set', () => {
        const scales: Array<[number, number]> = [];
        const img = { width: 32, height: 32 } as HTMLImageElement;
        const frame = { image: img, overrides: {} };
        const library: EntitySpriteLibrary = {
            layout: {
                feetFromBottom: 8,
                heightScale: 3.5,
                zoom: 1.05,
                liftFromShadowCenter: 0.15,
            },
            ready: true,
            facingFlips: { se: { horizontal: true } },
            animations: {
                idle: {
                    ne: [frame],
                    nw: [frame],
                    se: [frame],
                    sw: [frame],
                },
            } as EntitySpriteLibrary['animations'],
        };

        const ctx = {
            save() {},
            restore() {},
            translate() {},
            scale(sx: number, sy: number) {
                scales.push([sx, sy]);
            },
            drawImage() {},
            createRadialGradient() {
                return { addColorStop() {} };
            },
            beginPath() {},
            arc() {},
            fill() {},
        } as unknown as CanvasRenderingContext2D;

        const entity = {
            x: 100,
            y: 100,
            size: 26,
            color: '#f472b6',
            animator: new SpriteAnimator({
                layout: library.layout,
                idle: { ne: '', nw: '', se: '', sw: '' },
            }),
        };

        drawAnimatedSprite(ctx, entity, { dx: 1, dy: 1 }, library);

        expect(scales).toContainEqual([-1, 1]);
    });
});
