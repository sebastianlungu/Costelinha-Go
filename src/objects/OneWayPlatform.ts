import Phaser from 'phaser';
import { DEPTHS } from '../config/gameConfig';

/**
 * OneWayPlatform - A platform the player can jump through from below.
 *
 * The player can pass through this platform when moving upward,
 * but will land on it when falling from above.
 * Visual appearance is slightly different (lighter) to indicate pass-through behavior.
 */
export class OneWayPlatform {
  public body: Phaser.Physics.Arcade.Image;
  private scene: Phaser.Scene;

  // Tile size for platform visuals (Kenney assets use 21x21)
  private static readonly TILE_SIZE = 21;

  /**
   * Creates a new OneWayPlatform.
   *
   * @param scene - The Phaser scene
   * @param x - Starting X position (left edge)
   * @param y - Starting Y position (top edge)
   * @param width - Platform width in pixels
   */
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number
  ) {
    this.scene = scene;

    // Calculate tile dimensions
    const tilesWide = Math.max(1, Math.ceil(width / OneWayPlatform.TILE_SIZE));
    const platformWidth = tilesWide * OneWayPlatform.TILE_SIZE;
    const platformHeight = OneWayPlatform.TILE_SIZE;

    // Create a unique texture key for this platform
    const textureKey = `oneway_platform_${x}_${y}_${width}`;

    // Check if texture already exists (for scene restart)
    if (!scene.textures.exists(textureKey)) {
      const rt = scene.add.renderTexture(0, 0, platformWidth, platformHeight);

      // Draw tiles onto the render texture with slight transparency for one-way indicator
      for (let i = 0; i < tilesWide; i++) {
        // Use dirt tile for a different visual (lighter appearance)
        rt.draw('tile_dirt_alt', i * OneWayPlatform.TILE_SIZE, 0);
      }

      // Save as a texture
      rt.saveTexture(textureKey);
      rt.destroy();
    }

    // Create physics image
    const centerX = x + platformWidth / 2;
    const centerY = y + platformHeight / 2;

    this.body = scene.physics.add.image(centerX, centerY, textureKey);
    this.body.setDepth(DEPTHS.platforms);

    // Apply slight transparency to indicate one-way nature
    this.body.setAlpha(0.85);

    // Configure physics body
    const physicsBody = this.body.body as Phaser.Physics.Arcade.Body;
    physicsBody.setImmovable(true);
    physicsBody.setAllowGravity(false);

    // Disable collision from below - player can pass through going up
    // The platform only blocks from above
    physicsBody.checkCollision.down = false;
    physicsBody.checkCollision.left = false;
    physicsBody.checkCollision.right = false;
    // Only keep top collision enabled
    physicsBody.checkCollision.up = true;

    console.log(`One-way platform created at (${x}, ${y}), ${tilesWide} tiles wide`);
  }

  /**
   * Checks if the one-way collision should be active.
   * Returns true if the player should collide with this platform.
   *
   * @param player - The player sprite to check
   * @returns true if collision should occur, false to pass through
   */
  checkOneWay(player: Phaser.Physics.Arcade.Sprite): boolean {
    const playerBody = player.body as Phaser.Physics.Arcade.Body;
    const platformBody = this.body.body as Phaser.Physics.Arcade.Body;

    // Get player's bottom edge and platform's top edge
    const playerBottom = playerBody.y + playerBody.height;
    const platformTop = platformBody.y;

    // Allow pass-through if:
    // 1. Player is moving upward (jumping)
    // 2. Player's bottom is below the platform top (player is below platform)
    if (playerBody.velocity.y < 0) {
      // Moving up - no collision
      return false;
    }

    // Player must be above the platform to land on it
    // Add small tolerance for edge cases
    const tolerance = 8;
    if (playerBottom > platformTop + tolerance) {
      // Player is inside or below the platform - no collision
      return false;
    }

    // Player is falling and above the platform - allow landing
    return true;
  }

  /**
   * Gets the physics body for collision detection.
   */
  getBody(): Phaser.Physics.Arcade.Image {
    return this.body;
  }

  /**
   * Destroys the platform and cleans up resources.
   */
  destroy(): void {
    this.body.destroy();
  }
}
