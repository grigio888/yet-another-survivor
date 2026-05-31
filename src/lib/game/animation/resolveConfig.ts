import type { EntitySpriteConfig, SpriteFacing, SpriteUrls } from './spriteConfig.js';
import {
    DEFAULT_ANIMATION_FPS,
    FACINGS,
    type AnimationClipConfig,
    type AnimationState,
    type FacingFrameUrls,
    type ResolvedAnimationConfig,
} from './types.js';

function urlsToFacingFrames(urls: SpriteUrls): FacingFrameUrls {
    return {
        ne: [urls.ne],
        nw: [urls.nw],
        se: [urls.se],
        sw: [urls.sw],
    };
}

function frameCount(clip: AnimationClipConfig): number {
    return Math.max(...FACINGS.map((facing) => clip.frames[facing].length));
}

export function resolveAnimationConfig(sprite: EntitySpriteConfig): ResolvedAnimationConfig {
    const idleFrames = urlsToFacingFrames(sprite.idle);

    const defaults: Record<AnimationState, AnimationClipConfig> = {
        idle: { frames: idleFrames, fps: DEFAULT_ANIMATION_FPS.idle, loop: true },
        walking: { frames: idleFrames, fps: DEFAULT_ANIMATION_FPS.walking, loop: true },
        attacking: { frames: idleFrames, fps: DEFAULT_ANIMATION_FPS.attacking, loop: false },
        hit: { frames: idleFrames, fps: DEFAULT_ANIMATION_FPS.hit, loop: false },
        dying: { frames: idleFrames, fps: DEFAULT_ANIMATION_FPS.dying, loop: false },
    };

    return { ...defaults, ...sprite.animations };
}

export function getClipFrameCount(clip: AnimationClipConfig, facing: SpriteFacing): number {
    return clip.frames[facing].length;
}

export function getClipMaxFrameCount(clip: AnimationClipConfig): number {
    return frameCount(clip);
}
