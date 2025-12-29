import Foundation

// Real-world style ATC communication examples for training and demos
enum ATCExamples {

    // MARK: - Demo Conversations (Full exchanges)

    struct DemoConversation: Identifiable {
        let id = UUID()
        let title: String
        let description: String
        let category: Category
        let frequency: String
        let exchanges: [Exchange]
    }

    struct Exchange: Identifiable {
        let id = UUID()
        let speaker: Speaker
        let message: String
        let delay: Double // seconds before this message appears

        enum Speaker {
            case pilot
            case atc
            case system
        }
    }

    // MARK: - Pattern Work Demo

    static let patternWorkDemo = DemoConversation(
        title: "Solo Pattern at Metro",
        description: "Watch a complete traffic pattern from departure to landing",
        category: .patternWork,
        frequency: "118.300",
        exchanges: [
            Exchange(speaker: .system, message: "Metro Tower - Class D Airport\nRunway 27 in use, Wind 270 at 8", delay: 0),
            Exchange(speaker: .pilot, message: "Metro Tower, Skyhawk 4578 Quebec, at runway 27, ready for departure, remaining in the pattern.", delay: 2.0),
            Exchange(speaker: .atc, message: "Skyhawk 4578 Quebec, Metro Tower, runway 27, cleared for takeoff. Left traffic approved.", delay: 3.5),
            Exchange(speaker: .pilot, message: "Cleared for takeoff runway 27, left traffic, 78 Quebec.", delay: 2.0),
            Exchange(speaker: .system, message: "--- Aircraft departs and enters left crosswind ---", delay: 4.0),
            Exchange(speaker: .pilot, message: "Metro Tower, Skyhawk 78 Quebec, left crosswind departing.", delay: 3.0),
            Exchange(speaker: .atc, message: "Skyhawk 78 Quebec, roger, traffic is a Cessna on a two-mile final.", delay: 2.5),
            Exchange(speaker: .pilot, message: "Looking for traffic, 78 Quebec.", delay: 2.0),
            Exchange(speaker: .system, message: "--- Aircraft turns left downwind ---", delay: 3.0),
            Exchange(speaker: .pilot, message: "Metro Tower, Skyhawk 78 Quebec, left downwind runway 27, traffic in sight.", delay: 3.0),
            Exchange(speaker: .atc, message: "Skyhawk 78 Quebec, roger, number 2, follow the Cessna. Cleared to land runway 27.", delay: 3.0),
            Exchange(speaker: .pilot, message: "Number 2, traffic in sight, cleared to land 27, 78 Quebec.", delay: 2.5),
            Exchange(speaker: .system, message: "--- Aircraft turns base, then final ---", delay: 4.0),
            Exchange(speaker: .pilot, message: "Skyhawk 78 Quebec, short final runway 27.", delay: 3.0),
            Exchange(speaker: .atc, message: "Skyhawk 78 Quebec, wind 270 at 8, cleared to land.", delay: 2.0),
            Exchange(speaker: .system, message: "--- Aircraft lands and exits runway ---", delay: 4.0),
            Exchange(speaker: .pilot, message: "Metro Tower, Skyhawk 78 Quebec, clear of runway 27.", delay: 3.0),
            Exchange(speaker: .atc, message: "Skyhawk 78 Quebec, roger, contact ground 121.9. Good day.", delay: 2.5),
            Exchange(speaker: .pilot, message: "Ground on 121.9, 78 Quebec. Thanks for the help!", delay: 2.0),
        ]
    )

    // MARK: - Ground Operations Demo

