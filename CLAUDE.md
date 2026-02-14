# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# AI ATC Training System

## Project Overview
AI-powered Air Traffic Control training system for practicing radio communications. Users select scenarios and practice transmissions via text input, receiving realistic ATC responses.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Static)                         │
│  index.html │ app.js │ styles.css │ core.js │ scenarios-config.js│
│                    Hosted: Local / GitHub Pages                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ POST /atc
┌─────────────────────────────────────────────────────────────────┐
│                      AWS API GATEWAY                             │
│           https://3zk0d6e54l.execute-api.us-east-1.amazonaws.com │
│                        Route: POST /atc                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AWS LAMBDA                                  │
│              Function: ai-atc-function                           │
│              Runtime: Python 3.11                                │
│              Handler: lambda_function.lambda_handler             │
│              Memory: 256 MB │ Timeout: 30s                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EXTERNAL APIS                                │
│  • OpenAI GPT-4 (ATC responses)                                  │
│  • Aviation API (FAA charts): https://api.aviationapi.com/v1    │
└─────────────────────────────────────────────────────────────────┘
```

---

## AWS Services & CLI Commands

### Lambda Function
```bash
# List Lambda functions
aws lambda list-functions --region us-east-1

# Get function details
aws lambda get-function --function-name ai-atc-function --region us-east-1

# Update function code
aws lambda update-function-code \
  --function-name ai-atc-function \
  --zip-file fileb://backend/lambda_package.zip \
  --region us-east-1

# Update environment variables
aws lambda update-function-configuration \
  --function-name ai-atc-function \
  --environment "Variables={OPENAI_API_KEY=$OPENAI_API_KEY}" \
  --region us-east-1

# Invoke function directly (test)
aws lambda invoke \
  --function-name ai-atc-function \
  --payload '{"body": "{\"scenario\":\"pattern_work\",\"message\":\"Tower, Cessna 12345\"}"}' \
  --region us-east-1 \
  response.json
```

### CloudWatch Logs
```bash
# List log streams
aws logs describe-log-streams \
  --log-group-name /aws/lambda/ai-atc-function \
  --region us-east-1 \
  --order-by LastEventTime \
  --descending \
  --limit 5

# Get recent logs
aws logs get-log-events \
  --log-group-name /aws/lambda/ai-atc-function \
  --log-stream-name '<STREAM_NAME>' \
  --region us-east-1
```

### API Gateway
```bash
# List APIs
aws apigatewayv2 get-apis --region us-east-1

# Get API details (API_ID: 3zk0d6e54l)
aws apigatewayv2 get-api --api-id 3zk0d6e54l --region us-east-1

# Get routes
aws apigatewayv2 get-routes --api-id 3zk0d6e54l --region us-east-1
```

---

## API Endpoints

### Main ATC Endpoint
```
POST https://3zk0d6e54l.execute-api.us-east-1.amazonaws.com/atc
```

#### Request: ATC Response
```json
{
  "scenario": "pattern_work|ground_operations|flight_following|emergency",
  "message": "Pilot transmission text",
  "history": [
    {"role": "user", "content": "Previous pilot message"},
    {"role": "assistant", "content": "Previous ATC response"}
  ],
  "customSystemPrompt": "Optional custom scenario prompt"
}
```

#### Response
```json
{
  "success": true,
  "atc_response": "ATC response text",
  "has_feedback": false
}
```

#### Request: Generate Custom Scenario
```json
{
  "action": "generate_scenario",
  "prompt": "I want to practice landing at KLAX in a Cessna 172"
}
```

#### Request: Get Airport Charts
```json
{
  "action": "get_charts",
  "airport": "KSBN"
}
```

### Test with curl
```bash
# Basic ATC request
curl -X POST https://3zk0d6e54l.execute-api.us-east-1.amazonaws.com/atc \
  -H 'Content-Type: application/json' \
  -d '{"scenario":"pattern_work","message":"Metro Tower, Cessna 12345, ready for departure runway 27"}'

# Generate custom scenario
curl -X POST https://3zk0d6e54l.execute-api.us-east-1.amazonaws.com/atc \
  -H 'Content-Type: application/json' \
  -d '{"action":"generate_scenario","prompt":"Practice pattern work at KORD"}'

# Get airport charts
curl -X POST https://3zk0d6e54l.execute-api.us-east-1.amazonaws.com/atc \
  -H 'Content-Type: application/json' \
  -d '{"action":"get_charts","airport":"KSBN"}'
