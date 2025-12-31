// Demo Conversations - Realistic ATC Examples for Training
// Each demo shows proper phraseology with scoring and feedback

const DEMO_CONVERSATIONS = {
    pattern_work_demo: {
        title: "Pattern Work - First Solo Flight",
        description: "Watch a complete traffic pattern with proper phraseology",
        difficulty: "Beginner",
        icon: "🛫",
        category: "pattern_work",
        scenarioId: "pattern_first_solo",
        exchanges: [
            {
                pilot: "Metro Tower, Cessna 12345, ready for departure runway 27, remaining in the pattern",
                atc: "Cessna 12345, Metro Tower, runway 27, cleared for takeoff, wind 270 at 8",
                score: 95,
                feedback: "Excellent initial call! You included all required elements:",
                highlights: [
                    "✓ Facility name (Metro Tower)",
                    "✓ Aircraft callsign (Cessna 12345)",
                    "✓ Position (ready for departure)",
                    "✓ Runway number (27)",
                    "✓ Intentions (remaining in the pattern)"
                ],
                tip: "On initial contact with tower, always state your position and intentions clearly."
            },
            {
                pilot: "Cleared for takeoff runway 27, Cessna 12345",
                atc: "Cessna 345, report left downwind",
                score: 100,
                feedback: "Perfect readback! Critical safety items MUST be read back:",
                highlights: [
                    "✓ Takeoff clearance",
                    "✓ Runway number (27)",
                    "✓ Callsign"
                ],
                tip: "FAA requires reading back runway assignments. This prevents wrong-runway takeoffs.",
                critical: true
            },
            {
                pilot: "Metro Tower, Cessna 12345, left downwind runway 27, touch and go",
                atc: "Cessna 345, number one, cleared touch and go runway 27",
                score: 95,
                feedback: "Great position report!",
                highlights: [
                    "✓ Callsign",
                    "✓ Position (left downwind)",
                    "✓ Runway (27)",
                    "✓ Intentions (touch and go)"
                ],
                tip: "State your intentions early so ATC can plan. 'Touch and go' vs 'full stop' matters!"
            },
            {
                pilot: "Cleared touch and go runway 27, Cessna 12345",
                atc: "Cessna 345, wind 270 at 7",
                score: 100,
                feedback: "Perfect! You're flying like a pro.",
                highlights: [
                    "✓ Proper readback format",
                    "✓ Concise transmission"
                ],
                tip: "After touch and go, you'll report downwind again to continue pattern practice."
            }
        ]
    },

    ground_ops_demo: {
        title: "Ground Operations - First Taxi",
        description: "Learn proper ground control communications",
        difficulty: "Beginner",
        icon: "🚖",
        category: "ground_operations",
        scenarioId: "ground_first_taxi",
        exchanges: [
            {
                pilot: "Metro Ground, Cessna 12345, at the FBO with information Alpha, ready to taxi",
                atc: "Cessna 12345, Metro Ground, taxi to runway 27 via Alpha, hold short",
                score: 95,
                feedback: "Great initial call! Including ATIS information is important.",
                highlights: [
                    "✓ Facility (Metro Ground)",
                    "✓ Callsign",
                    "✓ Location (at the FBO)",
                    "✓ ATIS letter (Alpha) - Critical!",
                    "✓ Ready to taxi"
                ],
                tip: "Always include the current ATIS/AWOS letter on initial contact with ground control."
            },
            {
                pilot: "Taxi runway 27 via Alpha, hold short, Cessna 12345",
                atc: "Cessna 345, readback correct",
                score: 100,
                feedback: "PERFECT readback! This is safety-critical.",
                highlights: [
                    "✓ Taxi route (via Alpha)",
                    "✓ Destination runway (27)",
                    "✓ Hold short instruction",
                    "✓ Callsign"
                ],
                tip: "Reading back hold-short prevents runway incursions - the #1 cause of airport accidents.",
                critical: true
            },
            {
                pilot: "Cessna 12345, holding short runway 27",
                atc: "Cessna 345, contact Tower 118.3",
                score: 95,
                feedback: "Good position report. Ready to switch frequencies.",
                highlights: [
                    "✓ Callsign",
                    "✓ Position (holding short runway 27)"
                ],
                tip: "When you reach the hold-short line, report your position. ATC may give you a frequency change."
            }
        ]
    },

    flight_following_demo: {
        title: "Flight Following - Initial Request",
        description: "Request VFR radar services",
        difficulty: "Intermediate",
        icon: "📡",
        category: "flight_following",
        scenarioId: "ff_initial_request",
        exchanges: [
            {
                pilot: "Seattle Center, Cessna 12345, request VFR flight following",
                atc: "Cessna 12345, Seattle Center, squawk 4521 and say your request",
                score: 75,
                feedback: "Good start, but you can save a radio exchange by including more details upfront.",
                highlights: [
                    "✓ Facility (Seattle Center)",
                    "✓ Callsign",
                    "✓ Request stated",
                    "✗ Missing: position, altitude, destination"
                ],
                tip: "Better initial call: 'Seattle Center, Cessna 12345, 20 south of Seattle, 4,500, VFR to Portland, request flight following'",
                improvement: true
            },
            {
                pilot: "Cessna 12345, squawking 4521, 20 miles south of Seattle at 4,500, VFR to Portland",
                atc: "Cessna 345, radar contact 22 miles south of Seattle, VFR flight following approved, proceed on course",
                score: 95,
                feedback: "Excellent! You provided all required information.",
                highlights: [
                    "✓ Squawk code readback (4521)",
                    "✓ Position (20 miles south of Seattle)",
                    "✓ Altitude (4,500)",
                    "✓ Destination (Portland)"
                ],
                tip: "ATC now has you on radar and will provide traffic advisories for your flight."
            },
            {
                pilot: "Cessna 12345, traffic in sight",
                atc: "Cessna 345, roger, traffic no factor",
                score: 100,
                feedback: "Perfect response to traffic call!",
                highlights: [
                    "✓ Callsign",
                    "✓ Traffic acknowledgment"
                ],
                tip: "Always acknowledge traffic calls. If you don't see it, say 'negative contact' or 'looking'."
            }
        ]
    },

    emergency_demo: {
        title: "Emergency - Engine Trouble",
        description: "Proper emergency communications (study only - don't practice without instructor)",
        difficulty: "Advanced",
        icon: "⚠️",
        category: "emergency",
        scenarioId: "emerg_engine_failure",
        exchanges: [
            {
                pilot: "Mayday mayday mayday, Metro Tower, Cessna 12345, engine rough, 5 miles north, request immediate landing",
                atc: "Cessna 12345, Metro Tower, roger mayday, runway 27 available, say souls and fuel",
                score: 100,
                feedback: "PERFECT emergency call! You included all critical elements.",
                highlights: [
                    "✓ Mayday x3 (declares emergency)",
                    "✓ Facility (Metro Tower)",
                    "✓ Callsign",
                    "✓ Nature of emergency (engine rough)",
                    "✓ Position (5 miles north)",
                    "✓ Intentions (immediate landing)"
                ],
                tip: "Remember: Aviate, Navigate, Communicate. Don't sacrifice flying the plane to talk on radio.",
                critical: true
            },
            {
                pilot: "Cessna 12345, 2 souls on board, 1 hour fuel",
                atc: "Cessna 345, cleared to land any runway, emergency equipment standing by, say your intentions",
                score: 100,
                feedback: "Provided critical information quickly. Well done.",
                highlights: [
                    "✓ Souls on board (2)",
                    "✓ Fuel remaining (1 hour)"
                ],
                tip: "ATC is prioritizing your landing. Emergency equipment is ready. Focus on flying the aircraft safely."
            },
            {
                pilot: "Cleared to land runway 27, attempting engine restart, Cessna 12345",
                atc: "Cessna 345, roger, keep us advised, emergency equipment rolling",
                score: 95,
                feedback: "Good update on your actions. ATC is standing by to help.",
                highlights: [
                    "✓ Readback of clearance",
                    "✓ Status update (attempting restart)"
                ],
                tip: "In emergencies, brief updates help ATC coordinate assistance. But flying the plane comes first!"
            }
        ]
    }
};

