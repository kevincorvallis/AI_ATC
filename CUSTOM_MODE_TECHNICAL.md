# Custom Mode - Technical Documentation

## Architecture Overview

The custom mode feature adds a flexible, natural-language-driven scenario creation system to the AI ATC Training System.

## File Structure

```
AI_ATC/
├── custom-mode.js          # Main custom mode implementation
├── app.js                  # Updated with custom mode integration
├── index.html              # Updated with custom mode button
├── styles.css              # Updated with custom mode styles
├── backend/
│   └── lambda_function.py  # Updated to accept custom system prompts
└── CUSTOM_MODE_GUIDE.md    # User documentation
```

## Component Architecture

### 1. CustomScenarioMode Class (`custom-mode.js`)

#### Initialization
```javascript
const customMode = new CustomScenarioMode(app);
```

#### Key Components

**Templates System**
```javascript
createTemplates() {
    return {
        arrival: { template, variables },
        departure: { template, variables },
        enroute: { template, variables },
        practice_area: { template, variables },
        custom: { template, variables }
    };
}
```

Templates use placeholder variables (e.g., `{airport}`, `{altitude}`) that are replaced with parsed data.

**Example Prompts**
```javascript
createExamplePrompts() {
    return [
        { category, prompt, parsed: {...} },
        ...
    ];
}
```

Provides pre-built examples demonstrating different scenario types.

#### Natural Language Parser

**parseCustomPrompt(userPrompt)**

Extracts structured data from natural language:

```javascript
{
    airport: "South Bend Regional Airport (KSBN)",
    aircraft_type: "Cessna 172",
    scenario_type: "arrival",
    altitude: "3000",
    direction: "north",
    weather: "VFR",
    // ... more fields
}
```

**Detection Logic:**

1. **Scenario Type Detection**
   - Keywords: "landing", "arrival", "departure", "takeoff", "cross-country", etc.
   - Determines which template to use

2. **Airport Detection**
   - ICAO codes: Regex `\b(K[A-Z]{3}|[A-Z]{4})\b`
   - Common names: Dictionary lookup (e.g., "south bend" → "KSBN")

3. **Altitude Extraction**
   - Regex: `(\d{1,2},?\d{3})\s*(feet|ft|')?`
   - Handles formats: "3,000 feet", "3000 ft", "at 3500"

4. **Aircraft Type**
   - Dictionary of common types
   - Matches: "Cessna 172", "C172", "Piper", etc.

5. **Direction**
   - Regex: `from\s+the\s+(north|south|east|west|...)`

6. **Runway**
   - Regex: `runway\s+(\d{1,2}[LRC]?)`

#### System Prompt Generation

**generateSystemPrompt(parsedData)**

1. Selects appropriate template based on `scenario_type`
2. Replaces all `{placeholders}` with parsed data
3. Uses defaults for missing fields
4. Returns complete system prompt for AI

Example output:
```
You are an air traffic controller at South Bend Regional Airport (KSBN).
A pilot in a Cessna 172 is approaching from the north at 3,000 feet, requesting to land.
Current conditions: VFR, wind 270 at 8 kts, runway in use is 27.

Your role:
- Provide arrival instructions
- Issue pattern entry instructions
...
```

### 2. UI Components

#### Main Interface
```html
<div id="customModeInterface" class="custom-mode-interface">
    <!-- Prompt input section -->
    <!-- Airport diagram viewer -->
    <!-- Example scenarios -->
    <!-- Template cards -->
</div>
```

#### Prompt Section
- Large textarea for scenario description
- Real-time placeholder example
- Start and Clear buttons

#### Airport Diagram Viewer
- ICAO code input
- Embedded FAA diagram viewer
- Fallback links (AirNav, SkyVector)
- Updates with AIRAC cycle

#### Examples Container
- Grid of example scenarios
- Click to populate prompt
- Organized by category

### 3. Backend Integration

#### Lambda Function Updates (`lambda_function.py`)

**Modified Function Signature:**
```python
def get_atc_response(scenario, conversation_history, pilot_message, custom_system_prompt=None):
```

**Request Handling:**
```python
custom_system_prompt = body.get('customSystemPrompt', None)
result = get_atc_response(scenario, conversation_history, pilot_message, custom_system_prompt)
```

**System Prompt Priority:**
1. If `custom_system_prompt` provided → Use it
2. Else → Use predefined `SCENARIO_PROMPTS[scenario]`
3. Fallback → Use `SCENARIO_PROMPTS["pattern_work"]`