    static let groundOpsDemo = DemoConversation(
        title: "Taxi at a Busy Airport",
        description: "Complex taxi with runway crossing at a Class C airport",
        category: .groundOperations,
        frequency: "121.900",
        exchanges: [
            Exchange(speaker: .system, message: "Metro Ground - Class C Airport\nRunway 27L/27R active, ATIS Information Bravo", delay: 0),
            Exchange(speaker: .pilot, message: "Metro Ground, Cherokee 9285 Foxtrot, at the Signature ramp with Bravo, request taxi to runway 27 Left.", delay: 2.0),
            Exchange(speaker: .atc, message: "Cherokee 9285 Foxtrot, Metro Ground, taxi to runway 27 Left via Alpha, Charlie, cross runway 27 Right.", delay: 3.5),
            Exchange(speaker: .pilot, message: "Taxi 27 Left via Alpha, Charlie, cross 27 Right, 85 Foxtrot.", delay: 2.5),
            Exchange(speaker: .system, message: "--- Aircraft taxis on Alpha, approaches runway 27R ---", delay: 4.0),
            Exchange(speaker: .pilot, message: "Metro Ground, Cherokee 85 Foxtrot, holding short runway 27 Right.", delay: 3.0),
            Exchange(speaker: .atc, message: "Cherokee 85 Foxtrot, hold short runway 27 Right, landing traffic.", delay: 2.5),
            Exchange(speaker: .pilot, message: "Holding short 27 Right, 85 Foxtrot.", delay: 2.0),
            Exchange(speaker: .system, message: "--- Boeing 737 lands on 27R ---", delay: 5.0),
            Exchange(speaker: .atc, message: "Cherokee 85 Foxtrot, cross runway 27 Right, contact Tower 118.3 when ready.", delay: 3.0),
            Exchange(speaker: .pilot, message: "Cross 27 Right, Tower when ready, 85 Foxtrot.", delay: 2.0),
            Exchange(speaker: .system, message: "--- Aircraft crosses runway and continues taxi ---", delay: 4.0),
            Exchange(speaker: .pilot, message: "Metro Ground, 85 Foxtrot, clear of 27 Right, continuing to 27 Left.", delay: 3.0),
            Exchange(speaker: .atc, message: "Cherokee 85 Foxtrot, roger, monitor Tower 118.3.", delay: 2.0),
        ]
    )

    // MARK: - Flight Following Demo

    static let flightFollowingDemo = DemoConversation(
        title: "Cross-Country with Flight Following",
        description: "VFR flight following with traffic advisories and handoffs",
        category: .flightFollowing,
        frequency: "124.350",
        exchanges: [
            Exchange(speaker: .system, message: "Seattle Center - 124.350\nEnroute from Seattle to Portland", delay: 0),
            Exchange(speaker: .pilot, message: "Seattle Center, Bonanza 271 Tango Mike, request VFR flight following.", delay: 2.0),
            Exchange(speaker: .atc, message: "Bonanza 271 Tango Mike, Seattle Center, say altitude and destination.", delay: 3.0),
            Exchange(speaker: .pilot, message: "Bonanza 71 Tango Mike is level at 7,500, destination Portland International, slant Golf.", delay: 2.5),
            Exchange(speaker: .atc, message: "Bonanza 71 Tango Mike, Seattle Center, squawk 4521, altimeter 30.12.", delay: 3.0),
            Exchange(speaker: .pilot, message: "Squawk 4521, 30.12, 71 Tango Mike.", delay: 2.0),
            Exchange(speaker: .atc, message: "Bonanza 71 Tango Mike, radar contact, 15 miles south of Seattle-Tacoma. Proceed on course, traffic advisories.", delay: 3.5),
            Exchange(speaker: .pilot, message: "Radar contact, proceeding on course, 71 Tango Mike.", delay: 2.0),
            Exchange(speaker: .system, message: "--- 20 minutes later, approaching Olympia ---", delay: 4.0),
            Exchange(speaker: .atc, message: "Bonanza 71 Tango Mike, traffic 11 o'clock, 5 miles, opposite direction, altitude indicates 6,500.", delay: 3.0),
            Exchange(speaker: .pilot, message: "Looking for traffic, 71 Tango Mike.", delay: 2.0),
            Exchange(speaker: .pilot, message: "Seattle Center, 71 Tango Mike, traffic in sight.", delay: 3.0),
            Exchange(speaker: .atc, message: "Bonanza 71 Tango Mike, roger. Contact Portland Approach 119.0. Good day.", delay: 3.0),
            Exchange(speaker: .pilot, message: "Portland Approach 119.0, thanks for the help. 71 Tango Mike.", delay: 2.5),
            Exchange(speaker: .system, message: "--- Pilot changes frequency to 119.0 ---", delay: 3.0),
            Exchange(speaker: .pilot, message: "Portland Approach, Bonanza 271 Tango Mike, level 7,500 with flight following from Seattle.", delay: 3.0),
            Exchange(speaker: .atc, message: "Bonanza 271 Tango Mike, Portland Approach, radar contact. Expect the visual approach runway 28 Left.", delay: 3.0),
        ]
    )

    // MARK: - Emergency Demo

