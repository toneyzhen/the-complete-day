# The Complete Day

A single-page planner for building a day of food that meets the US Dietary Reference Intakes —
all 28 targets — and seeing exactly where each nutrient comes from.

**Use it:** https://toneyzhen.github.io/the-complete-day/ — or open `index.html` in a browser.
No install, no server, no account.

## What it does

**Build a day.** Search 483 foods, add them by the serving (decimals allowed — 0.5 serving,
1.25 servings), and drag to reorder. The day is split into breakfast, lunch, dinner and snacks,
with calories per meal; drag a food (or use the arrow keys) to move it between meals. The same
food can appear in more than one meal: pick the meal next to the search box and add it again. A coverage
panel shows every target as a bar, with gaps and upper-limit breaches highlighted.

**Nutrient explainers.** The **i** beside each nutrient explains what it does and why it
matters, lists which foods in your day supply it (amount and share), and offers the richest
servings you could add, one tap each.

**Auto-solve.** Pick a pattern and a food limit and the solver builds a complete day:

- Base: anything, pescatarian, vegetarian, vegan
- Macro patterns: keto (≤30 g net carb), low-carb (≤100 g), high-protein (≥25% kcal),
  paleo, Whole30, Mediterranean, carnivore, raw
- Exclusions that stack with any pattern: dairy, eggs, gluten, peanuts, tree nuts, soy, fish,
  shellfish, sesame, nightshades, fortified foods
- Biases: balanced, fewest foods, least food weight, ordinary groceries

It picks foods greedily by how much of the remaining gap one serving of each closes, weighting
nutrients by how few foods in the allowed pool supply them, then tunes portions — while
respecting upper limits (preformed vitamin A, selenium, zinc, calcium, iron, sodium and others).
Portions stay realistic: at most about two servings of any one food (less for potent foods like
liver or spices) and at most two meat or fish mains a day, one for lunch and one for dinner
(carnivore excepted). Under a carb cap it avoids spending the whole budget on one food.

Once the nutrients are covered it tops calories up to your target, spreading the extra across
the foods already in the day (trimming an iron- or calcium-heavy portion to make room if a limit
is close), adding an ordinary staple, or as a last resort a cooking fat. If the day runs over,
it trims whatever portion costs no nutrient, then tries swapping a food for a leaner one that
covers the same nutrients. Portions are rounded to 5 g (0.5 g for salt, spices and the like)
without crossing an upper limit. The result is split into meals.

**Food ranking.** Rank every food by any nutrient, per serving, per 100 g or per 100 kcal.

**Your own foods.** Copy a Nutrition Facts label (per serving, as printed) and the app converts
it to per 100 g. Blank nutrients count as zero, like the built-in data; calories and sodium are
required. Say what it contains (plants only, dairy, egg, fish, meat) and tick allergens so diet
patterns and exclusions treat it correctly. Paleo, Whole30, Mediterranean and raw leave your foods
out, since the label doesn't say whether it has grain, legumes, added sugar or red meat. Your
foods are kept in this browser only.

**Saved days.** Stored in the artifact's shared database when the app runs as a claude.ai
artifact. Opened standalone (including GitHub Pages), the current day and saved days are kept
in this browser's `localStorage`.

**Share links and backups.** "Share link" puts the current day, with its meals and any of your
own foods it uses, into the link itself (after the `#`, which browsers never send to a server),
so nothing is uploaded. Opening a link asks before it replaces your day. "Download backup" saves
your saved days and your own foods to a file; "Restore from file" adds them back, on this or
another device, without replacing anything. Links and files are treated as untrusted input.

## Targets

The RDA where one exists, otherwise the Adequate Intake, for the selected sex and age band.
Calories are set by you. Some deliberate choices:

- **Vitamin K** counts K1 and K2 together (both are cofactors for the same enzyme).
- **Sodium** is a ceiling (2,300 mg), never a gap.
- **EPA + DHA**, fat and carbohydrate are shown for information; they have no DRI.
- **Manganese's** 11 mg upper limit is shown but not enforced.
- The vitamin A upper limit applies to preformed A only, not plant carotenoids.

## The data

`data/foods.json` holds 483 foods with 32 values each, per 100 g of the food as named
(e.g. "Lentils, cooked" means boiled, unsalted).

- **Sources:** USDA FoodData Central (SR Legacy first) for whole foods; the USDA/FDA/ODS
  Iodine Database for iodine; the Japanese Standard Tables of Food Composition for toasted
  nori; product Nutrition Facts panels for fortified drinks (one widely sold US product
  each, so check your own carton).
- **Unknown trace values are recorded as 0**, not guessed. The app under-credits rather than
  over-credits, so a day that clears every target has margin in hand.
- **Sodium is the exception**: it is filled in for every food, because a blank there would err
  in the unsafe direction.
- **Fortified foods are tagged `fortified`** and can be excluded with one chip.

### How the data was checked

1. Every food passes `scripts/validate.py`: the energy cross-check (Atwater), fiber ≤ carbohydrate,
   no fiber in animal foods, no B12 in unfortified plants, no negatives, no duplicate keys.
2. A full audit: eight reviewer agents each checked a batch against USDA values using the rules
   in [`data/audit/REVIEW_INSTRUCTIONS.md`](data/audit/REVIEW_INSTRUCTIONS.md). Their raw findings
   are in `data/audit/findings/`. Each finding was then reviewed by hand, and a second sourced pass
   settled the disputed rows (`verify2.json`). 25 of 44 findings were accepted, changing 99 values.
   Several reviewers couldn't reach the USDA mirror sites and worked partly from memory, so "no
   finding" means nothing looked wrong rather than that every value was confirmed.

Real foods vary by cultivar, soil, brand and cooking by more than a few percent. Treat 100% as a
soft floor, not a finish line.

## Development

```
python3 scripts/validate.py     # check the data
python3 build.py                # write index.html from src/ + data/
node tests/smoke.js             # solve every diet pattern in headless Chromium (needs Playwright)
```

GitHub Actions runs all three on every push and pull request, and fails if the committed
`index.html` doesn't match a fresh build.

- `src/app.template.html` is the whole app (HTML, CSS, JS). The `/*__DATA__*/` placeholder is
  replaced with the contents of `data/foods.json` at build time, so `index.html` is fully
  self-contained.
- `index.html` is committed so the app runs straight from the repo or from GitHub Pages.

## Known issues

- With realistic portions, a complete day usually needs 9–13 foods; with a food limit of 7 or
  fewer it rarely closes every target, and calories can stay under target.
- A few days still can't meet every nutrient within the calorie target from the allowed foods,
  mostly at low targets (1,400–1,600 kcal). About 2% of a 2,880-day test sweep lands above 105%.
- Raw reaches 24/28: its small food pool fills calcium early, which blocks the best sources of
  fiber, vitamin A and choline.
- A saved day that uses one of your own foods loses that food when opened in another browser,
  unless it arrives through a share link or a backup file.

## Contributors

- **Toney Zhen** ([@toneyzhen](https://github.com/toneyzhen)): the idea, product direction,
  feature requests, testing against a real diet.
- **Claude** (Anthropic): app code, solver, food database entry, data audit, documentation.

## Disclaimer

This is an arithmetic tool, not medical or dietary advice. Talk to a clinician or registered
dietitian before making significant changes, especially if you are pregnant, managing a medical
condition, or taking medication (vitamin K and warfarin, for example).
