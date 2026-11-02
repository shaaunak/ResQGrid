import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { TacticalCityScene } from './TacticalCityScene';
import { EmergencyMarkers3D } from './EmergencyMarkers3D';
import { RescueUnits3D } from './RescueUnits3D';
import { DispatchArc3D } from './DispatchArcs3D';
import { TACTICAL_PALETTE, geoTo3D } from './coords';
import { CanvasErrorBoundary } from './CanvasErrorBoundary';
import { Incident, ResponseTeam, SimulationMetrics } from '../../types';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Waves,
  Shield,
  Activity,
  Layers,
} from 'lucide-react';

interface Scenario3DProps {
  scenarioName: string;
  metrics: SimulationMetrics | null;
  stepHistory: any[];
}

// Generate realistic 3D Mumbai simulated incidents from simulation data
const SECTOR_COORDS = [
  { name: 'Kurla West Low-Lying Area', lat: 19.0726, lon: 72.8845 },
  { name: 'Dadar Hindmata Flyover', lat: 19.0178, lon: 72.8478 },
  { name: 'Bandra East Station Road', lat: 19.0596, lon: 72.8402 },
  { name: 'Dharavi Sector 5 Transit Camp', lat: 19.0434, lon: 72.8567 },
  { name: 'Andheri Subway Near WEH', lat: 19.1136, lon: 72.8697 },
  { name: 'Sion Circle Ground Flooding', lat: 19.0390, lon: 72.8619 },
  { name: 'Chembur Shell Colony', lat: 19.0622, lon: 72.8998 },
  { name: 'Colaba Market Coastal Front', lat: 18.9067, lon: 72.8147 },
];

