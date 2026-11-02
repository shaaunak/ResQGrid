import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { TacticalCityScene } from './TacticalCityScene';
import { EmergencyMarkers3D } from './EmergencyMarkers3D';
import { RescueUnits3D } from './RescueUnits3D';
import { DispatchArc3D } from './DispatchArcs3D';
import { TACTICAL_PALETTE } from './coords';
import { CanvasErrorBoundary } from './CanvasErrorBoundary';
import { Incident, ResponseTeam } from '../../types';
import {
  Play,
  Pause,
  RotateCcw,
  Eye,
  Sliders,
  ChevronRight,
  Shield,
  Activity,
  CheckCircle2,
} from 'lucide-react';

// Demonstration story stages
export const STORY_STAGES = [
  {
    step: 1,
    title: '1. Autonomous Grid Surveillance',
    headline: 'Continuous Disaster Sensor Telemetry Across Mumbai',
    desc: 'Municipal weather sensors, tidal gauges, and emergency call feeds are ingested in real-time across central transit corridors.',
    camPos: [0, 24, 32] as [number, number, number],
    camTarget: [0, 0, 0] as [number, number, number],
    focusSector: 'Mumbai Metropolitan Basin',
  },
  {
    step: 2,
    title: '2. Emergency Ingestion & Geo-Locate',
    headline: 'Critical Flash Flood Incident Detected in Kurla West',
    desc: 'Citizen reports 12 victims stranded near Mithi River bridge with 4ft waterlogging. Instant geolocation and S3 photographic evidence recorded.',
    camPos: [5, 12, 12] as [number, number, number],
    camTarget: [6, 1, -4] as [number, number, number],
    focusSector: 'Kurla West (Mithi River Sector)',
  },
  {
    step: 3,
    title: '3. Explainable Algorithmic Prioritization',
    headline: 'Multi-Factor Normalized Urgency Score: 88.5 / 100',
    desc: 'The priority engine evaluates 35% Severity + 25% Impact + 20% Waiting Delay + 20% Vulnerability. Transparent audit explanation presented to the operator.',
    camPos: [6, 9, 7] as [number, number, number],
    camTarget: [6, 1, -4] as [number, number, number],
    focusSector: 'Algorithmic Triage Engine',
  },
  {
    step: 4,
    title: '4. Two-Stage Resource Matching & Mobilization',
    headline: 'Bandra Water Rescue Alpha Deployed with Depot Supplies',
    desc: 'Fire units disqualified due to lack of watercraft. Bandra squad matched at 94% suitability (4.8km proximity via Haversine). 5 lifejackets atomically reserved.',
    camPos: [-4, 14, 18] as [number, number, number],
    camTarget: [0, 1, 0] as [number, number, number],
    focusSector: 'Active Supply & Unit Dispatch',
  },
  {
    step: 5,
    title: '5. Mission Resolution & Cloud Telemetry Sync',
    headline: 'All 12 Citizens Rescued • Incident Marked Resolved',
    desc: 'Field responder uploads completion proof to S3. Inventory is reconciled, transactional outbox relays event to SQS, and CloudWatch metrics update.',
    camPos: [0, 22, 28] as [number, number, number],
    camTarget: [0, 0, 0] as [number, number, number],
    focusSector: 'Relief Operations Finalized',
  },
];

