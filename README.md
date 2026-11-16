# SIEGEBREAK

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/msmgm/best-game-01-siegebreak-entry/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/msmgm/best-game-01-siegebreak-entry/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![Node 22](https://img.shields.io/badge/runtime-Node%2022-brightgreen)](https://nodejs.org)

SIEGEBREAK is a physics siege game built for the make.fun best-game-01 bounty. You are the last engineer of a fallen kingdom, defending your honor and breaking through ten increasingly formidable enemy castles using a sturdy trebuchet.

## Gameplay & Controls

- **Aim & Fire:** Click and drag backward from the trebuchet to set your launch angle and power, then release to fire.
- **Ammo Selection:** Press keys `1`, `2`, or `3` to choose your ammunition type:
  - `1`: Scrap Rock (standard dense projectile)
  - `2`: Firepot (ignites wooden structures on impact)
  - `3`: Chain-Shot (shears and pierces through supports)
- **Wind:** Wind speed and direction vary with each shot (and gust mid-flight in later castles), requiring careful windage adjustments.
- **Restart & Pause:** Press `R` to restart the current castle attempt, or `P` to pause.

## Win and Lose Rules

- **Victory:** Topple every banner in the castle by destroying or destabilizing its supporting structures to claim victory and advance.
- **Defeat:** If you run out of shots before all banners fall, the castle stands firm and your campaign ends in defeat.

## The Ten Castles

1. First Stones
2. Twin Watch
3. The Gatehouse
4. Ember Hall
5. Stonekeep
6. Three Sisters
7. The Mill
8. Windgate
9. The Citadel
10. The King's Crown

## Running Locally

Serve the game locally using Node:
```bash
node serve.ts
```
Then open `http://localhost:8080` in any modern desktop browser.

Alternatively, package the entry:
```bash
node main.ts
```

## Screenshots & Determinism

- Screenshots are stored in `screenshots/` (3 to 4 PNG/JPEG renders, with the first acting as the cover).
- Scene rendering is fully deterministic, keyed by query parameters (such as `?shot=...` representing start, play, win, or end states with a fixed seed).
- The test harness signals readiness via `window.__shotReady`.

## Architecture Note

The entry program is `main.ts`, which validates inputs, copies assets, and compiles `dossier.json`. The game itself consists entirely of plain static files (`game/index.html` and ES modules under `game/src/`) loaded offline with zero network requests.

