import { describe, expect, it } from 'vitest';
import { CANVAS } from '$lib/game/config';
import { isInsideCanvasView, isOutsideCanvasView } from '$lib/game/systems/arenaBounds';

describe('arenaBounds', () => {
    const size = 20;

    it('detects a point at the canvas center as inside', () => {
        expect(isInsideCanvasView(CANVAS.width / 2, CANVAS.height / 2, size)).toBe(true);
        expect(isOutsideCanvasView(CANVAS.width / 2, CANVAS.height / 2, size)).toBe(false);
    });

    it('detects enemies fully above the canvas as outside', () => {
        expect(isOutsideCanvasView(CANVAS.width / 2, -50, size)).toBe(true);
        expect(isInsideCanvasView(CANVAS.width / 2, -50, size)).toBe(false);
    });

    it('detects enemies fully below the canvas as outside', () => {
        expect(isOutsideCanvasView(CANVAS.width / 2, CANVAS.height + 50, size)).toBe(true);
    });

    it('detects enemies fully left of the canvas as outside', () => {
        expect(isOutsideCanvasView(-50, CANVAS.height / 2, size)).toBe(true);
    });

    it('detects enemies fully right of the canvas as outside', () => {
        expect(isOutsideCanvasView(CANVAS.width + 50, CANVAS.height / 2, size)).toBe(true);
    });

    it('treats partially overlapping bodies as inside', () => {
        expect(isInsideCanvasView(5, CANVAS.height / 2, size)).toBe(true);
        expect(isOutsideCanvasView(5, CANVAS.height / 2, size)).toBe(false);
    });
});
