const test = require('node:test');
const assert = require('node:assert/strict');
const { LessonSession, STEPS, loadProgress, saveProgress } = require('../lesson-engine.js');

const drill = id => new LessonSession({ stepIds: [id] });
const answers = [
    'Metro Ground, Cessna one two three four five, east ramp, VFR westbound, with information Alpha',
    'Runway two seven via Alpha, hold short runway two seven, Cessna one two three four five',
    'Tower one one eight point three, Cessna one two three four five',
    'Metro Tower, Cessna one two three four five, holding short runway two seven, ready for departure westbound',
    'Hold short runway two seven, Cessna one two three four five',
    'Cleared for takeoff runway two seven, Cessna one two three four five'
];

test('six-step spoken departure progresses only after each successful readback', () => {
    const session = new LessonSession();
    for (const answer of answers) {
        const before = session.index;
        assert.equal(session.advance(), false);
        assert.equal(session.submit(answer).status, 'pass', answer);
        assert.equal(session.index, before, 'submitting never changes the step');
        assert.equal(session.advance(), true);
    }
    assert.equal(session.complete, true);
    assert.equal(session.currentStep, null);
    assert.equal(session.advance(), false);
    assert.equal(session.summary().completed, 6);
    assert.equal(session.summary().firstTry, 6);
    assert.equal(session.summary().attempts, 6);
    assert.deepEqual(session.summary().missedSkills, []);
    assert.equal(session.submit('hello').status, 'pass');
    assert.equal(session.summary().attempts, 6);
});

test('every displayed example passes its own exercise', () => {
    for (const item of STEPS) assert.equal(drill(item.id).submit(item.example).status, 'pass', item.id);
});

test('equivalent word order, full November identification, apron, and phonetic variants pass', () => {
    assert.equal(drill('initial-call').submit('Metro Ground, November one two tree four fife, at the east apron, visual? V F R to the west, ATIS Alfa').status, 'pass');
    assert.equal(drill('taxi-readback').submit('N12345, taxiway A to runway twenty seven, holding short of runway 27').status, 'pass');
    assert.equal(drill('tower-handoff').submit('Cessna12345, going to tower on one eighteen decimal three').status, 'pass');
    assert.equal(drill('tower-handoff').submit('Tower 118.300, November12345').status, 'pass');
    assert.equal(drill('tower-call').submit('Metro Tower, November12345, holding short of 27, ready for a departure to the west').status, 'pass');
    assert.equal(drill('takeoff-readback').submit('Cessna12345, runway 27, cleared to take off').status, 'pass');
});

test('runway numbers must be contextual and every mentioned runway must match', () => {
    for (const text of [
        'Cleared for takeoff runway 09, Cessna 12345',
        'Cleared for takeoff runway 27 left, Cessna 12345',
        'Cleared for takeoff runway 270, Cessna 12345',
        'Cleared for takeoff runway 27 and runway 09, Cessna 12345',
        'Cleared for takeoff runway 27 and 09, Cessna 12345',
        'Cleared for takeoff, heading 27, Cessna 12345',
        'Cleared for takeoff runway 09, Cessna 27123'
    ]) {
        const result = drill('takeoff-readback').submit(text);
        assert.equal(result.status, 'retry', text);
        assert.ok(result.missing.some(item => item.id === 'runway' && item.critical), text);
    }
});

test('a callsign cannot supply the missing runway or frequency', () => {
    assert.equal(drill('hold-short').submit('Hold short, Cessna 1234527').status, 'retry');
    const result = drill('tower-handoff').submit('Tower, Cessna 1183');
    assert.ok(result.missing.some(item => item.id === 'frequency'));
    assert.ok(result.missing.some(item => item.id === 'callsign'));
});

test('shortened, extended, wrong and conflicting callsigns cannot pass', () => {
    for (const callsign of ['Cessna 345', 'Cessna 123456', 'Cessna 12345X', 'Cessna 12345 Alpha', 'N98765', '12345', 'Cessna12345, Cessna54321']) {
        const result = drill('hold-short').submit(`Hold short runway27, ${callsign}`);
        assert.equal(result.status, 'retry', callsign);
        assert.ok(result.missing.some(item => item.id === 'callsign' && item.critical));
    }
});

test('hold-short restriction cannot be replaced by roger or a taxi route', () => {
    const result = drill('taxi-readback').submit('Runway27, taxi via Alpha, roger, Cessna12345');
    assert.equal(result.status, 'retry');
    assert.equal(result.missing[0].id, 'hold-short');
    assert.match(result.feedback, /hold short runway 27/i);
    assert.equal(drill('hold-short').submit('Cessna12345, hold short taxiway Alpha, runway27').status, 'retry');
    assert.equal(drill('hold-short').submit('Cessna12345, runway27, holding short').status, 'pass');
});

