import Phaser from 'phaser';
import { PLAYER, DEPTHS } from '../config/gameConfig';

export class Player extends Phaser.Events.EventEmitter {
  public sprite!: Phaser.Physics.Arcade.Sprite;
  private scene: Phaser.Scene;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private animState: string = 'idle';
  private landingLockUntil: number = 0;
  private dustEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private wasGrounded: boolean = true;

  constructor(scene: Phaser.Scene, x: number, y: number, dustEmitter?: Phaser.GameObjects.Particles.ParticleEmitter) {
    super();
    this.scene = scene;
    this.dustEmitter = dustEmitter;

    // Create sprite with physics (use first frame of idle spritesheet)
    this.sprite = scene.physics.add.sprite(x, y, 'dog_idle', 0);

    // Set physics body size to match config
    this.sprite.setDisplaySize(PLAYER.width, PLAYER.height);
    this.sprite.body.setSize(PLAYER.width, PLAYER.height);

    // Set depth for proper layering
    this.sprite.setDepth(DEPTHS.player);

    // Enable collision with world bounds
    this.sprite.setCollideWorldBounds(true);

    // Apply physics properties
    this.sprite.setDrag(PLAYER.drag, 0);
    this.sprite.setMaxVelocity(PLAYER.speed, 1000);

    // Setup input
    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.keyA = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    // Create animations
    this.createAnimations();

    // Start with idle animation
    this.sprite.play('idle_left', true);

    console.log(`🐕 Player spawned at (${x}, ${y})`);
  }

  private createAnimations() {
    const anims = this.scene.anims;

    // Create animations from spritesheets (each spritesheet has multiple frames)
    // idle: 5 frames
    if (!anims.exists('idle_left')) {
      anims.create({
        key: 'idle_left',
        frames: anims.generateFrameNumbers('dog_idle', { start: 0, end: 4 }),
        frameRate: 8,
        repeat: -1,
      });
    }

    // walk: 5 frames
    if (!anims.exists('walk_left')) {
      anims.create({
        key: 'walk_left',
        frames: anims.generateFrameNumbers('dog_walk', { start: 0, end: 4 }),
        frameRate: 10,
        repeat: -1,
      });
    }

    // jump: 2 frames
    if (!anims.exists('jump_left')) {
      anims.create({
        key: 'jump_left',
        frames: anims.generateFrameNumbers('dog_jump', { start: 0, end: 1 }),
        frameRate: 10,
        repeat: 0,
      });
    }

    // land: 2 frames
    if (!anims.exists('land_left')) {
      anims.create({
        key: 'land_left',
        frames: anims.generateFrameNumbers('dog_land', { start: 0, end: 1 }),
        frameRate: 10,
        repeat: 0,
      });
    }
  }

  public update(time: number, delta: number) {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    // Check for fall respawn
    if (this.sprite.y > 720) {
      this.respawn();
      return;
    }

    // Handle horizontal movement
    const isLeftDown = this.cursors.left.isDown || this.keyA.isDown;
    const isRightDown = this.cursors.right.isDown || this.keyD.isDown;

    if (isLeftDown) {
      this.sprite.setAccelerationX(-PLAYER.acceleration);
      this.sprite.flipX = false; // Face left (original sprite direction)
    } else if (isRightDown) {
      this.sprite.setAccelerationX(PLAYER.acceleration);
      this.sprite.flipX = true; // Face right (flip sprite horizontally)
    } else {
      this.sprite.setAccelerationX(0);
    }

    // Handle jump
    const isJumpPressed = this.cursors.up.isDown || this.cursors.space.isDown;
    if (isJumpPressed && body.touching.down) {
      this.sprite.setVelocityY(PLAYER.jumpVelocity);

      // Emit dust particles at player's feet on jump
      if (this.dustEmitter) {
        this.dustEmitter.emitParticleAt(this.sprite.x, this.sprite.y + PLAYER.height / 2, 4);
      }

      // Emit 'jumped' event for sound
      this.emit('jumped');
    }

    // Animation state machine (prevent jitter with landing lock)
    if (time < this.landingLockUntil) {
      return; // Skip animation updates during landing lock
    }

    const isGrounded = body.touching.down;
    const isMoving = Math.abs(body.velocity.x) > 10;

    // Detect landing (transition from air to ground)
    if (isGrounded && !this.wasGrounded) {
      // Player just landed - emit dust particles
      if (this.dustEmitter) {
        this.dustEmitter.emitParticleAt(this.sprite.x, this.sprite.y + PLAYER.height / 2, 5);
      }

      // Emit 'landed' event for camera shake
      this.emit('landed');
    }

    // Update grounded state for next frame
    this.wasGrounded = isGrounded;

    if (isGrounded) {
      if (isMoving && this.animState !== 'walk') {
        this.animState = 'walk';
        this.sprite.play('walk_left', true);
      } else if (!isMoving && this.animState !== 'idle') {
        this.animState = 'idle';
        this.sprite.play('idle_left', true);
      }
    } else {
      // In air
      if (body.velocity.y < 0 && this.animState !== 'jump') {
        // Jumping up
        this.animState = 'jump';
        this.sprite.play('jump_left', true);
      } else if (body.velocity.y > 0 && this.animState !== 'land') {
        // Falling down
        this.animState = 'land';
        this.sprite.play('land_left', true);
        // Lock animations briefly after landing to prevent jitter
        this.landingLockUntil = time + 100;
      }
    }
  }

  private respawn() {
    this.sprite.setPosition(PLAYER.spawnX, PLAYER.spawnY);
    this.sprite.setVelocity(0, 0);
    this.sprite.setAcceleration(0, 0);
    console.log(`🐕 Player respawned at (${PLAYER.spawnX}, ${PLAYER.spawnY})`);
  }

  public destroy() {
    this.sprite.destroy();
  }
}
