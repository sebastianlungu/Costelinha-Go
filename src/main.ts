import Phaser from 'phaser';
import { CANVAS, PHYSICS } from './config/gameConfig';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { HudScene } from './scenes/HudScene';

console.log('🎮 Costelinha Runner starting...');

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: CANVAS.width,
  height: CANVAS.height,
  backgroundColor: CANVAS.backgroundColor,
  parent: 'game',
  pixelArt: true, // Enable crisp pixel art rendering (nearest-neighbor filtering)
  audio: {
    // Use WebAudio (default) - it's more reliable and has better features
    // The audio unlock is now handled properly via Phaser's 'unlocked' event in scenes
    // HTML5 Audio fallback can have issues with looping and volume control
    disableWebAudio: false,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: PHYSICS.gravity, x: 0 },
      debug: PHYSICS.debugShowBody,
    },
  },
  scene: [BootScene, MenuScene, GameScene, HudScene],
};

const game = new Phaser.Game(config);

console.log('✅ Phaser game instance created');
