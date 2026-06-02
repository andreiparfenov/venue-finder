# Venue Finder

AI-powered restaurant search. You can search by city and area, get AI-generated insights on vibe, dietary options, noise level, price range, upcoming events, and booking links.

Live demo: https://venue-finder.up.railway.app

---

## Features

- **Dual search modes** — classic form or natural-language AI agent chat
- **Live Google Map** with numbered pins – click a pin to highlight the matching card
- **AI insights per venue** (using open-source models):
  - Price range in local currency, estimated from menu/reviews
  - Vegan / Gluten-free / Couples / Groups suitability
  - Noise score and vibe tag
  - What people like and don't like
  - Upcoming events detected from web search and the venue's own site
- **Menu button** when a menu URL is found (schema.org `hasMenu` or `/menu` subpage)
- **Booking links**: OpenTable, Resy, Tock, SevenRooms, Instagram, phone
- **Advanced filters**: vegan, gluten-free, couples, groups, rating, has booking; all filter pills work before a search so you can pre-set preferences
- **Cache** — 24 h for venue lists, 7 days for AI insights (same neighbourhood is instant on repeat visits)

---

## Stack

| Layer       | Technology                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------ |
| Frontend    | React 18 + TypeScript + Vite                                                                     |
| Backend     | Express + Node 18 + TypeScript                                                                   |
| Database    | MongoDB (Mongoose)                                                                               |
| Maps        | Google Maps JavaScript API                                                                       |
| Places data | Google Places API (New) v1                                                                       |
| AI insights | Nebius Token Factory — `meta-llama/Llama-3.3-70B-Instruct` + `Qwen/Qwen2.5-VL-72B-Instruct` (vision) |
| Agent chat  | Nebius Token Factory — `meta-llama/Llama-3.3-70B-Instruct`                                           |

---

## Prerequisites

- Node 18+
- MongoDB (local or Atlas)
- [Google Cloud](https://console.cloud.google.com/) project with **Places API (New)** and **Maps JavaScript API** enabled
- [Nebius Token Factory](https://tokenfactory.nebius.com/) account with API key

---

## Quick start

### With Docker

```bash
# 1. Clone
git clone https://github.com/your-username/venue-finder.git
cd venue-finder

# 2. Create root .env from the example
cp .env.example .env
# Fill in your three API keys

# 3. Build and run everything (MongoDB included)
docker compose up --build

# App → http://localhost
# API → http://localhost:3001
```

### Local dev (without Docker)

```bash
# 1. Install all dependencies
npm run install:all

# 2. Configure backend
cp backend/.env.example backend/.env
# Edit backend/.env (needs GOOGLE_PLACES_API_KEY, NEBIUS_API_KEY, MONGODB_URI)

# 3. Configure frontend
cp frontend/.env.example frontend/.env
# Edit frontend/.env (needs VITE_GOOGLE_MAPS_KEY)

# 4. Start both servers
npm run dev
# Backend → http://localhost:3001
# Frontend → http://localhost:5173
```

---

## Environment variables

### `backend/.env`

| Variable                | Description                                                              |
| ----------------------- | ------------------------------------------------------------------------ |
| `GOOGLE_PLACES_API_KEY` | Google Places API (New) key — used server-side only                      |
| `NEBIUS_API_KEY`        | Nebius Token Factory API key                                                 |
| `MONGODB_URI`           | MongoDB connection string, e.g. `mongodb://localhost:27017/venue-finder` |
| `PORT`                  | Express port (default `3001`)                                            |

### `frontend/.env`

| Variable               | Description                                             |
| ---------------------- | ------------------------------------------------------- |
| `VITE_GOOGLE_MAPS_KEY` | Google Maps JavaScript API key — exposed to the browser |

> The Google Places key and Maps JS key can be the same key if your Google Cloud project has both APIs enabled, but it is safer to use separate keys with different referrer/IP restrictions.

---

## Project structure

```
venue-finder/
├── backend/
│   └── src/
│       ├── models/          # Mongoose models (VenueCache, InsightsCache)
│       ├── routes/          # Express routes (venues, insights, chat)
│       └── services/        # places.ts · nebius.ts · scraper.ts
├── frontend/
│   └── src/
│       ├── components/      # MapView, VenueCard, VenueModal, FilterBar, AgentChat, SearchForm
│       └── types.ts
├── .env.example             # Combined key reference
├── package.json             # Root scripts (dev, build, install:all)
└── README.md
```

---

## API endpoints

| Method | Path            | Description                                                                   |
| ------ | --------------- | ----------------------------------------------------------------------------- |
| `POST` | `/api/venues`   | Search venues by city + neighbourhood; returns Google Places data immediately |
| `POST` | `/api/insights` | Fetch AI insights for a single venue (lazy, cached 7 days)                    |
| `POST` | `/api/chat`     | Agent chat — parses natural language into search/filter actions               |

---

## Caching strategy

| Cache           | Key                  | TTL      |
| --------------- | -------------------- | -------- |
| `VenueCache`    | `city:neighbourhood` | 24 hours |
| `InsightsCache` | `place_id`           | 7 days   |

Both collections use MongoDB TTL indexes for automatic expiry.
