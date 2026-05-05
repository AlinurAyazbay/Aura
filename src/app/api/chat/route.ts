import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? '';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  return false;
}

interface ChatRequestBody {
  message: string;
  history?: Array<{ role: string; content: string }>;
  context?: { totalRaised?: number; backerCount?: number; aqi?: number };
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0] ??
    request.headers.get('x-real-ip') ??
    'unknown';

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Rate limit exceeded. Please wait a moment.' }, { status: 429 });
  }

  try {
    const body = (await request.json()) as ChatRequestBody;
    const { message, history = [], context = {} } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 503 });
    }

    const systemPrompt = `You are Aura-ly, the friendly AI assistant for Aura Optima — a platform funding air purification towers across Almaty, Kazakhstan.

You are knowledgeable about:
- Almaty's air quality problems (PM2.5, PM10, CO levels)
- The science of air purification (HEPA + activated carbon filtration)
- Investment opportunities in green infrastructure
- Central Asian environmental policy
- How each $1 invested cleans 13.33 m³ of air per day
- Tower goal: $54,000 per tower, processing 30,000 m³/hour

Current platform stats:
- Total raised: $${context.totalRaised?.toLocaleString() ?? '0'} by ${context.backerCount ?? '0'} backers
- Today's Almaty AQI index: ${context.aqi ?? 'unknown'}

Be warm, encouraging, and data-driven. If asked about unrelated topics, gently redirect to air quality and Aura Optima.
Respond in the same language as the user (Kazakh or English).
Keep responses concise (2-4 paragraphs max) and use relevant emojis sparingly.`;

    // Build contents array: valid history (must start with user) + current message
    const contents = [
      ...history.map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      })),
      { role: 'user', parts: [{ text: message }] },
    ];

    const payload = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
    };

    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Gemini API error:', res.status, errText);
      const message =
        res.status === 429
          ? 'The AI is receiving too many requests right now. Please wait a moment and try again.'
          : `AI service error (${res.status}). Please try again.`;
      return NextResponse.json({ error: message }, { status: 502 });
    }

    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    if (!responseText) {
      return NextResponse.json({ error: 'Empty response from AI. Please try again.' }, { status: 502 });
    }

    return NextResponse.json({ reply: responseText });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response. Please try again.' },
      { status: 500 }
    );
  }
}
