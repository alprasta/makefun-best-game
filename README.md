# Spore Sprint

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/alprasta/makefun-best-game/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/alprasta/makefun-best-game/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

A mushroom-garden dash for the make.fun bounty best-game-01 — guide Pip the spore through four glowing groves, gather dew to open the Bloom Portal, dodge thorn beetles and brambles, and bloom your way home.

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
- **Touch** — on-screen ◀ ▶ buttons to move, JUMP and DASH buttons, ❚❚ to pause (buttons appear after the first tap). Portrait and landscape both play: on tall screens the view zooms out so the whole garden stays visible.
- **Difficulty** — pick EASY, NORMAL or HARD on the title screen (it sticks between visits): EASY gives 4 hearts and slower beetles, HARD gives 2 hearts and faster beetles but pays 1.5x score.
- **History** — runs, wins, best dew and furthest grove are saved on this device (localStorage) and shown on the title screen once you have finished a run.

## The game

- **4 groves**, each a hand-built level: Dewcap Grove, Thorn Hollow, The Golden Bloom, Moonpetal Deep
- **Goal per grove**: collect enough dew drops to open the Bloom Portal, then reach it
- **Hazards**: patrolling thorn beetles, bramble spikes, bottomless pits — hearts per run depend on difficulty (EASY 4, NORMAL 3, HARD 2)
- **Depth**: dew combos raise a score multiplier (up to x4), bounce mushrooms launch you sky-high, moving platforms, checkpoints, dash with a cooldown, time and heart bonuses on every clear
- **Feedback**: HUD (hearts, dew progress, score, timer, combo meter, dash readiness, a level progress bar with checkpoint and portal markers), particles, screen shake, squash-and-stretch animation, synthesized sound effects

## Enter it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library.

---

<sub>Entered on [make.fun](https://make.fun/?ref=58yp00jq&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