test('correct words mixed with an unauthorized clearance must retry', () => {
    for (const extra of ['cleared for takeoff runway27', 'cross runway27', 'line up and wait runway27', 'entering runway27', 'taking off', 'rolling']) {
        const result = drill('hold-short').submit(`Hold short runway27, ${extra}, Cessna12345`);
        assert.equal(result.status, 'retry', extra);
        assert.equal(result.missing[0].id, 'clearance');
    }
    for (const response of ['Not holding short runway27, Cessna12345', 'Cessna12345, runway27, disregard the hold short instruction']) {
        const negated = drill('hold-short').submit(response);
        assert.equal(negated.status, 'retry');
        assert.equal(negated.missing[0].id, 'clearance');
    }
});

test('landing, line-up, or old hold-short instructions cannot pass the takeoff readback', () => {
    for (const phrase of ['cleared to land', 'line up and wait', 'hold short', 'cleared for takeoff and hold short']) {
        const result = drill('takeoff-readback').submit(`${phrase} runway27, Cessna12345`);
        assert.equal(result.status, 'retry', phrase);
        assert.equal(result.missing[0].id, 'clearance');
    }
    assert.equal(drill('takeoff-readback').submit('Cessna12345, runway27, cleared for takeoff is canceled').status, 'retry');
});

test('a wrong or extra taxiway cannot be hidden by also saying Alpha', () => {
    for (const route of ['via Bravo', 'via Alpha and Bravo', 'via A and B', 'via Alpha then B', 'via Charlie, information Alpha']) {
        const result = drill('taxi-readback').submit(`Runway27, taxi ${route}, hold short runway27, Cessna12345`);
        assert.equal(result.status, 'retry', route);
    }
});

test('wrong and conflicting frequencies receive an important correction', () => {
    for (const frequency of ['128.3', '118.2', '118.3 and 121.5', 'one one nine point three']) {
        const result = drill('tower-handoff').submit(`Tower ${frequency}, Cessna12345`);
        assert.equal(result.status, 'retry', frequency);
        assert.equal(result.missing[0].id, 'frequency');
        assert.equal(result.missing[0].critical, true);
    }
});

test('missing frequency is presented as a lesson practice detail', () => {
    const result = drill('tower-handoff').submit('Going to tower, Cessna12345');
    assert.equal(result.status, 'retry');
    assert.equal(result.missing[0].critical, false);
    assert.match(result.feedback, /handoff drill/);
});

test('essential safety correction precedes optional coaching', () => {
    const result = drill('taxi-readback').submit('Runway27, Cessna12345');
    assert.equal(result.status, 'retry');
    assert.equal(result.missing[0].id, 'hold-short');
    assert.equal(result.missing[0].critical, true);
    assert.ok(result.missing.some(item => item.id === 'route' && !item.critical));
    assert.doesNotMatch(result.feedback, /via Alpha/);
});

test('asking to repeat or slow down never counts as a failed attempt', () => {
    const session = drill('hold-short');
    for (const phrase of ['Cessna12345, say again', 'please repeat the instruction', 'speak slower', 'please speak more slowly', 'slow down please']) {
        const result = session.submit(phrase);
        assert.equal(result.status, 'repeat', phrase);
        assert.equal(result.controller, session.currentStep.controller);
        assert.equal(session.summary().attempts, 0);
        assert.deepEqual(session.summary().missedSkills, []);
    }
    assert.equal(session.summary().repeats, 5);
    assert.equal(session.summary().assisted, 1);
    assert.equal(session.advance(), false);
    assert.equal(session.submit(answers[4]).status, 'pass');
    assert.equal(session.summary().firstTry, 1);
    assert.equal(session.summary().independent, 0);
});

test('assistance is counted by exchange, and makes that exchange a useful retry drill', () => {
    const session = drill('hold-short');
    session.markAssistance('hint');
    session.markAssistance('hint');
    session.markAssistance('transcript');
    session.markAssistance('unrecognized');
    assert.equal(session.summary().assisted, 1);
    assert.deepEqual(session.summary().retryStepIds, ['hold-short']);
    assert.equal(session.submit(answers[4]).status, 'pass');
    session.advance();
    session.markAssistance('example');
    assert.equal(session.summary().assisted, 1);
});

