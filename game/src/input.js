// Spore Sprint — keyboard, mouse and touch input. Keys are tracked as a live
// set so the game can read "held" state every frame; pressedThisFrame catches
// single taps (jump, dash) without repeats. Mouse position is kept in canvas
// pixels for clickable buttons, and clicks are consumed one frame at a time.
//
// Touch notes (fixed 2026-11-17): a tap used to be ignored because clickedIn
// required mouseInside, which only mousemove ever set — on a touchscreen there
// is no hover, so START / HOW TO PLAY never responded. Touch handlers now set
// mouseInside, and during play on-screen buttons (◀ ▶ JUMP DASH ❚❚) drive the
// same getters the keyboard does, tracked per touch identifier so two fingers
// (hold ▶ + tap JUMP) work at once.

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.down = new Set(); // codes currently held
    this.pressed = new Set(); // codes pressed since last frame (cleared each frame)
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseInside = false;
    this.clicked = false; // a click happened since last frame
    this.anyKey = false; // any key pressed since last frame (for "press any key")

    // Touch state.
    this.touchUsed = false; // a touch has happened at least once
    this.touchControlsEnabled = false; // set by the game: true only during play
    this._touches = new Map(); // touch identifier -> zone name or null (menu tap)
    this._vJump = false; // edge: jump button tapped since last frame
    this._vDash = false; // edge: dash button tapped since last frame
    this._vPause = false; // edge: pause button tapped since last frame

    window.addEventListener('keydown', (e) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      if (!e.repeat) {
        this.down.add(e.code);
        this.pressed.add(e.code);
        this.anyKey = true;
      }
    });
    window.addEventListener('keyup', (e) => this.down.delete(e.code));
    window.addEventListener('blur', () => this.down.clear());

    canvas.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouseX = e.clientX - r.left;
      this.mouseY = e.clientY - r.top;
      this.mouseInside = true;
    });
    canvas.addEventListener('mouseleave', () => { this.mouseInside = false; });
    canvas.addEventListener('mousedown', (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouseX = e.clientX - r.left;
      this.mouseY = e.clientY - r.top;
      this.mouseInside = true;
      this.clicked = true;
    });
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.touchUsed = true;
      const r = canvas.getBoundingClientRect();
      for (const t of e.changedTouches) {
        const x = t.clientX - r.left;
        const y = t.clientY - r.top;
        const zone = this.touchControlsEnabled ? this._zoneAt(x, y) : null;
        this._touches.set(t.identifier, zone);
        if (zone === 'jump') this._vJump = true;
        else if (zone === 'dash') this._vDash = true;
        else if (zone === 'pause') this._vPause = true;
        else if (zone === null) {
          // Menu tap (or a tap outside the controls): behave like a mouse click.
          this.mouseX = x;
          this.mouseY = y;
          this.mouseInside = true;
          this.clicked = true;
        }
      }
    }, { passive: false });
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const r = canvas.getBoundingClientRect();
      for (const t of e.changedTouches) {
        if (!this._touches.has(t.identifier)) continue;
        const x = t.clientX - r.left;
        const y = t.clientY - r.top;
        const prev = this._touches.get(t.identifier);
        if (prev === null) {
          // Dragging a menu tap: keep the hover position fresh.
          this.mouseX = x;
          this.mouseY = y;
          continue;
        }
        // Sliding a finger on/off a control button reassigns it.
        const zone = this.touchControlsEnabled ? this._zoneAt(x, y) : null;
        this._touches.set(t.identifier, zone);
      }
    }, { passive: false });
    const endTouch = (e) => {
      for (const t of e.changedTouches) this._touches.delete(t.identifier);
    };
    canvas.addEventListener('touchend', endTouch);
    canvas.addEventListener('touchcancel', endTouch);
  }

  // On-screen touch buttons, in canvas pixels. Layout is shared by hit-testing
  // here and drawing in the renderer, so the two can never drift apart.
  touchZones() {
    const W = this.canvas.width;
    const H = this.canvas.height;
    const narrow = W < 560;
    const s = narrow ? 60 : 72; // move button size
    const gap = narrow ? 10 : 12;
    const y = H - s - 16;
    const left = { x: 16, y, w: s, h: s };
    const right = { x: 16 + s + gap, y, w: s, h: s };
    const jumpW = narrow ? 76 : 88;
    const jump = { x: W - 16 - jumpW, y, w: jumpW, h: s };
    const dashW = narrow ? 60 : 72;
    const dash = { x: W - 16 - jumpW - gap - dashW, y, w: dashW, h: s };
    // Pause sits in the free gap between the two clusters, when it fits.
    const midL = right.x + right.w + gap;
    const midR = dash.x - gap;
    const pw = 52;
    const ph = 36;
    const pause = (midR - midL >= pw + 8)
      ? { x: (midL + midR) / 2 - pw / 2, y: H - ph - 20, w: pw, h: ph }
      : null;
    return { left, right, jump, dash, pause };
  }

  _zoneAt(x, y) {
    const z = this.touchZones();
    for (const name of ['left', 'right', 'jump', 'dash', 'pause']) {
      const r = z[name];
      if (r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return name;
    }
    return null;
  }

  // Is any active touch currently holding this control button?
  touchHeld(zone) {
    for (const z of this._touches.values()) if (z === zone) return true;
    return false;
  }

  get left() {
    return this.down.has('ArrowLeft') || this.down.has('KeyA') || this.touchHeld('left');
  }
  get right() {
    return this.down.has('ArrowRight') || this.down.has('KeyD') || this.touchHeld('right');
  }
  get jumpPressed() {
    return this.pressed.has('Space') || this.pressed.has('ArrowUp') || this.pressed.has('KeyW')
      || this._vJump;
  }
  get jumpHeld() {
    return this.down.has('Space') || this.down.has('ArrowUp') || this.down.has('KeyW')
      || this.touchHeld('jump');
  }
  get dashPressed() {
    return this.pressed.has('ShiftLeft') || this.pressed.has('ShiftRight')
      || this.pressed.has('KeyX') || this.pressed.has('KeyJ') || this._vDash;
  }
  get confirmPressed() {
    return this.pressed.has('Enter') || this.pressed.has('Space') || this.anyKey;
  }
  get pausePressed() {
    return this.pressed.has('KeyP') || this.pressed.has('Escape') || this._vPause;
  }
  get mutePressed() { return this.pressed.has('KeyM'); }
  get restartPressed() { return this.pressed.has('KeyR'); }

  // Call at the end of every frame: single-press state lives one frame only.
  endFrame() {
    this.pressed.clear();
    this.clicked = false;
    this.anyKey = false;
    this._vJump = false;
    this._vDash = false;
    this._vPause = false;
  }

  // A clickable rectangle in canvas pixels. Returns true on a click inside it.
  clickedIn(x, y, w, h) {
    return this.clicked && this.mouseInside
      && this.mouseX >= x && this.mouseX <= x + w
      && this.mouseY >= y && this.mouseY <= y + h;
  }

  hoverIn(x, y, w, h) {
    return this.mouseInside
      && this.mouseX >= x && this.mouseX <= x + w
      && this.mouseY >= y && this.mouseY <= y + h;
  }
}
