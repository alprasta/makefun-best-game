// Spore Sprint — Pip, the little spore. Run / jump / dash physics with coyote
// time, a jump buffer and variable jump height, plus squash-and-stretch so the
// character reads as alive. The player reports events (landed, hurt, fell) and
// the game turns them into sound, particles and hearts.

import {
  GRAVITY, MOVE_SPEED, JUMP_VELOCITY, DASH_SPEED, DASH_TIME, DASH_COOLDOWN,
  COYOTE_TIME, JUMP_BUFFER, PLAYER_W, PLAYER_H,
} from './config.js';

export class Player {
  constructor(x, y) {
    this.reset(x, y);
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.w = PLAYER_W;
    this.h = PLAYER_H;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.onGround = false;
    this.standing = null; // platform currently stood on (rides movers)
    this.coyote = 0;
    this.jumpBuf = 0;
    this.dashTime = 0;
    this.dashCooldown = 0;
    this.dashDir = 1;
    this.invuln = 0; // seconds of hurt-invulnerability left
    this.squash = 0; // squash-and-stretch amount, -1..1
    this.wasFalling = 0;
    this.dead = false;
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }
  get feet() { return this.y + this.h; }

  update(dt, input, level) {
    if (this.dead) return { landed: false, fell: false };
    const wasOnGround = this.onGround;
    const prevVy = this.vy;

    this.coyote = this.onGround ? COYOTE_TIME : Math.max(0, this.coyote - dt);
    this.jumpBuf = input.jumpPressed ? JUMP_BUFFER : Math.max(0, this.jumpBuf - dt);
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    this.squash *= Math.pow(0.001, dt); // decay toward 0
    this.wasFalling = Math.max(0, this.wasFalling - dt);

    // Ride a moving platform we are standing on.
    if (this.standing && this.standing.dx !== undefined) {
      this.x += this.standing.dx;
      this.y += this.standing.dy;
    }

    // Horizontal movement.
    const target = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    if (target !== 0) this.facing = target;
    const accel = this.onGround ? 0.9 : 0.55;
    const maxSpeed = this.dashTime > 0 ? DASH_SPEED : MOVE_SPEED;
    if (this.dashTime > 0) {
      this.vx = this.dashDir * DASH_SPEED;
    } else if (target !== 0) {
      this.vx += target * accel;
      this.vx = Math.max(-maxSpeed, Math.min(maxSpeed, this.vx));
    } else {
      this.vx *= this.onGround ? 0.72 : 0.94;
      if (Math.abs(this.vx) < 0.08) this.vx = 0;
    }

    // Dash: a short burst, with a few frames of invulnerability.
    if (input.dashPressed && this.dashCooldown <= 0 && this.dashTime <= 0) {
      this.dashTime = DASH_TIME;
      this.dashCooldown = DASH_COOLDOWN;
      this.dashDir = target !== 0 ? target : this.facing;
      this.vy = Math.min(this.vy, 0);
      this.invuln = Math.max(this.invuln, 0.24);
    }
    this.dashTime = Math.max(0, this.dashTime - dt);

    // Jump: buffered, with coyote time; releasing early cuts the jump short.
    if (this.jumpBuf > 0 && (this.onGround || this.coyote > 0)) {
      this.vy = JUMP_VELOCITY;
      this.onGround = false;
      this.coyote = 0;
      this.jumpBuf = 0;
      this.squash = -0.45; // stretch up
      this.standing = null;
    }
    if (!input.jumpHeld && this.vy < -5) this.vy += GRAVITY * 1.6; // early release = short hop

    this.vy += GRAVITY;
    if (this.vy > 16) this.vy = 16;
    if (this.dashTime > 0) this.vy = 0; // dash flies level

    const box = { x: this.x, y: this.y, w: this.w, h: this.h };
    this.standing = level.moveBox(box, this.vx, this.vy);
    this.x = box.x;
    this.y = box.y;
    this.onGround = this.standing !== null;

    const landed = !wasOnGround && this.onGround;
    if (landed) {
      this.squash = 0.4; // squash on landing
      if (prevVy > 9) this.wasFalling = 0.25;
    }

    // Fell out of the world.
    const fell = this.y > 760;
    return { landed, fell };
  }

  // A thorn beetle or bramble touched Pip: lose a heart unless invulnerable.
  hurt(fromX) {
    if (this.invuln > 0 || this.dead) return false;
    this.invuln = 1.3;
    this.vy = -8;
    this.vx = this.cx < fromX ? -6 : 6;
    this.onGround = false;
    this.standing = null;
    this.squash = 0.5;
    return true;
  }
}
