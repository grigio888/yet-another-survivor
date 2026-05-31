import type { CombatStats } from '../systems/combat.js';
import type { ScreenStatLine } from './types.js';

export const GAME_OVER_SCREEN = {
    title: 'Game Over',
    restartLabel: 'Play Again',
    menuLabel: 'Main Menu',
} as const;

export interface GameOverSummary {
    score: number;
    kills: number;
    wave: number;
    combo: number;
    timeAlive: number;
}

export function buildGameOverSummary(
    stats: CombatStats,
    timeAlive: number,
): GameOverSummary {
    return {
        score: stats.score,
        kills: stats.kills,
        wave: stats.wave,
        combo: stats.combo,
        timeAlive,
    };
}

export function buildGameOverLines(summary: GameOverSummary): ScreenStatLine[] {
    return [
        { label: 'Score', value: String(summary.score) },
        { label: 'Kills', value: String(summary.kills) },
        { label: 'Wave', value: String(summary.wave) },
        { label: 'Best combo', value: String(summary.combo) },
        { label: 'Time survived', value: `${summary.timeAlive.toFixed(1)}s` },
    ];
}
