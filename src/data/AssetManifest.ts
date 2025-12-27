/**
 * AssetManifest.ts - Definitive asset manifest for the 10-level campaign
 *
 * This file is the single source of truth for all game assets.
 * All texture keys and file paths are defined here.
 *
 * Asset source: Kenney.nl CC0 Pixel Platformer (public domain)
 */

// =============================================================================
// THEME DEFINITIONS
// =============================================================================

export type ThemeId =
  | 'grasslands'  // Theme 1: Intro level
  | 'forest'      // Theme 2: Dense trees
  | 'desert'      // Theme 3: Cacti and pyramids
  | 'snow'        // Theme 4: Ice and snow
  | 'cave'        // Theme 5: Underground
  | 'swamp'       // Theme 6: Murky waters
  | 'beach'       // Theme 7: Palm trees and sand
  | 'industrial'  // Theme 8: City/factory
  | 'night'       // Theme 9: Dark/moonlit
  | 'volcano';    // Theme 10: Lava and fire

// =============================================================================
// ASSET MANIFEST
// =============================================================================

export const ASSET_MANIFEST = {
  // ---------------------------------------------------------------------------
  // PLAYER CHARACTER
  // ---------------------------------------------------------------------------
  characters: {
    dog: {
      type: 'spritesheet' as const,
      path: '/atlas/dog_spritesheet.png',
      frameWidth: 383,
      frameHeight: 339,
      // Frame indices: 0-3 idle, 4-6 walk, 7 jump, 8 airborne, 9 falling
    },
  },

  // ---------------------------------------------------------------------------
  // ENEMIES (from tilemap-characters_packed.png - 24x24px sprites)
  // Note: These are extracted from the tilemap-characters sheet
  // Characters include: robots, slimes, aliens, and various creatures
  // ---------------------------------------------------------------------------
  enemies: {
    // Ground patrol enemies (walk back and forth)
    groundPatrol: {
      // Using robot/slime characters from tilemap-characters
      // Frame positions in tilemap-characters_packed.png (24x24 grid, 9 cols):
      // Row 0: Blue robots (0-8), Row 1: Green aliens (9-17), Row 2: Pink creatures (18-26)
      tilemap: '/Tilemap/tilemap-characters_packed.png',
      tileSize: 24,
      // Specific enemy variants by tile index
      variants: {
        blueRobot: { row: 0, frames: [0, 1] },      // Blue robot idle
        greenAlien: { row: 1, frames: [0, 1] },    // Green alien idle
        pinkCreature: { row: 2, frames: [0, 1] },  // Pink creature idle
      },
      // MISSING: Need animated sprites for patrol behavior
      // Suggested source: Kenney "Pixel Platformer Characters" or Pixel Frog
      status: 'partial' as const,
    },

    // Hopper enemies (jump periodically)
    hopper: {
      // Can use pink/orange creature from characters sheet
      tilemap: '/Tilemap/tilemap-characters_packed.png',
      tileSize: 24,
      variants: {
        pinkHopper: { row: 2, frames: [3, 4] },
      },
      status: 'partial' as const,
    },

    // Flyer enemies (move in sine wave pattern)
    flyer: {
      // Can use the bat-like or bird characters from sheet
      tilemap: '/Tilemap/tilemap-characters_packed.png',
      tileSize: 24,
      variants: {
        bat: { row: 2, frames: [6, 7] },
      },
      status: 'partial' as const,
    },
  },

  // ---------------------------------------------------------------------------
  // COLLECTIBLES
  // ---------------------------------------------------------------------------
  collectibles: {
    bone: {
      type: 'image' as const,
      path: '/food/bone.png',
      status: 'ready' as const,
    },

    // Hearts for HP pickup (individual PNGs)
    heart: {
      type: 'image' as const,
      paths: {
        heartFull: '/ui/heart_full.png',
        heartEmpty: '/ui/heart_empty.png',
      },
      status: 'ready' as const,
    },

    // Gems/coins from tilemap
    gem: {
      tilemap: '/Tilemap/tilemap_packed.png',
      tileSize: 18,
      tiles: {
        diamond: { x: 7, y: 0 },      // Blue diamond
        coin: { x: 8, y: 8 },         // Yellow coin
      },
      status: 'ready' as const,
    },
  },

  // ---------------------------------------------------------------------------
  // BACKGROUNDS - Parallax layers per theme
  // Using individual background decorations + solid color backgrounds
  // ---------------------------------------------------------------------------
  backgrounds: {
    // Shared elements (used across themes)
    shared: {
      clouds: [
        '/backgrounds/cloud1.png',
        '/backgrounds/cloud2.png',
        '/backgrounds/cloud3.png',
        '/backgrounds/cloud4.png',
        '/backgrounds/cloud5.png',
        '/backgrounds/cloud6.png',
        '/backgrounds/cloud7.png',
        '/backgrounds/cloud8.png',
        '/backgrounds/cloud9.png',
      ],
      sun: '/backgrounds/sun.png',
      moon: '/backgrounds/moon.png',
      moonFull: '/backgrounds/moonFull.png',
      moonHalf: '/backgrounds/moon_half.png',
    },

    // Theme-specific backgrounds
    // Note: tilemap-backgrounds_packed.png contains 4 themed BG strips (64x72 each)
    // Strip 1 (x:0): Blue sky with white silhouettes (Grasslands/Forest)
    // Strip 2 (x:64): Orange/Desert theme
    // Strip 3 (x:128): Green forest/jungle
    // Strip 4 (not shown): Snow/Ice variant available in separate assets

    grasslands: {
      skyColor: '#87CEEB', // Light blue
      layers: [
        { key: 'bg_sky', path: '/tiles/Backgrounds/tile_0000.png', scrollFactor: 0 },
      ],
      decorations: [
        '/backgrounds/grass1.png',
        '/backgrounds/grass2.png',
        '/backgrounds/grass3.png',
        '/backgrounds/bush1.png',
        '/backgrounds/bush2.png',
        '/backgrounds/tree01.png',
        '/backgrounds/tree02.png',
      ],
      status: 'ready' as const,
    },

    forest: {
      skyColor: '#5D8A66', // Forest green-blue
      layers: [
        { key: 'bg_sky', path: '/tiles/Backgrounds/tile_0000.png', scrollFactor: 0 },
      ],
      decorations: [
        '/backgrounds/tree01.png',
        '/backgrounds/tree02.png',
        '/backgrounds/tree03.png',
        '/backgrounds/tree04.png',
        '/backgrounds/tree05.png',
        '/backgrounds/treePine.png',
        '/backgrounds/bush3.png',
        '/backgrounds/bush4.png',
        '/backgrounds/bushAlt1.png',
        '/backgrounds/bushAlt2.png',
      ],
      status: 'ready' as const,
    },

    desert: {
      skyColor: '#F4A460', // Sandy brown
      layers: [
        { key: 'bg_desert', path: '/tiles/Backgrounds/tile_0002.png', scrollFactor: 0 },
      ],
      decorations: [
        '/backgrounds/cactus1.png',
        '/backgrounds/cactus2.png',
        '/backgrounds/cactus3.png',
        '/backgrounds/pyramid.png',
        '/backgrounds/pyramidMayan.png',
        '/backgrounds/piramid.png',
        '/backgrounds/temple.png',
      ],
      status: 'ready' as const,
    },

    snow: {
      skyColor: '#B0C4DE', // Light steel blue
      layers: [
        { key: 'bg_sky', path: '/tiles/Backgrounds/tile_0000.png', scrollFactor: 0 },
      ],
      decorations: [
        '/backgrounds/treeFrozen.png',
        '/backgrounds/treePineFrozen.png',
        '/backgrounds/treeLongFrozen.png',
        '/backgrounds/treePineSnow.png',
        '/backgrounds/treeLongSnow.png',
        '/backgrounds/treeSnow.png',
      ],
      status: 'ready' as const,
    },

    cave: {
      skyColor: '#2F2F2F', // Dark gray
      layers: [
        // No sky - use solid dark background
      ],
      decorations: [
        // Cave-specific props would need to be sourced
        // Using castle walls as cave walls
        '/backgrounds/castleWall.png',
        '/backgrounds/castleWallAlt.png',
        '/backgrounds/castle_wall.png',
      ],
      status: 'partial' as const, // Limited cave-specific assets
    },

    swamp: {
      skyColor: '#4A5D23', // Murky green
      layers: [
        { key: 'bg_sky', path: '/tiles/Backgrounds/tile_0000.png', scrollFactor: 0 },
      ],
      decorations: [
        '/backgrounds/treeDead.png',
        '/backgrounds/tree08.png', // Dead-looking trees
        '/backgrounds/tree09.png',
        '/backgrounds/bush3.png',
        '/backgrounds/bush4.png',
      ],
      status: 'partial' as const, // Limited swamp-specific assets
    },

    beach: {
      skyColor: '#87CEEB', // Light blue sky
      layers: [
        { key: 'bg_sky', path: '/tiles/Backgrounds/tile_0000.png', scrollFactor: 0 },
      ],
      decorations: [
        '/backgrounds/treePalm.png',
        '/backgrounds/sun.png',
      ],
      status: 'partial' as const, // Limited beach-specific assets (no water tiles)
    },

    industrial: {
      skyColor: '#708090', // Slate gray
      layers: [
        { key: 'bg_sky', path: '/tiles/Backgrounds/tile_0000.png', scrollFactor: 0 },
      ],
      decorations: [
        '/backgrounds/house1.png',
        '/backgrounds/house2.png',
        '/backgrounds/houseAlt1.png',
        '/backgrounds/houseAlt2.png',
        '/backgrounds/houseSmall1.png',
        '/backgrounds/houseSmall2.png',
        '/backgrounds/tower.png',
        '/backgrounds/towerAlt.png',
        '/backgrounds/fence.png',
        '/backgrounds/fenceIron.png',
        '/backgrounds/castle_beige.png',
        '/backgrounds/castle_grey.png',
      ],
      status: 'ready' as const,
    },

    night: {
      skyColor: '#191970', // Midnight blue
      layers: [
        // Dark sky color, no tile needed
      ],
      decorations: [
        '/backgrounds/moon.png',
        '/backgrounds/moonFull.png',
        '/backgrounds/moon_half.png',
        '/backgrounds/tree01.png', // Silhouette trees
        '/backgrounds/treePine.png',
      ],
      status: 'ready' as const,
    },

    volcano: {
      skyColor: '#8B0000', // Dark red
      layers: [
        // Red/orange sky background
      ],
      decorations: [
        '/backgrounds/treeDead.png', // Burnt trees
        // Would need lava/fire decorations - can use particles
      ],
      status: 'partial' as const, // Limited volcano-specific assets
    },
  },

  // ---------------------------------------------------------------------------
  // PLATFORM TILES (from tiles/ folder - 18x18px Kenney tiles)
  // Organized by terrain type for theme mapping
  // ---------------------------------------------------------------------------
  tiles: {
    // Tile naming convention from Kenney:
    // tile_0000-0029: Grass/green terrain
    // tile_0030-0059: Dirt/brown terrain
    // tile_0060-0089: Gray stone terrain
    // tile_0090-0119: Blue ice terrain
    // tile_0120-0149: Sand/yellow terrain
    // ... etc (900 total tiles)

    grasslands: {
      top: ['/tiles/tile_0001.png', '/tiles/tile_0019.png', '/tiles/tile_0020.png'],
      middle: ['/tiles/tile_0002.png', '/tiles/tile_0021.png'],
      bottom: ['/tiles/tile_0003.png', '/tiles/tile_0022.png'],
      corner: {
        topLeft: '/tiles/tile_0019.png',
        topRight: '/tiles/tile_0021.png',
        bottomLeft: '/tiles/tile_0049.png',
        bottomRight: '/tiles/tile_0051.png',
      },
      status: 'ready' as const,
    },

    forest: {
      // Green/brown mix tiles
      top: ['/tiles/tile_0001.png', '/tiles/tile_0019.png'],
      middle: ['/tiles/tile_0002.png', '/tiles/tile_0032.png'],
      bottom: ['/tiles/tile_0003.png', '/tiles/tile_0033.png'],
      status: 'ready' as const,
    },

    desert: {
      // Sand/tan colored tiles (indices ~120-149)
      top: ['/tiles/tile_0121.png', '/tiles/tile_0139.png', '/tiles/tile_0140.png'],
      middle: ['/tiles/tile_0122.png', '/tiles/tile_0141.png'],
      bottom: ['/tiles/tile_0123.png', '/tiles/tile_0142.png'],
      status: 'ready' as const,
    },

    snow: {
      // White/blue ice tiles (indices ~90-119)
      top: ['/tiles/tile_0091.png', '/tiles/tile_0109.png', '/tiles/tile_0110.png'],
      middle: ['/tiles/tile_0092.png', '/tiles/tile_0111.png'],
      bottom: ['/tiles/tile_0093.png', '/tiles/tile_0112.png'],
      status: 'ready' as const,
    },

    cave: {
      // Gray stone tiles (indices ~60-89)
      top: ['/tiles/tile_0061.png', '/tiles/tile_0079.png', '/tiles/tile_0080.png'],
      middle: ['/tiles/tile_0062.png', '/tiles/tile_0081.png'],
      bottom: ['/tiles/tile_0063.png', '/tiles/tile_0082.png'],
      status: 'ready' as const,
    },

    swamp: {
      // Dark green/brown tiles
      top: ['/tiles/tile_0001.png'], // Reuse grass with tint
      middle: ['/tiles/tile_0002.png'],
      bottom: ['/tiles/tile_0003.png'],
      status: 'ready' as const,
    },

    beach: {
      // Sand tiles similar to desert
      top: ['/tiles/tile_0121.png', '/tiles/tile_0139.png'],
      middle: ['/tiles/tile_0122.png'],
      bottom: ['/tiles/tile_0123.png'],
      status: 'ready' as const,
    },

    industrial: {
      // Metal/gray tiles
      top: ['/tiles/tile_0061.png', '/tiles/tile_0079.png'],
      middle: ['/tiles/tile_0062.png', '/tiles/tile_0081.png'],
      bottom: ['/tiles/tile_0063.png'],
      status: 'ready' as const,
    },

    night: {
      // Same as grasslands but will be tinted darker
      top: ['/tiles/tile_0001.png', '/tiles/tile_0019.png'],
      middle: ['/tiles/tile_0002.png'],
      bottom: ['/tiles/tile_0003.png'],
      status: 'ready' as const,
    },

    volcano: {
      // Red/dark tiles (would need special handling or tinting)
      // Using stone tiles with red tint
      top: ['/tiles/tile_0061.png'],
      middle: ['/tiles/tile_0062.png'],
      bottom: ['/tiles/tile_0063.png'],
      status: 'partial' as const,
    },
  },

  // ---------------------------------------------------------------------------
  // PARTICLES (from particles/ folder - various effect sprites)
  // ---------------------------------------------------------------------------
  particles: {
    // Jump/land dust effects
    dust: [
      '/particles/smoke_01.png',
      '/particles/smoke_02.png',
      '/particles/smoke_03.png',
      '/particles/smoke_04.png',
      '/particles/smoke_05.png',
    ],

    // Collection sparkle effects
    sparkle: [
      '/particles/star_01.png',
      '/particles/star_02.png',
      '/particles/star_03.png',
      '/particles/star_04.png',
      '/particles/star_05.png',
    ],

    // Fire effects (for volcano theme)
    fire: [
      '/particles/fire_01.png',
      '/particles/fire_02.png',
      '/particles/flame_01.png',
      '/particles/flame_02.png',
      '/particles/flame_03.png',
    ],

    // Magic effects (for power-ups)
    magic: [
      '/particles/magic_01.png',
      '/particles/magic_02.png',
      '/particles/magic_03.png',
      '/particles/magic_04.png',
      '/particles/magic_05.png',
    ],

    // Impact effects
    impact: [
      '/particles/circle_01.png',
      '/particles/circle_02.png',
      '/particles/circle_03.png',
    ],

    // Light/glow effects
    light: [
      '/particles/light_01.png',
      '/particles/light_02.png',
      '/particles/light_03.png',
    ],

    status: 'ready' as const,
  },

  // ---------------------------------------------------------------------------
  // UI ELEMENTS (from ui/ folder - Kenney UI pack)
  // ---------------------------------------------------------------------------
  ui: {
    // Icons
    icons: {
      locked: '/ui/locked.png',
      checkmark: '/ui/checkmark.png',
      cross: '/ui/cross.png',
      gear: '/ui/gear.png',
      home: '/ui/home.png',
      pause: '/ui/pause.png',
      play: '/ui/forward.png',
      restart: '/ui/return.png',
      star: '/ui/Default/star.png',
      starOutline: '/ui/Default/star_outline.png',
      trophy: '/ui/trophy.png',
      medal1: '/ui/medal1.png',
      medal2: '/ui/medal2.png',
      information: '/ui/information.png',
      question: '/ui/question.png',
      warning: '/ui/warning.png',
      exclamation: '/ui/exclamation.png',
      musicOn: '/ui/musicOn.png',
      musicOff: '/ui/musicOff.png',
      audioOn: '/ui/audioOn.png',
      audioOff: '/ui/audioOff.png',
    },

    // Directional arrows
    arrows: {
      up: '/ui/arrowUp.png',
      down: '/ui/arrowDown.png',
      left: '/ui/arrowLeft.png',
      right: '/ui/arrowRight.png',
    },

    // Button backgrounds (Default style - single resolution)
    buttons: {
      rectangleFlat: '/ui/Default/button_rectangle_flat.png',
      rectangleDepth: '/ui/Default/button_rectangle_depth_border.png',
      rectangleGradient: '/ui/Default/button_rectangle_gradient.png',
      squareFlat: '/ui/Default/button_square_flat.png',
      squareDepth: '/ui/Default/button_square_depth_border.png',
      roundFlat: '/ui/Default/button_round_flat.png',
      roundDepth: '/ui/Default/button_round_depth_border.png',
    },

    // Sliders and checkboxes
    controls: {
      sliderHorizontal: '/ui/Default/slide_horizontal_color.png',
      sliderVertical: '/ui/Default/slide_vertical_color.png',
      checkSquare: '/ui/Default/check_square_color_checkmark.png',
      checkSquareEmpty: '/ui/Default/check_square_grey.png',
      checkRound: '/ui/Default/check_round_color.png',
      checkRoundEmpty: '/ui/Default/check_round_grey.png',
    },

    // HUD elements
    hud: {
      // Hearts for HP display
      heartFull: '/ui/heart_full.png',
      heartEmpty: '/ui/heart_empty.png',
      // Using star for score display
      scoreStar: '/ui/Default/star.png',
    },

    status: 'ready' as const,
  },

  // ---------------------------------------------------------------------------
  // TILEMAPS (packed spritesheets for Tiled integration)
  // ---------------------------------------------------------------------------
  tilemaps: {
    main: {
      image: '/Tilemap/tilemap_packed.png',
      tileWidth: 18,
      tileHeight: 18,
      columns: 20,
      rows: 9,
    },
    characters: {
      image: '/Tilemap/tilemap-characters_packed.png',
      tileWidth: 24,
      tileHeight: 24,
      columns: 9,
      rows: 3,
    },
    backgrounds: {
      image: '/Tilemap/tilemap-backgrounds_packed.png',
      tileWidth: 24,
      tileHeight: 24,
      columns: 8,
      rows: 3,
    },
  },

  // ---------------------------------------------------------------------------
  // MENU/SPLASH SCREENS
  // ---------------------------------------------------------------------------
  screens: {
    menuBackground: '/menu_background.png',
  },

  // ---------------------------------------------------------------------------
  // AUDIO (paths only - actual files in /assets/audio/)
  // ---------------------------------------------------------------------------
  audio: {
    music: {
      menu: '/audio/ocean-waves-376898.mp3',
      game: ['/audio/music/game_music.mp3', '/audio/music/game_music.ogg'],
    },
    sfx: {
      jump: ['/audio/sfx/jump.mp3', '/audio/sfx/jump.ogg'],
      land: ['/audio/sfx/land.mp3', '/audio/sfx/land.ogg'],
      collect: ['/audio/sfx/collect.mp3', '/audio/sfx/collect.ogg'],
      uiClick: ['/audio/sfx/ui_click.mp3', '/audio/sfx/ui_click.ogg'],
      win: ['/audio/sfx/win.mp3', '/audio/sfx/win.ogg'],
    },
  },
};

