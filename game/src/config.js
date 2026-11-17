// Spore Sprint — configuration: constants, palette and the three hand-built groves.
// One level is a set of platforms, dew drops, thorn beetles, brambles, bounce
// mushrooms, moving platforms and the Bloom Portal the player must open.

export const VIEW_HEIGHT = 640; // world units visible vertically; width follows the window
export const MIN_VIEW_WIDTH = 640; // world units visible across, at least —
// Portrait (tall) screens zoom out to this width instead of cropping the
// world to a thin slice: landscape is unchanged (its width already exceeds
// this), portrait shows ~640 units across so hazards ahead stay visible.
export function worldScale(canvas) {
  return Math.min(canvas.height / VIEW_HEIGHT, canvas.width / MIN_VIEW_WIDTH);
}
export const GRAVITY = 0.6;
export const MOVE_SPEED = 4.3;
export const JUMP_VELOCITY = -13.2;
export const DASH_SPEED = 10.5;
export const DASH_TIME = 0.16; // seconds of dash
export const DASH_COOLDOWN = 1.1; // seconds between dashes
export const COYOTE_TIME = 0.12; // seconds you may still jump after leaving a ledge
export const JUMP_BUFFER = 0.12; // seconds a jump press is remembered before landing
export const PLAYER_W = 30;
export const PLAYER_H = 38;
export const MAX_HEARTS = 3;
export const COMBO_WINDOW = 2.5; // seconds between drops to keep the combo alive

export const PALETTE = {
  pipBody: '#8cf5b0', // Pip the spore
  pipDark: '#3da873',
  pipBlush: '#ff9ec6',
  dew: '#5ff2ff',
  dewCore: '#e8feff',
  portalLocked: '#6b6f8e',
  portalOpen: '#ffd166',
  heart: '#ff5d73',
  beetle: '#3a2b4d',
  beetleSpike: '#ff4d6d',
  bramble: '#b04dff',
  bounceCap: '#ff8a5c',
  text: '#fdfdff',
  textDim: '#cfc8f5',
};

export const THEMES = [
  {
    name: 'Dewcap Grove',
    sub: 'Grove 1 of 3 — learn to hop',
    skyTop: '#2b1b52',
    skyMid: '#4b2a6e',
    skyBottom: '#1d5c63',
    far: '#3a2560',
    mid: '#2c1c50',
    groundTop: '#7ddb8a',
    ground: '#3f7d44',
    groundDark: '#2a5230',
    cap: '#ff5d8f',
    capSpot: '#ffe3ee',
    stem: '#f7e8c9',
    accent: '#5ff2ff',
  },
  {
    name: 'Thorn Hollow',
    sub: 'Grove 2 of 3 — the beetles get bold',
    skyTop: '#1c1038',
    skyMid: '#3d1e5e',
    skyBottom: '#0f4d3a',
    far: '#2c1748',
    mid: '#221240',
    groundTop: '#9be26a',
    ground: '#4a7d3a',
    groundDark: '#2f5226',
    cap: '#ff9f1c',
    capSpot: '#fff3d6',
    stem: '#f2d8a7',
    accent: '#c9f24b',
  },
  {
    name: 'The Golden Bloom',
    sub: 'Grove 3 of 3 — bloom the portal home',
    skyTop: '#241040',
    skyMid: '#5e2350',
    skyBottom: '#8a5a1e',
    far: '#3a1c52',
    mid: '#2a143e',
    groundTop: '#ffd166',
    ground: '#7d5a2a',
    groundDark: '#4d3717',
    cap: '#7c5cff',
    capSpot: '#e6deff',
    stem: '#f7e8c9',
    accent: '#ffd166',
  },
];

