import React, { useState } from 'react';
import { TacticalCityScene } from './TacticalCityScene';
import { Incident, ResponseTeam, Depot } from '../../types';
import {
  Maximize2,
  Minimize2,
  Sparkles,
  Layers,
  Activity,
  Info,
} from 'lucide-react';

interface CommandCenter3DProps {
  incidents: Incident[];
  teams: ResponseTeam[];
  depots: Depot[];
  selectedIncident: Incident | null;
  onSelectIncident: (inc: Incident) => void;
}

export const CommandCenter3D: React.FC<CommandCenter3DProps> = ({
  incidents,
  teams,
  depots,
  selectedIncident,
  onSelectIncident,
}) => {
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <div
      className={`w-full h-full relative ${
        fullscreen ? 'fixed inset-0 z-50 bg-slate-950' : ''
      }`}
    >
      <TacticalCityScene
        incidents={incidents}
        teams={teams}
        depots={depots}
        selectedIncident={selectedIncident}
        onSelectIncident={onSelectIncident}
        waterLevel={1.2}
        interactive={true}
      />

      {/* Floating Top Header Info */}
      <div className="absolute top-3 right-3 flex items-center space-x-2 z-10">
        <div className="px-2.5 py-1 bg-black/60 backdrop-blur-md rounded text-white text-xs font-mono border border-white/10 flex items-center space-x-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>REAL-TIME 3D DIGITAL TWIN</span>
        </div>

        <button
          onClick={() => setFullscreen(!fullscreen)}
          className="p-1.5 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white rounded border border-white/10 transition"
          title={fullscreen ? 'Exit Fullscreen' : 'Fullscreen 3D View'}
        >
          {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Tactical Legend */}
      <div className="absolute bottom-3 left-3 p-3 bg-black/60 backdrop-blur-md rounded-card border border-white/10 text-white text-xs z-10 font-sans space-y-1.5 hidden md:block">
        <div className="font-semibold text-xs text-slate-300 uppercase font-mono mb-1">
          Tactical Legend
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-[#C8201B]" />
          <span>Critical Emergency Beacon</span>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E27D14]" />
          <span>High Urgency Incident</span>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-[#14284B] border border-blue-400" />
          <span>Mobile Tactical Squad</span>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2E7D5B]" />
          <span>Relief Depot & Stock Ring</span>
        </div>
      </div>
    </div>
  );
};
