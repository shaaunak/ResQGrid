import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Layers, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class CanvasErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('[ResQGrid 3D Engine] WebGL rendering exception caught safely:', error, errorInfo);
  }

  public handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="w-full h-full min-h-[360px] bg-command-darkest border border-command-border/60 rounded-xl flex flex-col items-center justify-center p-6 text-center select-none font-mono">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1 uppercase tracking-wider">
            3D Hardware Acceleration Unavailable
          </h3>
          <p className="text-xs text-slate-400 max-w-md mb-4 leading-relaxed">
            WebGL rendering context could not be created on this device or is disabled by browser policy. ResQGrid operational capabilities continue uninterrupted in standard 2D view.
          </p>
          <div className="flex items-center space-x-3 text-xs">
            <button
              onClick={this.handleRetry}
              className="px-3 py-1.5 bg-command-card hover:bg-command-border border border-command-border text-slate-200 rounded flex items-center space-x-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry 3D Context</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
