/**
 * Level 2: Zig-Zag Ascent (Forest)
 *
 * Focus: Alternating left/right platforms going up
 * Introduces: First enemies (1-2 simple GroundPatrol)
 * Goal: Collect all 13 bones
 * Theme: Forest - green and lush
 */

import { LevelDefinition } from '../LevelDefinitions';

export const level2: LevelDefinition = {
  levelIndex: 2,
  levelName: 'Forest Ascent',
  theme: 'forest',

  playerSpawn: { x: 100, y: 550 },

  // Zig-zag pattern ascending left to right
  platforms: [
    // Ground platform (partial - left side)
    { x: 0, y: 650, width: 400, height: 70 },

    // Zig-zag ascent
    { x: 100, y: 550, width: 150, height: 20 },  // Start left
    { x: 350, y: 480, width: 150, height: 20 },  // Move right
    { x: 150, y: 400, width: 150, height: 20 },  // Back left
    { x: 400, y: 320, width: 150, height: 20 },  // Right again
    { x: 180, y: 240, width: 150, height: 20 },  // Left
    { x: 450, y: 180, width: 180, height: 20 },  // Final right platform

    // Right side ground for exploration
    { x: 650, y: 650, width: 630, height: 70 },

    // Lower right platforms
    { x: 700, y: 520, width: 150, height: 20 },
    { x: 950, y: 450, width: 180, height: 20 },
  ],

  movingPlatforms: [],
  oneWayPlatforms: [],

  // 13 bones - above platforms to encourage jumping (12 + 1 bonus upper right)
  bones: [
    // Ground bones
    { x: 200, y: 620 },
    { x: 800, y: 620 },
    { x: 1000, y: 620 },

    // Zig-zag path bones (above platforms)
    { x: 175, y: 520 },
    { x: 425, y: 450 },
    { x: 225, y: 370 },
    { x: 475, y: 290 },
    { x: 255, y: 210 },
    { x: 540, y: 200 },

    // Right side platform bones
    { x: 775, y: 490 },
    { x: 1040, y: 420 },
    { x: 1150, y: 620 },

    // Upper right bonus bone (reachable from P8 at y=450)
    { x: 1100, y: 380 },
  ],

  hearts: [],

  // First enemies - simple ground patrols
  enemies: [
    { type: 'groundPatrol', x: 800, y: 620, params: { patrolDistance: 200 } },
    { type: 'groundPatrol', x: 1040, y: 420, params: { patrolDistance: 120 } },
  ],

  completionGoal: 'collectAllBones',
};
