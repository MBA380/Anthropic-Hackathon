from __future__ import annotations

import json
from textwrap import dedent
from typing import Any, Dict

import railtracks as rt

_context_template = """Risk Level: {risk_label}\nConfidence: {confidence}%\nHigh Risk Probability: {high_risk}%\nLow Risk Probability: {low_risk}%\nWeather Context: {weather}\n\nFull Analysis:\n{analysis}\n"""

_agents_cache: Dict[str, Any] = {}


def _format_percent(value: Any) -> str:
    try:
        return f"{float(value) * 100:.1f}"
    except (TypeError, ValueError):
        return "N/A"


def _get_weather_context(payload: Dict[str, Any]) -> str:
    weather = payload.get("weather_used") or {}
    if not weather:
        return "Not provided"
    parts = []
    temp = weather.get("temperature")
    humidity = weather.get("humidity")
    condition = weather.get("condition")
    if condition:
        parts.append(str(condition))
    if temp is not None:
        parts.append(f"{temp}°C")
    if humidity is not None:
        parts.append(f"{humidity}% humidity")
    return ", ".join(parts) if parts else "Not provided"


def _build_context(payload: Dict[str, Any]) -> str:
    risk_label = payload.get("prediction_label") or (
        "High Risk" if payload.get("prediction") == 1 else "Low Risk"
    )
    confidence = _format_percent(payload.get("confidence"))
    probabilities = payload.get("probabilities", {})
    high_risk = _format_percent(probabilities.get("high_risk"))
    low_risk = _format_percent(probabilities.get("low_risk"))
    analysis = payload.get("analysis") or "No analysis text provided."

    context_block = _context_template.format(
        risk_label=risk_label,
        confidence=confidence,
        high_risk=high_risk,
        low_risk=low_risk,
        weather=_get_weather_context(payload),
        analysis=analysis,
    )

    extra_sections = payload.get("calculated_values")
    if extra_sections:
        context_block += "\nCalculated Values:\n" + json.dumps(extra_sections, indent=2)

    return context_block.strip()


def _ensure_agent(model_name: str):
    agent = _agents_cache.get(model_name)
    if agent:
        return agent

    system_message = dedent(
        """
        You are a BCBA support assistant who rewrites technical behavioral analytics into
        caregiver-friendly updates. Be clear, reassuring, and action-oriented.
        - Capture the overall risk impression first.
        - Surface at most two watch-outs and two proactive supports.
        - Provide 2-3 concrete next steps the caregiver can do today.
        - Keep paragraphs short (1-3 sentences) and avoid jargon.
        - Output should be plain text with headings:
          1) Summary
          2) Watch Fors
          3) How to Help
        """
    ).strip()

    agent = rt.agent_node(
        "Caregiver Summary Agent",
        llm=rt.llm.AnthropicLLM(model_name),
        system_message=system_message,
    )
    _agents_cache[model_name] = agent
    return agent


async def generate_caregiver_summary(payload: Dict[str, Any], model_name: str) -> Dict[str, Any]:
    if not isinstance(payload, dict):
        raise ValueError("Request payload must be a JSON object.")

    context_block = _build_context(payload)

    agent = _ensure_agent(model_name)
    prompt = dedent(
        f"""
        Use the following structured behavioral context to craft a caregiver update.
        Focus on clarity and support. Keep total length under 180 words.

        CONTEXT:
        {context_block}

        Respond with:
        Summary:\n<2-3 sentences>\n\nWatch Fors:\n- item 1\n- item 2\n\nHow to Help:\n- action 1\n- action 2\n        """
    ).strip()

    result = await rt.call(agent, prompt)
    summary_text = result.text.strip()

    return {
        "summary_text": summary_text,
        "context_snapshot": context_block,
    }
