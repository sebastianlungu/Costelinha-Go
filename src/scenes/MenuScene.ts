import Phaser from 'phaser';
import {
  CANVAS,
  UI_COLORS,
  UI_TYPOGRAPHY,
} from '../config/gameConfig';
import { getGameState } from '../state/GameState';

export class MenuScene extends Phaser.Scene {
  private menuMusic?: Phaser.Sound.BaseSound;
  private isAudioUnlocked: boolean = false;
  private buttons: Phaser.GameObjects.Container[] = [];

  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    console.log('🎮 MenuScene created');

    // Debug: Log initial audio state
    console.log(`🎵 Audio system state - locked: ${this.sound.locked}, mute: ${this.sound.mute}, volume: ${this.sound.volume}`);

    // Try to create menu music (may fail if audio didn't load due to browser restrictions)
    try {
      this.menuMusic = this.sound.add('menu_music', {
        loop: true,
        volume: 0.3,
      });
      console.log('🎵 Menu music created successfully');
    } catch (e) {
      console.warn('⚠️ Could not create menu music - audio may not be available:', e);
      this.menuMusic = undefined;
    }

    // Handle audio unlock properly using Phaser's recommended pattern
    if (this.sound.locked) {
      console.log('🎵 Audio is locked, waiting for user gesture to unlock...');
      this.sound.once('unlocked', () => {
        console.log('🎵 Audio unlocked by Phaser!');
        this.isAudioUnlocked = true;
        this.tryPlayMenuMusic();
      });
    } else {
      console.log('🎵 Audio already unlocked, playing immediately');
      this.isAudioUnlocked = true;
      this.tryPlayMenuMusic();
    }

    // Also add pointerdown as backup unlock trigger
    this.input.once('pointerdown', () => {
      console.log('🎵 First click detected - attempting audio unlock');
      if (!this.isAudioUnlocked) {
        if (this.sound.context && this.sound.context.state === 'suspended') {
          console.log('🎵 Audio context suspended, resuming...');
          this.sound.context.resume().then(() => {
            console.log('🎵 Audio context resumed successfully');
            this.isAudioUnlocked = true;
            this.tryPlayMenuMusic();
          }).catch((err: Error) => {
            console.warn('⚠️ Failed to resume audio context:', err);
          });
        } else {
          this.isAudioUnlocked = true;
          this.tryPlayMenuMusic();
        }
      }
    });

    // Display menu background scaled to fit 1280x720 canvas
    const background = this.add.image(
      CANVAS.width / 2,
      CANVAS.height / 2,
      'menu_background'
    );

    // Scale background to cover canvas (1920x1080 -> 1280x720)
    const scaleX = CANVAS.width / background.width;
    const scaleY = CANVAS.height / background.height;
    const scale = Math.max(scaleX, scaleY);
    background.setScale(scale);

    // Add overlay to darken background for better text readability
    this.add.rectangle(
      CANVAS.width / 2,
      CANVAS.height / 2,
      CANVAS.width,
      CANVAS.height,
      0x000000,
      0.3
    );

    // Add title text (center-top, pixel font)
    const titleText = this.add.text(
      CANVAS.width / 2,
      100,
      'COSTELINHA GO',
      {
        fontFamily: UI_TYPOGRAPHY.fontFamily,
        fontSize: UI_TYPOGRAPHY.sizeXL,
        color: UI_COLORS.primary,
        stroke: UI_COLORS.backgroundDark,
        strokeThickness: 5,
        align: 'center',
      }
    );
    titleText.setOrigin(0.5, 0.5);

    // Add subtitle/tagline
    const subtitleText = this.add.text(
      CANVAS.width / 2,
      160,
      'Collect All Bones!',
      {
        fontFamily: UI_TYPOGRAPHY.fontFamily,
        fontSize: UI_TYPOGRAPHY.sizeSmall,
        color: UI_COLORS.textAccent,
        stroke: UI_COLORS.backgroundDark,
        strokeThickness: 2,
        align: 'center',
      }
    );
    subtitleText.setOrigin(0.5, 0.5);

    // Button configuration - smaller, tasteful, centered
    const buttonStartY = CANVAS.height / 2 - 20;
    const buttonSpacing = 60;

    // PLAY button
    this.createButton(
      CANVAS.width / 2,
      buttonStartY,
      'PLAY',
      () => this.startGame()
    );

    // LEVEL SELECT button
    this.createButton(
      CANVAS.width / 2,
      buttonStartY + buttonSpacing,
      'LEVEL SELECT',
      () => this.goToLevelSelect()
    );

    // SETTINGS button
    this.createButton(
      CANVAS.width / 2,
      buttonStartY + buttonSpacing * 2,
      'SETTINGS',
      () => this.goToSettings()
    );

    // Add subtle controls hint at bottom
    this.createControlsHint();

