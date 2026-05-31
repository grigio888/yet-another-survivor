import { resolveAnimationConfig } from '../animation/resolveConfig.js';
import { ANIMATION_STATES, DEFAULT_ANIMATION_FPS, type AnimationState } from '../animation/types.js';
import type { EntitySpriteConfig, SpriteFacing, SpriteLayout, FacingFlips } from '../animation/spriteConfig.js';
import {
    applySpriteFrameLayout,
    getSpriteFrameOverrides,
    getSpriteFrameSrc,
    type SpriteFrame,
    type SpriteFrameOverrides,
} from '../animation/spriteFrame.js';
import { FACINGS } from '../animation/types.js';
import type { SpriteAnimator } from '../animation/SpriteAnimator.js';
import {
    facingToSpriteKey,
    type FacingDirection,
} from './characterSprites.js';
import { drawEntityShadow, getEntityAnchorPoint, resolveEntityLayout } from './shadow.js';
import type { EntityShadow, ShadowedEntity } from './shadow.js';

export type LoadedSpriteFrame = {
    image: HTMLImageElement;
    overrides: SpriteFrameOverrides;
};

export type LoadedFacingFrames = Record<SpriteFacing, LoadedSpriteFrame[]>;

export interface EntitySpriteLibrary {
    layout: SpriteLayout;
    animations: Record<AnimationState, LoadedFacingFrames>;
    facingFlips?: FacingFlips;
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

async function loadSpriteFrame(frame: SpriteFrame): Promise<LoadedSpriteFrame> {
    const image = await loadImage(getSpriteFrameSrc(frame));
    return { image, overrides: getSpriteFrameOverrides(frame) };
}

async function loadFacingFrames(frames: readonly SpriteFrame[]): Promise<LoadedSpriteFrame[]> {
    return Promise.all(frames.map(loadSpriteFrame));
}

export async function loadEntitySprites(config: EntitySpriteConfig): Promise<EntitySpriteLibrary> {
    const resolved = resolveAnimationConfig(config);
    const animations = {} as Record<AnimationState, LoadedFacingFrames>;

    await Promise.all(
        ANIMATION_STATES.map(async (state) => {
            const clip = resolved[state];
            const [ne, nw, se, sw] = await Promise.all([
                loadFacingFrames(clip.frames.ne),
                loadFacingFrames(clip.frames.nw),
                loadFacingFrames(clip.frames.se),
                loadFacingFrames(clip.frames.sw),
            ]);
            animations[state] = { ne, nw, se, sw };
        }),
    );

    return {
        layout: config.layout,
        animations,
        facingFlips: config.facingFlips,
        ready: true,
    };
}

export interface AnimatedEntity extends ShadowedEntity {
    size: number;
    color: string;
    animator?: SpriteAnimator | null;
}

export { drawEntityShadow } from './shadow.js';

function drawSpriteFrame(
    ctx: CanvasRenderingContext2D,
    entity: AnimatedEntity,
    facing: FacingDirection,
    library: EntitySpriteLibrary,
    state: AnimationState,
    frameIndex: number,
    baseLayout: SpriteLayout = library.layout,
) {
    const key = facingToSpriteKey(facing);
    const frames = library.animations[state]?.[key] ?? library.animations.idle[key];
    const loadedFrame = frames[Math.min(frameIndex, frames.length - 1)];
    const { image: img, overrides } = loadedFrame;
    const layout = applySpriteFrameLayout(baseLayout, overrides);

    const drawH = entity.size * layout.heightScale * layout.zoom;
    const scale = drawH / img.height;
    const drawW = img.width * scale;
    const { spriteStart } = resolveEntityLayout(entity);
    const layoutOffset = layout.position ?? { x: 0, y: 0 };

    const drawX = spriteStart.x - drawW / 2 + layoutOffset.x + (overrides.x ?? 0);
    const drawY = spriteStart.y - drawH + layoutOffset.y + (overrides.y ?? 0);

    const flip = library.facingFlips?.[key];
    if (flip?.horizontal || flip?.vertical) {
        ctx.save();
        ctx.translate(drawX + drawW / 2, drawY + drawH / 2);
        ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();
        return;
    }

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
}

export function drawAnimatedSpriteAtState(
    ctx: CanvasRenderingContext2D,
    entity: AnimatedEntity,
    facing: FacingDirection,
    library: EntitySpriteLibrary,
    state: AnimationState,
    frameIndex: number,
    layout: SpriteLayout = library.layout,
) {
    if (!library.ready) return;

    drawEntityShadow(ctx, entity);
    drawSpriteFrame(ctx, entity, facing, library, state, frameIndex, layout);
}

export function advancePreviewFrame(
    elapsed: number,
    frameIndex: number,
    config: EntitySpriteConfig,
    state: AnimationState,
    dt: number,
    options: { fps?: number; facing?: SpriteFacing } = {},
): { elapsed: number; frameIndex: number } {
    const clip = resolveAnimationConfig(config)[state];
    const fps = options.fps ?? clip.fps ?? DEFAULT_ANIMATION_FPS[state];
    const frameDuration = 1 / fps;
    const frameCount = options.facing
        ? clip.frames[options.facing].length
        : Math.max(...FACINGS.map((f) => clip.frames[f].length));

    let nextElapsed = elapsed + dt;
    let nextIndex = frameIndex;

    while (nextElapsed >= frameDuration) {
        nextElapsed -= frameDuration;
        nextIndex++;

        if (nextIndex >= frameCount) {
            if (clip.loop) {
                nextIndex = 0;
            } else {
                nextIndex = frameCount - 1;
                nextElapsed = 0;
                break;
            }
        }
    }

    return { elapsed: nextElapsed, frameIndex: nextIndex };
}

export function getPreviewClipFps(config: EntitySpriteConfig, state: AnimationState): number {
    const clip = resolveAnimationConfig(config)[state];
    return clip.fps ?? DEFAULT_ANIMATION_FPS[state];
}

export function drawAnimatedSprite(
    ctx: CanvasRenderingContext2D,
    entity: AnimatedEntity & { animator: SpriteAnimator },
    facing: FacingDirection,
    library: EntitySpriteLibrary,
    layout: SpriteLayout = library.layout,
) {
    if (!library.ready || !entity.animator) return;

    const state = entity.animator.getState();
    const frameIndex = entity.animator.getFrameIndex();
    drawEntityShadow(ctx, entity);
    drawSpriteFrame(ctx, entity, facing, library, state, frameIndex, layout);
}

export function drawEntityFallback(
    ctx: CanvasRenderingContext2D,
    entity: AnimatedEntity,
) {
    const { spriteStart } = resolveEntityLayout(entity);
    ctx.fillStyle = entity.color;
    ctx.fillRect(
        spriteStart.x - entity.size / 2,
        spriteStart.y - entity.size,
        entity.size,
        entity.size,
    );
}

/** Draw sprite art when loaded, otherwise the colored square fallback. */
export function drawEntityVisual(
    ctx: CanvasRenderingContext2D,
    entity: AnimatedEntity,
    facing: FacingDirection,
    library: EntitySpriteLibrary | null | undefined,
    layout?: SpriteLayout,
) {
    if (library?.ready && entity.animator) {
        drawAnimatedSprite(
            ctx,
            entity as AnimatedEntity & { animator: SpriteAnimator },
            facing,
            library,
            layout ?? library.layout,
        );
        return;
    }

    drawEntityShadow(ctx, entity);
    drawEntityFallback(ctx, entity);
}