// =============================================================================
// THEME-TO-ASSET MAPPING
// =============================================================================

export const THEME_ASSETS: Record<ThemeId, {
  background: typeof ASSET_MANIFEST.backgrounds.grasslands;
  tiles: typeof ASSET_MANIFEST.tiles.grasslands;
  skyColor: string;
}> = {
  grasslands: {
    background: ASSET_MANIFEST.backgrounds.grasslands,
    tiles: ASSET_MANIFEST.tiles.grasslands,
    skyColor: '#87CEEB',
  },
  forest: {
    background: ASSET_MANIFEST.backgrounds.forest,
    tiles: ASSET_MANIFEST.tiles.forest,
    skyColor: '#5D8A66',
  },
  desert: {
    background: ASSET_MANIFEST.backgrounds.desert,
    tiles: ASSET_MANIFEST.tiles.desert,
    skyColor: '#F4A460',
  },
  snow: {
    background: ASSET_MANIFEST.backgrounds.snow,
    tiles: ASSET_MANIFEST.tiles.snow,
    skyColor: '#B0C4DE',
  },
  cave: {
    background: ASSET_MANIFEST.backgrounds.cave,
    tiles: ASSET_MANIFEST.tiles.cave,
    skyColor: '#2F2F2F',
  },
  swamp: {
    background: ASSET_MANIFEST.backgrounds.swamp,
    tiles: ASSET_MANIFEST.tiles.swamp,
    skyColor: '#4A5D23',
  },
  beach: {
    background: ASSET_MANIFEST.backgrounds.beach,
    tiles: ASSET_MANIFEST.tiles.beach,
    skyColor: '#87CEEB',
  },
  industrial: {
    background: ASSET_MANIFEST.backgrounds.industrial,
    tiles: ASSET_MANIFEST.tiles.industrial,
    skyColor: '#708090',
  },
  night: {
    background: ASSET_MANIFEST.backgrounds.night,
    tiles: ASSET_MANIFEST.tiles.night,
    skyColor: '#191970',
  },
  volcano: {
    background: ASSET_MANIFEST.backgrounds.volcano,
    tiles: ASSET_MANIFEST.tiles.volcano,
    skyColor: '#8B0000',
  },
};

