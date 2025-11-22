from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
from pathlib import Path
from anthropic import Anthropic
from datetime import datetime
import joblib
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

model_path = Path("backend/models/behavior_predictor.joblib")
model = joblib.load(model_path)

client = Anthropic(api_key=api_key)

# Store latest weather data
weather = {}

@app.route('/weather', methods=['POST'])
def receive_weather():
    try:
        global weather
        data = request.json

        weather = {
            "temperature": data.get("temperature"),
            "feels_like": data.get("feels_like"),
            "humidity": data.get("humidity"),
            "wind_speed": data.get("wind_speed"),
            "condition": data.get("condition"),
            "location": data.get("location"),
            "timestamp": data.get("timestamp", datetime.now().isoformat())
        }

        print(f"Received weather data: {weather}")

        return jsonify({
            "status": "success",
            "message": "Weather data received",
            "data": weather
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json

        # Extract weather data from the weather object
        weather_temp = None
        weather_humidity = None
        weather_type_numeric = None

        if weather:
            # Get temperature from main.temp
            weather_temp = weather.get("main", {}).get("temp")

            # Get humidity from main.humidity (already in percent)
            weather_humidity = weather.get("main", {}).get("humidity")

            # Get weather type and convert to numeric
            weather_main = weather.get("weather", [{}])[0].get("main", "")

            # Format weather type according to your mapping
            if weather_main in ["Clear"]:
                weather_type_numeric = 0
            elif weather_main in ["Clouds", "Cloudy", "Fog" "Sand", "Ash", "Squall", "Smoke", "Haze", "Mist"]:
                weather_type_numeric = 1
            elif weather_main in ["Rain", "Drizzle", "Snow"]:
                weather_type_numeric = 2
            else:
                weather_type_numeric = 3

        # Calculate time_since_last_meal_min from meals array
        meals = data.get("meals", [])
        time_since_last_meal_min = None
        if meals:
            # Get the latest meal time
            latest_meal_time = max([datetime.fromisoformat(meal["time"]) for meal in meals])
            current_time = datetime.now()
            time_since_last_meal_min = int((current_time - latest_meal_time).total_seconds() / 60)

        # Calculate time_since_last_void_min from bathroomVisits array (only "no void" type)
        bathroom_visits = data.get("bathroomVisits", [])
        time_since_last_void_min = None
        no_void_visits = [visit for visit in bathroom_visits if visit.get("type") == "no void"]
        if no_void_visits:
            latest_no_void_time = max([datetime.fromisoformat(visit["time"]) for visit in no_void_visits])
            current_time = datetime.now()
            time_since_last_void_min = int((current_time - latest_no_void_time).total_seconds() / 60)

        # Calculate toileting_status_bucket_numeric from bathroomVisits array
        toileting_status_bucket_numeric = 0
        if bathroom_visits:
            current_time = datetime.now()
            last_60_min_visits = [
                visit for visit in bathroom_visits
                if (current_time - datetime.fromisoformat(visit["time"])).total_seconds() <= 3600
            ]

            # Check for void accidents in last 60 minutes
            void_accidents = [v for v in last_60_min_visits if v.get("type") in ["bowel movement accident", "urine accident"]]

            # Check for any void/movement in last 60 minutes
            void_types = ["urine", "bowel movement", "bowel movement accident", "urine accident"]
            any_void = [v for v in last_60_min_visits if v.get("type") in void_types]

            if void_accidents:
                toileting_status_bucket_numeric = 3  # Recent accident
            elif not any_void:
                toileting_status_bucket_numeric = 2  # No void in 60 min
            elif any(v.get("type") in ["bowel movement accident", "urine accident"] for v in last_60_min_visits):
                toileting_status_bucket_numeric = 1  # Any void accident in 60 min

        # Calculate recent_accident_flag
        recent_accident_flag = 1 if toileting_status_bucket_numeric == 3 else 0

        # Map transition_type_numeric from transitionType
        transition_map = {"none": 0, "minor": 1, "moderate": 2, "major": 3}
        transition_type_numeric = transition_map.get(data.get("transitionType"), 0)

        # Map social_context_numeric from socialInteractionContext
        social_context_map = {"alone": 0, "plus_one": 1, "small_group": 2, "large_group": 3}
        social_context_numeric = social_context_map.get(data.get("socialInteractionContext"), 0)

        # Use weather data if available, otherwise fall back to form data
        temperature = weather_temp if weather_temp is not None else data.get("temperature_c")
        humidity = weather_humidity if weather_humidity is not None else data.get("humidity_percent")
        weather_type = weather_type_numeric if weather_type_numeric is not None else data.get("weather_type_numeric")

        # Prepare features for the model
        features = pd.DataFrame([{
            "sleep_quality_numeric": data.get("sleep_quality_numeric"),
            "time_numeric": data.get("time_numeric"),
            "weekday_numeric": data.get("weekday_numeric"),
            "temperature_c": temperature,
            "humidity_percent": humidity,
            "weather_type_numeric": weather_type,
            "time_since_last_meal_min": time_since_last_meal_min or data.get("time_since_last_meal_min"),
            "time_since_last_void_min": time_since_last_void_min or data.get("time_since_last_void_min"),
            "recent_accident_flag": recent_accident_flag,
            "toileting_status_bucket_numeric": toileting_status_bucket_numeric,
            "transition_type_numeric": transition_type_numeric,
            "social_context_numeric": social_context_numeric,
            "antecedent_category_numeric": data.get("antecedent_category_numeric"),
            "function_inferred_numeric": data.get("function_inferred_numeric"),
            "behaviour_level": data.get("behaviour_level"),
        }])

        # Get prediction
        prediction = model.predict(features)[0]
        prediction_proba = model.predict_proba(features)[0]
        confidence = float(max(prediction_proba))

        # Include weather in Claude prompt
        weather_condition = weather.get("weather", [{}])[0].get("main", "Unknown") if weather else "Unknown"
        weather_info = f"\nCurrent weather: {weather_condition}, {temperature}°C, {humidity}% humidity"

        prompt = f"""Based on the following behavioral analysis:

Prediction: {"High stress/escalation risk" if prediction == 1 else "Low stress/escalation risk"}
Confidence: {confidence * 100:.1f}%
{weather_info}

Input factors:
- Sleep quality: {data.get("sleep_quality_numeric")}
- Temperature: {temperature}°C
- Humidity: {humidity}%
- Weather type: {weather_condition}
- Time since last meal: {time_since_last_meal_min} minutes
- Toileting status: {toileting_status_bucket_numeric}
- Transition type: {data.get("transitionType")}
- Social context: {data.get("socialInteractionContext")}
- Behavior level: {data.get("behaviour_level")}

Provide 3-5 actionable recommendations to prevent behavioral escalation."""

        message = anthropic_client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}]
        )

        return jsonify({
            "prediction": int(prediction),
            "prediction_label": "High Risk" if prediction == 1 else "Low Risk",
            "confidence": round(confidence, 3),
            "probabilities": {
                "low_risk": round(float(prediction_proba[0]), 3),
                "high_risk": round(float(prediction_proba[1]), 3)
            },
            "calculated_values": {
                "time_since_last_meal_min": time_since_last_meal_min,
                "time_since_last_void_min": time_since_last_void_min,
                "toileting_status_bucket_numeric": toileting_status_bucket_numeric,
                "transition_type_numeric": transition_type_numeric,
                "social_context_numeric": social_context_numeric
            },
            "weather_used": {
                "temperature": temperature,
                "humidity": humidity,
                "condition": weather_condition,
                "type_numeric": weather_type
            } if weather else None,
            "recommendations": message.content[0].text
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)