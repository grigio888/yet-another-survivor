# Project: Vampire Survivors Clone

## Core Features

- Character controlled by WASD or arrow keys
- Three enemy types: Grunt, Shooter, Chief
- Enemy variants with different behaviors and stats
- Reuseable components for enemies, map, and character
- Player health system with 3 lives
- Game over screen with restart option


## Project Structure

- `src/components/`: Reusable UI components
- `src/lib/game/`: Game engine and core logic
- `src/lib/game/entities/`: Enemy and character classes
- `src/lib/game/systems/`: Game systems like collision detection
- `src/lib/game/utils/`: Utility functions
- `src/lib/game/config/`: Game configuration
- `src/lib/game/assets/`: Game assets
- `src/lib/game/screens/`: Game screens like main menu, game over, etc.
- `src/lib/game/ui/`: Game UI components
- `src/lib/game/input/`: Game input handling
- `src/lib/game/audio/`: Game audio handling
- `src/lib/game/particles/`: Game particles handling
- `src/lib/game/effects/`: Game effects handling
- `src/lib/game/particles/`: Game particles handling

## Game Mechanics

- Character moves with WASD or arrow keys
- Character shoots at nearest enemy
- Enemies move towards character
- Shooters shoot at character from distance
- Chiefs are tankier and take more damage
- Player loses one life when hit by enemy
- Game over when player has 0 lives
- Restart button to start new game

## Implementation Steps

1. Create the character component
2. Create the enemy components
3. Create the map component
4. Create the game engine
5. Create the game over screen
6. Create the restart button
7. Create the game loop
8. Create the game logic
9. Create the game UI
10. Create the game input
11. Create the game audio
12. Create the game particles
13. Create the game effects
14. Create the game particles