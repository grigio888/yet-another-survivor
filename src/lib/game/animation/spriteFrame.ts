import type { SpriteLayout } from './spriteConfig.js';

/** Per-frame layout overrides relative to the entity shadow anchor. */
export type SpriteFrameOverrides = {
    /** Horizontal offset from shadow center, in pixels */
    x?: number;
    /** Vertical offset from the default feet anchor, in pixels */
    y?: number;
    zoom?: number;
    feetFromBottom?: number;
    heightScale?: number;
    liftFromShadowCenter?: number;
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
        feetFromBottom: overrides.feetFromBottom ?? base.feetFromBottom,
        heightScale: overrides.heightScale ?? base.heightScale,
        zoom: overrides.zoom ?? base.zoom,
        liftFromShadowCenter: overrides.liftFromShadowCenter ?? base.liftFromShadowCenter,
    };
}

export function mergeSpriteFrameLayout(base: SpriteLayout, frame: SpriteFrame): SpriteLayout {
    return applySpriteFrameLayout(base, getSpriteFrameOverrides(frame));
}
