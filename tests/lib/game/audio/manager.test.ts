import { describe, expect, it } from 'vitest';
import { AudioManager } from '$lib/game/audio/manager.js';

describe('AudioManager', () => {
    it('does not throw when playing sfx with audio disabled', () => {
        const audio = new AudioManager();
        audio.setEnabled(false);

        expect(() => audio.play('shoot')).not.toThrow();
        expect(() => audio.play('hit')).not.toThrow();
        expect(() => audio.play('enemy_death')).not.toThrow();
        expect(() => audio.play('game_over')).not.toThrow();
    });
});
