// Renders a single venue card — insights are guaranteed to exist when this mounts
import React, { useEffect, useRef, useState } from 'react';
import { Venue } from '../types';
import VenueModal from './VenueModal';

interface Props { venue: Venue; isSelected?: boolean }

const NOISE_LABEL = ['', 'Quiet', 'Calm', 'Moderate', 'Lively', 'Loud'];
const DIET: Record<string, { bg: string; icon: string }> = {
  yes:     { bg: '#c8f5c8', icon: '✓' },
  no:      { bg: '#f5c8c8', icon: '✗' },
  unknown: { bg: '#ebebeb', icon: '?' },
};

export default function VenueCard({ venue, isSelected = false }: Props) {
  const { name, address, rating, photos = [], insights, booking } = venue;
  const cardRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (isSelected) cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [isSelected]);

  const noise      = NOISE_LABEL[insights?.noise_score ?? 3] ?? 'Moderate';
  const vegan      = insights?.vegan       ?? 'unknown';
  const glutenFree = insights?.gluten_free ?? 'unknown';
  const couples    = insights?.couples     ?? 'unknown';
  const groups     = insights?.groups      ?? 'unknown';

  return (
    <div ref={cardRef} style={{ ...card, ...(isSelected ? selected : {}) }}>
      {photos.length > 0 && (
        <div style={{ display: 'flex', gap: 2, marginBottom: 8, borderRadius: 8, overflow: 'hidden', height: 80 }}>
          {photos.map((url, i) => <img key={i} src={url} alt="" style={{ flex: 1, minWidth: 0, objectFit: 'cover' }} />)}
        </div>
      )}

      <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{name}</h3>
      <p style={{ fontSize: 11, color: '#777', marginBottom: 8 }}>{address}</p>

      {!insights ? (
        <p style={{ fontSize: 11, color: '#bbb', fontStyle: 'italic', marginTop: 4 }}>Analyzing…</p>
      ) : (<>
        <div style={row}>
          <Tag bg="#e3f2fd">{insights.price_range ?? 'N/A'}</Tag>
          <Tag bg="#fff3e0">{noise}</Tag>
          <Tag bg="#fce4ec">{insights.vibe ?? ''}</Tag>
        </div>
        <div style={{ ...row, marginTop: 5 }}>
          <DietBadge label="Vegan"       state={vegan} />
          <DietBadge label="Gluten-free" state={glutenFree} />
        </div>
        <div style={{ ...row, marginTop: 4 }}>
          <DietBadge label="Couples" state={couples} />
          <DietBadge label="Groups"  state={groups} />
        </div>
      </>)}

      {(insights?.likes || insights?.dislikes) && (
        <>
          <button onClick={() => setOpen(o => !o)} style={toggleBtn}>
            {open ? '▲ Hide reviews' : '▼ What people say'}
          </button>
          {open && (
            <div style={{ marginTop: 6 }}>
              {insights!.likes    && <p style={reviewLine}><b>People like:</b> {insights!.likes}</p>}
              {insights!.dislikes && <p style={{ ...reviewLine, marginTop: 4 }}><b>People don't like:</b> {insights!.dislikes}</p>}
            </div>
          )}
        </>
      )}

      {insights?.upcoming_events && (
        <p style={{ fontSize: 11, marginTop: 8, padding: '5px 8px', background: '#fff8e1', borderRadius: 6, color: '#6d4c00' }}>
          🗓 {insights.upcoming_events}
        </p>
      )}

      {rating != null && <p style={{ fontSize: 11, color: '#f5a623', marginTop: 6, fontWeight: 600 }}>★ {rating.toFixed(1)}</p>}

      {(booking?.online_url || booking?.instagram_url || booking?.phone || booking?.menu_url) && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #eee', display: 'flex', flexDirection: 'column', gap: 5 }}>
          {booking.menu_url      && <a href={booking.menu_url}      target="_blank" rel="noreferrer" style={menuBtn}>📋 View Menu</a>}
          {booking.online_url    && <a href={booking.online_url}    target="_blank" rel="noreferrer" style={bookBtn}>Book a table →</a>}
          {booking.instagram_url && <a href={booking.instagram_url} target="_blank" rel="noreferrer" style={igBtn}>📷 Reserve on Instagram</a>}
          {booking.phone         && <a href={`tel:${booking.phone}`} style={phoneBtn}>📞 {booking.phone}</a>}
        </div>
      )}

      <button onClick={() => setShowModal(true)} style={detailsBtn}>More details →</button>

      {showModal && <VenueModal venue={venue} onClose={() => setShowModal(false)} />}
    </div>
  );
}

function Tag({ children, bg }: { children: React.ReactNode; bg: string }) {
  return <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: bg, whiteSpace: 'nowrap' }}>{children}</span>;
}
function DietBadge({ label, state }: { label: string; state: 'yes' | 'no' | 'unknown' }) {
  const { bg, icon } = DIET[state];
  return <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: bg }}>{label} {icon}</span>;
}

const card: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: '#fff', borderRadius: 12, padding: '12px 14px', border: '1px solid #eee', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', outline: '2px solid transparent', transition: 'outline-color .2s, box-shadow .2s' };
const selected: React.CSSProperties = { outlineColor: '#4285F4', boxShadow: '0 4px 18px rgba(66,133,244,0.35)' };
const row: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 4 };
const toggleBtn: React.CSSProperties = { marginTop: 8, fontSize: 11, color: '#4285F4', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600 };
const reviewLine: React.CSSProperties = { fontSize: 11, color: '#444', lineHeight: 1.4, margin: 0 };
const linkBase: React.CSSProperties = { fontSize: 11, fontWeight: 600, textDecoration: 'none', padding: '4px 10px', borderRadius: 8, textAlign: 'center' };
const menuBtn:  React.CSSProperties = { ...linkBase, background: '#f3f3f3', color: '#333', border: '1px solid #ddd' };
const bookBtn:  React.CSSProperties = { ...linkBase, background: '#4285F4', color: '#fff' };
const igBtn:    React.CSSProperties = { ...linkBase, background: '#fce4ec', color: '#c2185b' };
const phoneBtn: React.CSSProperties = { ...linkBase, background: '#f3f3f3', color: '#333' };
const detailsBtn: React.CSSProperties = { marginTop: 10, width: '100%', padding: '6px 0', borderRadius: 8, border: '1px solid #ddd', background: '#fafafa', fontSize: 12, fontWeight: 600, color: '#444', cursor: 'pointer' };
