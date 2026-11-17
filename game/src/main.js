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
  // The canvas fills exactly the VISIBLE window: on mobile browsers the CSS
  // 100vh (large viewport) can exceed window.innerHeight while the URL bar
  // is visible, which would push the bottom touch controls (◀ ▶ JUMP) below
  // the fold. Sizing the element itself from innerWidth/innerHeight keeps
  // the backing store and the displayed size identical, so the drawing is
  // never stretched and no button is ever off-screen.
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resize();
window.addEventListener('resize', resize);
if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);

const input = new Input(canvas);
const game = new Game(canvas, input, { seed, shot });

// The renderer draws in canvas pixels: with the canvas at CSS-pixel size,
// view height is VIEW_HEIGHT world units and the world scale is height / 640.
game.start();

// A tiny hook for automated play-testing: window.__spore exposes the live game.
window.__spore = game;
