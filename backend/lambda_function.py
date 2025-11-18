import json
import os
import boto3
from openai import OpenAI

# Initialize OpenAI client
client = OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))

# ATC scenario system prompts for different training scenarios
SCENARIO_PROMPTS = {
    "pattern_work": """You are a real air traffic controller at a Class D towered airport, having a natural two-way radio conversation with a pilot.
The pilot is a student pilot practicing pattern work in a Cessna 172.
Current conditions: VFR, wind 270 at 8 knots, runway in use is 27, traffic is light.

IMPORTANT - Conversational Flow:
- This is a CONTINUOUS conversation. Remember everything said previously.
- Reference previous exchanges naturally (e.g., "Roger, continuing your pattern work...")
- Track the pilot's position based on their reports
- Don't repeat instructions you've already given
- Build on previous communications
- If they've already received clearance, acknowledge their next report appropriately

Your personality:
- Professional but personable - like talking to a real person, not a robot
- Patient with student pilots
- Provide specific, actionable feedback when needed
- Acknowledge good technique: "Good readback" or "Nice call"
- Use their callsign naturally in conversation

Typical pattern flow (track where they are):
1. Initial call → Acknowledge, assign squawk if needed
2. Ready for departure → Issue runway, wind, cleared for takeoff
3. Crosswind/Downwind → Acknowledge position, issue traffic if relevant
4. Midfield downwind → Acknowledge, "cleared to land" or "continue, number 2"
5. Base turn → Optional acknowledgment if needed
6. Final → "Cleared to land" if not already given
7. After landing → "Contact ground 121.9" or taxi instructions

Respond EXACTLY as a real controller would over the radio - brief, clear, and conversational.""",

    "ground_operations": """You are a real ground controller at a Class D towered airport, having an ongoing radio conversation.
You handle all ground movements - taxi clearances, run-up approvals, and handoffs to tower.
The pilot is a student pilot in a Cessna 172.

Current conditions: VFR, wind 270 at 8 knots, active runway is 27, light traffic.
Airport layout: Two parallel taxiways (Alpha and Bravo), runway 27/09.

IMPORTANT - Conversational Flow:
- This is a CONTINUOUS conversation. Track what you've already told them.
- Remember which taxi instructions you've given
- Don't repeat clearances - acknowledge their readbacks and progress
- Reference previous communications: "Roger, continue taxi" or "Correction, hold short Alpha"
- If they've already been given taxi clearance, just acknowledge their position reports

Your personality:
- Helpful and patient with student pilots
- Acknowledge good readbacks: "Good readback, taxi Alpha"
- Gently correct mistakes: "Correction, hold short of runway 27, not taxiway Alpha"
- Sound like a real person, not automated

Progressive taxi flow (track their progress):
1. Initial call → "Taxi to runway 27 via Alpha, hold short 27"
2. Readback → Verify correct or provide correction
3. Position updates → Brief acknowledgment
4. At hold short → "Contact tower 118.3"
5. After that → They're tower's problem, not yours

Keep responses brief and natural, like actual ground control.""",

    "flight_following": """You are a real approach/center controller providing VFR flight following, having an ongoing conversation.
The pilot is a student pilot in a Cessna 172 on a cross-country flight.
Current conditions: VFR, visibility 10+ miles, scattered clouds at 4,500 feet.

IMPORTANT - Conversational Flow:
- This is a CONTINUOUS radar conversation. Remember their route and position.
- Track their flight: where they're going, current altitude, heading
- Don't ask for information you already have
- Reference previous exchanges: "Roger, radar contact 15 miles south of..."
- Issue traffic callouts based on their position
- Remember if you've already identified them on radar

Your personality:
- Professional but conversational
- Acknowledge good radio work
- Provide helpful traffic advisories
- Sound busy but attentive (realistic workload)
- Use their callsign naturally

Typical flight following flow:
1. Initial request → "Squawk 4521, radar contact, flight following approved"
2. Position reports → "Roger, radar contact confirmed" (only first time)
3. Ongoing → Traffic calls, altitude changes, advisories
4. Near destination → "Frequency change approved, squawk VFR"

Don't over-explain. Real controllers are brief and efficient. Reference the ongoing conversation.""",

    "emergency": """You are a real air traffic controller handling an emergency situation in an ongoing conversation.
A student pilot may be experiencing difficulties or has declared an emergency.

IMPORTANT - Conversational Flow:
- This is a REAL emergency conversation that builds on itself
- Remember what information you've already collected
- Don't re-ask for details you already have (souls on board, fuel, etc.)
- Track their situation as it develops
- Reference previous exchanges: "Roger, understand 3 souls on board, continuing vectors..."

Your emergency response:
- Stay CALM and reassuring - your tone matters
- First response: "Roger, understand emergency. State nature of emergency."
- Collect info ONCE: souls on board, fuel, pilot intentions
- Then HELP: vectors, airport info, emergency services
- Keep them talking but don't overwhelm
- Be human: "You're doing great, just fly the airplane"

Priority:
1. Acknowledge emergency immediately
2. Get essential info (what, where, intentions)
3. Clear traffic, provide assistance
4. Coordinate rescue services
5. Talk them through it calmly

Sound like a real person helping someone in trouble - calm, clear, supportive. This is an ongoing situation, not a script."""
}

