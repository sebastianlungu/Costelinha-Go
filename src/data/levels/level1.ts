/**
 * Level 1: Intro (Grasslands)
 *
 * Focus: Tutorial level - wide safe platforms, no enemies, no special mechanics
 * Goal: Collect all 10 bones spread across easy platforms
 * Theme: Grasslands - bright and welcoming
 */

import { LevelDefinition } from '../LevelDefinitions';

export const level1: LevelDefinition = {
  levelIndex: 1,
  levelName: 'Green Meadows',
  theme: 'grasslands',

  playerSpawn: { x: 100, y: 550 },

  // Wide, safe platforms with minimal gaps
  platforms: [
    // Ground platform (full width)
    { x: 0, y: 650, width: 1280, height: 70 },

    // Easy stepping stones - wide and close together
    { x: 180, y: 550, width: 200, height: 20 },
    { x: 450, y: 480, width: 180, height: 20 },
    { x: 700, y: 420, width: 200, height: 20 },
    { x: 950, y: 480, width: 180, height: 20 },
  ],

  // No moving platforms in intro level
  movingPlatforms: [],

  // No one-way platforms in intro level
  oneWayPlatforms: [],

  // 10 bones - spread out for easy collection
  bones: [
    // Ground level bones (easy to get)
    { x: 150, y: 620 },
    { x: 350, y: 620 },
    { x: 550, y: 620 },
    { x: 750, y: 620 },
    { x: 950, y: 620 },
    { x: 1150, y: 620 },

    // Platform bones (encourage jumping)
    { x: 280, y: 520 },
    { x: 540, y: 450 },
    { x: 800, y: 390 },
    { x: 1040, y: 450 },
  ],

  // No hearts needed in intro level
  hearts: [],

  // No enemies in intro level
  enemies: [],

  completionGoal: 'collectAllBones',
};
