// autopilot.js — a small scripted player that plays Ember Kitchen through
// the same movement and interact functions a human uses. It exists so the
// game can be verified end to end (?demo=1): with a fixed seed it should
// serve at least one dish per shift. It is not part of the judged game.

import {
  BINS, GRILL, BOARD, COUNTER, WINDOW, TRASH, stationAnchor,
} from './kitchen.js';
import { INGREDIENTS, plateFitsRecipe, plateMatchesRecipe, missingItems } from './recipes.js';
import { GRILL_TIME, CHOP_TIME } from './kitchen.js';
import { interact, INTERACT_RANGE } from './chef.js';

export function createBot() {
  return { steps: [], waitUntil: 0, stuckTimer: 0, lastX: 0, lastY: 0, detour: null };
}

function binStation(item) {
  const def = BINS.find((b) => b.item === item);
  return def ? { type: 'bin', def, anchor: stationAnchor({ type: 'bin', def }) } : null;
}
function grillStation(slot) {
  return { type: 'grill', slot, anchor: stationAnchor({ type: 'grill', slot }) };
}
function boardStation(slot) {
  return { type: 'board', slot, anchor: stationAnchor({ type: 'board', slot }) };
}
function plateStation(slot) {
  return { type: 'plate', slot, anchor: stationAnchor({ type: 'plate', slot }) };
}
const windowStation = { type: 'window', anchor: stationAnchor({ type: 'window' }) };
const trashStation = { type: 'trash', anchor: stationAnchor({ type: 'trash' }) };

// Plan the next step(s) from the current state. Returns nothing; fills bot.steps.
function plan(game, bot) {
  const { chef, stations, orders } = game;
  const tickets = orders.tickets;
  if (tickets.length === 0) { bot.steps = [{ wait: 1 }]; return; }
  // Urgent ticket first.
  const target = [...tickets].sort((a, b) => a.patience - b.patience)[0];

  // --- carrying a plate: serve it, set it down to finish it, or trash it.
  if (chef.carrying?.kind === 'plate') {
    const items = chef.carrying.items;
    if (tickets.some((t) => plateMatchesRecipe(items, t.recipe))) {
      bot.steps = [{ station: windowStation, action: 'interact' }];
      return;
    }
    const fits = tickets.find((t) => plateFitsRecipe(items, t.recipe));
    if (fits) {
      const empty = stations.plates.findIndex((p) => p.items.length === 0);
      if (empty !== -1) { bot.steps = [{ station: plateStation(empty), action: 'interact' }]; return; }
    }
    bot.steps = [{ station: trashStation, action: 'interact' }];
    return;
  }

  // --- carrying an ingredient: add it to the best fitting plate, or trash it.
  if (chef.carrying?.kind === 'ingredient') {
    const item = chef.carrying.item;
    let best = -1;
    let bestCount = -1;
    stations.plates.forEach((p, i) => {
      if (p.items.length === 0) return;
      const candidate = [...p.items, item];
      if (tickets.some((t) => plateFitsRecipe(candidate, t.recipe)) && p.items.length > bestCount) {
        best = i; bestCount = p.items.length;
      }
    });
    if (best !== -1) { bot.steps = [{ station: plateStation(best), action: 'interact' }]; return; }
    // No started plate fits: start a new dish on an empty plate, if any
    // ticket wants this ingredient at all.
    const empty = stations.plates.findIndex((p) => p.items.length === 0);
    if (empty !== -1 && tickets.some((t) => t.recipe.items.includes(item))) {
      bot.steps = [{ station: plateStation(empty), action: 'interact' }];
      return;
    }
    bot.steps = [{ station: trashStation, action: 'interact' }];
    return;
  }

  // --- empty hands: work on the urgent ticket.
  // 1. A complete plate for any ticket? Pick it up and serve.
  for (let i = 0; i < stations.plates.length; i++) {
    const p = stations.plates[i];
    if (p.items.length > 0 && tickets.some((t) => plateMatchesRecipe(p.items, t.recipe))) {
      bot.steps = [{ station: plateStation(i), action: 'interact' }];
      return;
    }
  }
  // 2. A plate already started for the target ticket? Finish it.
  let plateIdx = -1;
  let plateCount = -1;
  stations.plates.forEach((p, i) => {
    if (p.items.length > 0 && plateFitsRecipe(p.items, target.recipe) && p.items.length > plateCount) {
      plateIdx = i; plateCount = p.items.length;
    }
  });
  // 3. No usable plate: clear the least-started plate that fits no ticket.
  if (plateIdx === -1) {
    const empty = stations.plates.findIndex((p) => p.items.length === 0);
    if (empty === -1) {
      let worst = 0;
      stations.plates.forEach((p, i) => {
        if (p.items.length < stations.plates[worst].items.length) worst = i;
      });
      const p = stations.plates[worst];
      if (p.items.length > 0 && !tickets.some((t) => plateFitsRecipe(p.items, t.recipe))) {
        bot.steps = [
          { station: plateStation(worst), action: 'interact' },
          { station: trashStation, action: 'interact' },
        ];
        return;
      }
      plateIdx = worst;
    } else {
      plateIdx = empty;
    }
  }
  const plate = stations.plates[plateIdx];
  const missing = missingItems(plate.items, target.recipe);
  if (missing.length === 0) { bot.steps = [{ station: plateStation(plateIdx), action: 'interact' }]; return; }
  const want = missing[0];
  const def = INGREDIENTS[want];

  if (want === 'patty') {
    const done = stations.grill.findIndex((s) => s.state === 'done');
    if (done !== -1) { bot.steps = [{ station: grillStation(done), action: 'interact' }]; return; }
    const cooking = stations.grill.findIndex((s) => s.state === 'cooking');
    if (cooking !== -1) {
      const remain = GRILL_TIME - stations.grill[cooking].progress;
      bot.steps = [{ wait: Math.max(0.2, remain + 0.2) }];
      return;
    }
    const burnt = stations.grill.findIndex((s) => s.state === 'burnt');
    if (burnt !== -1) {
      bot.steps = [
        { station: grillStation(burnt), action: 'interact' },
        { station: trashStation, action: 'interact' },
      ];
      return;
    }
    const free = stations.grill.findIndex((s) => s.state === 'empty');
    bot.steps = [
      { station: binStation('patty_raw'), action: 'interact' },
      { station: grillStation(free === -1 ? 0 : free), action: 'interact' },
    ];
    return;
  }

  // Chopped item: take it finished off the board, wait for it, or chop raw.
  const raw = Object.keys(INGREDIENTS).find((k) => INGREDIENTS[k].becomes === want);
  if (raw) {
    const done = stations.board.findIndex((s) => s.state === 'done' && s.item === raw);
    if (done !== -1) { bot.steps = [{ station: boardStation(done), action: 'interact' }]; return; }
    const chopping = stations.board.findIndex((s) => s.state === 'chopping' && s.item === raw);
    if (chopping !== -1) {
      const remain = CHOP_TIME - stations.board[chopping].progress;
      bot.steps = [{ wait: Math.max(0.2, remain + 0.2) }];
      return;
    }
    const free = stations.board.findIndex((s) => s.state === 'empty');
    bot.steps = [
      { station: binStation(raw), action: 'interact' },
      { station: boardStation(free === -1 ? 0 : free), action: 'interact' },
    ];
    return;
  }

  // Bun or cheese: straight from the bin.
  bot.steps = [{ station: binStation(want), action: 'interact' }];
}

