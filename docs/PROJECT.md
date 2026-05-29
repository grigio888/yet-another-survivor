# Project: Vampire Survivors Clone

A top-down survival shooter where the player auto-fires at the nearest enemy
while dodging escalating waves. Built as a SvelteKit web app that is also
packaged for iOS and Android via Capacitor.

## Tech Stack

- **Framework**: SvelteKit (Svelte 5 runes, `adapter-node`)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Rendering**: HTML Canvas 2D API (no external game engine)
- **Mobile**: Capacitor (web build in `build/` is wrapped as native iOS/Android)
- **Testing**: Vitest

## Core Features

- Character controlled by WASD or arrow keys, with Shift to sprint (2x speed)
- Auto-fire: the character shoots at the nearest enemy on a cooldown
- Three enemy types: Grunt (melee chaser), Shooter (ranged), Chief (tanky boss)
- Wave-based spawning with enemy composition shifting toward tougher mixes
- Player lives system (3 lives) with post-hit invincibility frames
- Scoring: kill value + time-survived bonus + combo multiplier
- Game over with restart (planned)

## Project Structure

Implemented:

- `src/lib/game/config/` — game constants and tunables (`CANVAS`, `PLAYER`, `WAVES`, `ENEMIES`, `SCORING`)
- `src/lib/game/entities/` — `Entity` base class and `Character`, `Enemy`, `Grunt`, `Shooter`, `Chief`
- `src/lib/game/systems/` — `collision.ts`, `combat.ts`, `spawning.ts`
- `src/lib/game/input/` — keyboard `InputManager`
- `src/routes/debug/` — manual test harnesses (`/debug/character`, `/debug/enemies`) that run a game loop inline
- `tests/lib/game/systems/` — Vitest unit tests (currently the combat system)

Planned (not yet created):

- `src/lib/game/engine/` — central game loop and MENU → PLAYING → PAUSED → GAME_OVER state machine
- `src/lib/game/screens/` — main menu, game over
- `src/lib/game/ui/` — HUD (lives, score, wave)
- `src/lib/game/audio/` — sound effects / music via Web Audio API
- `src/lib/game/particles/` — kill/hit particle effects
- `src/lib/game/effects/` — screen shake, flashes, fades
- `src/lib/game/utils/` — shared helpers

## Game Mechanics

- Character moves smoothly with WASD/arrows; Shift doubles movement speed
- Character auto-fires a projectile at the nearest enemy each cooldown
- Grunts and Chiefs chase the player and deal contact (melee) damage
- Shooters approach until in range, then fire projectiles at the player
- Chiefs are slow but high-HP and hit hard
- Contact or projectile hits cost the player a life, then grant brief invincibility
- Game over when the player reaches 0 lives; restart begins a fresh run

## Status & Known Gaps

- Game logic (entities, collision, combat, spawning, input) is implemented and
  exercised through the `/debug` routes.
- No assembled game yet: `src/routes/+page.svelte` is still SvelteKit
  boilerplate and there is no `engine/` loop tying the systems together.
- `config.PLAYER` is missing `size`, `maxHp`, and `color`, which `Character`
  references via fallbacks — these should be added to the config.
- `combat.ts` has a leftover `console.log` and an unused `enemiesToRefillHp`
  path that should be cleaned up.

## Build & Run

- `npm run dev` — local dev server (preferred during development)
- `npm run test` — run unit tests once (`npm run test:unit` for watch mode)
- `npm run build` — production web build into `build/`
- `npm run cap:sync` / `cap:ios` / `cap:android` — sync and open native apps
