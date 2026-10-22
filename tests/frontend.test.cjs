const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

function harness(options = {}) {
    const elements = new Map();
    const timers = new Map();
    const callbacks = [];
    let nextTimer = 0;
    class Element {
        constructor() {
            this.style = {};
            this.children = [];
            this.events = {};
            this.attributes = {};
            this.value = '';
            this.classList = { add() {}, remove() {}, toggle() {} };
            this.isConnected = true;
        }
        addEventListener(name, callback) { this.events[name] = callback; }
        removeEventListener(name) { delete this.events[name]; }
        appendChild(child) { this.children.push(child); return child; }
        setAttribute(name, value) { this.attributes[name] = value; }
        querySelector() { return null; }
        querySelectorAll() { return []; }
        contains(element) { return this.children.includes(element); }
        focus() { context.document.activeElement = this; }
        remove() { this.isConnected = false; }
        getClientRects() { return [{}]; }
    }
    const context = vm.createContext({
        console: { log() {}, warn() {}, error() {} },
        AbortController,
        fetch: options.fetch || (() => { throw new Error('Unexpected network request'); }),
        localStorage: options.storage || { getItem() { return null; }, setItem() {} },
        setTimeout(fn) { const id = ++nextTimer; timers.set(id, fn); return id; },
        clearTimeout(id) { timers.delete(id); },
        setInterval(fn) { const id = ++nextTimer; timers.set(id, fn); return id; },
        clearInterval(id) { timers.delete(id); },
        document: {
            body: new Element(),
            activeElement: null,
            addEventListener(name, callback) { if (name === 'DOMContentLoaded') callbacks.push(callback); },
            getElementById(id) { if (!elements.has(id)) elements.set(id, new Element()); return elements.get(id); },
            querySelector() { return null; },
            querySelectorAll() { return []; },
            createElement() { return new Element(); },
            createTextNode(text) { return { textContent: text }; }
        }
    });
    context.window = context;
    function load(file) { vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file }); }
    load('core.js');
    if (options.live) vm.runInContext("const ATC_CONFIG = { mode: 'live', apiEndpoint: 'https://example.test/atc', requestTimeoutMs: 20 };", context);
    else load('config.js');
    load('scenarios-config.js');
    load('app.js');
    const app = vm.runInContext('new ATCTrainingApp()', context);
    app.currentView = 'training';
    app.currentCategory = 'pattern_work';
    app.currentScenario = 'pattern_work';
    app.currentScenarioId = 'pattern_first_solo';
    app.messages = [];
    app.addMessage = (sender, text) => app.messages.push({ sender, text });
    return { context, app, elements, timers, callbacks, load, evaluate: source => vm.runInContext(source, context) };
}

function flushTimers(h) {
    const callbacks = [...h.timers.values()];
    h.timers.clear();
    callbacks.forEach(callback => callback());
}

test('public configuration is offline and transmissions never call the live API', async () => {
    let requests = 0;
    const h = harness({ fetch() { requests++; } });
    h.app.handlePilotTransmission('Metro Tower, Cessna 12345, ready for departure runway 27');
    assert.equal(h.app.isWaitingForResponse, true);
    h.app.handlePilotTransmission('Duplicate transmission');
    assert.equal(h.app.conversationHistory.length, 1);
    flushTimers(h);
    assert.equal(requests, 0);
    assert.equal(h.app.conversationHistory.length, 2);
    assert.equal(h.app.isWaitingForResponse, false);
    assert.match(h.app.messages[1].text, /cleared for takeoff/);
});

test('leaving a scenario cancels pending demo replies and unlocks transmit', () => {
    const h = harness();
    h.app.handlePilotTransmission('Cessna 12345, ready for departure');
    const oldCallback = [...h.timers.values()][0];
    h.app.cancelPendingResponse();
    h.app.conversationHistory = [];
    oldCallback(); // A callback that was already queued must also be harmless.
    assert.equal(h.app.conversationHistory.length, 0);
    assert.equal(h.app.isWaitingForResponse, false);
    assert.equal(h.elements.get('transmitButton').disabled, false);
});

test('switching between the guided lesson and scenarios cancels the previous session', () => {
    const h = harness();
    h.app.handlePilotTransmission('Cessna 12345, ready for departure');
    const staleReply = [...h.timers.values()][0];
    h.app.showView('departure');
    staleReply();
    assert.equal(h.app.messages.filter(message => message.sender === 'atc').length, 0);
    assert.equal(h.app.isWaitingForResponse, false);
    let stopped = 0;
    h.context.WilcoDeparture = { stop() { stopped++; } };
    h.app.goBack();
    assert.equal(stopped, 1);
    assert.equal(h.app.currentView, 'categories');
});

test('late live responses cannot enter a new session', async () => {
    let resolve;
    const h = harness({ live: true, fetch: () => new Promise(done => { resolve = done; }) });
    h.app.conversationHistory.push({ role: 'user', content: 'Old request' });
    const pending = h.app.sendToATC('Old request');
    h.app.cancelPendingResponse();
    h.app.conversationHistory = [];
    resolve({ ok: true, json: async () => ({ success: true, atc_response: 'Old reply' }) });
    await pending;
    assert.equal(h.app.conversationHistory.length, 0);
    assert.equal(h.app.messages.length, 0);
    assert.equal(h.timers.size, 0);
});

