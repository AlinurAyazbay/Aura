'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { District } from '@/types';

interface VoteMapProps {
  districts: District[];
  aqiMap: Record<string, { aqi: number; pm2_5: number; label: string; color: string }>;
  highlightedDistrict: string | null;
  onMarkerClick: (id: string) => void;
}

export default function VoteMap({ districts, aqiMap, highlightedDistrict, onMarkerClick }: VoteMapProps) {
  return (
    <div className="rounded-2xl overflow-hidden border border-white/[0.06] h-[400px]">
      <MapContainer
        center={[43.2566, 76.9286]}
        zoom={11}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        {districts.map((d) => {
          const aqi = aqiMap[d.id];
          const color = aqi?.color ?? '#8892a4';
          const isHighlighted = d.id === highlightedDistrict;

          return (
            <CircleMarker
              key={d.id}
              center={[d.lat, d.lng]}
              radius={isHighlighted ? 14 : 10}
              pathOptions={{
                fillColor: color,
                fillOpacity: 0.8,
                color: isHighlighted ? '#ffffff' : color,
                weight: isHighlighted ? 2 : 1,
              }}
              eventHandlers={{ click: () => onMarkerClick(d.id) }}
            >
              <Tooltip permanent={isHighlighted} direction="top" offset={[0, -10]}>
                <div style={{ fontFamily: 'sans-serif', fontSize: 12 }}>
                  <strong>{d.name}</strong>
                  {aqi && <div style={{ color: aqi.color }}>{aqi.label} — PM2.5: {aqi.pm2_5}</div>}
                  <div>{d.votes} votes</div>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
