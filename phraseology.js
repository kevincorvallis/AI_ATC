// Aviation Phraseology Validation and Analysis Engine
// Validates pilot transmissions against FAA AIM Chapter 4-2 standards

class PhraseologyValidator {
    constructor() {
        // Required elements for different communication types
        this.requiredElements = {
            initial_contact: {
                elements: ['facility', 'callsign', 'request'],
                description: 'Initial contact requires: facility name, aircraft callsign, and request'
            },
            position_report: {
                elements: ['callsign', 'position'],
                description: 'Position report requires: callsign and position'
            },
            readback: {
                elements: ['callsign', 'readback_content'],
                description: 'Readback requires: callsign and acknowledgment of instruction'
            },
            request: {
                elements: ['callsign', 'request'],
                description: 'Request requires: callsign and clear request'
            }
        };

        // Critical items that MUST be read back per FAA AIM 4-4-7
        this.criticalReadbackItems = [
            'runway',
            'hold short',
            'cleared',
            'altitude',
            'heading',
            'squawk',
            'frequency',
            'taxi route'
        ];

        // Common phraseology errors
        this.commonErrors = {
            'please': 'Avoid "please" - be direct and concise',
            'thank you': 'Avoid "thank you" - acknowledge with callsign only',
            'thanks': 'Avoid "thanks" - acknowledge with callsign only',
            'we are': 'Use active voice: "Cessna 123 is..." not "we are"',
            'we\'re': 'Use active voice with callsign',
            'can we': 'Use "request" instead of "can we"',
            'may we': 'Use "request" instead of "may we"',
            'could we': 'Use "request" instead of "could we"',
            'with you': 'Avoid "with you" - just state position and altitude'
        };

        // Standard phraseology patterns
        this.standardPhrases = {
            affirmative: 'affirmative',
            negative: 'negative',
            roger: 'roger',
            wilco: 'wilco',
            unable: 'unable',
            standby: 'standby'
        };
    }

    /**
     * Main validation function - analyzes a pilot transmission
     */
    validateTransmission(message, context = {}) {
        const analysis = {
            valid: true,
            score: 100,
            feedback: [],
            warnings: [],
            criticalIssues: [],
            suggestions: [],
            detectedElements: {},
            communicationType: this.detectCommunicationType(message, context)
        };

        // Detect components
        analysis.detectedElements = this.detectElements(message);

        // Check for common errors
        this.checkCommonErrors(message, analysis);

        // Validate required elements based on communication type
        this.validateRequiredElements(message, analysis, context);

        // Check for critical readback items if ATC gave instruction
        if (context.lastATCMessage) {
            this.validateReadback(message, context.lastATCMessage, analysis);
        }

        // Check brevity (radio discipline)
        this.checkBrevity(message, analysis);

        // Check for proper callsign usage
        this.validateCallsign(message, analysis, context);

        // Calculate final score
        analysis.score = this.calculateScore(analysis);
        analysis.valid = analysis.criticalIssues.length === 0;

        return analysis;
    }

    /**
     * Detect what type of communication this is
     */
    detectCommunicationType(message, context) {
        const msg = message.toLowerCase();

        // Check if this is a readback (responding to ATC)
        if (context.lastATCMessage) {
            const atcMsg = context.lastATCMessage.toLowerCase();
            if (atcMsg.includes('cleared') || atcMsg.includes('hold short') ||
                atcMsg.includes('taxi') || atcMsg.includes('contact')) {
                return 'readback';
            }
        }

        // Initial contact patterns
        if (msg.includes('ready') || msg.includes('request') ||
            (msg.includes('tower') && !context.inConversation) ||
            (msg.includes('ground') && !context.inConversation) ||
            (msg.includes('center') && !context.inConversation)) {
            return 'initial_contact';
        }

        // Position report patterns
        if (msg.includes('downwind') || msg.includes('base') ||
            msg.includes('final') || msg.includes('crosswind') ||
            msg.includes('level') || msg.includes('miles')) {
            return 'position_report';
        }

        // Request patterns
        if (msg.includes('request')) {
            return 'request';
        }

        return 'general';
    }

