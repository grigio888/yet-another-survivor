---
name: gaming
description: Vampire Survivors clone development. Use when implementing game mechanics, game engine systems, entity behaviors, and game-specific components for this project.
---

# Gaming Development Skill

This skill guides development of the Vampire Survivors clone in this project:

- **Project source**: `src/lib/game/`
- **Project tests**: `tests/lib/game/`

## Project Structure

The game code lives under `src/lib/game/` with this structure:

```
src/lib/game/
config/      # Game constants and tunable values
input/       # Keyboard and mouse input handling
engine/      # Game loop, state machine, systems orchestration
entities/     # Character and enemy classes
systems/      # Collision detection, combat, spawning mechanics
screens/      # Menu screens, pause screen, game over
ui/           # HUD, score display, life display
audio/        # Sound effects, music playback
particles/    # Visual particle effects (explosions, sparks)
effects/      # Screen effects (shake, flash, fade transitions)
```

## Development Guidelines

Read `.agents/guideline.md` for code style rules.

## Entity Patterns

Game entities follow this hierarchy:

```
Entity (base class)
├── Character
│   ├── Movement system
│   ├── Auto-shoot at nearest enemy
│   ├── Health/lives management  
│   └── Invulnerability frames after hit
└── Enemy (base class)
    ├── Grunt (melee chaser)
    ├── Shooter (ranged attacker)
    └── Chief (tanky boss)
```

## Config Decisions

| Property | Value | Purpose |
|----------|-------|---------|
| canvas width | 800 | Game area width |
| canvas height | 600 | Game area height |
| max lives | 3 | Player survival |
| player speed | 200 px/s | Movement speed |
| shoot cooldown | 400 ms | Auto-fire rate |
| projectile speed | 400 px/s | Bullet travel |
| projectile damage | 25 | Bullet power |

**Enemy stats:**
- **Grunt**: hp=30, speed=80, damage=1, green, size=24
- **Shooter**: hp=20, speed=50, damage=15, orange, size=20
- **Chief**: hp=150, speed=35, damage=2, red, size=36

## Rendering Decision

Use Canvas API with colored shapes/shapes rendered directly. Not pixel art or sprites.

## Wave System Decision

- Timer-based wave progression (waves start after interval)
- Each wave adds more enemies than the previous wave

## Movement Decisions

- WASD keys for movement
- Arrow keys as alternative
- Shift key enables sprint (faster movement)
- Diagonal movement is normalized

## Combat Decisions

- Player auto-shoots at nearest enemy  
- Grunts: melee only
- Shooters: ranged attacks when within range
- Chief: tanky but slow

## Key Files Implemented

Already created and tested:

| File | Purpose |
|------|---------|
| `src/lib/game/config/index.ts` | All game constants |
| `src/lib/game/input/manager.ts` | Keyboard input handling |
| `config/index.test.ts` | Config validation tests |
| `input/manager.test.ts` | Input manager tests |