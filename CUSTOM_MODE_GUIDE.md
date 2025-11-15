# Custom Scenario Mode - User Guide

## Overview

The **Create Your Own Mode** allows you to design custom ATC training scenarios using natural language. Simply describe your situation in plain English, and the AI will create a realistic ATC environment tailored to your needs.

## Features

### 🎨 Natural Language Scenario Creation
- Describe your scenario in your own words
- AI automatically parses and understands your intent
- No need to learn complex syntax or formatting

### 📋 Airport Diagram Viewer
- View official FAA airport diagrams
- Integrated diagram viewer for any US airport
- Multiple fallback options (AirNav, SkyVector)
- Diagrams update automatically with FAA's 28-day AIRAC cycle

### 💡 Example Scenarios
Pre-built examples to help you get started:
- **Arrival**: Coming in for landing at an airport
- **Departure**: Taking off and departing the pattern
- **En Route**: Cross-country flight with flight following
- **Practice Area**: Practicing maneuvers
- **Custom**: Any scenario you can imagine

### 📝 Scenario Templates
Five built-in templates that adapt to your input:
1. **Arrival Template** - For landing scenarios
2. **Departure Template** - For takeoff scenarios
3. **En Route Template** - For cross-country flight following
4. **Practice Area Template** - For airwork and maneuvers
5. **Custom Template** - For anything else

## How to Use

### Step 1: Access Custom Mode
From the main menu, click **"Create Your Own"** (🎨 icon)

### Step 2: Describe Your Scenario
In the prompt box, describe your scenario in natural language. Examples:

**Simple Arrival:**
```
I'm approaching South Bend airport from the north at 3,000 feet in a Cessna 172, requesting landing clearance
```

**Departure with Destination:**
```
I'm at Palo Alto Airport ready for departure, planning to fly to San Jose
```

**Cross-Country with Flight Following:**
```
I'm flying from Santa Monica to San Diego at 4,500 feet and would like flight following
```

**Practice Area:**
```
I'm practicing steep turns in the Livermore practice area at 4,000 feet
```

**Custom/Emergency:**
```
I'm a student pilot on my first solo cross-country flight and I'm getting nervous about the weather ahead
```

### Step 3: Start Your Scenario
Click **"🚀 Start Scenario"** and begin communicating with ATC using the Push-to-Talk button

## What the AI Understands

The system intelligently parses:

### Airports
- **ICAO codes**: KSBN, KPAO, KJFK, etc.
- **Common names**: South Bend, Palo Alto, JFK, LAX, O'Hare, etc.

### Aircraft Types
- Cessna 172, Cessna 152
- Piper, Cirrus, Diamond
- Baron, Bonanza
- And more...

### Altitudes
- "3,000 feet"
- "at 4,500"
- "3500 ft"

### Directions
- North, South, East, West
- Northeast, Northwest, Southeast, Southwest

### Runways
- "runway 27"
- "runway 31L"

### Scenario Types (Auto-detected)
The AI automatically detects the type of scenario from your description:
- **Arrival**: Keywords like "landing", "arrival", "coming in", "inbound"
- **Departure**: Keywords like "departure", "takeoff", "taking off"
- **En Route**: Keywords like "cross-country", "en route", "flight following"
- **Practice Area**: Keywords like "practice area", "practicing", "maneuvers"
- **Custom**: Everything else

## Airport Diagram Viewer

### Viewing Diagrams
1. Enter an airport ICAO code (e.g., KSBN, KPAO)
2. Click **"Load Diagram"**
3. The FAA official diagram will load

### Diagram Sources
- **Primary**: FAA Digital Terminal Procedures Publication (d-TPP)
- **Fallback 1**: AirNav (airbnav.com)
- **Fallback 2**: SkyVector (skyvector.com)
- **Manual**: FAA d-TPP Search

### Notes
- Diagrams are updated every 28 days with the AIRAC cycle
- If the primary link doesn't work, use the fallback links provided
- All diagrams are official FAA publications

## Tips for Best Results

