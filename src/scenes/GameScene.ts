import Phaser from 'phaser';
import { WORLD, PLATFORMS, DEPTHS, PLAYER } from '../config/gameConfig';
import { Player } from '../objects/Player';

export class GameScene extends Phaser.Scene {
  private platformGroup!: Phaser.Physics.Arcade.StaticGroup;
  private player!: Player;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    console.log('🎮 GameScene created');

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
  }

  update(time: number, delta: number) {
    // Update player
    if (this.player) {
      this.player.update(time, delta);
    }
  }
}
