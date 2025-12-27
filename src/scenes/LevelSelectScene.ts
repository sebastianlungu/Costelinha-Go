import Phaser from 'phaser';
import {
  CANVAS,
  UI_COLORS,
  UI_TYPOGRAPHY,
  UI_SPACING,
  UI_LAYOUT,
} from '../config/gameConfig';
import { getGameState } from '../state/GameState';
import { ThemeId } from '../data/AssetManifest';

// Level data for display
interface LevelDisplayInfo {
  index: number;
  name: string;
  theme: ThemeId;
  themeColor: string; // Color to represent the theme
}

// Level display configuration
const LEVEL_INFO: LevelDisplayInfo[] = [
  { index: 1, name: 'Intro', theme: 'grasslands', themeColor: '#4CAF50' },
  { index: 2, name: 'Zig-Zag', theme: 'forest', themeColor: '#2E7D32' },
  { index: 3, name: 'Moving', theme: 'desert', themeColor: '#FFB74D' },
  { index: 4, name: 'One-Way', theme: 'snow', themeColor: '#B3E5FC' },
  { index: 5, name: 'Precision', theme: 'cave', themeColor: '#616161' },
  { index: 6, name: 'Shaft', theme: 'swamp', themeColor: '#558B2F' },
  { index: 7, name: 'Mixed', theme: 'beach', themeColor: '#FFD54F' },
  { index: 8, name: 'Patrol', theme: 'industrial', themeColor: '#78909C' },
  { index: 9, name: 'Split Path', theme: 'night', themeColor: '#311B92' },
  { index: 10, name: 'Final', theme: 'volcano', themeColor: '#D84315' },
];

export class LevelSelectScene extends Phaser.Scene {
  private levelButtons: Phaser.GameObjects.Container[] = [];

  constructor() {
    super({ key: 'LevelSelectScene' });
  }

  create() {
    console.log('🎮 LevelSelectScene created');

    const gameState = getGameState();

    // Background
    const background = this.add.rectangle(
      CANVAS.width / 2,
      CANVAS.height / 2,
      CANVAS.width,
      CANVAS.height,
      Phaser.Display.Color.HexStringToColor(UI_COLORS.background).color
    );

    // Title
    const title = this.add.text(
      CANVAS.width / 2,
      60,
      'SELECT LEVEL',
      {
        fontFamily: UI_TYPOGRAPHY.fontFamily,
        fontSize: UI_TYPOGRAPHY.sizeXL,
        color: UI_COLORS.primary,
        stroke: UI_COLORS.backgroundDark,
        strokeThickness: 4,
        align: 'center',
      }
    );
    title.setOrigin(0.5, 0.5);

    // Create level grid (2 rows of 5)
    this.createLevelGrid();

    // Back button
    this.createBackButton();

    // Show current highest unlocked level
    const progressText = this.add.text(
      CANVAS.width / 2,
      CANVAS.height - 100,
      `Progress: Level ${gameState.highestUnlockedLevel}/10`,
      {
        fontFamily: UI_TYPOGRAPHY.fontFamily,
        fontSize: UI_TYPOGRAPHY.sizeSmall,
        color: UI_COLORS.textSecondary,
        align: 'center',
      }
    );
    progressText.setOrigin(0.5, 0.5);
  }

  /**
   * Creates the 10-level grid layout (2 rows of 5)
   */
  private createLevelGrid(): void {
    const gameState = getGameState();

    const gridConfig = {
      cols: 5,
      rows: 2,
      cellWidth: 180,
      cellHeight: 180,
      startX: CANVAS.width / 2 - (5 * 180) / 2 + 90, // Center grid
      startY: 180,
      gapX: 20,
      gapY: 40,
    };

    for (let i = 0; i < LEVEL_INFO.length; i++) {
      const levelInfo = LEVEL_INFO[i];
      const col = i % gridConfig.cols;
      const row = Math.floor(i / gridConfig.cols);

      const x = gridConfig.startX + col * (gridConfig.cellWidth + gridConfig.gapX);
      const y = gridConfig.startY + row * (gridConfig.cellHeight + gridConfig.gapY);

      const isUnlocked = gameState.isLevelUnlocked(levelInfo.index);

      const button = this.createLevelButton(x, y, levelInfo, isUnlocked);
      this.levelButtons.push(button);
    }
  }

