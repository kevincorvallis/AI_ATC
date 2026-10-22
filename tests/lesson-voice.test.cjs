const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function setup(options = {}) {
    const timers = new Map();
    const recognitions = [];
    const utterances = [];
    const states = [];
    const transcripts = [];
    const errors = [];
    let timerID = 0;
    let synthCancels = 0;
    class Recognition {
        constructor() { this.starts = this.stops = this.aborts = 0; recognitions.push(this); }
        start() {
            this.starts++;
            if (options.startError) throw options.startError;
        }
        stop() {
            this.stops++;
            if (options.stopError) throw options.stopError;
        }
        abort() {
            this.aborts++;
            // Real implementations may synchronously report an abort while canceling.
            if (options.synchronousAbort) {
                this.onerror?.({ error: 'aborted' });
                this.onend?.();
            }
        }
    }
    class Utterance { constructor(text) { this.text = text; } }
    const browser = {
        isSecureContext: options.secure !== false,
        setTimeout(callback, ms) { const id = ++timerID; timers.set(id, { callback, ms }); return id; },
        clearTimeout(id) { timers.delete(id); }
    };
    if (!options.noRecognition) browser[options.prefixed ? 'webkitSpeechRecognition' : 'SpeechRecognition'] = Recognition;
    if (!options.noSpeech) {
        browser.SpeechSynthesisUtterance = Utterance;
        browser.speechSynthesis = {
            getVoices: () => options.voices || [],
            speak(utterance) {
                if (options.speakError) throw options.speakError;
                utterances.push(utterance);
            },
            cancel() {
                synthCancels++;
                if (options.synchronousAbort) utterances.at(-1)?.onerror?.({ error: 'canceled' });
            }
        };
    }
    const context = { window: browser, module: { exports: {} } };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'lesson-voice.js'), 'utf8'), context);
    const { LessonVoice } = context.module.exports;
    const voice = new LessonVoice({
        onState: state => states.push({ ...state }),
        onTranscript: (text, details) => transcripts.push({ text, final: details.final }),
        onError: message => errors.push(message)
    });
    function fireTimer(ms) {
        const match = [...timers.entries()].find(([, item]) => item.ms === ms);
        assert.ok(match, `Expected a ${ms} ms timer`);
        timers.delete(match[0]);
        match[1].callback();
    }
    function result(recognition, ...parts) {
        recognition.onresult?.({ results: parts.map(([text, final]) => Object.assign([{ transcript: text }], { isFinal: final })) });
    }
    return { voice, browser, recognitions, utterances, states, transcripts, errors, timers, fireTimer, result, synthCancels: () => synthCancels };
}

function state(voice) { return { ...voice.state }; }

test('feature detection and both public constructor forms do not request audio', () => {
    const env = setup({ prefixed: true });
    assert.equal(env.voice.supportedSpeech, true);
    assert.equal(env.voice.supportedRecognition, true);
    assert.equal(env.browser.WilcoVoice.LessonVoice, env.browser.WilcoVoice);
    assert.equal(env.recognitions.length, 0);
    assert.equal(env.utterances.length, 0);
    assert.deepEqual(state(env.voice), { listening: false, speaking: false, pending: false });
    const copy = env.voice.state;
    copy.listening = true;
    assert.equal(env.voice.state.listening, false);
});

test('unsupported speech and recognition leave typing available and report recovery', () => {
    const env = setup({ noSpeech: true, noRecognition: true });
    assert.equal(env.voice.supportedSpeech, false);
    assert.equal(env.voice.supportedRecognition, false);
    assert.equal(env.voice.startListening(), false);
    assert.equal(env.voice.speak('Controller message'), false);
    assert.match(env.errors[0], /Type your transmission/);
    assert.match(env.errors[1], /Read the controller message/);
    assert.deepEqual(state(env.voice), { listening: false, speaking: false, pending: false });
});

test('microphone start is explicit and duplicate clicks do not create competing sessions', () => {
    const env = setup();
    assert.equal(env.voice.startListening(), true);
    assert.equal(env.voice.startListening(), false);
    assert.equal(env.recognitions.length, 1);
    const rec = env.recognitions[0];
    assert.equal(rec.starts, 1);
    assert.equal(rec.lang, 'en-US');
    assert.equal(rec.continuous, false);
    assert.equal(rec.interimResults, true);
    assert.equal(env.voice.state.pending, true);
    rec.onstart();
    assert.equal(env.voice.state.listening, true);
    assert.equal(env.voice.state.pending, false);
    env.voice.destroy();
    assert.ok(rec.aborts >= 1);
});

