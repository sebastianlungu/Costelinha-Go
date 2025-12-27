// gameConfig.ts - Single source of truth for all game constants

// Scale Configuration - responsive scaling bounds
export const SCALE_CONFIG = {
  baseWidth: 1280,
  baseHeight: 720,
  minWidth: 640,
  minHeight: 360,
  maxWidth: 1920,
  maxHeight: 1080,
};

// Canvas & World
export const CANVAS = {
  width: SCALE_CONFIG.baseWidth,
  height: SCALE_CONFIG.baseHeight,
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
  maxHP: 5, // Maximum heart containers
  startingHP: 5, // Starting HP (can be less than max for harder modes)
};

// Level Info
export const LEVEL = {
  currentLevel: 1,
  currentName: 'Grasslands',
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

// Heart collectibles (restore HP)
// Hearts are placed in challenging areas as rewards
export const HEARTS = {
  // Spawn positions for heart pickups
  positions: [
    // Platform 3 (y: 350) - reward for reaching high platform
    { x: 775, y: 310 },

    // Platform 4 (y: 250) - reward for reaching the highest platform
    { x: 525, y: 210 },

    // Platform 5 (y: 450) - far right side, reward for exploration
    { x: 1025, y: 410 },
  ],
};

// Moving Platforms - platforms that move back and forth
// These carry the player along as they move
export const MOVING_PLATFORMS: {
  x: number;
  y: number;
  width: number;
  axis: 'x' | 'y';
  range: number;
  speed: number;
}[] = [
  // Horizontal moving platform between static platforms
  // Starts at x:300, moves right 200px, then back
  { x: 300, y: 500, width: 84, axis: 'x', range: 150, speed: 60 },

  // Vertical moving platform - elevator style
  { x: 1100, y: 500, width: 84, axis: 'y', range: 200, speed: 40 },
];

// One-Way Platforms - platforms the player can jump through from below
// Player lands on top but passes through when jumping up
export const ONE_WAY_PLATFORMS: {
  x: number;
  y: number;
  width: number;
}[] = [
  // One-way platform above the ground for easy access
  { x: 550, y: 580, width: 126 },

  // Higher one-way platform for vertical progression
  { x: 150, y: 480, width: 84 },
];

// Enemies - hazards that damage the player on contact
// Types: groundPatrol (walks back/forth), hopper (jumps in place), flyer (sine wave movement)
import type { EnemyDefinition } from '../objects/Enemy';

export const ENEMIES: EnemyDefinition[] = [
  // Ground patrol on the main ground - walks back and forth
  {
    type: 'groundPatrol',
    x: 600,
    y: 620,
    params: { patrolRange: 250, speed: 80 },
  },

  // Another ground patrol on the far right
  {
    type: 'groundPatrol',
    x: 1100,
    y: 620,
    params: { patrolRange: 150, speed: 60 },
  },

  // Hopper on platform 1 (y: 550) - jumps periodically
  {
    type: 'hopper',
    x: 275,
    y: 520,
    params: { jumpHeight: 300, jumpInterval: 2500 },
  },

  // Hopper on platform 2 (y: 450) - faster jumper
  {
    type: 'hopper',
    x: 525,
    y: 420,
    params: { jumpHeight: 250, jumpInterval: 1800 },
  },

  // Flyer moving horizontally above ground
  {
    type: 'flyer',
    x: 400,
    y: 550,
    params: { amplitude: 50, frequency: 0.002, direction: 1, speed: 50 },
  },

  // Flyer near the high platforms
  {
    type: 'flyer',
    x: 800,
    y: 280,
    params: { amplitude: 30, frequency: 0.003, direction: -1, speed: 40 },
  },
];

// Depths (z-index for rendering)
export const DEPTHS = {
  background: 0,
  platforms: 10,
  collectibles: 15,
  particles: 18,
  player: 20,
  hud: 100,
  debug: 9999,
};

// Camera settings
export const CAMERA = {
  followLerp: 0.12,
  deadzone: {
    width: 300,
    height: 180,
  },
  shake: {
    duration: 100,
    intensity: 0.001, // Reduced from 0.003 for more subtle effect
  },
};

// UI Design System - Color Palette
export const UI_COLORS = {
  // Primary colors
  primary: '#FF6B35', // Vibrant orange-red (matches dog/energy theme)
  primaryDark: '#D9542E', // Darker shade for depth
  primaryLight: '#FF8757', // Lighter shade for highlights

  // Secondary colors
  secondary: '#4ECDC4', // Teal (complementary to orange)
  secondaryLight: '#6FD9D2', // Lighter teal

  // Neutral colors
  background: '#2C3E50', // Dark blue-gray
  backgroundLight: '#34495E', // Lighter gray for panels
  backgroundDark: '#1A252F', // Darker for shadows

  // Text colors
  textPrimary: '#FFFFFF', // White for primary text
  textSecondary: '#ECF0F1', // Off-white for secondary text
  textAccent: '#FFD93D', // Yellow for highlights/scores

  // UI element colors
  panelBorder: '#FF6B35', // Panel border (primary color)
  buttonHover: '#FF8757', // Button hover state
  buttonText: '#FFFFFF', // Button text

  // Status colors
  success: '#6BCF7F', // Green for success/collection
  danger: '#E74C3C', // Red for damage/danger
};

// UI Design System - Typography
export const UI_TYPOGRAPHY = {
  // Font family - bundled locally in /public/fonts/ (OFL license)
  // Loaded via @font-face in /src/styles/fonts.css
  fontFamily: '"Press Start 2P", cursive',
  // Raw font family name (without quotes) for CSS Font Loading API
  fontFamilyRaw: 'Press Start 2P',

  // Font sizes (pixel perfect sizes for retro feel)
  sizeXXL: '48px', // Main title
  sizeXL: '32px', // Subtitles
  sizeLarge: '24px', // Headers
  sizeMedium: '16px', // Body text, buttons
  sizeSmall: '12px', // Small labels, hints
  sizeXS: '8px', // Tiny credits

};

// UI Design System - Spacing
export const UI_SPACING = {
  // Specific spacing values
  small: 8,
  medium: 16,
  large: 24,
};

// UI Design System - Layout
export const UI_LAYOUT = {
  // Border thickness
  borderThin: 2,
  borderMedium: 3,
  borderThick: 4,

  // Shadow depths (for 3D button effect)
  shadowMedium: 4,
};
