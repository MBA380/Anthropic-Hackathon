import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL_NAME = 'claude-3-5-haiku-20241022'; // or another Claude model you can use

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

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY is not set on the server for /api/chat');
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY is not configured on the server.' },
        { status: 500 },
      );
    }

    // Extract system message from the messages array if provided, otherwise use default
    const systemMessage = messages.find((m) => m.role === 'system');
    const systemPrompt = systemMessage?.content || SYSTEM_PROMPT;

    // ❗ Only keep user & assistant messages. Ignore any "system" roles completely.
    const nonSystemMessages = messages.filter(
      (m) => m.role === 'user' || m.role === 'assistant',
    );

    const anthropicMessages = nonSystemMessages.map((m) => ({
      role: m.role,
      content: [{ type: 'text' as const, text: m.content }],
    }));

    const requestBody = {
      model: MODEL_NAME,
      max_tokens: 1024, // Increased for more detailed responses with context
      system: systemPrompt, // Use the system prompt from frontend or default ✅
      messages: anthropicMessages, // only user & assistant ✅
    };

    const anthropicResponse = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error('Anthropic API error (chat):', errorText);
      return NextResponse.json(
        { error: 'Anthropic API error', details: errorText },
        { status: 500 },
      );
    }

    const data = await anthropicResponse.json();
    const replyText: string = data?.content?.[0]?.text ?? '';

    return NextResponse.json({ reply: replyText });
  } catch (err) {
    console.error('Error in /api/chat:', err);
    return NextResponse.json(
      { error: 'Internal server error in /api/chat' },
      { status: 500 },
    );
  }
}