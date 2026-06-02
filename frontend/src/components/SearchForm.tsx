// Controlled form that collects city + neighborhood and calls onSearch
import React, { useState } from 'react';

interface Props {
  onSearch: (city: string, neighborhood: string) => void;
  loading: boolean;
}

export default function SearchForm({ onSearch, loading }: Props) {
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (city.trim() && neighborhood.trim()) onSearch(city.trim(), neighborhood.trim());
  };

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <input
        style={inputStyle}
        placeholder="City (e.g. New York)"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        disabled={loading}
      />
      <input
        style={inputStyle}
        placeholder="Area or district (e.g. Brickell, Downtown, SoHo)"
        value={neighborhood}
        onChange={(e) => setNeighborhood(e.target.value)}
        disabled={loading}
      />
      <button type="submit" disabled={loading || !city || !neighborhood} style={btnStyle}>
        {loading ? 'Searching…' : 'Find Venues'}
      </button>
    </form>
  );
}

const formStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8 };

const inputStyle: React.CSSProperties = {
  padding: '11px 14px', borderRadius: 10, border: 'none',
  fontSize: 15, outline: 'none',
  boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
};

const btnStyle: React.CSSProperties = {
  padding: '11px 14px', borderRadius: 10, border: 'none',
  background: '#4285F4', color: '#fff', fontSize: 15,
  fontWeight: 700, cursor: 'pointer', transition: 'opacity .15s',
};
