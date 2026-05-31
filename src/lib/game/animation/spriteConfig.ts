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
    heightScale: number;
    /** Default zoom — each SpriteFrame can override with its own zoom */
    zoom: number;
    /** Fine-grain pixel offset from the shadow sprite-start anchor */
    position?: { x: number; y: number };
};

export type EntitySpriteConfig = {
    layout: SpriteLayout;
    idle: SpriteUrls;
    /** Per-state sprite clips; states omitted fall back to idle art */
    animations?: CharacterAnimationsConfig;
    /** Mirror transforms applied at draw time (e.g. SE = horizontal flip of SW art) */
    facingFlips?: FacingFlips;
};
