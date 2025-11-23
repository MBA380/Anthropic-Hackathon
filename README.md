# ABA Forecast

## Overview

ABA Forecast is a prototype clinical-support tool that forecasts the likelihood of behavior
escalation for a specific autistic child at specific times of the day. The system is built on:

- Daily clinician input for sleep quality
- Automatically retrieved weather data
- Time-based predictors
- Dynamic clinic-tracked variables (food intake, toileting, transitions, social context)
- Historical antecedent patterns and inferred behavior functions
- Claude for interpretation, explanation, and strategy generation

The objective is to help clinicians anticipate challenging periods, improve preparation,
and reduce reactive crisis management. ABA Forecast is not a diagnostic device.
It provides planning support and strategy suggestions derived from patterns in the
data and ABA-informed principles.

## Deployment

1. Clone the repository
2. Create a .env.local file in your project root directory and provide your OpenWeatherMap API key and your Anthropic API key as **OPENWEATHER_API_KEY=key** and **ANTHROPIC_API_KEY=key**
3. Create a .env file within the backend/ directory and provide your Anthropic Claude API key once again as **ANTHROPIC_API_KEY=key**
4. Download dependencies by running 'pnpm install' then 'pnpm run dev' to start the server (you can use npm as well)
5. Create python venv using [uv](https://docs.astral.sh/uv/) (recommended) with "uv venv" then "source .venv/bin/activate"
6. Install backend dependencies with "uv pip install -r backend/requirements.txt"
7. Run "python backend/app.py" to start the backend server
8. Use the application by navigating to localhost:3000