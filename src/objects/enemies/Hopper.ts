import Phaser from 'phaser';
import { Enemy, EnemyParams } from '../Enemy';

/**
 * Hopper.ts - Enemy that waits, then jumps, repeating in place
 *
 * Behavior:
 * - Stays stationary for a period
 * - Jumps up with a set height
 * - Lands and repeats
 * - Uses pink creature sprites (frames 18-19)
 */

// Default parameters
const DEFAULTS = {
  jumpHeight: 350, // Jump velocity (negative = up)
  jumpInterval: 2000, // Time between jumps in ms
};

// Animation frames (from tilemap-characters_packed.png)
// Row 2: Pink creatures (frames 18-26)
const FRAMES = {
  idle: 18,
  jump: 19,
};

// Hopper states
enum HopperState {
  IDLE = 'idle',
  JUMPING = 'jumping',
  FALLING = 'falling',
}

export class Hopper extends Enemy {
  private jumpHeight: number;
  private jumpInterval: number;
  private state: HopperState = HopperState.IDLE;
  private jumpTimer: number = 0;
  private anticipateTime: number = 200; // Anticipation time before jump
  private isAnticipating: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, params?: EnemyParams) {
    // Use idle pink creature frame
    super(scene, x, y, FRAMES.idle);

    // Apply parameters with defaults (support both jumpHeight and hopHeight)
    this.jumpHeight = params?.jumpHeight ?? params?.hopHeight ?? DEFAULTS.jumpHeight;
    this.jumpInterval = params?.jumpInterval ?? DEFAULTS.jumpInterval;

    // Configure physics body
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(20, 20);
    body.setOffset(2, 4);

    // Enable gravity for this enemy
    body.setAllowGravity(true);

    // Create animations if they don't exist
    if (!scene.anims.exists('hopper_idle')) {
      scene.anims.create({
        key: 'hopper_idle',
        frames: scene.anims.generateFrameNumbers('enemies', {
          frames: [FRAMES.idle],
        }),
        frameRate: 1,
        repeat: -1,
      });
    }

    if (!scene.anims.exists('hopper_jump')) {
      scene.anims.create({
        key: 'hopper_jump',
        frames: scene.anims.generateFrameNumbers('enemies', {
          frames: [FRAMES.jump],
        }),
        frameRate: 1,
        repeat: 0,
      });
    }

    // Start with idle animation
    this.sprite.play('hopper_idle');

    // Randomize initial jump timer to desync multiple hoppers
    this.jumpTimer = Math.random() * this.jumpInterval;

    console.log(`🦀 Hopper created: jumpHeight=${this.jumpHeight}, interval=${this.jumpInterval}ms`);
  }

  update(time: number, delta: number): void {
    if (!this.isActive) return;

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    // Update jump timer
    this.jumpTimer += delta;

    switch (this.state) {
      case HopperState.IDLE:
        // Check if it's time to anticipate jump
        if (this.jumpTimer >= this.jumpInterval - this.anticipateTime && !this.isAnticipating) {
          this.isAnticipating = true;
          // Squish effect for anticipation
          this.scene.tweens.add({
            targets: this.sprite,
            scaleY: this.sprite.scaleY * 0.7,
            scaleX: this.sprite.scaleX * 1.2,
            duration: this.anticipateTime,
            ease: 'Quad.easeIn',
          });
        }

        // Check if it's time to jump
        if (this.jumpTimer >= this.jumpInterval && body.blocked.down) {
          this.jump();
        }
        break;

      case HopperState.JUMPING:
        // Check if starting to fall
        if (body.velocity.y > 0) {
          this.state = HopperState.FALLING;
        }
        break;

      case HopperState.FALLING:
        // Check if landed
        if (body.blocked.down) {
          this.land();
        }
        break;
    }
  }

  /**
   * Perform the jump
   */
  private jump(): void {
    this.state = HopperState.JUMPING;
    this.isAnticipating = false;
    this.jumpTimer = 0;

    // Reset scale and apply jump stretch
    this.sprite.setScale(2);
    this.scene.tweens.add({
      targets: this.sprite,
      scaleY: this.sprite.scaleY * 1.3,
      scaleX: this.sprite.scaleX * 0.8,
      duration: 100,
      yoyo: true,
      ease: 'Quad.easeOut',
    });

    // Apply jump velocity
    this.sprite.setVelocityY(-this.jumpHeight);

    // Play jump animation
    this.sprite.play('hopper_jump');

    // Emit dust particles if available
    this.emit('jumped', this.sprite.x, this.sprite.y + 20);
  }

  /**
   * Land after jumping
   */
  private land(): void {
    this.state = HopperState.IDLE;

    // Squash effect on landing
    this.scene.tweens.add({
      targets: this.sprite,
      scaleY: this.sprite.scaleY * 0.7,
      scaleX: this.sprite.scaleX * 1.3,
      duration: 80,
      yoyo: true,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.sprite.setScale(2);
      },
    });

    // Return to idle animation
    this.sprite.play('hopper_idle');

    // Emit dust particles if available
    this.emit('landed', this.sprite.x, this.sprite.y + 20);
  }

  getTypeName(): string {
    return 'Hopper';
  }
}
