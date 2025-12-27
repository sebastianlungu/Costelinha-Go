import Phaser from 'phaser';
import { Enemy, EnemyParams } from '../Enemy';

/**
 * Flyer.ts - Enemy that floats and moves in a sine wave pattern
 *
 * Behavior:
 * - Moves horizontally in a direction
 * - Bobs up and down in a sine wave
 * - Floats above ground (ignores gravity)
 * - Uses green alien sprites (frames 9-10)
 */

// Default parameters
const DEFAULTS = {
  amplitude: 40, // Vertical oscillation range
  frequency: 0.003, // Oscillation speed (radians per ms)
  direction: 1, // 1 = right, -1 = left
  speed: 60, // Horizontal movement speed
};

// Animation frames (from tilemap-characters_packed.png)
// Row 1: Green aliens (frames 9-17)
const FRAMES = {
  fly1: 9,
  fly2: 10,
};

export class Flyer extends Enemy {
  private amplitude: number;
  private frequency: number;
  private direction: number;
  private speed: number;
  private baseY: number;
  private elapsedTime: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, params?: EnemyParams) {
    // Use first green alien frame
    super(scene, x, y, FRAMES.fly1);

    // Apply parameters with defaults
    this.amplitude = params?.amplitude ?? DEFAULTS.amplitude;
    this.frequency = params?.frequency ?? DEFAULTS.frequency;
    this.direction = params?.direction ?? DEFAULTS.direction;
    this.speed = params?.speed ?? DEFAULTS.speed;

    // Store base Y position for sine wave calculation
    this.baseY = y;

    // Configure physics body
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(20, 20);
    body.setOffset(2, 4);

    // Disable gravity for flyer (it floats!)
    body.setAllowGravity(false);

    // Set initial horizontal velocity
    this.sprite.setVelocityX(this.speed * this.direction);

    // Flip sprite based on direction
    this.sprite.flipX = this.direction > 0;

    // Create fly animation if it doesn't exist
    if (!scene.anims.exists('flyer_fly')) {
      scene.anims.create({
        key: 'flyer_fly',
        frames: scene.anims.generateFrameNumbers('enemies', {
          frames: [FRAMES.fly1, FRAMES.fly2],
        }),
        frameRate: 8,
        repeat: -1,
      });
    }

    // Play fly animation
    this.sprite.play('flyer_fly');

    // Randomize initial elapsed time for varied wave patterns
    this.elapsedTime = Math.random() * Math.PI * 2 / this.frequency;

    console.log(`🦀 Flyer created: amplitude=${this.amplitude}, frequency=${this.frequency}, direction=${this.direction}`);
  }

  update(time: number, delta: number): void {
    if (!this.isActive) return;

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    // Update elapsed time
    this.elapsedTime += delta;

    // Calculate sine wave Y offset
    const yOffset = Math.sin(this.elapsedTime * this.frequency) * this.amplitude;

    // Apply vertical position (sine wave around base Y)
    this.sprite.y = this.baseY + yOffset;

    // Check for wall collision (turn around)
    if (body.blocked.left) {
      this.direction = 1;
      this.sprite.setVelocityX(this.speed);
      this.sprite.flipX = true;
    } else if (body.blocked.right) {
      this.direction = -1;
      this.sprite.setVelocityX(-this.speed);
      this.sprite.flipX = false;
    }

    // Keep horizontal velocity constant
    this.sprite.setVelocityX(this.speed * this.direction);

    // Add subtle rotation based on vertical velocity for visual interest
    const yVelocity = Math.cos(this.elapsedTime * this.frequency) * this.amplitude * this.frequency;
    this.sprite.setRotation(yVelocity * 0.02 * this.direction);
  }

  /**
   * Override reset to also reset the base Y position
   */
  reset(): void {
    super.reset();
    this.baseY = this.startY;
    this.elapsedTime = 0;
    this.sprite.setRotation(0);
  }

  getTypeName(): string {
    return 'Flyer';
  }
}
