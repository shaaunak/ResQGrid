import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface SLATimerProps {
  severity: string;
  createdAt: string;
}

export const SLATimer: React.FC<SLATimerProps> = ({ severity, createdAt }) => {
  const [elapsedMinutes, setElapsedMinutes] = useState<number>(0);

  useEffect(() => {
    const calculateElapsed = () => {
      const created = new Date(createdAt).getTime();
      const now = Date.now();
      const mins = Math.max(0, Math.floor((now - created) / 60000));
      setElapsedMinutes(mins);
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 10000);
    return () => clearInterval(interval);
  }, [createdAt]);

  // SLA Targets: Critical: 15m, High: 25m, Medium: 45m, Low: 90m
  const targetMinutes =
    severity === 'CRITICAL' ? 15 : severity === 'HIGH' ? 25 : severity === 'MEDIUM' ? 45 : 90;

  const remaining = targetMinutes - elapsedMinutes;
  const isBreached = remaining < 0;
  const isWarning = remaining <= 5 && !isBreached;

  return (
    <div
      className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-xs font-mono font-semibold border ${
        isBreached
          ? 'bg-red-100 text-[#C8201B] border-red-300 animate-pulse'
          : isWarning
          ? 'bg-amber-100 text-[#E27D14] border-amber-300'
          : 'bg-slate-100 text-slate-700 border-slate-200'
      }`}
      title={`Target: ${targetMinutes}m | Elapsed: ${elapsedMinutes}m`}
    >
      <Clock className="w-3 h-3" />
      <span>
        {isBreached ? `SLA BREACHED +${Math.abs(remaining)}m` : `SLA: ${remaining}m left`}
      </span>
    </div>
  );
};

