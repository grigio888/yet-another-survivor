# Implementation Plan: Vampire Survivors Clone

## Overview

A top-down survival shooter where the player dodges and fights waves of enemies.
Built with SvelteKit, TypeScript, Tailwind CSS, and a custom Canvas-based game
engine, packaged for iOS/Android with Capacitor.

## Technical Stack

- **Framework**: SvelteKit (Svelte 5 runes, `adapter-node`)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Rendering**: HTML Canvas 2D API (no external game engine)
- **Mobile**: Capacitor (iOS + Android)
- **Audio**: Web Audio API (planned)
- **Testing**: Vitest

## Project Structure

```
src/lib/game/
├── config/      # [done] Game constants, enemy stats, tunables
├── input/       # [done] Keyboard input handling
├── entities/    # [done] Entity, Character, Enemy, Grunt, Shooter, Chief
├── systems/     # [done] collision, combat, spawning
├── engine/      # [done] SurvivorSession loop + phase state
├── screens/     # [done] menu + game over content
├── polish/      # [done] GamePolish facade (audio + particles + effects)
├── ui/          # RO-style DOM components live in src/lib/components/ui/
├── audio/       # [done] procedural Web Audio SFX
├── particles/   # [done] kill/hit particle bursts
├── effects/     # [done] screen shake, flash, fade
└── utils/       # [todo] Helper functions

src/routes/debug/  # [done] Manual harnesses for character & enemies
tests/             # [partial] Vitest unit tests (combat covered)
```

## Status Summary

- **Done**: config, input, entities, systems, debug harnesses, main game route,
  screens/UI, audio, particles, screen effects.
- **Next**: mobile controls, persistence, power-ups, broader polish tuning.

## Phase 1: Core Foundation

### config/index.ts — [done]
- `PLAYER`: lives, speed, shoot cooldown, invincibility frames, projectile stats
- `WAVES`: initial count, per-wave increase, spawn/wave intervals
- `ENEMIES`: per-type HP, speed, damage, range, shoot cooldown, score, color, size
- `SCORING`: time bonus, combo multiplier, combo decay
- `CANVAS`: fixed 800x600 at 60 fps
- TODO: add `PLAYER.size`, `PLAYER.maxHp`, `PLAYER.color` (currently only
  referenced via fallbacks in `Character`)

### input/manager.ts — [done]
- Tracks WASD + arrow key state via window listeners
- Shift = sprint modifier; Escape = pause; R = restart
- Returns a normalized movement vector (diagonals normalized)

### engine/loop.ts — [todo]
- `requestAnimationFrame`-based loop with delta-time updates
- State machine: MENU → PLAYING → PAUSED → GAME_OVER
- Update order: input → entities → combat → particles → render
- Note: the `/debug` routes already contain working inline loops that can be
  generalized into this engine.

## Phase 2: Entities — [done]

### entities/Entity.ts
- Common props (x, y, size, hp, maxHp, speed, damage, color) and
  `update`, `draw`, `takeDamage`, `isAlive`, AABB `collidesWith`

### entities/Character.ts
- Smooth movement from input; Shift doubles speed
- Auto-fire cooldown + `shoot(target)` returning a projectile
- Lives + invincibility frames handled in `takeDamage`

### entities/Enemy.ts (base) + Grunt / Shooter / Chief
- Grunt: melee chaser
- Shooter: approaches, then fires when in range on a cooldown
- Chief: slow, tanky, heavy contact damage

## Phase 3: Systems — [done]

### systems/collision.ts
- Circle-based collision helpers
- Projectile↔enemy, enemy-projectile↔character, enemy↔character (melee)

### systems/combat.ts
- Resolves projectile damage, kills, scoring, combo + time bonus, player hits
- TODO: remove leftover `console.log` and the unused `enemiesToRefillHp` path

### systems/spawning.ts
- `SpawningSystem` class managing waves, spawn timing, off-screen spawn points
- Wave composition shifts toward Shooters/Chiefs at higher waves

## Phase 4: Screens & UI — [done]

- `components/ui/RoWindow.svelte`, `RoButton.svelte`, `RoNavLink.svelte` — RO chrome
- `components/game/` — `MenuScreen`, `GameOverScreen`, `GameHud`, `PauseScreen`
- `screens/menu.ts` — start screen copy + instructions
- `screens/gameover.ts` — final score summary + restart labels
- `engine/SurvivorSession.ts` — playable loop extracted from debug combat
- `src/routes/+page.svelte` — main game route (menu → play → pause → game over)
- Debug routes keep harness overlays (`DebugHud`, `CharacterItemLoadout`)

## Phase 5: Polish — [done]

- `audio/manager.ts` — procedural shoot, hit, enemy_death, game_over via Web Audio API
- `particles/manager.ts` — colored bursts on kills, sparks on player hits
- `effects/manager.ts` — screen shake, red hit flash, fade on game start
- `polish/GamePolish.ts` — wires feedback into `SurvivorSession` combat events

## Implementation Order

1. ~~Config constants~~ (done)
2. ~~Input manager~~ (done)
3. ~~Base Entity and Character~~ (done)
4. ~~Enemy classes (Grunt, Shooter, Chief)~~ (done)
5. ~~Collision detection~~ (done)
6. ~~Combat system~~ (done)
7. ~~Spawning system~~ (done)
8. ~~Game engine/loop + playable main route~~ (done — `SurvivorSession` + `/`)
9. ~~HUD and lives display~~ (done — `GameHud`)
10. ~~Game over screen + restart~~ (done)
11. ~~Main menu screen~~ (done)
12. ~~Audio, particles, effects~~ (done)

## Resolved Decisions

- **Movement**: smooth, frame-rate independent (delta-time) interpolation
- **Enemy visuals**: colored squares per type (green Grunt, orange Shooter, pink Chief)
- **Enemy projectiles**: yes — Shooters fire at the player when in range
- **Wave progression**: hybrid — advance on a wave timer or when all spawned enemies die
- **Score system**: kill value + time-survived bonus + combo multiplier
- **Sprint**: Shift enables 2x movement speed
- **Canvas sizing**: fixed 800x600

## Open Questions

- Mobile controls: on-screen joystick/touch input for Capacitor builds (keyboard only today)
- Pause/restart UX: surface the Escape/R bindings in actual UI
- Difficulty tuning: validate wave composition and spawn pacing in real play
- Power-ups / upgrades between waves?
- Persistence: high-score storage across sessions?
