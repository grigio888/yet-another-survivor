import { AudioManager } from '../audio/index.js';
import { EffectsManager } from '../effects/index.js';
import { ParticleManager } from '../particles/index.js';
import type { KillRecord, BattleResult } from '../systems/combat.js';
import type { Enemy } from '../entities/enemies/index.js';
import type { Character } from '../entities/characters/index.js';

export class GamePolish {
    readonly audio = new AudioManager();
    readonly particles = new ParticleManager();
    readonly effects = new EffectsManager();

    update(dt: number) {
        this.particles.update(dt);
        this.effects.update(dt);
    }

    onShoot() {
        this.audio.play('shoot');
    }

    onPlayerHit(x: number, y: number) {
        this.audio.play('hit');
        this.effects.triggerShake(6);
        this.effects.triggerFlash(0.25);
        this.particles.emitSpark(x, y);
    }

    onCombatResult(result: BattleResult, enemies: Enemy[], character: Character | null) {
        this.onEnemyKills(result.combat.kills, enemies);
        if (result.characterDamaged && character) {
            this.onPlayerHit(character.x, character.y);
        }
    }

    onEnemyKills(kills: KillRecord[], enemies: Enemy[]) {
        for (const kill of kills) {
            const enemy = enemies[kill.enemyIndex];
            if (!enemy) continue;
            this.audio.play('enemy_death');
            this.particles.emitExplosion(enemy.x, enemy.y, enemy.color);
        }
    }

    onGameStart() {
        this.particles.clear();
        this.effects.fadeIn();
    }

    onGameOver() {
        this.audio.play('game_over');
        this.effects.triggerShake(10);
        this.effects.triggerFlash(0.35);
    }

    onReturnToMenu() {
        this.particles.clear();
        this.effects.fadeOut();
    }

    destroy() {
        this.audio.destroy();
        this.particles.clear();
    }
}
