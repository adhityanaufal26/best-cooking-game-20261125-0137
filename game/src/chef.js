// chef.js — the chef: movement, collision with the counters, carrying one
// thing at a time, and the single interact action (E / Space / click) that
// drives every station.

import {
  VIEW, BINS, GRILL, BOARD, COUNTER, WINDOW, TRASH,
  solidRects, freshStations, tickStations, finishedItem,
} from './kitchen.js';
import { INGREDIENTS, PLATE_ITEMS } from './recipes.js';
import { servePlate } from './orders.js';

export const CHEF_SPEED = 265;
export const CHEF_RADIUS = 17;
export const INTERACT_RANGE = 78;

export function freshChef() {
  return {
    x: 640, y: 350, vx: 0, vy: 0, facing: 1,
    // carrying: null | { kind: 'ingredient', item } | { kind: 'plate', items }
    carrying: null,
    walkPhase: 0,
    moving: false,
  };
}

// Move the chef one tick, sliding along solid counters. dx/dy are -1..1.
export function moveChef(chef, dx, dy, dt) {
  const len = Math.hypot(dx, dy);
  if (len < 0.01) { chef.moving = false; chef.vx = 0; chef.vy = 0; return; }
  const nx = (dx / len) * CHEF_SPEED * dt;
  const ny = (dy / len) * CHEF_SPEED * dt;
  chef.facing = dx !== 0 ? Math.sign(dx) : chef.facing;
  chef.moving = true;
  chef.walkPhase += dt * 11;
  const solids = solidRects();
  const tryMove = (x, y) => {
    if (x < 24 + CHEF_RADIUS || x > VIEW.width - 24 - CHEF_RADIUS) return false;
    if (y < 100 + CHEF_RADIUS || y > VIEW.height - 24 - CHEF_RADIUS) return false;
    for (const r of solids) {
      if (
        x + CHEF_RADIUS > r.x + 2 && x - CHEF_RADIUS < r.x + r.w - 2 &&
        y + CHEF_RADIUS > r.y + 2 && y - CHEF_RADIUS < r.y + r.h - 2
      ) return false;
    }
    return true;
  };
  if (tryMove(chef.x + nx, chef.y)) chef.x += nx;
  if (tryMove(chef.x, chef.y + ny)) chef.y += ny;
}

// The one interact action. `station` is { type, slot?, def? } from kitchen.js.
// Returns a short event string the game can show as feedback, or null.
export function interact(game, station) {
  const { chef, stations, orders } = game;
  const addPopup = (text, color) => game.popups.push({
    x: chef.x, y: chef.y - 34, text, color, life: 1.1, max: 1.1,
  });

  switch (station.type) {
    case 'bin': {
      if (chef.carrying) return null;
      chef.carrying = { kind: 'ingredient', item: station.def.item };
      return `Picked up ${INGREDIENTS[station.def.item].name}`;
    }
    case 'grill': {
      const slot = stations.grill[station.slot];
      if (slot.state === 'empty') {
        if (chef.carrying?.kind === 'ingredient' && chef.carrying.item === 'patty_raw') {
          slot.item = 'patty_raw';
          slot.progress = 0;
          slot.state = 'cooking';
          chef.carrying = null;
          return 'Patty on the grill';
        }
        return null;
      }
      if (chef.carrying) return null;
      if (slot.state === 'cooking') {
        chef.carrying = { kind: 'ingredient', item: 'patty_raw' };
        slot.item = null; slot.progress = 0; slot.state = 'empty';
        return 'Took the patty back';
      }
      const wasBurnt = slot.state === 'burnt';
      chef.carrying = { kind: 'ingredient', item: finishedItem(slot, 'grill') };
      slot.item = null; slot.progress = 0; slot.state = 'empty';
      return wasBurnt ? 'Burnt patty — trash it!' : 'Grilled patty ready';
    }
    case 'board': {
      const slot = stations.board[station.slot];
      if (slot.state === 'empty') {
        const item = chef.carrying?.kind === 'ingredient' ? chef.carrying.item : null;
        if (item && INGREDIENTS[item]?.prep === 'board') {
          slot.item = item;
          slot.progress = 0;
          slot.state = 'chopping';
          chef.carrying = null;
          return `Chopping ${INGREDIENTS[item].name}`;
        }
        return null;
      }
      if (chef.carrying) return null;
      if (slot.state === 'chopping') {
        chef.carrying = { kind: 'ingredient', item: slot.item };
        slot.item = null; slot.progress = 0; slot.state = 'empty';
        return 'Took it back';
      }
      chef.carrying = { kind: 'ingredient', item: finishedItem(slot, 'board') };
      slot.item = null; slot.progress = 0; slot.state = 'empty';
      return 'Chopped and ready';
    }
    case 'plate': {
      const plate = stations.plates[station.slot];
      if (chef.carrying?.kind === 'ingredient') {
        const item = chef.carrying.item;
        if (!PLATE_ITEMS.has(item)) {
          addPopup(item === 'burnt' ? 'Burnt! Trash it' : 'Needs cooking first', '#ff6b5e');
          return null;
        }
        if (plate.items.length >= 5) { addPopup('Plate is full', '#ff6b5e'); return null; }
        plate.items.push(item);
        chef.carrying = null;
        return `Added ${INGREDIENTS[item].name}`;
      }
      if (chef.carrying?.kind === 'plate') {
        if (plate.items.length === 0) {
          plate.items = chef.carrying.items;
          chef.carrying = null;
          return 'Plate set down';
        }
        return null;
      }
      // Empty hands: pick the plate up.
      if (plate.items.length === 0) return null;
      chef.carrying = { kind: 'plate', items: plate.items };
      plate.items = [];
      return 'Picked up the plate';
    }
    case 'window': {
      if (chef.carrying?.kind !== 'plate') {
        if (chef.carrying) { addPopup('Serve a finished plate here', '#ffd166'); }
        return null;
      }
      const result = servePlate(orders, chef.carrying.items, game.streak);
      if (!result.ok) {
        game.streak = 0;
        game.score = Math.max(0, game.score - 50);
        addPopup('No order for this dish! −50', '#ff6b5e');
        game.popups.push({
          x: WINDOW.x + WINDOW.w / 2, y: WINDOW.y - 8,
          text: 'WRONG DISH', color: '#ff6b5e', life: 1.2, max: 1.2,
        });
        return 'wrong dish';
      }
      game.score += result.points;
      game.coins += result.coins;
      game.streak += 1;
      game.bestStreak = Math.max(game.bestStreak, game.streak);
      chef.carrying = null;
      game.popups.push({
        x: WINDOW.x - 56, y: WINDOW.y + 34,
        text: `SERVED! +${result.points}`, color: '#7be382', life: 1.6, max: 1.6,
      });
      game.popups.push({
        x: WINDOW.x - 56, y: WINDOW.y + 64,
        text: `+${result.coins} coins · streak ${game.streak}`, color: '#ffd166', life: 1.6, max: 1.6,
      });
      game.flash = 0.25;
      return 'served';
    }
    case 'trash': {
      if (chef.carrying?.kind === 'ingredient') {
        chef.carrying = null;
        return 'Tossed it';
      }
      if (chef.carrying?.kind === 'plate') {
        chef.carrying.items = [];
        return 'Plate cleared';
      }
      return null;
    }
    default:
      return null;
  }
}

// Re-exported so main.js has one place to advance station timers.
export { freshStations, tickStations };
export { BINS, GRILL, BOARD, COUNTER, WINDOW, TRASH };
