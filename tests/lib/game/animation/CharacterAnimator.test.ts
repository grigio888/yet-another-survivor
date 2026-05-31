import { describe, it, expect, beforeEach } from 'vitest';
import { SpriteAnimator } from '$lib/game/animation/SpriteAnimator.js';
import { MAGE_STATS } from '$lib/game/entities/characters/Mage.js';

const FRAME_DT = 1 / 60;

function tickAnimator(
    animator: SpriteAnimator,
    frames: number,
    ctx: { isMoving: boolean; isDead: boolean },
) {
    for (let i = 0; i < frames; i++) {
        animator.update(FRAME_DT, ctx);
    }
}

describe('SpriteAnimator', () => {
    let animator: SpriteAnimator;

    beforeEach(() => {
        animator = new SpriteAnimator(MAGE_STATS.sprite);
    });

    it('starts idle', () => {
        expect(animator.getState()).toBe('idle');
    });

    it('enters walking while moving', () => {
        animator.update(FRAME_DT, { isMoving: true, isDead: false });
        expect(animator.getState()).toBe('walking');
    });

    it('returns to idle when movement stops', () => {
        animator.update(FRAME_DT, { isMoving: true, isDead: false });
        animator.update(FRAME_DT, { isMoving: false, isDead: false });
        expect(animator.getState()).toBe('idle');
    });

    it('plays attack as a one-shot then resumes locomotion', () => {
        animator.triggerAttack();
        expect(animator.getState()).toBe('attacking');
        expect(animator.isOneShotPlaying()).toBe(true);

        tickAnimator(animator, 120, { isMoving: false, isDead: false });

        expect(animator.getState()).toBe('idle');
        expect(animator.isOneShotPlaying()).toBe(false);
    });

    it('plays hit as a one-shot', () => {
        animator.triggerHit();
        expect(animator.getState()).toBe('hit');

        tickAnimator(animator, 120, { isMoving: false, isDead: false });

        expect(animator.getState()).toBe('idle');
    });

    it('prioritizes dying over other states', () => {
        animator.triggerAttack();
        animator.update(FRAME_DT, { isMoving: true, isDead: true });

        expect(animator.getState()).toBe('dying');
    });

    it('does not leave dying once entered', () => {
        animator.update(FRAME_DT, { isMoving: false, isDead: true });
        tickAnimator(animator, 240, { isMoving: true, isDead: false });

        expect(animator.getState()).toBe('dying');
    });

    it('resets to idle', () => {
        animator.triggerHit();
        animator.reset();
        expect(animator.getState()).toBe('idle');
        expect(animator.getFrameIndex()).toBe(0);
    });
});

describe('resolveAnimationConfig', () => {
    it('fills missing states from idle art', async () => {
        const { resolveAnimationConfig } = await import('$lib/game/animation/resolveConfig.js');
        const resolved = resolveAnimationConfig(MAGE_STATS.sprite);

        expect(resolved.idle.frames.se).toEqual([MAGE_STATS.sprite.idle.se]);
        expect(resolved.walking.frames.se).toEqual([MAGE_STATS.sprite.idle.se]);
        expect(resolved.attacking.loop).toBe(false);
        expect(resolved.idle.loop).toBe(true);
    });
});
