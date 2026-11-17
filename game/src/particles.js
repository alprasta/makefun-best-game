// Spore Sprint — particles and floating score text. Two flavours: world-space
// bursts (pickups, landings, hurt, portal sparkles) and screen-space drifting
// spores that float through the garden for atmosphere.

export class Particles {
  constructor() {
    this.list = []; // world-space bursts
    this.texts = []; // floating "+100" style labels
    this.ambient = []; // screen-space drifting spores, seeded per level
  }

  seedAmbient(rng, viewW, viewH, count = 46) {
    this.ambient = [];
    for (let i = 0; i < count; i++) {
      this.ambient.push({
        x: rng() * viewW,
        y: rng() * viewH,
        r: 1 + rng() * 2.6,
        vy: -(0.12 + rng() * 0.35),
        vx: (rng() - 0.5) * 0.25,
        phase: rng() * Math.PI * 2,
        alpha: 0.25 + rng() * 0.5,
        hue: rng(),
      });
    }
  }

  burst(x, y, { count = 12, colors = ['#5ff2ff', '#e8feff', '#8cf5b0'], speed = 3.2, size = 4, life = 0.7, gravity = 0.12 } = {}) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.35 + Math.random() * 0.65);
      this.list.push({
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 1,
        r: size * (0.5 + Math.random() * 0.7),
        color: colors[Math.floor(Math.random() * colors.length)],
        life: life * (0.6 + Math.random() * 0.6),
        maxLife: life,
        gravity,
      });
    }
  }

  trail(x, y, color, size = 5) {
    this.list.push({
      x, y, vx: 0, vy: 0, r: size,
      color, life: 0.35, maxLife: 0.35, gravity: 0,
    });
  }

  floatText(x, y, text, color = '#ffffff', size = 18) {
    this.texts.push({ x, y, text, color, size, life: 1.0, maxLife: 1.0 });
  }

  update(dt, viewW, viewH) {
    // Velocities are per-frame at 60fps, so scale by dt * 60.
    for (const p of this.list) {
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      p.vy += p.gravity * dt * 60;
      p.life -= dt;
    }
    this.list = this.list.filter((p) => p.life > 0);
    for (const t of this.texts) {
      t.y -= 42 * dt;
      t.life -= dt;
    }
    this.texts = this.texts.filter((t) => t.life > 0);
    for (const a of this.ambient) {
      a.y += a.vy;
      a.x += a.vx + Math.sin(a.phase + performance.now() / 900) * 0.15;
      a.phase += dt * 0.5;
      if (a.y < -6) { a.y = viewH + 6; a.x = Math.random() * viewW; }
      if (a.x < -6) a.x = viewW + 6;
      if (a.x > viewW + 6) a.x = -6;
    }
  }

  drawAmbient(ctx) {
    for (const a of this.ambient) {
      const tw = 0.6 + 0.4 * Math.sin(a.phase * 2);
      ctx.globalAlpha = a.alpha * tw;
      ctx.fillStyle = a.hue > 0.6 ? '#ffd166' : '#9ff5ff';
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawWorld(ctx) {
    for (const p of this.list) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (const t of this.texts) {
      ctx.globalAlpha = Math.min(1, (t.life / t.maxLife) * 1.6);
      ctx.font = `bold ${t.size}px "Trebuchet MS", Verdana, sans-serif`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(20,8,40,0.85)';
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }
}
