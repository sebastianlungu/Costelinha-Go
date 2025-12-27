# Costelinha Go - Campaign System Architecture

## GameState Module (`src/state/GameState.ts`)

Singleton managing persistent game state across scenes.

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| currentHP | number | 5 | Range 1-5, persists across levels |
| maxHP | number | 5 | Cap for HP pickups |
| highestUnlockedLevel | number | 1 | 1-indexed, levels 1-10 |
| selectedLevelIndex | number | 1 | Current level selection |
| settings | Settings | see below | Volume controls |

**Settings**: `{ musicVolume: 0.5, sfxVolume: 0.7, mute: false }` - persisted to localStorage.

**HP Rules**:
- Carries between levels (beat L1 with 3HP, start L2 with 3HP)
- Resets to 5 only on "New Run" from MenuScene
- Hearts in levels heal +1 HP (capped at maxHP)
- Restart level restores HP to value at level start (checkpoint)

---

## LevelDefinition Schema (`src/data/LevelDefinitions.ts`)

```
LevelDefinition {
  levelIndex: number
  levelName: string
  theme: { backgroundKeys: string[], tilesetKey: string }
  playerSpawn: { x, y }
  platforms: { x, y, width, height }[]
  movingPlatforms: { x, y, width, axis, range, speed }[]
  oneWayPlatforms: { x, y, width }[]
  bones: { x, y }[]
  hearts: { x, y }[]
  enemies: { type, x, y, params }[]
  completionGoal: 'collectAllBones' | 'reachFlag'
}
```

Individual levels in `src/data/levels/level1.ts` through `level10.ts`, each exporting a LevelDefinition.

---

## Scene Flow

```
BootScene (asset loading, fail-fast validation)
    |
MenuScene (PLAY | LEVEL SELECT | SETTINGS)
    |
    +-- LevelSelectScene (10-level grid, locked/unlocked states)
    +-- SettingsScene (sliders for music/sfx, mute toggle, localStorage)
    |
GameScene (loads LevelDefinition by index)
    |
    +-- HudScene (parallel: HP hearts, bone count, level name)
    |
    +-- LevelCompleteOverlay (NEXT LEVEL | MENU)
    +-- GameOverOverlay (RESTART | MENU)
```

**Key transitions**:
- PLAY from menu starts at `selectedLevelIndex` (default 1)
- Level complete unlocks next, auto-transitions with current HP
- Game over (HP=0) returns to menu, resets GameState

---

## File Plan

### New Files
- `src/state/GameState.ts` - Singleton state manager
- `src/data/LevelDefinitions.ts` - Type definitions + loader
- `src/data/levels/level1.ts` ... `level10.ts` - Level data
- `src/scenes/LevelSelectScene.ts` - Grid UI, lock icons
- `src/scenes/SettingsScene.ts` - Volume sliders, persist
- `src/objects/Enemy.ts` - Base class with HP, damage, patrol
- `src/objects/enemies/GroundPatrol.ts` - Walks platform edges
- `src/objects/enemies/Hopper.ts` - Bounces vertically
- `src/objects/enemies/Flyer.ts` - Sine-wave horizontal
- `src/objects/Heart.ts` - HP pickup collectible
- `src/objects/MovingPlatform.ts` - Tween-based axis movement
- `src/objects/OneWayPlatform.ts` - Checkbody from below

### Modified Files
- `BootScene.ts` - Load level assets, enemy atlases
- `MenuScene.ts` - Add LEVEL SELECT / SETTINGS buttons
- `GameScene.ts` - Load from LevelDefinition, spawn enemies/platforms
- `HudScene.ts` - Show HP hearts, level info
- `gameConfig.ts` - Add ENEMY, HEART, MOVING_PLATFORM constants

---

## 10 Level Archetypes

| # | Name | Focus |
|---|------|-------|
| 1 | Intro | Wide platforms, no enemies, teach jump |
| 2 | Zig-Zag Ascent | Alternating climb, introduce bones above |
| 3 | Moving Platforms | 2-3 slow horizontal movers |
| 4 | One-Way Layers | Stacked pass-through platforms |
| 5 | Precision Chain | Micro-platforms, timing required |
| 6 | Vertical Shaft | Climb upward, minimal horizontal |
| 7 | Mixed Light | Moving + one-way combo |
| 8 | Patrol Lanes | Enemy-heavy horizontal bridges |
| 9 | Split Path | Risk/reward route choice |
| 10 | Final Remix | Best patterns combined, all enemy types |
