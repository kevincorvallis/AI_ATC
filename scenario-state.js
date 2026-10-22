// Scenario State Machine - Tracks flight progress and provides contextual guidance
// Manages the flow of flight operations and what communication is expected

class ScenarioStateMachine {
    constructor() {
        this.currentPhase = null;
        this.scenario = null;
        this.history = [];
        this.completedPhases = [];

        // Define state transitions for each scenario type
        this.stateFlows = {
            pattern_work: [
                { id: 'initial_contact', name: 'Initial Contact', next: 'departure_ready' },
                { id: 'departure_ready', name: 'Ready for Departure', next: 'takeoff_clearance' },
                { id: 'takeoff_clearance', name: 'Takeoff Clearance Received', next: 'crosswind' },
                { id: 'crosswind', name: 'Crosswind Turn', next: 'downwind' },
                { id: 'downwind', name: 'Downwind', next: 'base' },
                { id: 'base', name: 'Base Turn', next: 'final' },
                { id: 'final', name: 'Final Approach', next: 'landing' },
                { id: 'landing', name: 'Landing/Touch and Go', next: 'downwind' } // Can loop
            ],
            ground_operations: [
                { id: 'initial_contact', name: 'Initial Contact', next: 'taxi_clearance' },
                { id: 'taxi_clearance', name: 'Taxi Clearance Received', next: 'taxiing' },
                { id: 'taxiing', name: 'Taxiing', next: 'holding_short' },
                { id: 'holding_short', name: 'Holding Short', next: 'contact_tower' },
                { id: 'contact_tower', name: 'Contact Tower', next: 'complete' }
            ],
            flight_following: [
                { id: 'initial_request', name: 'Initial Request', next: 'radar_contact' },
                { id: 'radar_contact', name: 'Radar Contact', next: 'enroute' },
                { id: 'enroute', name: 'En Route', next: 'position_report' },
                { id: 'position_report', name: 'Position Report', next: 'enroute' }, // Can loop
                { id: 'frequency_change', name: 'Frequency Change', next: 'complete' }
            ],
            emergency: [
                { id: 'emergency_declaration', name: 'Declare Emergency', next: 'provide_info' },
                { id: 'provide_info', name: 'Provide Information', next: 'assistance' },
                { id: 'assistance', name: 'Receiving Assistance', next: 'resolution' },
                { id: 'resolution', name: 'Emergency Resolution', next: 'complete' }
            ]
        };

        // Expected communications for each phase
        this.phaseExpectations = {
            initial_contact: {
                pilot_should: 'Contact facility with callsign, location, and intentions',
                example: 'Metro Ground, Cessna 12345, at the ramp, ready to taxi with information Alpha',
                atc_typically: 'Acknowledges contact and provides clearance or stands by'
            },
            departure_ready: {
                pilot_should: 'Inform tower you are ready for departure',
                example: 'Metro Tower, Cessna 12345, ready for departure runway 27',
                atc_typically: 'Issues wind and takeoff clearance'
            },
            takeoff_clearance: {
                pilot_should: 'Read back runway number and takeoff clearance',
                example: 'Cleared for takeoff runway 27, Cessna 12345',
                atc_typically: 'May add traffic information'
            },
            downwind: {
                pilot_should: 'Report position on downwind',
                example: 'Metro Tower, Cessna 12345, left downwind runway 27',
                atc_typically: 'Acknowledges and may issue landing clearance or sequence'
            },
            base: {
                pilot_should: 'Report turning base (if requested)',
                example: 'Metro Tower, Cessna 12345, turning left base runway 27',
                atc_typically: 'Issues landing clearance if not already given'
            },
            final: {
                pilot_should: 'Continue approach, may hear landing clearance',
                example: 'Cleared to land runway 27, Cessna 12345',
                atc_typically: 'Landing clearance and wind update'
            },
            taxi_clearance: {
                pilot_should: 'Read back taxi route and hold short instructions',
                example: 'Taxi via Alpha, hold short runway 27, Cessna 12345',
                atc_typically: 'May provide additional information or corrections'
            },
            holding_short: {
                pilot_should: 'Inform ground you are holding short',
                example: 'Cessna 12345, holding short runway 27',
                atc_typically: 'Instructs to contact tower'
            }
        };
    }

    /**
     * Initialize state machine for a scenario
     */
    initialize(scenario) {
        this.scenario = scenario;
        this.currentPhase = this.stateFlows[scenario]?.[0]?.id || 'initial_contact';
        this.history = [];
        this.completedPhases = [];

        return this.getCurrentState();
    }

