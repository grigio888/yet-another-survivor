import { AudioManager } from '../audio/index.js';
import { EffectsManager } from '../effects/index.js';
import { ParticleManager } from '../particles/index.js';
import type { KillRecord, BattleResult } from '../systems/combat.js';
import type { Enemy } from '../entities/enemies/index.js';
import type { Character } from '../entities/characters/index.js';
import { getEntityAnchorPoint } from '../rendering/shadow.js';
import { DamageNumberManager, type DamagePopup } from './damageNumbers.js';

export class GamePolish {
    readonly audio = new AudioManager();
    readonly particles = new ParticleManager();
    readonly effects = new EffectsManager();
    readonly damageNumbers = new DamageNumberManager();

    update(dt: number) {
        this.particles.update(dt);
        this.effects.update(dt);
        this.damageNumbers.update(dt);
    }

    spawnDamagePopups(popups: readonly DamagePopup[]) {
        this.damageNumbers.spawn(popups);
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
        this.spawnDamagePopups(result.damagePopups);
        this.onEnemyKills(result.combat.kills, enemies);
        if (result.characterDamaged && character) {
            const anchor = getEntityAnchorPoint(character);
            this.onPlayerHit(anchor.x, anchor.y);
        }
    }

    onEnemyKills(kills: KillRecord[], enemies: Enemy[]) {
        for (const kill of kills) {
            const enemy = enemies[kill.enemyIndex];
            if (!enemy) continue;
            this.audio.play('enemy_death');
            const anchor = getEntityAnchorPoint(enemy);
            this.particles.emitExplosion(anchor.x, anchor.y, enemy.color);
        }
    }

    onGameStart() {
        this.particles.clear();
        this.damageNumbers.clear();
        this.effects.fadeIn();
    }

    onGameOver() {
        this.audio.play('game_over');
        this.effects.triggerShake(10);
        this.effects.triggerFlash(0.35);
    }

    onReturnToMenu() {
        this.particles.clear();
        this.damageNumbers.clear();
        this.effects.fadeOut();
    }

    destroy() {
        this.audio.destroy();
        this.particles.clear();
        this.damageNumbers.clear();
    }
}
