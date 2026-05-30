    # Entities

    Game entity classes that represent all objects in the game world. These classes define how entities behave, move, take damage, and draw themselves on the canvas.

    ## Purpose

    The entities system provides the foundation for all interactive game objects:

    - Represents the player character
    - Represents all enemy types with distinct behaviors  
    - Handles movement, damage, collisions, and rendering
    - Uses an inheritance hierarchy for code reuse

    ## Class Hierarchy

    ```
    Entity (base class)
    ├── characters/
    │   ├── Character  # Base for all playable characters
    │   └── Mage       # Ranged spellcaster
    └── enemies/
        ├── Enemy      # Base for all enemies
        ├── Grunt      # Melee attacker
        ├── Shooter    # Ranged attacker
        └── Chief      # Tanky boss
    ```

    ## Classes

    ### Entity

    Base class providing common properties and methods shared by all game objects:

    **Properties:**
    - `x, y` - World position (coordinates)
    - `size` - Entity dimensions (square)
    - `width, height` - Derived from size
    - `hp, maxHp` - Current and maximum health
    - `speed` - Movement velocity (pixels/second)
    - `damage` - Damage output value
    - `color` - Visual color for rendering

    **Methods:**
    - `update(dt)` - Update logic each frame (override in subclasses)
    - `takeDamage(amount)` - Apply damage to entity
    - `isAlive()` - Check if HP is above zero
    - `collidesWith(other)` - AABB collision detection
    - `draw(ctx)` - Render entity on canvas

    ### Character

    Base class for playable characters. Inherits from Entity and adds player-specific features:

    **Extra Properties:**
    - `type` - Character classification (mage, etc.)
    - `lives` - Number of lives remaining (from character stats)
    - `lastShot` - Timestamp of last shot taken
    - `invincibleUntil` - Timestamp until invulnerability expires

    **Extra Methods:**
    - `update(dt, movement)` - Move character based on input direction
    - `shoot(target)` - Create projectile aimed at closest enemy
    - `takeDamage(amount)` - Lose a life on hit, grants invulnerability frames
    - `isInvincible()` - Check if currently invulnerable

    ### Mage

    Ranged spellcaster. Inherits from Character. Stats are defined in `Mage.ts` as `MAGE_STATS`.

    Usage:
    ```typescript
    import { Mage, MAGE_STATS } from '$lib/game/entities/characters';
    const mage = new Mage(400, 300);
    ```

    ### Enemy

    Base class for enemies. Inherits from Entity and adds enemy AI behaviors:

    **Extra Properties:**
    - `type` - Enemy classification (grunt/shooter/chief)
    - `lastShot` - Shot cooldown tracking
    - `range` - Attack range (0 means melee only)
    - `scoreValue` - Points awarded on kill

    **Extra Methods:**
    - `update(dt)` - Enemy movement toward player
    - `canShoot()` - Whether enemy is capable of ranged attack
    - `shoot(targetX, targetY)` - Create projectile aimed at player

    ### Grunt

    Melee-only enemy. Inherits from Enemy. Characteristics:
    - **Fast movement** but low HP (30 HP, 80 px/s speed)  
    - **Melee damage** only when touching player (1 damage)
    - **Green** colored rectangle

    Usage:
    ```typescript
    import { Grunt } from '$lib/game/entities/enemies';
    const grunt = new Grunt(100, 200); // Spawn at position
    
    // Moves toward player position
    grunt.update(0.016, playerX, playerY);
    ```

    ### Shooter

    Ranged attacker. Inherits from Enemy. Characteristics:
    - **Medium HP** (20 HP) and **slow movement** (50 px/s speed)
    - **Shots projectiles** when player is within range (250px)
    - **Orange** colored rectangle
    - **2s cooldown** between shots

    Usage:
    ```typescript
    import { Shooter } from '$lib/game/entities/enemies';
    const shooter = new Shooter(x, y);
    
    // Returns null if not ready to shoot, or projectile if targets lock acquired
    const projectile = shooter.update(0.016, playerX, playerY);
    
    // Shooter class overrides update() to return projectile
    ```

    ### Chief

    Tanky boss enemy. Inherits from Enemy. Characteristics:
    - **High HP** (150 HP) dwarfs other enemies  
    - **Very slow** movement (35 px/s speed)
    - **Heavy damage** output (2 damage per hit)
    - **Large red** colored rectangle
    
    ## Usage Examples

    ### Creating entities from config

    ```typescript
    import { ENEMIES } from '$lib/game/config/index';
    
    // Fetch enemy stats from config
    const gruntStats = ENEMIES.grunt;
    
    // Create with config-derived stats
    const enemy = new Grunt(400, 300);
    enemy.hp = gruntStats.hp;
    enemy.speed = gruntStats.speed;
    ```

    ### Battle loop integration

    ```typescript
    class GameState {
        character: Character;
        enemies: Enemy[];
        projectiles: Projectile[];
        
        update(dt: number) {
            // Update character movement
            this.character.update(dt, movement);
            
            // Update all enemies  
            for (const enemy of this.enemies) {
                const projectile = enemy.update(dt, 
                    this.character.x, this.character.y);
                
                // Add enemy fired projectile
                if (projectile) {
                    this.projectiles.push(projectile);
                }
                
                // Check collision with character
                if (collides(entity, this.character)) {
                    this.character.takeDamage(enemy.damage);
                }
            }
            
            // Check projectile-enemy collisions
            // ... check projectile entity collisions
        }
    }
    ```

    ## Testing

    Tests for entities are located in `tests/lib/game/entities/`:

    - `tests/lib/game/entities/Entity.test.ts` - Tests base entity functionality
    - `tests/lib/game/entities/Character.test.ts` - Tests player behaviors
    - `tests/lib/game/entities/Enemy.test.ts` - Tests base enemy functionality

    Run tests:

    ```bash
    npm test  # Runs all tests
    vitest lib/game/entities  # Runs only entity tests
    ```