// main.js — boot, game loop, input, and the shift state machine.
// Ember Kitchen: a complete cooking game that runs from static files.

import { VIEW } from './kitchen.js';
import { freshChef, moveChef, interact, freshStations, tickStations, INTERACT_RANGE } from './chef.js';
import { freshOrders, tickOrders, spawnTicket, SHIFT_LENGTH, RUSH_AT, gradeFor } from './orders.js';
import { mulberry32, hashSeed } from './rng.js';
import { drawGame } from './render.js';
import { applyShot } from './shots.js';
import { createBot, botTick } from './autopilot.js';
import { nearestStation, stationAtPoint } from './kitchen.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.width;
canvas.height = VIEW.height;

const params = new URLSearchParams(location.search);
const seedText = params.get('seed') ?? 'ember-1';
const speed = Math.max(0.25, Math.min(8, Number(params.get('speed') ?? '1') || 1));
const demoMode = params.get('demo') === '1';
const shotName = params.get('shot');

export function freshGame() {
  const rng = mulberry32(hashSeed(seedText));
  return {
    phase: 'title', // title | playing | over
    elapsed: 0,
    score: 0,
    coins: 0,
    streak: 0,
    bestStreak: 0,
    hearts: 3,
    chef: freshChef(),
    stations: freshStations(),
    orders: freshOrders(),
    popups: [],
    flash: 0,
    grade: null,
    rng,
    frozen: false,
    animFixed: null,
    speed,
    bot: demoMode ? createBot() : null,
    botMove: null,
    moveTarget: null,
    startedAt: performance.now(),
  };
}

const game = freshGame();
window.__game = game; // exposed for play-testing and verification

function startShift() {
  if (game.phase !== 'title') return;
  game.phase = 'playing';
  game.elapsed = 0;
  spawnTicket(game.orders, 0, game.rng);
  spawnTicket(game.orders, 0, game.rng);
  game.orders.spawnIn = 12;
}

function endShift() {
  game.phase = 'over';
  game.grade = gradeFor(game.score, game.orders.served);
}

function resetGame() {
  const fresh = freshGame();
  for (const key of Object.keys(fresh)) game[key] = fresh[key];
  if (shotName) applyShot(game, shotName);
}

// ------------------------------------------------------------ input: keyboard

const keys = new Set();
const KEYMAP = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
};

addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  if (e.repeat) return;
  if (e.code === 'Enter') {
    if (game.phase === 'title') startShift();
    return;
  }
  if (e.code === 'KeyR' && game.phase === 'over') { resetGame(); return; }
  if (e.code === 'KeyE' || e.code === 'Space') {
    if (game.phase === 'playing') tryInteractNearest();
    return;
  }
  const dir = KEYMAP[e.code];
  if (dir) {
    keys.add(dir);
    game.moveTarget = null;
  }
});

addEventListener('keyup', (e) => {
  const dir = KEYMAP[e.code];
  if (dir) keys.delete(dir);
});

function tryInteractNearest() {
  const { station, distance } = nearestStation(game.chef.x, game.chef.y);
  if (station && distance <= INTERACT_RANGE) interact(game, station);
}

// --------------------------------------------------------------- input: mouse

function canvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * VIEW.width,
    y: ((e.clientY - rect.top) / rect.height) * VIEW.height,
  };
}

canvas.addEventListener('mousedown', (e) => {
  const p = canvasPoint(e);
  if (game.phase === 'title') { startShift(); return; }
  if (game.phase === 'over') return;
  const station = stationAtPoint(p.x, p.y);
  if (station) {
    const d = Math.hypot(game.chef.x - station.anchor.x, game.chef.y - station.anchor.y);
    if (d <= INTERACT_RANGE) {
      interact(game, station);
      return;
    }
    game.moveTarget = { x: station.anchor.x, y: station.anchor.y, station };
  } else {
    game.moveTarget = { x: p.x, y: p.y, station: null };
  }
});

// --------------------------------------------------------------------- loop

let last = performance.now();

function frame(now) {
  const rawDt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const dt = rawDt * game.speed;
  const animTime = game.animFixed ?? now / 1000;

  if (game.phase === 'playing' && !game.frozen) {
    game.elapsed += dt;
    tickStations(game.stations, dt);
    const events = tickOrders(game.orders, game.elapsed, dt, game.rng);
    for (const t of events.expired) {
      game.hearts -= 1;
      game.orders.lost += 1;
      game.streak = 0;
      game.popups.push({
        x: 640, y: 130, text: `Order #${t.id} walked out!`, color: '#ff6b5e', life: 1.4, max: 1.4,
      });
    }
    if (game.bot) {
      try { botTick(game, game.bot, dt); } catch (err) {
        // The scripted player is a test aid; never let it kill the game.
        console.warn('autopilot error', err);
        game.bot = null;
      }
    }

    // Movement: keyboard first, then the autopilot's vector, then a
    // mouse click-to-move target.
    let dx = 0;
    let dy = 0;
    if (keys.has('left')) dx -= 1;
    if (keys.has('right')) dx += 1;
    if (keys.has('up')) dy -= 1;
    if (keys.has('down')) dy += 1;
    if (dx === 0 && dy === 0 && game.botMove) {
      dx = game.botMove.x;
      dy = game.botMove.y;
    }
    if (dx === 0 && dy === 0 && game.moveTarget) {
      const t = game.moveTarget;
      const ddx = t.x - game.chef.x;
      const ddy = t.y - game.chef.y;
      const dist = Math.hypot(ddx, ddy);
      if (dist < 14) {
        if (t.station) interact(game, t.station);
        game.moveTarget = null;
      } else {
        dx = ddx / dist;
        dy = ddy / dist;
      }
    }
    moveChef(game.chef, dx, dy, dt);

    for (const p of game.popups) p.life -= dt;
    game.popups = game.popups.filter((p) => p.life > 0);
    game.flash = Math.max(0, game.flash - dt * 1.4);

    if (game.elapsed >= SHIFT_LENGTH || game.hearts <= 0) endShift();
  }

  drawGame(ctx, game, animTime);
  requestAnimationFrame(frame);
}

if (shotName) applyShot(game, shotName);
if (demoMode && game.phase === 'title') startShift();
requestAnimationFrame(frame);
window.__shotReady = true;
