// Spore Sprint — the game itself: the state machine (title / how-to / play /
// pause / level-clear / game-over / victory), scoring and combos, collisions
// with drops, beetles, brambles and bounce mushrooms, the camera, and the
// deterministic ?shot= states used for the entry's screenshots.

import { VIEW_HEIGHT, MAX_HEARTS, COMBO_WINDOW, THEMES } from './config.js';
import { Level } from './level.js';
import { Player } from './player.js';
import { Particles } from './particles.js';
import { SoundBank } from './audio.js';
import { Renderer } from './render.js';
import { mulberry32 } from './random.js';

export class Game {
  constructor(canvas, input, { seed = 1, shot = null } = {}) {
    this.canvas = canvas;
    this.input = input;
    this.sound = new SoundBank();
    this.renderer = new Renderer(canvas);
    this.particles = new Particles();
    this.seed = seed;
    this.shot = shot;
    this.state = 'title';
    this.levelIndex = 0;
    this.level = new Level(0);
    this.player = new Player(this.level.spawn.x, this.level.spawn.y);
    this.score = 0;
    this.hearts = MAX_HEARTS;
    this.combo = 0;
    this.comboTimer = 0;
    this.camX = 0;
    this.camY = 0;
    this.time = 0;
    this.totalTime = 0;
    this.totalDrops = 0;
    this.deaths = 0;
    this.runStart = 0;
    this.breakdown = [];
    this.stats = [];
    this.lastTs = 0;
    this.viewW = 1024;
    this.shotApplied = false;
    this.particles.seedAmbient(mulberry32(seed), 1600, VIEW_HEIGHT);
  }

  comboMult() { return Math.min(1 + Math.floor(this.combo / 3), 4); }

  viewWidthUnits() {
    const scale = this.canvas.height / VIEW_HEIGHT;
    return Math.max(960, Math.min(1400, this.canvas.width / scale));
  }

  startRun() {
    this.score = 0;
    this.hearts = MAX_HEARTS;
    this.totalTime = 0;
    this.totalDrops = 0;
    this.deaths = 0;
    this.loadLevel(0);
    this.state = 'play';
  }

  loadLevel(index) {
    this.levelIndex = index;
    this.level = new Level(index);
    this.player.reset(this.level.spawn.x, this.level.spawn.y);
    this.combo = 0;
    this.comboTimer = 0;
    this.camX = 0;
    this.particles.seedAmbient(mulberry32(this.seed + index * 101), 1600, VIEW_HEIGHT);
  }

  respawn() {
    const cp = this.level.checkpoint.reached ? this.level.checkpoint : this.level.spawn;
    this.player.reset(cp.x, cp.y - 10);
    this.camX = Math.max(0, this.player.x - this.viewW * 0.3);
  }

  // ---- per-frame update ----------------------------------------------------

  frame(ts) {
    const dt = Math.min(0.05, this.lastTs ? (ts - this.lastTs) / 1000 : 0.016);
    this.lastTs = ts;
    this.time += dt;
    // A pause pressed this frame must not also resume in the same frame's menu.
    this._justPaused = false;
    // On-screen touch buttons are only live during play; on menus every tap is
    // a menu click instead.
    this.input.touchControlsEnabled = this.state === 'play';
    const theme = THEMES[this.levelIndex];

    if (this.state === 'play') this.updatePlay(dt);
    else if (this.state === 'title' || this.state === 'howto') this.updateTitle(dt);
    // pause / levelclear / gameover / victory: frozen world, ambient still drifts.

    this.particles.update(dt, this.viewWidthUnits(), VIEW_HEIGHT);
    this.render(theme);
    this.input.endFrame();
  }

  updateTitle(dt) {
    // A gentle idle drift behind the title: the camera pans the first grove.
    this.camX = (Math.sin(this.time * 0.07) * 0.5 + 0.5) * Math.max(0, this.level.width - this.viewW);
  }

