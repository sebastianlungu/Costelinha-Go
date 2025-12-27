import Phaser from 'phaser';
import {
  CANVAS,
  UI_COLORS,
  UI_TYPOGRAPHY,
  UI_LAYOUT,
} from '../config/gameConfig';
import { getGameState } from '../state/GameState';

// Slider step configuration (5 discrete steps: 0%, 25%, 50%, 75%, 100%)
const VOLUME_STEPS = [0, 0.25, 0.5, 0.75, 1.0];

export class SettingsScene extends Phaser.Scene {
  private musicSlider?: { container: Phaser.GameObjects.Container; updateValue: (val: number) => void };
  private sfxSlider?: { container: Phaser.GameObjects.Container; updateValue: (val: number) => void };
  private muteCheckbox?: { container: Phaser.GameObjects.Container; updateState: (muted: boolean) => void };

  constructor() {
    super({ key: 'SettingsScene' });
  }

  create() {
    console.log('🎮 SettingsScene created');

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
      80,
      'SETTINGS',
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

    // Settings panel background
    const panelWidth = 600;
    const panelHeight = 350;
    const panelX = CANVAS.width / 2;
    const panelY = CANVAS.height / 2;

    const panel = this.add.rectangle(
      panelX,
      panelY,
      panelWidth,
      panelHeight,
      Phaser.Display.Color.HexStringToColor(UI_COLORS.backgroundLight).color
    );
    panel.setStrokeStyle(
      UI_LAYOUT.borderMedium,
      Phaser.Display.Color.HexStringToColor(UI_COLORS.panelBorder).color
    );

    // Music Volume Slider
    const musicY = panelY - 80;
    this.musicSlider = this.createVolumeSlider(
      panelX,
      musicY,
      'MUSIC',
      gameState.settings.musicVolume,
      (value) => {
        gameState.setMusicVolume(value);
        this.applyAudioSettings();
      }
    );

    // SFX Volume Slider
    const sfxY = panelY + 10;
    this.sfxSlider = this.createVolumeSlider(
      panelX,
      sfxY,
      'SFX',
      gameState.settings.sfxVolume,
      (value) => {
        gameState.setSfxVolume(value);
        // Play a test sound when adjusting SFX
        this.tryPlaySound('ui_click_sfx', value);
      }
    );

    // Mute Toggle
    const muteY = panelY + 100;
    this.muteCheckbox = this.createMuteToggle(
      panelX,
      muteY,
      gameState.isMuted,
      (muted) => {
        gameState.setMute(muted);
        this.applyAudioSettings();
      }
    );

    // Back button
    this.createBackButton();

    // Apply current audio settings
    this.applyAudioSettings();
  }

