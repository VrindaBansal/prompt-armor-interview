// Thin OpenAI wrapper. Server-only: reads OPENAI_API_KEY, never imported client
// side. Uses JSON mode so the response is a JSON document; parse.ts still
// re-validates the shape defensively.
import OpenAI from 'openai';

const MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

let client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY is not set');
    client = new OpenAI({ apiKey });
  }
  return client;
}

// Returns the raw response text (expected JSON). Callers pass it to
// parseComplianceResponse; this function does not parse.
export async function runComplianceCompletion(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const completion = await getClient().chat.completions.create({
    model: MODEL,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });
  return completion.choices[0]?.message?.content ?? '';
}
