/**
 * Level 8: Patrol Lanes (Industrial)
 *
 * Focus: Long horizontal bridges with multiple GroundPatrol enemies
 * Features: Timing-based navigation through enemy lanes
 * Goal: Collect all 14 bones
 * Theme: Industrial - mechanical and structured
 */

import { LevelDefinition } from '../LevelDefinitions';

export const level8: LevelDefinition = {
  levelIndex: 8,
  levelName: 'Factory Floor',
  theme: 'industrial',

  playerSpawn: { x: 80, y: 550 },

  // Long horizontal bridges
  platforms: [
    // Starting platform
    { x: 0, y: 650, width: 200, height: 70 },

    // Lane 1 (lowest)
    { x: 200, y: 580, width: 600, height: 20 },

    // Lane 2 (middle low)
    { x: 350, y: 480, width: 580, height: 20 },

    // Lane 3 (middle high)
    { x: 200, y: 380, width: 600, height: 20 },

    // Lane 4 (highest)
    { x: 350, y: 280, width: 580, height: 20 },

    // End platform (right side, multi-level)
    { x: 1000, y: 650, width: 280, height: 70 },
    { x: 1050, y: 500, width: 230, height: 20 },
    { x: 1000, y: 350, width: 280, height: 20 },
    { x: 1050, y: 200, width: 230, height: 20 },
  ],

  // Vertical connectors
  movingPlatforms: [
    { x: 150, y: 500, width: 80, axis: 'y', range: 180, speed: 50 },
    { x: 1000, y: 420, width: 80, axis: 'y', range: 200, speed: 55 },
  ],

  oneWayPlatforms: [],

  // 14 bones spread across the lanes
  bones: [
    // Lane 1 (lowest)
    { x: 300, y: 550 },
    { x: 500, y: 550 },
    { x: 700, y: 550 },

    // Lane 2
    { x: 450, y: 450 },
    { x: 650, y: 450 },
    { x: 850, y: 450 },

    // Lane 3
    { x: 300, y: 350 },
    { x: 500, y: 350 },
    { x: 700, y: 350 },

    // Lane 4
    { x: 450, y: 250 },
    { x: 650, y: 250 },
    { x: 850, y: 250 },

    // End platforms
    { x: 1165, y: 470 },
    { x: 1165, y: 170 },
  ],

  hearts: [
    { x: 1165, y: 320 }, // Mid-level end platform
  ],

  // Multiple patrol enemies on each lane
  enemies: [
    // Lane 1 patrols
    { type: 'groundPatrol', x: 400, y: 550, params: { patrolDistance: 250 } },
    { type: 'groundPatrol', x: 650, y: 550, params: { patrolDistance: 200 } },

    // Lane 2 patrols
    { type: 'groundPatrol', x: 550, y: 450, params: { patrolDistance: 280 } },
    { type: 'groundPatrol', x: 800, y: 450, params: { patrolDistance: 180 } },

    // Lane 3 patrols
    { type: 'groundPatrol', x: 400, y: 350, params: { patrolDistance: 220 } },
    { type: 'groundPatrol', x: 650, y: 350, params: { patrolDistance: 200 } },

    // Lane 4 patrols
    { type: 'groundPatrol', x: 550, y: 250, params: { patrolDistance: 250 } },
    { type: 'groundPatrol', x: 800, y: 250, params: { patrolDistance: 180 } },
  ],

  completionGoal: 'collectAllBones',
};
