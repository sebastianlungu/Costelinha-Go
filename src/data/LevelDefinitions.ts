/**
 * LevelDefinitions.ts - Level definition types and loader functions
 *
 * Defines the schema for all level data and provides functions
 * to load level definitions by index.
 */

import { ThemeId } from './AssetManifest';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Static platform definition (standard collision from all sides)
 */
export interface PlatformDef {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Moving platform definition (tweens along an axis)
 */
export interface MovingPlatformDef {
  x: number;
  y: number;
  width: number;
  axis: 'x' | 'y';
  range: number; // Total distance to travel
  speed: number; // Pixels per second
}

/**
 * One-way platform (can jump through from below)
 */
export interface OneWayPlatformDef {
  x: number;
  y: number;
  width: number;
}

/**
 * Bone collectible position
 */
export interface BoneDef {
  x: number;
  y: number;
}

/**
 * Heart pickup position
 */
export interface HeartDef {
  x: number;
  y: number;
}

/**
 * Enemy spawn definition
 */
export interface EnemyDef {
  type: 'groundPatrol' | 'hopper' | 'flyer';
  x: number;
  y: number;
  params?: {
    patrolDistance?: number; // For groundPatrol
    hopHeight?: number; // For hopper
    amplitude?: number; // For flyer (sine wave height)
    frequency?: number; // For flyer (sine wave speed)
  };
}

/**
 * Level completion goal type
 */
export type CompletionGoal = 'collectAllBones' | 'reachFlag';

/**
 * Complete level definition schema
 */
export interface LevelDefinition {
  levelIndex: number;
  levelName: string;
  theme: ThemeId;
  playerSpawn: { x: number; y: number };
  platforms: PlatformDef[];
  movingPlatforms: MovingPlatformDef[];
  oneWayPlatforms: OneWayPlatformDef[];
  bones: BoneDef[];
  hearts: HeartDef[];
  enemies: EnemyDef[];
  completionGoal: CompletionGoal;
  flagPosition?: { x: number; y: number };
}

// =============================================================================
// LEVEL IMPORTS
// =============================================================================

import { level1 } from './levels/level1';
import { level2 } from './levels/level2';
import { level3 } from './levels/level3';
import { level4 } from './levels/level4';
import { level5 } from './levels/level5';
import { level6 } from './levels/level6';
import { level7 } from './levels/level7';
import { level8 } from './levels/level8';
import { level9 } from './levels/level9';
import { level10 } from './levels/level10';

// Level registry (1-indexed for user-facing level numbers)
const LEVELS: Record<number, LevelDefinition> = {
  1: level1,
  2: level2,
  3: level3,
  4: level4,
  5: level5,
  6: level6,
  7: level7,
  8: level8,
  9: level9,
  10: level10,
};

// =============================================================================
// LOADER FUNCTIONS
// =============================================================================

/**
 * Get a level definition by index (1-10)
 * @throws Error if level index is invalid
 */
export function getLevelDefinition(index: number): LevelDefinition {
  const level = LEVELS[index];
  if (!level) {
    throw new Error(`❌ Invalid level index: ${index}. Valid range: 1-10`);
  }
  return level;
}

/**
 * Get all level definitions as an array (ordered by levelIndex)
 */
export function getAllLevels(): LevelDefinition[] {
  return Object.keys(LEVELS).map(key => LEVELS[parseInt(key)]).sort((a, b) => a.levelIndex - b.levelIndex);
}

/**
 * Get total number of levels
 */
export function getTotalLevelCount(): number {
  return 10; // Hard-coded since we have exactly 10 levels
}

/**
 * Check if a level index is valid
 */
export function isValidLevelIndex(index: number): boolean {
  return index >= 1 && index <= getTotalLevelCount();
}

// =============================================================================
// HELPER CONSTANTS
// =============================================================================

// Canvas dimensions for level design reference
export const LEVEL_CANVAS = {
  width: 1280,
  height: 720,
  groundY: 650, // Standard ground level
};

// =============================================================================
// DEV-MODE VALIDATION
// =============================================================================

/**
 * Expected bone counts per level (for validation)
 * Update these when intentionally changing bone counts
 */
const EXPECTED_BONE_COUNTS: Record<number, number> = {
  2: 13, // Level 2: 13 bones (12 original + 1 bonus upper right)
};

/**
 * Validates level bones for common issues.
 * Call in dev mode to catch level design errors early.
 *
 * Checks:
 * - Bone count matches expected (if defined)
 * - No bones out of bounds (x: 0-1280, y: 0-720)
 * - No duplicate bone positions
 *
 * @param level - The level definition to validate
 * @returns Array of warning strings (empty if no issues)
 */
export function validateLevelBones(level: LevelDefinition): string[] {
  const warnings: string[] = [];
  const levelName = `Level ${level.levelIndex} (${level.levelName})`;

  // Check bone count matches expected (if we have an expected count)
  const expectedCount = EXPECTED_BONE_COUNTS[level.levelIndex];
  if (expectedCount !== undefined && level.bones.length !== expectedCount) {
    warnings.push(
      `${levelName}: Expected ${expectedCount} bones, found ${level.bones.length}`
    );
  }

  // Check for out-of-bounds bones
  level.bones.forEach((bone, index) => {
    if (bone.x < 0 || bone.x > LEVEL_CANVAS.width) {
      warnings.push(
        `${levelName}: Bone ${index} has out-of-bounds X position: ${bone.x} (valid: 0-${LEVEL_CANVAS.width})`
      );
    }
    if (bone.y < 0 || bone.y > LEVEL_CANVAS.height) {
      warnings.push(
        `${levelName}: Bone ${index} has out-of-bounds Y position: ${bone.y} (valid: 0-${LEVEL_CANVAS.height})`
      );
    }
  });

  // Check for duplicate bone positions
  const positionSet = new Set<string>();
  level.bones.forEach((bone, index) => {
    const key = `${bone.x},${bone.y}`;
    if (positionSet.has(key)) {
      warnings.push(
        `${levelName}: Duplicate bone position at (${bone.x}, ${bone.y}) - bone ${index}`
      );
    }
    positionSet.add(key);
  });

  return warnings;
}