    /**
     * Detect elements present in transmission
     */
    detectElements(message) {
        const elements = {
            hasCallsign: false,
            hasFacility: false,
            hasPosition: false,
            hasAltitude: false,
            hasRequest: false,
            hasReadback: false,
            hasRunway: false
        };

        const msg = message.toLowerCase();

        // Callsign detection (N-numbers or names with numbers)
        if (/\b[nN]-?\d{1,5}[a-zA-Z]{0,2}\b/.test(message) ||
            /\b(cessna|skyhawk|piper|cherokee|cirrus|beech|mooney|diamond)\s*\d+/i.test(message)) {
            elements.hasCallsign = true;
        }

        // Facility detection
        if (msg.includes('tower') || msg.includes('ground') ||
            msg.includes('center') || msg.includes('approach') ||
            msg.includes('departure') || msg.includes('clearance')) {
            elements.hasFacility = true;
        }

        // Position detection
        if (msg.includes('downwind') || msg.includes('base') || msg.includes('final') ||
            msg.includes('crosswind') || msg.includes('upwind') || msg.includes('miles') ||
            msg.includes('north') || msg.includes('south') || msg.includes('east') || msg.includes('west')) {
            elements.hasPosition = true;
        }

        // Altitude detection
        if (/\d{1,5}\s*(feet|ft|thousand)?\b/i.test(message) &&
            (msg.includes('level') || msg.includes('altitude') || msg.includes('climbing') || msg.includes('descending'))) {
            elements.hasAltitude = true;
        }

        // Request detection
        if (msg.includes('request') || msg.includes('ready')) {
            elements.hasRequest = true;
        }

        // Readback detection
        if (msg.includes('roger') || msg.includes('wilco') ||
            msg.includes('cleared') || msg.includes('holding')) {
            elements.hasReadback = true;
        }

        // Runway detection
        if (/runway\s*\d{1,2}[LCR]?/i.test(message)) {
            elements.hasRunway = true;
        }

        return elements;
    }

    /**
     * Check for common phraseology errors
     */
    checkCommonErrors(message, analysis) {
        const msg = message.toLowerCase();

        for (const [error, correction] of Object.entries(this.commonErrors)) {
            if (msg.includes(error)) {
                analysis.feedback.push({
                    type: 'error',
                    severity: 'medium',
                    message: correction,
                    detected: error
                });
                analysis.score -= 5;
            }
        }
    }

    /**
     * Validate required elements are present
     */
    validateRequiredElements(message, analysis, context) {
        const commType = analysis.communicationType;
        const required = this.requiredElements[commType];

        if (!required) return; // No specific requirements for this type

        const elements = analysis.detectedElements;

        // Check for callsign (almost always required)
        if (!elements.hasCallsign && commType !== 'general') {
            analysis.criticalIssues.push({
                type: 'missing_element',
                severity: 'critical',
                message: 'Missing aircraft callsign - always identify yourself',
                suggestion: 'Start with: "[Facility], [Your Callsign], ..."'
            });
            analysis.score -= 20;
        }

        // Check for facility on initial contact
        if (commType === 'initial_contact' && !elements.hasFacility) {
            analysis.warnings.push({
                type: 'missing_element',
                severity: 'medium',
                message: 'Consider stating facility name on initial contact',
                suggestion: 'Example: "Metro Tower, Cessna 12345, ..."'
            });
            analysis.score -= 10;
        }

        // Check for position on position reports
        if (commType === 'position_report' && !elements.hasPosition) {
            analysis.criticalIssues.push({
                type: 'missing_element',
                severity: 'critical',
                message: 'Position report missing location',
                suggestion: 'State your position: "left downwind", "10 miles north", etc.'
            });
            analysis.score -= 15;
        }
    }

    /**
     * Validate readback of critical items
     */
    validateReadback(pilotMessage, atcMessage, analysis) {
        const atcLower = atcMessage.toLowerCase();
        const pilotLower = pilotMessage.toLowerCase();

        const criticalItemsInATC = [];

        // Check which critical items ATC mentioned
        for (const item of this.criticalReadbackItems) {
            if (atcLower.includes(item)) {
                criticalItemsInATC.push(item);
            }
        }

        // Verify pilot read back each critical item
        for (const item of criticalItemsInATC) {
            if (item === 'runway') {
                // Extract runway number from ATC message
                const runwayMatch = atcMessage.match(/runway\s*(\d{1,2}[LCR]?)/i);
                if (runwayMatch) {
                    const runway = runwayMatch[1];
                    if (!pilotLower.includes(runway.toLowerCase())) {
                        analysis.criticalIssues.push({
                            type: 'missing_readback',
                            severity: 'critical',
                            message: `CRITICAL: Must read back runway assignment (${runway})`,
                            suggestion: `Include in readback: "Runway ${runway}, Cessna 12345"`
                        });
                        analysis.score -= 25;
                    }
                }
            }

            if (item === 'hold short' && !pilotLower.includes('hold short')) {
                analysis.criticalIssues.push({
                    type: 'missing_readback',
                    severity: 'critical',
                    message: 'CRITICAL: Must read back hold short instructions',
                    suggestion: 'Read back: "Hold short runway 27, Cessna 12345"'
                });
                analysis.score -= 25;
            }

            if (item === 'cleared' && !pilotLower.includes('cleared') && !pilotLower.includes(item)) {
                analysis.warnings.push({
                    type: 'missing_readback',
                    severity: 'high',
                    message: 'Should read back clearances',
                    suggestion: 'Acknowledge: "Cleared to land/takeoff, [Callsign]"'
                });
                analysis.score -= 10;
            }

            if (item === 'squawk') {
                // Extract squawk code
                const squawkMatch = atcMessage.match(/squawk\s*(\d{4})/i);
                if (squawkMatch) {
                    const code = squawkMatch[1];
                    if (!pilotMessage.includes(code)) {
                        analysis.warnings.push({
                            type: 'missing_readback',
                            severity: 'high',
                            message: `Should read back squawk code (${code})`,
                            suggestion: `"Squawk ${code}, [Callsign]"`
                        });
                        analysis.score -= 15;
                    }
                }
            }
        }
    }

