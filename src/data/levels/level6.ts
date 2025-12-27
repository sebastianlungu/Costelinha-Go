/**
 * Level 6: Vertical Shaft (Swamp)
 *
 * Focus: Narrow vertical climb with limited horizontal space
 * Features: Mixed platform types, upward progression
 * Goal: Collect all 12 bones
 * Theme: Swamp - murky and mysterious
 */

import { LevelDefinition } from '../LevelDefinitions';

export const level6: LevelDefinition = {
  levelIndex: 6,
  levelName: 'Murky Shaft',
  theme: 'swamp',

  playerSpawn: { x: 640, y: 600 },

  // Vertical shaft with limited horizontal space
  platforms: [
    // Base platform (center, narrow)
    { x: 450, y: 650, width: 380, height: 70 },

    // Left wall platforms
    { x: 350, y: 550, width: 150, height: 20 },
    { x: 320, y: 400, width: 140, height: 20 },
    { x: 380, y: 250, width: 130, height: 20 },

    // Right wall platforms
    { x: 780, y: 500, width: 150, height: 20 },
    { x: 820, y: 350, width: 140, height: 20 },
    { x: 760, y: 200, width: 130, height: 20 },

    // Top destination platform
    { x: 520, y: 120, width: 240, height: 20 },
  ],

  // Vertical moving platforms to help ascend
  movingPlatforms: [
    { x: 550, y: 580, width: 100, axis: 'y', range: 100, speed: 60 },
    { x: 620, y: 350, width: 100, axis: 'y', range: 80, speed: 50 },
  ],

  // One-way platforms for alternate routes
  oneWayPlatforms: [
    { x: 500, y: 480, width: 180 },
    { x: 530, y: 320, width: 160 },
    { x: 560, y: 180, width: 100 },
  ],

  // 12 bones scattered vertically
  bones: [
    // Base level
    { x: 550, y: 620 },
    { x: 730, y: 620 },

    // Lower section
    { x: 425, y: 470 },
    { x: 855, y: 470 },
    { x: 590, y: 450 },

    // Middle section
    { x: 390, y: 370 },
    { x: 890, y: 270 },
    { x: 610, y: 290 },

    // Upper section
    { x: 445, y: 220 },
    { x: 750, y: 250 },

    // Top platform (within jump reach)
    { x: 580, y: 220 },
    { x: 700, y: 220 },
  ],

  hearts: [
    { x: 640, y: 90 }, // At the top for reward
  ],

  enemies: [
    { type: 'hopper', x: 425, y: 520, params: { hopHeight: 70 } },
    { type: 'hopper', x: 890, y: 320, params: { hopHeight: 60 } },
    { type: 'groundPatrol', x: 640, y: 90, params: { patrolDistance: 140 } },
  ],

  completionGoal: 'collectAllBones',
};