test('mistakes and later success produce concrete improvement data without raw answers', () => {
    const session = drill('hold-short');
    session.submit('Roger runway27, Cessna12345');
    session.submit('Hold short runway09, Cessna12345');
    session.submit(answers[4]);
    session.advance();
    const summary = session.summary();
    assert.equal(summary.attempts, 3);
    assert.equal(summary.completed, 1);
    assert.equal(summary.firstTry, 0);
    assert.deepEqual(summary.retryStepIds, ['hold-short']);
    assert.deepEqual(summary.missedSkills.map(item => item.id).sort(), ['hold-short', 'runway']);
    assert.doesNotMatch(JSON.stringify(summary), /roger|runway09/i);
    assert.equal(Object.hasOwn(summary, 'score'), false);
});

test('resubmission of a passed step is idempotent until advance', () => {
    const session = drill('hold-short');
    const passed = session.submit(answers[4]);
    assert.deepEqual(session.submit('nonsense'), passed);
    assert.equal(session.summary().attempts, 1);
});

test('targeted drills use valid, unique steps in lesson order and remove default guidance', () => {
    const session = new LessonSession({ stepIds: ['takeoff-readback', 'hold-short', 'hold-short', 'unknown'] });
    assert.deepEqual(session.steps.map(item => item.id), ['hold-short', 'takeoff-readback']);
    assert.ok(session.steps.every(item => item.guidance === 'independent'));
    assert.equal(session.currentStep.id, 'hold-short');
    assert.match(session.currentStep.briefing, /Another aircraft/);
    assert.equal(new LessonSession({ stepIds: [] }).steps.length, 6);
    assert.equal(new LessonSession({ stepIds: ['unknown'] }).steps.length, 6);
});

function memoryStorage(initial) {
    const values = new Map(initial ? [['wilco_departure_progress', initial]] : []);
    return { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value), values };
}

test('progress safely persists aggregates and a sanitized last summary', () => {
    const storage = memoryStorage();
    const session = drill('hold-short');
    session.submit(answers[4]); session.advance();
    const summary = { ...session.summary(), transcript: 'PRIVATE RESPONSE', secret: 'PRIVATE VALUE' };
    summary.steps[0].transcript = 'RAW WORDS';
    summary.steps[0].title = 'UNTRUSTED TITLE';
    assert.equal(saveProgress(storage, summary).sessions, 1);
    assert.equal(saveProgress(storage, summary).completedLessons, 2);
    const saved = loadProgress(storage);
    assert.equal(saved.totalAttempts, 2);
    assert.deepEqual(saved.lastSummary.retryStepIds, []);
    assert.equal(saved.lastSummary.steps[0].title, 'Wait for landing traffic');
    assert.doesNotMatch(storage.getItem('wilco_departure_progress'), /PRIVATE|RAW WORDS|UNTRUSTED/);
    assert.deepEqual([...storage.values.keys()], ['wilco_departure_progress']);
});

test('missing, blocked, or corrupt browser storage never prevents a lesson', () => {
    for (const storage of [undefined, memoryStorage('{bad json'), memoryStorage('{"version":99}'), { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } }]) {
        assert.deepEqual(loadProgress(storage), { version: 1, sessions: 0, completedLessons: 0, totalAttempts: 0, lastSummary: null });
        assert.doesNotThrow(() => saveProgress(storage, drill('hold-short').summary()));
    }
    assert.equal(saveProgress(undefined, drill('hold-short').summary()), null);
    assert.equal(saveProgress(memoryStorage(), { total: 6, transcript: 'ignore' }), null);
});

test('untrusted stored steps, fields, and skill identifiers are not rendered back', () => {
    const session = drill('hold-short');
    const summary = session.summary();
    summary.missedSkills = [{ id: 'unknown', label: '<script>', count: 3 }, { id: '__proto__', label: '<script>', count: 5 }, { id: 'runway', label: '<script>', count: 1 }];
    summary.retryStepIds = ['hold-short', 'unknown', '<script>'];
    const storage = memoryStorage(JSON.stringify({ version: 1, sessions: -1, completedLessons: 'bad', totalAttempts: 1.4, lastSummary: summary }));
    const result = loadProgress(storage);
    assert.equal(result.sessions, 0);
    assert.equal(result.completedLessons, 0);
    assert.equal(result.totalAttempts, 0);
    assert.deepEqual(result.lastSummary.missedSkills, [{ id: 'runway', label: 'Read back the runway', count: 1 }]);
    assert.deepEqual(result.lastSummary.retryStepIds, ['hold-short']);
    assert.doesNotMatch(JSON.stringify(result), /<script>/);
});

test('empty text earns no progress and reports useful feedback', () => {
    for (const input of ['', null, undefined, 'banana']) {
        const session = drill('hold-short');
        const result = session.submit(input);
        assert.equal(result.status, 'retry');
        assert.ok(result.feedback.length);
        assert.equal(session.advance(), false);
        assert.equal(session.summary().completed, 0);
    }
});
