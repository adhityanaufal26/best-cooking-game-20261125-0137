// kitchen.js — the kitchen floor: where every station sits, what it holds,
// and how it changes over time (grill cooking, board chopping).
// The canvas is 1280x720. The order board lives in the HUD strip (y 0..92);
// the walkable floor is y 100..712.

export const VIEW = { width: 1280, height: 720 };
export const HUD_HEIGHT = 92;

export const GRILL_TIME = 6; // seconds a patty needs on the grill
export const BURN_TIME = 6; // seconds past done before it burns
export const CHOP_TIME = 2.5; // seconds an item needs on the board

// Bins down the left wall. Each bin hands out one ingredient, endlessly.
export const BINS = [
  { id: 'bun', item: 'bun', label: 'Buns', x: 16, y: 116, w: 168, h: 52 },
  { id: 'patty', item: 'patty_raw', label: 'Patties', x: 16, y: 178, w: 168, h: 52 },
  { id: 'lettuce', item: 'lettuce', label: 'Lettuce', x: 16, y: 240, w: 168, h: 52 },
  { id: 'tomato', item: 'tomato', label: 'Tomatoes', x: 16, y: 302, w: 168, h: 52 },
  { id: 'cheese', item: 'cheese', label: 'Cheese', x: 16, y: 364, w: 168, h: 52 },
  { id: 'onion', item: 'onion', label: 'Onions', x: 16, y: 426, w: 168, h: 52 },
];

export const GRILL = {
  id: 'grill', label: 'GRILL', x: 264, y: 116, w: 300, h: 96,
  slots: [
    { x: 306, y: 150 },
    { x: 452, y: 150 },
  ],
};

export const BOARD = {
  id: 'board', label: 'CHOPPING BOARD', x: 604, y: 116, w: 300, h: 96,
  slots: [
    { x: 646, y: 150 },
    { x: 792, y: 150 },
  ],
};

// The assembly counter along the bottom of the room, with three fixed plates.
export const COUNTER = {
  id: 'counter', label: 'ASSEMBLY', x: 264, y: 560, w: 640, h: 132,
  plates: [
    { x: 344, y: 626 },
    { x: 528, y: 626 },
    { x: 712, y: 626 },
  ],
};

export const WINDOW = {
  id: 'window', label: 'SERVE', x: 1016, y: 116, w: 248, h: 180,
  bell: { x: 1228, y: 182 },
};

export const TRASH = {
  id: 'trash', label: 'TRASH', x: 16, y: 520, w: 168, h: 96,
};

export const RECIPE_BOARD = {
  id: 'recipes', label: 'RECIPES', x: 1016, y: 560, w: 248, h: 140,
};

// Solid rectangles the chef cannot walk through.
export function solidRects() {
  const rects = [];
  for (const b of BINS) rects.push({ x: b.x, y: b.y, w: b.w, h: b.h });
  rects.push({ x: GRILL.x, y: GRILL.y, w: GRILL.w, h: GRILL.h });
  rects.push({ x: BOARD.x, y: BOARD.y, w: BOARD.w, h: BOARD.h });
  rects.push({ x: COUNTER.x, y: COUNTER.y, w: COUNTER.w, h: COUNTER.h });
  rects.push({ x: WINDOW.x, y: WINDOW.y, w: WINDOW.w, h: WINDOW.h });
  rects.push({ x: TRASH.x, y: TRASH.y, w: TRASH.w, h: TRASH.h });
  rects.push({ x: RECIPE_BOARD.x, y: RECIPE_BOARD.y, w: RECIPE_BOARD.w, h: RECIPE_BOARD.h });
  return rects;
}

// Fresh station state: two grill slots, two board slots, three plates.
export function freshStations() {
  return {
    grill: GRILL.slots.map(() => ({ item: null, progress: 0, state: 'empty' })),
    board: BOARD.slots.map(() => ({ item: null, progress: 0, state: 'empty' })),
    plates: COUNTER.plates.map(() => ({ items: [] })),
  };
}

// Advance grill and board timers. Called once per tick while playing.
export function tickStations(stations, dt) {
  for (const slot of stations.grill) {
    if (slot.state === 'cooking') {
      slot.progress += dt;
      if (slot.progress >= GRILL_TIME + BURN_TIME) {
        slot.item = 'burnt';
        slot.state = 'burnt';
      } else if (slot.progress >= GRILL_TIME) {
        slot.item = 'patty';
        slot.state = 'done';
      }
    }
  }
  for (const slot of stations.board) {
    if (slot.state === 'chopping') {
      slot.progress += dt;
      if (slot.progress >= CHOP_TIME) {
        slot.state = 'done';
      }
    }
  }
}

