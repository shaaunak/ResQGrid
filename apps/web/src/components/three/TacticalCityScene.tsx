import React, { useState, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { RealMumbaiGeometry } from './RealMumbaiGeometry';
import { DynamicFloodPlane, WeatherSystem } from './DynamicFloodPlane';
import { OperationalLayers3D } from './OperationalLayers3D';
import { Incident, ResponseTeam, Depot } from '../../types';
import {
  Sun,
  Moon,
  Camera,
  Layers,
  Sparkles,
  Maximize2,
  Sliders,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';

interface TacticalCitySceneProps {
  incidents?: Incident[];
  teams?: ResponseTeam[];
  depots?: Depot[];
  selectedIncident?: Incident | null;
  onSelectIncident?: (inc: Incident) => void;
  waterLevel?: number;
  interactive?: boolean;
  autoRotate?: boolean;
  cameraPreset?: 'overview' | 'kurla' | 'hindmata' | 'bkc' | 'coast';
}

export const TacticalCityScene: React.FC<TacticalCitySceneProps> = ({
  incidents = [],
  teams = [],
  depots = [],
  selectedIncident = null,
  onSelectIncident = () => {},
  waterLevel = 1.2,
  interactive = true,
  autoRotate = false,
  cameraPreset = 'overview',
}) => {
  const [isNight, setIsNight] = useState(false);
  const [rainActive, setRainActive] = useState(true);
  const [currentWaterLevel, setCurrentWaterLevel] = useState(waterLevel);
  const [showLabels, setShowLabels] = useState(true);
  const [activePreset, setActivePreset] = useState(cameraPreset);

  const controlsRef = useRef<any>(null);

  // Camera presets
  const presets: Record<string, { pos: [number, number, number]; target: [number, number, number] }> = {
    overview: { pos: [0, 24, 28], target: [0, 0, 0] },
    kurla: { pos: [6, 10, 5], target: [6, 0, -4] },
    hindmata: { pos: [-5, 8, 18], target: [-5, 0, 12] },
    bkc: { pos: [2, 12, 4], target: [2, 0, -2] },
    coast: { pos: [-18, 14, 10], target: [-10, 0, 5] },
  };

  const flyToPreset = (key: string) => {
    setActivePreset(key as any);
    const p = presets[key];
    if (p && controlsRef.current) {
      controlsRef.current.target.set(...p.target);
      controlsRef.current.object.position.set(...p.pos);
      controlsRef.current.update();
    }
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-900 select-none">
      {/* 3D Canvas */}
      <Canvas
        shadows
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: isNight ? 0.7 : 1.15,
          outputColorSpace: THREE.SRGBColorSpace,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]} // Capped at 2 for performance
      >
        <PerspectiveCamera makeDefault position={presets[activePreset]?.pos || [0, 24, 28]} fov={45} />
        
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.08}
          autoRotate={autoRotate}
          autoRotateSpeed={0.8}
          maxPolarAngle={Math.PI / 2.1} // Prevent looking from underground
          minDistance={4}
          maxDistance={55}
          target={presets[activePreset]?.target || [0, 0, 0]}
        />

        {/* Ambient & Directional Lighting */}
        <ambientLight intensity={isNight ? 0.25 : 0.65} color={isNight ? '#1E293B' : '#FFFFFF'} />
        <hemisphereLight
          intensity={isNight ? 0.3 : 0.8}
          color={isNight ? '#0F172A' : '#E0F2FE'}
          groundColor={isNight ? '#020617' : '#94A3B8'}
        />
        <directionalLight
          position={isNight ? [-20, 25, -15] : [20, 30, 20]}
          intensity={isNight ? 0.4 : 1.4}
          color={isNight ? '#60A5FA' : '#FFFDF0'}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-far={70}
          shadow-camera-left={-25}
          shadow-camera-right={25}
          shadow-camera-top={25}
          shadow-camera-bottom={-25}
          shadow-bias={-0.0005}
        />

        {/* Real Extruded Mumbai Geometry */}
        <Suspense fallback={null}>
          <RealMumbaiGeometry isNight={isNight} />
        </Suspense>

        {/* Dynamic Water Plane Shader */}
        <DynamicFloodPlane waterLevel={currentWaterLevel} isNight={isNight} />

        {/* Weather Rainfall */}
        {rainActive && <WeatherSystem rainIntensity={currentWaterLevel / 2.5} isNight={isNight} />}

        {/* Operations Layer: Beacons, Units, Depots, Labels */}
        <OperationalLayers3D
          incidents={incidents}
          teams={teams}
          depots={depots}
          selectedIncident={selectedIncident}
          onSelectIncident={onSelectIncident}
          showLabels={showLabels}
        />
      </Canvas>

      {/* Floating Tactical Camera Presets Bar */}
      {interactive && (
        <div className="absolute top-3 left-3 flex items-center space-x-1.5 bg-black/60 backdrop-blur-md p-1 rounded-card border border-white/10 text-xs z-10 font-sans">
          <span className="text-[10px] text-slate-400 font-mono px-2 uppercase">Sectors:</span>
          {['overview', 'kurla', 'hindmata', 'bkc', 'coast'].map((preset) => (
            <button
              key={preset}
              onClick={() => flyToPreset(preset)}
              className={`px-2 py-1 rounded text-xs transition capitalize ${
                activePreset === preset
                  ? 'bg-rq-navy text-white font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      )}

      {/* Floating Controls (Day/Night, Rain, Labels, Water Level) */}
      {interactive && (
        <div className="absolute bottom-3 right-3 flex items-center space-x-2 bg-black/60 backdrop-blur-md p-1.5 rounded-card border border-white/10 text-xs text-white z-10 font-sans">
          {/* Water level slider */}
          <div className="flex items-center space-x-2 px-2 border-r border-white/20">
            <span className="text-[10px] font-mono text-slate-300">Flood:</span>
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={currentWaterLevel}
              onChange={(e) => setCurrentWaterLevel(parseFloat(e.target.value))}
              className="w-18 accent-blue-500 cursor-pointer h-1.5 bg-slate-700 rounded"
              title="Flood Inundation Level (0 to 3m)"
            />
            <span className="font-mono text-[10px] w-8">{currentWaterLevel.toFixed(1)}m</span>
          </div>

          {/* Toggle Rain */}
          <button
            onClick={() => setRainActive(!rainActive)}
            className={`p-1.5 rounded transition ${
              rainActive ? 'bg-blue-600/60 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Toggle Monsoon Rainfall"
          >
            🌧
          </button>

          {/* Toggle Labels */}
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`px-2 py-1 rounded text-[11px] font-mono transition ${
              showLabels ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Toggle Operational 3D Labels"
          >
            LABELS
          </button>

          {/* Toggle Day / Night */}
          <button
            onClick={() => setIsNight(!isNight)}
            className="p-1.5 rounded hover:bg-white/10 text-slate-300 hover:text-white transition"
            title={isNight ? 'Switch to Daytime Sun' : 'Switch to Night Mode Glow'}
          >
            {isNight ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
};
