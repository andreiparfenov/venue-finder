// Sends restaurant reviews to Claude and parses the structured JSON response
import fetch from 'node-fetch';
import { Insights } from '../types';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

export async function analyzeVenue(name: string, reviews: any[]): Promise<Insights> {
  try {
    const reviewText = reviews
      .map((r: any) => `"${r.text}"`)
      .join('\n')
      .slice(0, 3000); // cap tokens

    const prompt = `Analyze these reviews for "${name}" and respond with ONLY valid JSON:
{
  "noise_score": <integer 1-5, 1=quiet, 5=very loud>,
  "dietary": [<strings like "vegan","gluten-free","vegetarian","halal">],
  "price_range": "<$ | $$ | $$$ | $$$$>",
  "vibe": "<one short atmosphere phrase>",
  "summary": "<exactly 2 sentences describing the dining experience>"
}

Reviews:
${reviewText || 'No reviews available.'}`;

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await res.json() as any;
    const text: string = data.content?.[0]?.text ?? '{}';
    // Extract first JSON object found in the response
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as Insights;
  } catch {
    // Fall through to default on any failure
  }
  return defaultInsights();
}

function defaultInsights(): Insights {
  return {
    noise_score: 3,
    dietary: [],
    price_range: '$$',
    vibe: 'casual dining',
    summary: 'No review data available for this venue.',
  };
}