test('live history excludes current transmission and timers clear on completion', async () => {
    let payload;
    const h = harness({ live: true, fetch: async (_url, options) => {
        payload = JSON.parse(options.body);
        return { ok: true, json: async () => ({ success: true, atc_response: 'Cessna 12345, roger.' }) };
    } });
    h.app.conversationHistory = [
        { role: 'user', content: 'Earlier call' },
        { role: 'assistant', content: 'Earlier response' },
        { role: 'user', content: 'Current call' }
    ];
    await h.app.sendToATC('Current call');
    assert.equal(payload.message, 'Current call');
    assert.deepEqual(payload.history.map(message => message.content), ['Earlier call', 'Earlier response']);
    assert.equal(h.app.requestController, null);
    assert.equal(h.app.isWaitingForResponse, false);
    assert.equal(h.timers.size, 1); // Only the short receiving-indicator timer remains.
});

test('malformed live responses fall back with an explicit offline label', async () => {
    const h = harness({ live: true, fetch: async () => ({ ok: true, json: async () => ({ success: true, atc_response: {} }) }) });
    await h.app.sendToATC('Cessna 12345, ready for departure');
    assert.match(h.app.messages[0].text, /offline scripted demo/);
    flushTimers(h);
    assert.match(h.app.messages[1].text, /cleared for takeoff/);
    assert.equal(h.app.isWaitingForResponse, false);
});

test('feedback evaluates readback against the previous controller instruction', () => {
    const h = harness();
    let instruction;
    h.app.lastATCMessage = 'Cessna 12345, hold short runway 27.';
    h.app.conversationHistory = [{ role: 'user', content: 'Hold short runway 27, Cessna 12345' }];
    h.app.feedbackEngine = {
        processFeedback(_pilot, atc) { instruction = atc; return {}; },
        displayFeedback() {},
        suggestDifficultyAdjustment() { return null; }
    };
    h.app.handleATCResponse('Cessna 12345, contact tower 118.3.');
    assert.equal(instruction, 'Cessna 12345, hold short runway 27.');
});

test('invalid or unavailable persisted storage never prevents startup', () => {
    for (const value of ['null', '[]', '{"difficulty":"bad","totalSessions":-1,"totalTransmissions":"oops"}', '{']) {
        const h = harness({ storage: { getItem() { return value; }, setItem() {} } });
        assert.equal(h.evaluate('new SettingsManager().get("difficulty")'), 'beginner');
        assert.equal(h.evaluate('new ProgressManager().getStatistics().totalSessions'), 0);
        assert.equal(h.evaluate('new ProgressManager().getStatistics().totalTransmissions'), 0);
    }
    const h = harness({ storage: { getItem() { throw new Error('Blocked'); }, setItem() { throw new Error('Blocked'); } } });
    assert.doesNotThrow(() => h.evaluate('new ProgressManager().incrementSessions()'));
    h.load('demo-data.js');
    h.load('demo-onboarding.js');
    const welcome = h.evaluate('new WelcomeFlow()');
    welcome.createModal = () => {};
    welcome.showStep = () => {};
    assert.doesNotThrow(() => welcome.show());
    assert.doesNotThrow(() => welcome.complete());
});

test('scripted replies preserve callsigns and prioritize emergency requests', () => {
    const h = harness();
    assert.match(h.app.getDemoResponse('Metro Tower, ready for departure runway 27'), /^Cessna 12345,/);
    assert.match(h.app.getDemoResponse('Mayday Cessna 12345, engine failure, short final'), /persons on board/);
    h.app.currentScenario = 'ground_operations';
    assert.match(h.app.getDemoResponse('Cessna 12345, taxi via Alpha, hold short runway 27'), /roger/);
});

test('demo and help globals initialize when the DOM is ready', () => {
    const h = harness();
    h.load('demo-data.js');
    h.load('demo-onboarding.js');
    h.callbacks.forEach(callback => callback());
    assert.equal(typeof h.context.demoPlayer.showSelector, 'function');
    assert.equal(typeof h.context.helpGuide.show, 'function');
});

test('Try This Scenario preserves the demo selection through close', () => {
    const h = harness();
    h.load('demo-data.js');
    h.load('demo-onboarding.js');
    const demo = h.evaluate('new DemoPlayer()');
    demo.currentDemo = h.evaluate('DEMO_CONVERSATIONS.ground_ops_demo');
    let started;
    h.context.atcApp = { startScenario(category, scenario) { started = { category, id: scenario.id }; } };
    demo.tryScenario();
    assert.deepEqual(started, { category: 'ground_operations', id: 'ground_first_taxi' });
    assert.equal(demo.currentDemo, null);
});

test('returning to demo selection cancels autoplay', () => {
    const h = harness();
    h.load('demo-data.js');
    h.load('demo-onboarding.js');
    const demo = h.evaluate('new DemoPlayer()');
    demo.currentDemo = h.evaluate('DEMO_CONVERSATIONS.pattern_work_demo');
    demo.createSelectorModal = () => {};
    demo.autoPlay = true;
    demo.startAutoPlay();
    demo.showSelector();
    assert.equal(demo.autoPlay, false);
    assert.equal(demo.autoPlayInterval, null);
    assert.equal(h.timers.size, 0);
});

test('oversized input is rejected without losing the draft', () => {
    const h = harness();
    h.elements.get('pilotInput').value = 'a'.repeat(1001);
    h.app.handleTextTransmission();
    assert.equal(h.app.messages.length, 0);
    assert.equal(h.elements.get('pilotInput').value.length, 1001);
    assert.match(h.elements.get('status').textContent, /1,000/);
});
