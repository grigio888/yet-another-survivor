export type EntityShadow = {
    /** Horizontal attach + vertical sprite start on the shadow, percent (0–100). Y = where the sprite base begins. */
    anchor: { x: number; y: number };
    /** Shadow ellipse size in pixels */
    size: { x: number; y: number };
};

/** Entity world position (x, y) is the shadow center. All layout derives from shadow. */
export type ShadowedEntity = {
    x: number;
    y: number;
    shadow: EntityShadow;
};

export type ShadowBounds = {
    left: number;
    top: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
    radiusX: number;
    radiusY: number;
};

export type ResolvedEntityLayout = {
    shadow: ShadowBounds;
    /** Where the sprite base starts on the shadow (shadow.anchor). Hitbox bottom aligns here. */
    spriteStart: { x: number; y: number };
    /** @deprecated Use spriteStart */
    anchor: { x: number; y: number };
};

export type EntityFootprint = {
    top: number;
    bottom: number;
    left: number;
    right: number;
    anchor: { x: number; y: number };
    shadow: ShadowBounds;
};

const DEFAULT_HP_BAR_OFFSET = 8;

export function defaultEntityShadow(size: number): EntityShadow {
    return {
        anchor: { x: 50, y: 50 },
        size: { x: size, y: size },
    };
}

export function getShadowBounds(entity: ShadowedEntity): ShadowBounds {
    const { size } = entity.shadow;
    const radiusX = size.x / 2;
    const radiusY = size.y / 2;

    return {
        left: entity.x - radiusX,
        top: entity.y - radiusY,
        width: size.x,
        height: size.y,
        centerX: entity.x,
        centerY: entity.y,
        radiusX,
        radiusY,
    };
}

/** Single resolver — shadow bounds plus sprite-start point from shadow.anchor. */
export function resolveEntityLayout(entity: ShadowedEntity): ResolvedEntityLayout {
    const shadow = getShadowBounds(entity);
    const { anchor } = entity.shadow;

    const spriteStart = {
        x: shadow.left + (anchor.x / 100) * shadow.width,
        y: shadow.top + (anchor.y / 100) * shadow.height,
    };

    return {
        shadow,
        spriteStart,
        anchor: spriteStart,
    };
}

export function getSpriteStartPoint(entity: ShadowedEntity) {
    return resolveEntityLayout(entity).spriteStart;
}

export function getEntityAnchorPoint(entity: ShadowedEntity) {
    return getSpriteStartPoint(entity);
}

/** @deprecated Use getEntityAnchorPoint */
export const getSpriteAnchorPoint = getEntityAnchorPoint;

export function getEntityFootprint(
    entity: ShadowedEntity,
    hitbox?: { x: number; y: number },
    hpBarOffset: number = DEFAULT_HP_BAR_OFFSET,
): EntityFootprint {
    const { shadow, anchor } = resolveEntityLayout(entity);

    let top = shadow.top;
    let bottom = shadow.top + shadow.height;
    let left = shadow.left;
    let right = shadow.left + shadow.width;

    if (hitbox) {
        const offset = hitbox.offset ?? { x: 0, y: 0 };
        const halfW = hitbox.x / 2;
        top = Math.min(top, anchor.y + offset.y - hitbox.y);
        bottom = Math.max(bottom, anchor.y + offset.y);
        left = Math.min(left, anchor.x + offset.x - halfW);
        right = Math.max(right, anchor.x + offset.x + halfW);
    }

    return {
        top,
        bottom: bottom + hpBarOffset,
        left,
        right,
        anchor,
        shadow,
    };
}

export type ShadowEntity = ShadowedEntity & {
    color: string;
};

export function drawEntityShadow(ctx: CanvasRenderingContext2D, entity: ShadowEntity) {
    const { centerX, centerY, radiusX, radiusY } = getShadowBounds(entity);
    const { color } = entity;
    const haloRx = radiusX * 1.05;
    const haloRy = radiusY * 1.05;
    const coreRx = radiusX * 0.72;
    const coreRy = radiusY * 0.72;
    const innerGlow = Math.min(radiusX, radiusY);

    const halo = ctx.createRadialGradient(
        centerX,
        centerY,
        innerGlow * 0.15,
        centerX,
        centerY,
        Math.max(haloRx, haloRy),
    );
    halo.addColorStop(0, 'rgba(15, 23, 42, 0.28)');
    halo.addColorStop(0.55, 'rgba(15, 23, 42, 0.14)');
    halo.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, haloRx, haloRy, 0, 0, Math.PI * 2);
    ctx.fill();

    const core = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, innerGlow * 0.72);
    core.addColorStop(0, 'rgba(15, 23, 42, 0.55)');
    core.addColorStop(0.85, `${color}55`);
    core.addColorStop(1, 'rgba(15, 23, 42, 0.22)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, coreRx, coreRy, 0, 0, Math.PI * 2);
    ctx.fill();
}

export function drawShadowOutline(
    ctx: CanvasRenderingContext2D,
    entity: ShadowedEntity,
    strokeStyle = 'rgba(148, 163, 184, 0.65)',
) {
    const { centerX, centerY, radiusX, radiusY } = getShadowBounds(entity);

    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
}

export function drawSpriteAnchorMarker(
    ctx: CanvasRenderingContext2D,
    entity: ShadowedEntity,
    strokeStyle = 'rgba(56, 189, 248, 0.9)',
) {
    const { anchor } = resolveEntityLayout(entity);

    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(anchor.x - 4, anchor.y);
    ctx.lineTo(anchor.x + 4, anchor.y);
    ctx.moveTo(anchor.x, anchor.y - 4);
    ctx.lineTo(anchor.x, anchor.y + 4);
    ctx.stroke();
}

export function clampShadowCenter(
    entity: ShadowedEntity,
    arenaWidth: number,
    arenaHeight: number,
    hpBarOffset: number = DEFAULT_HP_BAR_OFFSET,
) {
    const { radiusX, radiusY } = getShadowBounds(entity);
    entity.x = Math.max(radiusX, Math.min(arenaWidth - radiusX, entity.x));
    entity.y = Math.max(radiusY, Math.min(arenaHeight - radiusY - hpBarOffset, entity.y));
}
