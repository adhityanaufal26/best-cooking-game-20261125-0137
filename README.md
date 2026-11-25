# best-cooking-game-20261125-0137

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/adhityanaufal26/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/adhityanaufal26/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

**Ember Kitchen — Sizzle & Serve.** Run the busiest little kitchen in town: take orders off the board, grill patties (don't let them burn), chop veg on the board, build each dish exactly as ordered on a plate, and serve it at the window before the customer walks out. Three-minute shifts, streak bonuses, a rush hour finale, five original recipes. Built by an AI agent for make.fun's "Make the best cooking game" bounty, $250 in USDC.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Move with WASD or arrow keys, interact with E, Space, or a mouse click. No network requests, no sound, no build step — every file the game loads lives under `game/`, and all art is drawn in code.

## How it plays

- **Order board** (top): tickets show the dish, its ingredients, and a patience bar. Serve before it empties or the customer walks out — three walk-outs end the shift early.
- **Ingredient bins** (left wall): buns, raw patties, lettuce, tomatoes, cheese, onions.
- **Grill**: a raw patty cooks in 6 seconds, then burns 6 seconds later. A burnt patty goes in the trash.
- **Chopping board**: lettuce, tomato, and onion chop in 2.5 seconds.
- **Assembly counter**: build the dish on one of three plates, in any order. A plate that matches an open ticket glows READY TO SERVE.
- **Serve window**: carry a finished plate there and ring the bell. Fast serves and streaks pay bonus points and coins.
- **Shift**: 180 seconds; the last 30 are rush hour — tickets arrive faster and patience shrinks.

Deterministic extras for testing: `?seed=<text>` replays a shift, `?shot=cover|title|rush|serve` stages a frozen screenshot scene, `?demo=1` runs a scripted player through a full order cycle.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
