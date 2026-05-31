export interface ShakeOffset {
    x: number;
    y: number;
}

export class EffectsManager {
    shakeIntensity = 0;
    flashAlpha = 0;
    fadeAlpha = 0;

    private readonly shakeDecay = 18;
    private readonly flashDecay = 4;
    private readonly fadeSpeed = 2.5;

    triggerShake(intensity: number) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    }

    triggerFlash(alpha: number) {
        this.flashAlpha = Math.max(this.flashAlpha, alpha);
    }

    fadeTo(target: number) {
        this.fadeAlpha = Math.max(0, Math.min(1, target));
    }

    fadeIn() {
        this.fadeAlpha = 1;
    }

    fadeOut() {
        this.fadeAlpha = 0;
    }

    update(dt: number) {
        if (this.shakeIntensity > 0) {
            this.shakeIntensity = Math.max(0, this.shakeIntensity - this.shakeDecay * dt);
        }

        if (this.flashAlpha > 0) {
            this.flashAlpha = Math.max(0, this.flashAlpha - this.flashDecay * dt);
        }

        if (this.fadeAlpha > 0) {
            this.fadeAlpha = Math.max(0, this.fadeAlpha - this.fadeSpeed * dt);
        }
    }

    getShakeOffset(): ShakeOffset {
        if (this.shakeIntensity <= 0) {
            return { x: 0, y: 0 };
        }

        return {
            x: (Math.random() - 0.5) * this.shakeIntensity * 2,
            y: (Math.random() - 0.5) * this.shakeIntensity * 2,
        };
    }
}