  /**
   * Creates a single level button
   */
  private createLevelButton(
    x: number,
    y: number,
    info: LevelDisplayInfo,
    isUnlocked: boolean
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const buttonSize = 140;

    // Button background
    const bgColor = isUnlocked
      ? Phaser.Display.Color.HexStringToColor(info.themeColor).color
      : Phaser.Display.Color.HexStringToColor('#444444').color;

    const bg = this.add.rectangle(0, 0, buttonSize, buttonSize, bgColor);
    bg.setStrokeStyle(
      UI_LAYOUT.borderMedium,
      isUnlocked
        ? Phaser.Display.Color.HexStringToColor(UI_COLORS.primary).color
        : Phaser.Display.Color.HexStringToColor('#333333').color
    );

    // Level number
    const levelNum = this.add.text(
      0,
      isUnlocked ? -20 : 0,
      isUnlocked ? info.index.toString() : '',
      {
        fontFamily: UI_TYPOGRAPHY.fontFamily,
        fontSize: UI_TYPOGRAPHY.sizeLarge,
        color: UI_COLORS.textPrimary,
        stroke: UI_COLORS.backgroundDark,
        strokeThickness: 3,
        align: 'center',
      }
    );
    levelNum.setOrigin(0.5, 0.5);

    // Level name (only shown if unlocked)
    const levelName = this.add.text(
      0,
      25,
      isUnlocked ? info.name : '',
      {
        fontFamily: UI_TYPOGRAPHY.fontFamily,
        fontSize: UI_TYPOGRAPHY.sizeXS,
        color: UI_COLORS.textSecondary,
        align: 'center',
      }
    );
    levelName.setOrigin(0.5, 0.5);

    container.add([bg, levelNum, levelName]);

    // Lock icon for locked levels
    if (!isUnlocked) {
      // Create a simple lock icon using shapes
      const lockBody = this.add.rectangle(0, 10, 30, 25, 0x666666);
      const lockShackle = this.add.arc(0, -8, 12, 180, 360, false, 0x666666);
      lockShackle.setStrokeStyle(5, 0x666666);
      lockShackle.setClosePath(false);

      // Lock keyhole
      const keyhole = this.add.circle(0, 8, 5, 0x333333);

      container.add([lockBody, lockShackle, keyhole]);

      // Dim the entire locked button
      container.setAlpha(0.6);
    } else {
      // Make unlocked buttons interactive
      bg.setInteractive({ useHandCursor: true });

      bg.on('pointerover', () => {
        container.setScale(1.1);
        bg.setStrokeStyle(
          UI_LAYOUT.borderThick,
          Phaser.Display.Color.HexStringToColor(UI_COLORS.textAccent).color
        );
      });

      bg.on('pointerout', () => {
        container.setScale(1);
        bg.setStrokeStyle(
          UI_LAYOUT.borderMedium,
          Phaser.Display.Color.HexStringToColor(UI_COLORS.primary).color
        );
      });

      bg.on('pointerdown', () => {
        this.selectLevel(info.index);
      });
    }

    container.setSize(buttonSize, buttonSize);
    return container;
  }

  /**
   * Select a level and start the game
   */
  private selectLevel(levelIndex: number): void {
    console.log(`🎮 Level ${levelIndex} selected`);

    const gameState = getGameState();
    gameState.selectedLevelIndex = levelIndex;
    gameState.saveLevelCheckpoint(); // Save HP checkpoint before starting level

    // Play UI click sound
    this.tryPlaySound('ui_click_sfx', 0.6);

    // Transition to game scene
    this.scene.start('GameScene');
  }

  /**
   * Creates the back button
   */
  private createBackButton(): void {
    const x = 100;
    const y = CANVAS.height - 50;

    const container = this.add.container(x, y);

    // Button background
    const bg = this.add.image(0, 0, 'ui_button_rectangle');
    bg.setScale(2);
    bg.setTint(Phaser.Display.Color.HexStringToColor(UI_COLORS.secondary).color);

    // Button text
    const text = this.add.text(0, 0, 'BACK', {
      fontFamily: UI_TYPOGRAPHY.fontFamily,
      fontSize: UI_TYPOGRAPHY.sizeMedium,
      color: UI_COLORS.buttonText,
      stroke: UI_COLORS.backgroundDark,
      strokeThickness: 2,
      align: 'center',
    });
    text.setOrigin(0.5, 0.5);

    container.add([bg, text]);
    container.setSize(bg.displayWidth, bg.displayHeight);

    // Make interactive
    bg.setInteractive({ useHandCursor: true });

    bg.on('pointerover', () => {
      bg.setTint(Phaser.Display.Color.HexStringToColor(UI_COLORS.secondaryLight).color);
      container.setScale(1.05);
    });

    bg.on('pointerout', () => {
      bg.setTint(Phaser.Display.Color.HexStringToColor(UI_COLORS.secondary).color);
      container.setScale(1);
    });

    bg.on('pointerdown', () => {
      this.tryPlaySound('ui_click_sfx', 0.6);
      this.scene.start('MenuScene');
    });
  }

  /**
   * Safely play a sound effect
   */
  private tryPlaySound(key: string, volume: number = 1): void {
    try {
      const gameState = getGameState();
      const adjustedVolume = volume * gameState.sfxVolume;
      if (adjustedVolume > 0) {
        this.sound.play(key, { volume: adjustedVolume });
      }
    } catch (e) {
      console.warn(`⚠️ Could not play ${key}:`, e);
    }
  }
}
