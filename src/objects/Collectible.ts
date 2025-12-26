import Phaser from 'phaser';
import { DEPTHS } from '../config/gameConfig';

export class Collectible {
  public sprite: Phaser.Physics.Arcade.Sprite;
  private scene: Phaser.Scene;
  private static readonly SCALE = 2.5; // Scale factor for better visibility

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;

    // Create sprite with physics using the 'bone' texture
    this.sprite = scene.physics.add.sprite(x, y, 'bone');

    // Set depth for proper layering
    this.sprite.setDepth(DEPTHS.collectibles);

    // Scale up for better visibility
    this.sprite.setScale(Collectible.SCALE);

    // Rotate bone 45 degrees for visual interest
    this.sprite.setAngle(45);

    // Enable physics body and disable gravity
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false); // Bones float in place

    // Update physics body size to match the scaled sprite
    const scaledWidth = this.sprite.width * Collectible.SCALE;
    const scaledHeight = this.sprite.height * Collectible.SCALE;
    body.setSize(scaledWidth, scaledHeight);

    console.log(`🍖 Collectible spawned at (${x}, ${y}) with scale ${Collectible.SCALE}`);
  }

  public destroy() {
    this.sprite.destroy();
  }
}
