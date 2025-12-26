# Dog Runner Dev Guide

**Mission**: Ship a fun 2D dog platformer in 1-2 weeks. Vibe-code first, refactor only if broken.

## Stack
- **Engine**: Phaser 3.85+ (Arcade Physics)
- **Build**: Vite 5+ (hot reload, ESM, tree-shaking)
- **Language**: TypeScript (strict: false, because speed > types)
- **Assets**: Procedural graphics + 1 dog atlas (CC0 pixel art)

## Philosophy
1. **Working game > clean code** → Ship features, refactor never unless blocking progress
2. **Visual debugging > console logs** → See hitboxes/physics, don't guess
3. **Real assets only** → No fallbacks, fail fast if missing
4. **Centralize config** → gameConfig.ts is single source of truth
5. **Hot reload everything** → npm run dev stays running, instant feedback

---

## 🚫 Never Break These

### Assets
- **No fallback graphics** → Missing asset = throw Error, stop execution
- **CC0 only** → Kenney, Pixel Frog, 0x72, OpenGameArt CC0, GrafxKid
- **Document sources** → Add license info in git commits
- **Procedural for prototyping** → Colored shapes OK during dev, replace before ship

### Errors
- **Fail fast** → Throw on null checks, missing keys, broken invariants
- **Emoji logs** → Use channels: ❌ error, ⚠️ warn, 🎨 assets, 🐕 player, 🦀 enemy, 🍖 collect, 💥 collisions

### Phaser Patterns
- **No circular deps** → Config → Core → Objects/Systems → Scenes → main.ts
- **Scene-scoped systems** → Create in GameScene.create(), auto-cleanup on destroy
- **Arcade physics only** → No matter.js unless you need joints/constraints

---

## 💪 Strong Defaults (Break If You Have a Reason)

### File Organization
- **Config**: gameConfig.ts = single source of truth (world size, physics, speeds, colors)
- **Scenes**: Boot → Menu → Game + UI (parallel)
- **Objects**: Player, enemies, collectibles (composition over inheritance)
- **Systems**: Health, scoring, spawning (event-driven, scene-scoped)

### Size Guidelines (Not Limits)
- **Files feel too big?** → Probably >500 LOC, consider splitting
- **Functions feel complex?** → Probably >50 LOC, consider extracting
- **Too many responsibilities?** → Extract a helper or system
- **Trust your gut** → If code is hard to understand, refactor. If it's clear, ship it.

### Code Style
- **Early returns** → Flatten nested ifs
- **Destructuring** → {x, y, width, height} over 4 params
- **const by default** → let only when reassigning
- **Template literals** → \`Player at ${x}, ${y}\` over concatenation

---

## 🔍 Visual Debugging (Use During Dev)

### Debug Flags (Add to gameConfig.ts)
```typescript
export const DEBUG = {
  enabled: true, // Set false for production
  showHitboxes: true, // Draw collision boxes
  showBaseline: true, // Pink line at ground level
  showFPS: true, // DOM FPS counter (not canvas)
  showSpawnZones: true, // Visualize enemy spawn areas
  logPhysics: false, // Console log collisions
};
```

### Debug Graphics Layer
```typescript
if (DEBUG.enabled && DEBUG.showHitboxes) {
  const debugGraphics = this.add.graphics().setDepth(9999);
  this.physics.world.createDebugGraphic(debugGraphics);
}
```

### Quick Toggles
- **F1**: Toggle hitboxes
- **F2**: Toggle FPS counter
- **F3**: Slow motion (physics.world.timeScale = 0.5)
- **F12**: Skip to game over screen

---

## 🔥 Hot Reload Workflow

### Dev Server (Always Running)
```bash
npm run dev  # Start Vite, leave it running all day
```

### What Auto-Reloads
- ✅ TypeScript changes (instant)
- ✅ Asset updates (dog.png, dog.json)
- ✅ Config changes (gameConfig.ts)
- ✅ Scene changes (GameScene, MenuScene, etc.)

### What Requires Restart
- ❌ Installing new npm packages
- ❌ Changing vite.config.ts
- ❌ Updating package.json scripts

### Asset Iteration
1. **Prototype**: Use procedural graphics (red squares, yellow circles)
2. **Replace**: Swap texture keys in config, reload browser
3. **Ship**: Verify all procedural textures replaced with real art

---

## 🎮 Phaser-Specific Patterns

### Scene Lifecycle
```typescript
class GameScene {
  preload() { /* Load assets specific to this scene */ }
  create() { /* Instantiate objects, setup physics, register events */ }
  update(time, delta) { /* Per-frame logic, input polling */ }
}
```

### Physics Groups (Efficient Collisions)
```typescript
this.enemyGroup = this.physics.add.group();
this.foodGroup = this.physics.add.group();

