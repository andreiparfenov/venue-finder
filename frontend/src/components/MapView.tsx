// Renders a full-screen Google Map and drops a marker for every venue
import React, { useEffect, useRef } from 'react';
import { Venue } from '../types';

interface Props {
  venues: Venue[];
  onMapReady: (map: google.maps.Map) => void;
  onVenueSelect: (placeId: string) => void;
}

// Module-level promise — ensures only one <script> tag is ever added,
// even when StrictMode mounts the component twice simultaneously.
let mapsLoading: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  if ((window as any).google?.maps) return Promise.resolve();
  if (mapsLoading) return mapsLoading;
  mapsLoading = new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_KEY}`;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => { mapsLoading = null; }; // allow retry on error
    document.head.appendChild(s);
  });
  return mapsLoading;
}

export default function MapView({ venues, onMapReady, onVenueSelect }: Props) {
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  // Initialize map once on mount.
  // Cleanup resets mapRef so StrictMode's double-mount always gets a fresh init.
  useEffect(() => {
    let active = true;
    loadGoogleMaps().then(() => {
      if (!active || !divRef.current || mapRef.current) return;
      mapRef.current = new google.maps.Map(divRef.current, {
        center: { lat: 40.7128, lng: -74.006 },
        zoom: 13,
        disableDefaultUI: true,
        zoomControl: true,
      });
      // Trigger resize so the map fills its container even if size wasn't
      // fully painted when the constructor ran.
      google.maps.event.trigger(mapRef.current, 'resize');
      onMapReady(mapRef.current);
    });
    return () => {
      active = false;
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync markers whenever the venues list changes
  useEffect(() => {
    if (!mapRef.current || venues.length === 0) return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = venues.map((v, i) => {
      const marker = new google.maps.Marker({
        position: { lat: v.lat, lng: v.lng },
        map: mapRef.current!,
        title: v.name,
        label: String(i + 1),
      });
      marker.addListener('click', () => onVenueSelect(v.place_id));
      return marker;
    });
    mapRef.current.panTo({ lat: venues[0].lat, lng: venues[0].lng });
    mapRef.current.setZoom(14);
  }, [venues, onVenueSelect]);

  return <div ref={divRef} style={{ width: '100%', height: '100%' }} />;
}
