import { describe, expect, it } from 'vitest';
import { SurvivorSession } from '$lib/game/engine/SurvivorSession.js';

describe('SurvivorSession', () => {
    it('starts in menu phase', () => {
        const session = new SurvivorSession();
        expect(session.phase).toBe('menu');
        expect(session.character).toBeNull();
    });

    it('starts gameplay with a mage in the arena center', () => {
        const session = new SurvivorSession();
        session.setArenaSize(800, 600);
        session.startGame();

        expect(session.phase).toBe('playing');
        expect(session.character?.type).toBe('mage');
        expect(session.character?.x).toBe(400);
        expect(session.character?.y).toBe(300);
    });

    it('returns to menu and clears the character', () => {
        const session = new SurvivorSession();
        session.setArenaSize(800, 600);
        session.startGame();
        session.returnToMenu();

        expect(session.phase).toBe('menu');
        expect(session.character).toBeNull();
    });

    it('toggles pause while playing', () => {
        const session = new SurvivorSession();
        session.setArenaSize(800, 600);
        session.startGame();

        session.togglePause();
        expect(session.phase).toBe('paused');

        session.togglePause();
        expect(session.phase).toBe('playing');
    });
});
