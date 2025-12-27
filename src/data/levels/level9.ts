/**
 * Level 9: Split Path (Night)
 *
 * Focus: Risk/reward choice between two paths
 * Easy path: Fewer bones, safer
 * Hard path: More bones + hearts, but more dangerous
 * Goal: Collect all 16 bones
 * Theme: Night - dark and atmospheric
 */

import { LevelDefinition } from '../LevelDefinitions';

export const level9: LevelDefinition = {
  levelIndex: 9,
  levelName: 'Moonlit Crossroads',
  theme: 'night',

  playerSpawn: { x: 100, y: 550 },

  platforms: [
    // Starting area
    { x: 0, y: 650, width: 250, height: 70 },

    // Decision point - central platform
    { x: 300, y: 550, width: 180, height: 20 },

    // ============= EASY PATH (UPPER) =============
    // Wider platforms, fewer enemies
    { x: 200, y: 420, width: 180, height: 20 },
    { x: 430, y: 350, width: 200, height: 20 },
    { x: 680, y: 280, width: 180, height: 20 },
    { x: 900, y: 350, width: 160, height: 20 },

    // ============= HARD PATH (LOWER) =============
    // Smaller platforms, more challenging
    { x: 520, y: 580, width: 120, height: 20 },
    { x: 680, y: 520, width: 100, height: 20 },
    { x: 820, y: 580, width: 120, height: 20 },
    { x: 960, y: 520, width: 100, height: 20 },

    // End platform (both paths converge)
    { x: 1050, y: 650, width: 230, height: 70 },
    { x: 1080, y: 450, width: 200, height: 20 },
  ],

  // Moving platforms add challenge to hard path
  movingPlatforms: [
    // Hard path has moving platforms
    { x: 600, y: 600, width: 80, axis: 'y', range: 60, speed: 70 },
    { x: 750, y: 550, width: 80, axis: 'x', range: 80, speed: 60 },
    { x: 890, y: 550, width: 80, axis: 'y', range: 50, speed: 65 },
  ],

  // One-way platforms for vertical movement
  oneWayPlatforms: [
    // Help transition between paths
    { x: 280, y: 480, width: 120 },
    { x: 1030, y: 550, width: 100 },
  ],

  // 16 bones total - more on hard path
  bones: [
    // Starting area
    { x: 125, y: 620 },
    { x: 390, y: 520 },

    // EASY PATH (6 bones)
    { x: 290, y: 390 },
    { x: 530, y: 260 },
    { x: 770, y: 190 },
    { x: 980, y: 320 },

    // HARD PATH (8 bones - more reward)
    { x: 580, y: 500 },
    { x: 640, y: 570 },
    { x: 680, y: 490 },
    { x: 880, y: 500 },
    { x: 810, y: 550 },
    { x: 925, y: 490 },
    { x: 1010, y: 440 },

    // End area
    { x: 1180, y: 500 },
    { x: 1165, y: 620 },
    { x: 1100, y: 620 },
  ],

  // Hearts only on hard path
  hearts: [
    { x: 730, y: 550 },
    { x: 1010, y: 550 },
  ],

  enemies: [
    // Easy path - light enemies
    { type: 'groundPatrol', x: 530, y: 320, params: { patrolDistance: 140 } },
    { type: 'hopper', x: 770, y: 250, params: { hopHeight: 50 } },

    // Hard path - more enemies
    { type: 'groundPatrol', x: 580, y: 550, params: { patrolDistance: 80 } },
    { type: 'flyer', x: 730, y: 460, params: { amplitude: 50, frequency: 1.8 } },
    { type: 'groundPatrol', x: 880, y: 550, params: { patrolDistance: 80 } },
    { type: 'hopper', x: 1010, y: 490, params: { hopHeight: 60 } },
  ],

  completionGoal: 'collectAllBones',
};
