// Shared TypeScript shapes used across the backend
export type Tristate = 'yes' | 'no' | 'unknown';

export interface Insights {
  price_range: string;     // e.g. "€15–30 pp" — AI-estimated from menu/reviews
  vegan: Tristate;
  gluten_free: Tristate;
  couples: Tristate;       // good for romantic / date night
  groups: Tristate;        // good for large group meetups
  noise_score: number;     // 1 = quiet, 5 = very loud
  vibe: string;
  likes: string;
  dislikes: string;
  upcoming_events: string; // upcoming events/specials found; empty string if nothing
}

// Nebius returns everything including price_range
export type AIInsights = Insights;

export interface BookingInfo {
  online_url?: string;    // OpenTable, Resy, same-domain /book, etc.
  instagram_url?: string; // Instagram profile link found on website
  phone?: string;         // From Google Places
  menu_url?: string;      // Direct link to menu page or PDF
}

export interface VenueResult {
  place_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
  price_level?: number;
  photos?: string[];
  booking: BookingInfo;
  insights: Insights;
}
