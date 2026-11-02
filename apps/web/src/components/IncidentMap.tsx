import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Incident, ResponseTeam, Depot } from '../types';
import { Layers } from 'lucide-react';

interface IncidentMapProps {
  incidents: Incident[];
  teams: ResponseTeam[];
  depots: Depot[];
  selectedIncident: Incident | null;
  onSelectIncident: (inc: Incident) => void;
}

export const IncidentMap: React.FC<IncidentMapProps> = ({
  incidents,
  teams,
  depots,
  selectedIncident,
  onSelectIncident,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Layer toggles
  const [showIncidents, setShowIncidents] = useState(true);
  const [showResponders, setShowResponders] = useState(true);
  const [showDepots, setShowDepots] = useState(true);
  const [showFloodZone, setShowFloodZone] = useState(true);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Mumbai Center
    const map = L.map(mapContainerRef.current, {
      center: [19.0550, 72.8650],
      zoom: 12,
      zoomControl: false,
    });

    // Free public OpenStreetMap tile layer (100% free, zero API key required, zero authentication)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | ResQGrid Tactical Ops',
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map markers when data or layer toggles change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = markersLayerRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // 1. Simulated Mumbai Urban Flood Hazard Inundation Polygon (Kurla / Mithi River / Dharavi Basin)
    if (showFloodZone) {
      const floodPolygonCoords: [number, number][] = [
        [19.0800, 72.8700],
        [19.0750, 72.8950],
        [19.0550, 72.8900],
        [19.0400, 72.8650],
        [19.0450, 72.8450],
        [19.0650, 72.8550],
      ];
      const floodPolygon = L.polygon(floodPolygonCoords, {
        color: '#0284C7',
        fillColor: '#38BDF8',
        fillOpacity: 0.22,
        weight: 1.5,
        dashArray: '4, 4',
      }).bindTooltip('Simulated Mithi River Flood Vulnerability Inundation Zone', { sticky: true });
      layerGroup.addLayer(floodPolygon);
    }

    // 2. Incident Markers
    if (showIncidents) {
      incidents.forEach((inc) => {
        const isSelected = selectedIncident?.id === inc.id;
        const color =
          inc.status === 'RESOLVED'
            ? '#347F68'
            : inc.severity === 'CRITICAL'
            ? '#C84343'
            : inc.severity === 'HIGH'
            ? '#D77A34'
            : inc.severity === 'MEDIUM'
            ? '#C99A3D'
            : '#146D73';

        const customHtml = `
          <div style="
            width: ${isSelected ? '24px' : '18px'};
            height: ${isSelected ? '24px' : '18px'};
            background-color: ${color};
            border: 2px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.25);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s ease;
            ${isSelected ? 'outline: 2px solid ' + color + '; outline-offset: 2px;' : ''}
          ">
            <span style="font-size: ${isSelected ? '10px' : '8px'}; font-weight: bold; color: white; font-family: 'IBM Plex Mono', monospace;">!</span>
          </div>
        `;

        const icon = L.divIcon({
          className: 'custom-incident-marker',
          html: customHtml,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([inc.latitude, inc.longitude], { icon })
          .on('click', () => onSelectIncident(inc))
          .bindTooltip(`<b>${inc.tracking_id}</b>: ${inc.title} (${inc.severity})`, {
            direction: 'top',
            offset: [0, -10],
          });

        layerGroup.addLayer(marker);
      });
    }

    // 3. Response Team Markers
    if (showResponders) {
      teams.forEach((t) => {
        const teamColor = t.status === 'AVAILABLE' ? '#146D73' : t.status === 'DISPATCHED' ? '#D77A34' : '#64727B';
        const teamHtml = `
          <div style="
            width: 18px;
            height: 18px;
            background-color: ${teamColor};
            border: 2px solid #ffffff;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          ">
            <span style="font-size: 8px; font-weight: bold; color: white; font-family: 'IBM Plex Mono', monospace;">T</span>
          </div>
        `;

        const icon = L.divIcon({
          className: 'custom-team-marker',
          html: teamHtml,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });

        const marker = L.marker([t.current_latitude, t.current_longitude], { icon }).bindTooltip(
          `<b>${t.name}</b><br/>Type: ${t.team_type}<br/>Status: ${t.status}`,
          { direction: 'top', offset: [0, -10] }
        );
        layerGroup.addLayer(marker);
      });
    }

    // 4. Depots Markers
    if (showDepots) {
      depots.forEach((d) => {
        const depotHtml = `
          <div style="
            width: 16px;
            height: 16px;
            background-color: #0E555A;
            border: 2px solid #ffffff;
            border-radius: 3px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <span style="font-size: 8px; font-weight: bold; color: white; font-family: 'IBM Plex Mono', monospace;">D</span>
          </div>
        `;
        const icon = L.divIcon({
          className: 'custom-depot-marker',
          html: depotHtml,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        const marker = L.marker([d.latitude, d.longitude], { icon }).bindTooltip(
          `<b>${d.name}</b><br/>${d.location_name}`,
          { direction: 'top', offset: [0, -10] }
        );
        layerGroup.addLayer(marker);
      });
    }
  }, [incidents, teams, depots, selectedIncident, showIncidents, showResponders, showDepots, showFloodZone]);

  // Center on selected incident
  useEffect(() => {
    if (selectedIncident && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([selectedIncident.latitude, selectedIncident.longitude], 14, {
        duration: 1.0,
      });
    }
  }, [selectedIncident]);

  return (
    <div className="relative w-full h-full min-h-[450px]">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Tactical Layer Toggles (Reference UI Match) */}
      <div className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur-md border border-app-border rounded-lg shadow-lg p-3 text-xs w-48 font-sans">
        <div className="flex items-center space-x-2 text-app-text-secondary uppercase text-xs tracking-wider mb-2 pb-1 border-b border-app-border font-mono">
          <Layers className="w-3.5 h-3.5 text-app-primary" />
          <span className="font-semibold text-app-text">Tactical Layers</span>
        </div>
        <div className="space-y-1.5">
          <label className="flex items-center justify-between cursor-pointer hover:text-app-text text-app-text-secondary text-xs">
            <span>Incidents ({incidents.length})</span>
            <input
              type="checkbox"
              checked={showIncidents}
              onChange={(e) => setShowIncidents(e.target.checked)}
              className="accent-app-primary rounded cursor-pointer"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer hover:text-app-text text-app-text-secondary text-xs">
            <span>Responders ({teams.length})</span>
            <input
              type="checkbox"
              checked={showResponders}
              onChange={(e) => setShowResponders(e.target.checked)}
              className="accent-app-primary rounded cursor-pointer"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer hover:text-app-text text-app-text-secondary text-xs">
            <span>Depots ({depots.length})</span>
            <input
              type="checkbox"
              checked={showDepots}
              onChange={(e) => setShowDepots(e.target.checked)}
              className="accent-app-primary rounded cursor-pointer"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer hover:text-app-text text-app-text-secondary text-xs">
            <span>Flood Heatmap</span>
            <input
              type="checkbox"
              checked={showFloodZone}
              onChange={(e) => setShowFloodZone(e.target.checked)}
              className="accent-app-primary rounded cursor-pointer"
            />
          </label>
        </div>
      </div>
    </div>
  );
};

