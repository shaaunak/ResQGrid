import React, { useState } from 'react';
import { TacticalCityScene } from './TacticalCityScene';
import { Incident, ResponseTeam, Depot } from '../../types';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Columns,
  Layers,
  Activity,
  Flame,
  Waves,
  Building2,
  Wind,
} from 'lucide-react';

interface ScenarioCommander3DProps {
  incidents: Incident[];
  teams: ResponseTeam[];
  depots: Depot[];
  simulationState?: {
    isRunning: boolean;
    currentStep: number;
    totalSteps: number;
    scenario: string;
  };
  onSelectIncident?: (inc: Incident) => void;
}

export const ScenarioCommander3D: React.FC<ScenarioCommander3DProps> = ({
  incidents,
  teams,
  depots,
  simulationState,
  onSelectIncident = () => {},
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [simStep, setSimStep] = useState(0);
  const [activePack, setActivePack] = useState<'FLOOD' | 'COLLAPSE' | 'CYCLONE' | 'FIRE'>('FLOOD');
  const [isSplitScreen, setIsSplitScreen] = useState(false);

  // Compute water inundation surge based on playback step
  const simulatedWaterLevel =
    activePack === 'FLOOD' ? 0.4 + (simStep / 10) * 2.2 : 0.2;

  const handlePlayToggle = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setSimStep(0);
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-white font-sans overflow-hidden">
      {/* Simulation Header & Disaster Packs */}
      <div className="h-12 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between text-xs flex-shrink-0 z-10">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 font-semibold text-white">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Scenario 3D Simulator</span>
          </div>

          {/* Disaster Packs Switcher */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded border border-slate-700 text-[11px]">
            <button
              onClick={() => setActivePack('FLOOD')}
              className={`px-2 py-1 rounded flex items-center space-x-1 transition ${
                activePack === 'FLOOD' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400'
              }`}
            >
              <Waves className="w-3 h-3" />
              <span>Urban Flood</span>
            </button>
            <button
              onClick={() => setActivePack('COLLAPSE')}
              className={`px-2 py-1 rounded flex items-center space-x-1 transition ${
                activePack === 'COLLAPSE' ? 'bg-amber-600 text-white font-semibold' : 'text-slate-400'
              }`}
            >
              <Building2 className="w-3 h-3" />
              <span>Collapse</span>
            </button>
            <button
              onClick={() => setActivePack('CYCLONE')}
              className={`px-2 py-1 rounded flex items-center space-x-1 transition ${
                activePack === 'CYCLONE' ? 'bg-teal-600 text-white font-semibold' : 'text-slate-400'
              }`}
            >
              <Wind className="w-3 h-3" />
              <span>Cyclone</span>
            </button>
            <button
              onClick={() => setActivePack('FIRE')}
              className={`px-2 py-1 rounded flex items-center space-x-1 transition ${
                activePack === 'FIRE' ? 'bg-red-600 text-white font-semibold' : 'text-slate-400'
              }`}
            >
              <Flame className="w-3 h-3" />
              <span>Fire</span>
            </button>
          </div>
        </div>

        {/* Split screen toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsSplitScreen(!isSplitScreen)}
            className={`px-2.5 py-1 rounded border text-xs flex items-center space-x-1.5 transition ${
              isSplitScreen
                ? 'bg-rq-navy border-blue-400 text-white font-semibold'
                : 'border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>FIFO vs ResQGrid (Split-Screen)</span>
          </button>
        </div>
      </div>

      {/* Main 3D Canvas View (Single or Dual Side-by-Side) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left / Primary 3D View: ResQGrid Policy */}
        <div className="flex-1 h-full relative">
          <TacticalCityScene
            incidents={incidents}
            teams={teams}
            depots={depots}
            waterLevel={simulatedWaterLevel}
            interactive={true}
            onSelectIncident={onSelectIncident}
          />
          <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded border border-white/10 text-[11px] font-mono text-emerald-400">
            ResQGrid Multi-Factor Policy (Wait Time: ~14.2m)
          </div>
        </div>

        {/* Right 3D View (When Split-Screen Active): Baseline FIFO Policy */}
        {isSplitScreen && (
          <div className="flex-1 h-full relative border-l border-slate-700">
            <TacticalCityScene
              incidents={incidents}
              teams={teams}
              depots={depots}
              waterLevel={simulatedWaterLevel}
              interactive={true}
              onSelectIncident={onSelectIncident}
            />
            <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded border border-white/10 text-[11px] font-mono text-amber-400">
              Baseline FIFO Queue Policy (Wait Time: ~38.4m)
            </div>
          </div>
        )}
      </div>

      {/* Playback Scrubber Footer */}
      <div className="h-12 bg-slate-900 border-t border-slate-800 px-6 flex items-center justify-between z-10 text-xs font-mono">
        <div className="flex items-center space-x-3">
          <button
            onClick={handlePlayToggle}
            className="p-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white transition flex items-center space-x-1"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition"
            title="Reset Simulation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <span className="text-slate-300">
            Step: {simStep} / 10 ({((simStep / 10) * 100).toFixed(0)}%)
          </span>
        </div>

        {/* Timeline Slider */}
        <div className="flex-1 max-w-md mx-6 flex items-center space-x-3">
          <span className="text-[10px] text-slate-400">00:00</span>
          <input
            type="range"
            min="0"
            max="10"
            value={simStep}
            onChange={(e) => setSimStep(parseInt(e.target.value))}
            className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-800 rounded"
          />
          <span className="text-[10px] text-slate-400">+60m</span>
        </div>

        <div className="flex items-center space-x-3 text-[11px] text-slate-300">
          <span>Surge Elevation: {simulatedWaterLevel.toFixed(1)}m</span>
        </div>
      </div>
    </div>
  );
};
