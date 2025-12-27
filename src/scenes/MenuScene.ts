import Phaser from 'phaser';
import {
  CANVAS,
  UI_COLORS,
  UI_TYPOGRAPHY,
} from '../config/gameConfig';
import { getGameState } from '../state/GameState';
import { AudioManager } from '../systems/AudioManager';

export class MenuScene extends Phaser.Scene {
  private buttons: Phaser.GameObjects.Container[] = [];
  private backgroundVideo?: Phaser.GameObjects.Video;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    console.log('🎮 MenuScene created');

    // Debug: Log initial audio state
    console.log(`🎵 Audio system state - locked: ${this.sound.locked}, mute: ${this.sound.mute}, volume: ${this.sound.volume}`);
    console.log(`[AudioManager] ${AudioManager.getDebugInfo()}`);

    // Queue menu music (AudioManager will defer until unlocked)
    AudioManager.playMusic('menu_music', 0.3, true);

    // Single unlock pathway: first user gesture in Menu
    this.input.once('pointerdown', () => {
      console.log('🎵 First click detected - attempting audio unlock');
      AudioManager.tryUnlock();
    });

    this.input.keyboard?.once('keydown', () => {
      console.log('🎵 First keypress detected - attempting audio unlock');
      AudioManager.tryUnlock();
    });

    // Display menu background video (looped, muted)
    // Video is 1504x832, canvas is 1280x720
    this.backgroundVideo = this.add.video(
      CANVAS.width / 2,
      CANVAS.height / 2,
      'menu_background_video'
    );

    // Scale video to fit canvas (use known video dimensions)
    const videoWidth = 1504;
    const videoHeight = 832;
    const scaleX = CANVAS.width / videoWidth;
    const scaleY = CANVAS.height / videoHeight;
    const scale = Math.min(scaleX, scaleY); // Fit (show entire video)
    this.backgroundVideo.setScale(scale);

    // Play video looped and muted
    this.backgroundVideo.play(true); // loop = true
    this.backgroundVideo.setMute(true);

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

    // Animate title with a gentle floating effect
    this.tweens.add({
      targets: titleText,
      y: 110,
      duration: 1500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    // Add subtle scale pulse to title
    this.tweens.add({
      targets: titleText,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 2000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    // Add subtitle/tagline
    const subtitleText = this.add.text(
      CANVAS.width / 2,
      170,
      'On a mission to collect every single bone out there',
      {
        fontFamily: UI_TYPOGRAPHY.fontFamily,
        fontSize: UI_TYPOGRAPHY.sizeXS,
        color: UI_COLORS.textAccent,
        stroke: UI_COLORS.backgroundDark,
        strokeThickness: 2,
        align: 'center',
      }
    );
    subtitleText.setOrigin(0.5, 0.5);

    // Add dedication note bottom right
    const dedicationText = this.add.text(
      CANVAS.width - 20,
      CANVAS.height - 20,
      'Made by Sebastian for Priscila, with a lot of love',
      {
        fontFamily: UI_TYPOGRAPHY.fontFamily,
        fontSize: UI_TYPOGRAPHY.sizeXS,
        color: UI_COLORS.textSecondary,
        align: 'right',
      }
    );
    dedicationText.setOrigin(1, 1);
    dedicationText.setAlpha(0.7);

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
   * Stop menu music and video before scene transition
   */
  private stopMenuMusic() {
    AudioManager.stopMusic();
    // Stop background video
    if (this.backgroundVideo) {
      this.backgroundVideo.stop();
    }
  }

  /**
   * Safely attempts to play a sound effect
   * Respects GameState volume and mute settings
   */
  private tryPlaySound(key: string, volume: number = 1) {
    try {
      const gameState = getGameState();
      const cacheExists = this.cache.audio.exists(key);
      console.log(`SFX request: ${key} cache=${cacheExists} locked=${this.sound.locked} mute=${this.sound.mute} volume=${this.sound.volume.toFixed(2)} settings(muted=${gameState.isMuted} sfx=${gameState.sfxVolume.toFixed(2)}) base=${volume.toFixed(2)}`);

      // Check if muted
      if (gameState.isMuted) {
        console.log(`🎵 SFX skipped (muted): ${key}`);
        return;
      }

      AudioManager.playSfx(key, volume);
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

    // Button background (using Kenney UI asset) - compact scale
    const buttonBg = this.add.image(0, 0, 'ui_button_rectangle');
    buttonBg.setScale(1.1, 0.7); // Compact buttons, keeping text same size
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
