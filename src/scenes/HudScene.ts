import Phaser from 'phaser';
import {
  DEPTHS,
  UI_COLORS,
  UI_TYPOGRAPHY,
  UI_SPACING,
  UI_LAYOUT,
  PLAYER,
  LEVEL,
} from '../config/gameConfig';
import { Score } from '../systems/Score';

// Tilemap frame indices (18x18 tiles, 20 columns per row)
// Row 0: tiles 0-19, Row 1: tiles 20-39, etc.
// Hearts at row 0: full (col 4), half (col 5), empty (col 6)
const HEART_FRAMES = {
  full: 4,   // Full red heart at column 4, row 0
  half: 5,   // Half heart at column 5, row 0
  empty: 6,  // Empty heart outline at column 6, row 0
};

export class HudScene extends Phaser.Scene {
  // Score panel elements
  private scoreText!: Phaser.GameObjects.Text;
  private scoreSystem!: Score;
  private scoreIcon!: Phaser.GameObjects.Image;
  private scorePanelContainer!: Phaser.GameObjects.Container;

  // HP hearts elements
  private hearts: Phaser.GameObjects.Image[] = [];
  private heartContainer!: Phaser.GameObjects.Container;
  private currentHP: number = PLAYER.startingHP;
  private maxHP: number = PLAYER.maxHP;