// A platform: { x, y, w, h, mover?: { axis: 'x'|'y', from, to, speed } }
// Platforms are mushroom caps: the cap is the top ~14 units, the stem hangs below.
// Drops, beetles, brambles and bounce pads sit on top of platforms or the ground.
export const LEVELS = [
  {
    name: 'Dewcap Grove',
    sub: 'Grove 1 of 3 — learn to hop',
    width: 2600,
    parTime: 60,
    dropsNeeded: 6,
    spawn: { x: 90, y: 500 },
    checkpoint: { x: 1330, y: 436 },
    portal: { x: 2460, y: 540 },
    platforms: [
      { x: 0, y: 580, w: 700, h: 80 },
      { x: 760, y: 580, w: 740, h: 80 },
      { x: 1560, y: 580, w: 1040, h: 80 },
      { x: 300, y: 470, w: 150, h: 20 },
      { x: 560, y: 380, w: 130, h: 20 },
      { x: 900, y: 460, w: 150, h: 20 },
      { x: 1120, y: 360, w: 130, h: 20 },
      { x: 1330, y: 470, w: 150, h: 20 },
      { x: 1650, y: 450, w: 150, h: 20 },
      { x: 1900, y: 350, w: 130, h: 20 },
      { x: 2150, y: 460, w: 150, h: 20 },
    ],
    drops: [
      { x: 340, y: 425 }, { x: 600, y: 335 }, { x: 950, y: 415 },
      { x: 1160, y: 315 }, { x: 1380, y: 425 }, { x: 1700, y: 405 },
      { x: 1940, y: 305 }, { x: 2200, y: 415 },
    ],
    beetles: [
      { x: 880, y: 552, minX: 800, maxX: 1080, speed: 1.1 },
      { x: 1800, y: 552, minX: 1620, maxX: 2050, speed: 1.3 },
    ],
    brambles: [{ x: 1250, y: 554, w: 64 }],
    bounce: [{ x: 1450, y: 554 }, { x: 2060, y: 554 }],
  },
  {
    name: 'Thorn Hollow',
    sub: 'Grove 2 of 3 — the beetles get bold',
    width: 3200,
    parTime: 75,
    dropsNeeded: 9,
    spawn: { x: 90, y: 500 },
    checkpoint: { x: 1690, y: 446 },
    portal: { x: 3060, y: 540 },
    platforms: [
      { x: 0, y: 580, w: 600, h: 80 },
      { x: 680, y: 580, w: 620, h: 80 },
      { x: 1380, y: 580, w: 720, h: 80 },
      { x: 2180, y: 580, w: 1020, h: 80 },
      { x: 250, y: 470, w: 130, h: 20 },
      { x: 500, y: 370, w: 120, h: 20 },
      { x: 980, y: 470, w: 140, h: 20 },
      { x: 1450, y: 400, w: 130, h: 20 },
      { x: 1620, y: 480, w: 120, h: 20 },
      { x: 2250, y: 460, w: 150, h: 20 },
      { x: 2500, y: 360, w: 130, h: 20 },
      { x: 2750, y: 470, w: 140, h: 20 },
      { x: 900, y: 430, w: 130, h: 20, mover: { axis: 'x', from: 820, to: 1160, speed: 1.0 } },
      { x: 1800, y: 380, w: 130, h: 20, mover: { axis: 'y', from: 330, to: 470, speed: 0.9 } },
    ],
    drops: [
      { x: 290, y: 425 }, { x: 540, y: 325 }, { x: 720, y: 530 },
      { x: 1030, y: 425 }, { x: 1190, y: 530 }, { x: 1490, y: 355 },
      { x: 1660, y: 435 }, { x: 1900, y: 530 }, { x: 2300, y: 415 },
      { x: 2540, y: 315 }, { x: 2800, y: 425 }, { x: 2960, y: 530 },
    ],
    beetles: [
      { x: 760, y: 552, minX: 700, maxX: 1000, speed: 1.5 },
      { x: 1100, y: 552, minX: 980, maxX: 1280, speed: 1.6 },
      { x: 1500, y: 552, minX: 1400, maxX: 1760, speed: 1.7 },
      { x: 2400, y: 552, minX: 2220, maxX: 2620, speed: 1.8 },
    ],
    brambles: [
      { x: 600, y: 554, w: 56 },
      { x: 1700, y: 554, w: 64 },
      { x: 2700, y: 554, w: 56 },
    ],
    bounce: [{ x: 1300, y: 554 }, { x: 2100, y: 554 }],
  },
  {
    name: 'The Golden Bloom',
    sub: 'Grove 3 of 3 — bloom the portal home',
    width: 3600,
    parTime: 90,
    dropsNeeded: 11,
    spawn: { x: 90, y: 500 },
    checkpoint: { x: 1940, y: 346 },
    portal: { x: 3460, y: 540 },
    platforms: [
      { x: 0, y: 580, w: 500, h: 80 },
      { x: 580, y: 580, w: 620, h: 80 },
      { x: 1280, y: 580, w: 720, h: 80 },
      { x: 2080, y: 580, w: 720, h: 80 },
      { x: 2880, y: 580, w: 720, h: 80 },
      { x: 220, y: 460, w: 120, h: 20 },
      { x: 430, y: 360, w: 120, h: 20 },
      { x: 700, y: 460, w: 130, h: 20 },
      { x: 950, y: 350, w: 120, h: 20 },
      { x: 1150, y: 470, w: 130, h: 20 },
      { x: 1400, y: 360, w: 120, h: 20 },
      { x: 1650, y: 470, w: 130, h: 20 },
      { x: 1900, y: 380, w: 120, h: 20 },
      { x: 2200, y: 460, w: 130, h: 20 },
      { x: 2450, y: 350, w: 120, h: 20 },
      { x: 2700, y: 470, w: 130, h: 20 },
      { x: 3000, y: 360, w: 120, h: 20 },
      { x: 3250, y: 470, w: 130, h: 20 },
      { x: 820, y: 430, w: 120, h: 20, mover: { axis: 'x', from: 700, to: 1060, speed: 1.3 } },
      { x: 1550, y: 400, w: 120, h: 20, mover: { axis: 'y', from: 320, to: 480, speed: 1.1 } },
      { x: 2600, y: 420, w: 120, h: 20, mover: { axis: 'x', from: 2480, to: 2840, speed: 1.4 } },
    ],
    drops: [
      { x: 260, y: 415 }, { x: 470, y: 315 }, { x: 620, y: 530 },
      { x: 750, y: 415 }, { x: 990, y: 305 }, { x: 1190, y: 425 },
      { x: 1440, y: 315 }, { x: 1690, y: 425 }, { x: 1940, y: 335 },
      { x: 2240, y: 415 }, { x: 2490, y: 305 }, { x: 2740, y: 425 },
      { x: 3040, y: 315 }, { x: 3290, y: 425 },
    ],
    beetles: [
      { x: 640, y: 552, minX: 600, maxX: 880, speed: 1.9 },
      { x: 1000, y: 552, minX: 900, maxX: 1180, speed: 2.0 },
      { x: 1500, y: 552, minX: 1300, maxX: 1700, speed: 2.1 },
      { x: 2300, y: 552, minX: 2120, maxX: 2500, speed: 2.0 },
      { x: 3050, y: 552, minX: 2920, maxX: 3300, speed: 2.2 },
    ],
    brambles: [
      { x: 480, y: 554, w: 56 },
      { x: 1250, y: 554, w: 64 },
      { x: 2050, y: 554, w: 56 },
      { x: 2860, y: 554, w: 64 },
    ],
    bounce: [{ x: 1080, y: 554 }, { x: 1980, y: 554 }, { x: 3160, y: 554 }],
  },
];