    // Space key handler (alternative to button click for quick play)
    this.input.keyboard?.on('keydown-SPACE', () => {
      this.startGame();
    });
  }

  /**
   * Start the game at current/first level
   */
  private startGame() {
    console.log('🎮 Starting GameScene...');
    this.tryPlaySound('ui_click_sfx', 0.6);
    this.stopMenuMusic();

    // Get game state and start a new run from level 1
    const gameState = getGameState();
    gameState.startNewRun(1); // Reset HP and start from level 1
    console.log(`🎮 Starting new run at level ${gameState.selectedLevelIndex}`);

    this.scene.start('GameScene');
  }

  /**
   * Navigate to Level Select scene
   */
  private goToLevelSelect() {
    console.log('🎮 Going to LevelSelectScene...');
    this.tryPlaySound('ui_click_sfx', 0.6);
    this.stopMenuMusic();
    this.scene.start('LevelSelectScene');
  }

  /**
   * Navigate to Settings scene
   */
  private goToSettings() {
    console.log('🎮 Going to SettingsScene...');
    this.tryPlaySound('ui_click_sfx', 0.6);
    this.stopMenuMusic();
    this.scene.start('SettingsScene');
  }

  /**
   * Stop menu music before scene transition
   */
  private stopMenuMusic() {
    if (this.menuMusic) {
      this.menuMusic.stop();
      console.log('🎵 Menu music stopped');
    }
  }

  /**
   * Safely attempts to play menu music after audio unlock
   */
  private tryPlayMenuMusic() {
    console.log(`🎵 tryPlayMenuMusic called - menuMusic exists: ${!!this.menuMusic}, isPlaying: ${this.menuMusic?.isPlaying}, locked: ${this.sound.locked}`);
    try {
      if (this.menuMusic && !this.menuMusic.isPlaying) {
        this.menuMusic.play();
        console.log(`🎵 Menu music play() called - isPlaying now: ${this.menuMusic.isPlaying}`);

        const soundConfig = (this.menuMusic as Phaser.Sound.BaseSound & { volume?: number; mute?: boolean });
        console.log(`🎵 Music state - volume: ${soundConfig.volume}, mute: ${soundConfig.mute}`);
      } else if (this.menuMusic?.isPlaying) {
        console.log('🎵 Menu music already playing, skipping');
      } else {
        console.warn('⚠️ Menu music object is undefined');
      }
    } catch (e) {
      console.warn('⚠️ Could not play menu music:', e);
    }
  }

  /**
   * Safely attempts to play a sound effect
   * Respects GameState volume and mute settings
   */
  private tryPlaySound(key: string, volume: number = 1) {
    try {
      const gameState = getGameState();

      // Check if muted
      if (gameState.isMuted) {
        console.log(`🎵 SFX skipped (muted): ${key}`);
        return;
      }

      // Apply gameState sfxVolume multiplier
      const finalVolume = volume * gameState.sfxVolume;

      // Skip if effective volume is 0
      if (finalVolume <= 0) {
        console.log(`🎵 SFX skipped (zero volume): ${key}`);
        return;
      }

      this.sound.play(key, { volume: finalVolume });
      console.log(`🎵 SFX played: ${key} at volume ${finalVolume.toFixed(2)}`);
    } catch (e) {
      console.warn(`⚠️ Could not play ${key}:`, e);
    }
  }

  /**
   * Creates a smaller, tasteful button with hover effects
   */
  private createButton(
    x: number,
    y: number,
    text: string,
    callback: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // Button background (using Kenney UI asset) - smaller scale
    const buttonBg = this.add.image(0, 0, 'ui_button_rectangle');
    buttonBg.setScale(1.8); // Smaller scale for tasteful buttons
    buttonBg.setTint(Phaser.Display.Color.HexStringToColor(UI_COLORS.primary).color);

    // Button text - smaller font
    const buttonText = this.add.text(0, 0, text, {
      fontFamily: UI_TYPOGRAPHY.fontFamily,
      fontSize: UI_TYPOGRAPHY.sizeMedium, // Smaller (was sizeLarge)
      color: UI_COLORS.buttonText,
      stroke: UI_COLORS.backgroundDark,
      strokeThickness: 2,
      align: 'center',
    });
    buttonText.setOrigin(0.5, 0.5);

    // Add elements to container
    container.add([buttonBg, buttonText]);
    container.setSize(buttonBg.displayWidth, buttonBg.displayHeight);

    // Make button interactive
    buttonBg.setInteractive({ useHandCursor: true });

    // Store original y for animations
    const originalY = y;

    // Hover effects
    buttonBg.on('pointerover', () => {
      buttonBg.setTint(Phaser.Display.Color.HexStringToColor(UI_COLORS.buttonHover).color);
      container.setScale(1.03);
      this.tweens.add({
        targets: container,
        y: originalY - 3,
        duration: 80,
        ease: 'Power2',
      });
    });

    buttonBg.on('pointerout', () => {
      buttonBg.setTint(Phaser.Display.Color.HexStringToColor(UI_COLORS.primary).color);
      container.setScale(1);
      this.tweens.add({
        targets: container,
        y: originalY,
        duration: 80,
        ease: 'Power2',
      });
    });

    buttonBg.on('pointerdown', () => {
      container.setScale(0.97);
      this.tweens.add({
        targets: container,
        y: originalY + 2,
        duration: 50,
        ease: 'Power2',
        yoyo: true,
        onComplete: callback,
      });
    });

    // Store reference
    this.buttons.push(container);

    return container;
  }

  /**
   * Creates a subtle controls hint at the bottom of the screen
   */
  private createControlsHint() {
    const hintY = CANVAS.height - 50;

    // Subtle controls text
    const controlsText = this.add.text(
      CANVAS.width / 2,
      hintY,
      '\u2190 \u2192 move  \u00B7  SPACE jump',
      {
        fontFamily: UI_TYPOGRAPHY.fontFamily,
        fontSize: UI_TYPOGRAPHY.sizeXS,
        color: UI_COLORS.textSecondary,
        align: 'center',
      }
    );
    controlsText.setOrigin(0.5, 0.5);
    controlsText.setAlpha(0.6); // Muted appearance
  }
}
