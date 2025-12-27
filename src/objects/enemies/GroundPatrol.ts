import Phaser from 'phaser';
import { Enemy, EnemyParams } from '../Enemy';

/**
 * GroundPatrol.ts - Enemy that walks back and forth on platforms
 *
 * Behavior:
 * - Walks left/right at a constant speed
 * - Turns at edges (raycasts for edge detection) or when hitting walls
 * - Uses blue robot sprites (frames 0-1)
 */

// Default parameters
const DEFAULTS = {
  patrolRange: 200,
  speed: 80,
};

// Animation frames (from tilemap-characters_packed.png)
// Row 0: Blue robots (frames 0-8)
const FRAMES = {
  walk1: 0,
  walk2: 1,
};

export class GroundPatrol extends Enemy {
  private patrolRange: number;
  private speed: number;
  private direction: number = 1; // 1 = right, -1 = left
  private minX: number;
  private maxX: number;
  private edgeCheckTimer: number = 0;
  private edgeCheckInterval: number = 100; // Check edges every 100ms

  constructor(scene: Phaser.Scene, x: number, y: number, params?: EnemyParams) {
    // Use first blue robot frame
    super(scene, x, y, FRAMES.walk1);

    // Apply parameters with defaults (support both patrolRange and patrolDistance)
    this.patrolRange = params?.patrolRange ?? params?.patrolDistance ?? DEFAULTS.patrolRange;
    this.speed = params?.speed ?? DEFAULTS.speed;

    // Calculate patrol bounds
    this.minX = x - this.patrolRange / 2;
    this.maxX = x + this.patrolRange / 2;

    // Configure physics body
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(20, 20); // Slightly smaller than sprite for better feel
    body.setOffset(2, 4); // Center the hitbox

    // Start moving
    this.sprite.setVelocityX(this.speed * this.direction);

    // Create walk animation if it doesn't exist
    if (!scene.anims.exists('ground_patrol_walk')) {
      scene.anims.create({
        key: 'ground_patrol_walk',
        frames: scene.anims.generateFrameNumbers('enemies', {
          frames: [FRAMES.walk1, FRAMES.walk2],
        }),
        frameRate: 6,
        repeat: -1,
      });
    }

    // Play walk animation
    this.sprite.play('ground_patrol_walk');

    console.log(`🦀 GroundPatrol created: range=${this.patrolRange}, speed=${this.speed}`);
  }

  update(time: number, delta: number): void {
    if (!this.isActive) return;

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

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

    // Check patrol bounds
    if (this.sprite.x <= this.minX && this.direction === -1) {
      this.direction = 1;
      this.sprite.setVelocityX(this.speed);
      this.sprite.flipX = true;
    } else if (this.sprite.x >= this.maxX && this.direction === 1) {
      this.direction = -1;
      this.sprite.setVelocityX(-this.speed);
      this.sprite.flipX = false;
    }

    // Edge detection (check if about to walk off platform)
    this.edgeCheckTimer += delta;
    if (this.edgeCheckTimer >= this.edgeCheckInterval && body.blocked.down) {
      this.edgeCheckTimer = 0;
      this.checkForEdge();
    }
  }

  /**
   * Check if there's a platform edge ahead and turn if needed
   */
  private checkForEdge(): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    // If not on ground, don't check
    if (!body.blocked.down) return;

    // Calculate check position (slightly ahead in movement direction)
    const checkDistance = 24 * this.sprite.scaleX; // One tile ahead
    const checkX = this.sprite.x + checkDistance * this.direction;
    const checkY = this.sprite.y + (24 * this.sprite.scaleY) + 5; // Below feet

    // Use a simple ray cast to check for ground
    // Get all physics bodies in the area below the check point
    const platformGroup = this.scene.physics.world.staticBodies;

    let hasGround = false;
    platformGroup.entries.forEach((body) => {
      // Check if there's a platform beneath the check point using body bounds
      if (
        checkX >= body.left &&
        checkX <= body.right &&
        checkY >= body.top &&
        checkY <= body.bottom + 20
      ) {
        hasGround = true;
      }
    });

    // If no ground ahead, turn around
    if (!hasGround) {
      this.direction *= -1;
      this.sprite.setVelocityX(this.speed * this.direction);
      this.sprite.flipX = this.direction > 0;
    }
  }

  getTypeName(): string {
    return 'GroundPatrol';
  }
}
