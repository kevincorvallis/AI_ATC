// Browser integration: PLAYWRIGHT_MODULE=/existing/playwright node tests/lesson.browser.cjs [url]
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const baseURL = process.argv[2] || 'http://127.0.0.1:8000/';
const output = path.resolve(__dirname, '../test-results/departure');
fs.mkdirSync(output, { recursive: true });
const answers = [
  'Metro Ground, Cessna one two three four five, east ramp, VFR westbound, with information Alpha',
  'Runway two seven via Alpha, hold short runway two seven, Cessna one two three four five',
  'Tower one one eight point three, Cessna one two three four five',
  'Metro Tower, Cessna one two three four five, holding short runway two seven, ready for departure westbound',
  'Hold short runway two seven, Cessna one two three four five',
  'Cleared for takeoff runway two seven, Cessna one two three four five'
];
async function installSpeech(page, blockedStorage) {
  await page.addInitScript(({ blockedStorage }) => {
    if (blockedStorage) {
      Storage.prototype.getItem = Storage.prototype.setItem = () => { throw new DOMException('Blocked', 'SecurityError'); };
    }
    window.speechTest = { starts: 0, aborts: 0, plays: [], instances: [] };
    class Recognition {
      constructor() { speechTest.instances.push(this); }
      start() { speechTest.starts++; this.onstart?.(); }
      stop() { this.onend?.(); }
      abort() { speechTest.aborts++; this.onend?.(); }
    }
    window.SpeechRecognition = Recognition;
    window.webkitSpeechRecognition = Recognition;
    window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
      getVoices: () => [], cancel() {},
      speak(utterance) { speechTest.plays.push(utterance.text); utterance.onstart?.(); utterance.onend?.(); }
    }});
  }, { blockedStorage });
}
async function submit(page, answer) {
  await page.locator('#departureInput').fill(answer);
  await page.locator('#departureTransmit').click();
}
async function verify(browserType, options, blockedStorage = false) {
  const browser = await browserType.launch({ headless: true, ...options });
  const label = `${browserType.name()}-${blockedStorage ? 'blocked-storage' : 'normal'}`;
  try {
    const page = await browser.newPage({ viewport: { width: browserType === webkit ? 390 : 1280, height: 900 }, reducedMotion: 'reduce' });
    const errors = [], paidRequests = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (/execute-api|api\.openai\.com/.test(request.url())) paidRequests.push(request.url()); });
    await installSpeech(page, blockedStorage);
    await page.goto(baseURL);
    await page.screenshot({ path: path.join(output, `${label}-home.png`), fullPage: true });
    await page.locator('#startDepartureLesson').click();
    assert.equal(await page.evaluate(() => speechTest.starts), 0);
    assert.match(await page.locator('.departure-guidance-label').innerText(), /example/);
    await page.locator('#departureRecord').click();
    assert.equal(await page.evaluate(() => speechTest.starts), 0, 'Consent must precede microphone');
    await page.getByRole('button', { name: 'Enable microphone', exact: true }).click();
    assert.equal(await page.evaluate(() => speechTest.starts), 1);
    assert.equal(await page.locator('#departureTransmit').isDisabled(), true);
    await page.evaluate(() => {
      const recognition = speechTest.instances.at(-1);
      const result = [{ transcript: 'Editable draft from speech' }]; result.isFinal = true;
      recognition.onresult?.({ resultIndex: 0, results: [result] });
      recognition.onend?.();
    });
    assert.equal(await page.locator('#departureInput').inputValue(), 'Editable draft from speech');
    assert.equal(await page.locator('#departureContinue').count(), 0, 'Voice must not send');
    await submit(page, answers[0]);
    await page.locator('#departureContinue').click();
    // Explicit repeat neither fails the exchange nor advances it.
    await submit(page, 'Say again');
    assert.equal(await page.locator('#departureContinue').count(), 0);
    await submit(page, 'Runway zero nine via Alpha, Cessna one two three four five');
    assert.equal(await page.locator('#departureContinue').count(), 0);
    assert.match(await page.locator('[data-departure-feedback]').innerText(), /runway|hold short/i);
    await page.screenshot({ path: path.join(output, `${label}-correction.png`), fullPage: true });
    await submit(page, answers[1]);
    await page.locator('#departureContinue').click();
    assert.match(await page.locator('.departure-guidance-label').innerText(), /hint/);
    // Permission denial recovers to an editable typed draft.
    await page.locator('#departureRecord').click();
    await page.evaluate(() => speechTest.instances.at(-1).onerror?.({ error: 'not-allowed' }));
    assert.equal(await page.locator('#departureTransmit').isEnabled(), true);
    assert.match(await page.locator('[data-voice-message]').innerText(), /permission|microphone|type/i);
    for (let index = 2; index < 6; index++) {
      if (index === 4) assert.match(await page.locator('.departure-guidance-label').innerText(), /independently/);
      await submit(page, answers[index]);
      await page.locator('#departureContinue').click();
    }
    await page.locator('.departure-debrief').waitFor();
    assert.match(await page.locator('.departure-results').innerText(), /6 of 6/);
    const summary = await page.evaluate(() => window.WilcoDeparture.lastSummary);
    assert.equal(summary.firstTry, 5);
    assert.equal(summary.attempts, 7);
    assert.equal(summary.repeats, 1);
    assert.ok(summary.missedSkills.length);
    assert.ok(summary.retryStepIds.includes('taxi-readback'));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: path.join(output, `${label}-debrief.png`), fullPage: true });
    if (!blockedStorage) {
      const stored = await page.evaluate(() => localStorage.getItem('wilco_departure_progress'));
      assert.ok(stored);
      for (const answer of answers) assert.equal(stored.includes(answer), false);
      assert.equal(stored.includes('Editable draft'), false);
    }
    await page.locator('#departureRetryMissed').click();
    assert.match(await page.locator('.departure-guidance-label').innerText(), /independently/);
    assert.equal(await page.locator('.departure-progress-step').count(), summary.retryStepIds.length);
    await page.locator('#departureRecord').click();
    const old = await page.evaluate(() => speechTest.instances.length - 1);
    await page.locator('#departureExit').click();
    assert.ok(await page.evaluate(() => speechTest.aborts > 0));
    await page.locator('#startDepartureLesson').click();
    await page.evaluate(index => {
      const result = [{ transcript: 'STALE VOICE MUST NOT APPEAR' }]; result.isFinal = true;
      speechTest.instances[index].onresult?.({ resultIndex: 0, results: [result] });
    }, old);
    assert.equal(await page.locator('#departureInput').inputValue(), '');
    await page.setViewportSize({ width: 320, height: 740 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, '320px overflow');
    await page.locator('#departureExit').click();
    await page.reload();
    if (!blockedStorage) assert.match(await page.locator('#departureRecent').innerText(), /6 of 6/);
    assert.deepEqual(errors, []);
    assert.deepEqual(paidRequests, []);
    return { browser: label, sixExchanges: true, corrections: true, voiceDraftAndDenial: true, staleVoiceIgnored: true, aggregateProgress: true, runtimeErrors: 0 };
  } finally { await browser.close(); }
}
(async () => {
  const results = [];
  for (const blocked of [false, true]) {
    results.push(await verify(chromium, { channel: 'chrome' }, blocked));
    results.push(await verify(webkit, {}, blocked));
  }
  fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify({ baseURL, results }, null, 2) + '\n');
  console.log(JSON.stringify({ baseURL, results }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
