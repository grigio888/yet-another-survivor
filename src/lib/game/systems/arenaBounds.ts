import { CANVAS } from '../config/index.js';

/** Gap between the enemy body bottom and the HP bar */
export const ENEMY_HP_BAR_GAP = 4;
export const ENEMY_HP_BAR_HEIGHT = 4;
/** Total vertical space the HP bar occupies below the enemy body */
export const ENEMY_HP_BAR_OFFSET = ENEMY_HP_BAR_GAP + ENEMY_HP_BAR_HEIGHT;

/** True when the enemy hitbox + HP bar does not overlap the canvas viewport. */
export function isOutsideCanvasView(
    x: number,
    y: number,
    bodyWidth: number,
    bodyHeight: number = bodyWidth,
    width: number = CANVAS.width,
    height: number = CANVAS.height,
    margin: number = 0,
): boolean {
    const halfW = bodyWidth / 2 + margin;
    const top = y - bodyHeight - margin;
    const bottom = y + ENEMY_HP_BAR_OFFSET + margin;
    const left = x - halfW;
    const right = x + halfW;

    return bottom < 0 || top > height || right < 0 || left > width;
}

/** True when any part of the enemy body overlaps the canvas viewport. */
export function isInsideCanvasView(
    x: number,
    y: number,
    bodyWidth: number,
    bodyHeight: number = bodyWidth,
    width: number = CANVAS.width,
    height: number = CANVAS.height,
): boolean {
    return !isOutsideCanvasView(x, y, bodyWidth, bodyHeight, width, height);
}
