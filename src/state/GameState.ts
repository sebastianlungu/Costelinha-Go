/**
 * GameState.ts - Singleton managing persistent game state across scenes
 *
 * Handles:
 * - Player HP (persists across levels, resets on new run)
 * - Level progression (unlock tracking)
 * - Settings (volume, mute) with localStorage persistence
 */

// Settings interface
export interface GameSettings {
  musicVolume: number; // 0.0 - 1.0
  sfxVolume: number; // 0.0 - 1.0
  mute: boolean;
}

// LocalStorage key
const STORAGE_KEY = 'costelinha_game_state';

// Saved state interface (what gets persisted to localStorage)
interface SavedState {
  highestUnlockedLevel: number;
  settings: GameSettings;
}

/**
 * GameState Singleton
 * Access via GameState.getInstance()
 */
export class GameState {
  private static instance: GameState;

  // HP state (resets on new run, persists across levels within a run)
  private _currentHP: number = 5;
  private _maxHP: number = 5;
  private _levelStartHP: number = 5; // Checkpoint HP for restart

  // Level progression
  private _highestUnlockedLevel: number = 1;
  private _selectedLevelIndex: number = 1;

  // Settings
  private _settings: GameSettings = {
    musicVolume: 0.5,
    sfxVolume: 0.7,
    mute: false,
  };

  private constructor() {
    // Load saved state from localStorage
    this.load();
    console.log('⚙️ GameState initialized', {
      hp: this._currentHP,
      unlockedLevel: this._highestUnlockedLevel,
      settings: this._settings,
    });
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): GameState {
    if (!GameState.instance) {
      GameState.instance = new GameState();
    }
    return GameState.instance;
  }

  // ==========================================================================
  // HP MANAGEMENT
  // ==========================================================================

  get currentHP(): number {
    return this._currentHP;
  }

  get maxHP(): number {
    return this._maxHP;
  }

  /**
   * Take damage (reduce HP)
   * @returns true if still alive, false if dead (HP = 0)
   */
  takeDamage(amount: number = 1): boolean {
    this._currentHP = Math.max(0, this._currentHP - amount);
    console.log(`🐕 Player took ${amount} damage. HP: ${this._currentHP}/${this._maxHP}`);
    return this._currentHP > 0;
  }

  /**
   * Heal HP (from heart pickups)
   * @returns actual amount healed (may be less if at cap)
   */
  heal(amount: number = 1): number {
    const oldHP = this._currentHP;
    this._currentHP = Math.min(this._maxHP, this._currentHP + amount);
    const healed = this._currentHP - oldHP;
    if (healed > 0) {
      console.log(`🐕 Player healed ${healed} HP. HP: ${this._currentHP}/${this._maxHP}`);
    }
    return healed;
  }

  /**
   * Reset HP to max (for new run)
   */
  resetHP(): void {
    this._currentHP = this._maxHP;
    this._levelStartHP = this._maxHP;
    console.log(`🐕 HP reset to ${this._maxHP}`);
  }

  /**
   * Save current HP as checkpoint (called when starting a level)
   */
  saveLevelCheckpoint(): void {
    this._levelStartHP = this._currentHP;
    console.log(`🐕 Level checkpoint saved. HP: ${this._levelStartHP}`);
  }

  /**
   * Restore HP to level start (for restart level)
   */
  restoreLevelCheckpoint(): void {
    this._currentHP = this._levelStartHP;
    console.log(`🐕 HP restored to checkpoint. HP: ${this._currentHP}`);
  }

  // ==========================================================================
  // LEVEL PROGRESSION
  // ==========================================================================

  get highestUnlockedLevel(): number {
    return this._highestUnlockedLevel;
  }

  get selectedLevelIndex(): number {
    return this._selectedLevelIndex;
  }

  set selectedLevelIndex(level: number) {
    if (level >= 1 && level <= 10) {
      this._selectedLevelIndex = level;
      console.log(`⚙️ Selected level: ${level}`);
    }
  }

  /**
   * Check if a level is unlocked
   */
  isLevelUnlocked(levelIndex: number): boolean {
    return levelIndex <= this._highestUnlockedLevel;
  }

