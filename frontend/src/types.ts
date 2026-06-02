export type Tristate = 'yes' | 'no' | 'unknown';

export interface Insights {
  price_range: string;       // $ | $$ | $$$ | $$$$ from Google
  vegan: Tristate;
  gluten_free: Tristate;
  couples: Tristate;
  groups: Tristate;
  noise_score: number;       // 1–5
  vibe: string;
  likes: string;
  dislikes: string;
  upcoming_events: string;
}

export interface BookingInfo {
  online_url?: string;
  instagram_url?: string;
  phone?: string;
  menu_url?: string;
}

export interface Venue {
  place_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
  price_level?: number;
  photos?: string[];
  booking?: BookingInfo;
  insights?: Insights; // loaded lazily after initial render
}

export interface SearchResponse {
  results: Venue[];
  cached: boolean;
}
