# Nutrition data audit — instructions for each reviewer

You are checking one batch of a hand-entered whole-food nutrient database used by a diet-planning
web app. Each food lists 32 values **per 100 g of the food in the preparation named** (e.g. "Lentils,
cooked" = boiled, no salt). Your job is to find values that are wrong, not to re-enter everything.

## Reference standard
- USDA FoodData Central, SR Legacy first (Foundation or FNDDS where SR Legacy has no entry).
  Iodine: the USDA/FDA/ODS Iodine Database (2020+). Choline: USDA choline values.
  Vitamin K for animal foods/natto/cheese may include K2 (menaquinones) from published analyses.
- Mirrors of USDA data that you can fetch and search are fine (nutritionvalue.org, myfooddata.com,
  fdc.nal.usda.gov pages if they load). Use WebSearch / WebFetch to check anything you are not sure of.
  Do NOT use curl/wget/python to fetch web pages. If a page cannot be fetched, use another source or your knowledge.
- Brand-to-brand and cultivar variation of ±20% is normal. Do not flag differences inside that band.

## Conventions in this database (these are deliberate, not errors)
- **Unknown trace nutrients are recorded as 0** on purpose (under-crediting is the safe direction).
  Only report a 0 as "missing" when the food is a *meaningful* source: a normal serving would give
  ≥10% of an adult's DRI. Never report missing iodine/molybdenum/choline for foods where USDA has no value.
- Sodium is always filled; flag sodium errors at any size (it is a ceiling the app warns on).
- Vitamin A = mcg RAE (not IU). Vitamin D = mcg (not IU; 40 IU = 1 mcg). Vitamin E = mg alpha-tocopherol.
  Folate = mcg DFE (for enriched grain products DFE = food folate + 1.7 × folic acid).
  K1K2 = vitamin K1 + K2 combined, mcg. EPADHA = EPA + DHA in grams. LA/ALA in grams.
- Fiber is only in plants; B12 only in animal foods (plus tempeh/miso traces).

## What to report
Go through **every food and every value**. Report a finding when:
- **high**: off by ≥2× or a unit error (IU vs mcg, mg vs mcg, per serving instead of per 100 g), wrong
  preparation basis (raw values for a cooked item), or any error ≥25% in a nutrient that the app treats
  as scarce or capped: B12, D, iodine, choline, A, Se, Cu, Zn, Fe, Ca, Na, EPA+DHA.
- **medium**: 25–100% off in any other nutrient, or kcal/protein/fat/carb/fiber off by >15%.
- **low**: a missing value (0) where the food is a meaningful source as defined above.
Also note (as nutrient "meta") a clearly wrong serving size, category, or allergen tag
(tags used: dairy egg gluten peanut treenut soy fish shellfish sesame nightshade legume grain redmeat organ addedsugar).

Do not report anything you cannot back up. If you are unsure whether the current value or yours is right,
either verify it with a search or leave it out. Prefer fewer, solid findings over many guesses.

## Output
Write a JSON array to the output path you were given (and nothing else in that file):
```json
[{"k":"lentil","name":"Lentils, cooked","nutrient":"Fe","current":3.3,"proposed":3.33,
  "severity":"medium","basis":"USDA SR Legacy 16070 Lentils, mature seeds, cooked, boiled, without salt: Fe 3.33 mg"}]
```
`nutrient` must be one of the 32 keys in the batch header (or "meta"). `proposed` is the per-100 g value
in the database's units. `basis` names the source entry and the figure, or the search that confirmed it.
Write `[]` if you find nothing. Then reply with a 3–6 line summary: foods checked, findings by severity,
and anything systematic you noticed (e.g. "all cooked fish used raw values").
