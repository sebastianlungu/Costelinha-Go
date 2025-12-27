/**
 * AudioManager - Centralized audio system that guarantees Chrome AudioContext is RUNNING
 * before any sound plays.
 *
 * Root cause of Chrome audio issues:
 * - AudioContext starts in 'suspended' state until user interaction
 * - Phaser's sound.locked can become FALSE while context.state is still 'suspended'
 * - Play calls that happen during this race window are silently dropped
 *
 * Solution:
 * - Queue all play() calls until AudioContext.state === 'running' is verified
 * - Flush the queue once unlock is confirmed
 * - Provide a single source of truth for audio readiness
 */

import Phaser from 'phaser';
import { getGameState } from '../state/GameState';

// Queued sound to play once audio is ready
interface QueuedSound {
  key: string;
  volume: number;
  loop: boolean;
  isMusic: boolean;
}

class AudioManagerClass {
  private static instance: AudioManagerClass;
  private soundManager: Phaser.Sound.BaseSoundManager | null = null;
  private cache: Phaser.Cache.CacheManager | null = null;
  private isAudioReady: boolean = false;
  private pendingSounds: QueuedSound[] = [];
  private hasLoggedReady: boolean = false;
  private unlockPromise: Promise<void> | null = null;
  private activeMusicKey: string | null = null;
  private activeMusicInstance: Phaser.Sound.BaseSound | null = null;

  private constructor() {
    // Singleton - use getInstance()
  }

  public static getInstance(): AudioManagerClass {
    if (!AudioManagerClass.instance) {
      AudioManagerClass.instance = new AudioManagerClass();
    }
    return AudioManagerClass.instance;
  }

  /**
   * Initialize with Phaser's sound manager. Call this once from BootScene.create().
   */
  public init(soundManager: Phaser.Sound.BaseSoundManager): void {
    this.soundManager = soundManager;
    this.cache = soundManager.game.cache;
    this.isAudioReady = false;
    this.hasLoggedReady = false;

    const audioContext = (soundManager as any).context as AudioContext | undefined;
    console.log(`[AudioManager] init - locked: ${soundManager.locked}, context.state: ${audioContext?.state || 'N/A'}`);

    // Check if already running (rare but possible)
    if (audioContext && audioContext.state === 'running') {
      this.markAudioReady();
      return;
    }

    // Setup unlock detection
    this.setupUnlockListeners(soundManager, audioContext);
  }

  /**
   * Sets up listeners for audio unlock events
   */
  private setupUnlockListeners(
    soundManager: Phaser.Sound.BaseSoundManager,
    audioContext: AudioContext | undefined
  ): void {
    // Listen to Phaser's unlock event
    soundManager.once('unlocked', () => {
      console.log('[AudioManager] Phaser unlocked event received');
      this.verifyAndUnlock(audioContext);
    });

    // If Phaser says it's not locked, still verify AudioContext
    if (!soundManager.locked && audioContext) {
      console.log('[AudioManager] Phaser not locked, verifying AudioContext...');
      this.verifyAndUnlock(audioContext);
    }
  }

  /**
   * Verifies AudioContext is actually running, resumes if needed, then marks ready
   */
  private async verifyAndUnlock(audioContext: AudioContext | undefined): Promise<void> {
    if (this.isAudioReady) return;

    if (!audioContext) {
      console.warn('[AudioManager] No AudioContext available');
      this.markAudioReady(); // Proceed anyway (WebAudio not supported)
      return;
    }

    if (audioContext.state === 'running') {
      this.markAudioReady();
      return;
    }

    if (audioContext.state === 'suspended') {
      console.log('[AudioManager] AudioContext suspended, attempting resume...');
      try {
        await audioContext.resume();
        console.log(`[AudioManager] AudioContext resumed, state: ${audioContext.state}`);

        if (audioContext.state === 'running') {
          this.markAudioReady();
        } else {
          console.warn(`[AudioManager] AudioContext still not running: ${audioContext.state}`);
          // Try again on next interaction
          this.setupInteractionFallback(audioContext);
        }
      } catch (err) {
        console.error('[AudioManager] Failed to resume AudioContext:', err);
        this.setupInteractionFallback(audioContext);
      }
    }
  }

