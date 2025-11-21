from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
from pathlib import Path
from anthropic import Anthropic
from datetime import datetime
import json
import re
import traceback

# Load .env from the same directory as this script
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

app = Flask(__name__)
CORS(app)

# Test API key loading
api_key = os.environ.get("ANTHROPIC_API_KEY")
print(f"Loading .env from: {env_path}")
print(f"API Key loaded: {'Yes' if api_key else 'No'}")

if not api_key:
    print("ERROR: ANTHROPIC_API_KEY not found in environment!")
    print(f"Checked .env file at: {env_path}")
    print(f"File exists: {env_path.exists()}")

client = Anthropic(api_key=api_key)

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        print(f"Received data: {data}")

        sleep_quality = data.get('sleepQuality', 'Unknown')
        prediction_time = data.get('predictionTime', '')
        meals = data.get('meals', [])
        bathroom_visits = data.get('bathroomVisits', [])
        social_interaction_context = data.get('socialInteractionContext', 'Unknown')
        transition_type = data.get('transitionType', 'none')

        # Format meals for the prompt
        meals_summary = []
        if meals:
            for meal in meals:
                meals_summary.append(f"{meal.get('type', 'meal').capitalize()} at {meal.get('time', 'unknown time')}")
        meals_str = ', '.join(meals_summary) if meals_summary else "No meals logged"

        # Format bathroom visits for the prompt
        bathroom_summary = []
        if bathroom_visits:
            for visit in bathroom_visits:
                bathroom_summary.append(f"{visit.get('type', 'unknown').capitalize()} at {visit.get('time', 'unknown time')}")
        bathroom_str = ', '.join(bathroom_summary) if bathroom_summary else "No bathroom visits logged"

        context = f"""
        You are an autism behavior prediction specialist. Analyze the following behavioral and environmental factors to predict stress/behavior levels and provide recommendations.

        Current Status:
        - Sleep Quality: {sleep_quality}
        - Meals/Snacks: {meals_str}
        - Bathroom Visits: {bathroom_str}
        - Social Interaction Context: {social_interaction_context}
        - Transition Type: {transition_type}
        - Prediction Time: {prediction_time if prediction_time else 'Current time'}

        Please provide:
        1. A prediction of expected behavior/stress level (describe the likely behavior state)
        2. Confidence level (as a decimal between 0 and 1, e.g., 0.85 for 85%)
        3. Specific recommendations to support positive outcomes (provide 3-5 actionable recommendations)

        Format your response as JSON with keys: prediction, confidence, recommendations
        The prediction should be a descriptive sentence about the expected behavior.
        The confidence should be a number between 0 and 1.
        The recommendations should be an array of strings with specific, actionable advice.
        """

        print("Calling Claude API...")
        message = client.messages.create(
            max_tokens=1024,
            messages=[{"role": "user", "content": context}],
            model="claude-3-5-haiku-20241022",
        )
        print("Claude API call successful")

        response_text = message.content[0].text
        print(f"Claude response: {response_text}")

        try:
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                prediction_data = json.loads(json_match.group())
            else:
                raise ValueError("No JSON found in response")
        except (json.JSONDecodeError, ValueError) as e:
            print(f"JSON parsing error: {e}")
            prediction_data = {
                'prediction': 'Moderate stress level expected',
                'confidence': 0.5,
                'recommendations': ['Unable to parse response - please try again']
            }

        # Ensure confidence is a decimal between 0 and 1
        confidence = prediction_data.get('confidence', 0.5)
        if isinstance(confidence, (int, float)):
            if confidence > 1:
                confidence = confidence / 100.0
            confidence = max(0.0, min(1.0, confidence))
        else:
            confidence = 0.5

        response = {
            'prediction': prediction_data.get('prediction', 'Moderate stress level expected'),
            'confidence': confidence,
            'recommendations': prediction_data.get('recommendations', ['Please try again']),
            'timestamp': datetime.now().isoformat(),
            'input_data': data
        }

        return jsonify(response), 200

    except Exception as e:
        print(f"Error in predict endpoint: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)