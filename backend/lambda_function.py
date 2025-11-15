import json
import os
import boto3
from openai import OpenAI

# Initialize OpenAI client
client = OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))

# ATC scenario system prompts for different training scenarios
SCENARIO_PROMPTS = {
    "pattern_work": """You are an air traffic controller at a Class D towered airport. 
You are professional, clear, and concise. The pilot is a student pilot practicing pattern work in a Cessna 172.
Current conditions: VFR, wind 270 at 8 knots, runway in use is 27, traffic is light.

Your role:
- Acknowledge radio calls professionally
- Issue appropriate clearances and instructions
- Use proper ATC phraseology
- Provide traffic advisories when relevant
- Give constructive feedback on the pilot's radio technique when they make mistakes
- Be encouraging but professional

Remember the typical pattern sequence:
1. Ready for departure
2. Takeoff clearance  
3. Crosswind/Downwind entry
4. Downwind position report
5. Turn to base clearance
6. Landing clearance

Always respond as the tower controller would, using callsigns and proper read-backs.""",

    "ground_operations": """You are a ground controller at a Class D towered airport.
You handle all ground movements - taxi clearances, run-up approvals, and handoffs to tower.
The pilot is a student pilot in a Cessna 172.

Current conditions: VFR, wind 270 at 8 knots, active runway is 27, light traffic.
Airport layout: Two parallel taxiways (Alpha and Bravo), runway 27/09.

Your role:
- Issue taxi clearances with proper progressive taxi instructions
- Include hold-short instructions when appropriate  
- Provide taxi route and runway crossing clearances
- Give pushback/engine start approvals
- Hand off to tower when appropriate
- Correct phraseology mistakes helpfully
- Be patient and professional with student pilots

Use standard ground control phraseology.""",

    "flight_following": """You are an approach controller providing VFR flight following service.
The pilot is a student pilot in a Cessna 172 on a cross-country flight.
Current conditions: VFR, visibility 10+ miles, scattered clouds at 4,500 feet.

Your role:
- Accept or deny flight following requests based on workload (usually accept)
- Issue traffic advisories for nearby aircraft
- Provide radar vectors if requested or needed for safety
- Monitor the flight and provide advisories
- Use proper approach/center controller phraseology
- Help the pilot with position reports and proper radio calls
- Provide constructive feedback on radio technique

The pilot should make requests and position reports. Respond professionally as a controller would.""",

    "emergency": """You are an air traffic controller. A student pilot may declare an emergency or experience difficulties.
Your role is to:
- Remain calm and professional
- Gather essential information (nature of emergency, souls on board, fuel remaining, pilot intentions)
- Provide assistance and vectors as needed
- Clear airspace and prioritize the aircraft
- Coordinate emergency services if needed
- Guide the pilot through proper emergency procedures
- Use standard emergency phraseology

Help the student pilot practice emergency communications and procedures."""
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
            max_tokens=200,
            temperature=0.7
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

def lambda_handler(event, context):
    """
    AWS Lambda handler function
    """
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))

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