    static let emergencyDemo = DemoConversation(
        title: "Engine Failure - Mayday",
        description: "Complete emergency declaration and handling",
        category: .emergency,
        frequency: "121.500",
        exchanges: [
            Exchange(speaker: .system, message: "EMERGENCY SCENARIO\n5,000 feet, 10 miles from Metro Airport\nEngine begins running rough, then quits", delay: 0),
            Exchange(speaker: .pilot, message: "MAYDAY, MAYDAY, MAYDAY. Metro Approach, Cessna 52834, engine failure, 10 miles northwest, 5,000 feet, request vectors to nearest runway!", delay: 3.0),
            Exchange(speaker: .atc, message: "Cessna 52834, Metro Approach, roger MAYDAY. Turn right heading 140, vectors to runway 27. Say souls on board and fuel remaining.", delay: 3.5),
            Exchange(speaker: .pilot, message: "Right to 140 for vectors, 2 souls, 3 hours fuel, Cessna 834.", delay: 2.5),
            Exchange(speaker: .atc, message: "Cessna 834, roger. Runway 27, 8 miles. Crash fire rescue has been notified. Can you maintain altitude?", delay: 3.0),
            Exchange(speaker: .pilot, message: "Negative, we're descending. Currently passing through 4,500, best glide.", delay: 2.5),
            Exchange(speaker: .atc, message: "Cessna 834, roger. Airport is at your 1 o'clock, 6 miles. All traffic is being cleared. You're cleared to land any runway.", delay: 3.5),
            Exchange(speaker: .pilot, message: "Airport in sight! Cleared to land any runway, 834.", delay: 2.0),
            Exchange(speaker: .atc, message: "Cessna 834, roger, airport in sight. Wind 270 at 5. Emergency equipment is standing by. You're doing great.", delay: 3.0),
            Exchange(speaker: .system, message: "--- Pilot makes a successful dead-stick landing ---", delay: 5.0),
            Exchange(speaker: .pilot, message: "Metro Tower, Cessna 834 is on the ground, runway 27. Everyone is okay. Thank you.", delay: 3.0),
            Exchange(speaker: .atc, message: "Cessna 834, glad to hear it. Remain on this frequency. Emergency vehicles are on their way. Welcome back.", delay: 3.0),
        ]
    )

    // MARK: - Busy Pattern (Multiple Aircraft)

    static let busyPatternDemo = DemoConversation(
        title: "Busy Pattern - Sequencing",
        description: "Multiple aircraft in the pattern with sequencing",
        category: .patternWork,
        frequency: "118.300",
        exchanges: [
            Exchange(speaker: .system, message: "Metro Tower - Pattern Work\n4 aircraft in the pattern, runway 27", delay: 0),
            Exchange(speaker: .atc, message: "Cessna 12345, extend downwind, I'll call your base. Sequence behind the Piper on a 1-mile final.", delay: 2.0),
            Exchange(speaker: .pilot, message: "Extend downwind, looking for the Piper, Cessna 345.", delay: 2.5),
            Exchange(speaker: .atc, message: "Cherokee 85 Foxtrot, turn base now. Cleared to land runway 27, number 2.", delay: 3.0),
            Exchange(speaker: .system, message: "--- Cherokee turns base ---", delay: 2.0),
            Exchange(speaker: .atc, message: "Skyhawk 78 Quebec, enter left downwind runway 27. Traffic is a Cherokee on left base, a Cessna extending downwind.", delay: 3.5),
            Exchange(speaker: .pilot, message: "Left downwind 27, traffic in sight, 78 Quebec.", delay: 2.0),
            Exchange(speaker: .atc, message: "Piper 234, cleared touch and go runway 27.", delay: 2.5),
            Exchange(speaker: .system, message: "--- Piper touches down and powers up ---", delay: 3.0),
            Exchange(speaker: .atc, message: "Cessna 345, turn base now. Number 3 following the Cherokee on short final.", delay: 3.0),
            Exchange(speaker: .pilot, message: "Base now, number 3, Cessna 345.", delay: 2.0),
            Exchange(speaker: .atc, message: "Cherokee 85 Foxtrot, cleared to land runway 27.", delay: 2.5),
            Exchange(speaker: .atc, message: "Skyhawk 78 Quebec, you're number 4. I'll call your base.", delay: 3.0),
            Exchange(speaker: .pilot, message: "Number 4, 78 Quebec.", delay: 2.0),
        ]
    )

    // MARK: - All Demos

