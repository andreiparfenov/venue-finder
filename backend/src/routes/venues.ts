// POST /api/venues — returns Google Places data immediately, no AI
import { Router, Request, Response } from 'express';
import VenueCache from '../models/VenueCache';
import { searchRestaurants } from '../services/places';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { city, neighborhood } = req.body as { city?: string; neighborhood?: string };
    if (!city || !neighborhood)
      return res.status(400).json({ error: 'city and neighborhood are required' });

    const cacheKey = `${city}:${neighborhood}`.toLowerCase().trim();

    const cached = await VenueCache.findOne({ key: cacheKey });
    if (cached) return res.json({ results: cached.results, cached: true });

    const places = await searchRestaurants(city, neighborhood);
    if (!places.length) return res.json({ results: [], cached: false });

    // Return basic Google data only — AI insights are loaded separately per card
    const results = places.map((p: any) => ({
      place_id: p.place_id,
      name:     p.name,
      address:  p.formatted_address,
      lat:      p.geometry.location.lat,
      lng:      p.geometry.location.lng,
      rating:   p.rating,
      price_level: p.price_level,
      photos:   p.photos ?? [],
      booking:  { phone: p.phone ?? undefined },
      // store extra data in cache for insights route to re-use
      _raw: { reviews: p.reviews, website: p.website, serves_vegetarian_food: p.serves_vegetarian_food, good_for_groups: p.good_for_groups },
    }));

    await VenueCache.create({ key: cacheKey, results });
    res.json({ results, cached: false });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message ?? 'Internal server error' });
  }
});

export default router;
