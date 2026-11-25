// shots.js — deterministic screenshot presets. Each shot stages a real game
// state through the same state objects the live game uses, then freezes it,
// so the screenshots are true renders of the game's own code: kitchen,
// order board, ingredients on the counter, a dish mid-assembly, a timer and
// a plate ready to serve.
//
// ?shot=cover | title | rush | serve   (and ?seed= to vary the tickets)

import { recipeById } from './recipes.js';

function ticket(id, recipeId, patience) {
  const recipe = recipeById(recipeId);
  return { id, recipe, patience, maxPatience: patience + 20, born: 0 };
}

export function applyShot(game, name) {
  game.frozen = true;
  game.animFixed = 1.234;
  const st = game.stations;
  const ord = game.orders;

  if (name === 'title') {
    game.phase = 'title';
    return;
  }

  game.phase = 'playing';

  if (name === 'cover') {
    // The money shot: everything the brief asks for in one frame.
    game.elapsed = 46; // shift timer reads 2:14
    game.score = 1250;
    game.coins = 148;
    game.streak = 5;
    game.bestStreak = 5;
    game.hearts = 3;
    ord.tickets = [
      ticket(1, 'sunny', 38),
      ticket(2, 'double', 52),
      ticket(3, 'garden', 21),
      ticket(4, 'cheesy', 44),
    ];
    ord.served = 4;
    // Grill: one patty mid-cook, one done and ready.
    st.grill[0] = { item: 'patty_raw', progress: 3.9, state: 'cooking' };
    st.grill[1] = { item: 'patty', progress: 6.0, state: 'done' };
    // Board: one chopped tomato ready, one lettuce mid-chop.
    st.board[0] = { item: 'tomato', progress: 2.5, state: 'done' };
    st.board[1] = { item: 'lettuce', progress: 1.0, state: 'chopping' };
    // Plates: one dish mid-assembly, one complete and ready to serve.
    st.plates[0] = { items: ['bun', 'patty'] };
    st.plates[1] = { items: ['bun', 'patty', 'cheese'] };
    st.plates[2] = { items: [] };
    // Chef mid-kitchen, carrying a sliced tomato toward the assembly plate.
    game.chef.x = 560;
    game.chef.y = 500;
    game.chef.carrying = { kind: 'ingredient', item: 'tomato_chopped' };
    game.popups = [{
      x: 1140, y: 330, text: 'SERVED! +320', color: '#7be382', life: 1.6, max: 1.6,
    }];
    return;
  }

  if (name === 'rush') {
    // Last 30 seconds: four impatient tickets, both stations busy.
    game.elapsed = 158; // shift timer reads 0:22, RUSH HOUR banner on
    game.score = 2480;
    game.coins = 261;
    game.streak = 8;
    game.bestStreak = 9;
    game.hearts = 1;
    ord.tickets = [
      ticket(5, 'sunrise', 8),
      ticket(6, 'sunny', 15),
      ticket(7, 'double', 23),
      ticket(8, 'garden', 31),
    ];
    ord.served = 11;
    ord.lost = 2;
    st.grill[0] = { item: 'patty_raw', progress: 5.2, state: 'cooking' };
    st.grill[1] = { item: 'patty_raw', progress: 2.1, state: 'cooking' };
    st.board[0] = { item: 'lettuce', progress: 2.0, state: 'chopping' };
    st.board[1] = { item: 'onion', progress: 0.8, state: 'chopping' };
    st.plates[0] = { items: ['bun', 'patty'] };
    st.plates[1] = { items: ['bun', 'patty', 'tomato_chopped', 'cheese'] };
    st.plates[2] = { items: ['bun', 'lettuce_chopped'] };
    game.chef.x = 700;
    game.chef.y = 500;
    game.chef.carrying = { kind: 'ingredient', item: 'patty' };
    game.popups = [{
      x: 640, y: 520, text: 'RUSH! Keep the streak alive', color: '#ff9a3d', life: 1.6, max: 1.6,
    }];
    return;
  }

  if (name === 'serve') {
    // The serve moment: chef at the window, bell rung, coins in.
    game.elapsed = 74; // shift timer reads 1:46
    game.score = 1560;
    game.coins = 172;
    game.streak = 6;
    game.bestStreak = 6;
    game.hearts = 3;
    ord.tickets = [
      ticket(9, 'cheesy', 41),
      ticket(10, 'garden', 55),
      ticket(11, 'double', 29),
    ];
    ord.served = 6;
    st.grill[0] = { item: 'patty', progress: 6.0, state: 'done' };
    st.grill[1] = { item: null, progress: 0, state: 'empty' };
    st.board[0] = { item: 'onion', progress: 1.4, state: 'chopping' };
    st.board[1] = { item: null, progress: 0, state: 'empty' };
    st.plates[0] = { items: ['bun', 'patty', 'tomato_chopped'] };
    st.plates[1] = { items: ['bun'] };
    st.plates[2] = { items: [] };
    game.chef.x = 1140;
    game.chef.y = 330;
    game.chef.carrying = null;
    game.popups = [
      { x: 960, y: 150, text: 'SERVED! +340', color: '#7be382', life: 1.6, max: 1.6 },
      { x: 960, y: 180, text: '+34 coins · streak 6', color: '#ffd166', life: 1.6, max: 1.6 },
    ];
    game.flash = 0.25;
    return;
  }

  // Unknown shot name: plain mid-game frame.
  game.elapsed = 30;
  ord.tickets = [ticket(1, 'sunny', 55), ticket(2, 'cheesy', 40)];
}
