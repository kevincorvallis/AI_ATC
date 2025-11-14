# AI ATC Training System

An interactive AI-powered Air Traffic Control training application for student pilots. Practice radio communications with realistic ATC scenarios using voice interaction.

## Features

### AI Training Mode
- 🎙️ Voice-based interaction (speak and hear responses)
- 🛩️ Student pilot focused scenarios
- 🎯 Real-time feedback on radio phraseology
- 📚 Multiple training scenarios (pattern work, ground ops, flight following)
- 🤖 Intelligent ATC powered by OpenAI GPT-4

### Live ATC Listening
- 📻 Listen to real ATC from major airports worldwide
- 🌍 Coverage of 25+ airports across North America, Europe, Asia Pacific, and Middle East
- 🎧 Multiple feeds per airport (Tower, Ground, Approach)
- 🔍 Search and filter airports by region or name
- 💡 Learn by listening to real-world communications

## Deployment Options

### Option 1: Deploy to Vercel (Recommended)
**Deploy the frontend to Vercel in 2 minutes!**

1. Push your code to GitHub
2. Connect to Vercel (vercel.com)
3. Deploy automatically

Live ATC mode works immediately. For AI Training mode, deploy the backend to AWS.

[**Full Deployment Guide →**](DEPLOYMENT.md)

### Option 2: Run Locally
Perfect for development and testing.

## Prerequisites

**For Local Development:**
- Python 3 (for local server)
- Modern web browser with Web Speech API support (Chrome/Edge recommended)

**For AI Training Mode:**
- AWS CLI configured with credentials
- OpenAI API key (already in your `.env`)

**For Live ATC Mode:**
- No prerequisites! Works immediately

## Quick Start (Local Development)

### 1. Set up environment variables

```bash
cp .env.example .env
# Edit .env and add your OpenAI API key
```

### 2. Deploy backend to AWS

```bash
cd backend
chmod +x deploy.sh
./deploy.sh
```

This will:
- Create an AWS Lambda function
- Set up API Gateway
- Configure necessary IAM roles
- Output your API endpoint URL

### 3. Configure frontend

Edit `frontend/config.js` and add your API Gateway endpoint URL from step 2.

### 4. Run the application

```bash
# Simple HTTP server
cd frontend
python3 -m http.server 8000
# Or use Node.js
npx http-server -p 8000
```

Visit `http://localhost:8000` in your browser.

## How to Use

The application has two modes accessible from the main menu:

### AI Training Mode

Practice with AI-powered ATC scenarios:

**Available Scenarios:**
1. **Pattern Work** - Practice departure, downwind, base, and final calls
2. **Ground Operations** - Taxi clearances and ground communication
3. **Flight Following** - VFR flight following requests and position reports
4. **Emergency Procedures** - Practice emergency declarations and lost comms

**Usage:**
1. Select a training scenario
2. Press and hold "Push to Talk" (or spacebar) while speaking
3. Speak clearly using proper phraseology
4. Listen to ATC responses and respond appropriately
5. Review feedback (marked with 💡) to improve your communication

### Live ATC Mode

Listen to real ATC communications from airports worldwide:

**Featured Airports:**
- **North America:** JFK, LAX, O'Hare, Atlanta, SFO, Miami, Toronto, Vancouver
- **Europe:** Heathrow, Amsterdam, Frankfurt, Paris CDG, Dublin, Madrid
- **Asia Pacific:** Tokyo Haneda, Sydney, Melbourne, Hong Kong, Singapore
- **Middle East:** Dubai
- **Training Airports:** Van Nuys, Palo Alto, John Wayne Orange County

**Usage:**
1. Search or filter airports by region
2. Select an airport and frequency (Tower/Ground/Approach)
3. Listen to live communications
4. Pay attention to phraseology and procedures
5. Try to anticipate what pilots will say next!

## Proper Radio Phraseology Examples

### Takeoff Request:
```
"[Airport] Tower, Cessna 12345, ready for departure, runway 27, remaining in the pattern"
```

### Downwind Call:
```
"[Airport] Tower, Cessna 12345, left downwind, runway 27"
```

### Landing Request:
```
"[Airport] Tower, Cessna 12345, left base, runway 27, full stop"
```

## Project Structure

```
AI_ATC/
├── index.html            # Main web interface
├── app.js                # AI training mode logic
├── live-atc.js           # Live ATC player
├── airports.js           # Airport database (25+ airports)
├── styles.css            # Styling
├── config.js             # API configuration
├── backend/              # AWS Lambda backend (separate deployment)
│   ├── lambda_function.py
│   ├── requirements.txt
│   └── deploy.sh
├── vercel.json           # Vercel deployment config
├── .env                  # Your API keys (not in git)
├── .env.example          # Environment template
├── README.md             # This file
└── QUICKSTART.md         # Quick start guide
```

## Costs

**AI Training Mode:**
- **AWS Lambda**: ~$0.20 per 1M requests (free tier: 1M requests/month)
- **API Gateway**: ~$3.50 per 1M requests (free tier: 1M requests/month for 12 months)
- **OpenAI API**: ~$0.01-0.03 per conversation (GPT-4 pricing)

Estimated cost for regular AI training: **$5-15/month**

**Live ATC Mode:**
- **Completely FREE** - Streams directly from LiveATC.net
- No AWS or OpenAI costs
- Listen as much as you want!

## Troubleshooting

### Speech recognition not working
- Use Chrome or Edge browser (best Web Speech API support)
- Check microphone permissions
- Ensure you're using HTTPS or localhost

### API errors
- Verify OpenAI API key in AWS Lambda environment variables
- Check AWS CloudWatch logs: `aws logs tail /aws/lambda/ai-atc-function --follow`
- Verify API Gateway endpoint is correct in frontend config

### CORS errors
- Ensure API Gateway has CORS enabled
- Check the deploy script configured CORS properly

## License

MIT License - Feel free to modify and use for your training!
