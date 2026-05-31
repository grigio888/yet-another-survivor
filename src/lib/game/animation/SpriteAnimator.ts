import type { EntitySpriteConfig } from './spriteConfig.js';
import { getClipMaxFrameCount, resolveAnimationConfig } from './resolveConfig.js';
import {
    DEFAULT_ANIMATION_FPS,
    type AnimationState,
    type ResolvedAnimationConfig,
} from './types.js';

export class SpriteAnimator {
    private state: AnimationState = 'idle';
    private frameIndex = 0;
    private frameElapsed = 0;
    private oneShotPlaying = false;
    private dyingLocked = false;
    private externalLock: AnimationState | null = null;
    private readonly config: ResolvedAnimationConfig;

    constructor(spriteConfig: EntitySpriteConfig) {
        this.config = resolveAnimationConfig(spriteConfig);
    }

    getState(): AnimationState {
        return this.state;
    }

    getFrameIndex(): number {
        return this.frameIndex;
    }

    isOneShotPlaying(): boolean {
        return this.oneShotPlaying;
    }

    reset() {
        this.state = 'idle';
        this.frameIndex = 0;
        this.frameElapsed = 0;
        this.oneShotPlaying = false;
        this.dyingLocked = false;
        this.externalLock = null;
    }

    triggerAttack() {
        if (this.state === 'dying') return;
        this.startOneShot('attacking');
    }

    triggerHit() {
        if (this.state === 'dying') return;
        this.startOneShot('hit');
    }

    /** Hold an animation state until cleared (e.g. enemy stagger). */
    lockState(state: AnimationState | null) {
        this.externalLock = state;
        if (state) {
            this.enterState(state, false);
        }
    }

    update(dt: number, ctx: { isMoving: boolean; isDead: boolean }) {
        if (ctx.isDead || this.dyingLocked) {
            if (this.state !== 'dying') {
                this.enterState('dying', true);
            }
            this.dyingLocked = true;
            this.tickFrames(dt);
            return;
        }

        if (this.externalLock) {
            if (this.state !== this.externalLock) {
                this.enterState(this.externalLock, false);
            }
            this.tickFrames(dt);
            return;
        }

        if (this.oneShotPlaying) {
            this.tickFrames(dt);
            if (!this.oneShotPlaying) {
                this.enterLocomotionState(ctx.isMoving);
            }
            return;
        }

        this.enterLocomotionState(ctx.isMoving);
        this.tickFrames(dt);
    }

    private enterLocomotionState(isMoving: boolean) {
        const target: AnimationState = isMoving ? 'walking' : 'idle';
        if (this.state !== target) {
            this.enterState(target, false);
        }
    }

    private startOneShot(state: AnimationState) {
        this.enterState(state, true);
    }

    private enterState(state: AnimationState, oneShot: boolean) {
        this.state = state;
        this.frameIndex = 0;
        this.frameElapsed = 0;
        this.oneShotPlaying = oneShot && !this.config[state].loop;
    }

    private tickFrames(dt: number) {
        const clip = this.config[this.state];
        const fps = clip.fps ?? DEFAULT_ANIMATION_FPS[this.state];
        const frameDuration = 1 / fps;
        const frameCount = getClipMaxFrameCount(clip);

        this.frameElapsed += dt;

        while (this.frameElapsed >= frameDuration) {
            this.frameElapsed -= frameDuration;
            this.frameIndex++;

            if (this.frameIndex >= frameCount) {
                if (clip.loop) {
                    this.frameIndex = 0;
                } else {
                    this.frameIndex = frameCount - 1;
                    this.oneShotPlaying = false;
                    break;
                }
            }
        }
    }
}
