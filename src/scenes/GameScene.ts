import Phaser from 'phaser';
import { WORLD, PLATFORMS, DEPTHS, PLAYER, COLLECTIBLES, CAMERA, UI_TYPOGRAPHY, UI_COLORS, UI_SPACING, UI_LAYOUT, HEARTS, MOVING_PLATFORMS, ONE_WAY_PLATFORMS, ENEMIES } from '../config/gameConfig';
import { Player } from '../objects/Player';
import { Collectible } from '../objects/Collectible';
import { Heart } from '../objects/Heart';
import { MovingPlatform } from '../objects/MovingPlatform';
import { OneWayPlatform } from '../objects/OneWayPlatform';
import { Score } from '../systems/Score';
import { getGameState } from '../state/GameState';
import { Enemy, EnemyDefinition } from '../objects/Enemy';
import { GroundPatrol } from '../objects/enemies/GroundPatrol';
import { Hopper } from '../objects/enemies/Hopper';
import { Flyer } from '../objects/enemies/Flyer';
import { getLevelDefinition, LevelDefinition, isValidLevelIndex, validateLevelBones } from '../data/LevelDefinitions';
import { THEME_ASSETS, ThemeId } from '../data/AssetManifest';

interface GameSceneData {
  levelIndex?: number;
}

export class GameScene extends Phaser.Scene {
  // Level data
  private levelDefinition?: LevelDefinition;
  private levelIndex: number = 1;
  private useLevelDefinition: boolean = false; // Toggle between old config and new level system
  private platformGroup!: Phaser.Physics.Arcade.StaticGroup;
  private player!: Player;
  private boneGroup!: Phaser.Physics.Arcade.Group;
  private collectibles: Collectible[] = [];
  private heartGroup!: Phaser.Physics.Arcade.Group;
  private hearts: Heart[] = [];
  private scoreSystem!: Score;
  private winOverlay?: Phaser.GameObjects.Container;
  private isGameWon: boolean = false;
  private keyR!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private debugGraphics?: Phaser.GameObjects.Graphics;
  private isDebugEnabled: boolean = false;
  private sparkleEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private dustEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private gameMusic?: Phaser.Sound.BaseSound;
  private lastLandSoundTime: number = 0;
  private landSoundThrottle: number = 200; // Minimum ms between land sounds

  // Moving and one-way platforms
  private movingPlatforms: MovingPlatform[] = [];
  private movingPlatformGroup!: Phaser.Physics.Arcade.Group;
  private oneWayPlatforms: OneWayPlatform[] = [];
  private oneWayPlatformGroup!: Phaser.Physics.Arcade.Group;
  private currentRidingPlatform: MovingPlatform | null = null;

  // Enemy system
  private enemies: Enemy[] = [];
  private enemyGroup!: Phaser.Physics.Arcade.Group;

  // Damage system
  private isInvulnerable: boolean = false;
  private invulnerabilityDuration: number = 1000; // 1 second of i-frames
  private isGameOver: boolean = false;
  private gameOverOverlay?: Phaser.GameObjects.Container;
  private levelCompleteOverlay?: Phaser.GameObjects.Container;
  private checkpointHP: number = 5; // HP at level start for restart
  private isHandlingBoneCollect: boolean = false;

  // Flag for reachFlag completion goal (level 10)
  private flagSprite?: Phaser.Physics.Arcade.Sprite;

