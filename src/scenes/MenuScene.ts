import Phaser from 'phaser';
import {
  CANVAS,
  UI_COLORS,
  UI_TYPOGRAPHY,
  UI_SPACING,
  UI_LAYOUT,
} from '../config/gameConfig';

export class MenuScene extends Phaser.Scene {
  private playButton?: Phaser.GameObjects.Container;
  private menuMusic?: Phaser.Sound.BaseSound;
  private isAudioUnlocked: boolean = false;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    console.log('🎮 MenuScene created');

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

    // Add audio unlock handler for browser autoplay restrictions
    this.input.once('pointerdown', () => {
      this.tryPlayMenuMusic();
      console.log('🎵 Audio unlock triggered on first click');
    });

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

    // Add overlay to darken background for better text readability
    const overlay = this.add.rectangle(
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
      120,
      'COSTELINHA\nRUNNER',
      {
        fontFamily: UI_TYPOGRAPHY.fontFamily,
        fontSize: UI_TYPOGRAPHY.sizeXXL,
        color: UI_COLORS.primary,
        stroke: UI_COLORS.backgroundDark,
        strokeThickness: 6,
        align: 'center',
        lineSpacing: 10,
      }
    );
    titleText.setOrigin(0.5, 0.5);

    // Add subtitle/tagline
    const subtitleText = this.add.text(
      CANVAS.width / 2,
      220,
      'Collect All Bones!',
      {
        fontFamily: UI_TYPOGRAPHY.fontFamily,
        fontSize: UI_TYPOGRAPHY.sizeMedium,
        color: UI_COLORS.textAccent,
        stroke: UI_COLORS.backgroundDark,
        strokeThickness: 3,
        align: 'center',
      }
    );
    subtitleText.setOrigin(0.5, 0.5);

    // Create Play button with pixel UI
    this.playButton = this.createButton(
      CANVAS.width / 2,
      CANVAS.height / 2 + 50,
      'PLAY',
      () => {
        console.log('🎮 Starting GameScene...');
        // Play UI click sound (safely)
        this.tryPlaySound('ui_click_sfx', 0.6);

        // Stop menu music before transitioning
        if (this.menuMusic) {
          this.menuMusic.stop();
          console.log('🎵 Menu music stopped');
        }

        this.scene.start('GameScene');
      }
    );

    // Add controls instruction panel
    this.createControlsPanel();

    // Add credits at bottom
    const creditsText = this.add.text(
      CANVAS.width / 2,
      CANVAS.height - 30,
      'Made with Phaser 3 | Assets: Kenney.nl (CC0)',
      {
        fontFamily: UI_TYPOGRAPHY.fontFamily,
        fontSize: UI_TYPOGRAPHY.sizeXS,
        color: UI_COLORS.textSecondary,
        align: 'center',
      }
    );
    creditsText.setOrigin(0.5, 0.5);
    creditsText.setAlpha(0.7);

