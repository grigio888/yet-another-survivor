    import { describe, it, expect, beforeEach, vi } from 'vitest';
    import { CANVAS, PLAYER, WAVES, ENEMIES, SCORING } from '$lib/game/config/index';

    describe('CANVAS', () => {
        it('has correct dimensions', () => {
            expect(CANVAS.width).toBe(800);
            expect(CANVAS.height).toBe(600);
        });

        it('has fps set to 60', () => {
            expect(CANVAS.fps).toBe(60);
        });
    });

    describe('PLAYER', () => {
        it('has maxLives set to 3', () => {
            expect(PLAYER.maxLives).toBe(3);
        });

        it('has speed defined', () => {
            expect(PLAYER.speed).toBe(200);
        });

        it('has shootCooldown defined', () => {
            expect(PLAYER.shootCooldown).toBe(400);
        });

        it('has invincible frames defined', () => {
            expect(PLAYER.invincibleFrames).toBe(1000);
        });

        it('projectile has speed and damage', () => {
            expect(PLAYER.projectileSpeed).toBe(400);
            expect(PLAYER.projectileDamage).toBe(25);
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
        });
    });

    describe('ENEMIES', () => {
        describe('grunt', () => {
            it('has correct stats', () => {
                expect(ENEMIES.grunt.hp).toBe(30);
                expect(ENEMIES.grunt.speed).toBe(80);
                expect(ENEMIES.grunt.damage).toBe(1);
            });

            it('is melee only', () => {
                expect(ENEMIES.grunt.range).toBe(0);
            });

            it('has green color', () => {
                expect(ENEMIES.grunt.color).toBe('#4ade8f');
            });
        });

        describe('shooter', () => {
            it('has correct stats', () => {
                expect(ENEMIES.shooter.hp).toBe(20);
                expect(ENEMIES.shooter.speed).toBe(50);
                expect(ENEMIES.shooter.shootCooldown).toBe(2000);
            });

            it('has ranged attack distance', () => {
                expect(ENEMIES.shooter.range).toBe(250);
            });

            it('has orange color', () => {
                expect(ENEMIES.shooter.color).toBe('#f97316');
            });
        });

        describe('chief', () => {
            it('has high hp', () => {
                expect(ENEMIES.chief.hp).toBe(150);
            });

            it('has low speed but high damage', () => {
                expect(ENEMIES.chief.speed).toBe(35);
                expect(ENEMIES.chief.damage).toBe(2);
            });

            it('has red color', () => {
                expect(ENEMIES.chief.color).toBe('#f43f5e');
            });

            it('is melee only', () => {
                expect(ENEMIES.chief.range).toBe(0);
            });
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