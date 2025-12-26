import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    console.log('🎨 Loading assets...');

    // Load dog sprite sheets (NOT atlas - each file is a horizontal spritesheet)
    // Note: Vite serves assets/ as public root, so reference from /
    // idle: 5 frames of 374.8x301 each (1874 width / 5 frames)
    this.load.spritesheet('dog_idle', '/atlas/NOBGdog_idle_left_5x48x48.png', {
      frameWidth: 374.8,
      frameHeight: 301,
    });

    // walk: 5 frames of 382x268 each (1910 width / 5 frames)
    this.load.spritesheet('dog_walk', '/atlas/NOBGdog_walk_left_5x48x48.png', {
      frameWidth: 382,
      frameHeight: 268,
    });

    // jump: 2 frames of 759x352 each (1518 width / 2 frames)
    this.load.spritesheet('dog_jump', '/atlas/NOBGdog_jump_left_2x48x48.png', {
      frameWidth: 759,
      frameHeight: 352,
    });

    // land: 2 frames of 820x312 each (1640 width / 2 frames)
    this.load.spritesheet('dog_land', '/atlas/NOBGdog_land_left_2x48x48.png', {
      frameWidth: 820,
      frameHeight: 312,
    });

    // Load menu background
    this.load.image('menu_background', '/menu_background.png');

    // Load bone collectible sprite
    this.load.image('bone', '/food/bone.png');

    // Load parallax background layers (Kenney assets)
    this.load.image('bg_sky', '/tiles/Backgrounds/tile_0000.png'); // Light blue sky tile
    this.load.image('bg_clouds_far', '/backgrounds/cloud1.png'); // Far clouds
    this.load.image('bg_clouds_near', '/backgrounds/cloud2.png'); // Near clouds
    this.load.image('bg_sun', '/backgrounds/sun.png'); // Sun decoration
    this.load.image('bg_grass_decor', '/backgrounds/grass1.png'); // Foreground grass decoration

    // Load platform tiles (Kenney pixel platformer - 21x21px tiles)
    this.load.image('tile_grass_top', '/tiles/tile_0001.png'); // Brown grass top
    this.load.image('tile_dirt', '/tiles/tile_0002.png'); // Brown dirt
    this.load.image('tile_dirt_alt', '/tiles/tile_0003.png'); // Brown dirt variant

    // Load particle effects (Kenney particle pack)
    this.load.image('particle_star', '/particles/star_05.png'); // Sparkle effect for collectibles
    this.load.image('particle_dust', '/particles/smoke_03.png'); // Dust effect for jump/land

    // Load UI icons
    this.load.image('ui_star', '/ui/star.png'); // Star icon for score display

    // Load UI button assets (from Kenney UI pack)
    this.load.image('ui_button_rectangle', '/ui/Default/button_rectangle_depth_border.png'); // Main button
    this.load.image('ui_button_square', '/ui/Default/button_square_depth_border.png'); // Square button

    // Load UI control icons
    this.load.image('ui_arrow_up', '/ui/arrowUp.png'); // Up arrow
    this.load.image('ui_arrow_left', '/ui/arrowLeft.png'); // Left arrow
    this.load.image('ui_arrow_right', '/ui/arrowRight.png'); // Right arrow

    // Load audio assets
    console.log('🎵 Loading audio assets...');

    // Music
    this.load.audio('menu_music', '/audio/music/menu_music.mp3');
    this.load.audio('game_music', '/audio/music/game_music.ogg');

    // SFX
    this.load.audio('jump_sfx', '/audio/sfx/jump.wav');
    this.load.audio('land_sfx', '/audio/sfx/land.wav');
    this.load.audio('collect_sfx', '/audio/sfx/collect.wav');
    this.load.audio('ui_click_sfx', '/audio/sfx/ui_click.ogg');
    this.load.audio('win_sfx', '/audio/sfx/win.ogg');
  }

  create() {
    // FAIL-LOUD ASSET VALIDATION
    this.validateAssets();

    console.log('✅ Assets loaded and validated');
    console.log('🎮 Starting MenuScene...');

    // Start MenuScene
    this.scene.start('MenuScene');
  }

  /**
   * Validates that all required assets are loaded in the cache.
   * Throws an error if any asset is missing.
   * This implements "fail loud" - better to crash early than render broken graphics.
   */
  private validateAssets() {
    // Define manifest of all required texture keys
    const requiredTextures = [
      'dog_idle',         // Dog idle spritesheet
      'dog_walk',         // Dog walk spritesheet
      'dog_jump',         // Dog jump spritesheet
      'dog_land',         // Dog land spritesheet
      'menu_background',  // Menu background image
      'bone',             // Bone collectible
      // Parallax background layers
      'bg_sky',           // Sky tile
      'bg_clouds_far',    // Far clouds
      'bg_clouds_near',   // Near clouds
      'bg_sun',           // Sun decoration
      'bg_grass_decor',   // Foreground grass
      // Platform tiles (Kenney pixel platformer)
      'tile_grass_top',   // Grass top tile
      'tile_dirt',        // Dirt tile
      'tile_dirt_alt',    // Dirt variant tile
      // Particle effects
      'particle_star',    // Sparkle particle
      'particle_dust',    // Dust particle
      // UI icons
      'ui_star',          // Star icon
      // UI buttons and controls
      'ui_button_rectangle', // Rectangle button
      'ui_button_square',    // Square button
      'ui_arrow_up',         // Up arrow
      'ui_arrow_left',       // Left arrow
      'ui_arrow_right',      // Right arrow
    ];

    // Check each required texture exists in cache
    const missingTextures: string[] = [];

    for (const key of requiredTextures) {
      if (!this.textures.exists(key)) {
        missingTextures.push(key);
      }
    }

    // Fail loud if any textures are missing
    if (missingTextures.length > 0) {
      const errorMsg = `❌ ASSET LOAD FAILED: Missing texture key(s): ${missingTextures.join(', ')}

Check BootScene.preload() to ensure these assets are loaded correctly.
Asset paths should be relative to public root (e.g., '/atlas/dog.png' not '/assets/atlas/dog.png')`;

      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    console.log('✅ Asset validation passed - all required textures loaded');

    // Validate audio assets
    const requiredAudio = [
      'menu_music',      // Menu background music
      'game_music',      // Game background music
      'jump_sfx',        // Jump sound effect
      'land_sfx',        // Landing sound effect
      'collect_sfx',     // Collect bone sound effect
      'ui_click_sfx',    // UI click sound effect
      'win_sfx',         // Win jingle sound effect
    ];

    const missingAudio: string[] = [];

    for (const key of requiredAudio) {
      if (!this.cache.audio.exists(key)) {
        missingAudio.push(key);
      }
    }

    // Fail loud if any audio is missing
    if (missingAudio.length > 0) {
      const errorMsg = `❌ AUDIO LOAD FAILED: Missing audio key(s): ${missingAudio.join(', ')}

Check BootScene.preload() to ensure these audio assets are loaded correctly.
Audio paths should be relative to public root (e.g., '/audio/music/menu_music.mp3')`;

      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    console.log('✅ Audio validation passed - all required audio loaded');
  }
}
