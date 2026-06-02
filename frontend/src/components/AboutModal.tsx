import React from 'react';

interface Props { onClose: () => void }

export default function AboutModal({ onClose }: Props) {
  return (
    <div style={backdrop} onClick={onClose}>
      <div style={box} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={closeBtn}>✕</button>

        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Venue Finder</h2>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 22, lineHeight: 1.5 }}>
          Search restaurants by city and area, or just describe what you want in plain language.
          The app fetches up venues from Google Places and enriches each one with AI insights
          from multiple sources. The results are cached so repeat searches are instant.
        </p>

        <Section title="Two ways to search">
          <p style={p}>
            <b>Classic search</b> — enter a city and area (e.g. Miami + South Beach).
            Four parallel Google Places queries run simultaneously to maximise coverage.
          </p>
          <p style={{ ...p, marginTop: 8 }}>
            <b>Agent chat (Llama 3.3 70B via Nebius Token Factory)</b> — describe it naturally:
            <em> "Find a quiet vegan spot in New York, Downtown for a group meetup"</em>.
            The model extracts location and filters in one step. Follow-up messages
            like <em>"only with online booking"</em> refine results without re-searching.
          </p>
        </Section>

        <Section title="What each venue shows — and where it comes from">
          {[
            ['💰', 'Price per person', 'local currency', 'Llama 70B reads the restaurant\'s menu page and review text — not a generic $ scale'],
            ['🔊', 'Noise level', '1–5 scale', 'Llama 70B analyses review language (quiet, buzzing, loud music…)'],
            ['✨', 'Vibe', 'short phrase', 'Llama 70B synthesises atmosphere from reviews and menu context'],
            ['🥦', 'Vegan / GF', 'Yes · No · Unknown', 'Google\'s servesVegetarianFood flag + Qwen2.5-VL vision model on photos + restaurant website + web search'],
            ['👫', 'Couples / Groups', 'Yes · No · Unknown', 'Google\'s goodForGroups field (ground truth) + Llama 70B reading reviews for occasion language'],
            ['🗓', 'Upcoming events', 'when found', 'DuckDuckGo search for the venue name + weekend/events, plus the restaurant\'s own events page'],
            ['📋', 'Menu link', 'when found', 'schema.org hasMenu field or a /menu subpage detected on the restaurant\'s website'],
            ['📅', 'Booking', 'when found', 'OpenTable · Resy · Tock · SevenRooms detected by URL pattern, plus Instagram profile and Google Places phone number'],
          ].map(([icon, label, tag, source]) => (
            <div key={label as string} style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: 12, alignItems: 'flex-start' }}>
              <span style={{ flexShrink: 0, width: 20, marginTop: 1 }}>{icon}</span>
              <div>
                <span style={{ fontWeight: 700 }}>{label}</span>
                <span style={{ ...badge }}>{tag}</span>
                <span style={{ color: '#666' }}> — {source}</span>
              </div>
            </div>
          ))}
        </Section>

        <Section title="Stack">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', fontSize: 12 }}>
            {[
              ['Frontend', 'React 18 + TypeScript + Vite'],
              ['Backend', 'Node 18 + Express + TypeScript'],
              ['Database', 'MongoDB (Mongoose)'],
              ['Maps & Places', 'Google Maps JS API + Places API v1'],
              ['Text AI', 'Llama 3.3 70B Instruct (Meta / open-source)'],
              ['Vision AI', 'Qwen2.5-VL 72B Instruct (Alibaba / open-source)'],
              ['AI hosting', 'Nebius AI Studio (Token Factory)'],
              ['Web enrichment', 'DuckDuckGo · schema.org · website scraping'],
            ].map(([k, v]) => (
              <div key={k as string}>
                <span style={{ fontWeight: 700, color: '#555' }}>{k} </span>
                <span style={{ color: '#777' }}>{v}</span>
              </div>
            ))}
          </div>
        </Section>

        <p style={{ fontSize: 11, color: '#ccc', textAlign: 'center', marginTop: 8 }}>
          Both AI models are open-source.
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>{title}</p>
      {children}
    </div>
  );
}

const backdrop: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 };
const box: React.CSSProperties = { background: '#fff', borderRadius: 16, padding: '28px 28px 20px', width: '100%', maxWidth: 560, maxHeight: '88vh', overflowY: 'auto', position: 'relative' };
const closeBtn: React.CSSProperties = { position: 'absolute', top: 16, right: 16, background: '#f5f5f5', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#555' };
const p: React.CSSProperties = { fontSize: 13, color: '#444', lineHeight: 1.6, margin: 0 };
const badge: React.CSSProperties = { fontSize: 10, fontWeight: 600, background: '#f0f0f0', color: '#666', padding: '1px 6px', borderRadius: 10, marginLeft: 5, verticalAlign: 'middle' };
