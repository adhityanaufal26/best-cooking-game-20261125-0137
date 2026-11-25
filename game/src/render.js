// render.js — every pixel Ember Kitchen draws: the kitchen, the food, the
// chef, the order board, the timer, and the title / results screens.
// All art is drawn with canvas shapes in this file; the game loads no images.

import {
  VIEW, HUD_HEIGHT, BINS, GRILL, BOARD, COUNTER, WINDOW, TRASH, RECIPE_BOARD,
  GRILL_TIME, BURN_TIME, CHOP_TIME,
} from './kitchen.js';
import { INGREDIENTS, RECIPES, plateMatchesRecipe } from './recipes.js';
import { SHIFT_LENGTH, RUSH_AT } from './orders.js';

const FONT = '"Trebuchet MS", "Segoe UI", Verdana, sans-serif';

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, weight = 'bold', align = 'left') {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}

function shadowText(ctx, s, x, y, size, color, weight = 'bold', align = 'left') {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillText(s, x + 2, y + 2);
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}

// ---------------------------------------------------------------- food art

export function drawIngredient(ctx, item, x, y, s) {
  const r = s / 2;
  ctx.save();
  ctx.translate(x, y);
  switch (item) {
    case 'bun': {
      ctx.fillStyle = '#e8a94e';
      ctx.beginPath(); ctx.arc(0, 2, r, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#d18f33';
      ctx.fillRect(-r, 0, s, r * 0.45);
      ctx.fillStyle = '#fff3cf';
      for (const [sx, sy] of [[-r * 0.4, -r * 0.45], [0, -r * 0.65], [r * 0.4, -r * 0.4]]) {
        ctx.beginPath(); ctx.ellipse(sx, sy, r * 0.14, r * 0.09, 0.4, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 'patty_raw': {
      ctx.fillStyle = '#e07878';
      roundRect(ctx, -r, -r * 0.55, s, r * 1.1, r * 0.4); ctx.fill();
      ctx.fillStyle = '#c65a5a';
      ctx.beginPath(); ctx.arc(-r * 0.3, 0, r * 0.12, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.3, -r * 0.15, r * 0.12, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'patty': {
      ctx.fillStyle = '#7a4a21';
      roundRect(ctx, -r, -r * 0.55, s, r * 1.1, r * 0.4); ctx.fill();
      ctx.fillStyle = '#5d3717';
      ctx.beginPath(); ctx.arc(-r * 0.35, -r * 0.1, r * 0.14, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.3, r * 0.1, r * 0.14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#9c6a35';
      ctx.beginPath(); ctx.arc(0, -r * 0.2, r * 0.12, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'burnt': {
      ctx.fillStyle = '#222';
      roundRect(ctx, -r, -r * 0.55, s, r * 1.1, r * 0.4); ctx.fill();
      ctx.strokeStyle = '#555'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-r * 0.5, -r * 0.4); ctx.lineTo(r * 0.5, r * 0.3); ctx.stroke();
      break;
    }
    case 'lettuce': case 'lettuce_chopped': {
      ctx.fillStyle = item === 'lettuce' ? '#5da338' : '#8fd35a';
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.45, r * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#c9f29b';
      ctx.beginPath(); ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'tomato': case 'tomato_chopped': {
      ctx.fillStyle = item === 'tomato' ? '#e23b2e' : '#ef6a4a';
      ctx.beginPath(); ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f78d7d';
      ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.3, r * 0.35, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#4d8a2f';
      ctx.beginPath();
      ctx.moveTo(0, -r); ctx.lineTo(-r * 0.3, -r * 0.55); ctx.lineTo(0, -r * 0.7);
      ctx.lineTo(r * 0.3, -r * 0.55); ctx.closePath(); ctx.fill();
      if (item === 'tomato_chopped') {
        ctx.strokeStyle = '#ffd9d2'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2); ctx.stroke();
      }
      break;
    }
    case 'cheese': {
      ctx.fillStyle = '#f7c948';
      ctx.beginPath();
      ctx.moveTo(-r, r * 0.6); ctx.lineTo(r, r * 0.6); ctx.lineTo(r, -r * 0.2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e0a92e';
      for (const [hx, hy] of [[-r * 0.4, r * 0.2], [r * 0.25, r * 0.35], [0, -r * 0.05]]) {
        ctx.beginPath(); ctx.arc(hx, hy, r * 0.14, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 'onion': case 'onion_chopped': {
      ctx.fillStyle = '#b388d6';
      ctx.beginPath(); ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#efe4fb'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.6, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#7fb069';
      ctx.fillRect(-2, -r - 4, 4, 8);
      break;
    }
    default: {
      ctx.fillStyle = '#ccc';
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

// A plate with its stacked ingredients, drawn from above.
export function drawPlate(ctx, items, x, y, s, highlight = false) {
  ctx.save();
  ctx.translate(x, y);
  if (highlight) {
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, 0, s / 2 + 7, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.fillStyle = '#f4f6f8';
  ctx.beginPath(); ctx.arc(0, 0, s / 2, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#c8ccd2';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, s / 2 - 2, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, s / 4, 0, Math.PI * 2); ctx.stroke();
  const n = items.length;
  items.forEach((item, i) => {
    const yy = -((n - 1) * 5) / 2 + i * 5;
    drawIngredient(ctx, item, 0, yy, Math.min(34, s * 0.62));
  });
  ctx.restore();
}

// ------------------------------------------------------------- kitchen floor

function drawFloor(ctx, t) {
  ctx.fillStyle = '#c98d54';
  ctx.fillRect(0, HUD_HEIGHT, VIEW.width, VIEW.height - HUD_HEIGHT);
  // Wood planks.
  ctx.strokeStyle = 'rgba(120,70,30,0.35)';
  ctx.lineWidth = 2;
  for (let y = HUD_HEIGHT + 44; y < VIEW.height; y += 44) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(VIEW.width, y); ctx.stroke();
  }
  for (let row = 0; row < 15; row++) {
    const y = HUD_HEIGHT + row * 44;
    const off = (row % 2) * 90;
    for (let x = off; x < VIEW.width; x += 180) {
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 44); ctx.stroke();
    }
  }
  // Warm rug in the middle of the room.
  ctx.fillStyle = 'rgba(214,69,65,0.16)';
  roundRect(ctx, 320, 300, 520, 120, 18); ctx.fill();
  ctx.strokeStyle = 'rgba(214,69,65,0.35)';
  ctx.lineWidth = 3;
  roundRect(ctx, 332, 312, 496, 96, 12); ctx.stroke();
  void t;
}

function stationShell(ctx, x, y, w, h, top, label, labelColor) {
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  roundRect(ctx, x + 3, y + 5, w, h, 10); ctx.fill();
  ctx.fillStyle = '#8b939e';
  roundRect(ctx, x, y, w, h, 10); ctx.fill();
  ctx.fillStyle = top;
  roundRect(ctx, x, y, w, 26, 10); ctx.fill();
  ctx.fillRect(x, y + 16, w, 10);
  text(ctx, label, x + w / 2, y + 19, 13, labelColor, 'bold', 'center');
}

export function drawKitchen(ctx, game, animTime) {
  drawFloor(ctx, animTime);

  // Ingredient bins, left wall.
  for (const bin of BINS) {
    const def = INGREDIENTS[bin.item];
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    roundRect(ctx, bin.x + 3, bin.y + 4, bin.w, bin.h, 9); ctx.fill();
    ctx.fillStyle = '#fdf6e7';
    roundRect(ctx, bin.x, bin.y, bin.w, bin.h, 9); ctx.fill();
    ctx.fillStyle = def.color;
    roundRect(ctx, bin.x, bin.y, 10, bin.h, 9); ctx.fill();
    drawIngredient(ctx, bin.item, bin.x + 34, bin.y + bin.h / 2, 34);
    text(ctx, bin.label, bin.x + 58, bin.y + 22, 15, '#4a3220');
    text(ctx, 'E to take', bin.x + 58, bin.y + 40, 11, '#8a7a66', 'normal');
  }

  // Grill with flames and two slots.
  stationShell(ctx, GRILL.x, GRILL.y, GRILL.w, GRILL.h, '#5b6773', 'GRILL', '#ffe9b8');
  GRILL.slots.forEach((slot, i) => {
    const s = game.stations.grill[i];
    const cx = slot.x + 34;
    const cy = slot.y + 30;
    ctx.fillStyle = '#2e343c';
    roundRect(ctx, slot.x, slot.y, 68, 60, 8); ctx.fill();
    if (s.state === 'cooking' || s.state === 'done' || s.state === 'burnt') {
      // Flame licks under the patty.
      const flick = Math.sin(animTime * 9 + i * 2.1) * 3;
      ctx.fillStyle = s.state === 'burnt' ? '#5a5a5a' : '#ff8c1a';
      ctx.beginPath();
      ctx.moveTo(cx - 16, cy + 16);
      ctx.quadraticCurveTo(cx - 10, cy - 6 - flick, cx, cy - 12 - flick);
      ctx.quadraticCurveTo(cx + 10, cy - 6 - flick, cx + 16, cy + 16);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = s.state === 'burnt' ? '#333' : '#ffd23e';
      ctx.beginPath();
      ctx.moveTo(cx - 9, cy + 16);
      ctx.quadraticCurveTo(cx - 5, cy + 2 - flick, cx, cy - 2 - flick);
      ctx.quadraticCurveTo(cx + 5, cy + 2 - flick, cx + 9, cy + 16);
      ctx.closePath(); ctx.fill();
      drawIngredient(ctx, s.item, cx, cy - 2, 40);
      // Progress ring.
      const total = s.state === 'done' ? GRILL_TIME : GRILL_TIME + BURN_TIME;
      const frac = Math.min(1, s.progress / GRILL_TIME);
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(cx, cy - 2, 30, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = s.state === 'burnt' ? '#ff5a4e' : (s.state === 'done' ? '#7be382' : '#ffd23e');
      ctx.beginPath(); ctx.arc(cx, cy - 2, 30, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke();
      if (s.state === 'done') text(ctx, 'READY', cx, cy + 46, 11, '#7be382', 'bold', 'center');
      if (s.state === 'burnt') text(ctx, 'BURNT!', cx, cy + 46, 11, '#ff5a4e', 'bold', 'center');
      void total;
    } else {
      text(ctx, 'empty', cx, cy + 6, 12, '#7d8894', 'normal', 'center');
    }
  });

  // Chopping board with two slots.
  stationShell(ctx, BOARD.x, BOARD.y, BOARD.w, BOARD.h, '#a9803e', 'CHOPPING BOARD', '#fff3d6');
  BOARD.slots.forEach((slot, i) => {
    const s = game.stations.board[i];
    const cx = slot.x + 34;
    const cy = slot.y + 30;
    ctx.fillStyle = '#d9b06a';
    roundRect(ctx, slot.x, slot.y, 68, 60, 8); ctx.fill();
    if (s.state !== 'empty') {
      drawIngredient(ctx, s.state === 'done' ? finishedIcon(s.item) : s.item, cx, cy - 2, 38);
      const frac = Math.min(1, s.progress / CHOP_TIME);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      roundRect(ctx, cx - 26, cy + 26, 52, 7, 3); ctx.fill();
      ctx.fillStyle = s.state === 'done' ? '#7be382' : '#ffd23e';
      roundRect(ctx, cx - 26, cy + 26, 52 * frac, 7, 3); ctx.fill();
      if (s.state === 'done') text(ctx, 'CHOPPED', cx, cy + 48, 10, '#7be382', 'bold', 'center');
    } else {
      text(ctx, 'empty', cx, cy + 6, 12, '#8a6a35', 'normal', 'center');
    }
  });

  // Assembly counter with three plates.
  stationShell(ctx, COUNTER.x, COUNTER.y, COUNTER.w, COUNTER.h, '#7d8894', 'ASSEMBLY — BUILD THE DISH HERE', '#fff');
  COUNTER.plates.forEach((p, i) => {
    const plate = game.stations.plates[i];
    const ready = game.orders.tickets.some((t) => plate.items.length > 0 && plateMatchesRecipe(plate.items, t.recipe));
    drawPlate(ctx, plate.items, p.x + 34, p.y + 30, 62, ready);
    if (plate.items.length === 0) text(ctx, 'plate', p.x + 34, p.y + 34, 11, '#5b6773', 'normal', 'center');
    if (ready) text(ctx, 'READY TO SERVE!', p.x + 34, p.y - 8, 11, '#7be382', 'bold', 'center');
  });

  // Serving window.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  roundRect(ctx, WINDOW.x + 3, WINDOW.y + 5, WINDOW.w, WINDOW.h, 10); ctx.fill();
  ctx.fillStyle = '#fdf6e7';
  roundRect(ctx, WINDOW.x, WINDOW.y, WINDOW.w, WINDOW.h, 10); ctx.fill();
  ctx.fillStyle = '#d64541';
  roundRect(ctx, WINDOW.x, WINDOW.y, WINDOW.w, 34, 10); ctx.fill();
  ctx.fillRect(WINDOW.x, WINDOW.y + 24, WINDOW.w, 10);
  text(ctx, 'SERVE  •  RING THE BELL', WINDOW.x + WINDOW.w / 2, WINDOW.y + 23, 14, '#fff', 'bold', 'center');
  // Pass-through hatch.
  ctx.fillStyle = '#8b5a2b';
  roundRect(ctx, WINDOW.x + 24, WINDOW.y + 52, WINDOW.w - 48, 84, 8); ctx.fill();
  ctx.fillStyle = '#3a2412';
  roundRect(ctx, WINDOW.x + 32, WINDOW.y + 60, WINDOW.w - 64, 68, 6); ctx.fill();
  text(ctx, 'dishes go out here', WINDOW.x + WINDOW.w / 2, WINDOW.y + 100, 12, '#c9a06a', 'normal', 'center');
  // Bell.
  const bx = WINDOW.bell.x;
  const by = WINDOW.bell.y;
  ctx.fillStyle = '#f7c948';
  ctx.beginPath(); ctx.arc(bx, by, 16, Math.PI, 0); ctx.closePath(); ctx.fill();
  ctx.fillRect(bx - 16, by - 2, 32, 4);
  ctx.fillStyle = '#e0a92e';
  ctx.beginPath(); ctx.arc(bx, by + 6, 4, 0, Math.PI * 2); ctx.fill();

  // Trash.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  roundRect(ctx, TRASH.x + 3, TRASH.y + 4, TRASH.w, TRASH.h, 9); ctx.fill();
  ctx.fillStyle = '#5b6773';
  roundRect(ctx, TRASH.x, TRASH.y, TRASH.w, TRASH.h, 9); ctx.fill();
  ctx.fillStyle = '#39424c';
  roundRect(ctx, TRASH.x + 14, TRASH.y + 14, TRASH.w - 28, TRASH.h - 28, 7); ctx.fill();
  text(ctx, 'TRASH', TRASH.x + TRASH.w / 2, TRASH.y + 52, 15, '#e8edf2', 'bold', 'center');
  text(ctx, 'dump mistakes here', TRASH.x + TRASH.w / 2, TRASH.y + 74, 11, '#9aa5b1', 'normal', 'center');

  // Recipe cheat-sheet board, bottom right.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  roundRect(ctx, RECIPE_BOARD.x + 3, RECIPE_BOARD.y + 4, RECIPE_BOARD.w, RECIPE_BOARD.h, 9); ctx.fill();
  ctx.fillStyle = '#fdf6e7';
  roundRect(ctx, RECIPE_BOARD.x, RECIPE_BOARD.y, RECIPE_BOARD.w, RECIPE_BOARD.h, 9); ctx.fill();
  text(ctx, '— RECIPES —', RECIPE_BOARD.x + RECIPE_BOARD.w / 2, RECIPE_BOARD.y + 20, 13, '#8a5a2b', 'bold', 'center');
  RECIPES.forEach((r, i) => {
    const y = RECIPE_BOARD.y + 42 + i * 20;
    text(ctx, r.name, RECIPE_BOARD.x + 12, y, 12, '#4a3220');
    let x = RECIPE_BOARD.x + RECIPE_BOARD.w - 14;
    for (let j = r.items.length - 1; j >= 0; j--) {
      drawIngredient(ctx, r.items[j], x - 8, y - 4, 15);
      x -= 19;
    }
  });
}

function finishedIcon(item) {
  return { lettuce: 'lettuce_chopped', tomato: 'tomato_chopped', onion: 'onion_chopped' }[item] ?? item;
}

// ------------------------------------------------------------------- the chef

export function drawChef(ctx, game, animTime) {
  const chef = game.chef;
  const bob = chef.moving ? Math.sin(chef.walkPhase) * 2.5 : Math.sin(animTime * 2) * 1;
  const x = chef.x;
  const y = chef.y + bob * 0.4;
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(x, chef.y + 18, 20, 7, 0, 0, Math.PI * 2); ctx.fill();
  // Body / apron.
  ctx.fillStyle = '#f2f2f2';
  roundRect(ctx, x - 15, y - 6, 30, 26, 10); ctx.fill();
  ctx.fillStyle = '#d64541';
  roundRect(ctx, x - 15, y + 8, 30, 12, 6); ctx.fill();
  // Head.
  ctx.fillStyle = '#f2c79b';
  ctx.beginPath(); ctx.arc(x, y - 16, 13, 0, Math.PI * 2); ctx.fill();
  // Toque.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(x - 8, y - 26, 8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x, y - 30, 9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 8, y - 26, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(x - 13, y - 30, 26, 8);
  // Eyes look the way the chef faces.
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(x + chef.facing * 4 - 4, y - 16, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + chef.facing * 4 + 4, y - 16, 1.8, 0, Math.PI * 2); ctx.fill();
  // Carried item floats above the toque.
  if (chef.carrying) {
    const cy = y - 52 + Math.sin(animTime * 3) * 2;
    if (chef.carrying.kind === 'ingredient') {
      drawIngredient(ctx, chef.carrying.item, x, cy, 34);
    } else {
      drawPlate(ctx, chef.carrying.items, x, cy, 52);
    }
  }
}

// ------------------------------------------------------------------------ HUD

function ticketCard(ctx, ticket, x, y, w, h) {
  const frac = Math.max(0, ticket.patience / ticket.maxPatience);
  const urgent = ticket.patience < 15;
  const pulse = urgent ? 0.75 + 0.25 * Math.sin(Date.now() / 120) : 1;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = urgent ? '#ffe3de' : '#fffdf6';
  roundRect(ctx, x, y, w, h, 9); ctx.fill();
  ctx.strokeStyle = urgent ? '#e23b2e' : '#d8c9a8';
  ctx.lineWidth = urgent ? 3 : 2;
  roundRect(ctx, x, y, w, h, 9); ctx.stroke();
  ctx.restore();
  text(ctx, `#${ticket.id} ${ticket.recipe.name}`, x + 10, y + 20, 14, '#4a3220');
  text(ctx, `${Math.ceil(ticket.patience)}s`, x + w - 10, y + 20, 14, urgent ? '#e23b2e' : '#8a7a66', 'bold', 'right');
  // Ingredient chips.
  let ix = x + 10;
  for (const item of ticket.recipe.items) {
    drawIngredient(ctx, item, ix + 10, y + 42, 20);
    ix += 24;
  }
  // Patience bar.
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  roundRect(ctx, x + 10, y + h - 12, w - 20, 6, 3); ctx.fill();
  ctx.fillStyle = frac > 0.5 ? '#7cc24a' : frac > 0.25 ? '#f7c948' : '#e23b2e';
  roundRect(ctx, x + 10, y + h - 12, (w - 20) * frac, 6, 3); ctx.fill();
}

export function drawHUD(ctx, game) {
  // Top bar.
  ctx.fillStyle = '#3a2c1e';
  ctx.fillRect(0, 0, VIEW.width, HUD_HEIGHT);
  ctx.fillStyle = '#2b2015';
  ctx.fillRect(0, HUD_HEIGHT - 6, VIEW.width, 6);

  text(ctx, 'ORDER BOARD', 16, 20, 13, '#ffd166');
  const tickets = game.orders.tickets;
  const cardW = 196;
  tickets.forEach((t, i) => ticketCard(ctx, t, 16 + i * (cardW + 10), 28, cardW, 56));
  if (tickets.length === 0) {
    text(ctx, 'No orders — take a breath!', 16, 62, 14, '#c9b18a', 'normal');
  }

  // Shift timer, centre.
  const remain = Math.max(0, SHIFT_LENGTH - game.elapsed);
  const mm = Math.floor(remain / 60);
  const ss = Math.floor(remain % 60).toString().padStart(2, '0');
  const rush = game.elapsed >= RUSH_AT;
  const cx = 880;
  text(ctx, 'SHIFT', cx, 20, 12, '#c9b18a', 'bold', 'center');
  text(ctx, `${mm}:${ss}`, cx, 52, 30, rush ? '#ff6b5e' : '#fff', 'bold', 'center');
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  roundRect(ctx, cx - 70, 60, 140, 7, 3); ctx.fill();
  ctx.fillStyle = rush ? '#ff6b5e' : '#ffd166';
  roundRect(ctx, cx - 70, 60, 140 * (1 - game.elapsed / SHIFT_LENGTH), 7, 3); ctx.fill();
  if (rush) text(ctx, 'RUSH HOUR!', cx, 84, 12, '#ff6b5e', 'bold', 'center');

  // Score / coins / streak, right.
  const rx = 1000;
  text(ctx, 'SCORE', rx, 20, 12, '#c9b18a', 'bold');
  text(ctx, String(game.score), rx, 50, 26, '#fff', 'bold');
  text(ctx, 'coins ' + game.coins, rx + 130, 20, 15, '#ffd166');
  text(ctx, `streak ${game.streak}`, rx + 130, 46, 15, game.streak >= 3 ? '#ff9a3d' : '#c9b18a');
  text(ctx, `served ${game.orders.served}`, rx + 130, 70, 13, '#c9b18a');
  // Hearts.
  let hx = rx;
  for (let i = 0; i < 3; i++) {
    text(ctx, i < game.hearts ? '♥' : '♡', hx, 82, 16, i < game.hearts ? '#ff5a6e' : '#6b5844');
    hx += 22;
  }
}

// ------------------------------------------------------- popups and feedback

export function drawPopups(ctx, game) {
  for (const p of game.popups) {
    const a = Math.max(0, Math.min(1, p.life / p.max));
    ctx.save();
    ctx.globalAlpha = a;
    shadowText(ctx, p.text, p.x, p.y, 20, p.color, 'bold', 'center');
    ctx.restore();
  }
}

export function drawHint(ctx, game) {
  if (game.phase !== 'playing') return;
  text(ctx, 'WASD / arrows to move  •  E or click to grab / place / serve  •  cook patties, chop veg, build the dish, ring the bell', 640, 706, 13, 'rgba(255,255,255,0.85)', 'normal', 'center');
}

// ------------------------------------------------------------- title / ending

export function drawTitle(ctx, game, animTime) {
  ctx.fillStyle = 'rgba(30,18,8,0.72)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  const bob = Math.sin(animTime * 2) * 6;
  shadowText(ctx, 'EMBER KITCHEN', 640, 170 + bob * 0.3, 64, '#ffd166', 'bold', 'center');
  shadowText(ctx, '— Sizzle & Serve —', 640, 210 + bob * 0.3, 26, '#fff', 'bold', 'center');
  text(ctx, 'Run the busiest little kitchen in town: take orders, grill patties,', 640, 268, 18, '#ffe9b8', 'normal', 'center');
  text(ctx, 'chop veg, build each dish exactly as ordered — and serve it before', 640, 292, 18, '#ffe9b8', 'normal', 'center');
  text(ctx, 'the customer walks out.', 640, 316, 18, '#ffe9b8', 'normal', 'center');
  // Recipe strip.
  let x = 640 - (RECIPES.length * 210) / 2;
  for (const r of RECIPES) {
    ctx.fillStyle = 'rgba(255,253,246,0.12)';
    roundRect(ctx, x, 350, 196, 92, 10); ctx.fill();
    text(ctx, r.name, x + 98, 376, 15, '#fff', 'bold', 'center');
    let ix = x + 98 - ((r.items.length - 1) * 26) / 2;
    for (const item of r.items) { drawIngredient(ctx, item, ix, 408, 26); ix += 26; }
    text(ctx, `+${r.base} pts`, x + 98, 434, 12, '#ffd166', 'normal', 'center');
    x += 210;
  }
  const blink = Math.sin(animTime * 4) > -0.2;
  if (blink) shadowText(ctx, 'PRESS ENTER OR CLICK TO START', 640, 510, 24, '#7be382', 'bold', 'center');
  text(ctx, 'Move: WASD / arrows   •   Interact: E / Space / mouse click', 640, 556, 16, '#e8d9bd', 'normal', 'center');
  text(ctx, 'Grill the patty 6s (don\'t let it burn!)  •  Chop veg on the board  •  Build on a plate  •  Serve at the window', 640, 584, 15, '#e8d9bd', 'normal', 'center');
  text(ctx, '3-minute shift  •  streaks pay bonus coins  •  3 lost orders ends the shift early', 640, 612, 15, '#e8d9bd', 'normal', 'center');
  void game;
}

export function drawGameOver(ctx, game) {
  ctx.fillStyle = 'rgba(30,18,8,0.78)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  shadowText(ctx, 'SHIFT OVER!', 640, 170, 56, '#ffd166', 'bold', 'center');
  const grade = game.grade;
  shadowText(ctx, `GRADE ${grade}`, 640, 250, 40, grade === 'S' ? '#7be382' : '#fff', 'bold', 'center');
  text(ctx, `Score  ${game.score}`, 640, 320, 26, '#fff', 'bold', 'center');
  text(ctx, `Dishes served  ${game.orders.served}     •     Coins earned  ${game.coins}`, 640, 360, 20, '#ffe9b8', 'normal', 'center');
  text(ctx, `Best streak  ${game.bestStreak}     •     Orders lost  ${game.orders.lost}`, 640, 392, 20, '#ffe9b8', 'normal', 'center');
  const line = grade === 'S' ? 'A flawless shift — the regulars are already queuing for tomorrow.'
    : grade === 'A' ? 'A cracking shift — the kitchen sang tonight.'
    : grade === 'B' ? 'A solid shift — a few more streaks and it sings.'
    : grade === 'C' ? 'The kitchen survived. Barely. Sharpen the knives and go again.'
    : 'The customers walked out hungry. The grill is still warm — try again.';
  text(ctx, line, 640, 440, 18, '#fff', 'normal', 'center');
  const blink = Math.sin(Date.now() / 300) > -0.2;
  if (blink) shadowText(ctx, 'PRESS R TO COOK AGAIN', 640, 520, 24, '#7be382', 'bold', 'center');
}

// ------------------------------------------------------------------ main draw

export function drawGame(ctx, game, animTime) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = '#f7e8c9';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  drawKitchen(ctx, game, animTime);
  drawChef(ctx, game, animTime);
  drawHUD(ctx, game);
  drawPopups(ctx, game);
  drawHint(ctx, game);
  if (game.flash > 0) {
    ctx.fillStyle = `rgba(255,209,102,${game.flash * 0.55})`;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  }
  if (game.phase === 'title') drawTitle(ctx, game, animTime);
  if (game.phase === 'over') drawGameOver(ctx, game);
}