    // Space key handler (alternative to button click)
    this.input.keyboard?.on('keydown-SPACE', () => {
      console.log('🎮 Starting GameScene...');
      // Play UI click sound (safely)
      this.tryPlaySound('ui_click_sfx', 0.6);

      // Stop menu music before transitioning
      if (this.menuMusic) {
        this.menuMusic.stop();
        console.log('🎵 Menu music stopped');
      }

      this.scene.start('GameScene');
    });
  }

  /**
   * Safely attempts to play menu music after audio unlock
   */
  private tryPlayMenuMusic() {
    try {
      if (this.menuMusic && !this.menuMusic.isPlaying) {
        this.menuMusic.play();
        this.isAudioUnlocked = true;
        console.log('🎵 Menu music playing');
      }
    } catch (e) {
      console.warn('⚠️ Could not play menu music:', e);
    }
  }

  /**
   * Safely attempts to play a sound effect
   */
  private tryPlaySound(key: string, volume: number = 1) {
    try {
      this.sound.play(key, { volume });
      console.log(`🎵 ${key} played`);
    } catch (e) {
      console.warn(`⚠️ Could not play ${key}:`, e);
    }
  }

  /**
   * Creates a pixel-styled button with hover effects
   */
  private createButton(
    x: number,
    y: number,
    text: string,
    callback: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // Button background (using Kenney UI asset)
    const buttonBg = this.add.image(0, 0, 'ui_button_rectangle');
    buttonBg.setScale(3); // Scale up the pixel button
    buttonBg.setTint(Phaser.Display.Color.HexStringToColor(UI_COLORS.primary).color);

    // Button text
    const buttonText = this.add.text(0, 0, text, {
      fontFamily: UI_TYPOGRAPHY.fontFamily,
      fontSize: UI_TYPOGRAPHY.sizeLarge,
      color: UI_COLORS.buttonText,
      stroke: UI_COLORS.backgroundDark,
      strokeThickness: 3,
      align: 'center',
    });
    buttonText.setOrigin(0.5, 0.5);

    // Add elements to container
    container.add([buttonBg, buttonText]);
    container.setSize(buttonBg.displayWidth, buttonBg.displayHeight);

    // Make button interactive
    buttonBg.setInteractive({ useHandCursor: true });

    // Hover effects
    buttonBg.on('pointerover', () => {
      buttonBg.setTint(Phaser.Display.Color.HexStringToColor(UI_COLORS.buttonHover).color);
      container.setScale(1.05);
      this.tweens.add({
        targets: container,
        y: y - 5,
        duration: 100,
        ease: 'Power2',
      });
    });

    buttonBg.on('pointerout', () => {
      buttonBg.setTint(Phaser.Display.Color.HexStringToColor(UI_COLORS.primary).color);
      container.setScale(1);
      this.tweens.add({
        targets: container,
        y: y,
        duration: 100,
        ease: 'Power2',
      });
    });

    buttonBg.on('pointerdown', () => {
      container.setScale(0.95);
      this.tweens.add({
        targets: container,
        y: y + 2,
        duration: 50,
        ease: 'Power2',
        yoyo: true,
        onComplete: callback,
      });
    });

    // Add idle pulse animation
    this.tweens.add({
      targets: container,
      scaleX: 1.02,
      scaleY: 1.02,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    return container;
  }

  /**
   * Creates a panel showing game controls with icons
   */
  private createControlsPanel() {
    const panelX = CANVAS.width / 2;
    const panelY = CANVAS.height / 2 + 200;

    // Panel title
    const titleText = this.add.text(panelX, panelY - 50, 'CONTROLS', {
      fontFamily: UI_TYPOGRAPHY.fontFamily,
      fontSize: UI_TYPOGRAPHY.sizeSmall,
      color: UI_COLORS.textSecondary,
      align: 'center',
    });
    titleText.setOrigin(0.5, 0.5);

    // Arrow keys instruction
    const arrowContainer = this.add.container(panelX - 120, panelY);

    const arrowLeft = this.add.image(-30, 0, 'ui_arrow_left').setScale(1.5);
    const arrowRight = this.add.image(30, 0, 'ui_arrow_right').setScale(1.5);
    const arrowText = this.add.text(
      0,
      40,
      'Move',
      {
        fontFamily: UI_TYPOGRAPHY.fontFamily,
        fontSize: UI_TYPOGRAPHY.sizeXS,
        color: UI_COLORS.textSecondary,
        align: 'center',
      }
    );
    arrowText.setOrigin(0.5, 0.5);
    arrowContainer.add([arrowLeft, arrowRight, arrowText]);

    // Space bar instruction
    const spaceContainer = this.add.container(panelX + 120, panelY);

    const spaceIcon = this.add.image(0, 0, 'ui_arrow_up').setScale(1.5);
    const spaceText = this.add.text(
      0,
      40,
      'Jump',
      {
        fontFamily: UI_TYPOGRAPHY.fontFamily,
        fontSize: UI_TYPOGRAPHY.sizeXS,
        color: UI_COLORS.textSecondary,
        align: 'center',
      }
    );
    spaceText.setOrigin(0.5, 0.5);
    spaceContainer.add([spaceIcon, spaceText]);
  }
}
