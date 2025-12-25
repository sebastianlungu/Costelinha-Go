import Phaser from 'phaser';
import { DEPTHS } from '../config/gameConfig';
import { Score } from '../systems/Score';

export class HudScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private scoreSystem!: Score;

  constructor() {
    super({ key: 'HudScene' });
  }

  create(data?: { scoreSystem?: Score }) {
    console.log('💻 HudScene created');

    // Get score system from data or create a new one (for testing)
    this.scoreSystem = data?.scoreSystem || new Score();

    // Create score text at top-left (20, 20)
    this.scoreText = this.add.text(20, 20, 'Bones: 0/15', {
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      fontFamily: 'Arial',
    });

    // Set depth and scroll factor to keep UI fixed
    this.scoreText.setDepth(DEPTHS.hud);
    this.scoreText.setScrollFactor(0, 0);

    // Listen to score-changed event
    this.scoreSystem.on('score-changed', this.updateScore, this);

    console.log('💻 HUD UI created and listening to score events');
  }

  private updateScore(score: number, totalBones: number) {
    this.scoreText.setText(`Bones: ${score}/${totalBones}`);
    console.log(`💻 HUD updated: Bones: ${score}/${totalBones}`);
  }

  shutdown() {
    // Clean up event listeners
    if (this.scoreSystem) {
      this.scoreSystem.off('score-changed', this.updateScore, this);
    }
  }
}
