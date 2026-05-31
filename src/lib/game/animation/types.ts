import type { SpriteFacing } from '../entities/characters/Character.js';
import type { SpriteFrame } from './spriteFrame.js';

export const ANIMATION_STATES = ['idle', 'walking', 'attacking', 'hit', 'dying'] as const;
export type AnimationState = (typeof ANIMATION_STATES)[number];

export type FacingFrameUrls = Record<SpriteFacing, readonly SpriteFrame[]>;

export type AnimationClipConfig = {
    frames: FacingFrameUrls;
    fps?: number;
    loop?: boolean;
};

export type CharacterAnimationsConfig = Partial<Record<AnimationState, AnimationClipConfig>>;
export type ResolvedAnimationConfig = Record<AnimationState, AnimationClipConfig>;

export const DEFAULT_ANIMATION_FPS: Record<AnimationState, number> = {
    idle: 4,
    walking: 8,
    attacking: 12,
    hit: 10,
    dying: 8,
};

export const FACINGS: SpriteFacing[] = ['ne', 'nw', 'se', 'sw'];
