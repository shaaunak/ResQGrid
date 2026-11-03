import React, { useState } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { geoTo3D } from './coords';
import { Incident, ResponseTeam, Depot } from '../../types';
import { AlertCircle, AlertTriangle, Info, CheckCircle2, Truck, Box, Shield } from 'lucide-react';

interface OperationalLayers3DProps {
  incidents: Incident[];
  teams: ResponseTeam[];
  depots: Depot[];
  selectedIncident: Incident | null;
  onSelectIncident: (inc: Incident) => void;
  showLabels?: boolean;
}

export const OperationalLayers3D: React.FC<OperationalLayers3DProps> = ({
  incidents,
  teams,
  depots,
  selectedIncident,
  onSelectIncident,
  showLabels = true,
}) => {
  const [hoveredInc, setHoveredInc] = useState<string | null>(null);

  // Requirement: Show labels only for top 8 incidents by priority plus the selected one.
  // Others show labels on hover.
  const top8IncidentIds = React.useMemo(() => {
    const sorted = [...incidents].sort((a, b) => b.priority_score - a.priority_score);
    return new Set(sorted.slice(0, 8).map((i) => i.id));
  }, [incidents]);

  return (
    <group>
      {/* 1. Incident Beacons: Pulsing Ring + Vertical Pillar Sized by Priority */}
      {incidents.map((inc) => {
        const [x, , z] = geoTo3D(inc.latitude, inc.longitude, 0);
        const isSelected = selectedIncident?.id === inc.id;
        const isHovered = hoveredInc === inc.id;
        const shouldShowLabel =
          showLabels && (top8IncidentIds.has(inc.id) || isSelected || isHovered);

        // Pillar height proportional to priority score (0 - 100 -> 1.5 - 6m)
        const pillarHeight = 1.2 + (inc.priority_score / 100) * 4.5;
        const color =
          inc.severity === 'CRITICAL'
            ? '#C8201B'
            : inc.severity === 'HIGH'
            ? '#E27D14'
            : inc.severity === 'MEDIUM'
            ? '#C9A100'
            : '#2E7D5B';

        return (
          <group
            key={inc.id}
            position={[x, 0, z]}
            onClick={(e) => {
              e.stopPropagation();
              onSelectIncident(inc);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveredInc(inc.id);
            }}
            onPointerOut={() => setHoveredInc(null)}
          >
            {/* Base Pulsing Disc */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
              <ringGeometry args={[0.3, isSelected ? 0.9 : 0.6, 32]} />
              <meshBasicMaterial color={color} transparent opacity={0.7} side={THREE.DoubleSide} />
            </mesh>

            {/* Vertical Beacon Pillar */}
            <mesh position={[0, pillarHeight / 2, 0]}>
              <cylinderGeometry args={[0.08, 0.12, pillarHeight, 16]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={isSelected ? 0.9 : 0.4}
                roughness={0.2}
              />
            </mesh>

            {/* Glowing Beacon Tip */}
            <mesh position={[0, pillarHeight, 0]}>
              <sphereGeometry args={[isSelected ? 0.28 : 0.18, 16, 16]} />
              <meshBasicMaterial color={color} />
            </mesh>

            {/* Solid 13px+ Label via Html with collision and distance hiding */}
            {shouldShowLabel && (
              <Html
                position={[0, pillarHeight + 0.4, 0]}
                center
                distanceFactor={18}
                occlude
                zIndexRange={[100, 0]}
                style={{
                  pointerEvents: 'none',
                  transition: 'opacity 150ms ease-out, transform 150ms ease-out',
                }}
              >
                <div
                  className={`px-2.5 py-1 rounded shadow-md border font-sans text-xs flex items-center space-x-1.5 whitespace-nowrap cursor-pointer pointer-events-auto select-none ${
                    isSelected
                      ? 'bg-rq-navy text-white border-white ring-2 ring-blue-400'
                      : 'bg-white text-slate-900 border-slate-300'
                  }`}
                  onClick={() => onSelectIncident(inc)}
                >
                  <span className="font-mono font-bold text-xs">{inc.tracking_id}</span>
                  <span className="text-xs font-medium truncate max-w-[120px]">
                    {inc.title.split(' ')[0]} {inc.title.split(' ')[1]}
                  </span>
                  <span className="font-mono text-xs px-1 rounded bg-black/10">
                    {inc.priority_score.toFixed(0)}
                  </span>
                </div>

                {/* Hover Tooltip Card */}
                {isHovered && (
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-52 p-3 bg-white text-slate-900 rounded-card shadow-floating border border-slate-200 text-xs space-y-1 z-50">
                    <div className="font-semibold text-xs truncate">{inc.title}</div>
                    <div className="text-xs text-slate-500 leading-snug">{inc.address}</div>
                    <div className="flex justify-between font-mono text-xs pt-1 border-t border-slate-100">
                      <span>Affected: {inc.affected_people}</span>
                      <span className="font-bold text-rq-navy">Score: {inc.priority_score.toFixed(0)}</span>
                    </div>
                  </div>
                )}
              </Html>
            )}
          </group>
        );
      })}

      {/* 2. Rescue Squad Units with Moving Markers */}
      {teams.map((team) => {
        const [x, , z] = geoTo3D(team.current_latitude, team.current_longitude, 0.2);
        return (
          <group key={team.id} position={[x, 0.2, z]}>
            <mesh position={[0, 0.15, 0]}>
              <boxGeometry args={[0.35, 0.2, 0.5]} />
              <meshStandardMaterial color="#14284B" roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.3, 0.05]}>
              <boxGeometry args={[0.28, 0.16, 0.24]} />
              <meshStandardMaterial color="#38BDF8" roughness={0.1} />
            </mesh>
            {/* Blinking roof emergency beacon */}
            <mesh position={[0, 0.42, 0.05]}>
              <sphereGeometry args={[0.07, 8, 8]} />
              <meshBasicMaterial color="#E4572E" />
            </mesh>

            {showLabels && (
              <Html position={[0, 0.7, 0]} center distanceFactor={22}>
                <div className="px-2 py-0.5 rounded bg-rq-navy text-white text-xs font-sans font-medium border border-blue-400 whitespace-nowrap shadow-sm">
                  {team.name.split(' ')[0]} Rescue
                </div>
              </Html>
            )}
          </group>
        );
      })}

      {/* 3. Relief Depots with Stock Ring */}
      {depots.map((depot) => {
        const [x, , z] = geoTo3D(depot.latitude, depot.longitude, 0.1);
        return (
          <group key={depot.id} position={[x, 0.1, z]}>
            <mesh position={[0, 0.25, 0]}>
              <cylinderGeometry args={[0.4, 0.4, 0.5, 6]} />
              <meshStandardMaterial color="#2E7D5B" roughness={0.5} />
            </mesh>
            {/* Outer Stock Ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
              <ringGeometry args={[0.6, 0.8, 32]} />
              <meshBasicMaterial color="#2E7D5B" transparent opacity={0.5} side={THREE.DoubleSide} />
            </mesh>

            {showLabels && (
              <Html position={[0, 0.85, 0]} center distanceFactor={20}>
                <div className="px-2 py-0.5 rounded bg-emerald-800 text-white text-xs font-sans font-semibold border border-emerald-400 whitespace-nowrap shadow-sm">
                  {depot.name.split(' ')[0]} Hub
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
};

