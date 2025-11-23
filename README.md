# ABA Forecast

## Overview

ABA Forecast is a prototype clinical-support tool that forecasts the likelihood of behavioral escalation for clients with Autism Spectrum Disorder (ASD) at specific times of the day. The system helps therapists anticipate challenging periods and plan targeted strategies to reduce reactive crisis management.

## Demo Video 
Watch a quick walkthrough of ABA Forecast in action:

https://github.com/user-attachments/assets/e8eb66d1-8c04-45f6-8e06-e6e658cef61e

## Key Features

- **Behavioral Prediction** — ML model trained on clinic data to estimate escalation risk.
- **Weather-aware** — integrates OpenWeatherMap data to include environmental context.
- **Multi-factor Inputs** — sleep quality, food intake, toileting, transitions, and social context are considered.
- **AI Insights** — Anthropic Claude provides explanations and ABA-informed strategy suggestions.
- **Interactive Dashboard** — therapists can input data and view predictions and recommendations in the UI.

## Important Notes

- ABA Forecast is **not a diagnostic device**. Use it as a planning aid only.
- Predictions are probabilistic and should supplement professional clinical judgment.

## Technology Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Python Flask
- **AI / ML**: Anthropic Claude API, scikit-learn
- **APIs**: OpenWeatherMap
- **Package managers**: `pnpm` (frontend), `uv` or `pip` (backend)

## Prerequisites

Install these before setup:

- Node.js v18+
- `pnpm` (or `npm`)
- Python 3.8+
- `uv` (optional, recommended) — https://docs.astral.sh/uv/

You will also need API keys for:

- Anthropic Claude API: https://console.anthropic.com/
- OpenWeatherMap API: https://openweathermap.org/api

## Installation & Setup

Follow these steps from the project root directory.

1) Clone the repository

```bash
git clone <repository-url>
cd Anthropic-Hackathon
```

2) Add environment variables

Create `./.env.local` (frontend) with:

```env
OPENWEATHER_API_KEY=your_openweather_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

Create `backend/.env` (backend) with:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

3) Install frontend dependencies

```bash
pnpm install
```

4) Create and activate Python virtual environment

Using `uv` (recommended):

```powershell
uv venv
.venv\Scripts\activate
```

Or with standard `venv`:

```powershell
python -m venv .venv
.venv\Scripts\activate
```

5) Install backend dependencies

```bash
pip install -r backend/requirements.txt
```

## Running the App

You must run both frontend and backend servers.

Terminal 1 — Frontend:

```bash
pnpm run dev
```

Open the frontend at `http://localhost:3000`.

Terminal 2 — Backend:

```bash
python backend/app.py
```

Backend API defaults to `http://localhost:5000`.

## Project Layout

```
Anthropic-Hackathon/
├── app/                    # Next.js app
│   ├── api/                # API routes
│   ├── globals.css         # Global styles
│   └── ...
├── backend/                # Flask backend & ML code
│   ├── app.py
│   ├── train_model.py
│   ├── generate_synthetic_data.py
│   ├── data/
│   └── models/
├── components/             # React components
└── README.md               # You are here
```

## Usage — Quick Flow

1. Enter client/session data (sleep, food, toileting, transitions).
2. View predicted escalation risk for the day/time slots.
3. Read AI explanations and suggested ABA strategies.
4. Monitor trends and update inputs over time.

## Development & Data

- Retrain model:

```bash
python backend/train_model.py
```

- Generate synthetic data for experiments:

```bash
python backend/generate_synthetic_data.py
```

## Contributing

- Please open issues for bugs or feature requests.
- For code contributions, create PRs against `dev` and include a clear description and tests where practical.

## License & Use

This project is a prototype for clinical support and educational purposes. Do not use as a replacement for clinical training or professional judgment.

## Contact / Support

Open an issue in this repository for questions, bugs, or feature requests.

---

Thank you for using ABA Forecast, built to help clinicians plan proactively.