  updatePlay(dt) {
    const level = this.level;
    const player = this.player;
    level.update(dt);
    this.totalTime += dt;

    // Combo decay.
    this.comboTimer = Math.max(0, this.comboTimer - dt);
    if (this.comboTimer <= 0) this.combo = 0;

    const { landed, fell } = player.update(dt, this.input, level);
    if (landed) {
      this.sound.land();
      const b = level.bounceAt(player);
      if (b) {
        player.vy = -16.5;
        player.onGround = false;
        player.standing = null;
        player.squash = -0.5;
        b.squash = 1;
        this.sound.bounce();
        this.particles.burst(player.cx, player.feet, { count: 14, colors: ['#ff8a5c', '#ffd166', '#fff3d6'], speed: 3 });
      } else if (player.wasFalling > 0) {
        this.particles.burst(player.cx, player.feet, { count: 8, colors: ['#7ddb8a', '#c9f5d0'], speed: 1.8, size: 3 });
      }
    }

    // Dash trail.
    if (player.dashTime > 0) {
      this.particles.trail(player.cx - player.dashDir * 14, player.cy, '#8cf5b0', 6);
    }

    // Moving platform rider check is inside player.update; a bounce pad under
    // the feet also triggers while standing on it.
    if (player.onGround) {
      const b = level.bounceAt(player);
      if (b) {
        player.vy = -16.5;
        player.onGround = false;
        player.standing = null;
        b.squash = 1;
        this.sound.bounce();
        this.particles.burst(player.cx, player.feet, { count: 14, colors: ['#ff8a5c', '#ffd166', '#fff3d6'], speed: 3 });
      }
    }

    // Dew pickups.
    for (const d of level.drops) {
      if (d.taken) continue;
      const dy = d.y + Math.sin(d.bob) * 5;
      if (Math.abs(player.cx - d.x) < 30 && Math.abs(player.cy - dy) < 34) {
        d.taken = true;
        this.combo += 1;
        this.comboTimer = COMBO_WINDOW;
        const mult = this.comboMult();
        const gained = 100 * mult;
        this.score += gained;
        this.totalDrops += 1;
        this.sound.pickup(this.combo);
        this.particles.burst(d.x, dy, { count: 16, colors: ['#5ff2ff', '#e8feff', '#8cf5b0'], speed: 3.4 });
        this.particles.floatText(d.x, dy - 18, `+${gained}`, mult > 1 ? '#ffd166' : '#e8feff', mult > 1 ? 22 : 18);
        if (level.portal.open && level.dropsGot === level.dropsNeeded) {
          this.sound.portalOpen();
          this.particles.floatText(level.portal.x, level.portal.y - 60, 'PORTAL OPEN!', '#ffd166', 22);
        }
      }
    }

    // Checkpoint flag.
    const cp = level.checkpoint;
    if (!cp.reached && Math.abs(player.cx - cp.x) < 34 && Math.abs(player.cy - cp.y) < 60) {
      cp.reached = true;
      this.sound.checkpoint();
      this.particles.floatText(cp.x, cp.y - 52, 'CHECKPOINT', '#ffd166', 18);
      this.particles.burst(cp.x, cp.y - 20, { count: 12, colors: ['#ffd166', '#fff3d6'], speed: 2.4 });
    }

    // Beetles and brambles hurt.
    for (const b of level.beetles) {
      if (Math.abs(player.cx - (b.x + b.w / 2)) < 32 && Math.abs(player.cy - (b.y + b.h / 2)) < 30) {
        this._hurt(b.x + b.w / 2);
      }
    }
    for (const b of level.brambles) {
      if (player.x + player.w > b.x + 4 && player.x < b.x + b.w - 4
        && player.feet > b.y + 6 && player.y < b.y + b.h) {
        this._hurt(b.x + b.w / 2);
      }
    }

    // Portal: step in once it is open.
    if (level.portal.open) {
      const px = level.portal.x;
      const py = level.portal.y + 8;
      if (Math.abs(player.cx - px) < 34 && Math.abs(player.cy - py) < 46) {
        this._levelClear();
        return;
      }
      if (Math.random() < dt * 8) {
        this.particles.trail(px + (Math.random() - 0.5) * 50, py + (Math.random() - 0.5) * 60, '#ffd166', 3);
      }
    }

    // Fell into a pit.
    if (fell) {
      this._loseHeart('fell');
      if (this.hearts > 0) this.respawn();
      return;
    }

    // Camera follows Pip.
    const targetX = player.cx - this.viewW * 0.38;
    this.camX += (Math.max(0, Math.min(level.width - this.viewW, targetX)) - this.camX) * Math.min(1, dt * 6);

    // Pause / mute / restart keys.
    if (this.input.pausePressed) { this.state = 'pause'; this._justPaused = true; }
    if (this.input.mutePressed) this.sound.toggleMute();
    if (this.input.restartPressed) this.loadLevel(this.levelIndex);
  }

