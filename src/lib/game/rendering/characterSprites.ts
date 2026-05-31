import type { Character } from '../entities/characters/Character.js';
import { CHARACTER_STATS, type CharacterId } from '../entities/characters/index.js';
import type { CharacterSpriteLayout, SpriteFacing } from '../entities/characters/Character.js';
import {
    drawEntityShadow,
    drawEntityVisual,
    loadEntitySprites,
    type EntitySpriteLibrary,
} from './entitySprites.js';

export type { CharacterSpriteLayout, SpriteFacing } from '../entities/characters/Character.js';

export interface FacingDirection {
    dx: number;
    dy: number;
}

export type CharacterSpriteLibrary = EntitySpriteLibrary;

/** @deprecated Use CharacterSpriteLibrary */
export type CharacterSpriteSet = CharacterSpriteLibrary;

export function facingToSpriteKey(facing: FacingDirection): SpriteFacing {
    const sx = Math.sign(facing.dx);
    const sy = Math.sign(facing.dy);

    if (sx >= 0 && sy >= 0) return 'se';
    if (sx < 0 && sy >= 0) return 'sw';
    if (sx < 0 && sy < 0) return 'nw';
    return 'ne';
}

export async function loadCharacterSprites(type: CharacterId): Promise<CharacterSpriteLibrary> {
    return loadEntitySprites(CHARACTER_STATS[type].sprite);
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

export function drawCharacterShadow(ctx: CanvasRenderingContext2D, character: Character) {
    drawEntityShadow(ctx, character);
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
    sprites: CharacterSpriteLibrary | null,
    options: DrawCharacterVisualOptions = {},
) {
    const { showHitbox = true, showRange = false } = options;

    if (showRange) {
        drawCharacterAttackRange(ctx, character);
    }

    drawEntityVisual(ctx, character, facing, sprites);

    if (showHitbox) {
        drawCharacterHitbox(ctx, character);
    }
}

export function drawCharacterSprite(
    ctx: CanvasRenderingContext2D,
    character: Character,
    facing: FacingDirection,
    library: CharacterSpriteLibrary | null,
    layout: CharacterSpriteLayout = getCharacterSpriteLayout(character),
) {
    drawEntityVisual(ctx, character, facing, library, layout);
}

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
