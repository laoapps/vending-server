import { Component, OnInit } from '@angular/core';
import Phaser from 'phaser';

class GameScene extends Phaser.Scene {
  player: Phaser.Physics.Arcade.Sprite | undefined;
  aliens: Phaser.Physics.Arcade.Group | undefined;
  bullets: Phaser.Physics.Arcade.Group | undefined;
  cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
  fireButton: Phaser.Input.Keyboard.Key | undefined;
  lastFired = 0;

  constructor() {
    super('game-scene');
  }

  preload() {
    this.load.image('player', 'assets/player.png');
    this.load.image('alien', 'assets/alien.png');
    this.load.image('bullet', 'assets/bullet.png');
  }

  create() {
    // Scale for large screens
    const { width, height } = this.scale;
    this.scale.setGameSize(width, height);

    // Player
    this.player = this.physics.add.sprite(width / 2, height - 50, 'player').setScale(2);
    this.player.setCollideWorldBounds(true);

    // Aliens
    this.aliens = this.physics.add.group();
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 8; x++) {
        const alien = this.aliens.create(100 + x * 100, 100 + y * 100, 'alien').setScale(2);
        alien.setData('health', 1);
      }
    }

    // Bullets
    this.bullets = this.physics.add.group({
      classType: Phaser.GameObjects.Sprite,
      maxSize: 30,
      runChildUpdate: true
    });

    // Controls
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.fireButton = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Touch controls for tablets
    this.input.addPointer(2);
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.player && pointer.isDown) {
        this.player.x = pointer.x;
      }
    });
    this.input.on('pointerdown', () => {
      this.fireBullet();
    });

    // Collisions
    this.physics.add.overlap(this.bullets, this.aliens, this.hitAlien as any, undefined, this);
  }

  update(time: number) {
    // Player movement (keyboard)
    if (this.cursors && this.player) {
      if (this.cursors.left.isDown) {
        this.player.x -= 5;
      } else if (this.cursors.right.isDown) {
        this.player.x += 5;
      }
      if (this.fireButton?.isDown && time > this.lastFired) {
        this.fireBullet();
      }
    }

    // Move aliens
    this.aliens?.children.iterate((alien: any) => {
      alien.y += 0.1;
      return true;
    });
  }

  fireBullet() {
    if (!this.player || !this.bullets) return;
    const bullet = this.bullets.create(this.player.x, this.player.y - 20, 'bullet');
    if (bullet) {
      bullet.setActive(true).setVisible(true).setScale(1.5);
      bullet.body.velocity.y = -400;
      this.lastFired = this.time.now + 200;
    }
  }

  hitAlien(bullet: Phaser.GameObjects.GameObject | Phaser.Physics.Arcade.Sprite, alien: Phaser.GameObjects.GameObject | Phaser.Physics.Arcade.Sprite) {
    if (!(bullet instanceof Phaser.GameObjects.Sprite) || !(alien instanceof Phaser.GameObjects.Sprite)) {
      return; // Safety check for type mismatch
    }
    bullet.destroy();
    const health = alien.getData('health') - 1;
    alien.setData('health', health);
    if (health <= 0) {
      alien.destroy();
    }
  }
}


@Component({
  selector: 'app-space-invaders',
  templateUrl: './space-invaders.page.html',
  styleUrls: ['./space-invaders.page.scss'],
})
export class SpaceInvadersPage implements OnInit {

  constructor() { }

  ngOnInit() {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      parent: 'game-container',
      scene: [GameScene],
      physics: {
        default: 'arcade',
        arcade: {
          gravity: {x:0, y: 0 },
          debug: false
        }
      },
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
      }
    };
    new Phaser.Game(config);
  }

}
