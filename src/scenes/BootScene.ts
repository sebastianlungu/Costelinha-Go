import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    console.log('🎨 Loading assets...');

    // Load dog animation spritesheet (all frames in a single image)
    // Frame order: idle1, idle2, idle3, idle4, walk1, walk2, walk3, jump, airborne, falling
    // Frame size: 383x339 (normalized from varying original sizes)
    this.load.spritesheet('dog', '/atlas/dog_spritesheet.png', {
      frameWidth: 383,
      frameHeight: 339
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

    // Music - provide both MP3 and OGG for cross-browser support
    // Phaser will automatically use the first compatible format
    this.load.audio('menu_music', ['/audio/music/menu_music.mp3', '/audio/music/menu_music.ogg']);
    this.load.audio('game_music', ['/audio/music/game_music.mp3', '/audio/music/game_music.ogg']);

    // SFX - provide both formats for Safari compatibility
    this.load.audio('jump_sfx', ['/audio/sfx/jump.mp3', '/audio/sfx/jump.ogg']);
    this.load.audio('land_sfx', ['/audio/sfx/land.mp3', '/audio/sfx/land.ogg']);
    this.load.audio('collect_sfx', ['/audio/sfx/collect.mp3', '/audio/sfx/collect.ogg']);
    this.load.audio('ui_click_sfx', ['/audio/sfx/ui_click.mp3', '/audio/sfx/ui_click.ogg']);
    this.load.audio('win_sfx', ['/audio/sfx/win.mp3', '/audio/sfx/win.ogg']);

    // Add audio load error detection for debugging
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.error(`❌ Failed to load: ${file.key} from ${file.url}`);
    });
  }

  create() {
    // FAIL-LOUD ASSET VALIDATION
    this.validateAssets();

    // Create animations from spritesheet frame indices
    // Frame indices: 0-3 idle, 4-6 walk, 7 jump, 8 airborne, 9 falling
    // Using a single spritesheet prevents texture-swapping flicker

    // Idle: frames 0-3
    this.anims.create({
      key: 'idle',
      frames: this.anims.generateFrameNumbers('dog', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1
    });

    // Walk: frames 4-6
    this.anims.create({
      key: 'walk',
      frames: this.anims.generateFrameNumbers('dog', { start: 4, end: 6 }),
      frameRate: 10,
      repeat: -1
    });

    // Jump: frame 7
    this.anims.create({
      key: 'jump',
      frames: this.anims.generateFrameNumbers('dog', { start: 7, end: 7 }),
      frameRate: 1,
      repeat: 0
    });

    // Airborne: frame 8 (currently unused but kept for future)
    this.anims.create({
      key: 'airborne',
      frames: this.anims.generateFrameNumbers('dog', { start: 8, end: 8 }),
      frameRate: 1,
      repeat: 0
    });

    // Fall: frame 9
    this.anims.create({
      key: 'fall',
      frames: this.anims.generateFrameNumbers('dog', { start: 9, end: 9 }),
      frameRate: 1,
      repeat: 0
    });

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
      // Dog spritesheet (single texture with all animation frames)
      'dog',
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
      'particle_star',    // Sparkle effect for collectibles
      'particle_dust',    // Dust effect for jump/land
      // UI icons
      'ui_star',          // Star icon for score display
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
    console.log('🎵 Audio files loaded (will be available after Web Audio unlock)');
  }
}
