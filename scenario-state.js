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
        this.history.push({
            timestamp: new Date(),
            pilot: pilotMessage,
            atc: atcMessage,
            phase: this.currentPhase
        });

        // Analyze messages to determine if we should advance
        const shouldAdvance = this.shouldAdvancePhase(pilotMessage, atcMessage);

        if (shouldAdvance) {
            this.advancePhase();
        }

        return this.getCurrentState();
    }

    /**
     * Determine if phase should advance based on communications
     */
    shouldAdvancePhase(pilotMessage, atcMessage) {
        if (!pilotMessage || !atcMessage) return false;

        const pilot = pilotMessage.toLowerCase();
        const atc = atcMessage.toLowerCase();
        const phase = this.currentPhase;

        // Pattern work transitions
        if (this.scenario === 'pattern_work') {
            if (phase === 'initial_contact' && pilot.includes('ready')) return true;
            if (phase === 'departure_ready' && atc.includes('cleared for takeoff')) return true;
            if (phase === 'takeoff_clearance' && pilot.includes('cleared')) return true;
            if (phase === 'crosswind' || (atc.includes('report') && atc.includes('downwind'))) return true;
            if (phase === 'downwind' && (pilot.includes('base') || atc.includes('base'))) return true;
            if (phase === 'base' && (pilot.includes('final') || atc.includes('final') || atc.includes('cleared to land'))) return true;
            if (phase === 'final' && atc.includes('cleared to land')) return true;
            if (phase === 'landing' && (pilot.includes('downwind') || pilot.includes('clear'))) return true;
        }

        // Ground operations transitions
        if (this.scenario === 'ground_operations') {
            if (phase === 'initial_contact' && atc.includes('taxi')) return true;
            if (phase === 'taxi_clearance' && pilot.includes('taxi')) return true;
            if (phase === 'taxiing' && pilot.includes('holding short')) return true;
            if (phase === 'holding_short' && atc.includes('contact tower')) return true;
        }

        // Flight following transitions
        if (this.scenario === 'flight_following') {
            if (phase === 'initial_request' && atc.includes('squawk')) return true;
            if (phase === 'radar_contact' || (atc.includes('radar contact'))) return true;
            if (phase === 'enroute' && (pilot.includes('position') || pilot.includes('level'))) return true;
        }

        // Emergency transitions
        if (this.scenario === 'emergency') {
            if (phase === 'emergency_declaration' && atc.includes('emergency')) return true;
            if (phase === 'provide_info' && pilot.includes('souls')) return true;
            if (phase === 'assistance' && (atc.includes('cleared') || atc.includes('vectors'))) return true;
        }

        return false;
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
        if (nextPhase) {
            this.currentPhase = nextPhase.id;
        }
    }

    /**
     * Get current state information
     */
    getCurrentState() {
        const flow = this.stateFlows[this.scenario] || [];
        const currentPhaseObj = flow.find(p => p.id === this.currentPhase);
        const expectations = this.phaseExpectations[this.currentPhase] || {};

        return {
            scenario: this.scenario,
            phase: this.currentPhase,
            phaseName: currentPhaseObj?.name || 'Unknown',
            phaseNumber: flow.findIndex(p => p.id === this.currentPhase) + 1,
            totalPhases: flow.length,
            expectations,
            completedPhases: this.completedPhases,
            progress: this.getProgress()
        };
    }

    /**
     * Calculate progress percentage
     */
    getProgress() {
        const flow = this.stateFlows[this.scenario] || [];
        if (flow.length === 0) return 0;

        const currentIndex = flow.findIndex(p => p.id === this.currentPhase);
        return Math.round(((currentIndex + 1) / flow.length) * 100);
    }

    /**
     * Get contextual hint for current phase
     */
    getCurrentHint() {
        const expectations = this.phaseExpectations[this.currentPhase];
        if (!expectations) return null;

        return {
            phase: this.currentPhase,
            shouldDo: expectations.pilot_should,
            example: expectations.example,
            atcWillDo: expectations.atc_typically
        };
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
            completedPhases: this.completedPhases,
            currentPhase: this.currentPhase,
            duration: this.history.length > 0 ?
                new Date() - this.history[0].timestamp : 0
        };
    }
}

// Create global instance
window.scenarioStateMachine = new ScenarioStateMachine();