  /**
   * Sets up a fallback to unlock on any user interaction
   */
  private setupInteractionFallback(audioContext: AudioContext): void {
    const unlockOnInteraction = async () => {
      if (this.isAudioReady) return;

      console.log('[AudioManager] Fallback interaction detected, resuming AudioContext...');
      try {
        await audioContext.resume();
        if (audioContext.state === 'running') {
          this.markAudioReady();
          document.removeEventListener('pointerdown', unlockOnInteraction);
          document.removeEventListener('keydown', unlockOnInteraction);
        }
      } catch (err) {
        console.error('[AudioManager] Fallback resume failed:', err);
      }
    };

    document.addEventListener('pointerdown', unlockOnInteraction, { once: false });
    document.addEventListener('keydown', unlockOnInteraction, { once: false });
    console.log('[AudioManager] Fallback interaction listeners registered');
  }

  /**
   * Marks audio as ready and flushes pending sounds
   */
  private markAudioReady(): void {
    if (this.isAudioReady) return;

    this.isAudioReady = true;

    if (!this.hasLoggedReady) {
      console.log('[AudioManager] AudioContext RUNNING - audio ready!');
      this.hasLoggedReady = true;
    }

    // Flush pending sounds
    if (this.pendingSounds.length > 0) {
      console.log(`[AudioManager] Flushing ${this.pendingSounds.length} queued sounds`);
      const toPlay = [...this.pendingSounds];
      this.pendingSounds = [];

      for (const sound of toPlay) {
        if (sound.isMusic) {
          this.playMusicInternal(sound.key, sound.volume, sound.loop);
        } else {
          this.playSfxInternal(sound.key, sound.volume);
        }
      }
    }
  }

  /**
   * Attempts to unlock audio immediately (call this on first user interaction)
   */
  public async tryUnlock(): Promise<boolean> {
    if (this.isAudioReady) return true;
    if (!this.soundManager) return false;

    const audioContext = (this.soundManager as any).context as AudioContext | undefined;
    if (!audioContext) return false;

    try {
      await audioContext.resume();
      if (audioContext.state === 'running') {
        this.markAudioReady();
        return true;
      }
    } catch (err) {
      console.error('[AudioManager] tryUnlock failed:', err);
    }
    return false;
  }

  /**
   * Returns true if audio is ready to play
   */
  public get ready(): boolean {
    return this.isAudioReady;
  }

  /**
   * Play a sound effect. Queues if audio not ready yet.
   * Respects GameState volume and mute settings.
   */
  public playSfx(key: string, baseVolume: number = 1): void {
    const gameState = getGameState();
    const cacheExists = this.cache?.audio.exists(key) ?? false;
    const locked = this.soundManager?.locked ?? false;
    const mute = this.soundManager?.mute ?? false;
    const globalVolume = this.soundManager?.volume ?? 1;

    console.log(`[AudioManager] SFX request: ${key} cache=${cacheExists} locked=${locked} mute=${mute} volume=${globalVolume.toFixed(2)} base=${baseVolume.toFixed(2)} settings(muted=${gameState.isMuted} sfx=${gameState.sfxVolume.toFixed(2)}) ready=${this.isAudioReady}`);

    if (!cacheExists) {
      const message = `[AudioManager] Missing audio key: ${key}`;
      console.error(message);
      if (import.meta.env.DEV) {
        throw new Error(message);
      }
      return;
    }

    // Check if muted
    if (gameState.isMuted) {
      return;
    }

    // Apply volume settings
    const finalVolume = baseVolume * gameState.sfxVolume;
    if (finalVolume <= 0) {
      return;
    }

    if (!this.isAudioReady) {
      console.log(`[AudioManager] Queueing SFX: ${key} (audio not ready)`);
      this.pendingSounds.push({ key, volume: finalVolume, loop: false, isMusic: false });
      return;
    }

    this.playSfxInternal(key, finalVolume);
  }

  /**
   * Internal SFX play (after ready check)
   */
  private playSfxInternal(key: string, volume: number): void {
    if (!this.soundManager) {
      console.warn('[AudioManager] No sound manager available');
      return;
    }

    try {
      this.soundManager.play(key, { volume });
      console.log(`[AudioManager] SFX played: ${key} @ ${volume.toFixed(2)}`);
    } catch (err) {
      console.warn(`[AudioManager] Failed to play SFX ${key}:`, err);
    }
  }

