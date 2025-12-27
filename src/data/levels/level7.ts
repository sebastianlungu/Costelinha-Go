/**
 * Level 7: Mixed Light (Beach)
 *
 * Focus: Combination of moving platforms and one-way platforms
 * Features: Balanced difficulty with variety
 * Goal: Collect all 12 bones
 * Theme: Beach - bright and tropical
 */

import { LevelDefinition } from '../LevelDefinitions';

export const level7: LevelDefinition = {
  levelIndex: 7,
  levelName: 'Tropical Shores',
  theme: 'beach',

  playerSpawn: { x: 100, y: 550 },

  platforms: [
    // Starting ground
    { x: 0, y: 650, width: 300, height: 70 },

    // Central static platforms
    { x: 500, y: 550, width: 180, height: 20 },
    { x: 600, y: 400, width: 200, height: 20 },

    // End ground
    { x: 980, y: 650, width: 300, height: 70 },

    // Upper platforms
    { x: 200, y: 300, width: 150, height: 20 },
    { x: 900, y: 280, width: 150, height: 20 },
  ],

  // Moving platform section (left side)
  movingPlatforms: [
    // Horizontal bridge
    { x: 300, y: 580, width: 120, axis: 'x', range: 160, speed: 80 },
    // Vertical elevator
    { x: 350, y: 500, width: 100, axis: 'y', range: 150, speed: 60 },
    // Upper horizontal
    { x: 400, y: 250, width: 110, axis: 'x', range: 180, speed: 70 },
  ],

  // One-way platform section (right side)
  oneWayPlatforms: [
    { x: 750, y: 550, width: 160 },
    { x: 780, y: 450, width: 150 },
    { x: 720, y: 350, width: 160 },
    { x: 800, y: 250, width: 140 },
  ],

  // 12 bones across both sections
  bones: [
    // Starting area
    { x: 150, y: 620 },
    { x: 250, y: 620 },

    // Moving platform section
    { x: 380, y: 550 },
    { x: 400, y: 380 },
    { x: 275, y: 270 },
    { x: 480, y: 220 },

    // Central area
    { x: 520, y: 520 },
    { x: 700, y: 320 },

    // One-way section
    { x: 830, y: 470 },
    { x: 855, y: 420 },
    { x: 800, y: 320 },

    // End area
    { x: 1080, y: 620 },
  ],

  hearts: [
    { x: 975, y: 250 }, // Reward for reaching upper right
  ],

  enemies: [
    { type: 'groundPatrol', x: 700, y: 370, params: { patrolDistance: 120 } },
    { type: 'flyer', x: 590, y: 480, params: { amplitude: 40, frequency: 1.5 } },
    { type: 'hopper', x: 830, y: 520, params: { hopHeight: 60 } },
  ],

  completionGoal: 'collectAllBones',
};
