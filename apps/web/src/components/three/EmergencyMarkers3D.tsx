import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Incident } from '../../types';
import { geoTo3D, TACTICAL_PALETTE } from './coords';

interface MarkersProps {
  incidents: Incident[];
  selectedIncident: Incident | null;
  onSelectIncident?: (inc: Incident) => void;
}

export const EmergencyMarkers3D: React.FC<MarkersProps> = ({
  incidents,
  selectedIncident,
  onSelectIncident,
}) => {
  return (
    <group>
      {incidents.map((inc) => (
        <SingleBeacon
          key={inc.id}
          incident={inc}
          isSelected={selectedIncident?.id === inc.id}
          onSelect={() => onSelectIncident && onSelectIncident(inc)}
        />
      ))}
    </group>
  );
};

const SingleBeacon: React.FC<{
  incident: Incident;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ incident, isSelected, onSelect }) => {
  const ringRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  const [x, y, z] = geoTo3D(incident.latitude, incident.longitude, 0.4);

  const color =
    incident.status === 'RESOLVED'
      ? TACTICAL_PALETTE.green
      : incident.severity === 'CRITICAL'
      ? TACTICAL_PALETTE.red
      : incident.severity === 'HIGH'
      ? TACTICAL_PALETTE.amber
      : '#3b82f6';

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ringRef.current) {
      const pulseSpeed = incident.severity === 'CRITICAL' ? 3.5 : 2.0;
      const scale = 1 + (Math.sin(t * pulseSpeed) + 1) * 0.45;
      ringRef.current.scale.set(scale, scale, 1);
    }
    if (coreRef.current) {
      coreRef.current.position.y = 1.2 + Math.sin(t * 2) * 0.15;
    }
  });

  return (
    <group position={[x, y, z]}>
      {/* 1. Ground Pulse Ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[0.5, 0.75, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isSelected ? 0.9 : 0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 2. Vertical Light Column / Beacon */}
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.04, 0.12, 2.4, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isSelected ? 0.85 : 0.45}
        />
      </mesh>

      {/* 3. Floating Tactical Diamond Head */}
      <mesh
        ref={coreRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <octahedronGeometry args={[isSelected ? 0.38 : 0.28]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 1.0 : 0.5}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* 4. HTML Tag Tooltip */}
      <Html
        position={[0, 2.7, 0]}
        center
        distanceFactor={22}
        className="pointer-events-none select-none"
      >
        <div
          className={`px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap transition shadow-xl border flex items-center space-x-1.5 ${
            isSelected
              ? 'bg-command-darkest border-white text-white font-bold ring-2 ring-command-teal'
              : 'bg-command-surface/90 border-command-border text-slate-200'
          }`}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span>{incident.tracking_id}</span>
          <span className="text-command-teal font-semibold">
            {incident.priority_score.toFixed(0)}pts
          </span>
        </div>
      </Html>
    </group>
  );
};
