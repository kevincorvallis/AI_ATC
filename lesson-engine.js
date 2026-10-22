(function (root) {
    'use strict';

    // Fictional U.S. VFR practice, not operational airport or clearance data.
    // References reviewed 2026-09-29: FAA AIM 4-2-3/4-2-4 and 4-3-18.
    // https://www.faa.gov/air_traffic/publications/aim_html/chap4_section_2.html
    // https://www.faa.gov/air_traffic/publications/aim_html/chap4_section_3.html
    const SKILLS = Object.freeze({
        callsign: 'Identify your aircraft', facility: 'Call the correct controller',
        position: 'State your position', intentions: 'State your departure request',
        atis: 'Include the ATIS information', runway: 'Read back the runway',
        route: 'Read back the taxi route', 'hold-short': 'Read back the hold-short restriction',
        frequency: 'Read back the tower frequency', clearance: 'Distinguish a clearance from a restriction'
    });
    const step = (data) => Object.freeze({ ...data, skillLabels: Object.freeze(data.skills.map(id => SKILLS[id])), skills: Object.freeze(data.skills) });
    const STEPS = Object.freeze([
        step({ id: 'initial-call', title: 'Make your first ground call', phase: 'At the east ramp', guidance: 'example',
            briefing: 'You are Cessna 12345 at the east ramp of fictional Metro Airport. You have information Alpha and want to taxi for a VFR departure to the west. Listen for a clear frequency, then call ground.',
            controller: '',
            example: 'Metro Ground, Cessna 12345, east ramp, VFR westbound, with information Alpha, request taxi.',
            hint: 'Who you are calling · who you are · where you are · what you want · ATIS.',
            skills: ['callsign', 'facility', 'position', 'intentions', 'atis'] }),
        step({ id: 'taxi-readback', title: 'Read back the taxi instruction', phase: 'Taxi clearance', guidance: 'example',
            briefing: 'Ground gives you a route to runway 27. Read back the runway, taxiway, and hold-short restriction. Taxi instructions do not authorize entering the departure runway.',
            controller: 'Cessna 12345, runway 27, taxi via Alpha, hold short runway 27.',
            example: 'Runway 27, taxi via Alpha, hold short runway 27, Cessna 12345.',
            hint: 'Runway · taxiway · hold short of which runway · callsign.',
            skills: ['callsign', 'runway', 'route', 'hold-short', 'clearance'] }),
        step({ id: 'tower-handoff', title: 'Acknowledge the handoff', phase: 'Switch to tower', guidance: 'hint',
            briefing: 'The lesson moves you along Alpha to the hold-short line for runway 27. Your run-up is complete and you remain stopped. Acknowledge the change to tower and practice reading its frequency back.',
            controller: 'Cessna 12345, contact Metro Tower on 118.3.',
            example: 'Metro Tower, 118.3, Cessna 12345.',
            hint: 'New controller · frequency · callsign. Say the frequency one digit at a time.',
            skills: ['callsign', 'frequency', 'facility'] }),
        step({ id: 'tower-call', title: 'Tell tower you are ready', phase: 'Holding short', guidance: 'hint',
            briefing: 'You have changed to the fictional tower frequency, 118.3, and listened for a clear frequency. You are holding short of runway 27, ready for a westbound VFR departure. Make your first call to Metro Tower.',
            controller: '',
            example: 'Metro Tower, Cessna 12345, holding short runway 27, ready for departure, westbound.',
            hint: 'Tower · full callsign · holding-short position · ready · direction.',
            skills: ['callsign', 'facility', 'runway', 'hold-short', 'intentions'] }),
        step({ id: 'hold-short', title: 'Wait for landing traffic', phase: 'A restriction, not a clearance', guidance: 'independent',
            briefing: 'Another aircraft is landing. Acknowledge the restriction and remain short of the runway. You can always ask the controller to repeat an unclear instruction.',
            controller: 'Cessna 12345, hold short runway 27, landing traffic.',
            example: 'Hold short runway 27, Cessna 12345.',
            hint: 'Read back the hold-short instruction, its runway, and your callsign.',
            skills: ['callsign', 'runway', 'hold-short', 'clearance'] }),
        step({ id: 'takeoff-readback', title: 'Read back the takeoff clearance', phase: 'Ready to depart', guidance: 'independent',
            briefing: 'The landing aircraft has cleared the runway. Listen to the new instruction and read back the clearance, runway, and your callsign. This is the last exchange of the lesson.',
            controller: 'Cessna 12345, runway 27, cleared for takeoff.',
            example: 'Cleared for takeoff runway 27, Cessna 12345.',
            hint: 'The clearance changed. Read back what you are cleared to do, which runway, and your callsign.',
            skills: ['callsign', 'runway', 'clearance'] })
    ]);
    const STEP_IDS = new Set(STEPS.map(item => item.id));
    const STORAGE_KEY = 'wilco_departure_progress';

    function normalize(value) {
        const digits = { zero: '0', oh: '0', one: '1', wun: '1', two: '2', three: '3', tree: '3', four: '4', fower: '4', five: '5', fife: '5', six: '6', seven: '7', eight: '8', nine: '9', niner: '9' };
        return String(value || '').toLowerCase().slice(0, 2000)
            .replace(/([a-z])(\d)/g, '$1 $2').replace(/(\d)([a-z])/g, '$1 $2')
            .replace(/\bv\s*\.?\s*f\s*\.?\s*r\b/g, 'vfr')
            .replace(/\bwest\s+bound\b/g, 'westbound').replace(/\btake\s+off\b/g, 'takeoff')
            .replace(/\balfa\b/g, 'alpha').replace(/\bholdshort\b/g, 'hold short')
            .replace(/\bone\s+(?:hundred\s+(?:and\s+)?)?eighteen\b/g, '118')
            .replace(/\btwenty[ -]+seven\b/g, '27')
            .replace(/\b(zero|oh|one|wun|two|three|tree|four|fower|five|fife|six|seven|eight|nine|niner)\b/g, word => digits[word])
            .replace(/\b(?:point|decimal)\b/g, '.')
            .replace(/(\d)\s+(?=\d)/g, '$1').replace(/(\d)\s*\.\s*(?=\d)/g, '$1.')
            .replace(/[^a-z0-9.,\s]/g, ' ').replace(/\s+/g, ' ').trim();
    }

    function inspect(text) {
        const normalized = normalize(text);
        const identifier = /\b(?:cessna|november|n)\s*(\d+)(?:\s+([a-z]|alpha|bravo|charlie|delta|echo|foxtrot|golf|hotel|india|juliett?|kilo|lima|mike|november|oscar|papa|quebec|romeo|sierra|tango|uniform|victor|whiske?y|xray|yankee|zulu)\b)?\b/g;
        const callsigns = [...normalized.matchAll(identifier)];
        const body = normalized.replace(identifier, ' ');
        const runways = [...body.matchAll(/\b(?:runway|hold(?:ing)? short(?: of)?(?: runway)?)\s+(\d+)(?:\s*(left|right|center|l|r|c)\b)?/g)];
        const otherRunway = /\brunway\s+27\s*(?:and|or|,)\s*(?:runway\s+)?(\d+)(?:\s*(left|right|center|l|r|c)\b)?/.exec(body);
        return {
            text: normalized, body,
            callsign: callsigns.some(match => match[1] === '12345' && !match[2]),
            wrongCallsign: callsigns.some(match => match[1] !== '12345' || match[2]),
            runway: runways.some(match => match[1] === '27' && !match[2]),
            wrongRunway: runways.some(match => match[1] !== '27' || match[2]) || !!(otherRunway && (otherRunway[1] !== '27' || otherRunway[2])),
            holding: /\bhold(?:ing)? short(?: of)?(?:,? runway)?\s*,?\s*27\b/.test(body) || /\brunway 27\s*,?\s*hold(?:ing)? short\b/.test(body),
            takeoff: /\bcleared (?:for|to) takeoff\b/.test(body),
            unauthorized: /\b(?:cleared (?:for|to) (?:takeoff|land)|cross(?:ing)?(?: the)?(?: runway)?\s*\d+|line up(?: and wait)?|enter(?:ing)?(?: the)? runway|taking off|rolling)\b/.test(body),
            negated: /\b(?:not|never|unable|cannot|can t|won t|will not|don t|do not|cancel(?:ed|led)?|disregard(?:ing|ed)?|ignor(?:e|ing|ed))\b/.test(body)
        };
    }

    function evaluate(item, input) {
        const value = inspect(input);
        const issues = [];
        const add = (id, feedback, critical = false) => {
            if (!issues.some(issue => issue.id === id)) issues.push({ id, label: SKILLS[id], critical, feedback });
        };
        if (value.wrongCallsign) add('callsign', 'Use Cessna 12345. A different callsign can acknowledge an instruction for another aircraft.', true);
        else if (!value.callsign) add('callsign', 'Include your full callsign: Cessna 12345. The controller has not shortened it in this lesson.', true);

        const runwayStep = item.skills.includes('runway');
        if (value.wrongRunway) add('runway', 'The assigned runway is 27. Check every runway number in your response, then try again.', true);
        else if (runwayStep && !value.runway) add('runway', 'Include runway 27 in your readback so the controller can confirm the runway.', true);

        if (item.id !== 'takeoff-readback' && value.unauthorized) {
            add('clearance', 'You have not been cleared onto the runway or for takeoff. Remain short of runway 27 and read back the current instruction.', true);
        }
        if (value.negated) add('clearance', 'Your response includes a refusal or negation. If an instruction is unclear, ask “say again”; otherwise read back the instruction you can follow in this practice scenario.', true);

        if (item.id === 'initial-call') {
            if (!/\bmetro ground\b/.test(value.body)) add('facility', 'Start by calling Metro Ground so the right controller knows you are calling.');
            if (!/\beast(?:ern)? (?:ramp|apron)\b/.test(value.body)) add('position', 'Tell ground where you are: at the east ramp.');
            if (!/\bvfr\b/.test(value.body) || !/\b(?:westbound|to the west|to west|depart(?:ure|ing)? west)\b/.test(value.body)) add('intentions', 'State your planned departure: VFR westbound.');
            if (!/\b(?:information|atis|with)\s+alpha\b/.test(value.body)) add('atis', 'Include information Alpha so ground knows which airport information you have.');
            if (/\b(?:information|atis)\s+(?!alpha\b)[a-z]+\b/.test(value.body)) add('atis', 'The airport information for this lesson is Alpha. Check the ATIS letter and try again.');
        }
        if (item.skills.includes('hold-short') && !value.holding) add('hold-short', 'Read back “hold short runway 27.” Acknowledging with “roger” alone does not confirm the restriction.', true);
        if (item.id === 'taxi-readback') {
            const route = value.body.replace(/\b(?:information|atis|with) alpha\b/g, '');
            const wrongRoute = /\b(?:bravo|charlie|delta|echo|foxtrot|golf|hotel|india|juliett?|kilo|lima|mike|november|oscar|papa|quebec|romeo|sierra|tango|uniform|victor|whiske?y|xray|yankee|zulu)\b/.test(route)
                || /\b(?:via|taxiway)\s+(?!alpha\b|a\b)[a-z0-9]+\b/.test(route)
                || /\b(?:alpha|a)\s*(?:,|and|then)?\s+[b-z]\b/.test(route);
            if (wrongRoute) add('route', 'The taxi route is Alpha only. Repeat the assigned route and hold short of runway 27.', true);
            else if (!/\balpha\b|\b(?:via|taxiway) a\b/.test(route)) add('route', 'Include the taxi route: via Alpha.');
        }
        if (item.id === 'tower-handoff') {
            const frequencies = [...value.body.matchAll(/\b(1\d{2}(?:\.\d+)?)\b/g)].map(match => Number(match[1]));
            if (frequencies.some(frequency => frequency !== 118.3)) add('frequency', 'Tower is on 118.3 in this fictional lesson. Read back one one eight point three.', true);
            else if (!frequencies.includes(118.3)) add('frequency', 'For this handoff drill, include the new frequency: 118.3.');
            if (!/\btower\b/.test(value.body)) add('facility', 'Acknowledge that you are switching to tower.');
        }
        if (item.id === 'tower-call') {
            if (!/\bmetro tower\b/.test(value.body)) add('facility', 'Begin your first call on this frequency with Metro Tower.');
            if (!/\bready\b/.test(value.body) || !/\b(?:westbound|to the west|to west|depart(?:ure|ing)? west)\b/.test(value.body)) add('intentions', 'Tell tower you are ready for departure and want to depart westbound.');
        }
        if (item.id === 'takeoff-readback') {
            if (/\b(?:hold(?:ing)? short|cleared (?:to|for) (?:land|taxi)|line up|cross(?:ing)?(?: the)?(?: runway)?\s*\d+)\b/.test(value.body)) add('clearance', 'The instruction has changed to a takeoff clearance. Read back “cleared for takeoff,” runway 27, and your callsign.', true);
            else if (!value.takeoff) add('clearance', 'Include “cleared for takeoff” to confirm the clearance you heard.', true);
        }
        // One actionable correction is surfaced; all missed skills inform later drills.
        const priority = ['clearance', 'runway', 'hold-short', 'frequency', 'callsign', 'route', 'facility', 'position', 'intentions', 'atis'];
        return issues.sort((a, b) => Number(b.critical) - Number(a.critical) || priority.indexOf(a.id) - priority.indexOf(b.id));
    }

    class LessonSession {
        constructor({ stepIds } = {}) {
            const requested = Array.isArray(stepIds) ? new Set(stepIds.filter(id => STEP_IDS.has(id))) : null;
            this.steps = requested && requested.size ? STEPS.filter(item => requested.has(item.id)).map(item => ({ ...item, guidance: 'independent' })) : [...STEPS];
            this.index = 0;
            this.complete = false;
            this._records = this.steps.map(item => ({ id: item.id, title: item.title, passed: false, attempts: 0, assists: new Set(), repeats: 0, misses: {} }));
            this._lastResult = null;
        }
        get currentStep() { return this.complete ? null : this.steps[this.index]; }
        markAssistance(kind) {
            if (!this.complete && ['example', 'hint', 'transcript', 'repeat', 'slow'].includes(kind)) this._records[this.index].assists.add(kind);
        }
        submit(text) {
            if (this.complete) return { status: 'pass', title: 'Lesson complete', feedback: 'You have completed every exchange in this lesson.', missing: [] };
            const record = this._records[this.index];
            if (record.passed) return this._lastResult;
            const normalized = normalize(text);
            if (/\b(?:say (?:that )?again|repeat(?: that| please| the (?:instruction|clearance))?|speak (?:more )?slow(?:er|ly)|slow(?:er| down)|could you (?:repeat|say))\b/.test(normalized)) {
                record.repeats += 1;
                this.markAssistance('repeat');
                return { status: 'repeat', title: 'Ask until it is clear', feedback: this.currentStep.controller ? 'Good choice. Listen again, then read back what you heard. Asking for clarification is not a failed attempt.' : 'Review the situation again, then make your call when you are ready.', missing: [], controller: this.currentStep.controller, slower: /\bslow/.test(normalized) };
            }
            record.attempts += 1;
            const missing = evaluate(this.currentStep, text);
            for (const issue of missing) record.misses[issue.id] = (record.misses[issue.id] || 0) + 1;
            record.passed = missing.length === 0;
            const successes = {
                'initial-call': 'You gave ground your identity, position, departure plan, and airport information.',
                'taxi-readback': 'You read back the route, runway, and the restriction that keeps you short of the runway.',
                'tower-handoff': 'You confirmed the tower handoff and the new frequency.',
                'tower-call': 'Tower knows who you are, where you are waiting, and which departure you want.',
                'hold-short': 'You acknowledged the runway restriction while landing traffic uses the runway.',
                'takeoff-readback': 'You recognized the changed clearance and confirmed takeoff from runway 27.'
            };
            this._lastResult = { status: record.passed ? 'pass' : 'retry', title: record.passed ? 'That communicates the essentials' : missing[0].critical ? 'Check this important detail' : 'One detail to add', feedback: record.passed ? successes[this.currentStep.id] : missing[0].feedback, missing: missing.map(({ id, label, critical }) => ({ id, label, critical })), attempts: record.attempts };
            return this._lastResult;
        }
        advance() {
            if (this.complete || !this._records[this.index].passed) return false;
            this.index += 1;
            this.complete = this.index === this.steps.length;
            this._lastResult = null;
            return true;
        }
        summary() {
            const misses = {};
            for (const record of this._records) for (const [id, count] of Object.entries(record.misses)) misses[id] = (misses[id] || 0) + count;
            return {
                completed: this._records.filter(record => record.passed).length, total: this.steps.length, complete: this.complete,
                firstTry: this._records.filter(record => record.passed && record.attempts === 1).length,
                independent: this._records.filter(record => record.passed && record.assists.size === 0).length,
                assisted: this._records.filter(record => record.assists.size > 0).length,
                attempts: this._records.reduce((sum, record) => sum + record.attempts, 0),
                repeats: this._records.reduce((sum, record) => sum + record.repeats, 0),
                missedSkills: Object.entries(misses).map(([id, count]) => ({ id, label: SKILLS[id], count })).sort((a, b) => b.count - a.count),
                retryStepIds: this._records.filter(record => Object.keys(record.misses).length || record.assists.size).map(record => record.id),
                steps: this._records.map(record => ({ id: record.id, title: record.title, passed: record.passed, attempts: record.attempts, assisted: record.assists.size > 0, repeats: record.repeats }))
            };
        }
    }

    const count = value => Number.isSafeInteger(value) && value >= 0 ? Math.min(value, 1000000) : 0;
    function cleanSummary(value) {
        if (!value || typeof value !== 'object' || !Array.isArray(value.steps)) return null;
        const steps = value.steps.filter(item => item && STEP_IDS.has(item.id)).slice(0, STEPS.length).map(item => ({ id: item.id, title: STEPS.find(step => step.id === item.id).title, passed: item.passed === true, attempts: count(item.attempts), assisted: item.assisted === true, repeats: count(item.repeats) }));
        if (!steps.length || new Set(steps.map(item => item.id)).size !== steps.length) return null;
        const completed = steps.filter(item => item.passed).length;
        return {
            completed, total: steps.length, complete: value.complete === true && completed === steps.length,
            firstTry: steps.filter(item => item.passed && item.attempts === 1).length,
            independent: steps.filter(item => item.passed && !item.assisted).length,
            assisted: steps.filter(item => item.assisted).length,
            attempts: steps.reduce((sum, item) => sum + item.attempts, 0), repeats: steps.reduce((sum, item) => sum + item.repeats, 0),
            missedSkills: Array.isArray(value.missedSkills) ? value.missedSkills.filter(item => item && Object.hasOwn(SKILLS, item.id) && count(item.count) > 0).slice(0, Object.keys(SKILLS).length).map(item => ({ id: item.id, label: SKILLS[item.id], count: count(item.count) })) : [],
            retryStepIds: Array.isArray(value.retryStepIds) ? [...new Set(value.retryStepIds.filter(id => steps.some(item => item.id === id)))] : [], steps
        };
    }
    const emptyProgress = () => ({ version: 1, sessions: 0, completedLessons: 0, totalAttempts: 0, lastSummary: null });
    function loadProgress(storage) {
        try {
            const saved = JSON.parse(storage.getItem(STORAGE_KEY));
            if (!saved || saved.version !== 1) return emptyProgress();
            return { version: 1, sessions: count(saved.sessions), completedLessons: count(saved.completedLessons), totalAttempts: count(saved.totalAttempts), lastSummary: cleanSummary(saved.lastSummary) };
        } catch (_) { return emptyProgress(); }
    }
    function saveProgress(storage, summary) {
        const lastSummary = cleanSummary(summary);
        if (!lastSummary) return null;
        const previous = loadProgress(storage);
        const progress = { version: 1, sessions: count(previous.sessions + 1), completedLessons: count(previous.completedLessons + Number(lastSummary.complete)), totalAttempts: count(previous.totalAttempts + lastSummary.attempts), lastSummary };
        try { storage.setItem(STORAGE_KEY, JSON.stringify(progress)); return progress; } catch (_) { return null; }
    }
    const api = { LessonSession, loadProgress, saveProgress, STEPS };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.WilcoLesson = api;
})(typeof window !== 'undefined' ? window : null);