// =============================================================================
// MISSING ASSETS REPORT
// =============================================================================

export const MISSING_ASSETS = {
  critical: [
    {
      asset: 'Enemy sprites (animated)',
      description: 'Current enemy sprites in tilemap-characters are static, need walk/attack anims',
      workaround: 'Use static sprites with simple movement, or tween-based animation',
      suggestedSource: 'Kenney "Pixel Platformer Characters" expansion or Pixel Frog packs',
    },
  ],

  optional: [
    {
      asset: 'Water tiles',
      description: 'For beach/swamp themes - animated water surface',
      suggestedSource: 'Kenney "Pixel Platformer" or "RPG Urban Pack"',
    },
    {
      asset: 'Lava tiles',
      description: 'For volcano theme - animated lava',
      suggestedSource: 'Kenney "Pixel Platformer" or create with particle effects',
    },
    {
      asset: 'Cave stalactites/stalagmites',
      description: 'Cave decoration props',
      suggestedSource: 'Kenney "Pixel Platformer" or 0x72 dungeon pack',
    },
    {
      asset: 'Swamp props',
      description: 'Lily pads, vines, murky water',
      suggestedSource: 'Pixel Frog or OpenGameArt swamp packs',
    },
  ],
};

// =============================================================================
// VALIDATION FUNCTION
// =============================================================================

