import Phaser from 'phaser';
import { DEPTHS } from '../config/gameConfig';

/**
 * Heart collectible that restores player HP when collected.
 * Uses heart sprite from tilemap_packed.png (frame 4 = full heart at column 4, row 0).
 * Features floating animation, pulse effect, and particle burst on collection.
 */
export class Heart extends Phaser.Events.EventEmitter {
  public sprite: Phaser.Physics.Arcade.Sprite;
  private scene: Phaser.Scene;
  private collected: boolean = false;
  private floatTween?: Phaser.Tweens.Tween;
  private pulseTween?: Phaser.Tweens.Tween;

  // Tilemap frame indices (18x18 tiles, 20 columns per row)
  // Hearts at row 0: full (col 4), half (col 5), empty (col 6)
  private static readonly HEART_FRAME_FULL = 4;
  private static readonly SCALE = 2; // Scale up from 18x18

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super();
    this.scene = scene;

    if (!scene.textures.exists('tilemap_packed')) {
      throw new Error('Missing heart texture "tilemap_packed". Check BootScene.preload() and asset paths.');
    }
    const texture = scene.textures.get('tilemap_packed');
    if (!texture.has(Heart.HEART_FRAME_FULL)) {
      throw new Error(`Missing heart frame ${Heart.HEART_FRAME_FULL} in "tilemap_packed".`);
    }

    // Create sprite using heart frame from tilemap
    // tilemap_packed is 20 columns, heart full is at (4, 0) = frame 4
    this.sprite = scene.physics.add.sprite(x, y, 'tilemap_packed', Heart.HEART_FRAME_FULL);
    this.sprite.setScale(Heart.SCALE);
    this.sprite.setDepth(DEPTHS.collectibles);

    // No gravity for floating hearts
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);

    // Adjust hitbox size to match scaled sprite
    const scaledSize = 18 * Heart.SCALE;
    body.setSize(scaledSize * 0.8, scaledSize * 0.8); // Slightly smaller hitbox for better feel

    // Store original Y for floating animation reference
    const originalY = y;

    // Floating animation - gentle bob up and down
    this.floatTween = scene.tweens.add({
      targets: this.sprite,
      y: originalY - 8,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Subtle pulse effect - slight scale oscillation
    this.pulseTween = scene.tweens.add({
      targets: this.sprite,
      scale: { from: Heart.SCALE, to: Heart.SCALE * 1.1 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    console.log(`Heart spawned at (${x}, ${y})`);
  }

  /**
   * Attempts to collect the heart.
   * @returns true if successfully collected, false if already collected
   */
  collect(): boolean {
    if (this.collected) return false;
    this.collected = true;

    // Stop animation tweens
    if (this.floatTween) {
      this.floatTween.stop();
    }
    if (this.pulseTween) {
      this.pulseTween.stop();
    }

    // Play collection animation
    this.playCollectAnimation();

    // Emit event for external listeners
    this.emit('collected');

    return true;
  }

  /**
   * Returns whether this heart has been collected
   */
  isCollected(): boolean {
    return this.collected;
  }

  /**
   * Plays the collection animation - scale up, float up, and fade out
   */
  private playCollectAnimation(): void {
    // Scale up and fade out while floating upward
    this.scene.tweens.add({
      targets: this.sprite,
      scale: Heart.SCALE * 1.5,
      alpha: 0,
      y: this.sprite.y - 30,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.sprite.destroy();
      }
    });

    // Spawn particle burst effect
    this.spawnParticles();
  }

  /**
   * Creates a particle burst effect at the heart's position
   */
  private spawnParticles(): void {
    // Check if particle_star texture exists (it should from BootScene)
    if (!this.scene.textures.exists('particle_star')) {
      console.warn('particle_star texture not found for heart collection effect');
      return;
    }

    // Create particle emitter for burst effect
    const emitter = this.scene.add.particles(
      this.sprite.x,
      this.sprite.y,
      'particle_star',
      {
        speed: { min: 50, max: 100 },
        scale: { start: 0.4, end: 0 },
        lifespan: 500,
        quantity: 8,
        angle: { min: 0, max: 360 },
        tint: 0xff6b6b, // Red/pink tint for hearts
        alpha: { start: 1, end: 0 },
        emitting: false
      }
    );
    emitter.setDepth(DEPTHS.particles);
    emitter.explode();

    // Cleanup emitter after animation completes
    this.scene.time.delayedCall(600, () => {
      emitter.destroy();
    });
  }

  /**
   * Destroys the heart and cleans up resources
   */
  destroy(): void {
    if (this.floatTween) {
      this.floatTween.stop();
    }
    if (this.pulseTween) {
      this.pulseTween.stop();
    }
    if (this.sprite && !this.sprite.scene) {
      // Sprite already destroyed by scene cleanup
      return;
    }
    if (this.sprite) {
      this.sprite.destroy();
    }
    this.removeAllListeners();
  }
}
