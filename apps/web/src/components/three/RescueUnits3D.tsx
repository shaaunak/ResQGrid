import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { ResponseTeam, TeamType } from '../../types';
import { geoTo3D, TACTICAL_PALETTE } from './coords';

interface UnitsProps {
  teams: ResponseTeam[];
  onSelectTeam?: (team: ResponseTeam) => void;
}

export const RescueUnits3D: React.FC<UnitsProps> = ({ teams, onSelectTeam }) => {
  return (
    <group>
      {teams.map((team) => (
        <SingleRescueUnit
          key={team.id}
          team={team}
          onClick={() => onSelectTeam && onSelectTeam(team)}
        />
      ))}
    </group>
  );
};

const SingleRescueUnit: React.FC<{
  team: ResponseTeam;
  onClick: () => void;
}> = ({ team, onClick }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [x, y, z] = geoTo3D(team.current_latitude, team.current_longitude, 0.35);

  const isWater = team.team_type === 'WATER_RESCUE';
  const isMedical = team.team_type === 'MEDICAL';

  const baseColor =
    team.status === 'AVAILABLE'
      ? TACTICAL_PALETTE.teal
      : team.status === 'DISPATCHED'
      ? '#8b5cf6'
      : '#64748b';

  useFrame((state) => {
    if (groupRef.current) {
      // Subtle hovering vibration or gentle floating motion
      const t = state.clock.getElapsedTime();
      if (isWater) {
        groupRef.current.position.y = 0.25 + Math.sin(t * 2 + x) * 0.05;
        groupRef.current.rotation.z = Math.sin(t * 1.5) * 0.04;
      } else {
        groupRef.current.position.y = 0.35;
      }
    }
  });

  return (
    <group
      ref={groupRef}
      position={[x, y, z]}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      {/* 1. Tactical Chassis / Hull */}
      {isWater ? (
        // Rescue Boat Shape
        <mesh position={[0, 0, 0]}>
          <coneGeometry args={[0.35, 0.9, 4]} />
          <meshStandardMaterial
            color="#0ea5e9"
            roughness={0.3}
            metalness={0.7}
          />
        </mesh>
      ) : isMedical ? (
        // Rapid Medical Ambulance
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[0.6, 0.4, 0.9]} />
          <meshStandardMaterial
            color="#ffffff"
            roughness={0.2}
            metalness={0.5}
          />
        </mesh>
      ) : (
        // Tactical Heavy Evacuation Transporter
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[0.7, 0.45, 1.1]} />
          <meshStandardMaterial
            color={baseColor}
            roughness={0.4}
            metalness={0.6}
          />
        </mesh>
      )}

      {/* 2. Top Beacon Light */}
      <mesh position={[0, 0.45, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color={team.status === 'DISPATCHED' ? '#c084fc' : '#38bdf8'} />
      </mesh>

      {/* 3. Base Ground Halo */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
        <ringGeometry args={[0.5, 0.65, 24]} />
        <meshBasicMaterial
          color={baseColor}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 4. Label Overlay */}
      <Html
        position={[0, 1.0, 0]}
        center
        distanceFactor={24}
        className="pointer-events-none select-none"
      >
        <div className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-white/95 border border-app-border text-app-text whitespace-nowrap shadow-sm flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-app-primary" />
          <span className="font-semibold">{team.name.split(' ')[0]}</span>
          <span className="text-app-text-secondary">[{team.status}]</span>
        </div>
      </Html>
    </group>
  );
};