    static let allDemos: [DemoConversation] = [
        patternWorkDemo,
        groundOpsDemo,
        flightFollowingDemo,
        emergencyDemo,
        busyPatternDemo
    ]

    static func demos(for category: Category) -> [DemoConversation] {
        allDemos.filter { $0.category == category }
    }

    // MARK: - Quick Phraseology Reference

    struct PhraseologyTip: Identifiable {
        let id = UUID()
        let situation: String
        let pilotSays: String
        let atcReplies: String
        let notes: String
    }

    static let phraseologyTips: [Category: [PhraseologyTip]] = [
        .patternWork: [
            PhraseologyTip(
                situation: "Ready for Takeoff",
                pilotSays: "[Tower], [Callsign], runway [##], ready for departure",
                atcReplies: "[Callsign], runway [##], cleared for takeoff",
                notes: "Never say 'takeoff' unless you're cleared - say 'departure' instead"
            ),
            PhraseologyTip(
                situation: "Reporting Position",
                pilotSays: "[Tower], [Callsign], [position] runway [##]",
                atcReplies: "[Callsign], roger / continue / report [position]",
                notes: "Positions: crosswind, downwind, base, final, short final"
            ),
            PhraseologyTip(
                situation: "Touch and Go Request",
                pilotSays: "[Tower], [Callsign], request touch and go",
                atcReplies: "[Callsign], cleared touch and go runway [##]",
                notes: "State intentions before entering pattern if possible"
            ),
        ],
        .groundOperations: [
            PhraseologyTip(
                situation: "Initial Taxi Request",
                pilotSays: "[Ground], [Callsign], at [location], taxi to [runway] with [ATIS]",
                atcReplies: "[Callsign], taxi to runway [##] via [taxiways]",
                notes: "Always get ATIS before calling ground"
            ),
            PhraseologyTip(
                situation: "Runway Crossing",
                pilotSays: "[Ground], [Callsign], holding short runway [##]",
                atcReplies: "[Callsign], cross runway [##]",
                notes: "NEVER cross without explicit clearance. Read back runway number!"
            ),
            PhraseologyTip(
                situation: "Progressive Taxi",
                pilotSays: "[Ground], [Callsign], unfamiliar, request progressive taxi",
                atcReplies: "[Callsign], turn left/right, proceed straight...",
                notes: "Controllers expect this at unfamiliar airports - don't hesitate to ask"
            ),
        ],
        .flightFollowing: [
            PhraseologyTip(
                situation: "Initial Request",
                pilotSays: "[Facility], [Callsign], request VFR flight following",
                atcReplies: "[Callsign], squawk [code], say altitude and destination",
                notes: "Have aircraft type, altitude, destination, and equipment ready"
            ),
            PhraseologyTip(
                situation: "Traffic Advisory",
                pilotSays: "Traffic in sight, [Callsign] / Looking, [Callsign] / Negative contact, [Callsign]",
                atcReplies: "[Callsign], roger, maintain visual separation",
                notes: "Use clock position for reporting: '2 o'clock, 3 miles, same altitude'"
            ),
            PhraseologyTip(
                situation: "Frequency Change",
                pilotSays: "[Callsign], ready to copy / [Callsign] switching",
                atcReplies: "[Callsign], contact [facility] on [frequency]",
                notes: "Check in with new frequency: '[Facility], [Callsign], [altitude]'"
            ),
        ],
        .emergency: [
            PhraseologyTip(
                situation: "Mayday Declaration",
                pilotSays: "MAYDAY MAYDAY MAYDAY, [Facility], [Callsign], [emergency], [position], [altitude], [souls], [fuel]",
                atcReplies: "[Callsign], roger MAYDAY, say intentions / [vectors]",
                notes: "Aviate, Navigate, Communicate - fly the plane first!"
            ),
            PhraseologyTip(
                situation: "Pan-Pan (Urgent)",
                pilotSays: "PAN-PAN PAN-PAN PAN-PAN, [Facility], [Callsign], [situation]",
                atcReplies: "[Callsign], say request / how can we assist",
                notes: "Pan-Pan is for urgent but not immediately life-threatening situations"
            ),
            PhraseologyTip(
                situation: "Minimum Fuel",
                pilotSays: "[Facility], [Callsign], minimum fuel, [minutes remaining]",
                atcReplies: "[Callsign], roger, expect no delay / priority handling",
                notes: "Declare early - 'minimum fuel' means you can't accept any undue delay"
            ),
        ],
    ]
}