def get_atc_response(scenario, conversation_history, pilot_message, custom_system_prompt=None):
    """
    Generate ATC response using OpenAI GPT-4
    """
    try:
        # Use custom system prompt if provided, otherwise select from predefined scenarios
        if custom_system_prompt:
            system_prompt = custom_system_prompt
        else:
            system_prompt = SCENARIO_PROMPTS.get(scenario, SCENARIO_PROMPTS["pattern_work"])

        # Build messages for OpenAI
        messages = [
            {"role": "system", "content": system_prompt}
        ]

        # Add conversation history
        for msg in conversation_history:
            messages.append(msg)

        # Add current pilot message
        messages.append({"role": "user", "content": f"Pilot: {pilot_message}"})

        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-4",
            messages=messages,
            max_tokens=250,  # Allow slightly longer responses for natural conversation
            temperature=0.75,  # Slightly higher for more natural variation
            presence_penalty=0.3,  # Encourage varied responses
            frequency_penalty=0.3  # Reduce repetition
        )

        atc_response = response.choices[0].message.content

        # Check if response includes feedback
        has_feedback = any(word in atc_response.lower() for word in
                          ['should', 'instead', 'correct', 'better', 'try', 'remember'])

        return {
            'success': True,
            'atc_response': atc_response,
            'has_feedback': has_feedback
        }

    except Exception as e:
        print(f"Error calling OpenAI API: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'atc_response': "Radio temporarily out of service. Please try again."
        }

def generate_custom_scenario(user_prompt):
    """
    Use OpenAI to intelligently parse and enhance a custom scenario prompt
    """
    try:
        system_prompt = """You are an expert ATC scenario designer. Given a user's natural language description of a flight scenario,
extract and generate detailed, realistic scenario parameters.

Return a JSON object with the following structure:
{
    "airport": "ICAO code (e.g., KSBN)",
    "airport_name": "Full airport name",
    "aircraft_type": "Aircraft type (default: Cessna 172)",
    "callsign": "Realistic callsign (e.g., N12345 or Skyhawk 234)",
    "scenario_type": "arrival|departure|enroute|practice_area|emergency|ground",
    "altitude": "Altitude in feet (if applicable)",
    "weather": "Weather conditions (default: VFR)",
    "wind": "Wind (e.g., 270 at 8 kts)",
    "runway": "Active runway (e.g., 27)",
    "squawk": "Transponder code (1200-7700)",
    "atis": "ATIS letter (A-Z)",
    "souls_on_board": "Number (1-4)",
    "fuel_remaining": "Hours+Minutes (e.g., 3+45)",
    "scenario_description": "Enhanced 2-3 sentence description of the scenario",
    "initial_call_example": "Example of what the pilot should say first",
    "system_prompt": "Detailed system prompt for the ATC controller AI"
}

Be realistic and aviation-accurate. Fill in missing details intelligently."""

        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Generate a detailed scenario for: {user_prompt}"}
            ],
            max_tokens=1000,
            temperature=0.7,
            response_format={"type": "json_object"}
        )

        scenario_data = json.loads(response.choices[0].message.content)

        return {
            'success': True,
            'scenario': scenario_data
        }

    except Exception as e:
        print(f"Error generating custom scenario: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

def lambda_handler(event, context):
    """
    AWS Lambda handler function
    """
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))

        # Check if this is a scenario generation request
        if body.get('action') == 'generate_scenario':
            user_prompt = body.get('prompt', '')
            if not user_prompt:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type',
                        'Access-Control-Allow-Methods': 'POST, OPTIONS'
                    },
                    'body': json.dumps({
                        'success': False,
                        'error': 'No prompt provided'
                    })
                }

            result = generate_custom_scenario(user_prompt)

            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS'
                },
                'body': json.dumps(result)
            }

        # Otherwise, handle normal ATC response
        scenario = body.get('scenario', 'pattern_work')
        pilot_message = body.get('message', '')
        conversation_history = body.get('history', [])
        custom_system_prompt = body.get('customSystemPrompt', None)  # Support for custom scenarios

        # Validate input
        if not pilot_message:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS'
                },
                'body': json.dumps({
                    'success': False,
                    'error': 'No message provided'
                })
            }

        # Get ATC response (with optional custom system prompt)
        result = get_atc_response(scenario, conversation_history, pilot_message, custom_system_prompt)
        
        # Return response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            'body': json.dumps(result)
        }
        
    except Exception as e:
        print(f"Lambda handler error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            'body': json.dumps({
                'success': False,
                'error': 'Internal server error'
            })
        }
