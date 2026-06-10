import { getSpriteFrameSrc } from '../animation/spriteFrame.js';
import type { Projectile } from '../systems/collision.js';
import type { ItemEffect } from '../items/effects/types.js';
import type { ItemDefinition } from '../items/types.js';
import {
    isActiveItemVisuals,
    type AreaItemVisual,
    type MeleeItemVisual,
    type ProjectileItemVisual,
} from '../items/visuals/types.js';
import { resolveStaticSpriteSrc } from '../items/visuals/resolve.js';

export type ItemVisualLibrary = Map<string, HTMLImageElement>;

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load item sprite: ${src}`));
        img.src = src;
    });
}

export async function loadItemVisualLibrary(urls: readonly string[]): Promise<ItemVisualLibrary> {
    const unique = [...new Set(urls.filter(Boolean))];
    const entries = await Promise.all(
        unique.map(async (url) => [url, await loadImage(url)] as const),
    );
    return new Map(entries);
}

/** Rotation for sprites authored facing north (canvas up). */
export function itemTravelAngle(direction: { dx: number; dy: number }): number {
    return Math.atan2(direction.dy, direction.dx) + Math.PI / 2;
}

export function facingAngle(facing: { dx: number; dy: number }): number {
    return Math.atan2(facing.dy, facing.dx);
}

export function drawItemIcon(
    ctx: CanvasRenderingContext2D,
    src: string,
    size: number,
    x: number,
    y: number,
    library: ItemVisualLibrary | null,
) {
    const image = library?.get(src);
    if (!image) return;

    ctx.drawImage(image, x - size / 2, y - size / 2, size, size);
}

export function drawProjectileItemVisual(
    ctx: CanvasRenderingContext2D,
    visual: ProjectileItemVisual,
    x: number,
    y: number,
    direction: { dx: number; dy: number },
    library: ItemVisualLibrary | null,
) {
    const src = getSpriteFrameSrc(visual.sprite);
    const image = library?.get(src);
    if (!image) return;

    const drawH = visual.size;
    const scale = drawH / image.height;
    const drawW = image.width * scale;
    const rotate = visual.rotateWithTravel !== false;
    const angle = rotate ? itemTravelAngle(direction) : 0;

    ctx.save();
    ctx.translate(x, y);
    if (rotate) ctx.rotate(angle);
    ctx.drawImage(image, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
}

export function drawMeleeItemVisual(
    ctx: CanvasRenderingContext2D,
    visual: MeleeItemVisual,
    origin: { x: number; y: number },
    facing: { dx: number; dy: number },
    library: ItemVisualLibrary | null,
    alpha = 1,
) {
    const src = resolveStaticSpriteSrc(visual.sprite);
    const image = library?.get(src);
    if (!image) return;

    const drawH = visual.size;
    const scale = drawH / image.height;
    const drawW = image.width * scale;
    const angle = facingAngle(facing);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(origin.x, origin.y);
    ctx.rotate(angle);
    ctx.drawImage(image, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
}

export function drawAreaItemVisual(
    ctx: CanvasRenderingContext2D,
    visual: AreaItemVisual,
    center: { x: number; y: number },
    library: ItemVisualLibrary | null,
    alpha = 1,
) {
    const src = resolveStaticSpriteSrc(visual.sprite);
    const image = library?.get(src);
    if (!image) return;

    const diameter = visual.radius * 2;
    const scale = diameter / Math.max(image.width, image.height);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(center.x, center.y);
    ctx.drawImage(
        image,
        -(image.width * scale) / 2,
        -(image.height * scale) / 2,
        image.width * scale,
        image.height * scale,
    );
    ctx.restore();
}

export function drawItemEffectVisual(
    ctx: CanvasRenderingContext2D,
    effect: ItemEffect,
    item: ItemDefinition,
    library: ItemVisualLibrary | null,
) {
    if (!item.visuals || !isActiveItemVisuals(item.visuals)) return;

    const progress = effect.elapsedMs / effect.durationMs;
    const alpha = Math.max(0, 1 - progress * 0.35);

    if (effect.kind === 'melee' && item.visuals.world.kind === 'melee') {
        drawMeleeItemVisual(ctx, item.visuals.world, effect, effect.facing, library, alpha);
        return;
    }

    if (effect.kind === 'area' && item.visuals.world.kind === 'area') {
        drawAreaItemVisual(ctx, item.visuals.world, effect, library, alpha);
    }
}

/** Bridge projectile draw to item visual config when available. */
export function applyProjectileVisualFromItem(
    projectile: Projectile,
    item: ItemDefinition,
): Projectile {
    const world = item.visuals && isActiveItemVisuals(item.visuals) ? item.visuals.world : null;
    if (world?.kind !== 'projectile') return projectile;

    return {
        ...projectile,
        sprite: getSpriteFrameSrc(world.sprite),
        spriteSize: world.size,
    };
}
