import { describe, expect, it } from 'vitest';
import { EffectsManager } from '$lib/game/effects/manager.js';

describe('EffectsManager', () => {
    it('decays shake intensity over time', () => {
        const effects = new EffectsManager();
        effects.triggerShake(10);

        effects.update(0.2);

        expect(effects.shakeIntensity).toBeLessThan(10);
        expect(effects.shakeIntensity).toBeGreaterThan(0);
    });

    it('decays flash alpha over time', () => {
        const effects = new EffectsManager();
        effects.triggerFlash(0.8);

        effects.update(0.1);

        expect(effects.flashAlpha).toBeLessThan(0.8);
    });

    it('returns zero offset when shake is inactive', () => {
        const effects = new EffectsManager();

        expect(effects.getShakeOffset()).toEqual({ x: 0, y: 0 });
    });
});
