// Google Places API v1 — parallel multi-query search for broader coverage
import fetch from 'node-fetch';

const BASE = 'https://places.googleapis.com/v1';
const KEY  = () => process.env.GOOGLE_PLACES_API_KEY!;

const FIELD_MASK = [
  'places.id', 'places.displayName', 'places.formattedAddress',
  'places.location', 'places.rating', 'places.priceLevel',
  'places.servesVegetarianFood', 'places.goodForGroups',
  'places.nationalPhoneNumber', 'places.websiteUri',
  'places.reviews', 'places.photos',
].join(',');

const PRICE_ENUM: Record<string, number> = {
  PRICE_LEVEL_FREE: 0, PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2, PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

function normalize(p: any) {
  return {
    place_id:               p.id,
    name:                   p.displayName?.text     ?? '',
    formatted_address:      p.formattedAddress      ?? '',
    geometry: { location: { lat: p.location?.latitude, lng: p.location?.longitude } },
    rating:                 p.rating,
    price_level:            PRICE_ENUM[p.priceLevel],
    serves_vegetarian_food: p.servesVegetarianFood  ?? null,
    good_for_groups:        p.goodForGroups          ?? null,
    phone:                  p.nationalPhoneNumber    ?? null,
    website:                p.websiteUri             ?? null,
    reviews: (p.reviews ?? []).map((r: any) => ({ text: r.text?.text ?? '' })),
    photos:  (p.photos  ?? []).slice(0, 3).map((ph: any) =>
      `${BASE}/${ph.name}/media?maxWidthPx=400&key=${KEY()}`
    ),
  };
}

async function searchOne(query: string): Promise<any[]> {
  const res = await fetch(`${BASE}/places:searchText`, {
    method: 'POST',
    headers: {
      'X-Goog-Api-Key': KEY(),
      'X-Goog-FieldMask': FIELD_MASK,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 20, includedType: 'restaurant' }),
  });
  const data = await res.json() as any;
  return (data.places ?? []).map(normalize);
}

// Run 4 varied queries in parallel; deduplicate by place_id (~60-80 unique venues)
export async function searchRestaurants(city: string, neighborhood: string) {
  const area = `${neighborhood} ${city}`;
  const queries = [
    `restaurants in ${area}`,
    `bars and restaurants ${area}`,
    `cafes bistros ${area}`,
    `sushi pizza pasta Asian ${area}`,
  ];

  const pages = await Promise.all(queries.map(searchOne));
  const seen  = new Set<string>();
  const all: any[] = [];
  for (const page of pages) {
    for (const p of page) {
      if (!seen.has(p.place_id)) { seen.add(p.place_id); all.push(p); }
    }
  }

  console.log(`[Places] ${area}: ${all.length} unique venues from ${queries.length} queries`);
  return all;
}
