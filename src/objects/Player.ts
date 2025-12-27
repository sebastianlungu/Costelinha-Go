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

    // Handle horizontal movement (always allowed)
    const isLeftDown = this.cursors.left.isDown || this.keyA.isDown;
    const isRightDown = this.cursors.right.isDown || this.keyD.isDown;

    if (isLeftDown) {
      this.sprite.setVelocityX(-PLAYER.speed);
      this.sprite.setAccelerationX(-PLAYER.acceleration);
      this.sprite.flipX = false;
    } else if (isRightDown) {
      this.sprite.setVelocityX(PLAYER.speed);
      this.sprite.setAccelerationX(PLAYER.acceleration);
      this.sprite.flipX = true;
    } else {
      this.sprite.setAccelerationX(0);
    }

    // Jump - use raw physics flags (any true frame allows jump)
    const canJump = body.blocked.down || body.touching.down;
    const isJumpPressed = this.cursors.up.isDown || this.cursors.space.isDown;
    if (isJumpPressed && canJump) {
      this.sprite.setVelocityY(PLAYER.jumpVelocity);
      if (this.dustEmitter) {
        this.dustEmitter.emitParticleAt(this.sprite.x, this.sprite.y + PLAYER.height / 2, 4);
      }
      this.emit('jumped');
    }

    // Detect landing: was airborne (velocity large), now grounded (velocity small)
    const wasAirborne = this.wasGrounded === false;
    const isAirborne = Math.abs(body.velocity.y) > 50;

    if (wasAirborne && !isAirborne && body.velocity.y >= 0) {
      if (this.dustEmitter) {
        this.dustEmitter.emitParticleAt(this.sprite.x, this.sprite.y + PLAYER.height / 2, 5);
      }
      this.emit('landed');
    }
    this.wasGrounded = !isAirborne;

    // Animation based purely on velocity (not grounded state)
    if (time < this.landingLockUntil) return;

    const isMoving = Math.abs(body.velocity.x) > 10;

    if (Math.abs(body.velocity.y) < 50) {
      // Ground animations (velocity.y is small = on ground)
      if (isMoving && this.animState !== 'walk') {
        this.animState = 'walk';
        this.sprite.play('walk', true);
      } else if (!isMoving && this.animState !== 'idle') {
        this.animState = 'idle';
        this.sprite.play('idle', true);
      }
    } else if (body.velocity.y < 0) {
      // Jumping up
      if (this.animState !== 'jump') {
        this.animState = 'jump';
        this.sprite.play('jump', true);
      }
    } else {
      // Falling down
      if (this.animState !== 'fall') {
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