  // Audio system - tracks if AudioContext is truly ready for playback
  private audioReady: boolean = false;
  private pendingSounds: Array<{ key: string; volume: number }> = [];

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data?: GameSceneData): void {
    // Get level index from scene data or GameState
    const gameState = getGameState();

    // Check if we're being called with a level index (from level select or next level)
    if (data?.levelIndex !== undefined) {
      this.levelIndex = data.levelIndex;
      this.useLevelDefinition = true;
    } else if (gameState.selectedLevelIndex > 0) {
      // Use selected level from GameState
      this.levelIndex = gameState.selectedLevelIndex;
      this.useLevelDefinition = true;
    } else {
      // Fall back to old config-based behavior
      this.useLevelDefinition = false;
      this.levelIndex = 1;
    }

    // Validate level index
    if (this.useLevelDefinition && !isValidLevelIndex(this.levelIndex)) {
      console.warn(`Invalid level index ${this.levelIndex}, defaulting to 1`);
      this.levelIndex = 1;
    }

    console.log(`GameScene init: Level ${this.levelIndex}, useLevelDefinition: ${this.useLevelDefinition}`);
  }

  create() {
    console.log('🎮 GameScene created');

    // Reset game state flags
    this.isGameWon = false;
    this.isGameOver = false;
    this.isInvulnerable = false;

    // Clear arrays for scene restart
    this.movingPlatforms = [];
    this.oneWayPlatforms = [];
    this.collectibles = [];
    this.hearts = [];
    this.enemies = [];

    // Load level definition if using new system
    if (this.useLevelDefinition) {
      this.levelDefinition = getLevelDefinition(this.levelIndex);
      console.log(`Loaded level: ${this.levelDefinition.levelName} (${this.levelDefinition.theme})`);

      // Dev-mode validation: Check for level design issues
      const boneWarnings = validateLevelBones(this.levelDefinition);
      if (boneWarnings.length > 0) {
        boneWarnings.forEach(warning => {
          console.warn(`⚠️ ${warning}`);
        });
        // Fail-fast in dev mode: throw on critical issues (duplicate bones)
        const criticalIssues = boneWarnings.filter(w => w.includes('Duplicate'));
        if (criticalIssues.length > 0) {
          throw new Error(`❌ Critical level design issue: ${criticalIssues[0]}`);
        }
      }

      // Dev-mode validation: Check bone reachability
      this.validateBoneReachability(this.levelDefinition);
    }

    // Save checkpoint HP for restart functionality
    const gameState = getGameState();
    gameState.saveLevelCheckpoint();
    this.checkpointHP = gameState.currentHP;

    // Initialize audio system with proper unlock handling
    this.initializeAudio();

    // Start game background music (with proper unlock handling)
    this.startGameMusic();

    // Create score system with bone count from level definition
    const totalBones = this.levelDefinition ? this.levelDefinition.bones.length : COLLECTIBLES.count;
    this.scoreSystem = new Score(totalBones);

    // Launch HudScene with level info
    const levelName = this.levelDefinition ? this.levelDefinition.levelName : 'Grasslands';
    this.scene.launch('HudScene', {
      scoreSystem: this.scoreSystem,
      currentHP: gameState.currentHP,
      maxHP: gameState.maxHP,
      level: this.levelIndex,
      levelName: levelName,
    });

    // Set world bounds
    this.physics.world.setBounds(0, 0, WORLD.width, WORLD.height);

    // Create background - themed if using level definition
    if (this.levelDefinition) {
      this.createThemedBackground(this.levelDefinition.theme);
    } else {
      this.createParallaxBackground();
    }

    // Create static physics group for platforms
    this.platformGroup = this.physics.add.staticGroup();

    // Create platforms - from level definition or config
    if (this.levelDefinition) {
      this.levelDefinition.platforms.forEach(platformConfig => {
        this.createTiledPlatform(platformConfig);
      });
    } else {
      PLATFORMS.forEach((platformConfig, index) => {
        this.createTiledPlatform(platformConfig);
      });
    }

    // Refresh the static group to ensure physics bodies are updated
    this.platformGroup.refresh();

    // Create moving platforms
    this.createMovingPlatforms();

    // Create one-way platforms
    this.createOneWayPlatforms();

    // Camera setup - fixed view initially (no follow yet)
    this.cameras.main.setBounds(0, 0, WORLD.width, WORLD.height);

    // Create particle emitters for juice effects
    this.createParticleEmitters();

    // Get player spawn position from level definition or config
    const spawnX = this.levelDefinition ? this.levelDefinition.playerSpawn.x : PLAYER.spawnX;
    const spawnY = this.levelDefinition ? this.levelDefinition.playerSpawn.y : PLAYER.spawnY;

    // Create player (EXACTLY once per GameScene instance)
    this.player = new Player(this, spawnX, spawnY, this.dustEmitter);

    // RUNTIME ASSERTION: Verify only ONE player sprite exists in this scene
    // This catches bugs where player might be created multiple times
    const playerSprites = this.children.list.filter(
      child => child instanceof Phaser.Physics.Arcade.Sprite &&
               (child.texture.key === 'dog' || child.texture.key.startsWith('dog_'))
    );
    if (playerSprites.length !== 1) {
      throw new Error(`❌ CRITICAL BUG: Expected exactly 1 player sprite, found ${playerSprites.length}. Check for duplicate player creation.`);
    }
    console.log(`🐕 Player instance verified (count: ${playerSprites.length})`);

    // Add collision between player and platforms
    // Ground detection is handled in Player.update() using sticky velocity-based logic
    this.physics.add.collider(this.player.sprite, this.platformGroup);

    // Add collision between player and moving platforms
    // Uses custom process callback for "riding" behavior
    this.physics.add.collider(
      this.player.sprite,
      this.movingPlatformGroup,
      undefined,
      this.handleMovingPlatformCollision,
      this
    );

    // Add collision between player and one-way platforms
    // Uses custom process callback for pass-through behavior
    this.physics.add.collider(
      this.player.sprite,
      this.oneWayPlatformGroup,
      undefined,
      this.handleOneWayPlatformCollision,
      this
    );

    // Setup smooth camera follow with deadzone
    this.cameras.main.startFollow(this.player.sprite, true, CAMERA.followLerp, CAMERA.followLerp);
    this.cameras.main.setDeadzone(CAMERA.deadzone.width, CAMERA.deadzone.height);

    // Listen to player events
    this.player.on('landed', this.handlePlayerLanding, this);
    this.player.on('jumped', this.handlePlayerJump, this);

    // Create bone group with allowGravity disabled for all children
    this.boneGroup = this.physics.add.group({
      allowGravity: false, // Disable gravity for all bones in this group
    });

    // Spawn collectibles at positions from level definition or gameConfig
    const bonePositions = this.levelDefinition
      ? this.levelDefinition.bones
      : COLLECTIBLES.positions;

    bonePositions.forEach((pos) => {
      const collectible = new Collectible(this, pos.x, pos.y);
      this.collectibles.push(collectible);
      this.boneGroup.add(collectible.sprite);
    });

    console.log(`🍖 ${bonePositions.length} bones spawned`);

    // Add overlap detection between player and bones
    this.physics.add.overlap(
      this.player.sprite,
      this.boneGroup,
      this.handleBoneCollect,
      undefined,
      this
    );

    // Create heart group with allowGravity disabled
    this.heartGroup = this.physics.add.group({
      allowGravity: false,
    });

    // Spawn heart collectibles at positions from level definition or gameConfig
    const heartPositions = this.levelDefinition
      ? this.levelDefinition.hearts
      : (HEARTS?.positions || []);

    if (heartPositions.length > 0) {
      heartPositions.forEach((pos) => {
        const heart = new Heart(this, pos.x, pos.y);
        this.heartGroup.add(heart.sprite);
        this.hearts.push(heart);
      });
      console.log(`${heartPositions.length} hearts spawned`);
    }

    // Add overlap detection between player and hearts
    this.physics.add.overlap(
      this.player.sprite,
      this.heartGroup,
      this.handleHeartCollect,
      undefined,
      this
    );

    // Create enemies from config
    this.createEnemies();
    // Dev-only validation: log any bone/enemy overlaps at spawn time
    this.logBoneEnemyOverlaps();

    // Create flag if level uses reachFlag goal
    if (this.levelDefinition?.completionGoal === 'reachFlag' && this.levelDefinition.flagPosition) {
      this.createFlag();
    }

    // Setup R key for restart
    this.keyR = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    // Setup D key for debug toggle
    this.keyD = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    // RUNTIME ASSERTION: Score must only change during bone collection
    this.scoreSystem.on('score-changed', this.assertScoreChangeContext, this);
    // Listen to score changes to check for win condition
    this.scoreSystem.on('score-changed', this.checkWinCondition, this);
  }

  private createTiledPlatform(config: { x: number; y: number; width: number; height: number }) {
    // Tile size from Kenney assets (all tiles are 21x21px)
    const TILE_SIZE = 21;

    // Calculate how many tiles we need
    const tilesWide = Math.ceil(config.width / TILE_SIZE);
    const tilesHigh = Math.ceil(config.height / TILE_SIZE);

    // Create tiles to fill the platform area
    for (let row = 0; row < tilesHigh; row++) {
      for (let col = 0; col < tilesWide; col++) {
        const tileX = config.x + col * TILE_SIZE;
        const tileY = config.y + row * TILE_SIZE;

        // Choose tile texture based on position
        let tileKey: string;
        if (row === 0) {
          // Top row uses grass top tile
          tileKey = 'tile_grass_top';
        } else {
          // Other rows use dirt tiles (alternate for variety)
          tileKey = (col + row) % 2 === 0 ? 'tile_dirt' : 'tile_dirt_alt';
        }

        // Create tile sprite
        const tile = this.add.sprite(tileX, tileY, tileKey);
        tile.setOrigin(0, 0);
        tile.setDepth(DEPTHS.platforms);

        // Add to physics group
        this.platformGroup.add(tile, true);
      }
    }
  }

  /**
   * Creates moving platforms from level definition or config.
   * Moving platforms carry the player along as they move.
   */
  private createMovingPlatforms(): void {
    // Initialize group for moving platform bodies
    this.movingPlatformGroup = this.physics.add.group({
      allowGravity: false,
    });

    // Get moving platforms from level definition or config
    const movingPlatformDefs = this.levelDefinition
      ? this.levelDefinition.movingPlatforms
      : (MOVING_PLATFORMS || []);

    if (movingPlatformDefs.length === 0) {
      console.log('No moving platforms defined');
      return;
    }

    // Create each moving platform
    movingPlatformDefs.forEach((config) => {
      const platform = new MovingPlatform(
        this,
        config.x,
        config.y,
        config.width,
        config.axis,
        config.range,
        config.speed
      );
      this.movingPlatforms.push(platform);
      this.movingPlatformGroup.add(platform.getBody());
    });

    console.log(`Created ${this.movingPlatforms.length} moving platforms`);
  }

  /**
   * Creates one-way platforms from level definition or config.
   * Player can jump through from below but lands on top.
   */
  private createOneWayPlatforms(): void {
    // Initialize group for one-way platform bodies
    this.oneWayPlatformGroup = this.physics.add.group({
      allowGravity: false,
    });

    // Get one-way platforms from level definition or config
    const oneWayPlatformDefs = this.levelDefinition
      ? this.levelDefinition.oneWayPlatforms
      : (ONE_WAY_PLATFORMS || []);

    if (oneWayPlatformDefs.length === 0) {
      console.log('No one-way platforms defined');
      return;
    }

    // Create each one-way platform
    oneWayPlatformDefs.forEach((config) => {
      const platform = new OneWayPlatform(
        this,
        config.x,
        config.y,
        config.width
      );
      this.oneWayPlatforms.push(platform);
      this.oneWayPlatformGroup.add(platform.getBody());
    });

    console.log(`Created ${this.oneWayPlatforms.length} one-way platforms`);
  }

  /**
   * Handles collision between player and moving platforms.
   * Always returns true to allow collision, but tracks riding state.
   */
  private handleMovingPlatformCollision(
    playerSprite: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    platformBody: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
  ): boolean {
    // Find the MovingPlatform object for this body
    const platform = this.movingPlatforms.find(p => p.body === platformBody);
    if (platform) {
      // Track that we're on a moving platform for the update loop
      this.currentRidingPlatform = platform;
    }
    return true; // Allow collision
  }

  /**
   * Handles one-way platform collision.
   * Returns false to allow pass-through when player is below platform or moving up.
   */
  private handleOneWayPlatformCollision(
    playerSprite: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    platformBody: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
  ): boolean {
    const player = playerSprite as Phaser.Physics.Arcade.Sprite;

    // Find the OneWayPlatform object for this body
    const platform = this.oneWayPlatforms.find(p => p.body === platformBody);
    if (platform) {
      return platform.checkOneWay(player);
    }
    return true; // Fallback to normal collision
  }

  /**
   * Creates enemies from level definition or config and sets up collision with player.
   */
  private createEnemies(): void {
    // Initialize enemy group
    this.enemyGroup = this.physics.add.group({
      allowGravity: true, // Most enemies need gravity
    });

    // Get enemy definitions from level definition or config
    const enemyDefs = this.levelDefinition
      ? this.levelDefinition.enemies.map(e => ({
          type: e.type,
          x: e.x,
          y: e.y,
          params: {
            patrolRange: e.params?.patrolDistance,
            speed: e.params?.patrolDistance ? 80 : undefined,
            jumpHeight: e.params?.hopHeight,
            amplitude: e.params?.amplitude,
            frequency: e.params?.frequency,
          },
        }))
      : (ENEMIES || []);

    if (enemyDefs.length === 0) {
      console.log('🦀 No enemies defined');
      return;
    }

    // Create each enemy based on type
    enemyDefs.forEach((enemyDef: EnemyDefinition) => {
      let enemy: Enemy;

      switch (enemyDef.type) {
        case 'groundPatrol':
          enemy = new GroundPatrol(this, enemyDef.x, enemyDef.y, enemyDef.params);
          break;
        case 'hopper':
          enemy = new Hopper(this, enemyDef.x, enemyDef.y, enemyDef.params);
          break;
        case 'flyer':
          enemy = new Flyer(this, enemyDef.x, enemyDef.y, enemyDef.params);
          break;
        default:
          console.warn(`🦀 Unknown enemy type: ${(enemyDef as any).type}`);
          return;
      }

      // Add enemy sprite to group and track enemy object
      this.enemyGroup.add(enemy.sprite);
      this.enemies.push(enemy);
    });

    // Add collision between enemies and platforms
    this.physics.add.collider(this.enemyGroup, this.platformGroup);

    // Add overlap detection between player and enemies for damage
    this.physics.add.overlap(
      this.player.sprite,
      this.enemyGroup,
      this.handlePlayerDamage,
      undefined,
      this
    );

    console.log(`🦀 Created ${this.enemies.length} enemies`);
  }

  /**
   * Logs any bone/enemy overlaps at spawn time for debugging.
   */
  private logBoneEnemyOverlaps(): void {
    if (this.collectibles.length === 0 || this.enemies.length === 0) {
      return;
    }

    const levelLabel = this.levelDefinition
      ? `Level ${this.levelDefinition.levelIndex} (${this.levelDefinition.levelName})`
      : 'Legacy level';

    const overlaps: Array<{
      boneIndex: number;
      enemyIndex: number;
      enemyType: string;
      boneX: number;
      boneY: number;
      enemyX: number;
      enemyY: number;
    }> = [];

    this.collectibles.forEach((collectible, boneIndex) => {
      const boneBounds = collectible.sprite.getBounds();
      this.enemies.forEach((enemy, enemyIndex) => {
        const enemyBounds = enemy.sprite.getBounds();
        if (Phaser.Geom.Intersects.RectangleToRectangle(boneBounds, enemyBounds)) {
          overlaps.push({
            boneIndex,
            enemyIndex,
            enemyType: enemy.getTypeName(),
            boneX: collectible.sprite.x,
            boneY: collectible.sprite.y,
            enemyX: enemy.sprite.x,
            enemyY: enemy.sprite.y,
          });
        }
      });
    });

    if (overlaps.length > 0) {
      console.warn(`Bone/enemy overlaps detected at spawn (${levelLabel}): ${overlaps.length}`);
      overlaps.forEach((overlap) => {
        console.warn(
          `  overlap bone[${overlap.boneIndex}] (${overlap.boneX}, ${overlap.boneY}) ` +
          `enemy[${overlap.enemyIndex}] ${overlap.enemyType} (${overlap.enemyX}, ${overlap.enemyY})`
        );
      });
    } else {
      console.log(`No bone/enemy overlaps detected at spawn (${levelLabel})`);
    }
  }

  /**
   * Handles player taking damage from enemy collision.
   * Includes invulnerability frames and knockback.
   */
  private handlePlayerDamage(
    playerSprite: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    enemySprite: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
  ): void {
    // Skip if invulnerable or game is over
    if (this.isInvulnerable || this.isGameOver || this.isGameWon) return;

    const gameState = getGameState();
    const player = playerSprite as Phaser.Physics.Arcade.Sprite;
    const enemy = enemySprite as Phaser.Physics.Arcade.Sprite;

    // Take damage
    const stillAlive = gameState.takeDamage(1);

    // Emit event for HUD update
    this.events.emit('hp-changed', gameState.currentHP);

    // Apply knockback
    this.applyKnockback(player, enemy);

    // Start invulnerability frames
    this.startInvulnerability();

    // Play damage sound
    this.tryPlaySound('land_sfx', 0.8); // Reuse land sound for now

    // Camera shake for impact
    this.cameras.main.shake(150, 0.008);

    // Screen flash for damage feedback
    this.cameras.main.flash(100, 255, 100, 100, false);

    console.log(`💥 Player hit! HP: ${gameState.currentHP}/${gameState.maxHP}`);

    // Check for game over
    if (!stillAlive) {
      this.triggerGameOver();
    }
  }

  /**
   * Applies knockback force to player away from enemy.
   */
  private applyKnockback(
    player: Phaser.Physics.Arcade.Sprite,
    enemy: Phaser.Physics.Arcade.Sprite
  ): void {
    const knockbackForceX = 300;
    const knockbackForceY = -250;

    // Determine direction (push away from enemy)
    const direction = player.x < enemy.x ? -1 : 1;

    // Apply knockback velocity
    player.setVelocity(direction * knockbackForceX, knockbackForceY);
  }

  /**
   * Starts invulnerability period with visual flicker effect.
   */
  private startInvulnerability(): void {
    this.isInvulnerable = true;

    // Flicker effect - rapid alpha changes
    this.tweens.add({
      targets: this.player.sprite,
      alpha: { from: 0.3, to: 1 },
      duration: 100,
      repeat: 9,
      yoyo: true,
    });

    // End invulnerability after duration
    this.time.delayedCall(this.invulnerabilityDuration, () => {
      this.isInvulnerable = false;
      this.player.sprite.alpha = 1; // Ensure full alpha
      console.log('🐕 Invulnerability ended');
    });
  }

  /**
   * Triggers game over state.
   */
  private triggerGameOver(): void {
    this.isGameOver = true;

    console.log('❌ GAME OVER');

    // Stop player movement
    this.player.sprite.setVelocity(0, 0);
    this.player.sprite.setAcceleration(0, 0);

    // Stop game music
    if (this.gameMusic) {
      this.gameMusic.stop();
    }

    // Show game over overlay after a short delay
    this.time.delayedCall(500, () => {
      this.showGameOverOverlay();
    });
  }

  /**
   * Shows the game over overlay with restart options.
   */
  private showGameOverOverlay(): void {
    // Create container for game over overlay
    this.gameOverOverlay = this.add.container(0, 0);
    this.gameOverOverlay.setScrollFactor(0); // Fixed to camera

    // Get camera center for positioning
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // Semi-transparent dark background
    const overlay = this.add.rectangle(
      centerX,
      centerY,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000,
      0.8
    );

    // "GAME OVER" title
    const gameOverText = this.add.text(centerX, centerY - 80, 'GAME OVER', {
      fontFamily: UI_TYPOGRAPHY.fontFamily,
      fontSize: UI_TYPOGRAPHY.sizeXXL,
      color: UI_COLORS.danger,
      stroke: UI_COLORS.backgroundDark,
      strokeThickness: 6,
    });
    gameOverText.setOrigin(0.5, 0.5);

    // Pulse animation for title
    this.tweens.add({
      targets: gameOverText,
      scale: { from: 1, to: 1.05 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Button dimensions
    const buttonWidth = 200;
    const buttonHeight = 50;
    const buttonSpacing = 20;

    // RESTART button
    const restartButton = this.createOverlayButton(
      centerX,
      centerY + 20,
      buttonWidth,
      buttonHeight,
      'RESTART',
      () => this.restartLevel()
    );

    // MENU button
    const menuButton = this.createOverlayButton(
      centerX,
      centerY + 20 + buttonHeight + buttonSpacing,
      buttonWidth,
      buttonHeight,
      'MENU',
      () => this.returnToMenu()
    );

    // Add all elements to container
    this.gameOverOverlay.add([overlay, gameOverText, ...restartButton, ...menuButton]);

    // Set depth above everything
    this.gameOverOverlay.setDepth(DEPTHS.debug + 1);

    // Fade in effect
    this.gameOverOverlay.setAlpha(0);
    this.tweens.add({
      targets: this.gameOverOverlay,
      alpha: 1,
      duration: 300,
      ease: 'Power2',
    });
  }

  /**
   * Creates a styled button with hover effects for overlays.
   */
  private createOverlayButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    onClick: () => void
  ): Phaser.GameObjects.GameObject[] {
    // Button shadow
    const shadow = this.add.rectangle(
      x + UI_LAYOUT.shadowMedium,
      y + UI_LAYOUT.shadowMedium,
      width,
      height,
      Phaser.Display.Color.HexStringToColor(UI_COLORS.backgroundDark).color,
      0.6
    );

    // Button background
    const bg = this.add.rectangle(
      x,
      y,
      width,
      height,
      Phaser.Display.Color.HexStringToColor(UI_COLORS.primary).color,
      1
    );
    bg.setStrokeStyle(
      UI_LAYOUT.borderMedium,
      Phaser.Display.Color.HexStringToColor(UI_COLORS.primaryDark).color
    );

    // Button text
    const text = this.add.text(x, y, label, {
      fontFamily: UI_TYPOGRAPHY.fontFamily,
      fontSize: UI_TYPOGRAPHY.sizeMedium,
      color: UI_COLORS.textPrimary,
      stroke: UI_COLORS.backgroundDark,
      strokeThickness: 2,
    });
    text.setOrigin(0.5, 0.5);

    // Make button interactive
    bg.setInteractive({ useHandCursor: true });

    // Hover effects
    bg.on('pointerover', () => {
      bg.setFillStyle(Phaser.Display.Color.HexStringToColor(UI_COLORS.primaryLight).color);
      text.setScale(1.05);
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(Phaser.Display.Color.HexStringToColor(UI_COLORS.primary).color);
      text.setScale(1);
    });

    // Click handler
    bg.on('pointerdown', () => {
      this.tryPlaySound('ui_click_sfx', 0.6);
      onClick();
    });

    return [shadow, bg, text];
  }

  /**
   * Restarts the current level with checkpoint HP.
   */
  private restartLevel(): void {
    console.log('🎮 Restarting level...');

    // Restore HP to checkpoint
    const gameState = getGameState();
    gameState.restoreLevelCheckpoint();

    // Stop HudScene
    this.scene.stop('HudScene');

    // Restart GameScene
    this.scene.restart();
  }

  /**
   * Returns to the main menu with full reset.
   */
  private returnToMenu(): void {
    console.log('🎮 Returning to menu...');

    // Reset HP for new run
    const gameState = getGameState();
    gameState.startNewRun();

    // Stop HudScene
    this.scene.stop('HudScene');

    // Go to menu scene
    this.scene.start('MenuScene');
  }

  private createParticleEmitters() {
    // Create sparkle emitter for bone collection (burst mode)
    this.sparkleEmitter = this.add.particles(0, 0, 'particle_star', {
      speed: { min: 50, max: 150 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.15, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 600,
      gravityY: 0,
      blendMode: 'ADD',
      frequency: -1, // Burst mode (manual emit)
    });
    this.sparkleEmitter.setDepth(DEPTHS.particles);

    // Create dust emitter for jump/land (burst mode)
    this.dustEmitter = this.add.particles(0, 0, 'particle_dust', {
      speed: { min: 20, max: 60 },
      angle: { min: -120, max: -60 }, // Spray upward and outward
      scale: { start: 0.08, end: 0 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 400,
      gravityY: 100,
      blendMode: 'NORMAL',
      frequency: -1, // Burst mode (manual emit)
    });
    this.dustEmitter.setDepth(DEPTHS.particles);

    console.log('💥 Particle emitters created');
  }

  private createParallaxBackground() {
    // Layer 1: Sky background (tiled, fills entire screen, static)
    const skyTile = this.add.tileSprite(0, 0, WORLD.width, WORLD.height, 'bg_sky');
    skyTile.setOrigin(0, 0);
    skyTile.setDepth(DEPTHS.background);
    skyTile.setScrollFactor(0); // Static, doesn't move with camera

    // Layer 2: Sun (decorative, top-right, slow parallax)
    const sun = this.add.image(WORLD.width - 150, 100, 'bg_sun');
    sun.setScale(3); // Make sun larger
    sun.setDepth(DEPTHS.background + 1);
    sun.setScrollFactor(0.1); // Very slow movement for distant object

    // Layer 3: Far clouds (slow parallax)
    const cloudFar1 = this.add.image(200, 120, 'bg_clouds_far');
    cloudFar1.setScale(2.5);
    cloudFar1.setDepth(DEPTHS.background + 2);
    cloudFar1.setScrollFactor(0.2);

    const cloudFar2 = this.add.image(600, 80, 'bg_clouds_far');
    cloudFar2.setScale(2);
    cloudFar2.setDepth(DEPTHS.background + 2);
    cloudFar2.setScrollFactor(0.2);

    const cloudFar3 = this.add.image(1000, 140, 'bg_clouds_far');
    cloudFar3.setScale(2.8);
    cloudFar3.setDepth(DEPTHS.background + 2);
    cloudFar3.setScrollFactor(0.2);

    // Layer 4: Near clouds (medium parallax)
    const cloudNear1 = this.add.image(300, 180, 'bg_clouds_near');
    cloudNear1.setScale(2);
    cloudNear1.setDepth(DEPTHS.background + 3);
    cloudNear1.setScrollFactor(0.4);

    const cloudNear2 = this.add.image(800, 160, 'bg_clouds_near');
    cloudNear2.setScale(2.3);
    cloudNear2.setDepth(DEPTHS.background + 3);
    cloudNear2.setScrollFactor(0.4);

    // Layer 5: Foreground grass decorations (faster parallax, near platforms)
    const grass1 = this.add.image(100, WORLD.groundTopY - 10, 'bg_grass_decor');
    grass1.setScale(4);
    grass1.setDepth(DEPTHS.background + 4);
    grass1.setScrollFactor(0.8);

    const grass2 = this.add.image(400, WORLD.groundTopY - 10, 'bg_grass_decor');
    grass2.setScale(4);
    grass2.setDepth(DEPTHS.background + 4);
    grass2.setScrollFactor(0.8);

    const grass3 = this.add.image(700, WORLD.groundTopY - 10, 'bg_grass_decor');
    grass3.setScale(4);
    grass3.setDepth(DEPTHS.background + 4);
    grass3.setScrollFactor(0.8);

    const grass4 = this.add.image(1000, WORLD.groundTopY - 10, 'bg_grass_decor');
    grass4.setScale(4);
    grass4.setDepth(DEPTHS.background + 4);
    grass4.setScrollFactor(0.8);

    console.log('🎨 Parallax background created with 5 layers');
  }

  private handleBoneCollect(
    playerSprite: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    boneSprite: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
  ) {
    const bone = boneSprite as Phaser.Physics.Arcade.Sprite;

    // Emit sparkle particles at bone position
    this.sparkleEmitter.emitParticleAt(bone.x, bone.y, 12);

    // Play collect sound (safely)
    this.tryPlaySound('collect_sfx', 0.7);

    // CRITICAL: Disable body FIRST to prevent re-triggering overlap
    bone.disableBody(true, true);

    // Then increment score using Score system
    this.isHandlingBoneCollect = true;
    try {
      this.scoreSystem.addScore(1);
    } finally {
      this.isHandlingBoneCollect = false;
    }

    console.log(`🍖 Collected bone at (${bone.x}, ${bone.y}), score: ${this.scoreSystem.score}/${COLLECTIBLES.count}`);
  }

  private handleHeartCollect(
    playerSprite: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    heartSprite: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
  ) {
    // Find the Heart object that owns this sprite
    const heart = this.hearts.find(h => h.sprite === heartSprite);
    if (!heart || heart.isCollected()) return;

    const gameState = getGameState();

    // Only heal if not at max HP
    if (gameState.currentHP < gameState.maxHP) {
      const healed = gameState.heal(1);

      if (healed > 0) {
        // Successfully healed - collect the heart
        heart.collect();

        // Disable physics body to prevent re-triggering
        const sprite = heartSprite as Phaser.Physics.Arcade.Sprite;
        sprite.disableBody(true, false); // Keep visible for animation

        // Emit event for HUD update
        this.events.emit('hp-changed', gameState.currentHP);

        // Play collect sound (reuse bone collection sound)
        this.tryPlaySound('collect_sfx', 0.6);

        console.log(`Heart collected! HP: ${gameState.currentHP}/${gameState.maxHP}`);
      }
    } else {
      // Already at max HP - provide visual feedback but don't collect
      console.log(`Already at max HP (${gameState.currentHP}/${gameState.maxHP}), heart not collected`);
    }
  }

  private handlePlayerJump() {
    // Play jump sound (safely)
    this.tryPlaySound('jump_sfx', 0.7);
  }

  private handlePlayerLanding() {
    // Throttle land sound AND camera shake to prevent spam
    const currentTime = this.time.now;
    if (currentTime - this.lastLandSoundTime > this.landSoundThrottle) {
      this.tryPlaySound('land_sfx', 0.6);
      // Subtle camera shake on landing (also throttled)
      this.cameras.main.shake(CAMERA.shake.duration, CAMERA.shake.intensity);
      this.lastLandSoundTime = currentTime;
    }
  }

  private checkWinCondition(score: number) {
    // Only check for collectAllBones goal
    if (this.levelDefinition?.completionGoal === 'reachFlag') {
      return; // Flag completion is handled separately
    }

    const totalBones = this.levelDefinition ? this.levelDefinition.bones.length : COLLECTIBLES.count;

    if (score >= totalBones && !this.isGameWon) {
      this.isGameWon = true;
      this.showLevelCompleteOverlay();
      console.log('All bones collected! Level complete!');
    }
  }

  private assertScoreChangeContext(score: number, totalBones: number): void {
    if (this.isHandlingBoneCollect) {
      return;
    }

    const error = new Error(`Score changed outside bone pickup handler (score=${score}/${totalBones}).`);
    console.error('SCORE INTEGRITY VIOLATION: score changed without bone pickup.');
    console.error(error.stack || error.message);
    throw error;
  }

  /**
   * Handle flag reached for reachFlag completion goal
   */
  private handleFlagReached(): void {
    if (!this.isGameWon) {
      this.isGameWon = true;
      this.showLevelCompleteOverlay();
      console.log('Flag reached! Level complete!');
    }
  }

  /**
   * Shows level complete overlay with Next Level / Menu buttons
   */
  private showLevelCompleteOverlay(): void {
    // Stop game music
    if (this.gameMusic) {
      this.gameMusic.stop();
    }

    this.tryPlaySound('win_sfx', 0.8);

    // Unlock next level
    const gameState = getGameState();
    gameState.unlockNextLevel();

    // Create overlay container
    this.levelCompleteOverlay = this.add.container(0, 0);
    this.levelCompleteOverlay.setDepth(1000);
    this.levelCompleteOverlay.setScrollFactor(0);

    // Dark background
    const overlay = this.add.rectangle(
      WORLD.width / 2,
      WORLD.height / 2,
      WORLD.width,
      WORLD.height,
      0x000000,
      0.8
    );

    // "Level Complete!" text
    const titleText = this.add.text(WORLD.width / 2, WORLD.height / 2 - 80, 'LEVEL COMPLETE!', {
      fontFamily: UI_TYPOGRAPHY.fontFamily,
      fontSize: UI_TYPOGRAPHY.sizeXL,
      color: UI_COLORS.textAccent,
      stroke: UI_COLORS.backgroundDark,
      strokeThickness: 6,
    });
    titleText.setOrigin(0.5, 0.5);

    // Level name
    const levelName = this.levelDefinition ? this.levelDefinition.levelName : 'Level ' + this.levelIndex;
    const levelText = this.add.text(WORLD.width / 2, WORLD.height / 2 - 20, levelName, {
      fontFamily: UI_TYPOGRAPHY.fontFamily,
      fontSize: UI_TYPOGRAPHY.sizeMedium,
      color: UI_COLORS.textPrimary,
      stroke: UI_COLORS.backgroundDark,
      strokeThickness: 3,
    });
    levelText.setOrigin(0.5, 0.5);

    this.levelCompleteOverlay.add([overlay, titleText, levelText]);

    // Create buttons
    const buttonY = WORLD.height / 2 + 60;
    const hasNextLevel = this.levelIndex < 10;

    if (hasNextLevel) {
      const nextBtn = this.createNavigationButton(
        WORLD.width / 2 - 120,
        buttonY,
        'NEXT LEVEL',
        () => this.goToNextLevel()
      );
      this.levelCompleteOverlay.add(nextBtn);
    }

    const menuBtn = this.createNavigationButton(
      hasNextLevel ? WORLD.width / 2 + 120 : WORLD.width / 2,
      buttonY,
      'MENU',
      () => this.returnToMenu()
    );
    this.levelCompleteOverlay.add(menuBtn);
  }

  /**
   * Creates a navigation button for overlays
   */
  private createNavigationButton(x: number, y: number, text: string, onClick: () => void): Phaser.GameObjects.Container {
    const btnContainer = this.add.container(x, y);
    const btnWidth = 180;
    const btnHeight = 50;

    // Button shadow
    const shadow = this.add.rectangle(
      UI_LAYOUT.shadowMedium,
      UI_LAYOUT.shadowMedium,
      btnWidth,
      btnHeight,
      Phaser.Display.Color.HexStringToColor(UI_COLORS.backgroundDark).color,
      0.8
    );

    // Button background
    const bg = this.add.rectangle(0, 0, btnWidth, btnHeight, Phaser.Display.Color.HexStringToColor(UI_COLORS.primary).color);
    bg.setStrokeStyle(3, Phaser.Display.Color.HexStringToColor(UI_COLORS.primaryDark).color);

    // Button text
    const btnText = this.add.text(0, 0, text, {
      fontFamily: UI_TYPOGRAPHY.fontFamily,
      fontSize: UI_TYPOGRAPHY.sizeSmall,
      color: UI_COLORS.textPrimary,
    });
    btnText.setOrigin(0.5, 0.5);

    btnContainer.add([shadow, bg, btnText]);

    // Make interactive
    bg.setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        bg.setFillStyle(Phaser.Display.Color.HexStringToColor(UI_COLORS.primaryLight).color);
      })
      .on('pointerout', () => {
        bg.setFillStyle(Phaser.Display.Color.HexStringToColor(UI_COLORS.primary).color);
      })
      .on('pointerdown', () => {
        bg.setFillStyle(Phaser.Display.Color.HexStringToColor(UI_COLORS.primaryDark).color);
      })
      .on('pointerup', () => {
        this.tryPlaySound('ui_click_sfx', 0.5);
        onClick();
      });

    return btnContainer;
  }

  /**
   * Navigate to next level
   */
  private goToNextLevel(): void {
    const gameState = getGameState();
    const nextLevel = this.levelIndex + 1;

    if (nextLevel <= 10) {
      gameState.selectedLevelIndex = nextLevel;
      this.scene.stop('HudScene');
      this.scene.restart({ levelIndex: nextLevel });
    } else {
      // Beat the game!
      this.returnToMenu();
    }
  }

  /**
   * Creates the flag sprite for reachFlag goal
   */
  private createFlag(): void {
    const flagPos = this.levelDefinition!.flagPosition!;

    // Create flag using a procedural texture
    const flagWidth = 40;
    const flagHeight = 60;

    const textureKey = 'flag_texture';
    if (!this.textures.exists(textureKey)) {
      const flagGraphics = this.make.graphics({ x: 0, y: 0 });
      // Flag pole
      flagGraphics.fillStyle(0x8B4513, 1);
      flagGraphics.fillRect(0, 0, 6, flagHeight);
      // Flag fabric (green)
      flagGraphics.fillStyle(0x00FF00, 1);
      flagGraphics.fillRect(6, 0, flagWidth - 6, 30);
      flagGraphics.generateTexture(textureKey, flagWidth, flagHeight);
      flagGraphics.destroy();
    }

    this.flagSprite = this.physics.add.sprite(flagPos.x, flagPos.y - flagHeight / 2, textureKey);
    this.flagSprite.setDepth(DEPTHS.collectibles);

    const body = this.flagSprite.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);

    // Add wave animation
    this.tweens.add({
      targets: this.flagSprite,
      scaleX: { from: 1, to: 1.1 },
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Add overlap detection for flag
    this.physics.add.overlap(
      this.player.sprite,
      this.flagSprite,
      () => this.handleFlagReached(),
      undefined,
      this
    );

    console.log(`Flag created at (${flagPos.x}, ${flagPos.y})`);
  }

  /**
   * Creates themed background based on level theme
   */
  private createThemedBackground(theme: ThemeId): void {
    const themeAssets = THEME_ASSETS[theme];

    // Set sky color as background
    this.cameras.main.setBackgroundColor(themeAssets.skyColor);

    // Try to add sky tile if available
    if (this.textures.exists('bg_sky')) {
      const skyTile = this.add.tileSprite(0, 0, WORLD.width, WORLD.height, 'bg_sky');
      skyTile.setOrigin(0, 0);
      skyTile.setDepth(DEPTHS.background);
      skyTile.setScrollFactor(0);
    }

    // Add sun or moon based on theme
    if (theme === 'night') {
      if (this.textures.exists('bg_moon')) {
        const moon = this.add.image(WORLD.width - 150, 100, 'bg_moon');
        moon.setScale(2);
        moon.setDepth(DEPTHS.background + 1);
        moon.setScrollFactor(0.1);
      }
    } else if (theme !== 'cave') {
      if (this.textures.exists('bg_sun')) {
        const sun = this.add.image(WORLD.width - 150, 100, 'bg_sun');
        sun.setScale(3);
        sun.setDepth(DEPTHS.background + 1);
        sun.setScrollFactor(0.1);
      }
    }

    // Add clouds for appropriate themes
    if (['grasslands', 'forest', 'desert', 'snow', 'beach'].includes(theme)) {
      if (this.textures.exists('bg_clouds_far')) {
        // Far clouds
        const cloudFar1 = this.add.image(200, 120, 'bg_clouds_far');
        cloudFar1.setScale(2.5);
        cloudFar1.setDepth(DEPTHS.background + 2);
        cloudFar1.setScrollFactor(0.2);

        const cloudFar2 = this.add.image(600, 80, 'bg_clouds_far');
        cloudFar2.setScale(2);
        cloudFar2.setDepth(DEPTHS.background + 2);
        cloudFar2.setScrollFactor(0.2);

        const cloudFar3 = this.add.image(1000, 140, 'bg_clouds_far');
        cloudFar3.setScale(2.8);
        cloudFar3.setDepth(DEPTHS.background + 2);
        cloudFar3.setScrollFactor(0.2);

        // Near clouds
        if (this.textures.exists('bg_clouds_near')) {
          const cloudNear1 = this.add.image(300, 180, 'bg_clouds_near');
          cloudNear1.setScale(2);
          cloudNear1.setDepth(DEPTHS.background + 3);
          cloudNear1.setScrollFactor(0.4);

          const cloudNear2 = this.add.image(800, 160, 'bg_clouds_near');
          cloudNear2.setScale(2.3);
          cloudNear2.setDepth(DEPTHS.background + 3);
          cloudNear2.setScrollFactor(0.4);
        }
      }
    }

    console.log(`Created ${theme} themed background`);
  }

  private showWinOverlay() {
    // Legacy method - redirect to new level complete overlay
    this.showLevelCompleteOverlay();
  }

  private restartGame() {
    console.log('🎮 Restarting game...');

    // Stop game music before restart
    if (this.gameMusic) {
      this.gameMusic.stop();
      console.log('🎵 Game music stopped for restart');
    }

    // Stop HudScene
    this.scene.stop('HudScene');

    // Restart GameScene (this will call create() again, which will start new music)
    this.scene.restart();
  }

  private toggleDebug() {
    this.isDebugEnabled = !this.isDebugEnabled;

    if (this.isDebugEnabled) {
      // Enable debug graphics
      if (!this.debugGraphics) {
        this.debugGraphics = this.add.graphics();
        this.debugGraphics.setDepth(DEPTHS.debug);
      }
      this.physics.world.createDebugGraphic();
      console.log('🔍 Debug mode enabled (hitboxes visible)');
    } else {
      // Disable debug graphics
      if (this.debugGraphics) {
        this.debugGraphics.clear();
        this.debugGraphics.destroy();
        this.debugGraphics = undefined;
      }
      console.log('🔍 Debug mode disabled');
    }
  }

  /**
   * Starts game music with proper audio unlock handling
   * Respects gameState volume and mute settings
   */
  private startGameMusic() {
    try {
      const gameState = getGameState();

      // Check if muted
      if (gameState.isMuted) {
        console.log('🎵 Game music skipped (muted)');
        return;
      }

      // Apply gameState musicVolume (base volume 0.35 * settings)
      const musicVolume = 0.35 * gameState.musicVolume;

      this.gameMusic = this.sound.add('game_music', {
        loop: true,
        volume: musicVolume,
      });
      console.log(`🎵 Game music object created with volume ${musicVolume.toFixed(2)}`);

      // Check if audio is locked
      if (this.sound.locked) {
        console.log('🎵 Audio still locked in GameScene, waiting for unlock...');
        this.sound.once('unlocked', () => {
          console.log('🎵 Audio unlocked in GameScene, starting music');
          this.tryPlayGameMusic();
        });
      } else {
        // Audio already unlocked (normal case after menu interaction)
        console.log('🎵 Audio unlocked, starting game music immediately');
        this.tryPlayGameMusic();
      }
    } catch (e) {
      console.warn('⚠️ Could not create game music:', e);
      this.gameMusic = undefined;
    }
  }

  /**
   * Attempts to play game music with debug logging
   */
  private tryPlayGameMusic() {
    if (this.gameMusic && !this.gameMusic.isPlaying) {
      this.gameMusic.play();
      console.log(`🎵 Game music play() called - isPlaying: ${this.gameMusic.isPlaying}`);
    } else if (this.gameMusic?.isPlaying) {
      console.log('🎵 Game music already playing');
    }
  }

  /**
   * Initializes audio system with proper unlock handling for Chrome.
   * Ensures AudioContext is 'running' before allowing sound playback.
   */
  private initializeAudio(): void {
    const audioContext = (this.sound as any).context as AudioContext | undefined;
    console.log(`🎵 GameScene audio init - locked: ${this.sound.locked}, context.state: ${audioContext?.state || 'N/A'}`);

    // Check if audio is already ready
    if (audioContext && audioContext.state === 'running') {
      console.log('🎵 AudioContext already running');
      this.setAudioReady();
      return;
    }

    // Resume AudioContext if suspended
    if (audioContext && audioContext.state === 'suspended') {
      console.log('🎵 AudioContext suspended, attempting resume...');
      audioContext.resume().then(() => {
        console.log('🎵 AudioContext resumed successfully');
        this.setAudioReady();
      }).catch((err: Error) => {
        console.warn('🎵 AudioContext resume failed, waiting for interaction:', err);
      });
    }

    // Phaser unlock listener
    if (this.sound.locked) {
      console.log('🎵 Audio locked, waiting for Phaser unlock...');
      this.sound.once('unlocked', () => {
        console.log('🎵 Audio unlocked by Phaser');
        this.setAudioReady();
      });
    }

    // Backup: Listen for first user interaction
    this.input.once('pointerdown', () => {
      const ctx = (this.sound as any).context as AudioContext | undefined;
      if (ctx && ctx.state === 'suspended') {
        console.log('🎵 First click in GameScene, resuming AudioContext...');
        ctx.resume().then(() => {
          console.log('🎵 AudioContext resumed via click');
          this.setAudioReady();
        });
      } else if (ctx && ctx.state === 'running' && !this.audioReady) {
        this.setAudioReady();
      }
    });

    // Also listen for keyboard (jump with space)
    this.input.keyboard?.once('keydown', () => {
      const ctx = (this.sound as any).context as AudioContext | undefined;
      if (ctx && ctx.state === 'suspended') {
        console.log('🎵 First keypress in GameScene, resuming AudioContext...');
        ctx.resume().then(() => {
          console.log('🎵 AudioContext resumed via keypress');
          this.setAudioReady();
        });
      } else if (ctx && ctx.state === 'running' && !this.audioReady) {
        this.setAudioReady();
      }
    });
  }

  /**
   * Marks audio as ready and flushes any pending sounds.
   */
  private setAudioReady(): void {
    if (this.audioReady) return; // Already ready

    this.audioReady = true;
    console.log(`🎵 Audio system READY - flushing ${this.pendingSounds.length} pending sounds`);

    // Flush pending sounds
    for (const pending of this.pendingSounds) {
      this.playSound(pending.key, pending.volume);
    }
    this.pendingSounds = [];
  }

  /**
   * Actually plays a sound (internal, called after audio is ready)
   */
  private playSound(key: string, finalVolume: number): void {
    try {
      const cacheExists = this.cache.audio.exists(key);
      const played = this.sound.play(key, { volume: finalVolume });
      console.log(`SFX play() called: ${key} played=${played} cache=${cacheExists} locked=${this.sound.locked} mute=${this.sound.mute} volume=${this.sound.volume.toFixed(2)} effectiveVolume=${finalVolume.toFixed(2)}`);
    } catch (e) {
      console.warn(`⚠️ Could not play SFX ${key}:`, e);
    }
  }

  /**
   * Safely attempts to play a sound effect (handles missing audio gracefully)
   * Respects gameState volume and mute settings.
   * Queues sounds if audio is not ready yet (Chrome AudioContext issue).
   */
  private tryPlaySound(key: string, volume: number = 1) {
    try {
      const gameState = getGameState();
      const cacheExists = this.cache.audio.exists(key);
      console.log(`SFX request: ${key} cache=${cacheExists} locked=${this.sound.locked} mute=${this.sound.mute} volume=${this.sound.volume.toFixed(2)} settings(muted=${gameState.isMuted} sfx=${gameState.sfxVolume.toFixed(2)}) base=${volume.toFixed(2)}`);

      // Check if muted
      if (gameState.isMuted) {
        console.log(`🎵 SFX skipped (muted): ${key}`);
        return;
      }

      // Apply gameState sfxVolume multiplier
      const finalVolume = volume * gameState.sfxVolume;

      // Skip if effective volume is 0
      if (finalVolume <= 0) {
        console.log(`🎵 SFX skipped (zero volume): ${key}`);
        return;
      }

      // If audio not ready, queue the sound
      if (!this.audioReady) {
        console.log(`🎵 SFX queued (audio not ready): ${key}`);
        this.pendingSounds.push({ key, volume: finalVolume });
        return;
      }

      // Play immediately
      this.playSound(key, finalVolume);
    } catch (e) {
      console.warn(`⚠️ Could not play SFX ${key}:`, e);
    }
  }

  update(time: number, delta: number) {
    // Check for debug toggle
    if (Phaser.Input.Keyboard.JustDown(this.keyD)) {
      this.toggleDebug();
    }

    // Check for restart key
    if (this.isGameWon && Phaser.Input.Keyboard.JustDown(this.keyR)) {
      this.restartGame();
      return;
    }

    // Don't update game logic if game over
    if (this.isGameOver) return;

    // Update moving platforms
    this.updateMovingPlatforms(time, delta);

    // Update enemies
    this.updateEnemies(time, delta);

    // Update player only if game is not won
    if (this.player && !this.isGameWon) {
      this.player.update(time, delta);

      // Apply riding behavior - add platform velocity to player when standing on moving platform
      this.applyPlatformRidingBehavior();
    }

    // Update debug graphics if enabled
    if (this.isDebugEnabled && this.debugGraphics) {
      this.debugGraphics.clear();
      this.physics.world.debugGraphic = this.debugGraphics;
    }
  }

  /**
   * Updates all enemies.
   */
  private updateEnemies(time: number, delta: number): void {
    for (const enemy of this.enemies) {
      enemy.update(time, delta);
    }
  }

  /**
   * Updates all moving platforms.
   */
  private updateMovingPlatforms(time: number, delta: number): void {
    for (const platform of this.movingPlatforms) {
      platform.update(time, delta);
    }
  }

  /**
   * Applies platform riding behavior - when player stands on a moving platform,
   * they should move along with it.
   */
  private applyPlatformRidingBehavior(): void {
    // Reset riding state each frame
    const wasRiding = this.currentRidingPlatform;
    this.currentRidingPlatform = null;

    // Check each moving platform to see if player is standing on it
    for (const platform of this.movingPlatforms) {
      if (platform.isPlayerStanding(this.player.sprite)) {
        this.currentRidingPlatform = platform;
        break;
      }
    }

    // If player is on a moving platform, add platform velocity to player position
    if (this.currentRidingPlatform) {
      const platformVelocity = this.currentRidingPlatform.getVelocity();
      const playerBody = this.player.sprite.body as Phaser.Physics.Arcade.Body;

      // For horizontal platforms, we add platform velocity to player's x position
      // This creates smooth "riding" without affecting player's own movement controls
      if (platformVelocity.x !== 0) {
        // Use a small delta-time factor to smooth the movement
        const dt = 1 / 60; // Assume 60 FPS for now
        this.player.sprite.x += platformVelocity.x * dt;
      }

      // For vertical platforms, adjust y position
      if (platformVelocity.y !== 0) {
        const dt = 1 / 60;
        this.player.sprite.y += platformVelocity.y * dt;
      }
    }
  }

  /**
   * Validates that all bones in a level are reachable by the player.
   * A bone is reachable if there's a platform (or player spawn) within jump height below it.
   *
   * Physics constants:
   * - jumpVelocity = 450 (from PLAYER.jumpVelocity, absolute value)
   * - gravity = 900 (from PHYSICS.gravity)
   * - Max jump height = v² / (2 * g) = 450² / (2 * 900) = 112.5px
   *
   * Heuristic:
   * - For each bone at (bx, by), check if any platform satisfies:
   *   1. platform.y >= by (platform is below or at bone level)
   *   2. platform.y - by <= MAX_JUMP_HEIGHT (within jump reach)
   *   3. bx is within reasonable horizontal distance of platform (MAX_HORIZONTAL_REACH)
   * - Also consider player spawn as a valid "platform" for bones near spawn
   */
  private validateBoneReachability(levelDef: LevelDefinition): void {
    const MAX_JUMP_HEIGHT = 112; // v²/2g = 450²/1800 ≈ 112px
    const MAX_HORIZONTAL_REACH = 400; // Reasonable horizontal distance to reach a bone

    const unreachableBones: Array<{ x: number; y: number; reason: string }> = [];

    // Gather all reachable surfaces (platforms + player spawn)
    const surfaces: Array<{ x: number; y: number; width: number }> = [
      // Add player spawn as a point surface
      { x: levelDef.playerSpawn.x, y: levelDef.playerSpawn.y, width: 50 },
      // Add all static platforms
      ...levelDef.platforms.map(p => ({ x: p.x, y: p.y, width: p.width })),
      // Add moving platforms (at their starting position)
      ...levelDef.movingPlatforms.map(p => ({ x: p.x, y: p.y, width: p.width })),
      // Add one-way platforms
      ...levelDef.oneWayPlatforms.map(p => ({ x: p.x, y: p.y, width: p.width })),
    ];

    // Check each bone
    for (const bone of levelDef.bones) {
      const bx = bone.x;
      const by = bone.y;

      let isReachable = false;
      let closestPlatformDistance = Infinity;
      let closestPlatformY = 0;

      for (const surface of surfaces) {
        const surfaceY = surface.y;
        const surfaceLeft = surface.x;
        const surfaceRight = surface.x + surface.width;
        const surfaceCenterX = surface.x + surface.width / 2;

        // Check if platform is below or at bone level
        if (surfaceY < by) {
          // Platform is above bone - can't jump up from it to reach this bone
          continue;
        }

        // Check vertical distance (platform.y - bone.y should be <= MAX_JUMP_HEIGHT)
        const verticalDistance = surfaceY - by;
        if (verticalDistance > MAX_JUMP_HEIGHT) {
          // Track closest for error message
          if (verticalDistance < closestPlatformDistance) {
            closestPlatformDistance = verticalDistance;
            closestPlatformY = surfaceY;
          }
          continue;
        }

        // Check horizontal reachability
        // Bone should be within MAX_HORIZONTAL_REACH of any point on the platform
        const horizontalDistanceToLeft = Math.abs(bx - surfaceLeft);
        const horizontalDistanceToRight = Math.abs(bx - surfaceRight);
        const horizontalDistanceToCenter = Math.abs(bx - surfaceCenterX);
        const minHorizontalDistance = Math.min(horizontalDistanceToLeft, horizontalDistanceToRight, horizontalDistanceToCenter);

        // If bone is horizontally within platform bounds or within reach distance
        if (bx >= surfaceLeft - MAX_HORIZONTAL_REACH && bx <= surfaceRight + MAX_HORIZONTAL_REACH) {
          isReachable = true;
          break;
        }
      }

      if (!isReachable) {
        const reason = closestPlatformDistance < Infinity
          ? `Nearest platform at y=${closestPlatformY} is ${closestPlatformDistance.toFixed(0)}px below (max jump: ${MAX_JUMP_HEIGHT}px)`
          : 'No platform found below bone';
        unreachableBones.push({ x: bx, y: by, reason });
      }
    }

    // Log results
    if (unreachableBones.length > 0) {
      console.warn(`⚠️ Level ${levelDef.levelIndex} (${levelDef.levelName}): ${unreachableBones.length} UNREACHABLE bone(s) detected!`);
      unreachableBones.forEach(bone => {
        console.warn(`  ⚠️ Bone at (${bone.x}, ${bone.y}): ${bone.reason}`);
      });
    } else {
      console.log(`✅ Level ${levelDef.levelIndex} (${levelDef.levelName}): All ${levelDef.bones.length} bones are reachable`);
    }
  }
}
