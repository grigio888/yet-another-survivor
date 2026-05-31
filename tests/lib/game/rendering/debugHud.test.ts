import { describe, expect, it, vi } from 'vitest';
import { drawDebugHud } from '$lib/game/rendering/debugHud';

describe('drawDebugHud', () => {
    it('clears the canvas and draws each line top-right by default', () => {
        const ctx = {
            clearRect: vi.fn(),
            fillText: vi.fn(),
            fillStyle: '',
            font: '',
            textAlign: 'left',
        };
        const canvas = {
            getContext: vi.fn(() => ctx),
        } as unknown as HTMLCanvasElement;

        drawDebugHud(canvas, {
            width: 800,
            height: 600,
            lines: ['line one', 'line two'],
            lineHeight: 15,
        });

        expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 800, 600);
        expect(ctx.textAlign).toBe('left');
        expect(ctx.fillText).toHaveBeenCalledWith('line one', 795, 15);
        expect(ctx.fillText).toHaveBeenCalledWith('line two', 795, 30);
    });

    it('supports left alignment when requested', () => {
        const ctx = {
            clearRect: vi.fn(),
            fillText: vi.fn(),
            fillStyle: '',
            font: '',
            textAlign: 'left',
        };
        const canvas = {
            getContext: vi.fn(() => ctx),
        } as unknown as HTMLCanvasElement;

        drawDebugHud(canvas, {
            width: 800,
            height: 600,
            lines: ['line one'],
            align: 'left',
        });

        expect(ctx.fillText).toHaveBeenCalledWith('line one', 5, 15);
    });
});
