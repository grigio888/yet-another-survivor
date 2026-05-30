import type { Character } from '../entities/characters/Character.js';
import type { Enemy } from '../entities/enemies/Enemy.js';
import {
    drawCharacterAttackRange,
    drawCharacterHitbox,
    drawCharacterShadow,
    drawCharacterSprite,
    type CharacterSpriteSet,
    type DrawCharacterVisualOptions,
    type FacingDirection,
} from './characterSprites.js';
import { sortByDepth } from './depthSort.js';

export function drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy) {
    ctx.fillStyle = enemy.color;
    ctx.fillRect(enemy.x - enemy.size / 2, enemy.y - enemy.size / 2, enemy.size, enemy.size);

    const hpRatio = enemy.hp / enemy.maxHp;
    const barW = enemy.size;
    ctx.fillStyle = '#ccc';
    ctx.fillRect(enemy.x - barW / 2, enemy.y - enemy.size / 2 - 8, barW, 4);
    ctx.fillStyle = hpRatio > 0.5 ? '#4ade8f' : hpRatio > 0.25 ? '#f59e0b' : '#ef4444';
    ctx.fillRect(enemy.x - barW / 2, enemy.y - enemy.size / 2 - 8, barW * hpRatio, 4);
}

type ArenaDrawable = {
    y: number;
    draw: (ctx: CanvasRenderingContext2D) => void;
};

export interface DrawArenaOptions extends DrawCharacterVisualOptions {
    characterInvincible?: boolean;
}

/**
 * Draw character and enemies sorted by y so lower-on-screen entities appear in front.
 * Range/hitbox overlays are drawn outside the depth-sorted pass.
 */
export function drawArenaEntities(
    ctx: CanvasRenderingContext2D,
    character: Character | null,
    facing: FacingDirection,
    sprites: CharacterSpriteSet | null,
    enemies: readonly Enemy[],
    options: DrawArenaOptions = {},
) {
    const { showRange = false, showHitbox = true, characterInvincible = false } = options;

    if (character && showRange) {
        drawCharacterAttackRange(ctx, character);
    }

    const drawables: ArenaDrawable[] = [];

    if (character) {
        drawables.push({
            y: character.y,
            draw: (drawCtx) => {
                if (characterInvincible) drawCtx.globalAlpha = 0.5;
                drawCharacterShadow(drawCtx, character);
                if (sprites?.ready) {
                    drawCharacterSprite(drawCtx, character, facing, sprites);
                }
                if (characterInvincible) drawCtx.globalAlpha = 1;
            },
        });
    }

    for (const enemy of enemies) {
        drawables.push({
            y: enemy.y,
            draw: (drawCtx) => drawEnemy(drawCtx, enemy),
        });
    }

    for (const drawable of sortByDepth(drawables)) {
        drawable.draw(ctx);
    }

    if (character && showHitbox) {
        drawCharacterHitbox(ctx, character);
    }
}