#### Frontend API Call
```javascript
const requestBody = {
    scenario: 'custom',
    message: pilot_message,
    history: conversationHistory,
    customSystemPrompt: customMode.currentCustomScenario.systemPrompt
};
```

### 4. Integration with Main App

**App.js Modifications:**

1. **Event Listener**
   ```javascript
   document.getElementById('customModeBtn').addEventListener('click', () => {
       this.showCustomMode();
   });
   ```

2. **Custom Mode Method**
   ```javascript
   showCustomMode() {
       showCustomMode(); // Calls custom-mode.js function
   }
   ```

3. **API Request Enhancement**
   ```javascript
   if (this.currentScenario === 'custom' && window.customMode) {
       requestBody.customSystemPrompt = window.customMode.currentCustomScenario.systemPrompt;
   }
   ```

4. **Menu Management**
   - Hide custom interface when returning to main menu
   - Properly manage all interface states

## Data Flow

```
User Input (Natural Language)
    ↓
parseCustomPrompt()
    ↓
Structured Data { airport, altitude, ... }
    ↓
generateSystemPrompt()
    ↓
Custom System Prompt (for AI)
    ↓
Start Scenario
    ↓
User speaks via PTT
    ↓
sendToATC() with customSystemPrompt
    ↓
Backend Lambda
    ↓
OpenAI GPT-4 with custom prompt
    ↓
ATC Response
    ↓
Speech Synthesis
```

## Airport Diagram Integration

### FAA d-TPP URL Structure
```
https://aeronav.faa.gov/d-tpp/YYMM/00000AD.PDF#nameddest={ICAO}
```

- `YYMM`: Year and AIRAC cycle number (updates every 28 days)
- `{ICAO}`: Airport code

### Implementation
```javascript
const diagramUrl = `https://aeronav.faa.gov/d-tpp/2425/00000AD.PDF#nameddest=${icao}`;
```

### Fallback Options
1. **AirNav**: `https://www.airnav.com/airport/{icao}`
2. **SkyVector**: `https://skyvector.com/airport/{icao}`
3. **FAA Search**: Manual search at FAA d-TPP website

### Future Enhancement: S3 Integration
Could pre-download diagrams to S3 bucket:
```javascript
const s3Url = `https://your-bucket.s3.amazonaws.com/diagrams/${icao}.pdf`;
```

## State Management

### CustomScenarioMode State
```javascript
{
    currentCustomScenario: {
        userPrompt: "Original user input",
        parsedData: { airport, altitude, ... },
        systemPrompt: "Generated prompt for AI",
        conversationHistory: []
    }
}
```

### App State
```javascript
{
    currentCategory: 'custom',
    currentScenario: 'custom',
    currentScenarioId: 'custom',
    conversationHistory: [...messages...]
}
```

## Styling Architecture

### CSS Variables
Uses existing theme variables from `styles.css`:
```css
--primary-color: #2563eb;
--surface-color: #1e293b;
--text-color: #f1f5f9;
/* ... etc */
```

### New Component Classes
- `.custom-mode-interface`
- `.custom-prompt-input`
- `.airport-diagram-viewer`
- `.example-card`
- `.template-card`

### Responsive Design
- Mobile-first approach
- Grid layouts adapt to screen size
- Touch-friendly controls
- Stacked layouts on mobile

## Error Handling

### Parsing Failures
```javascript
// Graceful defaults
parsed.aircraft_type = "Cessna 172"; // Default
parsed.weather = "VFR"; // Default
parsed.scenario_type = 'custom'; // Fallback
```

### Missing Data
- Templates have sensible defaults
- AI can work with partial information
- User gets helpful feedback

### Diagram Loading
```html
<div class="diagram-fallback">
    <p>If the diagram doesn't load, try these alternatives:</p>
    <ul>
        <li><a href="...">AirNav</a></li>
        <li><a href="...">SkyVector</a></li>
    </ul>
</div>
```

## Testing Scenarios

### Unit Test Cases
```javascript
// Test airport detection
parseCustomPrompt("I'm at KSBN") → { airport: "KSBN" }
parseCustomPrompt("I'm at South Bend") → { airport: "South Bend Regional Airport (KSBN)" }

// Test altitude extraction
parseCustomPrompt("at 3,000 feet") → { altitude: "3000" }
parseCustomPrompt("at 3500 ft") → { altitude: "3500" }

