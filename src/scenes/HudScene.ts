import Phaser from 'phaser';
import {
  DEPTHS,
  UI_COLORS,
  UI_TYPOGRAPHY,
  UI_SPACING,
  UI_LAYOUT,
} from '../config/gameConfig';
import { Score } from '../systems/Score';

export class HudScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private scoreSystem!: Score;
  private scoreIcon!: Phaser.GameObjects.Image;
  private panelContainer!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'HudScene' });
  }

  create(data?: { scoreSystem?: Score }) {
    console.log('💻 HudScene created');

    // Get score system from data or create a new one (for testing)
    this.scoreSystem = data?.scoreSystem || new Score();

    // Create score panel with pixel UI design
    this.createScorePanel();

    // Listen to score-changed event
    this.scoreSystem.on('score-changed', this.updateScore, this);
  }

  /**
   * Creates a styled score panel with pixel UI design system
   */
  private createScorePanel() {
    const panelX = UI_SPACING.medium;
    const panelY = UI_SPACING.medium;
    const panelWidth = 240;
    const panelHeight = 60;

    // Create container for the entire panel
    this.panelContainer = this.add.container(panelX, panelY);
    this.panelContainer.setDepth(DEPTHS.hud);
    this.panelContainer.setScrollFactor(0, 0);

    // Panel background (dark with border)
    const panelBg = this.add.rectangle(
      0,
      0,
      panelWidth,
      panelHeight,
      Phaser.Display.Color.HexStringToColor(UI_COLORS.backgroundLight).color,
      0.9
    );
    panelBg.setOrigin(0, 0);
    panelBg.setStrokeStyle(
      UI_LAYOUT.borderMedium,
      Phaser.Display.Color.HexStringToColor(UI_COLORS.primary).color,
      1
    );

    // Shadow/depth effect
    const panelShadow = this.add.rectangle(
      UI_LAYOUT.shadowMedium,
      UI_LAYOUT.shadowMedium,
      panelWidth,
      panelHeight,
      Phaser.Display.Color.HexStringToColor(UI_COLORS.backgroundDark).color,
      0.6
    );
    panelShadow.setOrigin(0, 0);

    // Star icon with background circle
    const iconX = UI_SPACING.large;
    const iconY = panelHeight / 2;

    const iconBg = this.add.circle(
      iconX,
      iconY,
      18,
      Phaser.Display.Color.HexStringToColor(UI_COLORS.primary).color,
      0.3
    );

    this.scoreIcon = this.add.image(iconX, iconY, 'ui_star');
    this.scoreIcon.setScale(1.8);
    this.scoreIcon.setTint(Phaser.Display.Color.HexStringToColor(UI_COLORS.textAccent).color);

    // Score label text
    const labelText = this.add.text(
      iconX + UI_SPACING.large + 4,
      iconY - 14,
      'BONES',
      {
        fontFamily: UI_TYPOGRAPHY.fontFamily,
        fontSize: UI_TYPOGRAPHY.sizeXS,
        color: UI_COLORS.textSecondary,
      }
    );
    labelText.setOrigin(0, 0.5);

    // Score value text
    this.scoreText = this.add.text(
      iconX + UI_SPACING.large + 4,
      iconY + 8,
      '0/15',
      {
        fontFamily: UI_TYPOGRAPHY.fontFamily,
        fontSize: UI_TYPOGRAPHY.sizeMedium,
        color: UI_COLORS.textPrimary,
        stroke: UI_COLORS.backgroundDark,
        strokeThickness: 2,
      }
    );
    this.scoreText.setOrigin(0, 0.5);

    // Add all elements to container (back to front)
    this.panelContainer.add([
      panelShadow,
      panelBg,
      iconBg,
      this.scoreIcon,
      labelText,
      this.scoreText,
    ]);

    // Add subtle pulse animation to star icon
    this.tweens.add({
      targets: this.scoreIcon,
      scale: 2.0,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Add subtle glow effect
    this.tweens.add({
      targets: iconBg,
      alpha: 0.5,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * Updates the score display with collection feedback
   */
  private updateScore(score: number, totalBones: number) {
    this.scoreText.setText(`${score}/${totalBones}`);

    // Flash effect on score update
    this.tweens.add({
      targets: this.scoreText,
      scale: 1.2,
      duration: 100,
      yoyo: true,
      ease: 'Power2',
    });

    // Color flash on icon
    this.tweens.add({
      targets: this.scoreIcon,
      tint: Phaser.Display.Color.HexStringToColor(UI_COLORS.success).color,
      duration: 200,
      yoyo: true,
      ease: 'Power2',
      onComplete: () => {
        this.scoreIcon.setTint(
          Phaser.Display.Color.HexStringToColor(UI_COLORS.textAccent).color
        );
      },
    });
  }

  shutdown() {
    // Clean up event listeners
    if (this.scoreSystem) {
      this.scoreSystem.off('score-changed', this.updateScore, this);
    }
  }
}
