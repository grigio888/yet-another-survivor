import { describe, expect, it } from 'vitest';
import { ParticleManager } from '$lib/game/particles/manager.js';

describe('ParticleManager', () => {
    it('removes particles after their lifetime expires', () => {
        const manager = new ParticleManager();
        manager.emitSpark(10, 10, 1);

        expect(manager.count).toBe(1);

        manager.update(0.5);

        expect(manager.count).toBe(0);
    });

    it('clears all particles', () => {
        const manager = new ParticleManager();
        manager.emitExplosion(0, 0, '#fff', 5);
        manager.clear();

        expect(manager.count).toBe(0);
    });
});