### Be Specific
✅ Good: "I'm approaching South Bend airport from the north at 3,000 feet in a Cessna 172"
❌ Less Good: "I want to land"

### Include Key Details
- Your position/location
- Your altitude (if airborne)
- Your aircraft type
- Your airport
- Your intentions

### Use Natural Language
You don't need perfect phraseology for the scenario description - just describe your situation naturally. The AI will understand and create the appropriate ATC environment.

### Example Structure
```
I'm [position] [airport] at [altitude] feet in a [aircraft], [intention]
```

Examples:
- "I'm 10 miles north of LAX at 2,500 feet in a Cessna 172, requesting Class B transition"
- "I'm on the ground at Van Nuys ready for departure to Santa Monica"
- "I'm lost near KSBN and running low on fuel in a Piper"

## Advanced Features

### Custom Weather
Mention weather in your scenario:
- "with deteriorating weather"
- "in IMC conditions"
- "with strong crosswinds"

### Custom Traffic
Mention traffic levels:
- "during rush hour"
- "with heavy traffic"
- "during quiet hours"

### Emergency Scenarios
Describe emergencies naturally:
- "I have an engine failure"
- "I'm lost and running low on fuel"
- "I have a medical emergency"

## Technical Details

### How It Works

1. **Natural Language Processing**: Your prompt is parsed to extract key information (airport, altitude, aircraft, etc.)

2. **Template Selection**: The system selects the most appropriate template based on detected keywords

3. **Prompt Generation**: A custom system prompt is generated for the AI controller with your specific scenario details

4. **Real-time Communication**: You communicate with the AI ATC just like in the standard scenarios

### Backend Integration

The custom mode works with both:
- ✅ **AI Backend** (OpenAI GPT-4): Full intelligent responses
- ✅ **Demo Mode**: Pre-programmed responses when backend is unavailable

When using the AI backend, your custom scenario is sent as a `customSystemPrompt` parameter, allowing the AI to roleplay the exact situation you described.

## Troubleshooting

### The scenario doesn't understand my airport
- Use the ICAO code (KXXX format for US airports)
- Make sure the airport name is spelled correctly
- Try adding the ICAO code in parentheses: "South Bend (KSBN)"

### The diagram won't load
- Check that you entered a valid ICAO code
- Use the fallback links provided (AirNav, SkyVector)
- FAA diagrams update every 28 days - the URL may have changed

### I want to modify my scenario
- Click "Back to Main Menu" or "Change Scenario"
- Re-enter custom mode and create a new scenario
- You can use the examples as starting points

## Use Cases

### Training for Specific Airports
Practice procedures at your home airport or cross-country destinations:
```
I'm approaching South Bend Regional Airport (KSBN) from the northwest at 3,500 feet in a Cessna 172, requesting full-stop landing
```

### Unusual Situations
Practice scenarios you might not encounter in standard training:
```
I'm a student pilot who just entered IMC accidentally at 4,000 feet near Chicago
```

### Airport-Specific Procedures
Practice complex Class B/C procedures:
```
I'm 15 miles east of LAX at 3,500 feet in a Cessna 172, requesting Class B clearance for landing
```

### Long Cross-Country Flights
Simulate flight following for multi-leg trips:
```
I'm departing Palo Alto for a cross-country flight to Santa Barbara with a fuel stop in San Luis Obispo
```

## Future Enhancements

Planned features:
- 🗺️ S3-hosted airport diagram library
- 🌍 International airport support
- 💾 Save custom scenarios
- 🔗 Share scenarios with other pilots
- 🎯 Scenario difficulty ratings
- 📊 Performance tracking

## Support

If you encounter issues:
1. Check this guide
2. Try the example scenarios first
3. Ensure your browser supports speech recognition (Chrome/Edge recommended)
4. Check the browser console for error messages

---

**Happy Training!** ✈️

The custom scenario mode is designed to give you unlimited practice opportunities. From routine pattern work at your local airport to complex emergency scenarios, you can practice any situation you might encounter in real flying.
