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

        sleep_quality = data.get('sleepQuality')
        time_since_last_meal = data.get('timeSinceLastMeal')
        time_since_last_bathroom = data.get('timeSinceLastBathroom')
        screen_time_today = data.get('screenTimeToday')
        time_since_outdoor = data.get('timeSinceOutdoor')
        social_interaction_level = data.get('socialInteractionLevel')
        recent_transitions = data.get('recentTransitions')
        prediction_time = data.get('predictionTime')

        context = f"""
        You are an autism behavior prediction specialist. Analyze the following behavioral and environmental factors to predict stress/behavior levels and provide recommendations.

        Current Status:
        - Sleep Quality: {sleep_quality}
        - Time Since Last Meal: {time_since_last_meal} minutes
        - Time Since Last Bathroom: {time_since_last_bathroom} minutes
        - Screen Time Today: {screen_time_today} minutes
        - Time Since Outdoor Activity: {time_since_outdoor} minutes
        - Social Interaction Level: {social_interaction_level}
        - Recent Transitions: {recent_transitions}
        - Prediction Time: {prediction_time if prediction_time else 'Current time'}

        Please provide:
        1. A prediction of expected behavior/stress level (Low, Moderate, or High)
        2. Confidence level (0-100%)
        3. Key factors influencing this prediction
        4. Specific recommendations to support positive outcomes

        Format your response as JSON with keys: prediction, confidence, factors, recommendations
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
                'prediction': 'Moderate',
                'confidence': 50,
                'factors': ['Unable to parse response'],
                'recommendations': ['Please try again']
            }

        response = {
            'prediction': prediction_data.get('prediction', 'Moderate stress level expected'),
            'confidence': prediction_data.get('confidence', 0),
            'factors': prediction_data.get('factors', []),
            'recommendations': prediction_data.get('recommendations', []),
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