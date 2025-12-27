import Phaser from 'phaser';
import { UI_TYPOGRAPHY } from '../config/gameConfig';

export class BootScene extends Phaser.Scene {
  private fontLoaded: boolean = false;
  private assetsLoaded: boolean = false;

  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    console.log('🎨 Loading assets...');

    // Start font loading in parallel with asset loading
    this.loadFont();

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

    // Load tilemap for heart sprites (18x18 tiles, 20 columns, 9 rows)
    // Hearts are at: full heart (4,0), half heart (5,0), empty heart (6,0)
    this.load.spritesheet('tilemap_packed', '/Tilemap/tilemap_packed.png', {
      frameWidth: 18,
      frameHeight: 18,
    });

    // Enemy sprites are generated programmatically in create() to avoid
    // external asset dependency issues. See createVacuumSprite() method.

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
    // Mark assets as loaded (Phaser calls create after preload completes)
    this.assetsLoaded = true;

    // Generate vacuum enemy sprite programmatically (avoids external asset dependency)
    this.createVacuumSprite();

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

    // Try to proceed to next scene if font is also ready
    this.tryProceedToMenu();
  }

  /**
   * Loads the pixel font using the CSS Font Loading API.
   * This ensures the font is fully loaded before Phaser creates text objects.
   */
  private loadFont() {
    console.log('🎨 Loading pixel font...');

    // Get font family name from config (without quotes for the FontFace API)
    const fontFamily = UI_TYPOGRAPHY.fontFamilyRaw;

    // Check if CSS Font Loading API is available
    if (document.fonts && document.fonts.load) {
      // Use CSS Font Loading API to wait for font to be ready
      document.fonts.load(`16px "${fontFamily}"`).then(() => {
        console.log('✅ Pixel font loaded via CSS Font Loading API');
        this.fontLoaded = true;
        document.body.classList.add('fonts-loaded');
        this.tryProceedToMenu();
      }).catch((err) => {
        console.warn('⚠️ CSS Font Loading API failed, using fallback:', err);
        // Fallback: assume font is loaded after a short delay
        this.time.delayedCall(500, () => {
          this.fontLoaded = true;
          this.tryProceedToMenu();
        });
      });
    } else {
      // Fallback for browsers without CSS Font Loading API
      console.log('⚠️ CSS Font Loading API not available, using fallback');
      // Create an invisible element with the font to trigger loading
      const testElement = document.createElement('span');
      testElement.style.fontFamily = `"${fontFamily}", monospace`;
      testElement.style.fontSize = '1px';
      testElement.style.position = 'absolute';
      testElement.style.left = '-9999px';
      testElement.textContent = 'Font loading test';
      document.body.appendChild(testElement);

      // Wait a short time for font to load
      this.time.delayedCall(500, () => {
        document.body.removeChild(testElement);
        this.fontLoaded = true;
        this.tryProceedToMenu();
      });
    }
  }

  /**
   * Attempts to proceed to the MenuScene once both assets and font are loaded.
   */
  private tryProceedToMenu() {
    if (this.assetsLoaded && this.fontLoaded) {
      console.log('🎮 Both assets and font loaded, starting MenuScene...');
      this.scene.start('MenuScene');
    } else {
      console.log(`⏳ Waiting... Assets: ${this.assetsLoaded}, Font: ${this.fontLoaded}`);
    }
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
      // Tilemap for hearts
      'tilemap_packed',      // Tilemap with heart sprites
      // Note: 'vacuum' enemy sprite is generated programmatically in create()
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

    // Log audio system state for debugging Chrome audio issues
    const audioContext = (this.sound as any).context as AudioContext | undefined;
    console.log(`🎵 Audio system ready - locked: ${this.sound.locked}, context.state: ${audioContext?.state || 'N/A'}`);

    // Log loaded audio files
    const audioKeys = ['menu_music', 'game_music', 'jump_sfx', 'land_sfx', 'collect_sfx', 'ui_click_sfx', 'win_sfx'];
    const loadedAudio = audioKeys.filter(key => this.cache.audio.exists(key));
    const missingAudio = audioKeys.filter(key => !this.cache.audio.exists(key));

    if (loadedAudio.length > 0) {
      console.log(`🎵 Audio files loaded: ${loadedAudio.join(', ')}`);
    }
    if (missingAudio.length > 0) {
      console.warn(`⚠️ Audio files missing: ${missingAudio.join(', ')}`);
    }

    console.log('🎵 Audio will unlock on first user interaction (Chrome policy)');
  }

  /**
   * Creates a vacuum cleaner sprite programmatically using canvas.
   * This generates a 48x24 spritesheet with 2 frames for walk animation.
   *
   * SPRITE LICENSE: Created in-house for this project (Costelinha Go).
   * Free to use/modify within this project.
   *
   * Design: Roomba-style circular vacuum cleaner
   * - Frame 0: Wheels at neutral position
   * - Frame 1: Wheels slightly rotated (animation)
   */
  private createVacuumSprite(): void {
    const frameWidth = 24;
    const frameHeight = 24;
    const totalWidth = frameWidth * 2; // 2 frames side by side

    // Create a canvas to draw the vacuum sprite
    const canvas = document.createElement('canvas');
    canvas.width = totalWidth;
    canvas.height = frameHeight;
    const ctx = canvas.getContext('2d')!;

    // Draw both frames
    for (let frame = 0; frame < 2; frame++) {
      const offsetX = frame * frameWidth;

      // Clear frame area
      ctx.clearRect(offsetX, 0, frameWidth, frameHeight);

      // Vacuum body (Roomba-style circular design)
      // Main body - dark gray circle
      ctx.fillStyle = '#4a4a4a';
      ctx.beginPath();
      ctx.arc(offsetX + 12, 12, 10, 0, Math.PI * 2);
      ctx.fill();

      // Body highlight - lighter gray arc on top
      ctx.fillStyle = '#6a6a6a';
      ctx.beginPath();
      ctx.arc(offsetX + 12, 10, 7, Math.PI, 0);
      ctx.fill();

      // Red status light on top
      ctx.fillStyle = frame === 0 ? '#ff3333' : '#ff6666'; // Blink between frames
      ctx.beginPath();
      ctx.arc(offsetX + 12, 6, 2, 0, Math.PI * 2);
      ctx.fill();

      // Light glow effect
      ctx.fillStyle = frame === 0 ? '#ff666644' : '#ff999944';
      ctx.beginPath();
      ctx.arc(offsetX + 12, 6, 3, 0, Math.PI * 2);
      ctx.fill();

      // Suction inlet (dark area at front)
      ctx.fillStyle = '#2a2a2a';
      ctx.beginPath();
      ctx.arc(offsetX + 18, 12, 3, -Math.PI / 2, Math.PI / 2);
      ctx.fill();

      // Wheels - two small circles at bottom
      ctx.fillStyle = '#333333';
      const wheelOffset = frame === 0 ? 0 : 1; // Slight movement between frames

      // Left wheel
      ctx.beginPath();
      ctx.arc(offsetX + 6, 19 + wheelOffset, 3, 0, Math.PI * 2);
      ctx.fill();

      // Right wheel
      ctx.beginPath();
      ctx.arc(offsetX + 18, 19 - wheelOffset, 3, 0, Math.PI * 2);
      ctx.fill();

      // Wheel details (spokes/treads)
      ctx.strokeStyle = '#555555';
      ctx.lineWidth = 1;

      // Left wheel spoke
      ctx.beginPath();
      ctx.moveTo(offsetX + 4, 19 + wheelOffset);
      ctx.lineTo(offsetX + 8, 19 + wheelOffset);
      ctx.stroke();

      // Right wheel spoke
      ctx.beginPath();
      ctx.moveTo(offsetX + 16, 19 - wheelOffset);
      ctx.lineTo(offsetX + 20, 19 - wheelOffset);
      ctx.stroke();

      // Outer ring detail
      ctx.strokeStyle = '#3a3a3a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(offsetX + 12, 12, 9, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Add the canvas as a spritesheet texture
    this.textures.addSpriteSheet('vacuum', canvas, {
      frameWidth: frameWidth,
      frameHeight: frameHeight,
    });

    console.log('🎨 Vacuum sprite generated programmatically (2 frames, 24x24 each)');
  }
}
