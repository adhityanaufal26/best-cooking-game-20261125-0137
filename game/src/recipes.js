// recipes.js — every ingredient and dish in Ember Kitchen.
// Original dishes invented for this game; nothing is borrowed from a
// commercial cooking game.

// An ingredient id maps to its display name, colour, the station that
// prepares it (null = ready straight from its bin) and the item it becomes
// after preparation.
export const INGREDIENTS = {
  bun: { name: 'Bun', color: '#e8a94e', prep: null, bin: 'bun' },
  patty_raw: { name: 'Raw Patty', color: '#d97b7b', prep: 'grill', becomes: 'patty', bin: 'patty' },
  patty: { name: 'Grilled Patty', color: '#7a4a21', prep: null, bin: null },
  lettuce: { name: 'Lettuce', color: '#7cc24a', prep: 'board', becomes: 'lettuce_chopped', bin: 'lettuce' },
  lettuce_chopped: { name: 'Chopped Lettuce', color: '#8fd35a', prep: null, bin: null },
  tomato: { name: 'Tomato', color: '#e23b2e', prep: 'board', becomes: 'tomato_chopped', bin: 'tomato' },
  tomato_chopped: { name: 'Sliced Tomato', color: '#ef6a4a', prep: null, bin: null },
  cheese: { name: 'Cheese', color: '#f7c948', prep: null, bin: 'cheese' },
  onion: { name: 'Onion', color: '#b388d6', prep: 'board', becomes: 'onion_chopped', bin: 'onion' },
  onion_chopped: { name: 'Diced Onion', color: '#c9a6e8', prep: null, bin: null },
  burnt: { name: 'Burnt!', color: '#2b2b2b', prep: null, bin: null },
};

// Items a plate will accept (raw and burnt items are refused).
export const PLATE_ITEMS = new Set([
  'bun', 'patty', 'lettuce_chopped', 'tomato_chopped', 'cheese', 'onion_chopped',
]);

export const RECIPES = [
  {
    id: 'sunny',
    name: 'Sunny Burger',
    items: ['bun', 'patty', 'lettuce_chopped'],
    base: 100,
    weight: 3,
  },
  {
    id: 'cheesy',
    name: 'Cheesy Melt',
    items: ['bun', 'patty', 'cheese'],
    base: 100,
    weight: 3,
  },
  {
    id: 'garden',
    name: 'Garden Stack',
    items: ['bun', 'lettuce_chopped', 'tomato_chopped', 'onion_chopped'],
    base: 140,
    weight: 2,
  },
  {
    id: 'double',
    name: 'Double Trouble',
    items: ['bun', 'patty', 'patty', 'cheese'],
    base: 160,
    weight: 2,
  },
  {
    id: 'sunrise',
    name: 'Sunrise Special',
    items: ['bun', 'patty', 'tomato_chopped', 'cheese'],
    base: 150,
    weight: 2,
  },
];

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id) ?? null;
}

// True when the plate's items are exactly the recipe's items, any order.
export function plateMatchesRecipe(plateItems, recipe) {
  if (plateItems.length !== recipe.items.length) return false;
  const have = [...plateItems].sort();
  const want = [...recipe.items].sort();
  return have.every((item, i) => item === want[i]);
}

// True when every item on the plate belongs to the recipe (plate is a
// prefix of the recipe, so it can still be finished into that dish).
export function plateFitsRecipe(plateItems, recipe) {
  const want = [...recipe.items];
  for (const item of plateItems) {
    const i = want.indexOf(item);
    if (i === -1) return false;
    want.splice(i, 1);
  }
  return true;
}

// Items still missing to turn this plate into the recipe.
export function missingItems(plateItems, recipe) {
  const want = [...recipe.items];
  for (const item of plateItems) {
    const i = want.indexOf(item);
    if (i !== -1) want.splice(i, 1);
  }
  return want;
}
