import React from 'react';
import { Venue, Insights } from '../types';

interface Props { venue: Venue; onClose: () => void }

const NOISE = ['', 'Quiet', 'Calm', 'Moderate', 'Lively', 'Loud'];
const DIET: Record<string, string> = { yes: '✓', no: '✗', unknown: '?' };

function perfectFor(i: Insights): string[] {
  const r: string[] = [];
  if (i.couples      === 'yes')  r.push('Romantic date nights');
  if (i.groups       === 'yes')  r.push('Group gatherings and celebrations');
  if (i.vegan        === 'yes')  r.push('Vegans and plant-based diners');
  if (i.gluten_free  === 'yes')  r.push('Guests with gluten intolerance');
  if ((i.noise_score ?? 3) <= 2) r.push('Quiet conversations and business lunches');
  if ((i.noise_score ?? 3) >= 4) r.push('Those who love a lively, buzzing atmosphere');
  return r;
}

function cautious(i: Insights): string[] {
  const r: string[] = [];
  if (i.couples     === 'no') r.push('Looking for a romantic setting — may not suit');
  if (i.groups      === 'no') r.push('Coming with a large group — limited space');
  if (i.vegan       === 'no') r.push('Following a vegan diet — few plant-based options');
  if (i.gluten_free === 'no') r.push('Gluten intolerance — limited safe choices');
  if ((i.noise_score ?? 3) >= 4) r.push('You need a quiet space for conversation');
  if ((i.noise_score ?? 3) <= 2) r.push('You prefer a loud, energetic night out');
  return r;
}

export default function VenueModal({ venue, onClose }: Props) {
  const { name, address, rating, photos = [], booking, insights } = venue;

  return (
    <div style={backdrop} onClick={onClose}>
      <div style={box} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={closeBtn}>✕</button>

        {photos.length > 0 && (
          <div style={{ display: 'flex', gap: 3, height: 140, borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}>
            {photos.map((u, i) => <img key={i} src={u} alt="" style={{ flex: 1, minWidth: 0, objectFit: 'cover' }} />)}
          </div>
        )}

        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 3 }}>{name}</h2>
        <p style={{ fontSize: 12, color: '#777', marginBottom: 4 }}>{address}</p>
        {rating != null && <p style={{ fontSize: 13, color: '#f5a623', fontWeight: 700, marginBottom: 12 }}>★ {rating.toFixed(1)}</p>}

        {insights ? (<>
          <Section title="Atmosphere">
            <Row label="Noise">{NOISE[insights.noise_score ?? 3]}</Row>
            <Row label="Vibe">{insights.vibe}</Row>
            <Row label="Price">{insights.price_range}</Row>
          </Section>

          <Section title="Dietary">
            <Row label="Vegan">{DIET[insights.vegan ?? 'unknown']}</Row>
            <Row label="Gluten-free">{DIET[insights.gluten_free ?? 'unknown']}</Row>
          </Section>

          <Section title="Good for">
            <Row label="Couples">{DIET[insights.couples ?? 'unknown']}</Row>
            <Row label="Groups">{DIET[insights.groups ?? 'unknown']}</Row>
          </Section>

          {insights.upcoming_events && (
            <Section title="🗓 Upcoming events">
              <p style={{ ...para, background: '#fff8e1', padding: '8px 10px', borderRadius: 8, color: '#6d4c00' }}>
                {insights.upcoming_events}
              </p>
            </Section>
          )}

          {(insights.likes || insights.dislikes) && (
            <Section title="What people say">
              {insights.likes    && <p style={para}><b>Like:</b> {insights.likes}</p>}
              {insights.dislikes && <p style={para}><b>Don't like:</b> {insights.dislikes}</p>}
            </Section>
          )}

          {perfectFor(insights).length > 0 && (
            <Section title="✅ Perfect for">
              {perfectFor(insights).map(s => <p key={s} style={bullet}>• {s}</p>)}
            </Section>
          )}

          {cautious(insights).length > 0 && (
            <Section title="⚠️ Be cautious if">
              {cautious(insights).map(s => <p key={s} style={bullet}>• {s}</p>)}
            </Section>
          )}
        </>) : <p style={{ color: '#aaa', fontSize: 13 }}>Insights are still loading…</p>}

        {(booking?.online_url || booking?.instagram_url || booking?.phone) && (
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            {booking.menu_url      && <a href={booking.menu_url}      target="_blank" rel="noreferrer" style={menuBtn}>📋 View Menu</a>}
            {booking.online_url    && <a href={booking.online_url}    target="_blank" rel="noreferrer" style={bookBtn}>Book a table →</a>}
            {booking.instagram_url && <a href={booking.instagram_url} target="_blank" rel="noreferrer" style={igBtn}>📷 Instagram</a>}
            {booking.phone         && <a href={`tel:${booking.phone}`} style={phoneBtn}>📞 {booking.phone}</a>}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 14 }}><p style={sectionTitle}>{title}</p>{children}</div>;
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '3px 0', borderBottom: '1px solid #f5f5f5' }}><span style={{ color: '#666' }}>{label}</span><span style={{ fontWeight: 600 }}>{children}</span></div>;
}

const backdrop: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 };
const box: React.CSSProperties = { background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 480, maxHeight: '85vh', overflowY: 'auto', position: 'relative' };
const closeBtn: React.CSSProperties = { position: 'absolute', top: 14, right: 14, background: '#f5f5f5', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: 14, fontWeight: 700 };
const sectionTitle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 };
const para: React.CSSProperties = { fontSize: 13, color: '#444', lineHeight: 1.5, margin: '4px 0' };
const bullet: React.CSSProperties = { fontSize: 13, color: '#444', margin: '3px 0' };
const linkBase: React.CSSProperties = { fontSize: 12, fontWeight: 600, textDecoration: 'none', padding: '6px 14px', borderRadius: 8 };
const menuBtn:  React.CSSProperties = { ...linkBase, background: '#f3f3f3', color: '#333', border: '1px solid #ddd' };
const bookBtn:  React.CSSProperties = { ...linkBase, background: '#4285F4', color: '#fff' };
const igBtn:    React.CSSProperties = { ...linkBase, background: '#fce4ec', color: '#c2185b' };
const phoneBtn: React.CSSProperties = { ...linkBase, background: '#f3f3f3', color: '#333' };
