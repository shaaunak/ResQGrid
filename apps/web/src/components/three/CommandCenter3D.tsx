import React, { useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html } from '@react-three/drei';
import { TacticalCityScene } from './TacticalCityScene';
import { EmergencyMarkers3D } from './EmergencyMarkers3D';
import { RescueUnits3D } from './RescueUnits3D';
import { DispatchArc3D } from './DispatchArcs3D';
import { TACTICAL_PALETTE, geoTo3D } from './coords';
import { CanvasErrorBoundary } from './CanvasErrorBoundary';
import { Incident, ResponseTeam, Depot } from '../../types';
import { Layers, Eye, EyeOff, Compass, Maximize2 } from 'lucide-react';

interface Command3DProps {
  incidents: Incident[];
  teams: ResponseTeam[];
  depots: Depot[];
  selectedIncident: Incident | null;
  onSelectIncident: (inc: Incident) => void;
}

type CameraPreset = 'ISOMETRIC' | 'OVERHEAD' | 'COASTAL';

export const CommandCenter3D: React.FC<Command3DProps> = ({
  incidents,
  teams,
  depots,
  selectedIncident,
  onSelectIncident,
}) => {
  // Layer Toggles (Inspired by Devpost Emergency Command Center reference UI)
  const [showIncidents, setShowIncidents] = useState<boolean>(true);
  const [showResponders, setShowResponders] = useState<boolean>(true);
  const [showDepots, setShowDepots] = useState<boolean>(true);
  const [showArcs, setShowArcs] = useState<boolean>(true);
  const [showRadar, setShowRadar] = useState<boolean>(true);
  const [showHazardZone, setShowHazardZone] = useState<boolean>(true);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('ISOMETRIC');
  const [layersOpen, setLayersOpen] = useState<boolean>(true);

  return (
    <div className="relative w-full h-full min-h-[480px] bg-command-darkest overflow-hidden select-none">
      <CanvasErrorBoundary>
        <Canvas shadows gl={{ antialias: true, alpha: false }} dpr={[1, 1.5]}>
          <color attach="background" args={[TACTICAL_PALETTE.darkest]} />
          <fog attach="fog" args={[TACTICAL_PALETTE.darkest, 30, 85]} />

          <CameraController preset={cameraPreset} />

          {/* Ambient & Directional Lighting */}
          <ambientLight intensity={0.45} color="#c7d2fe" />
          <directionalLight
            position={[30, 50, 25]}
            intensity={1.2}
            color="#ffffff"
            castShadow
          />
          <pointLight position={[0, 15, 0]} intensity={1.5} color="#137C82" distance={60} />

          {/* Procedural 3D City */}
          <TacticalCityScene showRadar={showRadar} />

          {/* 3D Disaster Hazard Zone (Amber/Red Inundation Polygon like Devpost reference) */}
          {showHazardZone && <DisasterHazardZone3D />}

          {/* 3D Incident Beacons - Clicking connects to TriageDrawer */}
          {showIncidents && (
            <EmergencyMarkers3D
              incidents={incidents}
              selectedIncident={selectedIncident}
              onSelectIncident={onSelectIncident}
            />
          )}

          {/* 3D Response Teams */}
          {showResponders && <RescueUnits3D teams={teams} />}

          {/* 3D Depots Representation */}
          {showDepots && <Depots3D depots={depots} />}

          {/* Active Dispatch Vectors */}
          {showArcs && incidents.length > 0 && (
            <DispatchArc3D
              startLat={19.0596}
              startLon={72.8402}
              endLat={incidents[0].latitude}
              endLon={incidents[0].longitude}
              color="#137C82"
              arcHeight={4.5}
            />
          )}
        </Canvas>
      </CanvasErrorBoundary>

      {/* Top Left: Operational Guidance & Status */}
      <div className="absolute top-4 left-4 z-10 bg-command-surface/90 backdrop-blur-md border border-command-border rounded-lg p-3 shadow-xl font-mono text-[10px] text-command-muted space-y-1.5 pointer-events-auto">
        <div className="text-white font-bold uppercase tracking-wider flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs">3D Tactical Command Grid</span>
        </div>
        <div className="text-slate-400">
          Showing real Mumbai simulated incidents, depots, and response squads.
        </div>
        <div className="flex items-center space-x-2 pt-1 border-t border-command-border/50 text-[10px]">
          <span className="text-slate-300">View Presets:</span>
          <button
            onClick={() => setCameraPreset('ISOMETRIC')}
            className={`px-2 py-0.5 rounded border transition ${
              cameraPreset === 'ISOMETRIC'
                ? 'bg-command-teal text-white border-command-teal font-semibold'
                : 'bg-command-card text-slate-400 border-command-border hover:text-white'
            }`}
          >
            Tactical Iso
          </button>
          <button
            onClick={() => setCameraPreset('OVERHEAD')}
            className={`px-2 py-0.5 rounded border transition ${
              cameraPreset === 'OVERHEAD'
                ? 'bg-command-teal text-white border-command-teal font-semibold'
                : 'bg-command-card text-slate-400 border-command-border hover:text-white'
            }`}
          >
            Overhead
          </button>
          <button
            onClick={() => setCameraPreset('COASTAL')}
            className={`px-2 py-0.5 rounded border transition ${
              cameraPreset === 'COASTAL'
                ? 'bg-command-teal text-white border-command-teal font-semibold'
                : 'bg-command-card text-slate-400 border-command-border hover:text-white'
            }`}
          >
            Coastal
          </button>
        </div>
      </div>

      {/* Top Right: Tactical Layers Panel (Matches Devpost ECC Design) */}
      <div className="absolute top-4 right-4 z-10 w-52 bg-command-surface/95 backdrop-blur-md border border-command-border rounded-lg shadow-2xl font-mono text-xs overflow-hidden pointer-events-auto">
        <div
          onClick={() => setLayersOpen(!layersOpen)}
          className="px-3 py-2 bg-command-darkest/60 border-b border-command-border flex items-center justify-between cursor-pointer hover:bg-command-card transition"
        >
          <div className="flex items-center space-x-2 text-white font-semibold">
            <Layers className="w-3.5 h-3.5 text-command-teal" />
            <span className="tracking-wider uppercase text-[11px]">Layers</span>
          </div>
          <span className="text-[10px] text-command-muted">
            {layersOpen ? 'HIDE' : 'SHOW'}
          </span>
        </div>

        {layersOpen && (
          <div className="p-3 space-y-2 text-[11px]">
            <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">
              Core Objects
            </div>

            {/* Incidents Toggle */}
            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-command-red" />
                <span>Incidents</span>
              </span>
              <button
                onClick={() => setShowIncidents(!showIncidents)}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition ${
                  showIncidents
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-command-card text-slate-500 border-command-border'
                }`}
              >
                {showIncidents ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Responders Toggle */}
            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>Responders</span>
              </span>
              <button
                onClick={() => setShowResponders(!showResponders)}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition ${
                  showResponders
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-command-card text-slate-500 border-command-border'
                }`}
              >
                {showResponders ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Depots Toggle */}
            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Supply Hubs</span>
              </span>
              <button
                onClick={() => setShowDepots(!showDepots)}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition ${
                  showDepots
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-command-card text-slate-500 border-command-border'
                }`}
              >
                {showDepots ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold pt-1.5 border-t border-command-border/50">
              Tactical Overlays
            </div>

            {/* Hazard Inundation Polygon */}
            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-1.5 text-slate-300">
                <span className="w-2 h-2 rounded bg-amber-500" />
                <span>Hazard Zones</span>
              </span>
              <button
                onClick={() => setShowHazardZone(!showHazardZone)}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition ${
                  showHazardZone
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-command-card text-slate-500 border-command-border'
                }`}
              >
                {showHazardZone ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Dispatch Arcs */}
            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-1.5 text-slate-300">
                <span className="w-2 h-2 rounded bg-command-teal" />
                <span>Dispatch Vectors</span>
              </span>
              <button
                onClick={() => setShowArcs(!showArcs)}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition ${
                  showArcs
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-command-card text-slate-500 border-command-border'
                }`}
              >
                {showArcs ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Radar Sweep */}
            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full border border-teal-400" />
                <span>Radar Sweep</span>
              </span>
              <button
                onClick={() => setShowRadar(!showRadar)}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition ${
                  showRadar
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-command-card text-slate-500 border-command-border'
                }`}
              >
                {showRadar ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Camera Controller for View Presets
function CameraController({ preset }: { preset: CameraPreset }) {
  const controlsRef = useRef<any>(null);

  const targets = {
    ISOMETRIC: { pos: [0, 28, 36] as [number, number, number], target: [0, 0, 0] as [number, number, number] },
    OVERHEAD: { pos: [0, 48, 1] as [number, number, number], target: [0, 0, 0] as [number, number, number] },
    COASTAL: { pos: [-24, 14, 12] as [number, number, number], target: [-6, 1, 4] as [number, number, number] },
  };

  useFrame((state, delta) => {
    const desired = targets[preset];
    state.camera.position.lerp(new THREE.Vector3(...desired.pos), delta * 2.5);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(new THREE.Vector3(...desired.target), delta * 2.5);
      controlsRef.current.update();
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={targets.ISOMETRIC.pos} fov={45} />
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        maxPolarAngle={Math.PI / 2.05}
        minDistance={8}
        maxDistance={75}
      />
    </>
  );
}

// 3D Disaster Hazard Zone Overlay (Orange Inundation Zone like Devpost reference)
function DisasterHazardZone3D() {
  const meshRef = useRef<THREE.Mesh>(null);

  // Subtle breathing pulse on the hazard polygon
  useFrame((state) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.opacity = 0.35 + Math.sin(state.clock.getElapsedTime() * 2) * 0.08;
      }
    }
  });

  return (
    <group position={[2, 0.12, -2]}>
      {/* Semi-transparent highlighted flood impact polygon */}
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[18, 14]} />
        <meshStandardMaterial
          color="#d97706"
          emissive="#78350f"
          roughness={0.5}
          metalness={0.2}
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Perimeter boundary highlight */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[18.1, 14.1]} />
        <meshBasicMaterial
          color="#fbbf24"
          wireframe
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* Hazard Zone Label */}
      <Html position={[0, 0.5, 0]} center distanceFactor={24} className="pointer-events-none select-none">
        <div className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-950/80 border border-amber-500/60 text-amber-300 shadow uppercase tracking-wider">
          Mithi Basin Flood Hazard Zone
        </div>
      </Html>
    </group>
  );
}

// 3D Depots Architectural Landmarks
const Depots3D: React.FC<{ depots: Depot[] }> = ({ depots }) => {
  return (
    <group>
      {depots.map((d) => {
        const [x, y, z] = geoTo3D(d.latitude, d.longitude, 0.4);
        return (
          <group key={d.id} position={[x, y, z]}>
            {/* Depot Architectural Solid */}
            <mesh position={[0, 0.35, 0]}>
              <boxGeometry args={[1.2, 0.7, 1.2]} />
              <meshStandardMaterial
                color="#059669"
                roughness={0.4}
                metalness={0.6}
              />
            </mesh>
            {/* Ground Ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
              <ringGeometry args={[0.8, 1.05, 24]} />
              <meshBasicMaterial color="#10b981" transparent opacity={0.5} side={THREE.DoubleSide} />
            </mesh>
            {/* Label */}
            <Html position={[0, 1.2, 0]} center distanceFactor={25} className="pointer-events-none select-none">
              <div className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-command-darkest/90 border border-emerald-500/40 text-emerald-300 shadow whitespace-nowrap">
                {d.name.split(' ')[0]} Hub
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
};
