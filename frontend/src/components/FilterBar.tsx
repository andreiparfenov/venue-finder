import React from 'react';

export interface Filters {
  query: string;
  vegan: boolean;
  glutenFree: boolean;
  couples: boolean;
  groups: boolean;
  minRating: number;       // 0 = off, 4 = 4★+
  hasBooking: boolean;
  vibePreference: string;  // agent-only: "quiet" | "lively" | "" — not shown in UI
}

export const defaultFilters: Filters = {
  query: '', vegan: false, glutenFree: false,
  couples: false, groups: false, minRating: 0, hasBooking: false,
  vibePreference: '',
};

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
  total: number;
  shown: number;
}

const PILLS: { key: keyof Filters; label: string }[] = [
  { key: 'vegan',      label: 'Vegan ✓' },
  { key: 'glutenFree', label: 'Gluten-free ✓' },
  { key: 'couples',    label: 'Couples' },
  { key: 'groups',     label: 'Groups' },
  { key: 'hasBooking', label: 'Has booking' },
];

export default function FilterBar({ filters, onChange, total, shown }: Props) {
  const toggle = (key: keyof Filters) =>
    onChange({ ...filters, [key]: !filters[key as keyof Filters] });

  return (
    <div style={bar}>
      <input
        style={searchInput}
        placeholder="Filter by name…"
        value={filters.query}
        onChange={e => onChange({ ...filters, query: e.target.value })}
      />
      {PILLS.map(({ key, label }) => (
        <Pill key={key} label={label} active={!!filters[key]} onClick={() => toggle(key)} />
      ))}
      <Pill
        label="4★+"
        active={filters.minRating > 0}
        onClick={() => onChange({ ...filters, minRating: filters.minRating ? 0 : 4 })}
      />
      <span style={{ fontSize: 11, color: '#999', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
        {total > 0 ? `${shown} / ${total}` : 'pre-search filters'}
      </span>
    </div>
  );
}

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ ...pill, ...(active ? activePill : {}) }}>
      {label}
    </button>
  );
}

const bar: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap',
  padding: '8px 12px', background: '#f5f5f5', borderTop: '1px solid #e0e0e0',
  overflowX: 'auto',
};
const searchInput: React.CSSProperties = {
  padding: '4px 10px', borderRadius: 20, border: '1px solid #ddd',
  fontSize: 12, outline: 'none', minWidth: 140, flexShrink: 0,
};
const pill: React.CSSProperties = {
  padding: '3px 11px', borderRadius: 20, border: '1px solid #ddd',
  background: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer',
  whiteSpace: 'nowrap', color: '#555', flexShrink: 0,
};
const activePill: React.CSSProperties = {
  background: '#4285F4', borderColor: '#4285F4', color: '#fff',
};
