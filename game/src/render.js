// Spore Sprint — everything you see. Canvas-drawn art (no image files): a dusk
// mushroom garden with parallax silhouettes, mushroom-cap platforms, a glowing
// dew drop, thorn beetles, the Bloom Portal, Pip the spore with squash and
// stretch, the HUD, and every menu screen. All drawing is in two spaces:
// world space (camera transform, units) and screen space (HUD, menus, pixels).

import { VIEW_HEIGHT, PALETTE } from './config.js';
import { mulberry32, range } from './random.js';

const FONT = '"Trebuchet MS", Verdana, sans-serif';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.shake = 0;
    this.farLayer = [];
    this.midLayer = [];
    this.stars = [];
    this._seedDecor(7);
  }

  _seedDecor(seed) {
    const rng = mulberry32(seed);
    this.farLayer = [];
    this.midLayer = [];
    this.stars = [];
    for (let i = 0; i < 90; i++) {
      this.farLayer.push({
        x: rng() * 3600, h: range(rng, 90, 260), w: range(rng, 60, 150),
        capR: range(rng, 40, 90), lean: range(rng, -0.15, 0.15),
      });
    }
    for (let i = 0; i < 60; i++) {
      this.midLayer.push({
        x: rng() * 3600, h: range(rng, 60, 170), w: range(rng, 50, 110),
        capR: range(rng, 30, 65), lean: range(rng, -0.2, 0.2),
      });
    }
    for (let i = 0; i < 70; i++) {
      this.stars.push({ x: rng() * 1600, y: rng() * 260, r: range(rng, 0.6, 2.0), phase: rng() * 6.28 });
    }
  }

  addShake(amount) { this.shake = Math.min(14, this.shake + amount); }

  // ---- background ---------------------------------------------------------

  drawBackground(theme, camX, viewW, time) {
    const { ctx, canvas } = this;
    const W = canvas.width;
    const H = canvas.height;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, theme.skyTop);
    g.addColorStop(0.55, theme.skyMid);
    g.addColorStop(1, theme.skyBottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Stars.
    for (const s of this.stars) {
      const tw = 0.35 + 0.65 * Math.abs(Math.sin(time * 0.7 + s.phase));
      ctx.globalAlpha = tw * 0.8;
      ctx.fillStyle = '#fff8e0';
      ctx.beginPath();
      ctx.arc((s.x - camX * 0.08) % (W + 40), s.y * (H / VIEW_HEIGHT), s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // A big low moon.
    const moonX = W * 0.78 - camX * 0.05;
    const moonY = H * 0.16;
    const mg = ctx.createRadialGradient(moonX, moonY, 8, moonX, moonY, 90);
    mg.addColorStop(0, 'rgba(255, 244, 200, 0.9)');
    mg.addColorStop(0.25, 'rgba(255, 244, 200, 0.35)');
    mg.addColorStop(1, 'rgba(255, 244, 200, 0)');
    ctx.fillStyle = mg;
    ctx.fillRect(moonX - 100, moonY - 100, 200, 200);
    ctx.fillStyle = '#ffeec2';
    ctx.beginPath();
    ctx.arc(moonX, moonY, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(220, 190, 130, 0.5)';
    ctx.beginPath();
    ctx.arc(moonX - 9, moonY - 6, 6, 0, Math.PI * 2);
    ctx.arc(moonX + 10, moonY + 8, 4, 0, Math.PI * 2);
    ctx.fill();

    this._drawSilhouettes(theme.far, this.farLayer, camX * 0.25, viewW, 0.5);
    this._drawSilhouettes(theme.mid, this.midLayer, camX * 0.5, viewW, 0.72);
  }

  _drawSilhouettes(color, layer, offsetX, viewW, alpha) {
    const { ctx, canvas } = this;
    const scale = canvas.height / VIEW_HEIGHT;
    const baseY = canvas.height * 0.98;
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    const span = 3600 * scale;
    for (const m of layer) {
      let x = (m.x * scale - offsetX * scale) % span;
      if (x < -200) x += span;
      if (x > viewW * scale + 200) continue;
      const h = m.h * scale;
      const w = m.w * scale;
      const capR = m.capR * scale;
      ctx.save();
      ctx.translate(x, baseY);
      ctx.rotate(m.lean);
      ctx.beginPath();
      ctx.moveTo(-w / 2, 0);
      ctx.lineTo(-w * 0.28, -h);
      ctx.lineTo(w * 0.28, -h);
      ctx.lineTo(w / 2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -h, capR, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  // ---- world --------------------------------------------------------------

  beginWorld(camX, camY) {
    const { ctx, canvas } = this;
    const scale = canvas.height / VIEW_HEIGHT;
    ctx.save();
    const shX = this.shake > 0.2 ? (Math.random() - 0.5) * this.shake : 0;
    const shY = this.shake > 0.2 ? (Math.random() - 0.5) * this.shake : 0;
    this.shake *= 0.86;
    if (this.shake < 0.2) this.shake = 0;
    ctx.translate(shX, shY);
    ctx.scale(scale, scale);
    ctx.translate(-camX, -camY);
  }

  endWorld() { this.ctx.restore(); }

  drawPlatform(theme, p, time) {
    const { ctx } = this;
    const isGround = p.h > 40;
    if (isGround) {
      // Soil body with a glowing grassy top edge.
      ctx.fillStyle = theme.groundDark;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = theme.ground;
      ctx.fillRect(p.x, p.y, p.w, 26);
      ctx.fillStyle = theme.groundTop;
      ctx.fillRect(p.x, p.y, p.w, 7);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(p.x, p.y + 7, p.w, 2);
      // Grass tufts.
      ctx.strokeStyle = theme.groundTop;
      ctx.lineWidth = 2;
      for (let gx = p.x + 14; gx < p.x + p.w - 8; gx += 46) {
        const sway = Math.sin(time * 1.4 + gx * 0.05) * 2;
        ctx.beginPath();
        ctx.moveTo(gx, p.y + 2);
        ctx.lineTo(gx - 3 + sway, p.y - 9);
        ctx.moveTo(gx + 4, p.y + 2);
        ctx.lineTo(gx + 6 + sway, p.y - 10);
        ctx.stroke();
      }
      // Little glowing mushrooms dotted along the ground.
      for (let gx = p.x + 60; gx < p.x + p.w - 20; gx += 190) {
        this._tinyMushroom(gx, p.y, theme);
      }
    } else {
      // Floating mushroom cap: stem below, spotted cap on top.
      const stemW = Math.max(14, p.w * 0.22);
      ctx.fillStyle = theme.stem;
      ctx.beginPath();
      ctx.moveTo(p.x + p.w / 2 - stemW / 2, p.y + 8);
      ctx.lineTo(p.x + p.w / 2 + stemW / 2, p.y + 8);
      ctx.lineTo(p.x + p.w / 2 + stemW / 2 - 4, p.y + 26);
      ctx.lineTo(p.x + p.w / 2 - stemW / 2 + 4, p.y + 26);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = theme.cap;
      ctx.beginPath();
      ctx.ellipse(p.x + p.w / 2, p.y + 8, p.w / 2, 15, 0, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = theme.capSpot;
      const spots = Math.max(2, Math.floor(p.w / 42));
      for (let i = 0; i < spots; i++) {
        const sx = p.x + (p.w * (i + 0.5)) / spots + Math.sin(i * 7.3) * 6;
        ctx.beginPath();
        ctx.arc(sx, p.y + 2 + (i % 2) * 4, 3.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.ellipse(p.x + p.w / 2, p.y + 2, p.w / 2 - 8, 5, 0, Math.PI, 0);
      ctx.fill();
    }
  }

  _tinyMushroom(x, groundY, theme) {
    const { ctx } = this;
    ctx.fillStyle = theme.stem;
    ctx.fillRect(x - 1.5, groundY - 9, 3, 9);
    ctx.fillStyle = theme.cap;
    ctx.beginPath();
    ctx.arc(x, groundY - 9, 6, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = theme.capSpot;
    ctx.beginPath();
    ctx.arc(x - 2, groundY - 12, 1.4, 0, Math.PI * 2);
    ctx.arc(x + 2.5, groundY - 11, 1.1, 0, Math.PI * 2);
    ctx.fill();
  }

  drawDrop(d, time) {
    const { ctx } = this;
    const bobY = d.y + Math.sin(d.bob) * 5;
    const pulse = 1 + Math.sin(time * 4 + d.bob) * 0.08;
    const r = 11 * pulse;
    const glow = ctx.createRadialGradient(d.x, bobY, 2, d.x, bobY, 30);
    glow.addColorStop(0, 'rgba(95, 242, 255, 0.5)');
    glow.addColorStop(1, 'rgba(95, 242, 255, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(d.x, bobY, 30, 0, Math.PI * 2);
    ctx.fill();
    // Teardrop.
    ctx.fillStyle = PALETTE.dew;
    ctx.beginPath();
    ctx.moveTo(d.x, bobY - r - 4);
    ctx.quadraticCurveTo(d.x + r, bobY - 2, d.x + r * 0.85, bobY + r * 0.45);
    ctx.quadraticCurveTo(d.x + r * 0.4, bobY + r, d.x, bobY + r);
    ctx.quadraticCurveTo(d.x - r * 0.4, bobY + r, d.x - r * 0.85, bobY + r * 0.45);
    ctx.quadraticCurveTo(d.x - r, bobY - 2, d.x, bobY - r - 4);
    ctx.fill();
    ctx.fillStyle = PALETTE.dewCore;
    ctx.beginPath();
    ctx.arc(d.x - 3, bobY + 1, 3.6, 0, Math.PI * 2);
    ctx.fill();
  }

  drawBeetle(b) {
    const { ctx } = this;
    const legSwing = Math.sin(b.walk) * 4;
    ctx.save();
    ctx.translate(b.x + b.w / 2, b.y + b.h);
    ctx.scale(b.dir, 1);
    // Legs.
    ctx.strokeStyle = '#241a33';
    ctx.lineWidth = 3;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 11, -4);
      ctx.lineTo(i * 13 + legSwing * (i === 0 ? -1 : 1), 0);
      ctx.stroke();
    }
    // Body.
    ctx.fillStyle = PALETTE.beetle;
    ctx.beginPath();
    ctx.ellipse(0, -14, 21, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    // Spikes.
    ctx.fillStyle = PALETTE.beetleSpike;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 12 - 5, -22);
      ctx.lineTo(i * 12, -33);
      ctx.lineTo(i * 12 + 5, -22);
      ctx.closePath();
      ctx.fill();
    }
    // Head + eye.
    ctx.fillStyle = '#2a1e40';
    ctx.beginPath();
    ctx.arc(17, -16, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff5d73';
    ctx.beginPath();
    ctx.arc(19, -18, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(20, -19, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawBramble(b, time) {
    const { ctx } = this;
    ctx.fillStyle = PALETTE.bramble;
    const spikes = Math.max(3, Math.floor(b.w / 16));
    for (let i = 0; i < spikes; i++) {
      const x0 = b.x + (b.w * i) / spikes;
      const x1 = b.x + (b.w * (i + 1)) / spikes;
      const h = b.h - 4 + Math.sin(time * 2 + i * 1.7) * 2;
      ctx.beginPath();
      ctx.moveTo(x0, b.y + b.h);
      ctx.lineTo((x0 + x1) / 2, b.y + b.h - h);
      ctx.lineTo(x1, b.y + b.h);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.arc(b.x + b.w / 2, b.y + 6, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  drawBounce(b) {
    const { ctx } = this;
    const squash = 1 - b.squash * 0.4;
    ctx.save();
    ctx.translate(b.x + b.w / 2, b.y + b.h);
    ctx.scale(1 / Math.sqrt(squash), squash);
    ctx.fillStyle = '#f7e8c9';
    ctx.fillRect(-7, -14, 14, 14);
    ctx.fillStyle = PALETTE.bounceCap;
    ctx.beginPath();
    ctx.ellipse(0, -13, 24, 12, 0, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffe3ee';
    ctx.beginPath();
    ctx.arc(-10, -19, 3, 0, Math.PI * 2);
    ctx.arc(6, -22, 3.6, 0, Math.PI * 2);
    ctx.arc(14, -17, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawCheckpoint(cp, time) {
    const { ctx } = this;
    ctx.strokeStyle = '#e8e2ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cp.x, cp.y + 34);
    ctx.lineTo(cp.x, cp.y - 34);
    ctx.stroke();
    const wave = Math.sin(time * 5) * 3;
    ctx.fillStyle = cp.reached ? '#ffd166' : '#8d86b8';
    ctx.beginPath();
    ctx.moveTo(cp.x, cp.y - 34);
    ctx.quadraticCurveTo(cp.x + 18, cp.y - 30 + wave, cp.x + 30, cp.y - 26 + wave);
    ctx.lineTo(cp.x, cp.y - 14);
    ctx.closePath();
    ctx.fill();
  }

  drawPortal(portal, time) {
    const { ctx } = this;
    const { x, y } = portal;
    const open = portal.open;
    const cx = x;
    const cy = y + 8;
    // Glow.
    const glow = ctx.createRadialGradient(cx, cy, 6, cx, cy, 64);
    glow.addColorStop(0, open ? 'rgba(255, 209, 102, 0.55)' : 'rgba(139, 143, 180, 0.25)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, 64, 0, Math.PI * 2);
    ctx.fill();
    // Swirling ring.
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = open
        ? ['#ffd166', '#ff9f1c', '#5ff2ff'][i]
        : ['#6b6f8e', '#555a7a', '#454a68'][i];
      ctx.lineWidth = 4 - i;
      ctx.beginPath();
      const r = 34 - i * 7;
      const a0 = time * (0.9 + i * 0.35) + i * 2.1;
      ctx.arc(cx, cy, r, a0, a0 + Math.PI * 1.45);
      ctx.stroke();
    }
    // Core.
    if (open) {
      const core = ctx.createRadialGradient(cx, cy, 2, cx, cy, 26);
      core.addColorStop(0, 'rgba(255, 250, 220, 0.95)');
      core.addColorStop(1, 'rgba(255, 159, 28, 0.15)');
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx, cy, 26, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(30, 28, 52, 0.7)';
      ctx.beginPath();
      ctx.arc(cx, cy, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#8d86b8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy - 8);
      ctx.lineTo(cx + 8, cy + 8);
      ctx.moveTo(cx + 8, cy - 8);
      ctx.lineTo(cx - 8, cy + 8);
      ctx.stroke();
    }
    // Pedestal.
    ctx.fillStyle = '#3a2b4d';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 40, 34, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  drawPlayer(player, time) {
    const { ctx } = this;
    if (player.invuln > 0 && Math.floor(time * 14) % 2 === 0) return; // hurt blink
    const cx = player.cx;
    const feet = player.feet;
    const sq = player.squash;
    const stretchY = 1 - sq * 0.55;
    const stretchX = 1 + sq * 0.55;
    const dashing = player.dashTime > 0;
    ctx.save();
    ctx.translate(cx, feet);
    ctx.scale(stretchX, stretchY);
    // Shadow.
    ctx.fillStyle = 'rgba(10, 6, 24, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 16, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // Dash trail.
    if (dashing) {
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = PALETTE.pipBody;
      ctx.beginPath();
      ctx.ellipse(-player.dashDir * 26, -16, 13, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    // Body.
    const bodyGrad = ctx.createLinearGradient(0, -38, 0, 0);
    bodyGrad.addColorStop(0, '#c9ffdd');
    bodyGrad.addColorStop(1, PALETTE.pipBody);
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(0, -17, 16, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    // Sprout leaf.
    const sway = Math.sin(time * 3) * 0.12 + (player.vy < -2 ? -0.25 : 0);
    ctx.save();
    ctx.translate(0, -34);
    ctx.rotate(sway);
    ctx.strokeStyle = PALETTE.pipDark;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(2, -8, 8, -11);
    ctx.stroke();
    ctx.fillStyle = '#5ee08a';
    ctx.beginPath();
    ctx.ellipse(9, -12, 8, 4.5, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Eyes (look toward facing / movement).
    const lookX = player.facing * 2.5;
    const lookY = player.vy < -1 ? -2 : player.onGround ? 0 : 1;
    ctx.fillStyle = '#1d2b26';
    ctx.beginPath();
    ctx.ellipse(-6 + lookX, -20 + lookY, 3.4, 4.6, 0, 0, Math.PI * 2);
    ctx.ellipse(6 + lookX, -20 + lookY, 3.4, 4.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-5 + lookX, -22 + lookY, 1.3, 0, Math.PI * 2);
    ctx.arc(7 + lookX, -22 + lookY, 1.3, 0, Math.PI * 2);
    ctx.fill();
    // Blush + smile.
    ctx.fillStyle = PALETTE.pipBlush;
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.arc(-11, -13, 3, 0, Math.PI * 2);
    ctx.arc(11, -13, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#1d2b26';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, -14, 4.5, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    ctx.restore();
  }

  // ---- HUD ----------------------------------------------------------------

  drawHUD(game) {
    const { ctx, canvas } = this;
    const W = canvas.width;
    const level = game.level;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    // Hearts.
    for (let i = 0; i < 3; i++) {
      this._heart(28 + i * 34, 30, i < game.hearts);
    }
    // Level name.
    ctx.font = `bold 17px ${FONT}`;
    ctx.fillStyle = PALETTE.text;
    ctx.fillText(level.name.toUpperCase(), 20, 66);
    ctx.font = `13px ${FONT}`;
    ctx.fillStyle = PALETTE.textDim;
    ctx.fillText(level.sub, 20, 84);

    // Dew progress, top centre.
    const cx = W / 2;
    ctx.font = `bold 20px ${FONT}`;
    ctx.textAlign = 'center';
    this._dewIcon(cx - 66, 26, 1);
    ctx.fillStyle = level.portal.open ? '#ffd166' : PALETTE.text;
    ctx.fillText(`${level.dropsGot} / ${level.dropsNeeded}`, cx - 30, 34);
    ctx.font = `12px ${FONT}`;
    ctx.fillStyle = level.portal.open ? '#ffd166' : PALETTE.textDim;
    ctx.fillText(level.portal.open ? 'PORTAL OPEN — GO!' : 'DEW TO OPEN PORTAL', cx, 52);
    ctx.textAlign = 'left';

    // Score + timer, top right.
    ctx.textAlign = 'right';
    ctx.font = `bold 24px ${FONT}`;
    ctx.fillStyle = PALETTE.text;
    ctx.fillText(String(game.score).padStart(6, '0'), W - 20, 36);
    ctx.font = `13px ${FONT}`;
    ctx.fillStyle = PALETTE.textDim;
    ctx.fillText(`TIME ${this._fmtTime(level.time)}`, W - 20, 56);
    ctx.textAlign = 'left';

    // Combo meter.
    if (game.combo >= 2) {
      const mult = game.comboMult();
      const bx = W - 200;
      const by = 66;
      ctx.fillStyle = 'rgba(10, 6, 24, 0.55)';
      this._roundRect(bx, by, 180, 26, 13);
      ctx.fill();
      ctx.fillStyle = '#ff9f1c';
      const frac = game.comboTimer / 2.5;
      this._roundRect(bx + 3, by + 3, 174 * frac, 20, 10);
      ctx.fill();
      ctx.font = `bold 15px ${FONT}`;
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(`COMBO x${mult}  (${game.combo})`, bx + 90, by + 18);
      ctx.textAlign = 'left';
    }

    // Dash cooldown pips, bottom left.
    const ready = game.player.dashCooldown <= 0;
    ctx.font = `bold 12px ${FONT}`;
    ctx.fillStyle = ready ? '#8cf5b0' : PALETTE.textDim;
    ctx.fillText(ready ? 'DASH READY  [SHIFT]' : 'DASH…', 20, canvas.height - 18);
    if (!ready) {
      const frac = 1 - game.player.dashCooldown / 1.1;
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(20, canvas.height - 14, 110, 5);
      ctx.fillStyle = '#8cf5b0';
      ctx.fillRect(20, canvas.height - 14, 110 * frac, 5);
    }

    // Mute hint, bottom right.
    ctx.font = `12px ${FONT}`;
    ctx.fillStyle = 'rgba(207, 200, 245, 0.7)';
    ctx.textAlign = 'right';
    ctx.fillText(game.sound.muted ? 'MUTED  [M]' : '[M] SOUND   [P] PAUSE', W - 20, canvas.height - 18);
    ctx.textAlign = 'left';
  }

  _heart(x, y, full) {
    const { ctx } = this;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = full ? PALETTE.heart : 'rgba(255, 93, 115, 0.25)';
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.bezierCurveTo(-12, -2, -9, -12, 0, -5);
    ctx.bezierCurveTo(9, -12, 12, -2, 0, 8);
    ctx.fill();
    if (full) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.arc(-4, -5, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  _dewIcon(x, y, scale) {
    const { ctx } = this;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = PALETTE.dew;
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.quadraticCurveTo(9, -1, 8, 5);
    ctx.quadraticCurveTo(5, 11, 0, 11);
    ctx.quadraticCurveTo(-5, 11, -8, 5);
    ctx.quadraticCurveTo(-9, -1, 0, -11);
    ctx.fill();
    ctx.restore();
  }

  _fmtTime(t) {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  _roundRect(x, y, w, h, r) {
    const { ctx } = this;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ---- menus ---------------------------------------------------------------

  _button(x, y, w, h, label, input, primary = true) {
    const { ctx } = this;
    const hover = input ? input.hoverIn(x, y, w, h) : false;
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    if (primary) {
      grad.addColorStop(0, hover ? '#ffb84d' : '#ff9f1c');
      grad.addColorStop(1, hover ? '#ff8a3d' : '#ff7a1a');
    } else {
      grad.addColorStop(0, hover ? '#5a5478' : '#453f63');
      grad.addColorStop(1, hover ? '#453f63' : '#332e4d');
    }
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    this._roundRect(x + 3, y + 5, w, h, 14);
    ctx.fill();
    ctx.fillStyle = grad;
    this._roundRect(x, y, w, h, 14);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = primary ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)';
    this._roundRect(x + 1, y + 1, w - 2, h - 2, 13);
    ctx.stroke();
    ctx.font = `bold 20px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = primary ? '#2a1500' : '#fdfdff';
    ctx.fillText(label, x + w / 2, y + h / 2 + 7);
    ctx.textAlign = 'left';
    return { x, y, w, h, hover };
  }

  _panel(x, y, w, h) {
    const { ctx } = this;
    ctx.fillStyle = 'rgba(16, 10, 34, 0.94)';
    this._roundRect(x, y, w, h, 18);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(140, 245, 176, 0.35)';
    this._roundRect(x + 1, y + 1, w - 2, h - 2, 17);
    ctx.stroke();
  }

  _titleText(text, x, y, size, color, stroke = 'rgba(20,8,40,0.9)') {
    const { ctx } = this;
    ctx.font = `bold ${size}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.lineWidth = size / 6;
    ctx.strokeStyle = stroke;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.textAlign = 'left';
  }

  drawTitle(game, input, time) {
    const { ctx, canvas } = this;
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    // Dim the garden behind the title.
    ctx.fillStyle = 'rgba(12, 6, 28, 0.45)';
    ctx.fillRect(0, 0, W, H);

    // Bouncing Pip mascot.
    const bounceY = H * 0.30 + Math.sin(time * 2.4) * 10;
    ctx.save();
    ctx.translate(cx, bounceY);
    ctx.scale(2.1, 2.1);
    ctx.fillStyle = '#c9ffdd';
    ctx.beginPath();
    ctx.ellipse(0, -17, 16, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    // Sprout: a stem from the head up to the leaf, so it reads as attached.
    ctx.strokeStyle = '#3da873';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(1, -33);
    ctx.quadraticCurveTo(4, -40, 9, -42);
    ctx.stroke();
    ctx.fillStyle = '#5ee08a';
    ctx.beginPath();
    ctx.ellipse(11, -43, 8, 4.5, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1d2b26';
    ctx.beginPath();
    ctx.ellipse(-6, -20, 3.4, 4.6, 0, 0, Math.PI * 2);
    ctx.ellipse(6, -20, 3.4, 4.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1d2b26';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, -14, 4.5, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    ctx.restore();

    this._titleText('SPORE SPRINT', cx, H * 0.47, Math.min(84, W * 0.09), '#8cf5b0');
    this._titleText('a mushroom-garden dash', cx, H * 0.47 + 44, 24, '#ffd166');
    ctx.font = `16px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.textDim;
    ctx.fillText('Guide Pip through 3 glowing groves — gather dew, dodge thorn beetles,', cx, H * 0.47 + 78);
    ctx.fillText('bloom the portal, and don\'t fall in the dark.', cx, H * 0.47 + 100);
    ctx.textAlign = 'left';

    const bw = 260;
    const bh = 58;
    const btn = this._button(cx - bw / 2, H * 0.66, bw, bh, '▶  START', input, true);
    const how = this._button(cx - bw / 2, H * 0.66 + 72, bw, bh, 'HOW TO PLAY', input, false);

    // Controls strip.
    ctx.font = `14px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(207, 200, 245, 0.85)';
    ctx.fillText('← → / A D  move      SPACE  jump      SHIFT  dash      P  pause      M  mute', cx, H - 26);
    ctx.textAlign = 'left';
    return { start: btn, how };
  }

  drawHowTo(game, input) {
    const { ctx, canvas } = this;
    const W = canvas.width;
    const H = canvas.height;
    const pw = Math.min(560, W - 60);
    const ph = 380;
    const px = (W - pw) / 2;
    const py = (H - ph) / 2;
    ctx.fillStyle = 'rgba(12, 6, 28, 0.6)';
    ctx.fillRect(0, 0, W, H);
    this._panel(px, py, pw, ph);
    ctx.textAlign = 'center';
    ctx.font = `bold 28px ${FONT}`;
    ctx.fillStyle = '#8cf5b0';
    ctx.fillText('HOW TO PLAY', W / 2, py + 46);
    ctx.font = `16px ${FONT}`;
    ctx.fillStyle = PALETTE.text;
    const lines = [
      ['Move', '← →  or  A / D'],
      ['Jump', 'SPACE  (hold for higher)'],
      ['Dash', 'SHIFT  — brief burst, dodges beetles'],
      ['Goal', 'Collect enough dew to open the portal, then reach it'],
      ['Danger', 'Thorn beetles & brambles cost a heart. 3 hearts per run.'],
      ['Combo', 'Grab dew quickly in a row to raise your multiplier'],
      ['Bounce', 'Orange mushrooms launch you sky-high'],
    ];
    let y = py + 84;
    for (const [k, v] of lines) {
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffd166';
      ctx.font = `bold 15px ${FONT}`;
      ctx.fillText(k, px + 36, y);
      ctx.fillStyle = PALETTE.text;
      ctx.font = `15px ${FONT}`;
      ctx.fillText(v, px + 150, y);
      y += 30;
    }
    ctx.textAlign = 'center';
    const btn = this._button(W / 2 - 110, py + ph - 66, 220, 48, 'GOT IT', input, true);
    ctx.textAlign = 'left';
    return { back: btn };
  }

  drawPause(game, input) {
    const { ctx, canvas } = this;
    const W = canvas.width;
    const H = canvas.height;
    ctx.fillStyle = 'rgba(12, 6, 28, 0.55)';
    ctx.fillRect(0, 0, W, H);
    this._titleText('PAUSED', W / 2, H * 0.38, 56, '#fdfdff');
    ctx.font = `16px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.textDim;
    ctx.fillText('Take a breath. The garden waits.', W / 2, H * 0.38 + 34);
    ctx.textAlign = 'left';
    const resume = this._button(W / 2 - 130, H * 0.5, 260, 56, 'RESUME', input, true);
    const restart = this._button(W / 2 - 130, H * 0.5 + 70, 260, 56, 'RESTART LEVEL', input, false);
    const quit = this._button(W / 2 - 130, H * 0.5 + 140, 260, 56, 'QUIT TO TITLE', input, false);
    return { resume, restart, quit };
  }

  drawLevelClear(game, input, breakdown) {
    const { ctx, canvas } = this;
    const W = canvas.width;
    const H = canvas.height;
    ctx.fillStyle = 'rgba(12, 6, 28, 0.5)';
    ctx.fillRect(0, 0, W, H);
    this._titleText('GROVE CLEARED!', W / 2, H * 0.30, 54, '#ffd166');
    ctx.font = `17px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.textDim;
    ctx.fillText(game.level.name + ' — the portal blooms behind you', W / 2, H * 0.30 + 32);
    const pw = 420;
    const ph = 190;
    this._panel(W / 2 - pw / 2, H * 0.42, pw, ph);
    ctx.font = `17px ${FONT}`;
    ctx.fillStyle = PALETTE.text;
    let y = H * 0.42 + 38;
    for (const [label, value] of breakdown) {
      ctx.textAlign = 'left';
      ctx.fillText(label, W / 2 - pw / 2 + 32, y);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffd166';
      ctx.fillText(value, W / 2 + pw / 2 - 32, y);
      ctx.fillStyle = PALETTE.text;
      ctx.textAlign = 'left';
      y += 32;
    }
    ctx.font = `bold 22px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#8cf5b0';
    ctx.fillText(`SCORE  ${game.score}`, W / 2, H * 0.42 + ph + 44);
    ctx.textAlign = 'left';
    const next = this._button(W / 2 - 130, H * 0.42 + ph + 66, 260, 56,
      game.levelIndex < 2 ? 'NEXT GROVE  ▶' : 'FINISH  ▶', input, true);
    return { next };
  }

  drawGameOver(game, input) {
    const { ctx, canvas } = this;
    const W = canvas.width;
    const H = canvas.height;
    ctx.fillStyle = 'rgba(12, 6, 28, 0.62)';
    ctx.fillRect(0, 0, W, H);
    this._titleText('THE GARDEN FADES…', W / 2, H * 0.32, 50, '#ff8fa3');
    ctx.font = `17px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.textDim;
    ctx.fillText(`Pip ran out of hearts in ${game.level.name}.`, W / 2, H * 0.32 + 34);
    ctx.fillText('The dew is still out there. Try again?', W / 2, H * 0.32 + 58);
    ctx.font = `bold 24px ${FONT}`;
    ctx.fillStyle = '#fdfdff';
    ctx.fillText(`SCORE  ${game.score}`, W / 2, H * 0.52);
    ctx.textAlign = 'left';
    const retry = this._button(W / 2 - 130, H * 0.60, 260, 56, '↻  TRY AGAIN', input, true);
    const title = this._button(W / 2 - 130, H * 0.60 + 70, 260, 56, 'TITLE SCREEN', input, false);
    return { retry, title };
  }

  drawVictory(game, input, stats) {
    const { ctx, canvas } = this;
    const W = canvas.width;
    const H = canvas.height;
    ctx.fillStyle = 'rgba(12, 6, 28, 0.5)';
    ctx.fillRect(0, 0, W, H);
    // Golden bloom burst behind the title.
    const cx = W / 2;
    const cy = H * 0.30;
    const glow = ctx.createRadialGradient(cx, cy, 10, cx, cy, 260);
    glow.addColorStop(0, 'rgba(255, 209, 102, 0.4)');
    glow.addColorStop(1, 'rgba(255, 209, 102, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(cx - 270, cy - 270, 540, 540);
    this._titleText('THE GOLDEN BLOOM!', cx, H * 0.30, 56, '#ffd166');
    ctx.font = `17px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.textDim;
    ctx.fillText('Pip bloomed every portal. The garden glows again.', cx, H * 0.30 + 32);
    const pw = 420;
    const ph = 190;
    this._panel(cx - pw / 2, H * 0.42, pw, ph);
    ctx.font = `17px ${FONT}`;
    ctx.fillStyle = PALETTE.text;
    let y = H * 0.42 + 38;
    for (const [label, value] of stats) {
      ctx.textAlign = 'left';
      ctx.fillText(label, cx - pw / 2 + 32, y);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffd166';
      ctx.fillText(value, cx + pw / 2 - 32, y);
      ctx.fillStyle = PALETTE.text;
      ctx.textAlign = 'left';
      y += 32;
    }
    ctx.font = `bold 26px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#8cf5b0';
    ctx.fillText(`FINAL SCORE  ${game.score}`, cx, H * 0.42 + ph + 44);
    ctx.textAlign = 'left';
    const again = this._button(cx - 130, H * 0.42 + ph + 66, 260, 56, '↻  PLAY AGAIN', input, true);
    const title = this._button(cx - 130, H * 0.42 + ph + 136, 260, 56, 'TITLE SCREEN', input, false);
    return { again, title };
  }
}