// Drive the chef one tick. Writes a continuous movement vector into
// game.botMove and calls interact() when a step's station is in range.
export function botTick(game, bot, dt) {
  if (game.phase !== 'playing' || game.frozen) return;
  game.botMove = null;
  if (game.elapsed < bot.waitUntil) return;
  if (bot.steps.length === 0) plan(game, bot);
  const step = bot.steps[0];
  if (!step) return;
  if (step.wait !== undefined) {
    bot.waitUntil = game.elapsed + step.wait;
    bot.steps.shift();
    return;
  }
  const chef = game.chef;
  const a = step.station.anchor;
  const dx = a.x - chef.x;
  const dy = a.y - chef.y;
  const dist = Math.hypot(dx, dy);
  if (dist <= INTERACT_RANGE) {
    interact(game, step.station);
    bot.steps.shift();
    bot.stuckTimer = 0;
    bot.detour = null;
    return;
  }
  // Stuck against a counter? Route via the open middle of the room first.
  const moved = Math.hypot(chef.x - bot.lastX, chef.y - bot.lastY);
  bot.stuckTimer += dt;
  if (bot.stuckTimer > 1.2 && moved < 2) {
    bot.detour = { x: 640, y: 350 };
    bot.stuckTimer = 0;
  }
  bot.lastX = chef.x;
  bot.lastY = chef.y;
  let tx = a.x;
  let ty = a.y;
  if (bot.detour) {
    tx = bot.detour.x;
    ty = bot.detour.y;
    if (Math.hypot(tx - chef.x, ty - chef.y) < 30) bot.detour = null;
  }
  const len = Math.hypot(tx - chef.x, ty - chef.y) || 1;
  game.botMove = { x: (tx - chef.x) / len, y: (ty - chef.y) / len };
}
