import Phaser from 'phaser';
import { CANVAS } from '../config/gameConfig';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    console.log('🎮 MenuScene created');

    // Display menu background scaled to fit 1280x720 canvas
    const background = this.add.image(
      CANVAS.width / 2,
      CANVAS.height / 2,
      'menu_background'
    );

    // Scale background to cover canvas (1920x1080 → 1280x720)
    const scaleX = CANVAS.width / background.width;
    const scaleY = CANVAS.height / background.height;
    const scale = Math.max(scaleX, scaleY);
    background.setScale(scale);

    // Add title text (center-top, large font)
    const titleText = this.add.text(
      CANVAS.width / 2,
      150,
      'Costelinha Runner',
      {
        fontFamily: 'Arial',
        fontSize: '64px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 6,
        align: 'center',
      }
    );
    titleText.setOrigin(0.5, 0.5);

    // Add instruction text (center, smaller font)
    const instructionText = this.add.text(
      CANVAS.width / 2,
      CANVAS.height / 2 + 100,
      'Press SPACE to Start',
      {
        fontFamily: 'Arial',
        fontSize: '32px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
        align: 'center',
      }
    );
    instructionText.setOrigin(0.5, 0.5);

    // Add pulsing effect to instruction text
    this.tweens.add({
      targets: instructionText,
      alpha: 0.3,
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });

    // Space key handler
    this.input.keyboard?.on('keydown-SPACE', () => {
      console.log('🎮 Starting GameScene...');
      this.scene.start('GameScene');
      this.scene.launch('HudScene');
    });
  }
}