    /**
     * Update state based on communication
     */
    update(pilotMessage, atcMessage) {
        if (!this.scenario || this.currentPhase === 'complete') return this.getCurrentState();
        this.history.push({
            timestamp: new Date(),
            pilot: pilotMessage,
            atc: atcMessage,
            phase: this.currentPhase
        });

        // Analyze messages to determine if we should advance
        const nextPhase = this.getNextPhase(pilotMessage, atcMessage);
        if (nextPhase && nextPhase !== this.currentPhase) {
            if (!this.completedPhases.includes(this.currentPhase)) this.completedPhases.push(this.currentPhase);
            this.currentPhase = nextPhase;
        }

        return this.getCurrentState();
    }

    /**
     * Determine if phase should advance based on communications
     */
    shouldAdvancePhase(pilotMessage, atcMessage) {
        const next = this.getNextPhase(pilotMessage, atcMessage);
        return Boolean(next && next !== this.currentPhase);
    }

    getNextPhase(pilotMessage, atcMessage) {
        if (typeof pilotMessage !== 'string' || typeof atcMessage !== 'string') return null;
        const pilot = pilotMessage.toLowerCase();
        const atc = atcMessage.toLowerCase();
        const phase = this.currentPhase;
        if (!pilot.trim() || !atc.trim() || phase === 'complete') return null;

        // A response can contain the clearance and the next instruction together.
        // Move to the action now expected, without discarding either instruction.
        if (this.scenario === 'pattern_work') {
            if (/\b(clear of|runway vacated|off the runway)\b/.test(pilot)) return 'complete';
            if (['initial_contact', 'departure_ready'].includes(phase)) {
                if (atc.includes('cleared for takeoff')) return 'takeoff_clearance';
                if (pilot.includes('ready')) return 'departure_ready';
            }
            if (phase === 'takeoff_clearance' && pilot.includes('cleared for takeoff')) return 'crosswind';
            if (['crosswind', 'downwind', 'landing'].includes(phase) && pilot.includes('downwind')) return 'base';
            if (phase === 'crosswind' && pilot.includes('crosswind')) return 'downwind';
            if (phase === 'base' && pilot.includes('base')) return 'final';
            if (['base', 'final'].includes(phase) && (pilot.includes('final') || pilot.includes('cleared to land'))) return 'landing';
            if (phase === 'landing' && pilot.includes('touch and go')) return 'downwind';
        }
        if (this.scenario === 'ground_operations') {
            if (['initial_contact', 'taxi_clearance'].includes(phase)) {
                if (phase === 'initial_contact' && atc.includes('taxi')) return 'taxi_clearance';
                if (phase === 'taxi_clearance' && pilot.includes('taxi') && /hold(?:ing)? short/.test(pilot)) return 'taxiing';
            }
            if (['taxiing', 'holding_short', 'taxi_clearance'].includes(phase) && /contact (?:\w+ )?tower/.test(atc)) return 'contact_tower';
            if (phase === 'taxiing' && /hold(?:ing)? short/.test(pilot)) return 'holding_short';
            if (phase === 'contact_tower' && /\b(tower|contact|1[12]\d\.\d+)\b/.test(pilot)) return 'complete';
        }
        if (this.scenario === 'flight_following') {
            if (phase === 'frequency_change' && /\b(contact|frequency|roger|1[12]\d\.\d+)\b/.test(pilot)) return 'complete';
            if (phase !== 'initial_request' && /\b(contact (?!established)|frequency change|radar service terminated)\b/.test(atc) && !atc.includes('radar contact')) return 'frequency_change';
            if (phase === 'initial_request' && atc.includes('squawk')) return 'radar_contact';
            if (phase === 'initial_request' && atc.includes('radar contact')) return 'enroute';
            if (phase === 'radar_contact' && /\b(squawk|radar contact)\b/.test(pilot + ' ' + atc)) return 'enroute';
            if (phase === 'enroute' && /report (?:your )?position/.test(atc)) return 'position_report';
            if (phase === 'position_report' && /\b(position|miles|level|north|south|east|west)\b/.test(pilot)) return 'enroute';
        }
        if (this.scenario === 'emergency') {
            if (phase === 'emergency_declaration' && /\b(emergency|mayday|pan pan)\b/.test(pilot)) return 'provide_info';
            if (phase === 'provide_info' && /\b(souls|persons|people|on board)\b/.test(pilot) && pilot.includes('fuel')) {
                return /\b(cleared|vectors|heading)\b/.test(atc) ? 'resolution' : 'assistance';
            }
            if (phase === 'assistance' && /\b(cleared|vectors|heading)\b/.test(atc)) return 'resolution';
            if (phase === 'resolution' && /\b(landed|on the ground|clear of|emergency resolved)\b/.test(pilot)) return 'complete';
        }
        return null;
    }