// Test scenario type detection
parseCustomPrompt("coming in for landing") → { scenario_type: "arrival" }
parseCustomPrompt("ready for departure") → { scenario_type: "departure" }
```

### Integration Test Cases
1. Complete arrival scenario
2. Complete departure scenario
3. En route with flight following
4. Practice area scenario
5. Custom emergency scenario

## Performance Considerations

### Parsing Optimization
- Regex compilation happens once
- Dictionary lookups are O(1)
- No expensive operations in parser

### UI Rendering
- Examples populated once on mount
- Lazy loading of diagrams
- Efficient DOM updates

### API Efficiency
- Custom prompt only sent when needed
- Conversation history pruned if needed
- Reuses existing API infrastructure

## Security Considerations

### Input Sanitization
- User input is parsed but not executed
- No eval() or dangerous operations
- XSS protection via standard practices

### API Security
- CORS headers properly configured
- API endpoint protected (if deployed)
- No sensitive data in prompts

## Future Enhancements

### Planned Features

1. **Scenario Persistence**
   ```javascript
   localStorage.setItem('savedScenarios', JSON.stringify(scenarios));
   ```

2. **Scenario Sharing**
   ```javascript
   const shareUrl = generateShareableLink(scenario);
   ```

3. **Advanced Parsing**
   - Weather conditions (METAR parsing)
   - NOTAMs integration
   - TFR awareness

4. **S3 Diagram Library**
   - Pre-downloaded diagrams
   - Faster loading
   - Offline capability

5. **Multi-leg Scenarios**
   - Support for cross-country with multiple waypoints
   - Controller handoffs
   - Center transitions

6. **Voice Commands**
   - "Create scenario: [description]"
   - Voice-activated diagram loading

## Deployment Notes

### Files to Deploy
- `custom-mode.js` (new)
- `app.js` (modified)
- `index.html` (modified)
- `styles.css` (modified)
- `backend/lambda_function.py` (modified)

### Environment Variables
No new environment variables required. Uses existing:
- `OPENAI_API_KEY` (backend)
- `API_ENDPOINT` (frontend config.js)

### Backward Compatibility
- All existing scenarios work unchanged
- Demo mode still functions
- No breaking changes to API

### Testing Checklist
- [ ] Custom mode button appears on main menu
- [ ] Prompt box accepts input
- [ ] Examples populate correctly
- [ ] Airport diagrams load (with fallbacks)
- [ ] Scenarios start successfully
- [ ] PTT works in custom scenarios
- [ ] Backend receives custom prompts
- [ ] AI responds appropriately
- [ ] Demo mode fallback works
- [ ] Return to main menu works
- [ ] Mobile responsive
- [ ] Browser compatibility (Chrome, Edge, Safari)

## API Documentation

### Frontend → Backend

**Endpoint:** `POST {API_ENDPOINT}`

**Request Body:**
```json
{
    "scenario": "custom",
    "message": "Cessna 123, ready for departure",
    "history": [
        { "role": "user", "content": "..." },
        { "role": "assistant", "content": "..." }
    ],
    "customSystemPrompt": "You are an air traffic controller at..."
}
```

**Response:**
```json
{
    "success": true,
    "atc_response": "Cessna 123, runway 27, cleared for takeoff...",
    "has_feedback": false
}
```

### Backend Processing

1. Extract `customSystemPrompt` from request
2. Pass to `get_atc_response()` as parameter
3. Use custom prompt instead of predefined scenarios
4. Return standard response format

## Troubleshooting

### Common Issues

**Custom mode button not appearing**
- Check `index.html` includes custom mode button
- Verify `custom-mode.js` is loaded before `app.js`

**Parsing not working**
- Check browser console for errors
- Verify regex patterns are correct
- Test with example prompts first

**Diagrams not loading**
- FAA URLs change every 28 days (AIRAC cycle)
- Update cycle number in URL
- Use fallback links

**Backend not receiving custom prompts**
- Check request body includes `customSystemPrompt`
- Verify Lambda function updated
- Check CORS headers

## Contributing

### Adding New Templates
```javascript
newTemplate: {
    name: "Template Name",
    description: "Description",
    template: `System prompt with {variables}`
}
```

### Adding Airport Names
```javascript
const airportNames = {
    'your airport': 'Full Name (KXXX)',
    ...
};
```

### Adding Aircraft Types
```javascript
const aircraftTypes = [
    'new aircraft type',
    ...
];
```

---

## Summary

The custom mode feature provides:
- ✅ Natural language scenario creation
- ✅ Flexible template system
- ✅ Airport diagram integration
- ✅ Seamless backend integration
- ✅ Extensible architecture
- ✅ Mobile-responsive UI
- ✅ Backward compatible

It enhances the training system by allowing unlimited scenario variations while maintaining code quality and user experience.