export const ScenarioCommander3D: React.FC<Scenario3DProps> = ({
  scenarioName,
  metrics,
  stepHistory,
}) => {
  const [playbackIndex, setPlaybackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [waterLevel, setWaterLevel] = useState<number>(0.2);

  // Map step history to 3D incidents
  const totalSteps = stepHistory.length || 10;

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setPlaybackIndex((prev) => {
        if (prev >= totalSteps - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1800);
    return () => clearInterval(interval);
  }, [isPlaying, totalSteps]);

  // Adjust flood level as simulation advances
  useEffect(() => {
    if (scenarioName.includes('Flood')) {
      const progress = playbackIndex / Math.max(1, totalSteps);
      setWaterLevel(0.1 + progress * 0.85); // Rises from 0.1 to 0.95 in 3D scale
    } else {
      setWaterLevel(0.0);
    }
  }, [playbackIndex, totalSteps, scenarioName]);

  // Construct simulated active incidents up to the current playback step
  const activeIncidents: Incident[] = SECTOR_COORDS.slice(0, Math.min(8, playbackIndex + 2)).map(
    (loc, i) => {
      const stepItem = stepHistory[i];
      const isResolved = i < playbackIndex - 1;
      return {
        id: `sim-inc-${i + 1}`,
        tracking_id: stepItem?.tracking_id || `SIM-10${i + 1}`,
        title: `Simulated Emergency Call #${i + 1}`,
        description: `Active dispatch assignment to ${stepItem?.assigned_team || 'Bandra Water Rescue'}`,
        category: 'FLOOD',
        severity: (stepItem?.severity as any) || (i % 2 === 0 ? 'CRITICAL' : 'HIGH'),
        status: isResolved ? 'RESOLVED' : 'IN_PROGRESS',
        affected_people: 8 + i * 3,
        latitude: loc.lat,
        longitude: loc.lon,
        address: `${loc.name}, Mumbai`,
        is_simulated: true,
        priority_score: 85 - i * 4,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
  );

  const activeTeams: ResponseTeam[] = [
    {
      id: 'team-sim-1',
      name: 'Bandra Water Rescue Alpha',
      team_type: 'WATER_RESCUE',
      status: 'DISPATCHED',
      capacity: 12,
      base_location_name: 'Bandra West Coastal Post',
      base_latitude: 19.0596,
      base_longitude: 72.8402,
      current_latitude: 19.066,
      current_longitude: 72.862,
      active_assignments_count: 1,
    },
    {
      id: 'team-sim-2',
      name: 'Kurla Rapid Evacuation Beta',
      team_type: 'GENERAL_EVACUATION',
      status: 'DISPATCHED',
      capacity: 15,
      base_location_name: 'Kurla Depot Station',
      base_latitude: 19.0726,
      base_longitude: 72.8845,
      current_latitude: 19.0726,
      current_longitude: 72.8845,
      active_assignments_count: 1,
    },
    {
      id: 'team-sim-3',
      name: 'Dadar Trauma Medical Unit 1',
      team_type: 'MEDICAL',
      status: 'AVAILABLE',
      capacity: 8,
      base_location_name: 'Dadar Medical Center',
      base_latitude: 19.0178,
      base_longitude: 72.8478,
      current_latitude: 19.0178,
      current_longitude: 72.8478,
      active_assignments_count: 0,
    },
  ];

  return (
    <div className="relative w-full h-[540px] bg-command-darkest rounded-xl overflow-hidden border border-command-border shadow-2xl select-none">
      {/* 3D WebGL Canvas */}
      <CanvasErrorBoundary>
        <Canvas shadows gl={{ antialias: true, alpha: false }} dpr={[1, 1.5]}>
          <color attach="background" args={[TACTICAL_PALETTE.darkest]} />
          <fog attach="fog" args={[TACTICAL_PALETTE.darkest, 25, 75]} />

          <PerspectiveCamera makeDefault position={[0, 26, 36]} fov={45} />
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            maxPolarAngle={Math.PI / 2.1}
            minDistance={10}
            maxDistance={65}
          />

          <ambientLight intensity={0.4} color="#a5b4fc" />
          <directionalLight
            position={[25, 40, 20]}
            intensity={1.1}
            color="#ffffff"
            castShadow
          />
          <pointLight position={[6, 8, -4]} intensity={2.0} color="#CF4B4B" distance={35} />

          {/* 3D City with dynamic water level */}
          <TacticalCityScene showRadar={true} waterLevel={waterLevel} />

          {/* 3D Dynamic Beacons */}
          <EmergencyMarkers3D
            incidents={activeIncidents}
            selectedIncident={selectedIncident}
            onSelectIncident={(inc) => setSelectedIncident(inc)}
          />

          {/* 3D Units */}
          <RescueUnits3D teams={activeTeams} />

          {/* Active Dispatch Vector */}
          {activeIncidents.length > 0 && (
            <DispatchArc3D
              startLat={19.0596}
              startLon={72.8402}
              endLat={activeIncidents[0].latitude}
              endLon={activeIncidents[0].longitude}
              color="#137C82"
              arcHeight={4.2}
            />
          )}
        </Canvas>
      </CanvasErrorBoundary>

      {/* Floating Tactical Telemetry Overlay (Top Left) */}
      <div className="absolute top-4 left-4 z-20 bg-command-surface/90 backdrop-blur-md border border-command-border rounded-lg p-3.5 shadow-xl font-mono text-xs space-y-2 max-w-xs">
        <div className="flex items-center space-x-2 text-command-teal uppercase tracking-wider text-[10px] pb-1 border-b border-command-border/50">
          <Activity className="w-3.5 h-3.5" />
          <span className="font-bold text-white">3D Dynamic Scenario</span>
        </div>
        <div className="text-[11px] text-slate-200 font-semibold">{scenarioName}</div>
        <div className="space-y-1 text-[10px] text-command-muted">
          <div>Step Cycle: <span className="text-white font-bold">{playbackIndex + 1} / {totalSteps}</span></div>
          {scenarioName.includes('Flood') && (
            <div className="flex items-center space-x-1 text-cyan-300">
              <Waves className="w-3 h-3 text-cyan-400" />
              <span>Simulated Water Level: +{waterLevel.toFixed(2)}m Inundation</span>
            </div>
          )}
          <div>Active Beacons: <span className="text-amber-400 font-semibold">{activeIncidents.length} calls</span></div>
        </div>
      </div>

      {/* Floating 3D Playback & Step Controls (Bottom Center) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-command-surface/90 backdrop-blur-md border border-command-border rounded-full px-4 py-2 shadow-2xl flex items-center space-x-3 text-xs font-mono text-slate-300">
        <button
          onClick={() => setPlaybackIndex(0)}
          className="p-1.5 rounded-full hover:bg-command-card hover:text-white transition"
          title="Reset to Step 1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-1.5 rounded-full hover:bg-command-card hover:text-white transition"
          title={isPlaying ? 'Pause Simulation' : 'Play Simulation'}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5 text-command-amber" /> : <Play className="w-3.5 h-3.5 text-command-teal" />}
        </button>

        <button
          onClick={() => setPlaybackIndex((prev) => Math.min(totalSteps - 1, prev + 1))}
          className="p-1.5 rounded-full hover:bg-command-card hover:text-white transition"
          title="Step Forward"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </button>

        <span className="text-slate-600">|</span>

        {/* Progress scrub bar */}
        <div className="w-32 bg-command-darkest h-2 rounded-full overflow-hidden border border-command-border/50">
          <div
            className="bg-command-teal h-full rounded-full transition-all duration-300"
            style={{ width: `${((playbackIndex + 1) / totalSteps) * 100}%` }}
          />
        </div>

        <span className="text-command-teal font-semibold text-[11px]">
          {playbackIndex + 1}/{totalSteps}
        </span>
      </div>
    </div>
  );
};