  _hurt(fromX) {
    if (this.player.hurt(fromX)) {
      this._loseHeart('hit');
      this.sound.hurt();
      this.renderer.addShake(9);
      this.particles.burst(this.player.cx, this.player.cy, { count: 14, colors: ['#ff5d73', '#ff8fa3', '#fff'], speed: 3.6 });
      this.combo = 0;
      this.comboTimer = 0;
    }
  }

  _loseHeart(cause) {
    this.hearts -= 1;
    this.deaths += cause === 'fell' ? 0 : 0; // deaths counted once, at game over
    if (this.hearts <= 0) {
      this.deaths += 1;
      this.state = 'gameover';
      this.sound.gameOver();
    }
  }

  _levelClear() {
    const level = this.level;
    const timeBonus = Math.max(0, Math.round((level.parTime - level.time) * 15));
    const heartBonus = this.hearts * 200;
    const clearBonus = 500;
    this.score += timeBonus + heartBonus + clearBonus;
    this.breakdown = [
      ['Dew collected', `${level.dropsGot} × 100`],
      ['Clear bonus', `+${clearBonus}`],
      ['Time bonus', `+${timeBonus}`],
      ['Hearts bonus', `+${heartBonus}`],
    ];
    this.sound.levelClear();
    this.particles.burst(level.portal.x, level.portal.y, { count: 40, colors: ['#ffd166', '#5ff2ff', '#8cf5b0', '#ff9f1c'], speed: 5, life: 1.1 });
    if (this.levelIndex < 2) {
      this.state = 'levelclear';
    } else {
      this.stats = [
        ['Time', this._fmtTotalTime()],
        ['Dew collected', String(this.totalDrops)],
        ['Falls & hits', String(this.deaths)],
        ['Groves cleared', '3 / 3'],
      ];
      this.state = 'victory';
      this.sound.win();
    }
  }

