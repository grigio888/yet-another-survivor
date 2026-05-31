import { describe, expect, it } from 'vitest';
import { buildGameOverLines, buildGameOverSummary, MENU_SCREEN, GAME_OVER_SCREEN } from '$lib/game/screens/index.js';

describe('screens/menu', () => {
    it('defines title and start action', () => {
        expect(MENU_SCREEN.title).toBeTruthy();
        expect(MENU_SCREEN.startLabel).toBeTruthy();
        expect(MENU_SCREEN.instructions.length).toBeGreaterThan(0);
    });
});

describe('screens/gameover', () => {
    it('builds summary from combat stats', () => {
        const summary = buildGameOverSummary(
            {
                score: 1200,
                kills: 8,
                wave: 3,
                combo: 4,
                lastKillTime: 0,
                timeSurvived: 45,
            },
            45.5,
        );

        expect(summary).toEqual({
            score: 1200,
            kills: 8,
            wave: 3,
            combo: 4,
            timeAlive: 45.5,
        });
    });

    it('builds display lines for the game over screen', () => {
        const lines = buildGameOverLines({
            score: 500,
            kills: 3,
            wave: 2,
            combo: 2,
            timeAlive: 12.3,
        });

        expect(lines).toEqual([
            { label: 'Score', value: '500' },
            { label: 'Kills', value: '3' },
            { label: 'Wave', value: '2' },
            { label: 'Best combo', value: '2' },
            { label: 'Time survived', value: '12.3s' },
        ]);
    });

    it('defines restart and menu labels', () => {
        expect(GAME_OVER_SCREEN.restartLabel).toBeTruthy();
        expect(GAME_OVER_SCREEN.menuLabel).toBeTruthy();
    });
});
