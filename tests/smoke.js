// Smoke test: loads index.html in headless Chromium and runs the solver for every diet pattern.
// Needs Playwright:  npm i -D playwright@1.48.2 && npx playwright install chromium
// Run:               node tests/smoke.js
const { chromium } = require('playwright');
const path = require('path');
const DIETS = ["anything","pescatarian","vegetarian","vegan","paleo","whole30","mediterranean",
               "keto","lowcarb","highprotein","carnivore","raw"];
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
  for (const diet of DIETS) {
    const r = await page.evaluate(diet => {
      const p = solveDay({diet, maxFoods: 14, style: "balanced", seed: null, avoid: new Set()});
      const e = evaluate(p, diet);
      return {met: 28 - e.short.length, short: e.short, over: e.over, foods: Object.keys(p).length,
              kcalPct: Math.round(100 * e.kcal / targets().kcal)};
    }, diet);
    console.log(`${diet.padEnd(14)} ${r.met}/28  foods ${r.foods}  kcal ${r.kcalPct}%` +
      (r.short.length ? `  short: ${r.short.join(', ')}` : '') + (r.over.length ? `  OVER: ${r.over}` : ''));
    if (r.over.length) errors.push(`${diet}: over an upper limit`);
    if (r.kcalPct > 105) errors.push(`${diet}: calories ${r.kcalPct}% of target`);
  }
  // Upper limits are a hard rule for every bias and profile, not just the default one.
  // (female 31-50 + raw once put 5 g of iodized salt in the day; ordinary + raw rounded calcium over)
  const breaches = await page.evaluate(DIETS => {
    const out = [];
    for (const [sex, age, kcal] of [["male", 40, 2500], ["female", 40, 2000], ["female", 75, 1600]]){
      profile = {sex, age, kcal};
      for (const style of ["balanced", "fewest", "light", "ordinary"])
        for (const maxFoods of [14, 7]) for (const diet of DIETS){
          const p = solveDay({diet, maxFoods, style, seed: null, avoid: new Set()});
          const e = evaluate(p, diet), at = `${sex} ${age} ${kcal} kcal, ${style}, ${maxFoods} foods, ${diet}`;
          if (e.over.length) out.push(`OVER ${at}: ${e.over}`);
          // realistic portions: nothing past its serving cap (5 g of rounding allowed), and at
          // most two meat or fish mains outside carnivore
          const big = Object.keys(p).filter(k => p[k] > capOf(k) + 5);
          if (big.length) out.push(`PORTION ${at}: ${big.map(k => `${k} ${p[k]} g`)}`);
          if (diet !== "carnivore" && Object.keys(p).filter(isMain).length > MAX_MAINS) out.push(`MAINS ${at}`);
        }
    }
    return out;
  }, DIETS);
  console.log(`limit/portion sweep: ${breaches.length} problems`);
  breaches.forEach(b => errors.push(b));

  // Your-own-food input is the one place user text reaches food names, which are put into
  // HTML unescaped everywhere; meal moves rewrite plan order and meals together.
  const unit = await page.evaluate(() => {
    const fails = [], ok = (cond, what) => { if (!cond) fails.push(what); };
    const zeros = () => new Array(ORDER.length).fill(0);
    ok(!/[<>"&]/.test(cleanText('Bar<script>alert(1)</script> "x" & <img src=y onerror=z>')),
       "cleanText leaves markup characters");
    ok(normCustom({k: "c-x1", cls: "plant", serv: 10, n: [1, 2]}) === null, "normCustom accepts a short nutrient list");
    ok(normCustom({k: "oats", cls: "plant", serv: 10, n: zeros()}) === null, "normCustom accepts a built-in key");
    ok(normCustom({k: "c-x2", cls: "plant", serv: 0, n: zeros()}) === null, "normCustom accepts a 0 g serving");
    ok(normCustom({k: "c-x3", cls: "alien", serv: 10, n: zeros()}) === null, "normCustom accepts an unknown class");
    const f = normCustom({k: "c-x4", name: "<b>Granola</b>", cls: "plant", serv: 50, tags: "treenut bogus", n: zeros()});
    ok(f && f.name === "Granola" && f.tags === "treenut" && f.custom, "normCustom doesn't clean a valid food");
    const k = knownOnly({oats: 40, nosuchfood: 10, milk: "x", egg: -5});
    ok(JSON.stringify(k) === '{"oats":40}', "knownOnly keeps unknown, non-numeric or negative entries");
    // share links are attacker-controlled: inherited names must not pass, amounts are clamped
    const h = knownOnly(JSON.parse('{"toString":5,"constructor":3,"__proto__":4,"oats":1e9}'));
    ok(JSON.stringify(h) === JSON.stringify({oats: 50 * BY.oats.serv}), "knownOnly lets inherited names or huge amounts through");
    const day = {v: 1, plan: {oats: 40, salmon: 113}, meals: {oats: 0, salmon: 2}, foods: []};
    ok(JSON.stringify(JSON.parse(b64dec(b64enc(JSON.stringify(day))))) === JSON.stringify(day), "share link round trip");
    ok(b64dec(b64enc("Annie’s café")) === "Annie’s café", "share link loses non-ASCII text");
    // moving the first lunch food up one step puts it at the end of breakfast
    plan = {oats: 40, egg: 50, salmon: 113}; meals = {oats: 0, egg: 0, salmon: 1};
    const t = mealTokens(), i = t.indexOf("salmon");
    t.splice(i - 1, 0, t.splice(i, 1)[0]); applyTokens(t);
    ok(meals.salmon === 0 && Object.keys(plan).join() === "oats,egg,salmon", "moving past a meal header");
    // the calorie trim never removes a food the user kept
    profile = {sex: "male", age: 40, kcal: 2500};
    const seed = {oliveoil: 10, butter: 10, walnut: 200, peanut: 200, milk: 244};
    const p = solveDay({diet: "anything", maxFoods: 14, style: "balanced", seed, avoid: new Set()});
    ok(Object.keys(seed).every(s => p[s] > 0), "kept foods removed by the solver");
    return fails;
  });
  console.log(`unit checks: ${unit.length ? unit.join('; ') : 'ok'}`);
  unit.forEach(u => errors.push(u));
  await browser.close();
  if (errors.length){ console.error(errors); process.exit(1); }
})();
