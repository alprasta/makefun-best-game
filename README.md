# Spore Sprint

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/alprasta/makefun-best-game/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/alprasta/makefun-best-game/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

A mushroom-garden dash for the make.fun bounty best-game-01 — guide Pip the spore through three glowing groves, gather dew to open the Bloom Portal, dodge thorn beetles and brambles, and bloom your way home.

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network: `game/` is plain static files (canvas, ES modules, synthesized WebAudio sounds).

## Controls

- **← → / A D** — move
- **SPACE** — jump (hold for higher)
- **SHIFT** — dash (brief burst, dodges beetles)
- **P** — pause · **M** — mute · **R** — restart level

## The game

- **3 groves**, each a hand-built level: Dewcap Grove, Thorn Hollow, The Golden Bloom
- **Goal per grove**: collect enough dew drops to open the Bloom Portal, then reach it
- **Hazards**: patrolling thorn beetles, bramble spikes, bottomless pits — 3 hearts per run
- **Depth**: dew combos raise a score multiplier (up to x4), bounce mushrooms launch you sky-high, moving platforms, checkpoints, dash with a cooldown, time and heart bonuses on every clear
- **Feedback**: HUD (hearts, dew progress, score, timer, combo meter, dash readiness), particles, screen shake, squash-and-stretch animation, synthesized sound effects

## Enter it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library.

---

<sub>Entered on [make.fun](https://make.fun/?ref=58yp00jq&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
