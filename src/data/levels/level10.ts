/**
 * Level 10: Final Remix (Volcano)
 *
 * Focus: Ultimate challenge combining all mechanics
 * Features: Moving platforms, one-way platforms, all enemy types
 * Goal: Reach the flag at the end
 * Theme: Volcano - intense and dramatic
 */

import { LevelDefinition } from '../LevelDefinitions';

export const level10: LevelDefinition = {
  levelIndex: 10,
  levelName: 'Volcanic Finale',
  theme: 'volcano',

  playerSpawn: { x: 80, y: 550 },

  platforms: [
    // Starting safe zone
    { x: 0, y: 650, width: 200, height: 70 },

    // Section 1: Precision chain
    { x: 250, y: 580, width: 100, height: 20 },
    { x: 400, y: 520, width: 100, height: 20 },
    { x: 550, y: 460, width: 100, height: 20 },

    // Section 2: Central arena
    { x: 650, y: 550, width: 250, height: 20 },
    { x: 700, y: 400, width: 200, height: 20 },
    { x: 730, y: 250, width: 180, height: 20 },

    // Section 3: Final ascent
    { x: 950, y: 350, width: 150, height: 20 },
    { x: 1100, y: 280, width: 180, height: 20 },

    // Victory platform
    { x: 1100, y: 150, width: 180, height: 20 },
  ],

  // Moving platforms for key transitions
  movingPlatforms: [
    // Cross the lava (section 1 to 2)
    { x: 180, y: 620, width: 100, axis: 'x', range: 180, speed: 90 },

    // Vertical lift in arena
    { x: 900, y: 480, width: 80, axis: 'y', range: 150, speed: 70 },

    // Final crossing
    { x: 950, y: 200, width: 100, axis: 'x', range: 120, speed: 80 },
  ],

  // One-way platforms for vertical sections
  oneWayPlatforms: [
    // Arena middle layers
    { x: 600, y: 480, width: 120 },
    { x: 850, y: 480, width: 120 },
    { x: 650, y: 330, width: 140 },
    { x: 850, y: 330, width: 120 },

    // Final ascent helpers
    { x: 1050, y: 220, width: 100 },
  ],

  // 18 bones scattered throughout - collection optional (goal is flag)
  bones: [
    // Starting section
    { x: 100, y: 620 },
    { x: 300, y: 550 },
    { x: 450, y: 490 },
    { x: 600, y: 430 },

    // Central arena
    { x: 700, y: 520 },
    { x: 850, y: 520 },
    { x: 660, y: 450 },
    { x: 910, y: 450 },
    { x: 750, y: 370 },
    { x: 850, y: 370 },
    { x: 770, y: 300 },
    { x: 870, y: 300 },
    { x: 820, y: 220 },

    // Final ascent
    { x: 1025, y: 320 },
    { x: 1190, y: 250 },
    { x: 1010, y: 170 },
    { x: 1100, y: 200 },
    { x: 1180, y: 200 },
  ],

  // Hearts placed strategically for survival
  hearts: [
    { x: 775, y: 520 },  // Arena entrance
    { x: 820, y: 370 },  // Mid arena
    { x: 1190, y: 120 }, // Near flag
  ],

  // All enemy types
  enemies: [
    // Precision section guards
    { type: 'hopper', x: 300, y: 550, params: { hopHeight: 70 } },
    { type: 'hopper', x: 450, y: 490, params: { hopHeight: 60 } },

    // Arena floor patrols
    { type: 'groundPatrol', x: 750, y: 520, params: { patrolDistance: 160 } },
    { type: 'groundPatrol', x: 800, y: 370, params: { patrolDistance: 140 } },

    // Flying enemies in arena airspace
    { type: 'flyer', x: 700, y: 400, params: { amplitude: 60, frequency: 1.5 } },
    { type: 'flyer', x: 850, y: 280, params: { amplitude: 50, frequency: 2.0 } },

    // Final ascent guards
    { type: 'groundPatrol', x: 1025, y: 320, params: { patrolDistance: 100 } },
    { type: 'hopper', x: 1190, y: 250, params: { hopHeight: 50 } },
    { type: 'flyer', x: 1050, y: 180, params: { amplitude: 40, frequency: 1.8 } },

    // Victory platform guard
    { type: 'groundPatrol', x: 1190, y: 120, params: { patrolDistance: 120 } },
  ],

  completionGoal: 'reachFlag',
  flagPosition: { x: 1190, y: 120 },
};