  /**
   * Play music. Queues if audio not ready yet.
   * Respects GameState volume and mute settings.
   */
  public playMusic(key: string, baseVolume: number = 0.35, loop: boolean = true): void {
    const gameState = getGameState();
    const cacheExists = this.cache?.audio.exists(key) ?? false;
    const locked = this.soundManager?.locked ?? false;
    const mute = this.soundManager?.mute ?? false;
    const globalVolume = this.soundManager?.volume ?? 1;

    console.log(`[AudioManager] Music request: ${key} cache=${cacheExists} locked=${locked} mute=${mute} volume=${globalVolume.toFixed(2)} base=${baseVolume.toFixed(2)} settings(muted=${gameState.isMuted} music=${gameState.musicVolume.toFixed(2)}) ready=${this.isAudioReady}`);

    if (!cacheExists) {
      const message = `[AudioManager] Missing audio key: ${key}`;
      console.error(message);
      if (import.meta.env.DEV) {
        throw new Error(message);
      }
      return;
    }

    // Check if muted
    if (gameState.isMuted) {
      console.log(`[AudioManager] Music skipped (muted): ${key}`);
      return;
    }

    // Apply volume settings
    const finalVolume = baseVolume * gameState.musicVolume;

    if (!this.isAudioReady) {
      console.log(`[AudioManager] Queueing music: ${key} (audio not ready)`);
      this.pendingSounds.push({ key, volume: finalVolume, loop, isMusic: true });
      this.activeMusicKey = key; // Track intent to play
      return;
    }

    this.playMusicInternal(key, finalVolume, loop);
  }

  /**
   * Internal music play (after ready check)
   */
  private playMusicInternal(key: string, volume: number, loop: boolean): void {
    if (!this.soundManager) {
      console.warn('[AudioManager] No sound manager available');
      return;
    }

    // Stop any currently playing music first
    this.stopMusic();

    try {
      this.activeMusicInstance = this.soundManager.add(key, { loop, volume });
      this.activeMusicInstance.play();
      this.activeMusicKey = key;
      console.log(`[AudioManager] Music playing: ${key} @ ${volume.toFixed(2)} (loop: ${loop})`);
    } catch (err) {
      console.warn(`[AudioManager] Failed to play music ${key}:`, err);
      this.activeMusicInstance = null;
      this.activeMusicKey = null;
    }
  }

  /**
   * Stop currently playing music
   */
  public stopMusic(): void {
    if (this.activeMusicInstance) {
      try {
        this.activeMusicInstance.stop();
        this.activeMusicInstance.destroy();
        console.log(`[AudioManager] Music stopped: ${this.activeMusicKey}`);
      } catch (err) {
        console.warn('[AudioManager] Error stopping music:', err);
      }
      this.activeMusicInstance = null;
    }
    this.activeMusicKey = null;

    // Also remove from pending queue
    this.pendingSounds = this.pendingSounds.filter(s => !s.isMusic);
  }

  /**
   * Check if specific music is currently playing
   */
  public isMusicPlaying(key?: string): boolean {
    if (!this.activeMusicInstance) return false;
    if (key && this.activeMusicKey !== key) return false;
    return this.activeMusicInstance.isPlaying;
  }

  /**
   * Update music volume (for settings changes)
   */
  public updateMusicVolume(): void {
    if (!this.activeMusicInstance) return;

    const gameState = getGameState();
    if (gameState.isMuted) {
      this.activeMusicInstance.setVolume(0);
    } else {
      // Use a base volume and apply music volume multiplier
      const baseVolume = 0.35;
      this.activeMusicInstance.setVolume(baseVolume * gameState.musicVolume);
    }
  }

  /**
   * Get debug info about audio state
   */
  public getDebugInfo(): string {
    const ctx = this.soundManager ? (this.soundManager as any).context as AudioContext | undefined : undefined;
    return `ready: ${this.isAudioReady}, pending: ${this.pendingSounds.length}, context: ${ctx?.state || 'N/A'}, locked: ${this.soundManager?.locked ?? 'N/A'}`;
  }
}

// Export singleton instance
export const AudioManager = AudioManagerClass.getInstance();