test('stopping during permission pending aborts, and a delayed start is aborted again', () => {
    const env = setup({ synchronousAbort: true });
    env.voice.startListening();
    const old = env.recognitions[0];
    env.voice.stopListening();
    assert.equal(old.aborts, 1);
    assert.equal(old.stops, 0);
    old.onstart();
    assert.equal(old.aborts, 2);
    env.result(old, ['must not appear', true]);
    assert.deepEqual(env.transcripts, []);
    assert.equal(env.errors.length, 0);
    assert.deepEqual(state(env.voice), { listening: false, speaking: false, pending: false });
});

test('live stop requests a final result, preserves the latest full draft, and never restarts', () => {
    const env = setup();
    env.voice.startListening();
    const rec = env.recognitions[0];
    rec.onstart();
    env.result(rec, ['Metro ground', true], ['Cessna one', false]);
    assert.deepEqual(env.transcripts, [{ text: 'Metro ground Cessna one', final: false }]);
    env.voice.stopListening();
    assert.equal(rec.stops, 1);
    assert.equal(env.voice.state.pending, true);
    assert.equal(env.voice.state.listening, false);
    env.result(rec, ['Metro ground', true], ['Cessna one two three', true]);
    assert.deepEqual(env.transcripts.at(-1), { text: 'Metro ground Cessna one two three', final: true });
    assert.equal(rec.stops, 1);
    rec.onend();
    assert.equal(env.voice.state.pending, false);
    assert.equal(env.recognitions.length, 1);
    assert.equal(env.errors.length, 0);
});

test('natural final result stops capture and a following end does not discard or duplicate it', () => {
    const env = setup();
    env.voice.startListening();
    const rec = env.recognitions[0];
    rec.onstart();
    env.result(rec, ['Cessna 12345 ready', true]);
    assert.equal(rec.stops, 1);
    rec.onend();
    env.result(rec, ['late result', true]);
    assert.equal(env.transcripts.length, 1);
    assert.equal(env.errors.length, 0);
    assert.deepEqual(state(env.voice), { listening: false, speaking: false, pending: false });
});

test('cancel ignores all stale results, errors, ends and timers from an earlier mic session', () => {
    const env = setup({ synchronousAbort: true });
    env.voice.startListening();
    const old = env.recognitions[0];
    old.onstart();
    const oldTimer = [...env.timers.values()].find(timer => timer.ms === 30000).callback;
    env.voice.cancel();
    env.voice.startListening();
    const current = env.recognitions[1];
    current.onstart();
    old.onstart();
    env.result(old, ['stale text', true]);
    old.onerror({ error: 'network' });
    old.onend();
    oldTimer();
    assert.equal(env.voice.state.listening, true);
    assert.equal(current.stops, 0);
    assert.equal(env.transcripts.length, 0);
    assert.equal(env.errors.length, 0);
    env.voice.destroy();
});

test('recognition failures report recovery and clear microphone state without auto-retry', () => {
    for (const [code, expected] of [['not-allowed', /permission was denied/], ['network', /connection/], ['no-speech', /No speech/], ['audio-capture', /No microphone/]]) {
        const env = setup();
        env.voice.startListening();
        const rec = env.recognitions[0];
        rec.onstart();
        rec.onerror({ error: code });
        rec.onend();
        assert.equal(env.errors.length, 1);
        assert.match(env.errors[0], expected);
        assert.equal(rec.aborts, 1);
        assert.equal(env.recognitions.length, 1);
        assert.deepEqual(state(env.voice), { listening: false, speaking: false, pending: false });
    }
});

test('insecure contexts and synchronous start errors are handled without stuck pending state', () => {
    const insecure = setup({ secure: false });
    assert.equal(insecure.voice.startListening(), false);
    assert.equal(insecure.recognitions.length, 0);
    assert.match(insecure.errors[0], /HTTPS/);
    const denied = setup({ startError: { name: 'NotAllowedError' } });
    assert.equal(denied.voice.startListening(), false);
    assert.equal(denied.voice.state.pending, false);
    assert.match(denied.errors[0], /denied/);
    const race = setup({ startError: { name: 'InvalidStateError' } });
    assert.equal(race.voice.startListening(), false);
    assert.equal(race.recognitions[0].aborts, 1);
    assert.equal(race.voice.state.pending, false);
});