  _fmtTotalTime() {
    const m = Math.floor(this.totalTime / 60);
    const s = Math.floor(this.totalTime % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  // ---- rendering -----------------------------------------------------------

  render(theme) {
    const r = this.renderer;
    const ctx = r.ctx;
    const canvas = this.canvas;
    this.viewW = this.viewWidthUnits();
    const camX = Math.max(0, Math.min(this.level.width - this.viewW, this.camX));

    r.drawBackground(theme, camX, this.viewW, this.time);
    r.beginWorld(camX, this.camY);
    const level = this.level;
    for (const p of level.platforms) r.drawPlatform(theme, p, this.time);
    r.drawCheckpoint(level.checkpoint, this.time);
    r.drawPortal(level.portal, this.time);
    for (const b of level.bounce) r.drawBounce(b);
    for (const b of level.brambles) r.drawBramble(b, this.time);
    for (const d of level.drops) if (!d.taken) r.drawDrop(d, this.time);
    for (const b of level.beetles) r.drawBeetle(b);
    r.drawPlayer(this.player, this.time);
    this.particles.drawWorld(ctx);
    r.endWorld();
    this.particles.drawAmbient(ctx);

    // Foreground vignette for depth.
    const vg = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, canvas.height * 0.45,
      canvas.width / 2, canvas.height / 2, canvas.height * 0.95);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(8,4,20,0.35)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (this.state === 'play' || this.state === 'pause') r.drawHUD(this);
    if (this.state === 'play' && this.input.touchUsed) r.drawTouchControls(this, this.input);

    // Menus sit above the world. Buttons return their rects; clicks act here.
    if (this.state === 'title') {
      const btns = r.drawTitle(this, this.input, this.time);
      if (this.input.clickedIn(btns.start.x, btns.start.y, btns.start.w, btns.start.h)
        || this.input.pressed.has('Enter')) {
        this.sound.unlock();
        this.sound.click();
        this.startRun();
      } else if (this.input.clickedIn(btns.how.x, btns.how.y, btns.how.w, btns.how.h)) {
        this.sound.unlock();
        this.sound.click();
        this.state = 'howto';
      }
    } else if (this.state === 'howto') {
      const btns = r.drawHowTo(this, this.input);
      if (this.input.clickedIn(btns.back.x, btns.back.y, btns.back.w, btns.back.h)
        || this.input.pressed.has('Escape') || this.input.pressed.has('Enter')) {
        this.sound.click();
        this.state = 'title';
      }
    } else if (this.state === 'pause') {
      const btns = r.drawPause(this, this.input);
      if (this.input.clickedIn(btns.resume.x, btns.resume.y, btns.resume.w, btns.resume.h)
        || (this.input.pausePressed && !this._justPaused)) {
        this.sound.click();
        this.state = 'play';
      } else if (this.input.clickedIn(btns.restart.x, btns.restart.y, btns.restart.w, btns.restart.h)) {
        this.sound.click();
        this.loadLevel(this.levelIndex);
        this.state = 'play';
      } else if (this.input.clickedIn(btns.quit.x, btns.quit.y, btns.quit.w, btns.quit.h)) {
        this.sound.click();
        this.state = 'title';
        this.loadLevel(0);
      }
    } else if (this.state === 'levelclear') {
      const btns = r.drawLevelClear(this, this.input, this.breakdown);
      if (this.input.clickedIn(btns.next.x, btns.next.y, btns.next.w, btns.next.h)
        || this.input.pressed.has('Enter')) {
        this.sound.click();
        if (this.levelIndex < 2) {
          this.loadLevel(this.levelIndex + 1);
          this.state = 'play';
        } else {
          this.state = 'victory';
        }
      }
    } else if (this.state === 'gameover') {
      const btns = r.drawGameOver(this, this.input);
      if (this.input.clickedIn(btns.retry.x, btns.retry.y, btns.retry.w, btns.retry.h)
        || this.input.pressed.has('Enter') || this.input.pressed.has('KeyR')) {
        this.sound.click();
        this.hearts = MAX_HEARTS;
        this.loadLevel(this.levelIndex);
        this.state = 'play';
      } else if (this.input.clickedIn(btns.title.x, btns.title.y, btns.title.w, btns.title.h)) {
        this.sound.click();
        this.state = 'title';
        this.loadLevel(0);
      }
    } else if (this.state === 'victory') {
      const btns = r.drawVictory(this, this.input, this.stats);
      if (this.input.clickedIn(btns.again.x, btns.again.y, btns.again.w, btns.again.h)
        || this.input.pressed.has('Enter')) {
        this.sound.click();
        this.startRun();
      } else if (this.input.clickedIn(btns.title.x, btns.title.y, btns.title.w, btns.title.h)) {
        this.sound.click();
        this.state = 'title';
        this.loadLevel(0);
      }
    }

    // First click anywhere unlocks audio (browsers require a gesture).
    if (this.input.clicked) this.sound.unlock();
  }

  // ---- deterministic screenshot states (?shot=start|play|win|end) ----------

  applyShot() {
    if (this.shotApplied || !this.shot) return;
    this.shotApplied = true;
    if (this.shot === 'start') {
      this.state = 'title';
      this.loadLevel(0);
      this.time = 6; // let the title mascot settle mid-bounce
    } else if (this.shot === 'play') {
      this.state = 'play';
      this.loadLevel(0);
      // Mid-action, level 1: Pip mid-jump above the second mushroom, 4 dew
      // already collected, a combo running, a beetle patrolling below.
      this.player.x = 1050;
      this.player.y = 300;
      this.player.vy = -4;
      this.player.vx = 3.2;
      this.player.facing = 1;
      this.player.squash = -0.3;
      this.score = 1250;
      this.combo = 5;
      this.comboTimer = 2.0;
      this.level.time = 24.5;
      this.level.drops[0].taken = true;
      this.level.drops[1].taken = true;
      this.level.drops[2].taken = true;
      this.level.drops[3].taken = true;
      this.camX = 620;
      this.particles.burst(1080, 330, { count: 10, colors: ['#5ff2ff', '#e8feff'], speed: 2.2 });
      this.particles.floatText(1160, 300, '+200', '#ffd166', 20);
    } else if (this.shot === 'win') {
      this.state = 'victory';
      this.loadLevel(2);
      this.score = 4820;
      this.totalTime = 187;
      this.totalDrops = 33;
      this.deaths = 2;
      this.stats = [
        ['Time', '3:07'],
        ['Dew collected', '33'],
        ['Falls & hits', '2'],
        ['Groves cleared', '3 / 3'],
      ];
    } else if (this.shot === 'end') {
      this.state = 'gameover';
      this.loadLevel(1);
      this.score = 1340;
      this.hearts = 0;
    }
  }

  start() {
    this.applyShot();
    const loop = (ts) => {
      this.frame(ts);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}
