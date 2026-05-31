import type { CharacterAnimationsConfig } from './types.js';
import type { SpriteFrame } from './spriteFrame.js';

export type { SpriteFrame, SpriteFrameOverrides } from './spriteFrame.js';

export type SpriteFacing = 'ne' | 'nw' | 'se' | 'sw';

export type FacingFlip = {
    horizontal?: boolean;
    vertical?: boolean;
};

export type FacingFlips = Partial<Record<SpriteFacing, FacingFlip>>;

export type SpriteUrls = Record<SpriteFacing, SpriteFrame>;

export type SpriteLayout = {
    feetFromBottom: number;
    heightScale: number;
    zoom: number;
    liftFromShadowCenter: number;
};

export type EntitySpriteConfig = {
    layout: SpriteLayout;
    idle: SpriteUrls;
    /** Per-state sprite clips; states omitted fall back to idle art */
    animations?: CharacterAnimationsConfig;
    /** Mirror transforms applied at draw time (e.g. SE = horizontal flip of SW art) */
    facingFlips?: FacingFlips;
};
