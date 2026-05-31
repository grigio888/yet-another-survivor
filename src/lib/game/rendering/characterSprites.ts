import type { Character } from '../entities/characters/Character.js';
import { CHARACTER_STATS, type CharacterId } from '../entities/characters/index.js';
import type { CharacterSpriteLayout, SpriteFacing } from '../entities/characters/Character.js';
import {
    drawEntityShadow,
    drawEntityVisual,
    loadEntitySprites,
    type EntitySpriteLibrary,
} from './entitySprites.js';
import { getEntityAnchorPoint, resolveEntityLayout } from './shadow.js';
import { drawHitboxOutline } from './hitboxRender.js';
import type { FacingDirection } from './facing.js';

export type { CharacterSpriteLayout, SpriteFacing } from '../entities/characters/Character.js';
export { facingToSpriteKey, snapEightDirection, type FacingDirection } from './facing.js';

export type CharacterSpriteLibrary = EntitySpriteLibrary;

/** @deprecated Use CharacterSpriteLibrary */
export type CharacterSpriteSet = CharacterSpriteLibrary;

export async function loadCharacterSprites(type: CharacterId): Promise<CharacterSpriteLibrary> {
    return loadEntitySprites(CHARACTER_STATS[type].sprite);
}

export function getCharacterSpriteLayout(character: Character): CharacterSpriteLayout {
    return character.sprite.layout;
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
    const { anchor } = resolveEntityLayout(character);
    ctx.strokeStyle = 'rgba(96, 165, 250, 0.3)';
    ctx.fillStyle = 'rgba(96, 165, 250, 0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(anchor.x, anchor.y, character.range, 0, Math.PI * 2);
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
    drawHitboxOutline(ctx, character);
}
