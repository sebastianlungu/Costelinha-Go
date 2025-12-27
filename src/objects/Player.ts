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

    // Create sprite with physics (use first idle frame)
    this.sprite = scene.physics.add.sprite(x, y, 'dog_idle_1');

    // Scale down the sprite (PNGs are ~327x268, need to scale to ~48x48)
    this.sprite.setScale(0.15);

    // Set physics body size to match config
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

    // Start with idle animation (animations are created in BootScene)
    this.sprite.play('idle', true);

    console.log(`🐕 Player spawned at (${x}, ${y})`);
  }

  public update(time: number, delta: number) {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    // Check for fall respawn
    if (this.sprite.y > 720) {
      this.respawn();
      return;
    }

    // Use body.blocked.down for more stable ground detection (less flickering than touching.down)
    const isGrounded = body.blocked.down || body.touching.down;

    // Handle horizontal movement - use velocity for responsive ground control, acceleration for air
    const isLeftDown = this.cursors.left.isDown || this.keyA.isDown;
    const isRightDown = this.cursors.right.isDown || this.keyD.isDown;

    if (isLeftDown) {
      // Direct velocity for responsive ground movement, acceleration helps in air
      this.sprite.setVelocityX(-PLAYER.speed);
      this.sprite.setAccelerationX(-PLAYER.acceleration);
      this.sprite.flipX = false; // Face left (original sprite direction)
    } else if (isRightDown) {
      this.sprite.setVelocityX(PLAYER.speed);
      this.sprite.setAccelerationX(PLAYER.acceleration);
      this.sprite.flipX = true; // Face right (flip sprite horizontally)
    } else {
      this.sprite.setAccelerationX(0);
      // Let drag handle deceleration naturally
    }

    // Handle jump
    const isJumpPressed = this.cursors.up.isDown || this.cursors.space.isDown;
    if (isJumpPressed && isGrounded) {
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
        this.sprite.play('walk', true);
      } else if (!isMoving && this.animState !== 'idle') {
        this.animState = 'idle';
        this.sprite.play('idle', true);
      }
    } else {
      // In air
      if (body.velocity.y < 0 && this.animState !== 'jump') {
        // Jumping up
        this.animState = 'jump';
        this.sprite.play('jump', true);
      } else if (body.velocity.y > 0 && this.animState !== 'fall') {
        // Falling down
        this.animState = 'fall';
        this.sprite.play('fall', true);
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