// Help Guide Content
const HELP_CONTENT = {
    interface_tour: {
        title: "Understanding the Interface",
        sections: [
            {
                heading: "1️⃣ Radio Panel",
                content: "Displays current frequency and transmission status. 🔴 = transmitting, 🟢 = receiving, ⚪ = ready.",
                icon: "📻"
            },
            {
                heading: "2️⃣ Quick Suggestions",
                content: "Pre-written transmissions for this scenario. Click any suggestion to auto-fill your input field. These are examples of proper phraseology - use them to learn!",
                icon: "💡"
            },
            {
                heading: "3️⃣ Feedback Panel (Beginner Mode)",
                content: "Shows real-time scoring and tips after each transmission. Feedback detail adjusts based on your difficulty level in Settings.",
                icon: "📊"
            },
            {
                heading: "4️⃣ Visual Aids",
                content: "Airport diagram, progress tracker, and wind indicator help with situational awareness. Toggle show/hide in the interface.",
                icon: "🗺️"
            }
        ]
    },

    difficulty_levels: {
        title: "Choose Your Experience Level",
        levels: [
            {
                name: "🎓 Student Pilot (Beginner)",
                features: [
                    "Detailed feedback every transmission",
                    "Suggestions always visible",
                    "Step-by-step guidance",
                    "Full explanations of errors"
                ],
                bestFor: "Learning phraseology from scratch"
            },
            {
                name: "✈️ Private Pilot (Intermediate)",
                features: [
                    "Moderate feedback on key items",
                    "Suggestions available",
                    "Hints instead of full examples",
                    "Focus on safety-critical items"
                ],
                bestFor: "Building confidence and fluency"
            },
            {
                name: "👨‍✈️ Experienced Pilot (Advanced)",
                features: [
                    "Minimal feedback (safety-critical only)",
                    "No suggestions shown",
                    "Realistic ATC experience",
                    "Challenging scenarios"
                ],
                bestFor: "Realistic practice and proficiency"
            }
        ],
        note: "Change your difficulty level anytime in Settings ⚙️"
    },

    phraseology_tips: {
        title: "Radio Phraseology Essentials",
        dos: [
            "Always identify yourself (callsign)",
            "State facility name on initial contact",
            "Read back runway assignments",
            "Read back hold-short instructions",
            "Be concise and clear (10-15 words ideal)",
            "Use standard phrases (roger, wilco, affirm)"
        ],
        donts: [
            "Say 'please' or 'thank you' (wastes frequency time)",
            "Use 'with you' (just state position)",
            "Say 'we are' (use your callsign)",
            "Be verbose or chatty",
            "Use slang or informal language",
            "Use 'uh' or 'um' (pause instead)"
        ],
        readbacks: [
            "Runway assignments (takeoff/landing)",
            "Altitude assignments",
            "Heading assignments",
            "Squawk codes",
            "Hold short instructions",
            "Taxi routes"
        ],
        note: "FAA Aeronautical Information Manual (AIM) 4-4-7 requires reading back these items to prevent miscommunication."
    },

    scenario_categories: {
        title: "Training Categories",
        categories: [
            {
                name: "🛫 Pattern Work",
                frequency: "118.300 MHz",
                scenarios: 5,
                focus: "Takeoff, landing, and traffic pattern operations at Class D airports",
                skills: "Position reports, clearance readbacks, sequencing with traffic"
            },
            {
                name: "🚖 Ground Operations",
                frequency: "121.900 MHz",
                scenarios: 5,
                focus: "Taxi clearances, runway crossings, and ramp operations",
                skills: "Reading back taxi routes, hold-short procedures, progressive taxi"
            },
            {
                name: "📡 Flight Following",
                frequency: "124.350 MHz",
                scenarios: 5,
                focus: "VFR flight following with approach/center controllers",
                skills: "Initial requests, position reports, traffic advisories, Class B transitions"
            },
            {
                name: "⚠️ Emergency Procedures",
                frequency: "121.500 MHz (Emergency)",
                scenarios: 5,
                focus: "Emergency declarations and priority handling",
                skills: "Mayday calls, providing souls/fuel, maintaining aircraft control"
            }
        ]
    }
};

// Export for use in demo-onboarding.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DEMO_CONVERSATIONS, HELP_CONTENT };
}
