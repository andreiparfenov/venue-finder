// POST /api/chat — conversational agent that extracts search intent via Nebius
import { Router, Request, Response } from 'express';
import fetch from 'node-fetch';

const router = Router();
const BASE  = 'https://api.studio.nebius.com/v1/chat/completions';
const MODEL = 'meta-llama/Llama-3.3-70B-Instruct';

const SYSTEM = `You are a restaurant discovery assistant. Always reply with ONLY valid JSON — no text outside the JSON object.

Response shape:
{
  "reply": "<1-2 friendly sentences>",
  "action": {
    "type": "search",
    "city": "<city>",
    "neighborhood": "<area or district, or repeat city if none given>",
    "filters": {"vegan":false,"glutenFree":false,"couples":false,"groups":false,"hasBooking":false,"minRating":0,"vibePreference":""}
  }
}

Rules:
1. As soon as you know the city, set type="search". Use the city name as neighborhood if no area is mentioned. NEVER block on neighborhood.
2. If the user is adding preferences to an already-running search (no new city in the message), set type="filter" with ONLY the filters object — no city or neighborhood.
3. Omit "action" only when asking a clarifying question.
4. couples=true: "date","romantic","anniversary","two of us". groups=true: "group","team","birthday","colleagues","large group".
5. vibePreference: "quiet" for quiet/calm/intimate/peaceful; "lively" for lively/vibrant/energetic/party; "" if not mentioned.
6. minRating=4 for "good"/"best"/"top-rated"; else 0.

Example — "good vegan place for a date in Ljubljana":
{"reply":"Searching for romantic vegan spots in Ljubljana!","action":{"type":"search","city":"Ljubljana","neighborhood":"Ljubljana","filters":{"vegan":true,"couples":true,"glutenFree":false,"groups":false,"hasBooking":false,"minRating":4,"vibePreference":""}}}`;

router.post('/', async (req: Request, res: Response) => {
  try {
    const { message, history = [] } = req.body as { message: string; history: any[] };
    if (!message) return res.status(400).json({ error: 'message required' });

    const apiRes = await fetch(BASE, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEBIUS_API_KEY!}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        max_tokens: 200,
        messages: [
          { role: 'system', content: SYSTEM },
          ...history,
          { role: 'user', content: message },
        ],
      }),
    });

    const data = await apiRes.json() as any;
    const raw  = data.choices?.[0]?.message?.content ?? '{}';
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        // Normalise filter keys — model may return snake_case despite the prompt
        if (parsed.action?.filters) {
          const f = parsed.action.filters;
          parsed.action.filters = {
            vegan:          f.vegan          ?? false,
            glutenFree:     f.glutenFree     ?? f.gluten_free     ?? false,
            couples:        f.couples        ?? false,
            groups:         f.groups         ?? false,
            hasBooking:     f.hasBooking     ?? f.has_booking     ?? false,
            minRating:      f.minRating      ?? f.min_rating      ?? 0,
            vibePreference: f.vibePreference ?? f.vibe_preference ?? '',
          };
        }
        return res.json(parsed);
      } catch { /* fall through */ }
    }
    res.json({ reply: raw.replace(/^\s*```json|```\s*$/g, '').trim() || 'Sorry, could you rephrase that?' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
