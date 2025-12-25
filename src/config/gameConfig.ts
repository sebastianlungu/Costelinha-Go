// gameConfig.ts - Single source of truth for all game constants

// Canvas & World
export const CANVAS = {
  width: 1280,
  height: 720,
  backgroundColor: '#87CEEB', // Sky blue
};

export const WORLD = {
  width: 1280,
  height: 720,
  groundTopY: 650, // Top edge of ground platform
};

// Physics
export const PHYSICS = {
  gravity: 900,
  debugShowBody: false,
  debugShowStaticBody: false,
  debugShowVelocity: false,
};

// Player
export const PLAYER = {
  speed: 250,
  jumpVelocity: -450,
  width: 48,
  height: 48,
  spawnX: 100,
  spawnY: 550, // groundTopY - playerHeight with some buffer
  acceleration: 800,
  drag: 600,
};

// Platforms
export const PLATFORMS = [
  // Ground platform (full width)
  { x: 0, y: 650, width: 1280, height: 70, isStatic: true },

  // Floating platforms (climbable layout)
  { x: 200, y: 550, width: 150, height: 20, isStatic: true },
  { x: 450, y: 450, width: 150, height: 20, isStatic: true },
  { x: 700, y: 350, width: 150, height: 20, isStatic: true },
  { x: 450, y: 250, width: 150, height: 20, isStatic: true },
  { x: 900, y: 450, width: 150, height: 20, isStatic: true },
];

// Collectibles (bones)
export const COLLECTIBLES = {
  count: 15,
  // Spawn positions on platforms (y positions are platform top - 20 for hovering effect)
  positions: [
    // Ground platform
    { x: 150, y: 630 },
    { x: 400, y: 630 },
    { x: 650, y: 630 },
    { x: 900, y: 630 },
    { x: 1150, y: 630 },

    // Platform 1 (y: 550)
    { x: 250, y: 530 },
    { x: 300, y: 530 },

    // Platform 2 (y: 450)
    { x: 500, y: 430 },
    { x: 550, y: 430 },

    // Platform 3 (y: 350)
    { x: 750, y: 330 },
    { x: 800, y: 330 },

    // Platform 4 (y: 250)
    { x: 500, y: 230 },

    // Platform 5 (y: 450)
    { x: 950, y: 430 },
    { x: 1000, y: 430 },
    { x: 1050, y: 430 },
  ],
};

// Depths (z-index for rendering)
export const DEPTHS = {
  background: 0,
  platforms: 10,
  collectibles: 15,
  player: 20,
  hud: 100,
  debug: 9999,
};

// Debug flags
export const DEBUG = {
  enabled: false, // Set false for production
  showHitboxes: false, // Draw collision boxes
  showBaseline: false, // Pink line at ground level
  showFPS: false, // DOM FPS counter (not canvas)
  showSpawnZones: false, // Visualize spawn areas
  logPhysics: false, // Console log collisions
};

// Colors (for procedural graphics)
export const COLORS = {
  platform: 0x4CAF50, // Green
  player: 0xFF5722, // Orange-red (placeholder)
  collectible: 0xFFEB3B, // Yellow
  debugHitbox: 0xFF00FF, // Magenta
  debugBaseline: 0xFF1493, // Deep pink
};