  /**
   * Unlock the next level (called on level completion)
   */
  unlockNextLevel(): void {
    if (this._selectedLevelIndex >= this._highestUnlockedLevel && this._highestUnlockedLevel < 10) {
      this._highestUnlockedLevel++;
      console.log(`⚙️ Unlocked level ${this._highestUnlockedLevel}`);
      this.save();
    }
  }

  /**
   * Start a new run (reset HP, optionally start from level 1)
   */
  startNewRun(fromLevel: number = 1): void {
    this.resetHP();
    this._selectedLevelIndex = fromLevel;
    console.log(`⚙️ New run started from level ${fromLevel}`);
  }

  // ==========================================================================
  // SETTINGS
  // ==========================================================================

  get settings(): GameSettings {
    return { ...this._settings };
  }

  get musicVolume(): number {
    return this._settings.mute ? 0 : this._settings.musicVolume;
  }

  get sfxVolume(): number {
    return this._settings.mute ? 0 : this._settings.sfxVolume;
  }

  get isMuted(): boolean {
    return this._settings.mute;
  }

  /**
   * Set music volume (0.0 - 1.0)
   */
  setMusicVolume(volume: number): void {
    this._settings.musicVolume = Math.max(0, Math.min(1, volume));
    console.log(`🎵 Music volume: ${Math.round(this._settings.musicVolume * 100)}%`);
    this.save();
  }

  /**
   * Set SFX volume (0.0 - 1.0)
   */
  setSfxVolume(volume: number): void {
    this._settings.sfxVolume = Math.max(0, Math.min(1, volume));
    console.log(`🎵 SFX volume: ${Math.round(this._settings.sfxVolume * 100)}%`);
    this.save();
  }

  /**
   * Toggle mute state
   */
  toggleMute(): boolean {
    this._settings.mute = !this._settings.mute;
    console.log(`🎵 Mute: ${this._settings.mute ? 'ON' : 'OFF'}`);
    this.save();
    return this._settings.mute;
  }

  /**
   * Set mute state directly
   */
  setMute(muted: boolean): void {
    this._settings.mute = muted;
    console.log(`🎵 Mute: ${this._settings.mute ? 'ON' : 'OFF'}`);
    this.save();
  }

  // ==========================================================================
  // PERSISTENCE (localStorage)
  // ==========================================================================

  /**
   * Save state to localStorage
   */
  save(): void {
    try {
      const state: SavedState = {
        highestUnlockedLevel: this._highestUnlockedLevel,
        settings: this._settings,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      console.log('⚙️ GameState saved to localStorage');
    } catch (e) {
      console.warn('⚠️ Could not save to localStorage:', e);
    }
  }

  /**
   * Load state from localStorage
   */
  load(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state: SavedState = JSON.parse(saved);

        // Restore level progression
        if (typeof state.highestUnlockedLevel === 'number') {
          this._highestUnlockedLevel = Math.max(1, Math.min(10, state.highestUnlockedLevel));
        }

        // Restore settings
        if (state.settings) {
          if (typeof state.settings.musicVolume === 'number') {
            this._settings.musicVolume = Math.max(0, Math.min(1, state.settings.musicVolume));
          }
          if (typeof state.settings.sfxVolume === 'number') {
            this._settings.sfxVolume = Math.max(0, Math.min(1, state.settings.sfxVolume));
          }
          if (typeof state.settings.mute === 'boolean') {
            this._settings.mute = state.settings.mute;
          }
        }

        console.log('⚙️ GameState loaded from localStorage');
      }
    } catch (e) {
      console.warn('⚠️ Could not load from localStorage:', e);
    }
  }

  /**
   * Clear all saved data (for debugging/testing)
   */
  clearSavedData(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      this._highestUnlockedLevel = 1;
      this._settings = {
        musicVolume: 0.5,
        sfxVolume: 0.7,
        mute: false,
      };
      this.resetHP();
      console.log('⚙️ GameState cleared');
    } catch (e) {
      console.warn('⚠️ Could not clear localStorage:', e);
    }
  }
}

// Export singleton getter for convenience
export const getGameState = () => GameState.getInstance();
