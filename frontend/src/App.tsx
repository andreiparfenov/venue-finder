import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import SearchForm from './components/SearchForm';
import MapView from './components/MapView';
import VenueCard from './components/VenueCard';
import FilterBar, { Filters, defaultFilters } from './components/FilterBar';
import AgentChat from './components/AgentChat';
import { Venue, SearchResponse } from './types';

export default function App() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cached, setCached] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [mode, setMode] = useState<'search' | 'agent'>('search');
  const mapRef      = useRef<google.maps.Map | null>(null);
  const cardListRef = useRef<HTMLDivElement>(null);
  const fetchedRef  = useRef<Set<string>>(new Set());
  const abortRef    = useRef<AbortController | null>(null);

  const handleMapReady = useCallback((m: google.maps.Map) => { mapRef.current = m; }, []);

  // Central insight loader — fetches AI insights for every venue that doesn't have them yet.
  // Uses the current AbortController signal so a new search cancels all in-flight requests.
  useEffect(() => {
    if (!city || !abortRef.current) return;
    const signal = abortRef.current.signal;
    venues.forEach(v => {
      if (v.insights || fetchedRef.current.has(v.place_id)) return;
      fetchedRef.current.add(v.place_id);
      fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ place_id: v.place_id, city }),
        signal,
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data?.insights || signal.aborted) return;
          setVenues(prev => prev.map(u =>
            u.place_id === v.place_id
              ? { ...u, insights: data.insights, booking: { ...u.booking, ...data.booking } }
              : u
          ));
        })
        .catch(e => { if (e.name !== 'AbortError') console.error(e); });
    });
  }, [venues, city]);

  React.useEffect(() => { cardListRef.current?.scrollTo({ top: 0 }); }, [filters]);

  const handleSearch = async (city: string, neighborhood: string, presetFilters?: Partial<Filters>) => {
    // Cancel all in-flight insight requests from the previous search immediately
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError('');
    setSearched(false);
    setCity(city);
    setFilters({ ...defaultFilters, ...presetFilters });
    try {
      const res = await fetch('/api/venues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, neighborhood }),
      });
      if (!res.ok) {
        const { error: msg } = await res.json();
        throw new Error(msg || 'Search failed');
      }
      const data: SearchResponse = await res.json();
      fetchedRef.current.clear(); // clear just before setting new venues so effect fires cleanly
      setVenues(data.results);
      setCached(data.cached);
      setSearched(true);
      cardListRef.current?.scrollTo({ top: 0 });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredVenues = useMemo(() => venues.filter((v, idx) => {
    if (!v.insights) return idx < 5; // first 5 show immediately with "Analyzing…"
    const q = filters.query.toLowerCase();
    if (q && !v.name.toLowerCase().includes(q) && !v.address.toLowerCase().includes(q)) return false;
    if (filters.vegan      && v.insights.vegan      !== 'yes') return false;
    if (filters.glutenFree && v.insights.gluten_free !== 'yes') return false;
    if (filters.couples    && v.insights.couples     !== 'yes') return false;
    if (filters.groups     && v.insights.groups      !== 'yes') return false;
    if (filters.minRating  && (v.rating ?? 0) < filters.minRating) return false;
    if (filters.hasBooking && !v.booking?.online_url && !v.booking?.phone) return false;
    if (filters.vibePreference) {
      const noise = v.insights.noise_score ?? 3;
      const vibe  = (v.insights.vibe ?? '').toLowerCase();
      if (filters.vibePreference === 'quiet') {
        if (noise >= 4) return false;
        if (/lively|loud|energetic|vibrant|party|club|buzzing|bustling|rowdy/.test(vibe)) return false;
      }
      if (filters.vibePreference === 'lively') {
        if (noise <= 2) return false;
        if (/quiet|calm|intimate|cozy|peaceful|serene|tranquil|hushed/.test(vibe)) return false;
      }
    }
    return true;
  }), [venues, filters]);

  const readyCount = venues.filter(v => v.insights).length;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <div style={sidebar}>
        <div style={sidebarHead}>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#222' }}>Venue Finder</h1>
          <div style={toggleRow}>
            <button style={mode === 'search' ? activeTab : tab} onClick={() => setMode('search')}>🔍 Search</button>
            <button style={mode === 'agent'  ? activeTab : tab} onClick={() => setMode('agent')}>🤖 Agent</button>
          </div>
          {mode === 'search' && (
            <>
              <SearchForm onSearch={handleSearch} loading={loading} />
              {error && <p style={{ color: '#e53935', marginTop: 8, fontSize: 13 }}>{error}</p>}
              {!loading && !error && venues.length === 0 && searched && (
                <p style={{ color: '#999', marginTop: 8, fontSize: 13 }}>No venues found — try a different area.</p>
              )}
              {cached && !loading && venues.length > 0 && (
                <p style={{ color: '#4285F4', marginTop: 6, fontSize: 11 }}>Served from cache</p>
              )}
            </>
          )}
        </div>

        {mode === 'agent' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: venues.length ? '0 0 260px' : 1, overflow: 'hidden', borderBottom: venues.length ? '1px solid #eee' : 'none' }}>
            <AgentChat onSearch={handleSearch} onFiltersChange={u => setFilters(p => ({ ...p, ...u }))} loading={loading} />
          </div>
        )}

        <FilterBar filters={filters} onChange={setFilters} total={readyCount} shown={filteredVenues.length} />

        {/* Progress indicator while insights are loading */}
        {venues.length > 0 && readyCount < venues.length && (
          <p style={{ fontSize: 11, color: '#aaa', padding: '4px 14px', flexShrink: 0 }}>
            Analyzing… {readyCount} / {venues.length} venues ready
          </p>
        )}

        {venues.length > 0 && (
          <div ref={cardListRef} style={cardList}>
            {filteredVenues.map(v => (
              <VenueCard key={v.place_id} venue={v} isSelected={v.place_id === selectedId} />
            ))}
          </div>
        )}
      </div>

      <div style={{ flex: 1, height: '100vh' }}>
        <MapView venues={filteredVenues} onMapReady={handleMapReady} onVenueSelect={setSelectedId} />
      </div>
    </div>
  );
}

const toggleRow: React.CSSProperties = { display: 'flex', gap: 6, marginBottom: 12 };
const tab: React.CSSProperties = { flex: 1, padding: '6px 0', borderRadius: 8, border: '1px solid #ddd', background: '#f5f5f5', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#666' };
const activeTab: React.CSSProperties = { ...tab, background: '#4285F4', borderColor: '#4285F4', color: '#fff' };
const sidebar: React.CSSProperties = { width: 360, minWidth: 360, height: '100vh', display: 'flex', flexDirection: 'column', background: '#fff', boxShadow: '2px 0 10px rgba(0,0,0,0.12)', zIndex: 10, overflow: 'hidden' };
const sidebarHead: React.CSSProperties = { padding: '18px 16px 14px', borderBottom: '1px solid #eee', flexShrink: 0 };
const cardList: React.CSSProperties = { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, padding: '10px 12px' };
