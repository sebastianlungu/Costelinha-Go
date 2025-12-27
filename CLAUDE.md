# Costelinha Go - Dev Guide

**Dog platformer built with Phaser 3 + Vite + TypeScript**

## Stack
- Phaser 3.85+ (Arcade Physics)
- Vite 5+ (hot reload)
- TypeScript (strict: false)
- Assets: Kenney CC0 pixel art

## Philosophy
1. Working game > clean code
2. Visual debugging > console logs
3. No fallback graphics - fail fast
4. gameConfig.ts = single source of truth
5. Hot reload everything

## Project Structure
```
src/
├── main.ts
├── config/gameConfig.ts    # All constants, physics, UI colors
├── scenes/
│   ├── BootScene.ts        # Asset loading, animations
│   ├── MenuScene.ts        # Start screen
│   ├── GameScene.ts        # Main game, platforms, collectibles
│   └── HudScene.ts         # Score overlay
├── objects/
│   ├── Player.ts           # Dog sprite, movement, animations
│   └── Collectible.ts      # Bone pickup
└── systems/
    └── Score.ts            # Score tracking, events
assets/
├── atlas/                  # Dog spritesheet
├── backgrounds/            # Parallax layers
├── tiles/                  # Platform tiles
├── particles/              # VFX
└── ui/                     # HUD elements
```

## Commands
```bash
npm run dev      # Dev server
npm run build    # Production
npm run preview  # Test build
```

## Patterns

### Scene Flow
Boot → Menu → Game + Hud (parallel)

### Physics Groups
```typescript
this.physics.add.overlap(player.sprite, this.boneGroup, handleCollect);
this.physics.add.collider(player.sprite, this.platformGroup);
```

### Event-Driven
```typescript
this.scoreSystem.on('scoreChanged', (score) => this.updateDisplay(score));
```

### Animation State Machine
```typescript
if (time < this.landingLockUntil) return;
if (!this.isGrounded && this.animState !== 'air') {
  this.animState = 'air';
  this.sprite.play('jump', true);
}
```

## Emoji Log Channels
```
❌ error  ⚠️ warn   🎨 assets  🎮 lifecycle  🐕 player
🍖 collect  🎵 audio  ⚙️ systems  💥 collisions  ✅ success
```

## Asset Sources (CC0)
- **Kenney.nl**: https://kenney.nl/assets (primary)
- **OpenGameArt**: https://opengameart.org/content/cc0-public-domain
- **itch.io CC0**: https://itch.io/game-assets/free/tag-cc0
