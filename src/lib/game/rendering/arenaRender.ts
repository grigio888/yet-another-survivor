import type { Character } from '../entities/characters/Character.js';
import type { Enemy } from '../entities/enemies/Enemy.js';
import type { EnemySpriteType } from '../entities/enemies/index.js';
import {
    drawCharacterAttackRange,
    drawCharacterHitbox,
    drawCharacterSprite,
    type CharacterSpriteSet,
    type DrawCharacterVisualOptions,
    type FacingDirection,
} from './characterSprites.js';
import { drawEntityVisual } from './entitySprites.js';
import type { EnemySpriteLibrary } from './enemySprites.js';
import { sortByDepth } from './depthSort.js';
import { drawHitboxOutline } from './hitboxRender.js';
import {
    ENEMY_HP_BAR_GAP,
    ENEMY_HP_BAR_HEIGHT,
} from '../systems/arenaBounds.js';

export function drawEnemy(
    ctx: CanvasRenderingContext2D,
    enemy: Enemy,
    sprites: EnemySpriteLibrary | null = null,
) {
    drawEntityVisual(ctx, enemy, enemy.facing, sprites);

    const hpRatio = enemy.hp / enemy.maxHp;
    const barW = enemy.size;
    const barY = enemy.y + enemy.size / 2 + ENEMY_HP_BAR_GAP;
    ctx.fillStyle = '#ccc';
    ctx.fillRect(enemy.x - barW / 2, barY, barW, ENEMY_HP_BAR_HEIGHT);
    ctx.fillStyle = hpRatio > 0.5 ? '#4ade8f' : hpRatio > 0.25 ? '#f59e0b' : '#ef4444';
    ctx.fillRect(enemy.x - barW / 2, barY, barW * hpRatio, ENEMY_HP_BAR_HEIGHT);
}

type ArenaDrawable = {
    y: number;
    draw: (ctx: CanvasRenderingContext2D) => void;
};

export interface DrawArenaOptions extends DrawCharacterVisualOptions {
    characterInvincible?: boolean;
    enemySprites?: Partial<Record<EnemySpriteType, EnemySpriteLibrary>> | null;
}

export function drawArenaEntities(
    ctx: CanvasRenderingContext2D,
    character: Character | null,
    facing: FacingDirection,
    sprites: CharacterSpriteSet | null,
    enemies: readonly Enemy[],
    options: DrawArenaOptions = {},
) {
    const {
        showRange = false,
        showHitbox = true,
        characterInvincible = false,
        enemySprites = null,
    } = options;

    if (character && showRange) {
        drawCharacterAttackRange(ctx, character);
    }

    const drawables: ArenaDrawable[] = [];

    if (character) {
        drawables.push({
            y: character.y,
            draw: (drawCtx) => {
                if (characterInvincible) drawCtx.globalAlpha = 0.5;
                drawCharacterSprite(drawCtx, character, facing, sprites);
                if (characterInvincible) drawCtx.globalAlpha = 1;
            },
        });
    }

    for (const enemy of enemies) {
        const library = enemySprites?.[enemy.type as EnemySpriteType] ?? null;
        drawables.push({
            y: enemy.y,
            draw: (drawCtx) => drawEnemy(drawCtx, enemy, library),
        });
    }

    for (const drawable of sortByDepth(drawables)) {
        drawable.draw(ctx);
    }

    if (showHitbox) {
        for (const enemy of enemies) {
            if (enemy.isAlive()) {
                drawHitboxOutline(ctx, enemy);
            }
        }
    }

    if (character && showHitbox) {
        drawCharacterHitbox(ctx, character);
    }
}
