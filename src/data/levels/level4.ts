/**
 * Level 4: One-Way Platforms (Snow)
 *
 * Focus: Layered pass-through platforms, vertical movement
 * Features: One-way platforms player can jump through from below
 * Goal: Collect all 12 bones
 * Theme: Snow - icy and slippery feel
 */

import { LevelDefinition } from '../LevelDefinitions';

export const level4: LevelDefinition = {
  levelIndex: 4,
  levelName: 'Frosty Heights',
  theme: 'snow',

  playerSpawn: { x: 100, y: 550 },

  // Ground and side walls
  platforms: [
    // Ground platform (full width)
    { x: 0, y: 650, width: 1280, height: 70 },

    // Solid corner platforms
    { x: 0, y: 450, width: 150, height: 20 },
    { x: 1130, y: 450, width: 150, height: 20 },
    { x: 0, y: 250, width: 150, height: 20 },
    { x: 1130, y: 250, width: 150, height: 20 },
  ],

  movingPlatforms: [],

  // Layered one-way platforms in the center
  oneWayPlatforms: [
    // Bottom layer
    { x: 250, y: 550, width: 200 },
    { x: 550, y: 550, width: 200 },
    { x: 850, y: 550, width: 200 },

    // Middle layer (offset)
    { x: 150, y: 450, width: 200 },
    { x: 450, y: 450, width: 200 },
    { x: 750, y: 450, width: 200 },

    // Upper middle layer
    { x: 300, y: 350, width: 200 },
    { x: 600, y: 350, width: 200 },
    { x: 900, y: 350, width: 150 },

    // Top layer
    { x: 450, y: 250, width: 200 },
    { x: 750, y: 250, width: 150 },
  ],

  // 12 bones spread across vertical layers
  bones: [
    // Ground level
    { x: 640, y: 620 },

    // Bottom layer
    { x: 350, y: 520 },
    { x: 650, y: 470 },
    { x: 950, y: 520 },

    // Middle layer
    { x: 250, y: 420 },
    { x: 550, y: 420 },
    { x: 850, y: 420 },

    // Upper middle
    { x: 400, y: 320 },
    { x: 700, y: 320 },
    { x: 975, y: 320 },

    // Top layer
    { x: 550, y: 220 },
    { x: 825, y: 220 },
  ],

  hearts: [
    // Heart at the very top (reward for climbing)
    { x: 640, y: 150 },
  ],

  // Hoppers on some platforms
  enemies: [
    { type: 'hopper', x: 650, y: 520, params: { hopHeight: 80 } },
    { type: 'hopper', x: 550, y: 320, params: { hopHeight: 60 } },
  ],

  completionGoal: 'collectAllBones',
};