    /**
     * Check brevity - transmissions should be concise
     */
    checkBrevity(message, analysis) {
        const wordCount = message.trim().split(/\s+/).length;

        if (wordCount > 25) {
            analysis.feedback.push({
                type: 'brevity',
                severity: 'low',
                message: 'Transmission is lengthy - consider being more concise',
                suggestion: 'Radio discipline: keep transmissions brief and clear'
            });
            analysis.score -= 5;
        }

        // Check for excessive words
        const excessiveWords = ['very', 'really', 'actually', 'basically', 'um', 'uh', 'like'];
        const msgLower = message.toLowerCase();

        excessiveWords.forEach(word => {
            if (msgLower.includes(word)) {
                analysis.feedback.push({
                    type: 'brevity',
                    severity: 'low',
                    message: `Avoid filler words like "${word}"`,
                    suggestion: 'Keep transmissions professional and direct'
                });
                analysis.score -= 3;
            }
        });
    }

    /**
     * Validate callsign usage
     */
    validateCallsign(message, analysis, context) {
        if (!analysis.detectedElements.hasCallsign) {
            return; // Already flagged as critical
        }

        // Check if callsign is at appropriate position
        const words = message.trim().split(/\s+/);
        const callsignPattern = /\b[nN]-?\d{1,5}[a-zA-Z]{0,2}\b|(cessna|skyhawk|piper|cherokee|cirrus|beech|mooney|diamond)\s*\d+/i;

        let callsignPosition = -1;
        words.forEach((word, i) => {
            if (callsignPattern.test(word + (words[i+1] || ''))) {
                callsignPosition = i;
            }
        });

        // Callsign should typically be in first 3-5 words
        if (callsignPosition > 5) {
            analysis.suggestions.push({
                type: 'structure',
                severity: 'low',
                message: 'Callsign typically comes early in transmission',
                suggestion: 'Format: "[Facility], [Callsign], [Message]"'
            });
        }
    }

    /**
     * Calculate final score
     */
    calculateScore(analysis) {
        let score = analysis.score;

        // Ensure score doesn't go below 0
        score = Math.max(0, score);

        // Ensure score doesn't go above 100
        score = Math.min(100, score);

        return Math.round(score);
    }

    /**
     * Get performance rating based on score
     */
    getPerformanceRating(score) {
        if (score >= 95) return { rating: 'Excellent', color: '#00ff00', icon: '⭐⭐⭐' };
        if (score >= 85) return { rating: 'Good', color: '#90ee90', icon: '⭐⭐' };
        if (score >= 70) return { rating: 'Satisfactory', color: '#ffff00', icon: '⭐' };
        if (score >= 50) return { rating: 'Needs Improvement', color: '#ffa500', icon: '⚠️' };
        return { rating: 'Unsatisfactory', color: '#ff0000', icon: '❌' };
    }

    /**
     * Generate contextual suggestions based on scenario state
     */
    generateContextualSuggestions(scenarioState, difficulty = 'beginner') {
        const suggestions = [];
        const { phase, scenario } = scenarioState;

        // Difficulty-based suggestions
        if (difficulty === 'beginner') {
            // Show full example transmissions
            switch (phase) {
                case 'pre_taxi':
                    suggestions.push({
                        text: 'Metro Ground, Cessna 12345, at the ramp, ready to taxi with information Alpha',
                        why: 'Initial ground contact includes: facility, callsign, location, intentions, ATIS'
                    });
                    break;
                case 'holding_short':
                    suggestions.push({
                        text: 'Metro Tower, Cessna 12345, ready for departure runway 27',
                        why: 'When switching to tower, state readiness and runway'
                    });
                    break;
                case 'downwind':
                    suggestions.push({
                        text: 'Metro Tower, Cessna 12345, left downwind runway 27',
                        why: 'Position reports state: facility (optional), callsign, position, runway'
                    });
                    break;
            }
        } else if (difficulty === 'intermediate') {
            // Show hints, not full transmissions
            switch (phase) {
                case 'pre_taxi':
                    suggestions.push({
                        text: 'Include: facility, callsign, location, intentions, ATIS letter',
                        why: 'Provide all required information for taxi clearance'
                    });
                    break;
            }
        }
        // Advanced shows no suggestions

        return suggestions;
    }
}

// Create global instance
window.phraseologyValidator = new PhraseologyValidator();
