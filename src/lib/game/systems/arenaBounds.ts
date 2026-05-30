import { CANVAS } from '../config/index.js';

/** HP bar sits above the enemy body in arenaRender */
export const ENEMY_HP_BAR_OFFSET = 8;

/** True when the enemy body + HP bar does not overlap the canvas viewport. */
export function isOutsideCanvasView(
    x: number,
    y: number,
    size: number,
    width: number = CANVAS.width,
    height: number = CANVAS.height,
    margin: number = 0,
): boolean {
    const half = size / 2 + margin;
    const top = y - half - ENEMY_HP_BAR_OFFSET;
    const bottom = y + half;
    const left = x - half;
    const right = x + half;

    return bottom < 0 || top > height || right < 0 || left > width;
}

/** True when any part of the enemy body overlaps the canvas viewport. */
export function isInsideCanvasView(
    x: number,
    y: number,
    size: number,
    width: number = CANVAS.width,
    height: number = CANVAS.height,
): boolean {
    return !isOutsideCanvasView(x, y, size, width, height);
}