// Simulated incidents for the 3D showcase
const SHOWCASE_INCIDENTS: Incident[] = [
  {
    id: 'inc-show-1',
    tracking_id: 'INC-1042',
    title: 'Severe Waterlogging & 12 Citizens Stranded Near Mithi River',
    description: 'Rapid 4ft flood inundation trapping families.',
    category: 'FLOOD',
    severity: 'CRITICAL',
    status: 'IN_PROGRESS',
    affected_people: 12,
    latitude: 19.0726,
    longitude: 72.8845,
    address: 'Near Kranti Nagar Bridge, Kurla West, Mumbai',
    is_simulated: true,
    priority_score: 88.5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inc-show-2',
    tracking_id: 'INC-2041',
    title: 'Ambulance Trapped in Hindmata Flood Corridor',
    description: 'Patient transfer vehicle stalled in 3.5ft water.',
    category: 'MEDICAL',
    severity: 'HIGH',
    status: 'VERIFIED',
    affected_people: 3,
    latitude: 19.0178,
    longitude: 72.8478,
    address: 'Hindmata Flyover, Dadar East, Mumbai',
    is_simulated: true,
    priority_score: 74.2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inc-show-3',
    tracking_id: 'INC-3088',
    title: 'Transit Camp Wall Precautionary Evacuation',
    description: 'Compound wall weakened by continuous downpour.',
    category: 'COLLAPSE',
    severity: 'MEDIUM',
    status: 'REPORTED',
    affected_people: 24,
    latitude: 19.0434,
    longitude: 72.8567,
    address: 'Dharavi Sector 5, Mumbai',
    is_simulated: true,
    priority_score: 62.0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Simulated response teams
const SHOWCASE_TEAMS: ResponseTeam[] = [
  {
    id: 'team-show-1',
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
    id: 'team-show-2',
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

// Camera controller that smoothly transitions to target stage position
function CameraChoreographer({ stageIndex }: { stageIndex: number }) {
  const currentStage = STORY_STAGES[stageIndex];
  const controlsRef = useRef<any>(null);

  useFrame((state, delta) => {
    const cam = state.camera;
    // Smooth lerp to current stage position
    const targetPos = new THREE.Vector3(...currentStage.camPos);
    cam.position.lerp(targetPos, delta * 2.2);

    if (controlsRef.current) {
      const targetLook = new THREE.Vector3(...currentStage.camTarget);
      controlsRef.current.target.lerp(targetLook, delta * 2.5);
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      maxPolarAngle={Math.PI / 2.1}
      minDistance={10}
      maxDistance={65}
    />
  );
}

export const CinematicLandingCanvas: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(true);
  const [is2DMode, setIs2DMode] = useState<boolean>(false);

  // Auto-advance narrative stages every 7 seconds if autoplay enabled
  useEffect(() => {
    if (!isAutoPlay) return;
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % STORY_STAGES.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [isAutoPlay]);

  const activeStage = STORY_STAGES[currentStep];

  return (
    <div className="relative w-full h-[620px] md:h-[720px] bg-[#EEF3F6] overflow-hidden border-b border-app-border select-none">
      {/* 3D WebGL Canvas */}
      {!is2DMode ? (
        <CanvasErrorBoundary
          fallback={
            <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-app-surface font-sans text-center">
              <div className="text-app-critical font-bold mb-1">WebGL Acceleration Unavailable</div>
              <p className="text-xs text-app-text-secondary max-w-md mb-4">
                Hardware 3D context could not be created. Showing 2D tactical intelligence overview.
              </p>
              <button
                onClick={() => setIs2DMode(true)}
                className="px-3 py-1.5 bg-app-primary text-white rounded text-xs"
              >
                Switch to 2D Mode
              </button>
            </div>
          }
        >
          <Canvas shadows gl={{ antialias: true, alpha: false }} dpr={[1, 1.5]}>
            <color attach="background" args={['#EEF3F6']} />
            <fog attach="fog" args={['#EEF3F6', 35, 95]} />

            <PerspectiveCamera makeDefault position={[0, 24, 32]} fov={45} />
            <CameraChoreographer stageIndex={currentStep} />

            {/* Daytime Enterprise Atmospheric Lighting */}
            <ambientLight intensity={0.9} color="#ffffff" />
            <directionalLight
              position={[35, 55, 30]}
              intensity={1.6}
              color="#ffffff"
              castShadow
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
            />
            {/* Subtle Key Accent Lights */}
            <pointLight position={[-15, 15, -10]} intensity={1.2} color="#146D73" distance={50} />
            <pointLight position={[15, 12, 15]} intensity={1.0} color="#D77A34" distance={40} />

            {/* Miniature 3D City Model */}
            <TacticalCityScene showRadar={true} />

            {/* 3D Incident Beacons */}
            <EmergencyMarkers3D
              incidents={SHOWCASE_INCIDENTS}
              selectedIncident={SHOWCASE_INCIDENTS[0]}
            />

            {/* 3D Response Squads */}
            <RescueUnits3D teams={SHOWCASE_TEAMS} />

            {/* Active 3D Dispatch Flight Arc from Bandra Coastal Post to Kurla Flood Scene */}
            <DispatchArc3D
              startLat={19.0596}
              startLon={72.8402}
              endLat={19.0726}
              endLon={72.8845}
              color="#146D73"
              arcHeight={4.0}
            />
          </Canvas>
        </CanvasErrorBoundary>
      ) : (
        /* Accessible 2D Fallback Map View */
        <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-app-surface font-sans">
          <Activity className="w-10 h-10 text-app-primary mb-3 animate-pulse" />
          <h3 className="text-base font-bold text-app-text uppercase font-mono">2D Accessible Tactical Stream Active</h3>
          <p className="text-xs text-app-text-secondary max-w-md mt-1 leading-relaxed">
            High-contrast 2D fallback mode enabled for accessibility, low-power devices, or reduced motion preferences.
          </p>
        </div>
      )}

      {/* Floating Tactical Story Overlay (Matching Linear / Palantir Enterprise Aesthetic) */}
      <div className="absolute top-6 left-6 z-20 max-w-sm md:max-w-md bg-white/95 backdrop-blur-md border border-app-border rounded-xl p-5 shadow-xl space-y-3 font-sans">
        <div className="flex items-center justify-between border-b border-app-border pb-2 text-[10px] text-app-text-secondary uppercase tracking-wider font-mono">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-app-primary animate-ping" />
            <span className="font-semibold text-app-text">Live Lifecycle Showcase</span>
          </div>
          <span>Sector: {activeStage.focusSector}</span>
        </div>

        <div>
          <span className="text-[11px] font-bold text-app-primary uppercase tracking-widest block mb-0.5 font-mono">
            {activeStage.title}
          </span>
          <h2 className="text-sm md:text-base font-bold text-app-text leading-snug">
            {activeStage.headline}
          </h2>
          <p className="text-xs text-app-text-secondary leading-relaxed mt-1.5 font-normal">
            {activeStage.desc}
          </p>
        </div>

        {/* Stepper Progress Indicator */}
        <div className="flex items-center space-x-1.5 pt-1">
          {STORY_STAGES.map((s, idx) => (
            <button
              key={s.step}
              onClick={() => {
                setIsAutoPlay(false);
                setCurrentStep(idx);
              }}
              className={`h-1.5 flex-1 rounded-full transition ${
                currentStep === idx
                  ? 'bg-app-primary shadow-sm ring-1 ring-app-primary'
                  : 'bg-slate-200 hover:bg-slate-300'
              }`}
              title={s.title}
            />
          ))}
        </div>
      </div>

      {/* Floating 3D Viewport Controls (Bottom Center) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-white/95 backdrop-blur-md border border-app-border rounded-full px-4 py-2 shadow-lg flex items-center space-x-3 text-xs font-mono text-app-text">
        <button
          onClick={() => setIsAutoPlay(!isAutoPlay)}
          className="p-1.5 rounded-full hover:bg-slate-100 text-app-text transition"
          title={isAutoPlay ? 'Pause Auto-Play' : 'Resume Auto-Play'}
        >
          {isAutoPlay ? <Pause className="w-3.5 h-3.5 text-app-high" /> : <Play className="w-3.5 h-3.5 text-app-primary" />}
        </button>

        <span className="text-slate-300">|</span>

        {/* Previous / Next Steps */}
        <button
          onClick={() => {
            setIsAutoPlay(false);
            setCurrentStep((prev) => (prev > 0 ? prev - 1 : STORY_STAGES.length - 1));
          }}
          className="px-2 py-0.5 rounded hover:bg-slate-100 text-app-text transition text-[11px]"
        >
          Prev
        </button>
        <span className="text-app-primary font-semibold text-[11px]">
          {currentStep + 1} / {STORY_STAGES.length}
        </span>
        <button
          onClick={() => {
            setIsAutoPlay(false);
            setCurrentStep((prev) => (prev + 1) % STORY_STAGES.length);
          }}
          className="px-2 py-0.5 rounded hover:bg-slate-100 text-app-text transition text-[11px]"
        >
          Next
        </button>

        <span className="text-slate-300">|</span>

        {/* 2D / 3D Accessibility Toggle */}
        <button
          onClick={() => setIs2DMode(!is2DMode)}
          className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-[11px] text-app-text font-medium transition"
          title="Toggle 2D Accessible Mode"
        >
          <Eye className="w-3 h-3 text-app-primary" />
          <span>{is2DMode ? '3D View' : '2D Mode'}</span>
        </button>
      </div>

      {/* Orbit Hint */}
      <div className="absolute bottom-6 right-6 hidden md:block z-20 text-[10px] font-mono text-app-text-secondary bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded border border-app-border shadow-sm">
        Left-click + drag to orbit • Scroll to zoom
      </div>
    </div>
  );
};

