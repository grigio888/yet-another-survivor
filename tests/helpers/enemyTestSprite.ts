import type { EntitySpriteConfig } from '$lib/game/animation/spriteConfig.js';
import idleNe from '$lib/assets/peasant/female/idle_ne.png';
import idleNw from '$lib/assets/peasant/female/idle_nw.png';
import idleSe from '$lib/assets/peasant/female/idle_se.png';
import idleSw from '$lib/assets/peasant/female/idle_sw.png';

/** Minimal sprite config for unit tests that construct raw Enemy instances. */
export const TEST_ENEMY_SPRITE = {
    layout: {
        heightScale: 3.2,
        zoom: 0.9,
    },
    idle: {
        ne: idleNe,
        nw: idleNw,
        se: idleSe,
        sw: idleSw,
    },
} as const satisfies EntitySpriteConfig;
