import Phaser from 'phaser';
import { PLAYER, DEPTHS } from '../config/gameConfig';

export class Player {
  public sprite!: Phaser.Physics.Arcade.Sprite;
  private scene: Phaser.Scene;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private animState: string = 'idle';
  private landingLockUntil: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;

    // Create sprite with physics
    this.sprite = scene.physics.add.sprite(x, y, 'dog', 'NOBGdog_idle_left_5x48x48.png');

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

    // Note: The atlas contains single frames for each animation type
    // Each frame name represents the full sprite sheet for that animation
    // We'll use single-frame animations for now

    // Idle animation
    if (!anims.exists('idle_left')) {
      anims.create({
        key: 'idle_left',
        frames: [{ key: 'dog', frame: 'NOBGdog_idle_left_5x48x48.png' }],
        frameRate: 8,
        repeat: -1,
      });
    }

    // Walk animation
    if (!anims.exists('walk_left')) {
      anims.create({
        key: 'walk_left',
        frames: [{ key: 'dog', frame: 'NOBGdog_walk_left_5x48x48.png' }],
        frameRate: 10,
        repeat: -1,
      });
    }

    // Jump animation
    if (!anims.exists('jump_left')) {
      anims.create({
        key: 'jump_left',
        frames: [{ key: 'dog', frame: 'NOBGdog_jump_left_2x48x48.png' }],
        frameRate: 10,
        repeat: 0,
      });
    }

    // Land animation
    if (!anims.exists('land_left')) {
      anims.create({
        key: 'land_left',
        frames: [{ key: 'dog', frame: 'NOBGdog_land_left_2x48x48.png' }],
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
    }

    // Animation state machine (prevent jitter with landing lock)
    if (time < this.landingLockUntil) {
      return; // Skip animation updates during landing lock
    }

    const isGrounded = body.touching.down;
    const isMoving = Math.abs(body.velocity.x) > 10;

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
