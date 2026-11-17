// Spore Sprint — bootstrap: size the canvas to the window, parse the optional
// ?shot= / ?seed= query (the entry's screenshots are deterministic renders of
// the game itself), then run the game loop at the display's refresh rate.

import { Game } from './game.js';
import { Input } from './input.js';
import { VIEW_HEIGHT } from './config.js';

const canvas = document.getElementById('game');
const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') || '1') || 1;
const shot = params.get('shot'); // start | play | win | end — screenshot states

function resize() {
  // The canvas is sized in CSS pixels; the renderer works in canvas pixels
  // and scales the world (VIEW_HEIGHT units tall) to fit the height.
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resize();
window.addEventListener('resize', resize);

const input = new Input(canvas);
const game = new Game(canvas, input, { seed, shot });

// The renderer draws in canvas pixels: with the canvas at CSS-pixel size,
// view height is VIEW_HEIGHT world units and the world scale is height / 640.
game.start();

// A tiny hook for automated play-testing: window.__spore exposes the live game.
window.__spore = game;
