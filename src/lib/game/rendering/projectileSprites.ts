import type { Projectile } from '../systems/collision.js';

const DEFAULT_SPRITE_SIZE = 24;
const DEFAULT_PROJECTILE_COLOR = '#94a3b8';

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load projectile sprite: ${src}`));
        img.src = src;
    });
}

export type ProjectileSpriteSet = Map<string, HTMLImageElement>;

/** Rotation for a sprite authored facing north (canvas up). */
export function projectileTravelAngle(direction: { dx: number; dy: number }): number {
    return Math.atan2(direction.dy, direction.dx) + Math.PI / 2;
}

export async function loadProjectileSprites(urls: readonly string[]): Promise<ProjectileSpriteSet> {
    const unique = [...new Set(urls.filter(Boolean))];
    const entries = await Promise.all(
        unique.map(async (url) => [url, await loadImage(url)] as const),
    );

    return new Map(entries);
}

export function drawProjectile(
    ctx: CanvasRenderingContext2D,
    projectile: Projectile,
    sprites: ProjectileSpriteSet | null,
) {
    const sprite = projectile.sprite ? sprites?.get(projectile.sprite) : undefined;

    if (sprite) {
        drawProjectileSprite(ctx, projectile, sprite);
        return;
    }

    ctx.fillStyle = projectile.color ?? DEFAULT_PROJECTILE_COLOR;
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, 3, 0, Math.PI * 2);
    ctx.fill();
}

export function drawProjectileSprite(
    ctx: CanvasRenderingContext2D,
    projectile: Projectile,
    sprite: HTMLImageElement,
) {
    const drawH = projectile.spriteSize ?? DEFAULT_SPRITE_SIZE;
    const scale = drawH / sprite.height;
    const drawW = sprite.width * scale;
    const angle = projectileTravelAngle(projectile.direction);

    ctx.save();
    ctx.translate(projectile.x, projectile.y);
    ctx.rotate(angle);
    ctx.drawImage(sprite, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
}

export function drawProjectiles(
    ctx: CanvasRenderingContext2D,
    projectiles: readonly Projectile[],
    sprites: ProjectileSpriteSet | null,
) {
    for (const projectile of projectiles) {
        drawProjectile(ctx, projectile, sprites);
    }
}
