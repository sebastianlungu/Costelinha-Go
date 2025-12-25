import Phaser from 'phaser';
import { COLORS } from '../config/gameConfig';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    console.log('🎨 Loading assets...');

    // Load dog sprite atlas
    this.load.atlas(
      'dog',
      'assets/atlas/dog.png',
      'assets/atlas/dog.json'
    );

    // Load menu background
    this.load.image('menu_background', 'assets/menu_background.png');

    // Load bone collectible sprite
    this.load.image('bone', 'assets/food/bone.png');
  }

  create() {
    // Create procedural platform texture (100x20 green rectangle)
    const platformGraphics = this.add.graphics();
    platformGraphics.fillStyle(COLORS.platform, 1);
    platformGraphics.fillRect(0, 0, 100, 20);
    platformGraphics.generateTexture('platform', 100, 20);
    platformGraphics.destroy();

    console.log('✅ Assets loaded');
    console.log('🎮 Starting MenuScene...');

    // Start MenuScene
    this.scene.start('MenuScene');
  }
}
