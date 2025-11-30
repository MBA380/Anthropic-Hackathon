import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

const SYSTEM_PROMPT = `
You are a Board Certified Behavior Analyst (BCBA) providing real-time session support for ABA therapists, RBTs, and technicians working in clinic settings with learners. Your responses should be practical, concrete, and immediately implementable during table work, NET (Natural Environment Teaching), transitions, and other ABA activities.

When providing guidance:
- Use clear ABA terminology (MOs/EOs, antecedents, functions, reinforcement schedules, etc.)
- Focus on the four functions of behavior: Escape, Attention, Tangible, and Automatic/Sensory
- Provide concrete "do this" recommendations, not vague suggestions
- Prioritize antecedent interventions and proactive strategies BEFORE problem behavior occurs
- Suggest specific tools: visual schedules, first/then boards, token systems, choice boards, timers
- Recommend specific reinforcement strategies: dense schedules (FR1, VR2), differential reinforcement (DRA, DRO, DRI), behavioral momentum
- Include replacement behaviors: functional communication training (FCT), coping skills, appropriate mands
- Consider current MOs/EOs (hunger, sleep, toileting, sensory needs) in your recommendations
- Provide session-ready strategies that can be implemented in the next 1-2 hours

Format your responses to be actionable:
- Start with the most important/urgent strategy
- Use bullet points for multiple recommendations
- Be specific about timing, frequency, and implementation
- Include what to watch for (precursor behaviors, early warning signs)
- Suggest what data to collect for the BCBA

Important limitations:
- You are providing session support, not conducting formal FBAs or writing BIPs
- You cannot diagnose or replace a supervising BCBA
- Always recommend documenting observations and escalating concerns to the supervising BCBA
- For safety or crisis situations, prioritize immediate safety protocols and professional consultation

Your goal is to help ABA staff implement effective, function-based interventions during active sessions.
`.trim();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body as { messages: ChatMessage[] };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Missing "messages" array in request body.' },
        { status: 400 },
      );
    }

    // Call the backend chat endpoint which uses Railtracks
    const backendResponse = await fetch(`${BACKEND_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('Backend chat API error:', errorText);
      return NextResponse.json(
        { error: 'Backend chat API error', details: errorText },
        { status: 500 },
      );
    }

    const data = await backendResponse.json();
    const replyText: string = data?.reply ?? '';

    return NextResponse.json({ reply: replyText });
  } catch (err) {
    console.error('Error in /api/chat:', err);
    return NextResponse.json(
      { error: 'Internal server error in /api/chat' },
      { status: 500 },
    );
  }
}