    /**
     * Advance to next phase
     */
    advancePhase() {
        const flow = this.stateFlows[this.scenario];
        if (!flow) return;

        const currentIndex = flow.findIndex(p => p.id === this.currentPhase);
        if (currentIndex === -1) return;

        this.completedPhases.push(this.currentPhase);

        const currentPhaseObj = flow[currentIndex];
        const nextPhaseId = currentPhaseObj.next;

        // Find next phase in flow
        const nextPhase = flow.find(p => p.id === nextPhaseId);
        if (nextPhaseId === 'complete') {
            this.currentPhase = 'complete';
        } else if (nextPhase) {
            this.currentPhase = nextPhase.id;
        }
    }

    /**
     * Get current state information
     */
    getCurrentState() {
        const flow = this.stateFlows[this.scenario] || [];
        const currentPhaseObj = flow.find(p => p.id === this.currentPhase);
        const expectations = this.getExpectations();

        return {
            scenario: this.scenario,
            phase: this.currentPhase,
            phaseName: this.currentPhase === 'complete' ? 'Practice Complete' : (currentPhaseObj?.name || 'Not Started'),
            phaseNumber: this.currentPhase === 'complete' ? flow.length : flow.findIndex(p => p.id === this.currentPhase) + 1,
            totalPhases: flow.length,
            expectations,
            completedPhases: [...this.completedPhases],
            progress: this.getProgress()
        };
    }

    /**
     * Calculate progress percentage
     */
    getProgress() {
        const flow = this.stateFlows[this.scenario] || [];
        if (flow.length === 0) return 0;
        if (this.currentPhase === 'complete') return 100;

        const currentIndex = flow.findIndex(p => p.id === this.currentPhase);
        return Math.max(0, Math.round((currentIndex / flow.length) * 100));
    }

    /**
     * Get contextual hint for current phase
     */
    getCurrentHint() {
        const expectations = this.getExpectations();
        if (!expectations) return null;

        return {
            phase: this.currentPhase,
            shouldDo: expectations.pilot_should,
            example: expectations.example,
            atcWillDo: expectations.atc_typically
        };
    }

    getExpectations() {
        if (this.currentPhase === 'initial_contact' && this.scenario === 'pattern_work') return {
            pilot_should: 'Contact tower with callsign, runway, and intentions',
            example: 'Metro Tower, Cessna 12345, ready for departure runway 27, remaining in the pattern',
            atc_typically: 'Issues instructions or a takeoff clearance'
        };
        const additional = {
            crosswind: ['Report downwind when requested', 'Cessna 12345, left downwind runway 27'],
            taxiing: ['Follow the taxi clearance and report holding short', 'Cessna 12345, holding short runway 27'],
            contact_tower: ['Read back the assigned tower frequency', 'Contact tower 118.3, Cessna 12345'],
            initial_request: ['Request VFR flight following', 'Approach, Cessna 12345, request VFR flight following'],
            radar_contact: ['Read back the assigned squawk code', 'Squawk 4521, Cessna 12345'],
            enroute: ['Listen for traffic advisories and further instructions', 'Cessna 12345, traffic in sight'],
            position_report: ['Report your position and altitude', 'Cessna 12345, 10 miles north, level 4,500'],
            frequency_change: ['Acknowledge the frequency change', 'Contact approach 124.35, Cessna 12345'],
            emergency_declaration: ['State the emergency, callsign, and assistance needed', 'Mayday, Cessna 12345, engine failure, request assistance'],
            provide_info: ['Provide persons on board and fuel remaining when requested', 'Cessna 12345, two persons on board, one hour fuel remaining'],
            assistance: ['State your intentions and respond to controller instructions', 'Cessna 12345, request vectors to the nearest airport'],
            resolution: ['Continue the practice emergency sequence', 'Cessna 12345, landed, emergency resolved'],
            landing: ['Report clear of the runway, or continue the practice pattern', 'Cessna 12345, clear of runway 27'],
            complete: ['Practice sequence complete. Review feedback or choose another scenario.', '']
        };
        if (this.phaseExpectations[this.currentPhase]) return this.phaseExpectations[this.currentPhase];
        const value = additional[this.currentPhase];
        return value ? { pilot_should: value[0], example: value[1], atc_typically: '' } : {};
    }

    /**
     * Reset state machine
     */
    reset() {
        this.currentPhase = null;
        this.scenario = null;
        this.history = [];
        this.completedPhases = [];
    }

    /**
     * Get session summary
     */
    getSummary() {
        return {
            scenario: this.scenario,
            totalExchanges: this.history.length,
            completedPhases: [...this.completedPhases],
            currentPhase: this.currentPhase,
            duration: this.history.length > 0 ?
                new Date() - this.history[0].timestamp : 0
        };
    }
}

// Create global instance
window.scenarioStateMachine = new ScenarioStateMachine();
