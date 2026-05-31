    import { describe, it, expect, beforeEach, vi } from 'vitest';
    import { CANVAS, WAVES, SCORING } from '$lib/game/config/index';

    describe('CANVAS', () => {
        it('has correct dimensions', () => {
            expect(CANVAS.width).toBe(800);
            expect(CANVAS.height).toBe(600);
        });

        it('has fps set to 60', () => {
            expect(CANVAS.fps).toBe(60);
        });
    });

    describe('WAVES', () => {
        it('starts with correct initial enemies', () => {
            expect(WAVES.initialEnemies).toBe(3);
        });

        it('increases enemies per wave', () => {
            expect(WAVES.increasePerWave).toBe(2);
        });

        it('has spawn and wave intervals set', () => {
            expect(WAVES.spawnInterval).toBe(2000);
            expect(WAVES.waveInterval).toBe(15000);
            expect(WAVES.spawnMargin).toBe(100);
        });
    });

    describe('SCORING', () => {
        it('has time bonus per second', () => {
            expect(SCORING.timeBonusPerSec).toBe(1);
        });

        it('has combo multiplier', () => {
            expect(SCORING.comboMultiplier).toBe(1.2);
        });

        it('has combo decay time', () => {
            expect(SCORING.comboDecayTime).toBe(3000);
        });
    });
