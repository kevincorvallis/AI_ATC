const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function training() {
    const context = { window: {}, document: { getElementById: () => null } };
    vm.createContext(context);
    for (const file of ['phraseology.js', 'scenario-state.js', 'feedback-engine.js', 'aviation-visual.js']) {
        vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
    }
    return context.window;
}

test('wrong runway cannot pass using digits in the aircraft callsign', () => {
    const { phraseologyValidator: validator } = training();
    const context = { lastATCMessage: 'Cessna 2701, runway 27 cleared for takeoff' };
    const wrong = validator.validateTransmission('Cleared for takeoff runway 09, Cessna 2701', context);
    assert.equal(wrong.valid, false);
    assert.ok(wrong.criticalIssues.some(issue => issue.message.includes('runway 27')));
    assert.equal(validator.validateTransmission('Cleared for takeoff runway 27, Cessna 2701', context).score, 100);
});

test('runway side, multiple runways, hold short and clearance types are checked', () => {
    const { phraseologyValidator: validator } = training();
    const atc = 'N12345, taxi via Alpha, cross runway 09, hold short runway 27L';
    assert.equal(validator.validateTransmission('Taxi via Alpha, cross runway 9, holding short runway 27 left, N12345', { lastATCMessage: atc }).valid, true);
    assert.equal(validator.validateTransmission('Taxi via Alpha, cross runway 9, hold short runway 27R, N12345', { lastATCMessage: atc }).valid, false);
    assert.equal(validator.validateTransmission('Cleared for takeoff runway 27, N12345', { lastATCMessage: 'N12345 runway 27 cleared to land' }).valid, false);
});

test('assigned heading, altitude, squawk, and frequency values must match', () => {
    const { phraseologyValidator: validator } = training();
    const atc = 'N12345, fly heading 270, maintain 3,000, squawk 4521, contact approach 124.350';
    const good = 'Heading 270, maintain 3000, squawk 4521, contact approach 124.35, N12345';
    assert.equal(validator.validateTransmission(good, { lastATCMessage: atc }).valid, true);
    const wrong = validator.validateTransmission('Heading 180, maintain 9000, squawk 7700, contact approach 121.5, N12345', { lastATCMessage: atc });
    assert.equal(wrong.valid, false);
    assert.equal(wrong.criticalIssues.length, 4);
});

test('empty or unrecognized text cannot earn a perfect score', () => {
    const { phraseologyValidator: validator } = training();
    assert.equal(validator.validateTransmission('').score, 0);
    assert.equal(validator.validateTransmission('banana').valid, false);
    assert.ok(validator.validateTransmission('N12345 banana').score < 100);
    assert.equal(validator.validateTransmission('N12345, number two, traffic in sight').feedback.length, 0);
});

test('critical feedback appears immediately for every difficulty', () => {
    for (const level of ['beginner', 'intermediate', 'advanced']) {
        const { feedbackEngine } = training();
        feedbackEngine.setDifficulty(level);
        const result = feedbackEngine.processFeedback('Roger, N12345', 'N12345 hold short runway 27');
        assert.equal(result.showFeedback, true, level);
        assert.ok(result.feedback.some(item => item.type === 'critical'), level);
    }
});

test('ground sequence handles handoff issued with holding-short report and completes', () => {
    const state = training().scenarioStateMachine;
    assert.equal(state.initialize('ground_operations').progress, 0);
    state.update('Ground N12345 ready to taxi', 'N12345 taxi via Alpha, hold short runway 27');
    state.update('Taxi via Alpha hold short runway 27, N12345', 'N12345 readback correct');
    assert.equal(state.update('N12345 holding short runway 27', 'N12345 contact tower 118.3').phase, 'contact_tower');
    const completed = state.update('Contact tower 118.3, N12345', 'N12345 roger');
    assert.equal(completed.phase, 'complete');
    assert.equal(completed.progress, 100);
    assert.equal(state.update('hello', 'hello').phase, 'complete');
});

test('pattern advances on received clearance and follows one full circuit', () => {
    const state = training().scenarioStateMachine;
    state.initialize('pattern_work');
    assert.equal(state.update('N12345 ready for departure', 'N12345 runway 27 cleared for takeoff').phase, 'takeoff_clearance');
    assert.equal(state.update('Cleared for takeoff runway 27, N12345', 'N12345 report downwind').phase, 'crosswind');
    state.update('N12345 left downwind runway 27', 'N12345 report base');
    state.update('N12345 turning base', 'N12345 runway 27 cleared to land');
    state.update('Cleared to land runway 27, N12345', 'N12345 roger');
    assert.equal(state.update('N12345 clear of runway 27', 'N12345 contact ground 121.9').phase, 'complete');
});

test('flight following and emergency flows reach completion', () => {
    const state = training().scenarioStateMachine;
    state.initialize('flight_following');
    state.update('N12345 request flight following', 'N12345 squawk 4521, radar contact');
    assert.equal(state.update('Squawk 4521, N12345', 'N12345 radar contact').phase, 'enroute');
    assert.equal(state.update('N12345 traffic in sight', 'N12345 radar contact').phase, 'enroute');
    assert.equal(state.update('N12345 level 4500', 'N12345 contact approach 124.35').phase, 'frequency_change');
    assert.equal(state.update('Contact approach 124.35, N12345', 'N12345 roger').phase, 'complete');
    state.initialize('emergency');
    state.update('Mayday N12345 engine failure', 'N12345 say persons on board and fuel');
    state.update('N12345 two persons on board, one hour fuel', 'N12345 say intentions');
    state.update('N12345 request vectors', 'N12345 heading 270, vectors to airport');
    assert.equal(state.update('N12345 landed, emergency resolved', 'N12345 roger').phase, 'complete');
});

test('new scenarios clear aircraft position and stale next-action hints', () => {
    const visual = training().aviationVisual;
    visual.aircraftPosition = { x: 2, y: 3 };
    visual.loadScenarioVisuals({ conditions: 'Unspecified' });
    assert.equal(visual.aircraftPosition, null);
    assert.doesNotThrow(() => visual.updatePosition('initial_contact'));
    visual.updatePosition('enroute');
    assert.equal(visual.aircraftPosition, null);
});

test('illustrative runway shows both reciprocal ends without painting over the active runway', () => {
    const visual = training().aviationVisual;
    const labels = [];
    visual.canvas = { width: 400, height: 300 };
    visual.ctx = new Proxy({}, { get(target, key) { return key === 'fillText' ? text => labels.push(text) : () => {}; }, set() { return true; } });
    visual.loadScenarioVisuals({ conditions: '' });
    assert.ok(labels.includes('27'));
    assert.ok(labels.includes('09'));
});
