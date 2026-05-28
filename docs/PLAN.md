# Implementation Plan: Vampire Survivors Clone

## Overview

A top-down survival shooter where the player dodges and fights waves of enemies. Built with SvelteKit, TypeScript, and a custom game engine using Canvas API.

## Technical Stack

- **Framework**: SvelteKit
- **Language**: TypeScript
- **Rendering**: HTML Canvas API (no external game engine)
- **Audio**: Web Audio API
- **Testing**: Vitest

## Project Structure

```
src/lib/game/
├── config/      # Game constants, enemy stats, tunables
├── input/       # Keyboard/mouse input handling
├── engine/      # Main game loop, state machine
├── entities/     # Character and enemy classes
├── systems/      # Collision, combat, spawning, waves
├── screens/      # Main menu, game over, pause
├── ui/           # HUD, health display, score
├── audio/        # Sound effects, music
├── particles/    # Visual particle effects
├── effects/      # Screen effects (shake, fade)
└── utils/        # Helper functions
```

## Phase 1: Core Foundation

### config/index.ts
- `MAX_LIVES`: Maximum player lives (3)
- `SHOOT_COOLDOWN_ms`: Auto-fire cooldown
- `WAVE_INITIAL_ENEMIES`: Starting wave enemy count
- `WAVE_INCREASE_PER_ROUND`: Enemies added each wave
- Enemy stat tables (Grunt, Shooter, Chief): HP, speed, damage, range

### input/manager.ts
- Tracks WASD and arrow key state
- Keyboard event listeners on window
- Modifier key support (Shift for sprint?)
- Passive input polling for game loop

### engine/loop.ts
- `requestAnimationFrame`-based game loop
- Delta time calculation for frame-independent updates
- State machine: MENU → PLAYING → PAUSED → GAME_OVER
- Systems update order: input → entities → combat → particles → render

## Phase 2: Entities

### entities/Entity.ts (Base class)
- Common properties: x, y, width, height, hp, maxHp, speed
- Common methods: `update(dt)`, `draw(ctx)`

### entities/Character.ts
- Extends Entity
- Movement based on input state
- Auto-fire at nearest enemy
- Health/lives management
- Invulnerability frames after hit
- Weapon/projectile properties

### entities/Enemy.ts (Base class)
- Extends Entity
- AI update method

### entities/Grunt.ts
- Extends Enemy
- Behavior: Move toward player
- Stats: Low HP, moderate speed, melee damage

### entities/Shooter.ts
- Extends Enemy
- Behavior: Move toward player, shoot when within range
- Stats: Medium HP, slower speed, projectile attack

### entities/Chief.ts
- Extends Enemy
- Behavior: Slow but tanky boss
- Stats: High HP, slow speed, heavy damage

## Phase 3: Systems

### systems/spawning.ts
- Wave management
- Enemy spawn timer based on wave number
- Spawn outside visible area
- Different enemy mix per wave

### systems/collision.ts
- AABB or circle-based collision detection
- Projectile-enemy collision
- Enemy-character collision (damage)

### systems/combat.ts
- Damage calculation
- Health updates
- Kill detection and scoring
- Life loss on damage

## Phase 4: Screens & UI

### screens/menu.ts
- Welcome screen with start button
- Instructions display

### screens/gameover.ts
- Final score display
- Restart button

### ui/hud.ts
- Lives display (hearts/icons)
- Score/wave counter
- Drawn overlay on canvas

## Phase 5: Polish

### audio/manager.ts
- Sound effect loading via Web Audio API
- Play methods for: shoot, hit, enemy_death, game_over

### particles/manager.ts
- Spawn particle on enemy kill
- Spawn particle on player hit
- Particle types: explode, spark, blood

### effects/manager.ts
- Screen shake on damage
- Flash effects
- Fade transitions between screens

## Implementation Order

1. **Phase 1.1** — Config constants
2. **Phase 1.2** — Input manager
3. **Phase 2.1** — Base Entity and Character classes
4. **Phase 2.2** — Enemy classes (Grunt first, then Shooter, then Chief)
5. **Phase 3.1** — Collision detection system
6. **Phase 3.2** — Combat system
7. **Phase 3.3** — Spawning system
8. **Phase 1.3** — Game engine/loop (with rendering)
9. **Phase 4.1** — HUD and lives display
10. **Phase 4.2** — Game over screen + restart
11. **Phase 4.3** — Main menu screen
12. **Phase 5** — Audio, particles, effects

## Open Questions to Resolve

- Movement style: smooth interpolation vs. discrete jumps
- Enemy visuals: colored shapes vs. pixel art vs. emojis
- Projectiles: do enemies shoot too? (Shooter class says yes)
- Wave progression: timer-based or kill-based?
- Score system: kills, time survived, combo multiplier?
- Sprint ability: Should Shift enable faster movement?
- Canvas sizing: fullscreen or fixed size container?