// Add overlap detection (no collision response)
this.physics.add.overlap(player.sprite, this.foodGroup, handleCollect);

// Add collision (with response)
this.physics.add.collider(player.sprite, this.enemyGroup, handleDamage);
```

### Animation State Machines (Prevent Jitter)
```typescript
// Lock animations during transitions
if (time < this.landingLockUntil) return;

// Single controller updates state
if (!this.isGrounded && this.animState !== 'air') {
  this.animState = 'air';
  this.sprite.play('jump', true);
}
```

### Event-Driven Systems
```typescript
// System emits
this.health.emit('damaged', currentHealth);

// Scene listens
this.health.on('damaged', (hp) => this.updateHearts(hp));
```

### Camera Follow
```typescript
// Smooth follow with deadzone
this.cameras.main.startFollow(player.sprite, true, 0.12, 0.12);
this.cameras.main.setDeadzone(300, 180);
```

---

## 💡 Nice-to-Haves (Optional)

### Before Shipping
- [ ] Replace procedural textures with real art
- [ ] Set DEBUG.enabled = false
- [ ] Remove debug graphics/logs
- [ ] Test on target screen size (mobile? desktop?)
- [ ] Add background music + SFX
- [ ] Write 1-sentence description for itch.io

### Code Cleanup (Only If Bored)
- [ ] Extract game-over screen from GameScene to UIScene
- [ ] Pre-generate procedural textures in BootScene
- [ ] Add TypeScript strict mode (if types are stable)
- [ ] Run Prettier on all files

### Future Features (Post-Ship)
- [ ] Leaderboard (local storage)
- [ ] Multiple levels
- [ ] Power-ups
- [ ] Mobile touch controls

---

## 📋 Quick Reference

### Commands
```bash
npm run dev        # Start dev server (leave running)
npm run build      # Production build
npm run preview    # Test production build locally
```

### File Structure
```
dog-runner-clean/
├── src/
│   ├── main.ts              # Entry point
│   ├── config/
│   │   └── gameConfig.ts    # All constants here
│   ├── scenes/
│   │   ├── BootScene.ts     # Asset loading
│   │   ├── MenuScene.ts     # Start screen
│   │   ├── GameScene.ts     # Main game
│   │   └── UIScene.ts       # HUD overlay
│   ├── objects/
│   │   ├── Player.ts
│   │   ├── EnemyCrab.ts
│   │   └── CollectibleFood.ts
│   └── systems/
│       ├── Health.ts
│       ├── ScoreTimer.ts
│       └── Spawner.ts
└── assets/
    └── atlas/
        ├── dog.png
        └── dog.json
