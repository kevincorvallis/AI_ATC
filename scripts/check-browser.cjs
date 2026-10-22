// Optional browser smoke check; use an existing Playwright installation.
// PLAYWRIGHT_MODULE=/path/to/playwright node scripts/check-browser.cjs <base-url>
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const baseURL = process.argv[2] || 'http://127.0.0.1:8000/';
const output = path.resolve(__dirname, '../test-results/browser');
fs.mkdirSync(output, { recursive: true });

async function exercise(browserType, label, viewport, options = {}) {
  const browser = await browserType.launch({ headless: true, ...options });
  try {
    const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
    const errors = [], apiRequests = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => {
      if (/execute-api|api\.openai\.com/.test(request.url())) apiRequests.push(request.url());
    });
    await page.goto(baseURL);
    await page.getByRole('button', { name: /Help/ }).click();
    await page.getByRole('dialog').waitFor();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: /Settings/ }).click();
    await page.locator('#difficultySelect').selectOption('intermediate');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    assert.equal(await page.evaluate(() => window.appCore.settings.get('difficulty')), 'intermediate');

    const categories = await page.locator('.category-card').evaluateAll(cards => cards.map(card => card.dataset.category));
    let scenarios = 0;
    for (const category of categories) {
      await page.locator(`.category-card[data-category="${category}"]`).click();
      const count = await page.locator('.scenario-card').count();
      assert.equal(count, 5);
      for (let index = 0; index < count; index++) {
        await page.locator('.scenario-card').nth(index).click();
        await page.locator('.suggestion-chip').first().click();
        assert.ok((await page.locator('#pilotInput').inputValue()).length > 0);
        await page.locator('#transmitButton').click();
        await page.locator('.atc-message').first().waitFor();
        await page.waitForFunction(() => document.getElementById('status').textContent === 'Ready');
        assert.ok((await page.locator('.atc-message').first().innerText()).length > 10);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${label}: horizontal overflow`);
        if (index === 0) await page.screenshot({ path: path.join(output, `${label}-${category}.png`), fullPage: true });
        scenarios++;
        await page.locator('#backButton').click();
      }
      await page.locator('#backButton').click();
    }
    assert.equal(scenarios, 20);
    // Settings and progress must survive a real reload.
    await page.reload();
    assert.equal(await page.evaluate(() => window.appCore.settings.get('difficulty')), 'intermediate');
    assert.equal(await page.evaluate(() => window.appCore.progress.getStatistics().totalTransmissions), 20);
    assert.deepEqual(apiRequests, [], 'Scripted demo made a paid API request');
    assert.deepEqual(errors, [], 'Browser runtime errors');
    return { browser: label, scenarios, runtimeErrors: errors.length, paidAPIRequests: apiRequests.length };
  } finally { await browser.close(); }
}

(async () => {
  const results = [];
  results.push(await exercise(chromium, 'desktop', { width: 1440, height: 1000 }, { channel: process.env.PW_CHANNEL || 'chrome' }));
  results.push(await exercise(webkit, 'mobile-webkit', { width: 390, height: 844 }));
  fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify({ baseURL, results }, null, 2) + '\n');
  console.log(JSON.stringify({ baseURL, results }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
