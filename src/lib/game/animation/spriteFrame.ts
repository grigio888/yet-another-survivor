import type { SpriteLayout } from './spriteConfig.js';

/** Per-frame animation offsets relative to the layout sprite-start anchor. */
export type SpriteFrameOverrides = {
    /** Horizontal offset from the sprite-start anchor, in pixels */
    x?: number;
    /** Vertical offset from the sprite-start anchor in pixels (negative = move up) */
    y?: number;
    /** Per-sprite scale multiplier — overrides layout.zoom for this frame */
    zoom?: number;
    heightScale?: number;
};

export type SpriteFrame = string | ({ src: string } & SpriteFrameOverrides);

export function getSpriteFrameSrc(frame: SpriteFrame): string {
    return typeof frame === 'string' ? frame : frame.src;
}

export function getSpriteFrameOverrides(frame: SpriteFrame): SpriteFrameOverrides {
    if (typeof frame === 'string') return {};
    const { src: _src, ...overrides } = frame;
    return overrides;
}

export function applySpriteFrameLayout(
    base: SpriteLayout,
    overrides: SpriteFrameOverrides = {},
): SpriteLayout {
    return {
        heightScale: overrides.heightScale ?? base.heightScale,
        zoom: overrides.zoom ?? base.zoom,
        position: base.position,
    };
}

export function mergeSpriteFrameLayout(base: SpriteLayout, frame: SpriteFrame): SpriteLayout {
    return applySpriteFrameLayout(base, getSpriteFrameOverrides(frame));
}
