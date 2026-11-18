# CLAUDE.md — working on The Complete Day

Context for Claude Code sessions. Read README.md for what the app does; this file covers how to
change it without breaking its rules.

## Layout and workflow

- `src/app.template.html` — the entire app (HTML + CSS + vanilla JS, no framework, no build deps).
- `data/foods.json` — the database: `order` (32 nutrient keys), `meta` (labels/units/notes),
  `foods` (each: `k` key, `name`, `cat`, `cls` plant|dairy|egg|fish|meat, `serv` grams per
  serving, `sl` serving label, `tags` space-separated, `raw` 0|1, `n` values in `order`, per
  100 g), `dri` targets by `sex:age`, `ul` upper limits, `softUl` advisory limits.
- `index.html` — generated. Never edit it by hand; edit src/ or data/ and rebuild. Commit it
  (it is what users open and what GitHub Pages would serve).

After any change:
```
python3 scripts/validate.py && python3 build.py && node tests/smoke.js
```
The smoke test needs Playwright (CI installs it; see `.github/workflows/ci.yml`). Calories count
toward the 28, as in the builder. Expected results at 14 foods: 28/28 at ~101–102% kcal for every
pattern except carnivore (~17, no route to fiber or vitamin C) and raw (26, choline is tight);
vegan with the "fortified" exclusion gets 27 (B12). Any `OVER` line, or calories above 105%, fails.

## Data rules (do not relax these)

- Values are per 100 g of the food *as named* ("cooked" means cooked values, not raw ones).
- Reference: USDA FoodData Central, SR Legacy first; iodine from the USDA/FDA/ODS Iodine Database;
  fortified products from their Nutrition Facts panel (convert %DV using the 2016 FDA DVs).
- **Unknown trace nutrients = 0, never guessed.** Under-crediting is the safe direction.
- **Sodium is always filled in** (it is a ceiling; a blank would err unsafely).
- Units: vitamin A mcg RAE (not IU), D mcg (40 IU = 1 mcg), E mg alpha-tocopherol,
  folate mcg DFE, K1K2 = vitamin K1 + K2 combined, EPADHA/LA/ALA in grams.
- Every food must pass `scripts/validate.py` (Atwater energy cross-check, fiber ≤ carb, no
  fiber in animal foods, no B12 in unfortified plants).
- Tags drive diet rules and exclusions: dairy egg gluten peanut treenut soy fish shellfish sesame
  nightshade legume grain redmeat organ addedsugar fortified. Coconut is tagged treenut (FDA).
  Anything fortified or enriched gets `fortified`.
- Potent foods get a serving cap in `MAXSERV` in the template (livers, salt, spices, oils…).
- When adding foods, cite where the numbers came from in the commit message. When checking data,
  follow `data/audit/REVIEW_INSTRUCTIONS.md`.

## App conventions

- Amounts are stored in **grams** in the plan object; the builder displays and edits **servings**
  (decimals allowed). The plan object's key order is the display order (drag to reorder).
- Meals live in a separate `meals` map (food key -> index into `MEALS`); a food sits in one meal.
  `fillMeals` guesses a meal for any food without one, so plans from the solver or older saved
  days need no meal data. Drag and arrow keys both edit a token list (`mealTokens`/`applyTokens`).
- Your own foods (`custom: true`, keys `c-…`) live in `localStorage` key `completeday-foods` and are
  merged into `FOODS`/`BY` at startup. Their names pass through `cleanText` (no markup characters),
  since food names are interpolated into HTML everywhere. Any plan loaded from storage goes
  through `knownOnly`, because it may name a custom food this browser doesn't have.
- 28 targets = 27 counted nutrients + calories. Informational only (never a gap): EPA+DHA, fat,
  carb, sodium. Manganese's UL is advisory. The vitamin A UL counts preformed A only.
- The current day, profile and chip settings persist in `localStorage` (key `completeday`).
  Saved days use the `window.claude` db when hosted as a claude.ai artifact; standalone they go
  in the same `localStorage` entry (`saved`, ids prefixed `local-`). Saved-day names are user
  input (and shared across viewers in the artifact db): always render them through `esc()`.
- Keep it one self-contained file: no external scripts; Google Fonts is the only external request.
- Light and dark themes are CSS custom properties on `:root`; keep both working, and keep the
  layout usable at 390 px wide with no horizontal scroll.

## Open tasks (good starting points)

1. The "ordinary" bias + raw pattern overshoots calcium (and calories) in the main solve loop.
2. Top-up picks the most energy-dense ordinary staple; it could choose by nutrient fit instead.

The app is published with GitHub Pages from `main` (https://toneyzhen.github.io/the-complete-day/),
so every push to `main` goes live; commit a rebuilt `index.html` with every src/data change.

## Working with Toney (the owner)

- When he asks a question ("K1 vs K2?", "should I add soy milk?"), answer it. Don't change the app
  unless he asks for a change.
- "Don't update the app, just show me the table" means compute offline and report; no edits.
- He prefers concise answers and real numbers over hedging. Flag data uncertainty plainly.
- This is a public repo: never commit personal details (email addresses, his personal diet plan).
  Commits use his GitHub no-reply address and carry a `Co-Authored-By: Claude` trailer.
- Not medical advice; keep the disclaimer in the README and footer.
