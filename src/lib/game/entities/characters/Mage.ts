// Ranged spellcaster with moderate HP and projectile speed
import { CHARACTERS } from '../../config/index.js';
import { Character } from './Character.js';

export class Mage extends Character {
    constructor(x?: number, y?: number) {
        super({
            x: x ?? 0,
            y: y ?? 0,
            stats: CHARACTERS.mage,
        });
    }
}
