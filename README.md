# AI ATC Training System

Practice ATC radio communications with AI-powered scenarios.

## Features

- **Training Scenarios**: Pattern work, ground ops, flight following, emergencies
- **Text Input**: Type transmissions or click quick suggestions
- **AI Responses**: Realistic ATC powered by OpenAI GPT-4
- **Demo Mode**: Works offline with pre-programmed responses

## Quick Start

```bash
# Run locally
python3 -m http.server 8000
# Visit http://localhost:8000
```

## Backend (Optional)

For AI-powered responses, deploy the Lambda backend:

```bash
cd backend
./deploy.sh
```

Then update `config.js` with your API endpoint.

## Structure

```
AI_ATC/
├── index.html        # Main interface
├── app.js            # App logic
├── styles.css        # Styles
├── scenarios-config.js  # Training scenarios
├── core.js           # Settings & progress
├── config.js         # API config
└── backend/          # AWS Lambda (optional)
```

## License

MIT
