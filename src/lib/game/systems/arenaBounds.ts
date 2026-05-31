import { CANVAS } from '../config/index.js';
import {
    getEntityFootprint,
    type EntityShadow,
} from '../rendering/shadow.js';

/** Gap between the enemy body bottom and the HP bar */
export const ENEMY_HP_BAR_GAP = 4;
export const ENEMY_HP_BAR_HEIGHT = 4;
/** Total vertical space the HP bar occupies below the enemy body */
export const ENEMY_HP_BAR_OFFSET = ENEMY_HP_BAR_GAP + ENEMY_HP_BAR_HEIGHT;

/** True when a sprite-anchored body does not overlap the canvas viewport. */
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

/** True when the full shadow-resolved entity does not overlap the viewport. */
export function isOutsideShadowEntityView(
    x: number,
    y: number,
    shadow: EntityShadow,
    bodyWidth: number,
    bodyHeight: number = bodyWidth,
    width: number = CANVAS.width,
    height: number = CANVAS.height,
    margin: number = 0,
): boolean {
    const footprint = getEntityFootprint(
        { x, y, shadow },
        { x: bodyWidth, y: bodyHeight },
        ENEMY_HP_BAR_OFFSET + margin,
    );

    return (
        footprint.bottom + margin < 0 ||
        footprint.top - margin > height ||
        footprint.right + margin < 0 ||
        footprint.left - margin > width
    );
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

/** True when any part of a shadow entity overlaps the canvas viewport. */
export function isInsideShadowEntityView(
    x: number,
    y: number,
    shadow: EntityShadow,
    bodyWidth: number,
    bodyHeight: number = bodyWidth,
    width: number = CANVAS.width,
    height: number = CANVAS.height,
): boolean {
    return !isOutsideShadowEntityView(x, y, shadow, bodyWidth, bodyHeight, width, height);
}
