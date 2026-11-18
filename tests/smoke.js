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
  await browser.close();
  if (errors.length){ console.error(errors); process.exit(1); }
})();