```

### Emoji Log Channels
```
❌ error    ⚠️ warn     🎨 assets   🎮 lifecycle  🐕 player
🦀 enemy    🍖 collect  🎵 audio    ⚙️ systems    💥 collisions
💻 UI       ✅ success
```

### Asset Sources (CC0 & Free Licenses)

#### 🏆 Premium Free Sources (CC0 - Public Domain)

**Kenney.nl** - The gold standard for CC0 game assets
- **All-in-1 Bundle**: https://kenney.nl/assets - 60,000+ assets in one download
- **Pixel Platformer**: https://kenney.nl/assets/pixel-platformer - 200 platformer tiles, characters, items
- **Pixel Platformer Food Expansion**: https://kenney.nl/assets/pixel-platformer-food-expansion - 110 food-themed tiles
- **UI Packs**: https://kenney.nl/assets?q=ui - Buttons, icons, game icons
- **Input Prompts**: Keyboard, gamepad, touch controls
- **Particle Pack**: Smoke, fire, explosions, magic effects
- **License**: CC0 1.0 Universal (Public Domain) - use anywhere, no attribution required
- **Quality**: Professional, consistent style, perfect for complete games

**OpenGameArt.org** - Community-driven asset repository
- **Browse CC0**: https://opengameart.org/content/cc0-public-domain
- **2D Platformer Art**: https://opengameart.org/content/platformer-art-complete-pack-often-updated
- **Search by License**: Filter by CC0, CC-BY, GPL, OGA-BY
- **Strengths**: Diverse styles, excellent music/SFX, clear licensing tags
- **License**: Varies (always check), CC0 section is public domain

#### 🎨 Top Pixel Art Creators (itch.io)

**Pixel Frog** - High-quality pixel art asset packs
- **Profile**: https://pixelfrog-assets.itch.io/
- **Notable**: Treasure Hunters, Pixel Adventure 1 & 2, Kings and Pigs
- **Style**: Colorful, animated characters, complete tilesets
- **License**: Free (check individual packs, some CC0, some require attribution)

**0x72** - Minimalist pixel art style
- **Profile**: https://0x72.itch.io/
- **Notable**: DungeonTileset II, 16x16 Robot Tileset, Cavernas
- **Style**: Clean 16x16 pixel art, dungeon/platformer focused
- **License**: CC0 for most packs

**GrafxKid** - Retro game asset specialist
- **Profile**: https://grafxkid.itch.io/
- **Notable**: Seasonal Tilesets, Arcade Platformer, GothicVania
- **Style**: Classic NES/SNES era aesthetics
- **License**: CC0 for most packs

**Free Game Assets (itch.io)** - Curated free packs
- **Profile**: https://free-game-assets.itch.io/
- **Notable**: Pixel Art Platformer 2D Game Kit, Industrial Pack
- **License**: Varies, check each pack

#### 🌟 Other Quality Sources

**CraftPix.net** - Professional 2D game assets
- **Free Section**: https://craftpix.net/freebies/
- **Strengths**: Cohesive themed packs, backgrounds, GUI, complete kits
- **Platformer Tilesets**: Multi-layered parallax backgrounds, forest/cave themes
- **License**: Royalty-free (commercial use OK), NOT CC0 - read terms per pack
- **Note**: Some assets free, many premium - check license carefully

**itch.io Collections**
- **Free CC0 Pixel Art**: https://itch.io/game-assets/free/tag-cc0/tag-pixel-art
- **Free Platformer Assets**: https://itch.io/game-assets/free/genre-platformer
- **CC0 Platformer Assets**: https://itch.io/game-assets/assets-cc0/genre-platformer

#### 📦 What You Need for a Rich-Looking Game

**Essential Asset Types:**
1. **Characters** - Player sprites with animations (idle, walk, jump, attack, death)
2. **Enemies** - 3-5 enemy types with animations
3. **Tilesets** - Ground tiles, platforms, decorative blocks, background elements
4. **Backgrounds** - Multi-layer parallax (sky, clouds, mountains, foreground)
5. **Collectibles** - Coins, gems, food, power-ups
6. **UI/HUD** - Health hearts, score display, buttons, game over screens
7. **VFX** - Particle effects (dust, sparkles, explosions, impact)
8. **Audio** - Jump SFX, collect SFX, background music, ambient sounds

**Pro Tips:**
- Stick to ONE art style (e.g., all 16x16 pixel art, or all Kenney's style)
- Download entire packs, not individual sprites (ensures consistency)
- Use Kenney's All-in-1 for prototyping, then refine with specialized packs
- Parallax backgrounds = instant polish (3-5 layers, different scroll speeds)
- Particle effects make everything feel more "juicy"

#### 🚀 Quick Start Asset Bundle

**For This Dog Platformer:**
1. **Player**: Dog sprite atlas (already using from custom asset)
2. **Collectibles**: Bone sprite from OpenGameArt (already using)
3. **Add Next**:
   - **Background**: Kenney's "Background Elements" or Pixel Frog's parallax pack
   - **Platforms**: Kenney's "Pixel Platformer" tileset (grass, dirt, wood platforms)
   - **Enemies**: 0x72's creature sprites or Kenney's enemy pack
   - **VFX**: Kenney's "Particle Pack" for dust clouds on jump/land
   - **UI**: Kenney's "Game Icons" + "UI Pack" for HUD elements
   - **Audio**: OpenGameArt music + Kenney's "Digital Audio" SFX pack

**Download Command** (Kenney All-in-1):
```bash
# Visit https://kenney.nl/assets/kenney-game-assets
# Download ZIP (200MB+), extract to assets/ folder
# All assets instantly available under CC0 license
```
