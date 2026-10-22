// Optional real-browser regressions. Reuse an existing Playwright installation:
// PLAYWRIGHT_MODULE=/path/to/playwright node tests/frontend.browser.cjs [base-url]
const assert = require('node:assert/strict');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const baseURL = process.argv[2] || 'http://127.0.0.1:8000/';

async function verify(browserType, options) {
    const browser = await browserType.launch({ headless: true, ...options });
    try {
        for (const blockedStorage of [false, true]) {
            const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            if (blockedStorage) await page.addInitScript(() => {
                Storage.prototype.getItem = () => { throw new DOMException('Storage blocked', 'SecurityError'); };
                Storage.prototype.setItem = () => { throw new DOMException('Storage blocked', 'SecurityError'); };
            });
            await page.goto(baseURL);
            await page.evaluate(() => window.welcomeFlow.show());
            await page.getByRole('dialog', { name: 'Welcome', exact: true }).waitFor();
            assert.equal(await page.evaluate(() => document.activeElement.id), 'welcomeClose');
            await page.keyboard.press('Shift+Tab');
            assert.equal(await page.evaluate(() => document.activeElement.id), 'welcomeNext');
            await page.keyboard.press('Tab');
            assert.equal(await page.evaluate(() => document.activeElement.id), 'welcomeClose');
            await page.keyboard.press('Escape');
            assert.equal(await page.getByRole('dialog').count(), 0);
            assert.equal(await page.locator('.container').evaluate(element => element.inert), false);

            await page.locator('#demoButton').click();
            await page.locator('.demo-card').first().focus();
            await page.keyboard.press('Enter');
            assert.equal(await page.locator('#currentExchangeNum').innerText(), '1');
            await page.locator('#demoAutoPlay').click();
            await page.locator('#demoBackToSelector').click();
            assert.equal(await page.evaluate(() => window.demoPlayer.autoPlayInterval), null);
            await page.locator('.demo-card').first().click();
            for (let index = 0; index < 3; index++) await page.locator('#demoNext').click();
            await page.locator('#demoTryScenario').click();
            assert.equal(await page.evaluate(() => window.atcApp.currentScenarioId), 'pattern_first_solo');
            assert.equal(await page.evaluate(() => document.activeElement.id), 'pilotInput');
            assert.equal(await page.getByRole('dialog').count(), 0);
            await page.locator('.suggestion-chip').first().click();
            await page.keyboard.press('Enter');
            await page.locator('.atc-message').first().waitFor();
            assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.skip-link')).clipPath), 'inset(50%)');

            await page.locator('#settingsButton').click();
            assert.equal(await page.evaluate(() => document.activeElement.id), 'closeSettings');
            await page.keyboard.press('Shift+Tab');
            assert.equal(await page.evaluate(() => document.activeElement.id), 'saveSettings');
            await page.keyboard.press('Tab');
            assert.equal(await page.evaluate(() => document.activeElement.id), 'closeSettings');
            await page.keyboard.press('Escape');
            assert.equal(await page.evaluate(() => document.activeElement.id), 'settingsButton');
            await page.locator('#helpButton').click();
            await page.getByRole('button', { name: 'Phraseology Tips', exact: true }).click();
            await page.keyboard.press('Escape');
            assert.equal(await page.evaluate(() => document.activeElement.id), 'helpButton');
            await page.locator('#backButton').click();
            await page.locator('#backButton').click();
            await page.locator('.category-card').first().focus();
            await page.keyboard.press('Enter');
            assert.equal(await page.locator('.scenario-card').count(), 5);
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
            assert.deepEqual(errors, []);
            console.log(`${browserType.name()} storage=${blockedStorage ? 'blocked' : 'available'}: modal focus, keyboard, demo launch, autoplay cleanup passed`);
            await page.close();
        }
    } finally { await browser.close(); }
}
(async () => {
    await verify(chromium, { channel: 'chrome' });
    await verify(webkit, {});
})().catch(error => { console.error(error); process.exitCode = 1; });
