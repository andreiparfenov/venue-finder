// POST /api/insights — AI analysis for a single venue, called lazily by the frontend
import { Router, Request, Response } from 'express';
import InsightsCache from '../models/InsightsCache';
import VenueCache from '../models/VenueCache';
import { analyzeVenue } from '../services/nebius';
import { scrapeWebsite, searchDietaryInfo, searchEvents } from '../services/scraper';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { place_id, city } = req.body as { place_id?: string; city?: string };
    if (!place_id || !city) return res.status(400).json({ error: 'place_id and city required' });

    // Return cached insights immediately if available
    const cached = await InsightsCache.findOne({ place_id });
    if (cached) return res.json({ insights: cached.insights, booking: cached.booking });

    // Look up raw Google data from VenueCache (stored by venues route)
    const venueDoc = await VenueCache.findOne({ 'results.place_id': place_id });
    const raw = venueDoc?.results?.find((r: any) => r.place_id === place_id)?._raw ?? {};

    const website  = raw.website ?? null;
    const reviews  = raw.reviews ?? [];
    const servesVeg = raw.serves_vegetarian_food ?? null;
    const goodForGroups = raw.good_for_groups ?? null;

    // Find venue name from cache
    const name = venueDoc?.results?.find((r: any) => r.place_id === place_id)?.name ?? '';

    // Parallel scraping (Google Maps page removed — always JS-rendered, returns nothing)
    const [scraped, webSearch, eventsSearch] = await Promise.all([
      website ? scrapeWebsite(website) : Promise.resolve({ menuText: '', bookingUrl: undefined, instagramUrl: undefined, menuUrl: undefined }),
      searchDietaryInfo(name, city),
      searchEvents(name, city),
    ]);

    const context = [scraped.menuText, webSearch, eventsSearch].filter(Boolean).join('\n\n').slice(0, 2000);
    const ai = await analyzeVenue(name, city, reviews, [], context, servesVeg);

    const groups = goodForGroups === true ? 'yes' as const : goodForGroups === false ? 'no' as const : ai.groups;
    const insights = { ...ai, groups };
    const booking  = {
      online_url:    scraped.bookingUrl   ?? undefined,
      instagram_url: scraped.instagramUrl ?? undefined,
      phone:         raw.phone            ?? undefined,
      menu_url:      scraped.menuUrl      ?? undefined,
    };

    await InsightsCache.create({ place_id, insights, booking });
    res.json({ insights, booking });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message ?? 'Internal server error' });
  }
});

export default router;
