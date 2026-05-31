import type { EntityShadow, ShadowedEntity } from '../rendering/shadow.js';
import { resolveEntityLayout } from '../rendering/shadow.js';

export type Hitbox = {
    /** Width in pixels, centered on the sprite-start anchor (+ offset) */
    x: number;
    /** Height in pixels, extending upward from the hitbox bottom */
    y: number;
    /** Pixel offset of the hitbox bottom-center from the sprite-start anchor */
    offset?: { x: number; y: number };
};

export function getHitboxOffset(hitbox: Hitbox): { x: number; y: number } {
    return hitbox.offset ?? { x: 0, y: 0 };
}

export function cloneHitbox(hitbox: Hitbox): Hitbox {
    return {
        x: hitbox.x,
        y: hitbox.y,
        ...(hitbox.offset ? { offset: { ...hitbox.offset } } : {}),
    };
}

/** Use catalog stats for debug overlays so hitbox edits show without respawning. */
export function withLiveHitbox<T extends HitboxEntity>(entity: T, hitbox: Hitbox): T {
    return { ...entity, hitbox: cloneHitbox(hitbox) };
}

export type HitboxEntity = ShadowedEntity & {
    hitbox: Hitbox;
    shadow: EntityShadow;
};

export type CircleEntity = {
    x: number;
    y: number;
    size: number;
};

/** Axis-aligned hitbox bounds. Bottom-center sits on sprite-start + offset. */
export function getHitboxBounds(entity: HitboxEntity) {
    const { spriteStart } = resolveEntityLayout(entity);
    const offset = getHitboxOffset(entity.hitbox);
    const halfW = entity.hitbox.x / 2;
    const bottom = spriteStart.y + offset.y;
    const centerX = spriteStart.x + offset.x;

    return {
        left: centerX - halfW,
        right: centerX + halfW,
        top: bottom - entity.hitbox.y,
        bottom,
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

export function hitboxesOverlap(a: HitboxEntity, b: HitboxEntity): boolean {
    const aBounds = getHitboxBounds(a);
    const bBounds = getHitboxBounds(b);

    return (
        aBounds.left < bBounds.right &&
        aBounds.right > bBounds.left &&
        aBounds.top < bBounds.bottom &&
        aBounds.bottom > bBounds.top
    );
}

type PositionedHitboxEntity = HitboxEntity & { x: number; y: number };

function resolveHitboxOverlap(a: PositionedHitboxEntity, b: PositionedHitboxEntity): void {
    const aBounds = getHitboxBounds(a);
    const bBounds = getHitboxBounds(b);

    const overlapX = Math.min(aBounds.right, bBounds.right) - Math.max(aBounds.left, bBounds.left);
    const overlapY = Math.min(aBounds.bottom, bBounds.bottom) - Math.max(aBounds.top, bBounds.top);

    if (overlapX <= 0 || overlapY <= 0) return;

    const aCenterX = (aBounds.left + aBounds.right) / 2;
    const aCenterY = (aBounds.top + aBounds.bottom) / 2;
    const bCenterX = (bBounds.left + bBounds.right) / 2;
    const bCenterY = (bBounds.top + bBounds.bottom) / 2;

    if (overlapX < overlapY) {
        const push = overlapX / 2;
        const sign = aCenterX <= bCenterX ? -1 : 1;
        a.x += sign * push;
        b.x -= sign * push;
        return;
    }

    const push = overlapY / 2;
    const sign = aCenterY <= bCenterY ? -1 : 1;
    a.y += sign * push;
    b.y -= sign * push;
}

/** Push overlapping entities apart using their hitbox rectangles (not shadow-center circles). */
export function separateHitboxEntities(
    entities: PositionedHitboxEntity[],
    iterations: number = 1,
): void {
    for (let pass = 0; pass < iterations; pass++) {
        for (let i = 0; i < entities.length; i++) {
            for (let j = i + 1; j < entities.length; j++) {
                resolveHitboxOverlap(entities[i], entities[j]);
            }
        }
    }
}

/** Furthest reach from the shadow anchor — legacy estimate, prefer separateHitboxEntities. */
export function getHitboxCollisionRadius(hitbox: Hitbox): number {
    return Math.hypot(hitbox.x / 2, hitbox.y);
}

export function getHitboxHorizontalRadius(hitbox: Hitbox): number {
    return hitbox.x / 2;
}