  // Level info elements
  private levelContainer!: Phaser.GameObjects.Container;
  private levelText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'HudScene' });
  }

  create(data?: { scoreSystem?: Score; currentHP?: number; maxHP?: number; level?: number; levelName?: string }) {
    console.log('HudScene created');

    // Get score system from data or create a new one (for testing)
    this.scoreSystem = data?.scoreSystem || new Score();

    // Initialize HP from data or config
    this.currentHP = data?.currentHP ?? PLAYER.startingHP;
    this.maxHP = data?.maxHP ?? PLAYER.maxHP;

    // Create HP hearts display (top-left)
    this.createHeartsPanel();

    // Create score panel with pixel UI design (below hearts)
    this.createScorePanel();

    // Create level info display (top-center)
    this.createLevelInfo(data?.level ?? LEVEL.currentLevel, data?.levelName ?? LEVEL.currentName);

    // Listen to score-changed event
    this.scoreSystem.on('score-changed', this.updateScore, this);

    // Listen for HP changes from GameScene or GameState
    this.events.on('hp-changed', this.updateHearts, this);

    // Also listen on the scene's events for cross-scene communication
    const gameScene = this.scene.get('GameScene');
    if (gameScene) {
      gameScene.events.on('hp-changed', this.updateHearts, this);
    }
  }

  /**
   * Creates the HP hearts display panel in the top-left corner
   */
  private createHeartsPanel() {
    const panelX = UI_SPACING.medium;
    const panelY = UI_SPACING.medium;
    const heartScale = 2.5; // Scale up the 18x18 heart sprites
    const heartSize = 18 * heartScale;
    const heartSpacing = 4;
    const panelPadding = UI_SPACING.small;

    // Calculate panel dimensions
    const panelWidth = (heartSize * this.maxHP) + (heartSpacing * (this.maxHP - 1)) + (panelPadding * 2);
    const panelHeight = heartSize + (panelPadding * 2);

    // Create container for hearts panel
    this.heartContainer = this.add.container(panelX, panelY);
    this.heartContainer.setDepth(DEPTHS.hud);
    this.heartContainer.setScrollFactor(0, 0);

    // Panel shadow for depth effect
    const panelShadow = this.add.rectangle(
      UI_LAYOUT.shadowMedium,
      UI_LAYOUT.shadowMedium,
      panelWidth,
      panelHeight,
      Phaser.Display.Color.HexStringToColor(UI_COLORS.backgroundDark).color,
      0.6
    );
    panelShadow.setOrigin(0, 0);

    // Panel background
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
      Phaser.Display.Color.HexStringToColor(UI_COLORS.danger).color,
      1
    );

    // Add background elements to container
    this.heartContainer.add([panelShadow, panelBg]);

    // Create heart sprites
    this.hearts = [];
    for (let i = 0; i < this.maxHP; i++) {
      const heartX = panelPadding + (heartSize / 2) + (i * (heartSize + heartSpacing));
      const heartY = panelPadding + (heartSize / 2);

      // Determine which frame to use based on current HP
      const frameIndex = i < this.currentHP ? HEART_FRAMES.full : HEART_FRAMES.empty;

      const heart = this.add.image(heartX, heartY, 'tilemap_packed', frameIndex);
      heart.setScale(heartScale);

      this.hearts.push(heart);
      this.heartContainer.add(heart);
    }

    console.log(`Hearts panel created with ${this.maxHP} hearts (${this.currentHP} full)`);
  }

  /**
   * Creates the level info display in the top-center
   */
  private createLevelInfo(levelNumber: number, levelName: string) {
    const centerX = this.cameras.main.width / 2;
    const panelY = UI_SPACING.medium;
    const panelPadding = UI_SPACING.medium;

    // Create container for level info
    this.levelContainer = this.add.container(centerX, panelY);
    this.levelContainer.setDepth(DEPTHS.hud);
    this.levelContainer.setScrollFactor(0, 0);

    // Create level text first to measure its width
    this.levelText = this.add.text(
      0,
      0,
      `Level ${levelNumber}: ${levelName}`,
      {
        fontFamily: UI_TYPOGRAPHY.fontFamily,
        fontSize: UI_TYPOGRAPHY.sizeSmall,
        color: UI_COLORS.textPrimary,
        stroke: UI_COLORS.backgroundDark,
        strokeThickness: 2,
      }
    );
    this.levelText.setOrigin(0.5, 0);

    // Calculate panel size based on text
    const textWidth = this.levelText.width;
    const textHeight = this.levelText.height;
    const panelWidth = textWidth + (panelPadding * 2);
    const panelHeight = textHeight + (panelPadding * 2);

    // Panel shadow
    const panelShadow = this.add.rectangle(
      UI_LAYOUT.shadowMedium,
      UI_LAYOUT.shadowMedium,
      panelWidth,
      panelHeight,
      Phaser.Display.Color.HexStringToColor(UI_COLORS.backgroundDark).color,
      0.6
    );
    panelShadow.setOrigin(0.5, 0);

    // Panel background
    const panelBg = this.add.rectangle(
      0,
      0,
      panelWidth,
      panelHeight,
      Phaser.Display.Color.HexStringToColor(UI_COLORS.backgroundLight).color,
      0.85
    );
    panelBg.setOrigin(0.5, 0);
    panelBg.setStrokeStyle(
      UI_LAYOUT.borderThin,
      Phaser.Display.Color.HexStringToColor(UI_COLORS.secondary).color,
      1
    );

    // Reposition text to be centered in panel
    this.levelText.setPosition(0, panelPadding);

    // Add elements in correct order (back to front)
    this.levelContainer.add([panelShadow, panelBg, this.levelText]);

    console.log(`Level info panel created: Level ${levelNumber}: ${levelName}`);
  }

  /**
   * Creates a styled score panel with pixel UI design (below hearts)
   */
  private createScorePanel() {
    const panelX = UI_SPACING.medium;
    // Position below hearts panel (hearts panel height + spacing)
    const heartPanelHeight = (18 * 2.5) + (UI_SPACING.small * 2);
    const panelY = UI_SPACING.medium + heartPanelHeight + UI_SPACING.small;
    const panelWidth = 160;
    const panelHeight = 50;

    // Create container for the entire panel
    this.scorePanelContainer = this.add.container(panelX, panelY);
    this.scorePanelContainer.setDepth(DEPTHS.hud);
    this.scorePanelContainer.setScrollFactor(0, 0);

    // Panel shadow (for depth effect)
    const panelShadow = this.add.rectangle(
      UI_LAYOUT.shadowMedium,
      UI_LAYOUT.shadowMedium,
      panelWidth,
      panelHeight,
      Phaser.Display.Color.HexStringToColor(UI_COLORS.backgroundDark).color,
      0.6
    );
    panelShadow.setOrigin(0, 0);

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

    // Bone icon with background circle
    const iconX = UI_SPACING.large;
    const iconY = panelHeight / 2;

    const iconBg = this.add.circle(
      iconX,
      iconY,
      16,
      Phaser.Display.Color.HexStringToColor(UI_COLORS.primary).color,
      0.3
    );

    // Use bone sprite as icon instead of star
    this.scoreIcon = this.add.image(iconX, iconY, 'bone');
    this.scoreIcon.setScale(0.12);
    this.scoreIcon.setTint(Phaser.Display.Color.HexStringToColor(UI_COLORS.textAccent).color);

    // Score value text (bones collected / total)
    this.scoreText = this.add.text(
      iconX + UI_SPACING.large + 4,
      iconY,
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
    this.scorePanelContainer.add([
      panelShadow,
      panelBg,
      iconBg,
      this.scoreIcon,
      this.scoreText,
    ]);

    // Add subtle bob animation to bone icon
    this.tweens.add({
      targets: this.scoreIcon,
      y: iconY - 2,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    console.log('Score panel created (bone count display)');
  }

  /**
   * Updates the hearts display based on current HP
   */
  public updateHearts(currentHP: number) {
    const previousHP = this.currentHP;
    const newHP = Math.max(0, Math.min(currentHP, this.maxHP));

    for (let i = 0; i < this.hearts.length; i++) {
      const heart = this.hearts[i];

      if (i < newHP) {
        // Full heart
        heart.setFrame(HEART_FRAMES.full);
        heart.setAlpha(1);
      } else {
        // Empty heart
        heart.setFrame(HEART_FRAMES.empty);
        heart.setAlpha(0.7);
      }
    }

    // Visual feedback based on HP change
    if (newHP < previousHP) {
      // Damage - red flash
      this.cameras.main.flash(100, 255, 100, 100, false);
    } else if (newHP > previousHP) {
      // Heal - green flash and heart pop animation
      this.cameras.main.flash(100, 100, 255, 100, false);

      // Pop animation on the healed heart(s)
      for (let i = previousHP; i < newHP && i < this.hearts.length; i++) {
        const heart = this.hearts[i];
        this.tweens.add({
          targets: heart,
          scale: 3.2,
          duration: 150,
          yoyo: true,
          ease: 'Back.easeOut',
          onComplete: () => {
            heart.setScale(2.5);
          }
        });
      }
    }

    this.currentHP = newHP;
    console.log(`Hearts updated: ${this.currentHP}/${this.maxHP}`);
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

  /**
   * Updates the level info display
   */
  public updateLevelInfo(levelNumber: number, levelName: string) {
    if (this.levelText) {
      this.levelText.setText(`Level ${levelNumber}: ${levelName}`);

      // Flash effect on level change
      this.tweens.add({
        targets: this.levelText,
        scale: 1.1,
        duration: 150,
        yoyo: true,
        ease: 'Power2',
      });
    }
  }

  shutdown() {
    // Clean up event listeners
    if (this.scoreSystem) {
      this.scoreSystem.off('score-changed', this.updateScore, this);
    }

    // Remove cross-scene event listener
    const gameScene = this.scene.get('GameScene');
    if (gameScene) {
      gameScene.events.off('hp-changed', this.updateHearts, this);
    }

    this.events.off('hp-changed', this.updateHearts, this);
  }
}
