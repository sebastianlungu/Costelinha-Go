import Phaser from 'phaser';
import { COLLECTIBLES } from '../config/gameConfig';

export class Score extends Phaser.Events.EventEmitter {
  private _score: number = 0;
  private _totalBones: number;

  constructor() {
    super();
    this._totalBones = COLLECTIBLES.count;
  }

  get score(): number {
    return this._score;
  }

  get totalBones(): number {
    return this._totalBones;
  }

  public addScore(points: number) {
    this._score += points;
    this.emit('score-changed', this._score, this._totalBones);
  }

  public reset() {
    this._score = 0;
    this.emit('score-changed', this._score, this._totalBones);
  }
}
