/**
 * Level 3: Moving Platforms (Desert)
 *
 * Focus: Introduction to moving platforms
 * Features: 3 slow horizontal moving platforms
 * Goal: Collect all 10 bones
 * Theme: Desert - sandy and warm
 */

import { LevelDefinition } from '../LevelDefinitions';

export const level3: LevelDefinition = {
  levelIndex: 3,
  levelName: 'Desert Crossing',
  theme: 'desert',

  playerSpawn: { x: 80, y: 550 },

  // Platforms with gaps that require moving platforms
  platforms: [
    // Starting platform (left)
    { x: 0, y: 650, width: 250, height: 70 },

    // Island platforms (require moving platforms to reach)
    { x: 500, y: 550, width: 180, height: 20 },
    { x: 900, y: 450, width: 200, height: 20 },

    // End platform (right)
    { x: 1050, y: 650, width: 230, height: 70 },
  ],

  // 3 slow horizontal moving platforms
  movingPlatforms: [
    // First crossing (low, long range)
    { x: 250, y: 580, width: 120, axis: 'x', range: 200, speed: 80 },

    // Second crossing (medium height)
    { x: 680, y: 500, width: 120, axis: 'x', range: 180, speed: 70 },

    // Third crossing (higher, to final area)
    { x: 800, y: 380, width: 120, axis: 'x', range: 200, speed: 90 },
  ],

  oneWayPlatforms: [],

  // 10 bones - some on moving platforms, some on static
  bones: [
    // Starting area
    { x: 120, y: 620 },
    { x: 200, y: 620 },

    // First island
    { x: 540, y: 520 },
    { x: 620, y: 520 },

    // Second island
    { x: 950, y: 420 },
    { x: 1020, y: 420 },

    // End area
    { x: 1100, y: 620 },
    { x: 1180, y: 620 },

    // On/near moving platforms (require timing)
    { x: 350, y: 550 },
    { x: 880, y: 350 },
  ],

  // One heart in a tricky spot
  hearts: [
    { x: 590, y: 380 },
  ],

  // Light enemy presence
  enemies: [
    { type: 'groundPatrol', x: 590, y: 520, params: { patrolDistance: 100 } },
  ],

  completionGoal: 'collectAllBones',
};