// The item a finished slot hands back (grill: patty; board: the chopped form).
export function finishedItem(slot, kind) {
  if (kind === 'grill') return slot.item;
  const def = slot.item ? { lettuce: 'lettuce_chopped', tomato: 'tomato_chopped', onion: 'onion_chopped' }[slot.item] : null;
  return def ?? slot.item;
}

// Anchor point the chef must stand near to use a station.
export function stationAnchor(station) {
  switch (station.type) {
    case 'bin': return { x: station.def.x + station.def.w + 26, y: station.def.y + station.def.h / 2 };
    case 'grill': return { x: GRILL.slots[station.slot].x + 34, y: GRILL.y + GRILL.h + 26 };
    case 'board': return { x: BOARD.slots[station.slot].x + 34, y: BOARD.y + BOARD.h + 26 };
    case 'plate': return { x: COUNTER.plates[station.slot].x + 34, y: COUNTER.y - 26 };
    case 'window': return { x: WINDOW.x + WINDOW.w / 2, y: WINDOW.y + WINDOW.h + 26 };
    case 'trash': return { x: TRASH.x + TRASH.w + 26, y: TRASH.y + TRASH.h / 2 };
    default: return { x: 640, y: 600 };
  }
}

export function nearestStation(px, py) {
  const candidates = [];
  for (const def of BINS) candidates.push({ type: 'bin', def, anchor: stationAnchor({ type: 'bin', def }) });
  GRILL.slots.forEach((_, slot) => candidates.push({ type: 'grill', slot, anchor: stationAnchor({ type: 'grill', slot }) }));
  BOARD.slots.forEach((_, slot) => candidates.push({ type: 'board', slot, anchor: stationAnchor({ type: 'board', slot }) }));
  COUNTER.plates.forEach((_, slot) => candidates.push({ type: 'plate', slot, anchor: stationAnchor({ type: 'plate', slot }) }));
  candidates.push({ type: 'window', anchor: stationAnchor({ type: 'window' }) });
  candidates.push({ type: 'trash', anchor: stationAnchor({ type: 'trash' }) });
  let best = null;
  let bestD = Infinity;
  for (const c of candidates) {
    const d = Math.hypot(px - c.anchor.x, py - c.anchor.y);
    if (d < bestD) { bestD = d; best = c; }
  }
  return { station: best, distance: bestD };
}

// Which station, if any, a mouse click lands on (or near).
export function stationAtPoint(mx, my) {
  for (const def of BINS) {
    if (mx >= def.x - 8 && mx <= def.x + def.w + 8 && my >= def.y - 8 && my <= def.y + def.h + 8) {
      return { type: 'bin', def, anchor: stationAnchor({ type: 'bin', def }) };
    }
  }
  if (mx >= GRILL.x && mx <= GRILL.x + GRILL.w && my >= GRILL.y && my <= GRILL.y + GRILL.h) {
    const slot = mx < GRILL.x + GRILL.w / 2 ? 0 : 1;
    return { type: 'grill', slot, anchor: stationAnchor({ type: 'grill', slot }) };
  }
  if (mx >= BOARD.x && mx <= BOARD.x + BOARD.w && my >= BOARD.y && my <= BOARD.y + BOARD.h) {
    const slot = mx < BOARD.x + BOARD.w / 2 ? 0 : 1;
    return { type: 'board', slot, anchor: stationAnchor({ type: 'board', slot }) };
  }
  if (mx >= COUNTER.x && mx <= COUNTER.x + COUNTER.w && my >= COUNTER.y && my <= COUNTER.y + COUNTER.h) {
    let slot = 0;
    let bestD = Infinity;
    COUNTER.plates.forEach((p, i) => {
      const d = Math.hypot(mx - p.x, my - p.y);
      if (d < bestD) { bestD = d; slot = i; }
    });
    return { type: 'plate', slot, anchor: stationAnchor({ type: 'plate', slot }) };
  }
  if (mx >= WINDOW.x && mx <= WINDOW.x + WINDOW.w && my >= WINDOW.y && my <= WINDOW.y + WINDOW.h) {
    return { type: 'window', anchor: stationAnchor({ type: 'window' }) };
  }
  if (mx >= TRASH.x && mx <= TRASH.x + TRASH.w && my >= TRASH.y && my <= TRASH.y + TRASH.h) {
    return { type: 'trash', anchor: stationAnchor({ type: 'trash' }) };
  }
  return null;
}
