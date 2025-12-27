import Phaser from 'phaser';
import { DEPTHS } from '../config/gameConfig';

/**
 * Enemy.ts - Abstract base class for all enemy types
 *
 * Provides common functionality:
 * - Sprite creation with physics
 * - Animation setup
 * - Cleanup on destroy
 */

// Enemy spawn parameters interface
// Supports both gameConfig naming (patrolRange) and LevelDefinition naming (patrolDistance)
export interface EnemyParams {
  // GroundPatrol
  patrolRange?: number;
  patrolDistance?: number; // Alias for patrolRange (used in LevelDefinitions)
  speed?: number;

  // Hopper
  jumpHeight?: number;
  hopHeight?: number; // Alias for jumpHeight (used in LevelDefinitions)
  jumpInterval?: number;

  // Flyer
  amplitude?: number;
  frequency?: number;
  direction?: number; // 1 = right, -1 = left
}

// Enemy definition for level spawning
export interface EnemyDefinition {
  type: 'groundPatrol' | 'hopper' | 'flyer';
  x: number;
  y: number;
  params?: EnemyParams;
}

export abstract class Enemy extends Phaser.Events.EventEmitter {
  public sprite: Phaser.Physics.Arcade.Sprite;
  protected scene: Phaser.Scene;
  protected isActive: boolean = true;
  protected startX: number;
  protected startY: number;

  /**
   * Create an enemy
   * @param scene The Phaser scene
   * @param x Spawn X position
   * @param y Spawn Y position
   * @param frame Initial frame from the enemies spritesheet
   */
  constructor(scene: Phaser.Scene, x: number, y: number, frame: number) {
    super();

    this.scene = scene;
    this.startX = x;
    this.startY = y;

    // Create sprite with physics using the vacuum spritesheet (generated in BootScene)
    this.sprite = scene.physics.add.sprite(x, y, 'vacuum', frame);

    // Scale up the 24x24 sprites for visibility
    this.sprite.setScale(2);

    // Set depth for proper layering (between platforms and player)
    this.sprite.setDepth(DEPTHS.collectibles + 1);

    // Enable collision with world bounds
    this.sprite.setCollideWorldBounds(true);

    // Set bounce for more interesting physics
    this.sprite.setBounce(0.1);

    console.log(`🦀 Enemy spawned at (${x}, ${y}) with frame ${frame}`);
  }

  /**
   * Update the enemy each frame
   * Must be implemented by subclasses
   */
  abstract update(time: number, delta: number): void;

  /**
   * Get the enemy type name for debugging
   */
  abstract getTypeName(): string;

  /**
   * Disable the enemy (e.g., when killed)
   */
  disable(): void {
    this.isActive = false;
    this.sprite.setActive(false);
    this.sprite.setVisible(false);
    this.sprite.body.enable = false;
  }

  /**
   * Enable the enemy
   */
  enable(): void {
    this.isActive = true;
    this.sprite.setActive(true);
    this.sprite.setVisible(true);
    this.sprite.body.enable = true;
  }

  /**
   * Reset enemy to starting position
   */
  reset(): void {
    this.sprite.setPosition(this.startX, this.startY);
    this.sprite.setVelocity(0, 0);
    this.enable();
  }

  /**
   * Clean up the enemy
   */
  destroy(): void {
    this.removeAllListeners();
    if (this.sprite) {
      this.sprite.destroy();
    }
    console.log(`🦀 ${this.getTypeName()} destroyed`);
  }
}
