'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { District } from '@/types';

interface VoteMapProps {
  districts: District[];
  aqiMap: Record<string, { aqi: number; pm2_5: number; label: string; color: string }>;
  highlightedDistrict: string | null;
  onMarkerClick: (id: string) => void;
}

export default function VoteMap({ districts, aqiMap, highlightedDistrict, onMarkerClick }: VoteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.CircleMarker>>(new Map());
  const onMarkerClickRef = useRef(onMarkerClick);
  onMarkerClickRef.current = onMarkerClick;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = L.map(containerRef.current, {
      center: [43.2566, 76.9286],
      zoom: 11,
      zoomControl: true,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    }).addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();

    districts.forEach((d) => {
      const aqi = aqiMap[d.id];
      const color = aqi?.color ?? '#8892a4';
      const isHighlighted = d.id === highlightedDistrict;

      const marker = L.circleMarker([d.lat, d.lng], {
        radius: isHighlighted ? 14 : 10,
        fillColor: color,
        fillOpacity: 0.8,
        color: isHighlighted ? '#ffffff' : color,
        weight: isHighlighted ? 2 : 1,
      }).addTo(map);

      marker.bindTooltip(
        `<div style="font-family:sans-serif;font-size:12px">
          <strong>${d.name}</strong>
          ${aqi ? `<div style="color:${aqi.color}">${aqi.label} — PM2.5: ${aqi.pm2_5}</div>` : ''}
          <div>${d.votes} votes</div>
        </div>`,
        { permanent: isHighlighted, direction: 'top', offset: [0, -10] }
      );

      marker.on('click', () => onMarkerClickRef.current(d.id));
      markersRef.current.set(d.id, marker);
    });
  }, [districts, aqiMap, highlightedDistrict]);

  return (
    <div className="rounded-2xl overflow-hidden border border-white/[0.06] h-[400px]">
      <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
    </div>
  );
}
