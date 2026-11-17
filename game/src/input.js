// Spore Sprint — keyboard and mouse input. Keys are tracked as a live set so the
// game can read "held" state every frame; pressedThisFrame catches single taps
// (jump, dash) without repeats. Mouse position is kept in canvas pixels for
// clickable buttons, and clicks are consumed one frame at a time.

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
      this.clicked = true;
    });
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const r = canvas.getBoundingClientRect();
      const t = e.changedTouches[0];
      this.mouseX = t.clientX - r.left;
      this.mouseY = t.clientY - r.top;
      this.clicked = true;
    }, { passive: false });
  }

  get left() { return this.down.has('ArrowLeft') || this.down.has('KeyA'); }
  get right() { return this.down.has('ArrowRight') || this.down.has('KeyD'); }
  get jumpPressed() {
    return this.pressed.has('Space') || this.pressed.has('ArrowUp') || this.pressed.has('KeyW');
  }
  get jumpHeld() {
    return this.down.has('Space') || this.down.has('ArrowUp') || this.down.has('KeyW');
  }
  get dashPressed() {
    return this.pressed.has('ShiftLeft') || this.pressed.has('ShiftRight')
      || this.pressed.has('KeyX') || this.pressed.has('KeyJ');
  }
  get confirmPressed() {
    return this.pressed.has('Enter') || this.pressed.has('Space') || this.anyKey;
  }
  get pausePressed() { return this.pressed.has('KeyP') || this.pressed.has('Escape'); }
  get mutePressed() { return this.pressed.has('KeyM'); }
  get restartPressed() { return this.pressed.has('KeyR'); }

  // Call at the end of every frame: single-press state lives one frame only.
  endFrame() {
    this.pressed.clear();
    this.clicked = false;
    this.anyKey = false;
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
