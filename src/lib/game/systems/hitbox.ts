export type Hitbox = {
    /** Width in pixels, centered horizontally on the entity anchor */
    x: number;
    /** Height in pixels, extending upward from the shadow-center anchor */
    y: number;
};

export type HitboxEntity = {
    /** Shadow-center anchor (feet) */
    x: number;
    y: number;
    hitbox: Hitbox;
};

export type CircleEntity = {
    x: number;
    y: number;
    size: number;
};

/** Axis-aligned hitbox bounds. Bottom edge sits on the entity anchor (shadow center). */
export function getHitboxBounds(entity: HitboxEntity) {
    const halfW = entity.hitbox.x / 2;
    return {
        left: entity.x - halfW,
        right: entity.x + halfW,
        top: entity.y - entity.hitbox.y,
        bottom: entity.y,
    };
}

/** Circle vs axis-aligned hitbox centered on an entity. */
export function circleHitsHitbox(
    cx: number,
    cy: number,
    radius: number,
    entity: HitboxEntity,
): boolean {
    const { left, right, top, bottom } = getHitboxBounds(entity);
    const closestX = Math.max(left, Math.min(cx, right));
    const closestY = Math.max(top, Math.min(cy, bottom));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return dx * dx + dy * dy <= radius * radius;
}

export function hitboxCollidesWithCircle(entity: HitboxEntity, circle: CircleEntity): boolean {
    return circleHitsHitbox(circle.x, circle.y, circle.size / 2, entity);
}

/** Furthest reach from the shadow anchor, for rough circle-based separation. */
export function getHitboxCollisionRadius(hitbox: Hitbox): number {
    return Math.hypot(hitbox.x / 2, hitbox.y);
}

export function getHitboxHorizontalRadius(hitbox: Hitbox): number {
    return hitbox.x / 2;
}
