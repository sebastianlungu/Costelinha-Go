import Phaser from 'phaser';
import { WORLD, PLATFORMS, DEPTHS, PLAYER, COLLECTIBLES, CAMERA } from '../config/gameConfig';
import { Player } from '../objects/Player';
import { Collectible } from '../objects/Collectible';
import { Score } from '../systems/Score';

export class GameScene extends Phaser.Scene {
  private platformGroup!: Phaser.Physics.Arcade.StaticGroup;
  private player!: Player;
  private boneGroup!: Phaser.Physics.Arcade.Group;
  private collectibles: Collectible[] = [];
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

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    console.log('🎮 GameScene created');

    // Reset win state
    this.isGameWon = false;

    // Debug: Log audio state when entering GameScene
    console.log(`🎵 GameScene audio state - locked: ${this.sound.locked}, mute: ${this.sound.mute}, volume: ${this.sound.volume}`);

    // Start game background music (with proper unlock handling)
    this.startGameMusic();

    // Create score system
    this.scoreSystem = new Score();

    // Launch HudScene in parallel with the score system
    this.scene.launch('HudScene', { scoreSystem: this.scoreSystem });

    // Set world bounds
    this.physics.world.setBounds(0, 0, WORLD.width, WORLD.height);

    // Create parallax background layers
    this.createParallaxBackground();

    // Create static physics group for platforms
    this.platformGroup = this.physics.add.staticGroup();

    // Create all platforms from gameConfig.PLATFORMS array using tiles
    PLATFORMS.forEach((platformConfig, index) => {
      this.createTiledPlatform(platformConfig);
    });

    // Refresh the static group to ensure physics bodies are updated
    this.platformGroup.refresh();

    // Camera setup - fixed view initially (no follow yet)
    this.cameras.main.setBounds(0, 0, WORLD.width, WORLD.height);

    // Create particle emitters for juice effects
    this.createParticleEmitters();

    // Create player (EXACTLY once per GameScene instance)
    this.player = new Player(this, PLAYER.spawnX, PLAYER.spawnY, this.dustEmitter);

    // RUNTIME ASSERTION: Verify only ONE player sprite exists in this scene
    // This catches bugs where player might be created multiple times
    const playerSprites = this.children.list.filter(
      child => child instanceof Phaser.Physics.Arcade.Sprite && child.texture.key.startsWith('dog_')
    );
    if (playerSprites.length !== 1) {
      throw new Error(`❌ CRITICAL BUG: Expected exactly 1 player sprite, found ${playerSprites.length}. Check for duplicate player creation.`);
    }
    console.log(`🐕 Player instance verified (count: ${playerSprites.length})`);

    // Add collision between player and platforms
    // Ground detection is handled in Player.update() using sticky velocity-based logic
    this.physics.add.collider(this.player.sprite, this.platformGroup);

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

    // Spawn collectibles at positions from gameConfig
    COLLECTIBLES.positions.forEach((pos, index) => {
      const collectible = new Collectible(this, pos.x, pos.y);
      this.collectibles.push(collectible);
      this.boneGroup.add(collectible.sprite);
    });

    console.log(`🍖 ${COLLECTIBLES.count} bones spawned`);

    // Add overlap detection between player and bones
    this.physics.add.overlap(
      this.player.sprite,
      this.boneGroup,
      this.handleBoneCollect,
      undefined,
      this
    );

    // Setup R key for restart
    this.keyR = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    // Setup D key for debug toggle
    this.keyD = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);

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
    this.scoreSystem.addScore(1);

    console.log(`🍖 Collected bone at (${bone.x}, ${bone.y}), score: ${this.scoreSystem.score}/${COLLECTIBLES.count}`);
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
    if (score >= COLLECTIBLES.count && !this.isGameWon) {
      this.isGameWon = true;
      this.showWinOverlay();
      console.log('✅ You Win!');
    }
  }

  private showWinOverlay() {
    // Stop game music
    if (this.gameMusic) {
      this.gameMusic.stop();
      console.log('🎵 Game music stopped');
    }

    // Play win sound (safely)
    this.tryPlaySound('win_sfx', 0.8);

    // Create container for win overlay
    this.winOverlay = this.add.container(0, 0);

    // Semi-transparent black background covering entire screen
    const overlay = this.add.rectangle(
      WORLD.width / 2,
      WORLD.height / 2,
      WORLD.width,
      WORLD.height,
      0x000000,
      0.7
    );

    // "You Win!" text (large, center)
    const winText = this.add.text(WORLD.width / 2, WORLD.height / 2 - 40, 'You Win!', {
      fontSize: '64px',
      color: '#ffffff',
      fontFamily: 'Arial',
      stroke: '#000000',
      strokeThickness: 6,
    });
    winText.setOrigin(0.5, 0.5);

    // "Press R to Restart" instruction (below win text)
    const restartText = this.add.text(WORLD.width / 2, WORLD.height / 2 + 40, 'Press R to Restart', {
      fontSize: '32px',
      color: '#ffffff',
      fontFamily: 'Arial',
      stroke: '#000000',
      strokeThickness: 4,
    });
    restartText.setOrigin(0.5, 0.5);

    // Add all elements to container
    this.winOverlay.add([overlay, winText, restartText]);

    // Set depth to appear above everything
    this.winOverlay.setDepth(1000);
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
      this.physics.world.createDebugGraphic(this.debugGraphics);
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
   */
  private startGameMusic() {
    try {
      this.gameMusic = this.sound.add('game_music', {
        loop: true,
        volume: 0.35,
      });
      console.log('🎵 Game music object created');

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
   * Safely attempts to play a sound effect (handles missing audio gracefully)
   */
  private tryPlaySound(key: string, volume: number = 1) {
    try {
      this.sound.play(key, { volume });
      console.log(`🎵 SFX played: ${key} at volume ${volume}`);
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

    // Update player only if game is not won
    if (this.player && !this.isGameWon) {
      this.player.update(time, delta);
    }

    // Update debug graphics if enabled
    if (this.isDebugEnabled && this.debugGraphics) {
      this.debugGraphics.clear();
      this.physics.world.debugGraphic = this.debugGraphics;
    }
  }
}