  /**
   * Creates a volume slider with discrete steps
   */
  private createVolumeSlider(
    x: number,
    y: number,
    label: string,
    initialValue: number,
    onChange: (value: number) => void
  ): { container: Phaser.GameObjects.Container; updateValue: (val: number) => void } {
    const container = this.add.container(x, y);

    const sliderWidth = 320;
    const sliderHeight = 20;
    const handleSize = 24;
    const labelOffsetX = -220;

    // Label
    const labelText = this.add.text(
      labelOffsetX,
      0,
      label,
      {
        fontFamily: UI_TYPOGRAPHY.fontFamily,
        fontSize: UI_TYPOGRAPHY.sizeMedium,
        color: UI_COLORS.textSecondary,
        align: 'left',
      }
    );
    labelText.setOrigin(0, 0.5);

    // Slider track background
    const trackBg = this.add.rectangle(
      50,
      0,
      sliderWidth,
      sliderHeight,
      Phaser.Display.Color.HexStringToColor(UI_COLORS.backgroundDark).color
    );
    trackBg.setStrokeStyle(2, Phaser.Display.Color.HexStringToColor('#333333').color);

    // Slider fill
    const fill = this.add.rectangle(
      50 - sliderWidth / 2,
      0,
      0,
      sliderHeight - 4,
      Phaser.Display.Color.HexStringToColor(UI_COLORS.primary).color
    );
    fill.setOrigin(0, 0.5);

    // Step markers
    const stepMarkers: Phaser.GameObjects.Rectangle[] = [];
    for (let i = 0; i < VOLUME_STEPS.length; i++) {
      const stepX = 50 - sliderWidth / 2 + (sliderWidth * i) / (VOLUME_STEPS.length - 1);
      const marker = this.add.rectangle(
        stepX,
        0,
        4,
        sliderHeight + 8,
        Phaser.Display.Color.HexStringToColor('#555555').color
      );
      stepMarkers.push(marker);
    }

    // Handle
    const handle = this.add.circle(
      50 - sliderWidth / 2,
      0,
      handleSize / 2,
      Phaser.Display.Color.HexStringToColor(UI_COLORS.primary).color
    );
    handle.setStrokeStyle(3, Phaser.Display.Color.HexStringToColor(UI_COLORS.primaryDark).color);

    // Value display
    const valueText = this.add.text(
      50 + sliderWidth / 2 + 40,
      0,
      '0%',
      {
        fontFamily: UI_TYPOGRAPHY.fontFamily,
        fontSize: UI_TYPOGRAPHY.sizeSmall,
        color: UI_COLORS.textAccent,
        align: 'center',
      }
    );
    valueText.setOrigin(0, 0.5);

    container.add([trackBg, fill, ...stepMarkers, handle, labelText, valueText]);

    // Update function
    const updateValue = (value: number) => {
      const clampedValue = Math.max(0, Math.min(1, value));
      const handleX = 50 - sliderWidth / 2 + sliderWidth * clampedValue;
      handle.setX(handleX);
      fill.setDisplaySize(sliderWidth * clampedValue, sliderHeight - 4);
      valueText.setText(`${Math.round(clampedValue * 100)}%`);
    };

    // Set initial value
    updateValue(initialValue);

    // Make track interactive for clicking
    trackBg.setInteractive({ useHandCursor: true });

    trackBg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const localX = pointer.x - (x + 50 - sliderWidth / 2);
      const ratio = Math.max(0, Math.min(1, localX / sliderWidth));

      // Snap to nearest step
      const nearestStepIndex = VOLUME_STEPS.reduce((prev, curr, idx) =>
        Math.abs(curr - ratio) < Math.abs(VOLUME_STEPS[prev] - ratio) ? idx : prev, 0);
      const snappedValue = VOLUME_STEPS[nearestStepIndex];

      updateValue(snappedValue);
      onChange(snappedValue);
      this.tryPlaySound('ui_click_sfx', 0.3);
    });

    // Add step buttons for easier control
    for (let i = 0; i < VOLUME_STEPS.length; i++) {
      const stepValue = VOLUME_STEPS[i];
      const stepX = 50 - sliderWidth / 2 + (sliderWidth * i) / (VOLUME_STEPS.length - 1);

      const hitArea = this.add.rectangle(stepX, 0, sliderWidth / VOLUME_STEPS.length, sliderHeight + 20, 0x000000, 0);
      hitArea.setInteractive({ useHandCursor: true });
      container.add(hitArea);

      hitArea.on('pointerdown', () => {
        updateValue(stepValue);
        onChange(stepValue);
        this.tryPlaySound('ui_click_sfx', 0.3);
      });
    }

    return { container, updateValue };
  }

  /**
   * Creates a mute toggle checkbox
   */
  private createMuteToggle(
    x: number,
    y: number,
    initialState: boolean,
    onChange: (muted: boolean) => void
  ): { container: Phaser.GameObjects.Container; updateState: (muted: boolean) => void } {
    const container = this.add.container(x, y);

    const checkboxSize = 40;
    let isMuted = initialState;

    // Label
    const label = this.add.text(
      -100,
      0,
      'MUTE ALL',
      {
        fontFamily: UI_TYPOGRAPHY.fontFamily,
        fontSize: UI_TYPOGRAPHY.sizeMedium,
        color: UI_COLORS.textSecondary,
        align: 'left',
      }
    );
    label.setOrigin(0, 0.5);

    // Checkbox background
    const checkboxBg = this.add.rectangle(
      80,
      0,
      checkboxSize,
      checkboxSize,
      Phaser.Display.Color.HexStringToColor(UI_COLORS.backgroundDark).color
    );
    checkboxBg.setStrokeStyle(
      3,
      Phaser.Display.Color.HexStringToColor(UI_COLORS.primary).color
    );

    // Checkmark (X for muted)
    const checkmark = this.add.text(
      80,
      0,
      'X',
      {
        fontFamily: UI_TYPOGRAPHY.fontFamily,
        fontSize: UI_TYPOGRAPHY.sizeLarge,
        color: UI_COLORS.danger,
        align: 'center',
      }
    );
    checkmark.setOrigin(0.5, 0.5);
    checkmark.setVisible(isMuted);

    // Status text
    const statusText = this.add.text(
      140,
      0,
      isMuted ? 'ON' : 'OFF',
      {
        fontFamily: UI_TYPOGRAPHY.fontFamily,
        fontSize: UI_TYPOGRAPHY.sizeSmall,
        color: isMuted ? UI_COLORS.danger : UI_COLORS.success,
        align: 'left',
      }
    );
    statusText.setOrigin(0, 0.5);

    container.add([label, checkboxBg, checkmark, statusText]);

    // Update function
    const updateState = (muted: boolean) => {
      isMuted = muted;
      checkmark.setVisible(isMuted);
      statusText.setText(isMuted ? 'ON' : 'OFF');
      statusText.setColor(isMuted ? UI_COLORS.danger : UI_COLORS.success);
    };

    // Make checkbox interactive
    checkboxBg.setInteractive({ useHandCursor: true });

    checkboxBg.on('pointerover', () => {
      checkboxBg.setStrokeStyle(
        4,
        Phaser.Display.Color.HexStringToColor(UI_COLORS.textAccent).color
      );
    });

    checkboxBg.on('pointerout', () => {
      checkboxBg.setStrokeStyle(
        3,
        Phaser.Display.Color.HexStringToColor(UI_COLORS.primary).color
      );
    });

    checkboxBg.on('pointerdown', () => {
      isMuted = !isMuted;
      updateState(isMuted);
      onChange(isMuted);
      this.tryPlaySound('ui_click_sfx', 0.5);
    });

    return { container, updateState };
  }

  /**
   * Creates the back button
   */
  private createBackButton(): void {
    const x = CANVAS.width / 2;
    const y = CANVAS.height - 80;

    const container = this.add.container(x, y);

    // Button background
    const bg = this.add.image(0, 0, 'ui_button_rectangle');
    bg.setScale(1.8);
    bg.setTint(Phaser.Display.Color.HexStringToColor(UI_COLORS.secondary).color);

    // Button text
    const text = this.add.text(0, 0, 'BACK TO MENU', {
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
   * Apply current audio settings to Phaser sound manager
   */
  private applyAudioSettings(): void {
    const gameState = getGameState();

    // Set global mute state
    this.sound.mute = gameState.isMuted;

    // Note: Individual sound volumes are applied when playing sounds
    // The global volume affects all sounds equally
    // For granular control, we apply volumes when playing each sound

    console.log(`🎵 Audio settings applied - Mute: ${gameState.isMuted}, Music: ${gameState.musicVolume}, SFX: ${gameState.sfxVolume}`);
  }

  /**
   * Safely play a sound effect
   * Respects GameState volume and mute settings
   */
  private tryPlaySound(key: string, volume: number = 1): void {
    try {
      const gameState = getGameState();
      const cacheExists = this.cache.audio.exists(key);
      console.log(`SFX request: ${key} cache=${cacheExists} locked=${this.sound.locked} mute=${this.sound.mute} volume=${this.sound.volume.toFixed(2)} settings(muted=${gameState.isMuted} sfx=${gameState.sfxVolume.toFixed(2)}) base=${volume.toFixed(2)}`);

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

      const played = this.sound.play(key, { volume: finalVolume });
      console.log(`SFX play() called: ${key} played=${played} effectiveVolume=${finalVolume.toFixed(2)}`);
    } catch (e) {
      console.warn(`⚠️ Could not play ${key}:`, e);
    }
  }
}