/**
 * Validates that all required assets exist in the Phaser cache.
 * Call this after preload() completes to fail fast on missing assets.
 *
 * @param cache - Phaser.Cache.CacheManager from scene
 * @throws Error if any required texture is missing
 */
export function validateAssetManifest(
  textures: Phaser.Textures.TextureManager,
  audio: Phaser.Cache.BaseCache
): void {
  const missing: string[] = [];

  // Required textures that must exist
  const requiredTextures = [
    // Player
    'dog',

    // Core UI
    'menu_background',

    // Collectibles
    'bone',

    // Background elements
    'bg_sky',
    'bg_clouds_far',
    'bg_clouds_near',
    'bg_sun',
    'bg_grass_decor',

    // Platform tiles
    'tile_grass_top',
    'tile_dirt',
    'tile_dirt_alt',

    // Particles
    'particle_star',
    'particle_dust',

    // UI
    'ui_star',
    'heart_full',
    'heart_empty',
    'ui_button_rectangle',
    'ui_button_square',
    'ui_arrow_up',
    'ui_arrow_left',
    'ui_arrow_right',
  ];

  for (const key of requiredTextures) {
    if (!textures.exists(key)) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    const errorMsg = `
================================================================================
ASSET VALIDATION FAILED - Missing required textures:
================================================================================
${missing.map(key => `  - ${key}`).join('\n')}

Check BootScene.preload() to ensure these assets are being loaded.
Asset paths should be relative to public root (e.g., '/atlas/dog.png')
================================================================================`;

    console.error(errorMsg);
    throw new Error(`Missing ${missing.length} required texture(s): ${missing.join(', ')}`);
  }

  console.log('Asset validation passed - all required textures loaded');
}

// =============================================================================
// HELPER: Get assets for a specific theme
// =============================================================================

export function getThemeAssets(themeId: ThemeId) {
  return {
    background: ASSET_MANIFEST.backgrounds[themeId],
    tiles: ASSET_MANIFEST.tiles[themeId],
    ...THEME_ASSETS[themeId],
  };
}

// =============================================================================
// HELPER: Get all particle paths for preloading
// =============================================================================

export function getAllParticlePaths(): string[] {
  const paths: string[] = [];
  const particles = ASSET_MANIFEST.particles;

  paths.push(...particles.dust);
  paths.push(...particles.sparkle);
  paths.push(...particles.fire);
  paths.push(...particles.magic);
  paths.push(...particles.impact);
  paths.push(...particles.light);

  return paths;
}

// =============================================================================
// HELPER: Get all background decoration paths for a theme
// =============================================================================

export function getBackgroundDecorations(themeId: ThemeId): string[] {
  const theme = ASSET_MANIFEST.backgrounds[themeId];
  return theme.decorations || [];
}
