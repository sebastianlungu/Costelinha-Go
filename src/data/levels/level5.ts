/**
 * Level 5: Precision Chain (Cave)
 *
 * Focus: Small micro-platforms requiring precise jumping
 * Features: Narrow platforms (100-120px), careful timing
 * Goal: Collect all 10 bones
 * Theme: Cave - dark and tense atmosphere
 */

import { LevelDefinition } from '../LevelDefinitions';

export const level5: LevelDefinition = {
  levelIndex: 5,
  levelName: 'Crystal Caverns',
  theme: 'cave',

  playerSpawn: { x: 80, y: 550 },

  // Micro-platforms in a chain pattern
  platforms: [
    // Starting safe area
    { x: 0, y: 650, width: 200, height: 70 },

    // Precision chain - small platforms
    { x: 250, y: 580, width: 100, height: 20 },
    { x: 400, y: 520, width: 110, height: 20 },
    { x: 560, y: 460, width: 100, height: 20 },
    { x: 710, y: 400, width: 120, height: 20 },
    { x: 860, y: 340, width: 100, height: 20 },

    // Mid-level rest platform
    { x: 1000, y: 400, width: 180, height: 20 },

    // Descending chain
    { x: 880, y: 500, width: 100, height: 20 },
    { x: 720, y: 560, width: 110, height: 20 },

    // End platform
    { x: 1100, y: 650, width: 180, height: 70 },

    // Secret upper area
    { x: 1000, y: 250, width: 120, height: 20 },
    { x: 1150, y: 180, width: 130, height: 20 },
  ],

  movingPlatforms: [],
  oneWayPlatforms: [],

  // 10 bones - most require precision to collect
  bones: [
    // Starting area
    { x: 100, y: 620 },

    // Along the precision chain
    { x: 300, y: 550 },
    { x: 455, y: 490 },
    { x: 610, y: 430 },
    { x: 770, y: 370 },
    { x: 910, y: 310 },

    // Rest platform
    { x: 1090, y: 320 },

    // Descending
    { x: 930, y: 470 },
    { x: 775, y: 530 },

    // End area
    { x: 1180, y: 620 },
  ],

  // Heart in secret upper area
  hearts: [
    { x: 1215, y: 150 },
  ],

  // Light enemy presence (don't make precision harder)
  enemies: [
    { type: 'groundPatrol', x: 1090, y: 370, params: { patrolDistance: 100 } },
  ],

  completionGoal: 'collectAllBones',
};
