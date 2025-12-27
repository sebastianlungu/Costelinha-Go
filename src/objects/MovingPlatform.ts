import Phaser from 'phaser';
import { DEPTHS } from '../config/gameConfig';

/**
 * MovingPlatform - A platform that moves back and forth along an axis.
 *
 * The player can stand on this platform and will be carried along with its movement.
 * Uses Phaser Arcade Physics with velocity-based movement for smooth motion.
 */
export class MovingPlatform {
  public body: Phaser.Physics.Arcade.Image;
  private scene: Phaser.Scene;
  private startX: number;
  private startY: number;
  private axis: 'x' | 'y';
  private range: number;
  private speed: number;
  private direction: 1 | -1 = 1;

  // Tile size for platform visuals (Kenney assets use 21x21)
  private static readonly TILE_SIZE = 21;

  /**
   * Creates a new MovingPlatform.
   *
   * @param scene - The Phaser scene
   * @param x - Starting X position (left edge)
   * @param y - Starting Y position (top edge)
   * @param width - Platform width in pixels
   * @param axis - Movement axis ('x' for horizontal, 'y' for vertical)
   * @param range - Total distance to travel in pixels
   * @param speed - Movement speed in pixels per second
   */
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    axis: 'x' | 'y',
    range: number,
    speed: number
  ) {
    this.scene = scene;
    this.startX = x;
    this.startY = y;
    this.axis = axis;
    this.range = range;
    this.speed = speed;

    // Calculate tile dimensions
    const tilesWide = Math.max(1, Math.ceil(width / MovingPlatform.TILE_SIZE));
    const platformWidth = tilesWide * MovingPlatform.TILE_SIZE;
    const platformHeight = MovingPlatform.TILE_SIZE;

    // Create a render texture for the platform (composite of tiles)
    const textureKey = `moving_platform_${x}_${y}_${width}`;

    // Check if texture already exists (for scene restart)
    if (!scene.textures.exists(textureKey)) {
      const rt = scene.add.renderTexture(0, 0, platformWidth, platformHeight);

      // Draw tiles onto the render texture
      for (let i = 0; i < tilesWide; i++) {
        // Use grass top tile for the platform surface
        rt.draw('tile_grass_top', i * MovingPlatform.TILE_SIZE, 0);
      }

      // Save as a texture
      rt.saveTexture(textureKey);
      rt.destroy(); // Destroy the render texture, we have the saved texture now
    }

    // Create physics image using the composite texture
    // Position is center-based in Arcade Physics, so adjust
    const centerX = x + platformWidth / 2;
    const centerY = y + platformHeight / 2;

    this.body = scene.physics.add.image(centerX, centerY, textureKey);
    this.body.setDepth(DEPTHS.platforms);

    // Configure physics body
    const physicsBody = this.body.body as Phaser.Physics.Arcade.Body;
    physicsBody.setImmovable(true); // Player can't push it
    physicsBody.setAllowGravity(false); // No gravity on platform

    // Set initial velocity based on axis
    this.setVelocityForDirection();

    console.log(`Moving platform created at (${x}, ${y}), ${tilesWide} tiles, axis: ${axis}, range: ${range}, speed: ${speed}`);
  }

  /**
   * Sets the velocity based on current direction and axis.
   */
  private setVelocityForDirection(): void {
    if (this.axis === 'x') {
      this.body.setVelocity(this.speed * this.direction, 0);
    } else {
      this.body.setVelocity(0, this.speed * this.direction);
    }
  }

  /**
   * Updates the platform position and reverses direction at range limits.
   * Must be called every frame from the scene's update().
   */
  update(time: number, delta: number): void {
    const currentPos = this.axis === 'x' ? this.body.x : this.body.y;
    const startPos = this.axis === 'x' ?
      this.startX + (this.body.width / 2) :
      this.startY + (this.body.height / 2);

    // Calculate distance from start
    const distanceFromStart = currentPos - startPos;

    // Check if we've reached the end of the range and need to reverse
    if (this.direction === 1 && distanceFromStart >= this.range) {
      this.direction = -1;
      this.setVelocityForDirection();
    } else if (this.direction === -1 && distanceFromStart <= 0) {
      this.direction = 1;
      this.setVelocityForDirection();
    }
  }

  /**
   * Gets the physics body for collision detection.
   */
  getBody(): Phaser.Physics.Arcade.Image {
    return this.body;
  }

  /**
   * Gets the current velocity of the platform.
   * Used by the player to "ride" the platform.
   */
  getVelocity(): { x: number; y: number } {
    const physicsBody = this.body.body as Phaser.Physics.Arcade.Body;
    return {
      x: physicsBody.velocity.x,
      y: physicsBody.velocity.y
    };
  }

  /**
   * Checks if a player is standing on this platform.
   * Uses body bounds comparison with a small tolerance.
   */
  isPlayerStanding(playerSprite: Phaser.Physics.Arcade.Sprite): boolean {
    const playerBody = playerSprite.body as Phaser.Physics.Arcade.Body;
    const platformBody = this.body.body as Phaser.Physics.Arcade.Body;

    // Check if player bottom is near platform top
    const playerBottom = playerBody.y + playerBody.height;
    const platformTop = platformBody.y;
    const tolerance = 5;

    // Check vertical alignment
    const verticallyAligned = Math.abs(playerBottom - platformTop) < tolerance;

    // Check horizontal overlap
    const playerLeft = playerBody.x;
    const playerRight = playerBody.x + playerBody.width;
    const platformLeft = platformBody.x;
    const platformRight = platformBody.x + platformBody.width;

    const horizontalOverlap = playerRight > platformLeft && playerLeft < platformRight;

    return verticallyAligned && horizontalOverlap && playerBody.velocity.y >= 0;
  }

  /**
   * Destroys the platform and cleans up resources.
   */
  destroy(): void {
    this.body.destroy();
  }
}
