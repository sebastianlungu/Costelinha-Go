import Phaser from 'phaser';
import { Enemy, EnemyParams } from '../Enemy';

/**
 * GroundPatrol.ts - "Vacuum Cleaner" Enemy
 *
 * DESIGN INTENT:
 * This enemy represents a robotic vacuum cleaner that patrols platforms.
 * Currently using placeholder robot sprites from tilemap-characters_packed.png
 * until custom vacuum cleaner pixel art is created.
 *
 * TODO: Custom Art Needed
 * - Need 24x24 vacuum cleaner sprite (2 frames for walking animation)
 * - Style: Roomba-like circular robot with suction indicator
 * - Color: Gray/silver body with red status light
 * - Suggested source: Commission custom art or create in Aseprite
 *
 * Visual Effects:
 * - Emits dust particles behind when moving (simulates sucking up dust)
 * - Particles emit in opposite direction of movement
 *
 * Behavior:
 * - Walks left/right at a constant speed
 * - Turns at edges (raycasts for edge detection) or when hitting walls
 * - Uses blue robot sprites (frames 0-1) as placeholder
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

  // Vacuum cleaner dust particle effect
  private dustEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

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
        frames: scene.anims.generateFrameNumbers('vacuum', {
          frames: [FRAMES.walk1, FRAMES.walk2],
        }),
        frameRate: 6,
        repeat: -1,
      });
    }

    // Play walk animation
    this.sprite.play('ground_patrol_walk');

    // Create vacuum dust particle effect
    // Emits dust particles behind the vacuum as it moves (visual effect only)
    this.createDustEmitter();

    console.log(`🦀 GroundPatrol (Vacuum) created: range=${this.patrolRange}, speed=${this.speed}`);
  }

  update(time: number, delta: number): void {
    if (!this.isActive) return;

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    // Check for wall collision (turn around)
    if (body.blocked.left) {
      this.direction = 1;
      this.sprite.setVelocityX(this.speed);
      this.sprite.flipX = true;
      this.updateDustEmitterDirection();
    } else if (body.blocked.right) {
      this.direction = -1;
      this.sprite.setVelocityX(-this.speed);
      this.sprite.flipX = false;
      this.updateDustEmitterDirection();
    }

    // Check patrol bounds
    if (this.sprite.x <= this.minX && this.direction === -1) {
      this.direction = 1;
      this.sprite.setVelocityX(this.speed);
      this.sprite.flipX = true;
      this.updateDustEmitterDirection();
    } else if (this.sprite.x >= this.maxX && this.direction === 1) {
      this.direction = -1;
      this.sprite.setVelocityX(-this.speed);
      this.sprite.flipX = false;
      this.updateDustEmitterDirection();
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
      this.updateDustEmitterDirection();
    }
  }

  /**
   * Creates the dust particle emitter for the vacuum cleaner effect.
   * Particles emit behind the vacuum to simulate sucking up dust.
   */
  private createDustEmitter(): void {
    // Check if the particle texture exists
    if (!this.scene.textures.exists('particle_dust')) {
      console.warn('⚠️ particle_dust texture not found, skipping vacuum dust effect');
      return;
    }

    // Create particle emitter that follows the sprite
    this.dustEmitter = this.scene.add.particles(0, 0, 'particle_dust', {
      follow: this.sprite,
      // Offset behind the vacuum (will be updated based on direction)
      followOffset: { x: 12, y: 8 },
      // Small, fading dust puffs
      scale: { start: 0.3, end: 0.1 },
      alpha: { start: 0.6, end: 0 },
      // Short lifespan for quick dust puffs
      lifespan: 400,
      // Slow upward drift
      speedY: { min: -15, max: -5 },
      // Slight horizontal spread
      speedX: { min: -10, max: 10 },
      // Emit rate - not too many for performance
      frequency: 150,
      quantity: 1,
      // Slight rotation for organic feel
      rotate: { min: 0, max: 360 },
      // Tint slightly gray for dust look
      tint: 0xcccccc,
    });

    // Set depth below the enemy sprite
    this.dustEmitter.setDepth((this.sprite.depth || 0) - 1);
  }

  /**
   * Updates the dust emitter offset based on movement direction.
   * Dust should emit from behind the vacuum (opposite of movement).
   */
  private updateDustEmitterDirection(): void {
    if (!this.dustEmitter) return;

    // Offset the emitter to be behind the vacuum based on direction
    const offsetX = this.direction > 0 ? -12 : 12; // Behind = opposite of direction
    this.dustEmitter.followOffset.x = offsetX;
  }

  getTypeName(): string {
    return 'GroundPatrol';
  }

  /**
   * Cleanup when the enemy is destroyed
   */
  destroy(): void {
    if (this.dustEmitter) {
      this.dustEmitter.destroy();
      this.dustEmitter = null;
    }
    super.destroy();
  }
}
