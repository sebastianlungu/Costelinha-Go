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
  secondaryDark: '#3DB5AD', // Darker teal
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
  panelBg: '#2C3E50', // Panel background
  panelBorder: '#FF6B35', // Panel border (primary color)
  buttonBg: '#FF6B35', // Button background
  buttonHover: '#FF8757', // Button hover state
  buttonText: '#FFFFFF', // Button text

  // Status colors
  success: '#6BCF7F', // Green for success/collection
  warning: '#FFD93D', // Yellow for warnings
  danger: '#E74C3C', // Red for damage/danger
};

// UI Design System - Typography
export const UI_TYPOGRAPHY = {
  // Font family (loaded via Google Fonts in index.html)
  fontFamily: '"Press Start 2P", cursive',

  // Font sizes (pixel perfect sizes for retro feel)
  sizeXXL: '48px', // Main title
  sizeXL: '32px', // Subtitles
  sizeLarge: '24px', // Headers
  sizeMedium: '16px', // Body text, buttons
  sizeSmall: '12px', // Small labels, hints
  sizeXS: '8px', // Tiny credits

  // Line heights (tight for pixel fonts)
  lineHeightTight: 1.2,
  lineHeightNormal: 1.4,
  lineHeightRelaxed: 1.6,
};

// UI Design System - Spacing
export const UI_SPACING = {
  // Base spacing unit (8px grid system)
  unit: 8,

  // Specific spacing values
  xs: 4,
  small: 8,
  medium: 16,
  large: 24,
  xl: 32,
  xxl: 48,

  // Padding
  paddingSmall: 8,
  paddingMedium: 16,
  paddingLarge: 24,

  // Margins
  marginSmall: 8,
  marginMedium: 16,
  marginLarge: 24,
};

// UI Design System - Layout
export const UI_LAYOUT = {
  // Border radius (minimal for pixel art aesthetic)
  borderRadiusSmall: 4,
  borderRadiusMedium: 8,
  borderRadiusLarge: 12,

  // Border thickness
  borderThin: 2,
  borderMedium: 3,
  borderThick: 4,

  // Shadow depths (for 3D button effect)
  shadowShallow: 2,
  shadowMedium: 4,
  shadowDeep: 6,
};
