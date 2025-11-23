from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
from pathlib import Path
from anthropic import Anthropic
from datetime import datetime
import joblib
import pandas as pd
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
model_name = "claude-sonnet-4-5-20250929" # or another Claude model you can use

client = Anthropic(api_key=api_key)

# Store latest weather data
weather = {}

def convert_time_to_numeric(time_value):
    """Convert time string (HH:MM) to numeric format (HHMM as integer)"""
    if isinstance(time_value, int):
        return time_value

    if isinstance(time_value, str):
        # Remove any colons and convert to int
        time_str = time_value.replace(":", "")
        return int(time_str)

    return None

@app.route('/weather', methods=['POST'])
def receive_weather():
    try:
        global weather
        data = request.json

        # Store weather in OpenWeatherMap API format for compatibility with predict endpoint
        weather = {
            "main": {
                "temp": data.get("temperature"),
                "feels_like": data.get("feels_like"),
                "humidity": data.get("humidity")
            },
            "weather": [{
                "main": data.get("condition"),
                "description": data.get("condition", "").lower()
            }],
            "wind": {
                "speed": data.get("wind_speed")
            },
            "name": data.get("location"),
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

        # Debugging: Log the raw request data
        # ==================== RAW REQUEST DATA LOGGING ====================
        print("\n" + "="*70)
        print("📥 RAW REQUEST DATA FROM FRONTEND")
        print("="*70)
        print(json.dumps(data, indent=2, default=str))
        print("="*70 + "\n")
        # ==================================================================

        # Debug: Log if weather data is available
        print(f"Weather data available: {bool(weather)}")
        if weather:
            print(f"Weather data: {weather}")

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
            elif weather_main in ["Clouds", "Cloudy", "Fog", "Sand", "Ash", "Squall", "Smoke", "Haze", "Mist"]:
                weather_type_numeric = 1
            elif weather_main in ["Rain", "Drizzle", "Snow"]:
                weather_type_numeric = 2
            else:
                weather_type_numeric = 3

            # Debug: Log extracted weather values
            print(f"Extracted weather - Temp: {weather_temp}°C, Humidity: {weather_humidity}%, Type: {weather_main} -> {weather_type_numeric}")

        # Helper function to parse time from 'HH:MM' format to datetime
        def parse_time_string(time_str):
            """Convert 'HH:MM' time string to datetime object using today's date"""
            if not time_str:
                return None
            try:
                # Try ISO format first
                return datetime.fromisoformat(time_str)
            except ValueError:
                # Parse 'HH:MM' format
                hour, minute = map(int, time_str.split(':'))
                now = datetime.now()
                return now.replace(hour=hour, minute=minute, second=0, microsecond=0)

        # Calculate time_since_last_meal_min from meals array
        meals = data.get("meals", [])
        time_since_last_meal_min = None
        if meals:
            # Get the latest meal time
            latest_meal_time = max([parse_time_string(meal["time"]) for meal in meals if meal.get("time")])
            current_time = datetime.now()
            time_since_last_meal_min = int((current_time - latest_meal_time).total_seconds() / 60)

        # Calculate time_since_last_void_min from bathroomVisits array (only "no void" type)
        bathroom_visits = data.get("bathroomVisits", [])
        time_since_last_void_min = None
        no_void_visits = [visit for visit in bathroom_visits if visit.get("type") == "no void"]
        if no_void_visits:
            latest_no_void_time = max([parse_time_string(visit["time"]) for visit in no_void_visits if visit.get("time")])
            current_time = datetime.now()
            time_since_last_void_min = int((current_time - latest_no_void_time).total_seconds() / 60)

        # Calculate toileting_status_bucket_numeric from bathroomVisits array
        toileting_status_bucket_numeric = 0
        if bathroom_visits:
            current_time = datetime.now()
            last_60_min_visits = [
                visit for visit in bathroom_visits
                if visit.get("time") and (current_time - parse_time_string(visit["time"])).total_seconds() <= 3600
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

        # ==================== CALCULATED VALUES LOGGING ====================
        print("="*70)
        print("🔧 CALCULATED/PROCESSED VALUES")
        print("="*70)
        print(f"Time Calculations:")
        print(f"  • Time since last meal:    {time_since_last_meal_min} minutes")
        print(f"  • Time since last void:    {time_since_last_void_min} minutes")
        print(f"\nToileting Status:")
        print(f"  • Toileting status bucket: {toileting_status_bucket_numeric}")
        print(f"     (0=Normal, 1=Any void accident in 60min, 2=No void in 60min, 3=Recent accident)")
        print(f"  • Recent accident flag:    {recent_accident_flag}")
        print(f"\nContext Mappings:")
        print(f"  • Transition type numeric: {transition_type_numeric} (from '{data.get('transitionType')}')")
        print(f"  • Social context numeric:  {social_context_numeric} (from '{data.get('socialInteractionContext')}')")
        print(f"\nWeather (used in model):")
        print(f"  • Temperature:             {temperature}°C")
        print(f"  • Humidity:                {humidity}%")
        print(f"  • Weather type numeric:    {weather_type}")
        print(f"     (0=Clear, 1=Cloudy/Fog, 2=Rain/Snow, 3=Extreme)")
        print("="*70 + "\n")
        # ====================================================================

        # Prepare features for the model
        features = pd.DataFrame([{
            "sleep_quality_numeric": data.get("sleep_quality_numeric"),
            "time_numeric": convert_time_to_numeric(data.get("time_numeric")),
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
        }])

        # ==================== MODEL INPUT LOGGING ====================
        print("\n" + "="*70)
        print("🤖 MODEL INPUT DATA")
        print("="*70)
        print("\nFeatures DataFrame:")
        print(features.to_string())
        print("\nFeature Values:")
        for column in features.columns:
            print(f"  • {column:35s} = {features[column].iloc[0]}")
        print("="*70 + "\n")
        # ============================================================

        # Get prediction
        prediction = model.predict(features)[0]
        prediction_proba = model.predict_proba(features)[0]
        confidence = float(max(prediction_proba))

        # ==================== MODEL OUTPUT LOGGING ====================
        print("="*70)
        print("🎯 MODEL PREDICTION OUTPUT")
        print("="*70)
        print(f"  • Raw Prediction:          {prediction}")
        print(f"  • Prediction Label:        {'HIGH RISK (1)' if prediction == 1 else 'LOW RISK (0)'}")
        print(f"  • Probability [Low, High]: {prediction_proba}")
        print(f"  • Low Risk Probability:    {prediction_proba[0]:.4f} ({prediction_proba[0]*100:.2f}%)")
        print(f"  • High Risk Probability:   {prediction_proba[1]:.4f} ({prediction_proba[1]*100:.2f}%)")
        print(f"  • Confidence:              {confidence:.4f} ({confidence*100:.2f}%)")
        print("="*70 + "\n")

        # Include weather in Claude prompt
        weather_condition = weather.get("weather", [{}])[0].get("main", "Unknown") if weather else "Unknown"

        # Debug: Log weather values being used
        print(f"Weather values for Claude - Condition: {weather_condition}, Temp: {temperature}°C, Humidity: {humidity}%")

        # Map numeric values to readable descriptions
        sleep_quality_desc = {0: "Very Poor", 1: "Poor", 2: "Fair", 3: "Good", 4: "Excellent"}.get(data.get("sleep_quality_numeric"), "Unknown")
        toileting_status_desc = {0: "Normal", 1: "Any void accident in 60 min", 2: "No void in 60 min", 3: "Recent accident"}.get(toileting_status_bucket_numeric, "Unknown")

        # Format weather display based on whether real weather data is available
        if temperature is not None and humidity is not None and weather_condition != "Unknown":
            weather_display = f"{weather_condition}, {temperature}°C, {humidity}% humidity"
        else:
            weather_display = "Weather data not available"

        prompt = f"""You are a Board Certified Behavior Analyst (BCBA) providing session support for ABA therapists and RBTs working in a clinic setting. Analyze the following behavioral data and provide practical, session-ready strategies for table work, NET (Natural Environment Teaching), transitions, and other typical ABA activities.

BEHAVIORAL PREDICTION DATA:
- Risk of Escalation: {"HIGH - Increased likelihood of challenging behavior/escalation" if prediction == 1 else "LOW - Baseline behavioral stability expected"}
- Model Confidence: {confidence * 100:.1f}%
- Probability of Challenging Behavior: {prediction_proba[1] * 100:.1f}%
- Probability of Appropriate Behavior: {prediction_proba[0] * 100:.1f}%

ANTECEDENT ANALYSIS (Motivating Operations & Setting Events):

Physiological Motivating Operations:
- Sleep Quality: {sleep_quality_desc} (Score: {data.get("sleep_quality_numeric")}/4)
- Time Since Last Meal: {time_since_last_meal_min if time_since_last_meal_min else "N/A"} minutes (hunger may be an MO)
- Time Since Last Void: {time_since_last_void_min if time_since_last_void_min else "N/A"} minutes (discomfort may be an MO)
- Toileting Status: {toileting_status_desc}
- Recent Accident: {"Yes" if recent_accident_flag else "No"}

Environmental Context:
- Current Weather: {weather_display}
- Time of Day: {data.get("time_numeric")}
- Day of Week: {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][data.get("weekday_numeric", 0)]}
- Transition Type: {data.get("transitionType", "none").replace("_", " ").title()}
- Social Context: {data.get("socialInteractionContext", "alone").replace("_", " ").title()}

Please provide a detailed behavioral analysis in the following format, using clear ABA language and focusing on what is practical for therapists/technicians working in an ABA clinic session (table work, NET, transitions, etc.):

BEHAVIORAL ANALYSIS:
In 3–5 sentences, describe:
- How current motivating operations (sleep, hunger, toileting, sensory context) and recent events might be setting the occasion for problem behavior.
- The most likely antecedent patterns and probable functions of problem behavior in this context (for example, escape, attention, tangible, automatic).
- How this risk profile might show up during typical ABA activities (discrete trials, transitions between tasks, group time, NET).
- How current motivating operations (sleep, hunger, toileting, sensory context) and recent events might be setting the occasion for problem behavior.
KEY RISK FACTORS:
List the 2–4 most clinically relevant risk factors from the data above. Focus specifically on:
- Antecedent triggers or transitions that are likely to produce problem behavior.
- Current MOs/EOs (for example, low sleep, long time since meal/void, recent accident).
- Social or environmental variables (group size, noise level, type of transition) that increase the likelihood of escalation.

PROTECTIVE FACTORS:
List 2–3 factors that the ABA team can lean on during this session, such as:
- Existing supports (visual schedules, token systems, first/then, transition warnings).
- Learner strengths or strong reinforcers that can be used proactively.
- Any contextual elements that reduce risk (predictable routine, 1:1 support, calm environment).
- Antecedent triggers or transitions that are likely to produce problem behavior.
ACTIONABLE RECOMMENDATIONS:
Provide 4–6 concrete, session-ready ABA strategies. Each item should be:
- A specific action that a therapist/RBT can implement in the next 1–2 hours.
- Focused on antecedent interventions (for example, transition warnings, task modification, choice-making), proactive reinforcement (for example, dense schedule of reinforcement, noncontingent access to certain stimuli), and teaching/rehearsing replacement behaviors (for example, functional communication) BEFORE problem behavior escalates.
- Written in "do this" language (for example, "Before starting work, provide a 2-step visual 'first/then' with a preferred item," not vague suggestions).
- Any contextual elements that reduce risk (predictable routine, 1:1 support, calm environment).

ACTIONABLE RECOMMENDATIONS:
Provide 4–6 concrete, session-ready ABA strategies. Each item should be:
- A specific action that a therapist/RBT can implement in the next 1–2 hours.
- Focused on antecedent interventions (for example, transition warnings, task modification, choice-making), proactive reinforcement (for example, dense schedule of reinforcement, noncontingent access to certain stimuli), and teaching/rehearsing replacement behaviors (for example, functional communication) BEFORE problem behavior escalates.
- Written in "do this" language (for example, "Before starting work, provide a 2-step visual 'first/then' with a preferred item," not vague suggestions).

MONITORING PRIORITIES:
List 2–4 things the ABA team should actively watch for and document during the session, such as:
- Early warning signs or precursor behaviors that typically occur before full escalation.
- How the learner responds to specific antecedent strategies or reinforcement changes.
- Any changes in suspected function or triggers that should be communicated to the supervising BCBA and used to refine the behavior plan or prediction model later."""

        message = client.messages.create(
            model=model_name,
            max_tokens=2048,
            messages=[{"role": "user", "content": prompt}]
        )

        # Parse the Claude response to extract sections
        claude_response = message.content[0].text

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
            "analysis": claude_response,
            "recommendations": claude_response  # Keep for backward compatibility
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    # TESTING ENDPOINT
# @app.route('/predict/test', methods=['POST'])
# def predict_test():
#     """Test endpoint that returns raw model predictions without Claude recommendations"""
#     try:
#         data = request.json
#
#         # Extract weather data
#         weather_temp = None
#         weather_humidity = None
#         weather_type_numeric = None
#
#         if weather:
#             weather_temp = weather.get("main", {}).get("temp")
#             weather_humidity = weather.get("main", {}).get("humidity")
#             weather_main = weather.get("weather", [{}])[0].get("main", "")
#
#             if weather_main in ["Clear"]:
#                 weather_type_numeric = 0
#             elif weather_main in ["Clouds", "Cloudy", "Fog", "Sand", "Ash", "Squall", "Smoke", "Haze", "Mist"]:
#                 weather_type_numeric = 1
#             elif weather_main in ["Rain", "Drizzle", "Snow"]:
#                 weather_type_numeric = 2
#             else:
#                 weather_type_numeric = 3
#
#         # Calculate time_since_last_meal_min
#         meals = data.get("meals", [])
#         time_since_last_meal_min = None
#         if meals:
#             latest_meal_time = max([datetime.fromisoformat(meal["time"]) for meal in meals])
#             current_time = datetime.now()
#             time_since_last_meal_min = int((current_time - latest_meal_time).total_seconds() / 60)
#
#         # Calculate time_since_last_void_min
#         bathroom_visits = data.get("bathroomVisits", [])
#         time_since_last_void_min = None
#         no_void_visits = [visit for visit in bathroom_visits if visit.get("type") == "no void"]
#         if no_void_visits:
#             latest_no_void_time = max([datetime.fromisoformat(visit["time"]) for visit in no_void_visits])
#             current_time = datetime.now()
#             time_since_last_void_min = int((current_time - latest_no_void_time).total_seconds() / 60)
#
#         # Calculate toileting_status_bucket_numeric
#         toileting_status_bucket_numeric = 0
#         if bathroom_visits:
#             current_time = datetime.now()
#             last_60_min_visits = [
#                 visit for visit in bathroom_visits
#                 if (current_time - datetime.fromisoformat(visit["time"])).total_seconds() <= 3600
#             ]
#
#             void_accidents = [v for v in last_60_min_visits if v.get("type") in ["bowel movement accident", "urine accident"]]
#             void_types = ["urine", "bowel movement", "bowel movement accident", "urine accident"]
#             any_void = [v for v in last_60_min_visits if v.get("type") in void_types]
#
#             if void_accidents:
#                 toileting_status_bucket_numeric = 3
#             elif not any_void:
#                 toileting_status_bucket_numeric = 2
#             elif any(v.get("type") in ["bowel movement accident", "urine accident"] for v in last_60_min_visits):
#                 toileting_status_bucket_numeric = 1
#
#         recent_accident_flag = 1 if toileting_status_bucket_numeric == 3 else 0
#
#         # Map numeric values
#         transition_map = {"none": 0, "minor": 1, "moderate": 2, "major": 3}
#         transition_type_numeric = transition_map.get(data.get("transitionType"), 0)
#
#         social_context_map = {"alone": 0, "plus_one": 1, "small_group": 2, "large_group": 3}
#         social_context_numeric = social_context_map.get(data.get("socialInteractionContext"), 0)
#
#         temperature = weather_temp if weather_temp is not None else data.get("temperature_c")
#         humidity = weather_humidity if weather_humidity is not None else data.get("humidity_percent")
#         weather_type = weather_type_numeric if weather_type_numeric is not None else data.get("weather_type_numeric")
#
#         # Prepare features
#         features = pd.DataFrame([{
#             "sleep_quality_numeric": data.get("sleep_quality_numeric"),
#             "time_numeric": data.get("time_numeric"),
#             "weekday_numeric": data.get("weekday_numeric"),
#             "temperature_c": temperature,
#             "humidity_percent": humidity,
#             "weather_type_numeric": weather_type,
#             "time_since_last_meal_min": time_since_last_meal_min or data.get("time_since_last_meal_min"),
#             "time_since_last_void_min": time_since_last_void_min or data.get("time_since_last_void_min"),
#             "recent_accident_flag": recent_accident_flag,
#             "toileting_status_bucket_numeric": toileting_status_bucket_numeric,
#             "transition_type_numeric": transition_type_numeric,
#             "social_context_numeric": social_context_numeric,
#         }])
#
#         # Get prediction
#         prediction = model.predict(features)[0]
#         prediction_proba = model.predict_proba(features)[0]
#         confidence = float(max(prediction_proba))
#
#         return jsonify({
#             "prediction": int(prediction),
#             "prediction_label": "High Risk (1)" if prediction == 1 else "Low Risk (0)",
#             "raw_prediction_value": int(prediction),
#             "confidence": round(confidence, 3),
#             "probabilities": {
#                 "low_risk_class_0": round(float(prediction_proba[0]), 3),
#                 "high_risk_class_1": round(float(prediction_proba[1]), 3)
#             },
#             "input_features": features.to_dict(orient='records')[0],
#             "calculated_values": {
#                 "time_since_last_meal_min": time_since_last_meal_min,
#                 "time_since_last_void_min": time_since_last_void_min,
#                 "toileting_status_bucket_numeric": toileting_status_bucket_numeric,
#                 "transition_type_numeric": transition_type_numeric,
#                 "social_context_numeric": social_context_numeric
#             }
#         })
#
#     except Exception as e:
#         print(f"Error in predict_test: {str(e)}")
#         print(traceback.format_exc())
#         return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)