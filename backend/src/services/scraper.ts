// Website scraping: Schema.org extraction, menu subpage, booking links, Instagram
import fetch from 'node-fetch';

export interface ScrapeResult {
  menuText: string;
  bookingUrl?: string;
  instagramUrl?: string;
  menuUrl?: string; // direct link to menu page or PDF
}

// Known online-reservation platform domains
const BOOKING_DOMAINS = [
  'opentable.com', 'resy.com', 'exploretock.com', 'tock.com',
  'sevenrooms.com', 'thefork.com', 'bookatable.com', 'quandoo.com',
];

async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2000);
  try {
    const res = await (fetch as any)(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VenueFinder/1.0)' },
    });
    clearTimeout(timer);
    return await res.text() as string;
  } catch { clearTimeout(timer); return ''; }
}

function extractSchema(html: string): string {
  const blocks = [...html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  )];
  return blocks.flatMap(b => {
    try {
      const json = JSON.parse(b[1].trim());
      const type = [json['@type'] ?? []].flat().join(' ');
      return /restaurant|foodestablishment|menu/i.test(type) ? [JSON.stringify(json)] : [];
    } catch { return []; }
  }).join('\n').slice(0, 1500);
}

function extractLinks(html: string, baseUrl: string) {
  const base = new URL(baseUrl);
  let bookingUrl: string | undefined;
  let instagramUrl: string | undefined;
  let menuPath: string | undefined;

  for (const m of html.matchAll(/href=["']([^"']+)["']/gi)) {
    const href = m[1];
    if (!href || href.startsWith('#') || href.startsWith('mailto:')) continue;
    try {
      const url = new URL(href, baseUrl);
      const full = url.href;
      // Booking platform
      if (!bookingUrl && BOOKING_DOMAINS.some(d => full.includes(d))) bookingUrl = full;
      // Same-domain /book or /reserv path
      if (!bookingUrl && url.hostname === base.hostname && /\/(book|reserv)/i.test(url.pathname))
        bookingUrl = full;
      // Instagram profile
      if (!instagramUrl && /instagram\.com\/(?!p\/|reel\/|explore\/)[^/?]+/i.test(full))
        instagramUrl = full;
      // Menu subpage on same domain
      if (!menuPath && url.hostname === base.hostname && /menu/i.test(url.pathname))
        menuPath = full;
    } catch { continue; }
  }
  return { bookingUrl, instagramUrl, menuPath };
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

// Pull hasMenu URL from schema.org JSON-LD — most reliable source for menu links
function extractMenuUrl(html: string): string | undefined {
  const blocks = [...html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  )];
  for (const block of blocks) {
    try {
      const json = JSON.parse(block[1].trim());
      const raw = json.hasMenu ?? json.menu;
      if (!raw) continue;
      const url = typeof raw === 'string' ? raw : raw?.url ?? raw?.['@id'];
      if (url && typeof url === 'string' && url.startsWith('http')) return url;
    } catch { continue; }
  }
  return undefined;
}

// DuckDuckGo HTML search — no API key, returns result snippets about dietary options
export async function searchDietaryInfo(name: string, city: string): Promise<string> {
  try {
    const q = encodeURIComponent(`"${name}" ${city} vegan gluten-free menu dietary options`);
    const html = await fetchHtml(`https://html.duckduckgo.com/html/?q=${q}`);
    if (!html) return '';
    const snippets: string[] = [];
    for (const m of html.matchAll(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi)) {
      const text = m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (text.length > 20) snippets.push(text);
      if (snippets.length >= 5) break;
    }
    return snippets.length ? `[Web search snippets]\n${snippets.join('\n')}` : '';
  } catch { return ''; }
}

// DuckDuckGo search for upcoming events — picks up Facebook Events, venue site, Time Out, etc.
export async function searchEvents(name: string, city: string): Promise<string> {
  try {
    const q = encodeURIComponent(`"${name}" ${city} events weekend upcoming`);
    const html = await fetchHtml(`https://html.duckduckgo.com/html/?q=${q}`);
    if (!html) return '';
    const snippets: string[] = [];
    for (const m of html.matchAll(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi)) {
      const text = m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (text.length > 20) snippets.push(text);
      if (snippets.length >= 4) break;
    }
    return snippets.length ? `[Events search]\n${snippets.join('\n')}` : '';
  } catch { return ''; }
}

// Google Maps page fetch — JS-rendered so reviews won't load,
// but meta description sometimes contains dietary/category hints
export async function scrapeGoogleMaps(placeId: string): Promise<string> {
  try {
    const html = await fetchHtml(
      `https://www.google.com/maps/place/?q=place_id:${placeId}`
    );
    if (!html) return '';
    const meta = html.match(/<meta[^>]+name="description"[^>]+content="([^"]{20,})"/i)?.[1] ?? '';
    const schema = extractSchema(html);
    return [meta, schema].filter(Boolean).join('\n').slice(0, 600);
  } catch { return ''; }
}

export async function scrapeWebsite(url: string): Promise<ScrapeResult> {
  const html = await fetchHtml(url);
  if (!html) return { menuText: '' };

  const { bookingUrl, instagramUrl, menuPath } = extractLinks(html, url);
  const parts: string[] = [];

  const schema = extractSchema(html);
  if (schema) parts.push(`[Structured data]\n${schema}`);

  if (menuPath) {
    const menuHtml = await fetchHtml(menuPath);
    if (menuHtml) {
      const ms = extractSchema(menuHtml);
      if (ms) parts.push(`[Menu page structured data]\n${ms}`);
      parts.push(`[Menu page text]\n${stripHtml(menuHtml).slice(0, 800)}`);
    }
  }

  if (parts.length === 0) parts.push(stripHtml(html).slice(0, 1500));

  // Prefer schema.org hasMenu URL, fall back to detected /menu subpage
  const menuUrl = extractMenuUrl(html) ?? menuPath ?? undefined;

  return { menuText: parts.join('\n\n').slice(0, 3000), bookingUrl, instagramUrl, menuUrl };
}
