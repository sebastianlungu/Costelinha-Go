import Phaser from 'phaser';
import { CANVAS, PHYSICS } from './config/gameConfig';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';

console.log('🎮 Costelinha Runner starting...');

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: CANVAS.width,
  height: CANVAS.height,
  backgroundColor: CANVAS.backgroundColor,
  parent: 'game',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: PHYSICS.gravity, x: 0 },
      debug: PHYSICS.debugShowBody,
    },
  },
  scene: [BootScene, MenuScene],
};

const game = new Phaser.Game(config);

console.log('✅ Phaser game instance created');
