import Phaser from 'phaser';
import { DEPTHS } from '../config/gameConfig';

export class Collectible {
  public sprite: Phaser.Physics.Arcade.Sprite;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;

    // Create sprite with physics using the 'bone' texture
    this.sprite = scene.physics.add.sprite(x, y, 'bone');

    // Set depth for proper layering
    this.sprite.setDepth(DEPTHS.collectibles);

    // Enable physics body
    this.sprite.body.setAllowGravity(false); // Bones float in place

    console.log(`🍖 Collectible spawned at (${x}, ${y})`);
  }

  public destroy() {
    this.sprite.destroy();
  }
}