test('permission and recording limits stop capture and pending finalization is bounded', () => {
    const env = setup();
    env.voice.startListening();
    env.fireTimer(20000);
    assert.equal(env.recognitions[0].aborts, 1);
    assert.match(env.errors[0], /did not become ready/);
    env.voice.startListening();
    const rec = env.recognitions[1];
    rec.onstart();
    env.fireTimer(30000);
    assert.equal(rec.stops, 1);
    env.fireTimer(5000);
    assert.equal(rec.aborts, 1);
    assert.equal(env.voice.state.pending, false);
});

test('speech selects local English voice, bounds text/rate, and cancels microphone first', () => {
    const localEnglish = { lang: 'en-GB', localService: true };
    const env = setup({ voices: [{ lang: 'fr-FR', default: true }, { lang: 'en-US' }, localEnglish] });
    env.voice.startListening();
    env.recognitions[0].onstart();
    assert.equal(env.voice.speak('word '.repeat(1000), 99), false);
    assert.equal(env.utterances.length, 0);
    assert.match(env.errors[0], /full controller message/);
    assert.equal(env.voice.speak('Runway 27, cleared for takeoff.', 99), true);
    assert.equal(env.recognitions[0].aborts, 1);
    const utterance = env.utterances[0];
    assert.equal(utterance.voice, localEnglish);
    assert.equal(utterance.lang, 'en-US');
    assert.equal(utterance.text, 'Runway 27, cleared for takeoff.');
    assert.equal(utterance.rate, 1.2);
    assert.equal(env.voice.state.speaking, true);
    assert.equal(env.voice.state.listening, false);
    utterance.onend();
    assert.equal(env.voice.state.speaking, false);
});

test('speech cancellation invalidates queued utterance callbacks before replacement playback', () => {
    const env = setup({ synchronousAbort: true });
    env.voice.speak('First message');
    const old = env.utterances[0];
    env.voice.speak('Second message');
    const current = env.utterances[1];
    old.onstart();
    old.onend();
    old.onerror({ error: 'audio-busy' });
    assert.equal(env.voice.state.speaking, true);
    assert.equal(env.errors.length, 0);
    current.onend();
    assert.equal(env.voice.state.speaking, false);
    env.voice.speak('Third message');
    env.voice.startListening();
    assert.equal(env.voice.state.speaking, false);
    assert.equal(env.voice.state.pending, true);
    env.voice.destroy();
});

test('speech failures and missing voice lists recover to idle with readable fallback', () => {
    const env = setup({ speakError: new Error('blocked') });
    assert.equal(env.voice.speak('Controller'), false);
    assert.equal(env.voice.state.speaking, false);
    assert.match(env.errors[0], /Replay/);
    const empty = setup();
    empty.voice.speak('Controller', 'invalid');
    assert.equal(empty.utterances[0].voice, undefined);
    assert.equal(empty.utterances[0].rate, 0.85);
    empty.fireTimer(90000);
    assert.equal(empty.voice.state.speaking, false);
    assert.match(empty.errors[0], /timed out/);
});

test('destroy cancels active work, ignores late events, and cannot be restarted', () => {
    const env = setup();
    env.voice.startListening();
    const rec = env.recognitions[0];
    rec.onstart();
    env.voice.destroy();
    const eventCount = env.states.length;
    const cancelCount = env.synthCancels();
    rec.onstart();
    env.result(rec, ['late microphone text', true]);
    rec.onerror({ error: 'network' });
    rec.onend();
    assert.equal(env.voice.startListening(), false);
    assert.equal(env.voice.speak('No'), false);
    env.voice.cancel();
    env.voice.stopSpeaking();
    env.voice.destroy();
    assert.equal(env.states.length, eventCount);
    assert.equal(env.synthCancels(), cancelCount);
    assert.equal(env.transcripts.length, 0);
    assert.equal(env.errors.length, 0);
    assert.equal(env.timers.size, 0);
});


test('a stop requested by a listening-state callback keeps the finalization timeout', () => {
    const env = setup();
    env.voice.onState = value => { if (value.listening) env.voice.stopListening(); };
    env.voice.startListening();
    env.recognitions[0].onstart();
    assert.equal(env.recognitions[0].stops, 1);
    assert.deepEqual([...env.timers.values()].map(item => item.ms), [5000]);
    env.voice.destroy();
    assert.equal(env.timers.size, 0);
});
