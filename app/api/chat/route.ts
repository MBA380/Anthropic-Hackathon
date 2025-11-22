import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL_NAME = 'claude-3-5-haiku-20241022'; // or another Claude model you can use

type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

const SYSTEM_PROMPT = `
You are an autism-support AI assistant embedded in a caregiver tool.
Be:
- concrete, gentle, and non-judgmental
- clear when you are guessing, not certain
- very careful not to give medical diagnoses or claim to replace a professional.

If the user asks about safety or a crisis, encourage them to seek help from a trusted adult or professional.
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
      max_tokens: 512,
      system: SYSTEM_PROMPT, // top-level system prompt ✅
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