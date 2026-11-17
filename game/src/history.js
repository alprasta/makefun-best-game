// Spore Sprint — play history, saved on this device and shown on the title
// screen. A "run" is one session: it ends in victory, in game over, or when
// the player quits to the title from the pause menu. Everything is guarded:
// if storage is unavailable (private mode, file:// quirks) the game simply
// runs without a history instead of breaking.

const KEY = 'spore-sprint-history-v1';

function emptyHistory() {
  return { runs: 0, wins: 0, bestDew: 0, bestGrove: 0, totalDew: 0, lastResult: '' };
}

export function loadHistory() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyHistory();
    const h = JSON.parse(raw);
    return {
      runs: h.runs | 0,
      wins: h.wins | 0,
      bestDew: h.bestDew | 0,
      bestGrove: h.bestGrove | 0,
      totalDew: h.totalDew | 0,
      lastResult: typeof h.lastResult === 'string' ? h.lastResult : '',
    };
  } catch {
    return emptyHistory();
  }
}

// result: 'victory' | 'gameover' | 'quit'. grove is 1..3, dew is the run's
// total dew collected. Returns the updated history (and saves it).
export function recordRun(history, { result, grove, dew }) {
  const h = { ...history };
  h.runs += 1;
  if (result === 'victory') h.wins += 1;
  h.bestDew = Math.max(h.bestDew, dew | 0);
  h.bestGrove = Math.max(h.bestGrove, grove | 0);
  h.totalDew += dew | 0;
  h.lastResult = result === 'victory'
    ? 'Victory!'
    : result === 'gameover'
      ? `Game over in Grove ${grove}`
      : `Left in Grove ${grove}`;
  try {
    localStorage.setItem(KEY, JSON.stringify(h));
  } catch {
    /* storage unavailable — the run still counts in memory */
  }
  return h;
}
