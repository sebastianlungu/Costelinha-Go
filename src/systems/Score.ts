import Phaser from 'phaser';
import { COLLECTIBLES } from '../config/gameConfig';

// DEBUG flag for score tracking - set to true to log stack traces on score changes
const SCORE_DEBUG = false;

// Valid score sources - ONLY bones should modify score
type ScoreSource = 'bone';

export class Score extends Phaser.Events.EventEmitter {
  private _score: number = 0;
  private _totalBones: number;

  // Track score modification for assertions
  private _lastScoreChangeSource: ScoreSource | null = null;
  private _scoreChangeInProgress: boolean = false;

  constructor(totalBones?: number) {
    super();
    this._totalBones = totalBones ?? COLLECTIBLES.count;
  }

  /**
   * Set the total number of bones for this level
   */
  public setTotalBones(total: number): void {
    this._totalBones = total;
    this.emit('score-changed', this._score, this._totalBones);
  }

  get score(): number {
    return this._score;
  }

  get totalBones(): number {
    return this._totalBones;
  }

  /**
   * Add points to score - ONLY called from bone collection
   *
   * HARD GUARANTEE: This method includes runtime assertions to ensure
   * score is ONLY modified by bone collection, never by enemy damage.
   *
   * @param points - Points to add (should always be 1 for bones)
   * @param source - Source of score change (defaults to 'bone')
   */
  public addScore(points: number, source: ScoreSource = 'bone') {
    // RUNTIME ASSERTION: Verify source is valid (bones only)
    if (source !== 'bone') {
      console.error(`❌ SCORE INTEGRITY VIOLATION: Score modified by invalid source: "${source}"`);
      console.error(`   Expected: "bone", Got: "${source}"`);
      console.error(`   Points attempted: ${points}`);
      throw new Error(`Score can ONLY be modified by bones! Invalid source: ${source}`);
    }

    // DEBUG: Log stack trace to track where addScore is called from
    if (SCORE_DEBUG) {
      const stack = new Error().stack;
      console.log('⚙️ SCORE DEBUG - addScore called:');
      console.log(`   Points: ${points}`);
      console.log(`   Source: ${source}`);
      console.log(`   Stack trace:\n${stack}`);
    }

    // Mark that score change is in progress (for external assertions)
    this._scoreChangeInProgress = true;
    this._lastScoreChangeSource = source;

    const previousScore = this._score;
    this._score += points;

    console.log(`🍖 Score changed by: ${source} | ${previousScore} -> ${this._score}`);

    this.emit('score-changed', this._score, this._totalBones);

    // Mark score change complete
    this._scoreChangeInProgress = false;
  }

  /**
   * Check if score is currently being modified
   * Used for external assertions (e.g., in damage handlers)
   */
  public isScoreChanging(): boolean {
    return this._scoreChangeInProgress;
  }

  /**
   * Get the last source that modified the score
   */
  public getLastScoreSource(): ScoreSource | null {
    return this._lastScoreChangeSource;
  }

  /**
   * Get current score for assertion purposes
   * Used to verify score hasn't changed during non-bone operations
   */
  public getScoreSnapshot(): number {
    return this._score;
  }

  public reset() {
    this._score = 0;
    this.emit('score-changed', this._score, this._totalBones);
  }
}
