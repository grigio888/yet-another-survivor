import { getHitboxBounds, type HitboxEntity } from '../systems/hitbox.js';

export function drawHitboxOutline(
    ctx: CanvasRenderingContext2D,
    entity: HitboxEntity,
    strokeStyle = 'rgba(251, 191, 36, 0.75)',
) {
    const { left, top } = getHitboxBounds(entity);

    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(left, top, entity.hitbox.x, entity.hitbox.y);
    ctx.setLineDash([]);
}
