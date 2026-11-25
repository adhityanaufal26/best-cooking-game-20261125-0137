// orders.js — order tickets: spawning, patience, serving, scoring.
// A ticket is a customer's order: one recipe, a patience countdown, and a
// payout that shrinks as the customer waits.

import { RECIPES, plateMatchesRecipe } from './recipes.js';
import { weightedPick } from './rng.js';

export const SHIFT_LENGTH = 180; // a full shift lasts 3 minutes
export const MAX_TICKETS = 4;
export const RUSH_AT = 150; // the last 30 seconds are rush hour

let nextTicketId = 1;

export function freshOrders() {
  return { tickets: [], spawnIn: 2.5, served: 0, lost: 0 };
}

function patienceFor(elapsed) {
  // Customers get less patient as the shift wears on.
  const t = Math.min(1, elapsed / SHIFT_LENGTH);
  return 78 - 22 * t;
}

function spawnIntervalFor(elapsed) {
  const t = Math.min(1, elapsed / SHIFT_LENGTH);
  const base = 14 - 5 * t;
  return elapsed >= RUSH_AT ? base * 0.65 : base;
}

export function spawnTicket(orders, elapsed, rng) {
  if (orders.tickets.length >= MAX_TICKETS) return null;
  const recipe = weightedPick(
    rng,
    RECIPES.map((r) => ({ value: r, weight: r.weight })),
  );
  const patience = patienceFor(elapsed);
  const ticket = {
    id: nextTicketId++,
    recipe,
    patience,
    maxPatience: patience,
    born: elapsed,
  };
  orders.tickets.push(ticket);
  return ticket;
}

// Advance the order board one tick. Returns events the game should react to:
// { expired: [ticket...] } when a customer walks out.
export function tickOrders(orders, elapsed, dt, rng) {
  const events = { expired: [] };
  orders.spawnIn -= dt;
  if (orders.spawnIn <= 0) {
    spawnTicket(orders, elapsed, rng);
    orders.spawnIn = spawnIntervalFor(elapsed);
  }
  for (const ticket of orders.tickets) ticket.patience -= dt;
  const stillWaiting = [];
  for (const ticket of orders.tickets) {
    if (ticket.patience <= 0) events.expired.push(ticket);
    else stillWaiting.push(ticket);
  }
  orders.tickets = stillWaiting;
  return events;
}

// Serve a plate at the window. Returns a result object:
// { ok, ticket, points, coins, reason } — ok is false when no ticket wants
// exactly what is on the plate.
export function servePlate(orders, plateItems, streak) {
  for (const ticket of orders.tickets) {
    if (plateMatchesRecipe(plateItems, ticket.recipe)) {
      const timeBonus = Math.round(2 * Math.max(0, ticket.patience));
      const streakBonus = Math.min(150, 25 * streak);
      const points = ticket.recipe.base + timeBonus + streakBonus;
      const coins = Math.max(5, Math.round(points / 10));
      orders.tickets = orders.tickets.filter((t) => t.id !== ticket.id);
      orders.served += 1;
      return { ok: true, ticket, points, coins, timeBonus, streakBonus };
    }
  }
  return { ok: false, reason: 'No order wants this dish yet' };
}

export function gradeFor(score, served) {
  if (served >= 12 && score >= 2200) return 'S';
  if (served >= 9 && score >= 1600) return 'A';
  if (served >= 6 && score >= 1000) return 'B';
  if (served >= 3) return 'C';
  return 'D';
}