```

---

## Environment Variables

### Required (.env file)
```bash
OPENAI_API_KEY=sk-...           # OpenAI API key for GPT-4
AWS_REGION=us-east-1            # AWS region
AWS_PROFILE=default             # AWS CLI profile
LAMBDA_FUNCTION_NAME=ai-atc-function
API_GATEWAY_NAME=ai-atc-api
```

---

## External APIs

### OpenAI API
- **Model**: GPT-4
- **Max tokens**: 250
- **Temperature**: 0.75
- **Used for**: ATC responses, scenario generation
- **Docs**: https://platform.openai.com/docs/api-reference

### Aviation API
- **Base URL**: https://api.aviationapi.com/v1
- **Endpoint**: /charts?apt={ICAO}
- **Used for**: FAA airport diagrams and charts
- **Docs**: https://aviationapi.com/

---

## Local Development

### Run Frontend
```bash
python3 -m http.server 8000
# Visit http://localhost:8000
```

### Deploy Backend
```bash
cd backend
./deploy.sh  # Requires AWS CLI configured & OPENAI_API_KEY in .env
```

### Build Lambda Package
```bash
cd backend
pip3 install -r requirements.txt -t package/
cp lambda_function.py package/
cd package && zip -r ../lambda_package.zip .
```

---

## File Structure

```
AI_ATC/
├── index.html              # Main UI (3 views: categories/scenarios/training)
├── app.js                  # Application logic, ATCTrainingApp class
├── styles.css              # All styling
├── demo-styles.css         # Demo/onboarding styles
├── core.js                 # Settings/Progress managers, EventBus
├── config.js               # API_ENDPOINT configuration
├── scenarios-config.js     # TRAINING_SCENARIOS data
├── voice.js                # Speech-to-text / text-to-speech (Web Speech API)
├── weather.js              # METAR weather fetching
├── visualization.js        # Traffic pattern canvas visualization
├── phraseology-scorer.js   # Scores pilot phraseology accuracy
├── phraseology.js          # Phraseology validation rules
├── scenario-state.js       # State machine for flight phase tracking
├── feedback-engine.js      # Real-time transmission feedback
├── aviation-visual.js      # Visual flight position indicator
├── demo-data.js            # Pre-programmed demo responses
├── demo-onboarding.js      # Interactive onboarding system
├── .env                    # Environment variables (gitignored)
├── .env.example            # Template for .env
├── backend/
│   ├── lambda_function.py  # Lambda handler (OpenAI + Aviation API)
│   ├── requirements.txt    # Python deps: openai, boto3, langchain (disabled)
│   └── deploy.sh           # AWS deployment script
└── .claude/
    └── settings.local.json # Claude Code permissions
```

## Key Patterns

- Enhancement modules attach to `window` globals (e.g., `window.voiceManager`, `window.scenarioStateMachine`). `app.js` polls for them in `initModules()`.
- Conversations persist to `localStorage` and can be restored within 30 minutes.
- The Lambda routes by checking for `action` field in the request body (`generate_scenario`, `get_charts`), otherwise treats it as an ATC response request.
- Scenario system prompts in `SCENARIO_PROMPTS` dict in `lambda_function.py` contain detailed ATC personality and phraseology rules — these are critical to response quality.
- LangChain is in requirements.txt but disabled (needs Rust compiler for tiktoken). Uses direct OpenAI API via `get_atc_response_direct()`.

---

## Scenario Types

| Scenario | Frequency | Description |
|----------|-----------|-------------|
| pattern_work | 118.300 | Traffic pattern practice at Class D |
| ground_operations | 121.900 | Taxi clearances and ground control |
| flight_following | 124.350 | VFR radar services en route |
| emergency | 121.500 | Emergency procedures |

---

## Key Classes & Functions

### Frontend (app.js)
```javascript
class ATCTrainingApp {
  showView(viewName)           // Navigate between views
  showScenarios(category)      // Display scenario cards
  startScenario(category, scenario)  // Initialize training session
  handleTextTransmission()     // Process user input
  sendToATC(message)           // Call backend API
  handleDemoMode(message)      // Offline fallback responses
  populateSuggestions(category, scenarioId)  // Fill suggestion chips
}
```

### Backend (lambda_function.py)
```python
def lambda_handler(event, context)           # Main entry point, routes by action
def get_atc_response(scenario, history, message, custom_prompt)  # Orchestrator
def get_atc_response_direct(system_prompt, history, message)     # Direct OpenAI call
def get_atc_response_langchain(system_prompt, history, message)  # LangChain path (disabled)
def generate_custom_scenario(prompt)         # Create custom scenarios via GPT-4
def get_airport_charts(icao)                 # Fetch FAA charts from Aviation API
def validate_custom_prompt(prompt)           # Security: prevent prompt injection
```

---

## Claude Code Skills

- `/update-lambda` — Quick Lambda code update without full redeployment
- `/check-logs` — Check latest CloudWatch logs for ai-atc-function
- `/deploy-lambda` — Full backend deployment
- `/test-api` — Test the ATC API endpoint
- `/serve` — Start local dev server

---

## Troubleshooting

### API Returns 500
```bash
# Check Lambda logs
aws logs describe-log-streams --log-group-name /aws/lambda/ai-atc-function --region us-east-1 --limit 1

# Verify OpenAI key
aws lambda get-function-configuration --function-name ai-atc-function --region us-east-1 | grep OPENAI
```

### CORS Issues
- Check ALLOWED_ORIGINS in lambda_function.py
- Add your domain to the list

### Demo Mode Active
- Check config.js has correct API_ENDPOINT
- Verify API Gateway is deployed and accessible
