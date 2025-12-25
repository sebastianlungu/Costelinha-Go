import Phaser from 'phaser';
import { WORLD, PLATFORMS, DEPTHS, PLAYER, COLLECTIBLES } from '../config/gameConfig';
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

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    console.log('🎮 GameScene created');

    // Reset win state
    this.isGameWon = false;

    // Create score system
    this.scoreSystem = new Score();

    // Launch HudScene in parallel with the score system
    this.scene.launch('HudScene', { scoreSystem: this.scoreSystem });

    // Set world bounds
    this.physics.world.setBounds(0, 0, WORLD.width, WORLD.height);

    // Create static physics group for platforms
    this.platformGroup = this.physics.add.staticGroup();

    // Create all platforms from gameConfig.PLATFORMS array
    PLATFORMS.forEach((platformConfig, index) => {
      // Create platform sprite using the procedural 'platform' texture
      const platform = this.add.sprite(
        platformConfig.x,
        platformConfig.y,
        'platform'
      );

      // Set the origin to top-left for easier positioning
      platform.setOrigin(0, 0);

      // Scale the platform to match the configured dimensions
      // The procedural texture is 100x20, so we scale it to desired width/height
      platform.setDisplaySize(platformConfig.width, platformConfig.height);

      // Set depth for proper layering
      platform.setDepth(DEPTHS.platforms);

      // Add to static physics group
      this.platformGroup.add(platform, true);

      // Log platform creation for debugging
      if (index === 0) {
        console.log(`🎮 Ground platform created at (${platformConfig.x}, ${platformConfig.y}) size: ${platformConfig.width}x${platformConfig.height}`);
      } else {
        console.log(`🎮 Floating platform ${index} created at (${platformConfig.x}, ${platformConfig.y}) size: ${platformConfig.width}x${platformConfig.height}`);
      }
    });

    // Refresh the static group to ensure physics bodies are updated
    this.platformGroup.refresh();

    // Camera setup - fixed view initially (no follow yet)
    this.cameras.main.setBounds(0, 0, WORLD.width, WORLD.height);

    console.log('🎮 Platforms created, camera bounds set, world ready');

    // Create player
    this.player = new Player(this, PLAYER.spawnX, PLAYER.spawnY);

    // Add collision between player and platforms
    this.physics.add.collider(this.player.sprite, this.platformGroup);

    console.log('🎮 Player created and collisions set up');

    // Create bone group
    this.boneGroup = this.physics.add.group();

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

    console.log('🎮 Bone overlap detection set up');

    // Setup R key for restart
    this.keyR = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    // Listen to score changes to check for win condition
    this.scoreSystem.on('score-changed', this.checkWinCondition, this);
  }

  private handleBoneCollect(
    playerSprite: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    boneSprite: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
  ) {
    const bone = boneSprite as Phaser.Physics.Arcade.Sprite;

    // CRITICAL: Disable body FIRST to prevent re-triggering overlap
    bone.disableBody(true, true);

    // Then increment score using Score system
    this.scoreSystem.addScore(1);

    console.log(`🍖 Collected bone, score: ${this.scoreSystem.score}/${COLLECTIBLES.count}`);
  }

  private checkWinCondition(score: number) {
    if (score >= COLLECTIBLES.count && !this.isGameWon) {
      this.isGameWon = true;
      this.showWinOverlay();
      console.log('✅ You Win!');
    }
  }

  private showWinOverlay() {
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

    // Stop HudScene
    this.scene.stop('HudScene');

    // Restart GameScene (this will call create() again)
    this.scene.restart();
  }

  update(time: number, delta: number) {
    // Check for restart key
    if (this.isGameWon && Phaser.Input.Keyboard.JustDown(this.keyR)) {
      this.restartGame();
      return;
    }

    // Update player only if game is not won
    if (this.player && !this.isGameWon) {
      this.player.update(time, delta);
    }
  }
}
