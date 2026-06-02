// Nebius AI Studio (OpenAI-compatible) — text + vision + website in parallel
import fetch from 'node-fetch';
import { AIInsights } from '../types';

const BASE         = 'https://api.studio.nebius.com/v1/chat/completions';
const TEXT_MODEL   = 'meta-llama/Llama-3.3-70B-Instruct';
const VISION_MODEL = 'Qwen/Qwen2.5-VL-72B-Instruct';

async function call(model: string, messages: any[]): Promise<string> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.NEBIUS_API_KEY!}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, max_tokens: 280, temperature: 0.2 }),
  });
  const data = await res.json() as any;
  return data.choices?.[0]?.message?.content ?? '';
}

// Text model: reviews + website text + Google's vegetarian flag → all text-based fields
async function fromTextSources(
  name: string, city: string, reviews: any[], menuText: string, servesVeg: boolean | null
): Promise<Partial<AIInsights>> {
  const reviewText = reviews.map((r: any) => `"${r.text}"`).join('\n').slice(0, 1200);
  const context = [
    servesVeg === true  && '- Google Places confirms this venue serves vegetarian food.',
    servesVeg === false && '- Google Places indicates this venue does NOT serve vegetarian food.',
    menuText            && `Website/menu content:\n${menuText}`,
  ].filter(Boolean).join('\n');

  const prompt = `Analyze this restaurant called "${name}" located in ${city}. Use all sources below.
Return ONLY valid JSON, no extra text:
{
  "price_range": "<estimated price per person in local currency as a range, e.g. '€15–30 pp' or '$40–80 pp'. Use menu prices or review mentions. If unknown write 'N/A'>",
  "vegan": "<yes | no | unknown>",
  "gluten_free": "<yes | no | unknown>",
  "couples": "<yes | no | unknown — is it good for a romantic date?>",
  "groups": "<yes | no | unknown — is it good for large group meetups?>",
  "noise_score": <integer 1-5, 1=quiet, 5=very loud>,
  "vibe": "<one short atmosphere phrase>",
  "likes": "<one sentence starting with 'the' about what guests love most>",
  "dislikes": "<one sentence starting with 'the' about the main complaint, or empty string>",
  "upcoming_events": "<one sentence about upcoming events/specials/live music this weekend only if clearly mentioned in the sources; otherwise empty string>"
}

${context ? `Additional context:\n${context}\n` : ''}Reviews:\n${reviewText || 'None.'}`;

  const raw = await call(TEXT_MODEL, [{ role: 'user', content: prompt }]);
  const match = raw.match(/\{[\s\S]*\}/);
  if (match) try { return JSON.parse(match[0]); } catch { /* fall through */ }
  return {};
}

// Vision model: photos → vegan / gluten_free only
async function fromPhotos(photoUrls: string[]): Promise<Partial<Pick<AIInsights, 'vegan' | 'gluten_free'>>> {
  if (photoUrls.length === 0) return {};
  const images = photoUrls.slice(0, 3).map(url => ({ type: 'image_url', image_url: { url } }));
  const raw = await call(VISION_MODEL, [{
    role: 'user',
    content: [...images, { type: 'text', text: 'Look at these restaurant photos. Return ONLY valid JSON:\n{"vegan":"<yes|no|unknown>","gluten_free":"<yes|no|unknown>"}\nOnly say "yes" if you see clear evidence (menu boards, labels, signage). Otherwise say "unknown".' }],
  }]);
  const match = raw.match(/\{[\s\S]*?\}/);
  if (match) try { return JSON.parse(match[0]); } catch { /* fall through */ }
  return {};
}

function merge(a?: string, b?: string): 'yes' | 'no' | 'unknown' {
  if (a === 'yes' || b === 'yes') return 'yes';
  if (a === 'no'  || b === 'no')  return 'no';
  return 'unknown';
}

// menuText is pre-fetched by the route so we don't fetch the website twice
export async function analyzeVenue(
  name: string, city: string, reviews: any[], photos: string[],
  menuText: string, servesVeg?: boolean | null
): Promise<AIInsights> {
  try {
    const [text, vision] = await Promise.all([
      fromTextSources(name, city, reviews, menuText, servesVeg ?? null),
      fromPhotos(photos),
    ]);
    return {
      price_range:  text.price_range  ?? 'N/A',
      vegan:        merge(text.vegan,       vision.vegan),
      gluten_free:  merge(text.gluten_free, vision.gluten_free),
      couples:      text.couples ?? 'unknown',
      groups:       text.groups  ?? 'unknown',
      noise_score:     text.noise_score     ?? 3,
      vibe:            text.vibe            ?? 'casual dining',
      likes:           text.likes           ?? '',
      dislikes:        text.dislikes        ?? '',
      upcoming_events: text.upcoming_events ?? '',
    };
  } catch {
    return { price_range: 'N/A', vegan: 'unknown', gluten_free: 'unknown', couples: 'unknown', groups: 'unknown', noise_score: 3, vibe: 'casual dining', likes: '', dislikes: '', upcoming_events: '' };
  }
}
