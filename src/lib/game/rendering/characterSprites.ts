import type { Character } from '../entities/characters/Character.js';
import { CHARACTER_STATS, type CharacterId } from '../entities/characters/index.js';
import type { CharacterSpriteLayout, SpriteFacing } from '../entities/characters/Character.js';

export type { CharacterSpriteLayout, SpriteFacing } from '../entities/characters/Character.js';

export interface FacingDirection {
    dx: number;
    dy: number;
}

export interface CharacterSpriteSet {
    ne: HTMLImageElement;
    nw: HTMLImageElement;
    se: HTMLImageElement;
    sw: HTMLImageElement;
    ready: boolean;
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load sprite: ${src}`));
        img.src = src;
    });
}

export function facingToSpriteKey(facing: FacingDirection): SpriteFacing {
    const sx = Math.sign(facing.dx);
    const sy = Math.sign(facing.dy);

    if (sx >= 0 && sy >= 0) return 'se';
    if (sx < 0 && sy >= 0) return 'sw';
    if (sx < 0 && sy < 0) return 'nw';
    return 'ne';
}

export async function loadCharacterSprites(type: CharacterId): Promise<CharacterSpriteSet> {
    const urls = CHARACTER_STATS[type].sprite.idle;
    const [ne, nw, se, sw] = await Promise.all([
        loadImage(urls.ne),
        loadImage(urls.nw),
        loadImage(urls.se),
        loadImage(urls.sw),
    ]);

    return { ne, nw, se, sw, ready: true };
}

export function getCharacterSpriteLayout(character: Character): CharacterSpriteLayout {
    return character.sprite.layout;
}

export function snapEightDirection(dx: number, dy: number): FacingDirection {
    const sx = Math.sign(dx);
    const sy = Math.sign(dy);
    if (sx === 0) return { dx: 0, dy: sy };
    if (sy === 0) return { dx: sx, dy: 0 };
    const inv = 1 / Math.SQRT2;
    return { dx: sx * inv, dy: sy * inv };
}

/** Ground shadow — centered on the collision/hitbox position. */
export function drawCharacterShadow(ctx: CanvasRenderingContext2D, character: Character) {
    const { x, y, size, color } = character;
    const r = size / 2;

    const halo = ctx.createRadialGradient(x, y, r * 0.15, x, y, r * 1.05);
    halo.addColorStop(0, 'rgba(15, 23, 42, 0.28)');
    halo.addColorStop(0.55, 'rgba(15, 23, 42, 0.14)');
    halo.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(x, y, r * 1.05, 0, Math.PI * 2);
    ctx.fill();

    const core = ctx.createRadialGradient(x, y, 0, x, y, r * 0.72);
    core.addColorStop(0, 'rgba(15, 23, 42, 0.55)');
    core.addColorStop(0.85, `${color}55`);
    core.addColorStop(1, 'rgba(15, 23, 42, 0.22)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.72, 0, Math.PI * 2);
    ctx.fill();
}

export interface DrawCharacterVisualOptions {
    showHitbox?: boolean;
    showRange?: boolean;
}

export function drawCharacterAttackRange(
    ctx: CanvasRenderingContext2D,
    character: Character,
) {
    ctx.strokeStyle = 'rgba(96, 165, 250, 0.3)';
    ctx.fillStyle = 'rgba(96, 165, 250, 0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(character.x, character.y, character.range, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
}

/** Shadow + sprite render. Hitbox is optional (debug overlay). */
export function drawCharacterVisual(
    ctx: CanvasRenderingContext2D,
    character: Character,
    facing: FacingDirection,
    sprites: CharacterSpriteSet | null,
    options: DrawCharacterVisualOptions = {},
) {
    const { showHitbox = true, showRange = false } = options;

    if (showRange) {
        drawCharacterAttackRange(ctx, character);
    }

    drawCharacterShadow(ctx, character);

    if (sprites?.ready) {
        drawCharacterSprite(ctx, character, facing, sprites);
    }

    if (showHitbox) {
        drawCharacterHitbox(ctx, character);
    }
}

/**
 * Draw a character sprite anchored so the feet sit above the shadow center.
 * Collision/hitbox remains at character.x, character.y — this is visual only.
 */
export function drawCharacterSprite(
    ctx: CanvasRenderingContext2D,
    character: Character,
    facing: FacingDirection,
    sprites: CharacterSpriteSet,
    layout: CharacterSpriteLayout = getCharacterSpriteLayout(character),
) {
    if (!sprites.ready) return;

    const key = facingToSpriteKey(facing);
    const img = sprites[key];
    const shadowRadius = character.size / 2;

    const drawH = character.size * layout.heightScale * layout.zoom;
    const scale = drawH / img.height;
    const drawW = img.width * scale;

    const feetY = character.y - shadowRadius * layout.liftFromShadowCenter;
    const feetAnchor = layout.feetFromBottom * scale;
    const drawX = character.x - drawW / 2;
    const drawY = feetY - drawH + feetAnchor;

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
}

/** Debug overlay — shows collision circle independent of sprite bounds. */
export function drawCharacterHitbox(
    ctx: CanvasRenderingContext2D,
    character: Character,
) {
    const r = character.size / 2;

    ctx.strokeStyle = 'rgba(251, 191, 36, 0.55)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(character.x, character.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
}
