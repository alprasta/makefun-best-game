// Spore Sprint — a level is the data from config.js turned into live objects:
// platforms (some sliding back and forth), dew drops that bob, thorn beetles
// patrolling their stretch of ground, brambles, bounce mushrooms, a checkpoint
// flag and the Bloom Portal. The level updates movers and beetles and answers
// "what solid ground is under this box?" for the player physics.

import { LEVELS } from './config.js';

export class Level {
  constructor(index) {
    const def = LEVELS[index];
    this.index = index;
    this.def = def;
    this.name = def.name;
    this.sub = def.sub;
    this.width = def.width;
    this.parTime = def.parTime;
    this.dropsNeeded = def.dropsNeeded;
    this.spawn = { ...def.spawn };
    this.checkpoint = { ...def.checkpoint, reached: false };
    this.portal = { ...def.portal, open: false };

    this.platforms = def.platforms.map((p) => ({
      ...p,
      x0: p.x, y0: p.y,
      dx: 0, dy: 0, // movement this frame, so riders get carried
      phase: Math.random() * Math.PI * 2,
    }));
    this.drops = def.drops.map((d) => ({ ...d, taken: false, bob: Math.random() * Math.PI * 2 }));
    this.beetles = def.beetles.map((b) => ({
      ...b, dir: Math.random() < 0.5 ? 1 : -1, w: 40, h: 28, walk: Math.random() * 10,
    }));
    this.brambles = def.brambles.map((b) => ({ ...b, h: 26 }));
    this.bounce = def.bounce.map((b) => ({ ...b, w: 46, h: 26, squash: 0 }));
    this.time = 0;
  }

  get dropsLeft() { return this.drops.filter((d) => !d.taken).length; }
  get dropsGot() { return this.drops.filter((d) => d.taken).length; }

  update(dt) {
    this.time += dt;
    for (const p of this.platforms) {
      if (!p.mover) { p.dx = 0; p.dy = 0; continue; }
      const m = p.mover;
      const prevX = p.x;
      const prevY = p.y;
      const t = (this.time * m.speed + p.phase) % (Math.PI * 2);
      // Smooth ping-pong: 0..1..0 along the axis.
      const k = (1 - Math.cos(t)) / 2;
      if (m.axis === 'x') p.x = m.from + (m.to - m.from) * k;
      else p.y = m.from + (m.to - m.from) * k;
      p.dx = p.x - prevX;
      p.dy = p.y - prevY;
    }
    for (const b of this.beetles) {
      b.x += b.dir * b.speed;
      b.walk += dt * 10;
      if (b.x < b.minX) { b.x = b.minX; b.dir = 1; }
      if (b.x > b.maxX) { b.x = b.maxX; b.dir = -1; }
    }
    for (const d of this.drops) d.bob += dt * 3;
    for (const b of this.bounce) b.squash = Math.max(0, b.squash - dt * 4);
    this.portal.open = this.dropsGot >= this.dropsNeeded;
  }

  // Axis-separated solid collision: move x, resolve, then y, resolve.
  // Returns the platform the box is standing on (or null).
  moveBox(box, vx, vy) {
    let standing = null;
    box.x += vx;
    for (const p of this.platforms) {
      if (this._overlaps(box, p)) {
        if (vx > 0) box.x = p.x - box.w;
        else if (vx < 0) box.x = p.x + p.w;
      }
    }
    box.y += vy;
    for (const p of this.platforms) {
      if (this._overlaps(box, p)) {
        if (vy > 0) {
          box.y = p.y - box.h;
          standing = p;
        } else if (vy < 0) {
          box.y = p.y + p.h;
        }
      }
    }
    return standing;
  }

  _overlaps(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // A bounce mushroom whose cap the box just landed on.
  bounceAt(box) {
    for (const b of this.bounce) {
      if (box.x + box.w > b.x && box.x < b.x + b.w
        && box.y + box.h >= b.y - 4 && box.y + box.h <= b.y + 18) {
        return b;
      }
    }
    return null;
  }
}
