import React from 'react';
import { Play, Pause, RotateCcw, Clock } from 'lucide-react';

interface TimelineReplayProps {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStepChange: (step: number) => void;
  onReset: () => void;
  activeTimeLabel?: string;
}

export const TimelineReplay: React.FC<TimelineReplayProps> = ({
  currentStep,
  totalSteps,
  isPlaying,
  onTogglePlay,
  onStepChange,
  onReset,
  activeTimeLabel = 'T + 00:00',
}) => {
  return (
    <div className="absolute bottom-4 left-4 right-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-rq-border p-3 rounded-xl shadow-lg z-20 font-sans flex items-center space-x-4">
      {/* Controls */}
      <div className="flex items-center space-x-2 shrink-0">
        <button
          onClick={onTogglePlay}
          className="w-8 h-8 rounded-lg bg-[#14284B] hover:bg-[#1E3A8A] text-white flex items-center justify-center transition shadow-sm"
          title={isPlaying ? 'Pause Replay' : 'Play Timeline Replay'}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        <button
          onClick={onReset}
          className="w-8 h-8 rounded-lg bg-rq-surface2 hover:bg-slate-200 text-rq-ink flex items-center justify-center transition border border-rq-border"
          title="Reset to Start"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Label & Scrubber */}
      <div className="flex-1 flex flex-col justify-center space-y-1">
        <div className="flex justify-between items-center text-[11px] font-mono">
          <span className="font-semibold text-rq-ink flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-rq-brand" />
            <span>Operational Timeline Replay</span>
          </span>
          <span className="text-rq-brand font-bold">{activeTimeLabel}</span>
        </div>
        <input
          type="range"
          min={0}
          max={totalSteps}
          value={currentStep}
          onChange={(e) => onStepChange(Number(e.target.value))}
          className="w-full accent-[#14284B] cursor-pointer"
        />
      </div>

      {/* Step counter */}
      <div className="text-[11px] font-mono font-bold text-rq-muted shrink-0">
        Step {currentStep} / {totalSteps}
      </div>
    </div>
  );
};
