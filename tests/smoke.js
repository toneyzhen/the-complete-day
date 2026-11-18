// Smoke test: loads index.html in headless Chromium and runs the solver for every diet pattern.
// Needs Playwright:  npm i -D playwright && npx playwright install chromium
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
          const e = evaluate(p, diet);
          if (e.over.length) out.push(`${sex} ${age} ${kcal} kcal, ${style}, ${maxFoods} foods, ${diet}: ${e.over}`);
        }
    }
    return out;
  }, DIETS);
  console.log(`upper-limit sweep: ${breaches.length} breaches`);
  breaches.forEach(b => errors.push('OVER ' + b));
  await browser.close();
  if (errors.length){ console.error(errors); process.exit(1); }
})();
