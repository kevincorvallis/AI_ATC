# Quick Start Guide

Get your AI ATC Training System up and running in 5 minutes!

**Note:** Want to start listening to live ATC right away? Skip to Step 3 and select "Listen to Live ATC" from the main menu - no setup required!

## Prerequisites Check

**For AI Training Mode only** (Live ATC needs no prerequisites):

Before starting, verify you have:

```bash
# Check AWS CLI
aws --version

# Check Python
python3 --version

# Check you're logged into AWS
aws sts get-caller-identity
```

## Step 1: Deploy Backend for AI Training (2 minutes)

**Required for:** AI Training Mode only
**Skip if:** You only want to listen to live ATC

Your `.env` file is already configured with your OpenAI API key.

```bash
cd backend
./deploy.sh
```

This will:
- Package and upload the Lambda function
- Create API Gateway
- Set up all necessary AWS resources

**Important:** At the end, copy the API endpoint URL that looks like:
```
https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/atc
```

## Step 2: Configure Frontend for AI Training (30 seconds)

**Required for:** AI Training Mode only
**Skip if:** You only want to listen to live ATC

Edit `config.js` in the root directory and replace `YOUR_API_ENDPOINT_HERE/atc` with the URL from Step 1:

```javascript
const API_ENDPOINT = 'https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/atc';
```

## Step 3: Run the App (30 seconds)

```bash
# From the AI_ATC root directory
python3 -m http.server 8000
```

Open your browser to: `http://localhost:8000`

**Important:** Use Chrome or Edge for best speech recognition support!

## First Flight

1. **Allow microphone access** when prompted
2. **Select a scenario** (start with "Pattern Work")
3. **Press and hold "Push to Talk"** or spacebar
4. **Speak your transmission**, for example:
   - "Tower, Cessna 12345, ready for departure, runway 27, remaining in the pattern"
5. **Release the button** and wait for ATC to respond
6. **Listen to the response** and continue the conversation!

## Example First Conversation

**You (hold PTT):** "Tower, Cessna 12345, ready for departure runway 27, remaining in the pattern"

**ATC:** "Cessna 12345, Tower, runway 27, cleared for takeoff, make left traffic"

**You (hold PTT):** "Cleared for takeoff runway 27, left traffic, Cessna 12345"

**ATC:** "Cessna 12345, contact me when entering downwind"

**You (hold PTT):** "Wilco, Cessna 12345"

...continue around the pattern!

## Want to Listen to Real ATC? (No Setup Required!)

The Live ATC mode is **ready to use immediately** - no AWS deployment needed!

1. From the main menu, click **"Listen to Live ATC"**
2. Browse airports by region or search for a specific airport
3. Click on a frequency (Tower/Ground/Approach) to start listening
4. Listen to real pilots and controllers in action!

**Top recommendations for learning:**
- **Van Nuys (KVNY)** - Busy training airport, great phraseology
- **JFK Tower (KJFK)** - Complex operations, professional communications
- **Palo Alto (KPAO)** - Student-friendly tower, clear instructions

This is a fantastic way to learn before using the AI training mode!

## Troubleshooting

### "Speech recognition not supported"
- **Solution:** Use Chrome or Edge browser

### "Unable to reach ATC"
- **Solution:** Check that you updated `frontend/config.js` with your API endpoint
- **Solution:** Open browser console (F12) to see detailed error messages

### Lambda deployment fails
- **Solution:** Check AWS credentials: `aws sts get-caller-identity`
- **Solution:** Ensure you have permissions to create Lambda functions and API Gateway

### ATC isn't responding
- **Solution:** Check CloudWatch logs: 
  ```bash
  aws logs tail /aws/lambda/ai-atc-function --follow
  ```
- **Solution:** Verify OpenAI API key in `.env` is correct

## Tips for Better Training

1. **Speak clearly** - The speech recognition works best with clear pronunciation
2. **Use proper callsign** - Always include your callsign in each transmission
3. **Read back clearances** - Practice reading back runway assignments and instructions
4. **Pay attention to feedback** - Look for the 💡 icon indicating the ATC is teaching you
5. **Try different scenarios** - Each scenario practices different skills

## Cost Monitoring

Monitor your AWS costs:
```bash
# Check Lambda invocations
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=ai-atc-function \
  --start-time $(date -u -d '1 day ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 86400 \
  --statistics Sum
```

## Next Steps

- Practice all four scenarios
- Review the phraseology guide in the app
- Challenge yourself with emergency scenarios
- Track your progress and improvements

Happy Flying! ✈️
