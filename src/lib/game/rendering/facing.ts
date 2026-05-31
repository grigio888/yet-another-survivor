import type { SpriteFacing } from '../animation/spriteConfig.js';

export interface FacingDirection {
    dx: number;
    dy: number;
}

export function facingToSpriteKey(facing: FacingDirection): SpriteFacing {
    const sx = Math.sign(facing.dx);
    const sy = Math.sign(facing.dy);

    if (sx >= 0 && sy >= 0) return 'se';
    if (sx < 0 && sy >= 0) return 'sw';
    if (sx < 0 && sy < 0) return 'nw';
    return 'ne';
}

export function snapEightDirection(dx: number, dy: number): FacingDirection {
    const sx = Math.sign(dx);
    const sy = Math.sign(dy);
    if (sx === 0) return { dx: 0, dy: sy };
    if (sy === 0) return { dx: sx, dy: 0 };
    const inv = 1 / Math.SQRT2;
    return { dx: sx * inv, dy: sy * inv };
}
