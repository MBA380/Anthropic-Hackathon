from __future__ import annotations

import json
from textwrap import dedent
from typing import Any, Dict

import railtracks as rt

_agents_cache: Dict[str, Any] = {}


def _format_percent(value: Any) -> str:
    try:
        return f"{float(value) * 100:.1f}%"
    except (TypeError, ValueError):
        return "N/A"


def _format_minutes(value: Any) -> str:
    if value is None:
        return "Unknown"
    try:
        return f"{int(value)} minutes"
    except (TypeError, ValueError):
        return "Unknown"


def _ensure_agent(model_name: str):
    agent = _agents_cache.get(model_name)
    if agent:
        return agent

    system_message = dedent(
        """
        You are an experienced BCBA who writes concise, clinic-ready behavioral analyses.
        Stay practical, emphasize antecedents and motivating operations, and recommend
        concrete actions RBTs can implement within the next session.
        Output must be actionable and reference information from the provided context.
        """
    ).strip()

    agent = rt.agent_node(
        "Behavior Analysis Agent",
        llm=rt.llm.AnthropicLLM(model_name),
        system_message=system_message,
    )
    _agents_cache[model_name] = agent
    return agent


def _build_context(payload: Dict[str, Any]) -> str:
    lines: list[str] = []

    risk_label = payload.get("prediction_label") or (
        "High Risk" if payload.get("prediction") == 1 else "Low Risk"
    )
    confidence = _format_percent(payload.get("confidence"))
    probabilities = payload.get("probabilities", {})
    low_prob = _format_percent(probabilities.get("low_risk"))
    high_prob = _format_percent(probabilities.get("high_risk"))

    lines.append("Prediction Summary:")
    lines.append(f"- Risk Level: {risk_label}")
    lines.append(f"- Model Confidence: {confidence}")
    lines.append(f"- Low Risk Probability: {low_prob}")
    lines.append(f"- High Risk Probability: {high_prob}")

    calc = payload.get("calculated_values", {})
    lines.append("\nMotivating Operations / Physiological Context:")
    lines.append(f"- Sleep Quality (0-4): {payload.get('sleep_quality_numeric', 'N/A')}")
    lines.append(
        f"- Time Since Last Meal: {_format_minutes(calc.get('time_since_last_meal_min'))}"
    )
    lines.append(
        f"- Time Since Last Void: {_format_minutes(calc.get('time_since_last_void_min'))}"
    )
    lines.append(
        f"- Toileting Status Bucket: {calc.get('toileting_status_bucket_numeric', 'Unknown')}"
    )
    lines.append(f"- Recent Accident Flag: {calc.get('recent_accident_flag', 0)}")

    lines.append("\nEnvironmental Context:")
    lines.append(f"- Transition Type: {payload.get('transitionType', 'none')}")
    lines.append(
        f"- Social Context: {payload.get('socialInteractionContext', 'alone')}"
    )
    weather = payload.get("weather_used") or {}
    if weather:
        lines.append(
            f"- Weather: {weather.get('condition', 'Unknown')} | Temp: {weather.get('temperature')}°C | Humidity: {weather.get('humidity')}%"
        )
    else:
        lines.append("- Weather: Not provided")

    raw_input = payload.get("raw_input") or {}
    if raw_input:
        lines.append("\nRaw Session Inputs (JSON):")
        lines.append(json.dumps(raw_input, indent=2))

    return "\n".join(lines)


def _build_prompt(context: str) -> str:
    return dedent(
        f"""
        You are assisting an ABA therapy team. Review the session context carefully and return
        a behavioral analysis using the exact section headings and ordering below. Keep
        recommendations concrete and immediately actionable. Reference specific data points
        (sleep, meals, toileting, weather, transitions) when relevant.

        CONTEXT:
        {context}

        FORMAT (do not add extra headings):
        BEHAVIORAL ANALYSIS:
        <3-5 sentences covering motivating operations, likely functions, and how risk may show up>

        KEY RISK FACTORS:
        - Main risk factor 1
          • Sub-detail if needed
          • Sub-detail if needed
        - Main risk factor 2
        - Main risk factor 3

        PROTECTIVE FACTORS:
        - Main protective factor 1
          • Sub-detail if needed
        - Main protective factor 2

        ACTIONABLE RECOMMENDATIONS:
        1. Main recommendation title or action
          • Specific implementation step
          • Specific implementation step
        2. Second main recommendation
          • Specific implementation step
        3. Third main recommendation

        MONITORING PRIORITIES:
        - Main monitoring priority 1
          • Specific indicator to track
        - Main monitoring priority 2
        
        Note: Use hierarchical structure where main points can have sub-points indented with bullet points (•) for additional details or steps.
        """
    ).strip()


async def generate_behavior_analysis(payload: Dict[str, Any], model_name: str) -> str:
    agent = _ensure_agent(model_name)
    context = _build_context(payload)
    prompt = _build_prompt(context)

    result = await rt.call(agent, prompt)
    return result.text.strip()
