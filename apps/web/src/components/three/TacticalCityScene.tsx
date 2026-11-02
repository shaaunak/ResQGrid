import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { TACTICAL_PALETTE } from './coords';

interface CityProps {
  showRadar?: boolean;
  waterLevel?: number; // for flood simulations
}

// Deterministic pseudo-random number generator for reproducible procedural city
function pseudoRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

export const TacticalCityScene: React.FC<CityProps> = ({
  showRadar = true,
  waterLevel = 0,
}) => {
  const radarRef = useRef<THREE.Mesh>(null);
  const waterRef = useRef<THREE.Mesh>(null);
  const trafficRef = useRef<THREE.Points>(null);

  // Generate procedural buildings across Mumbai sectors
  const buildings = useMemo(() => {
    const list: Array<{
      pos: [number, number, number];
      size: [number, number, number];
      color: string;
      hasAntenna: boolean;
    }> = [];

    let seed = 42;
    const sectors = [
      // South Mumbai / Colaba / Fort (mid-high density)
      { cx: -15, cz: 25, count: 25, radius: 10, maxH: 6 },
      // Lower Parel / Dadar commercial towers (high skyscrapers)
      { cx: -5, cz: 12, count: 40, radius: 12, maxH: 12 },
      // Dharavi / Sion (dense low-mid rise)
      { cx: -2, cz: 3, count: 35, radius: 8, maxH: 4 },
      // BKC / Kurla (commercial blocks & low-lying)
      { cx: 6, cz: -4, count: 30, radius: 10, maxH: 7 },
      // Bandra West (coastal mid-rise & towers)
      { cx: -9, cz: -2, count: 30, radius: 9, maxH: 8 },
      // Andheri East / West (sprawling mid-rise)
      { cx: 2, cz: -18, count: 35, radius: 11, maxH: 9 },
    ];

    sectors.forEach((sec) => {
      for (let i = 0; i < sec.count; i++) {
        const angle = pseudoRandom(seed++) * Math.PI * 2;
        const dist = Math.sqrt(pseudoRandom(seed++)) * sec.radius;
        const bx = sec.cx + Math.cos(angle) * dist;
        const bz = sec.cz + Math.sin(angle) * dist;

        const w = 0.8 + pseudoRandom(seed++) * 1.4;
        const d = 0.8 + pseudoRandom(seed++) * 1.4;
        const h = 1.0 + pseudoRandom(seed++) * sec.maxH;

        // Subtle color variations (tactical midnight navy to slate)
        const lit = pseudoRandom(seed++) > 0.45;
        const color = lit ? TACTICAL_PALETTE.buildingLit : TACTICAL_PALETTE.building;
        const hasAntenna = h > 7.0 && pseudoRandom(seed++) > 0.5;

        list.push({
          pos: [bx, h / 2, bz],
          size: [w, h, d],
          color,
          hasAntenna,
        });
      }
    });

    return list;
  }, []);

  // Traffic particles along major transit arteries
  const trafficParticles = useMemo(() => {
    const count = 120;
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);

    // Major transit corridors: Western Express Highway (z-axis), Bandra-Worli Sea Link
    for (let i = 0; i < count; i++) {
      const t = (i / count) * 60 - 30;
      positions[i * 3] = -7 + (Math.sin(t * 0.1) * 3); // x
      positions[i * 3 + 1] = 0.25; // y
      positions[i * 3 + 2] = t; // z
      speeds[i] = 0.08 + (i % 3) * 0.04;
    }
    return { positions, speeds, count };
  }, []);

  // Animation frame
  useFrame((state, delta) => {
    // 1. Radar scan sweep expansion
    if (radarRef.current) {
      const s = 1 + ((state.clock.getElapsedTime() * 0.4) % 1) * 35;
      radarRef.current.scale.set(s, 1, s);
      const mat = radarRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = Math.max(0, 0.45 - (s / 35) * 0.45);
      }
    }

    // 2. Water surface breathing
    if (waterRef.current) {
      waterRef.current.position.y = (waterLevel || 0) + Math.sin(state.clock.getElapsedTime() * 1.5) * 0.06;
    }

    // 3. Traffic light stream animation
    if (trafficRef.current) {
      const geo = trafficRef.current.geometry;
      const posAttr = geo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < trafficParticles.count; i++) {
        let z = posAttr.getZ(i);
        z += trafficParticles.speeds[i] * (delta * 60);
        if (z > 30) z = -30;
        posAttr.setZ(i, z);
      }
      posAttr.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* 1. Tactical Ground Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial
          color={TACTICAL_PALETTE.navy}
          roughness={0.95}
          metalness={0.05}
        />
      </mesh>

      {/* Grid Overlay */}
      <gridHelper args={[100, 50, '#CBD5E1', '#E2E8F0']} position={[0, 0.02, 0]} />

      {/* 2. Coastline / Arabian Sea Water Plane (Western Margin) */}
      <mesh
        ref={waterRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[-28, 0.08 + waterLevel, 0]}
      >
        <planeGeometry args={[35, 110]} />
        <meshStandardMaterial
          color={TACTICAL_PALETTE.water}
          emissive="#0284C7"
          roughness={0.1}
          metalness={0.3}
          transparent
          opacity={0.75}
        />
      </mesh>

      {/* Mithi River Inundation Channel (Winding through Kurla/BKC) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1, 0.06 + waterLevel * 0.8, -3]}>
        <planeGeometry args={[6, 32]} />
        <meshStandardMaterial
          color={TACTICAL_PALETTE.waterDeep}
          emissive="#0369A1"
          roughness={0.15}
          metalness={0.4}
          transparent
          opacity={0.82}
        />
      </mesh>

      {/* 3. Major Expressways & Bandra-Worli Sea Link Curve */}
      {/* Western Express Highway */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-7, 0.08, 0]}>
        <planeGeometry args={[2.2, 70]} />
        <meshStandardMaterial color={TACTICAL_PALETTE.road} roughness={0.8} />
      </mesh>
      {/* Bandra-Worli Sea Link Highway Viaduct */}
      <mesh rotation={[-Math.PI / 2, 0, -0.35]} position={[-14, 0.2, 8]}>
        <planeGeometry args={[1.8, 24]} />
        <meshStandardMaterial color="#64748B" roughness={0.7} />
      </mesh>

      {/* 4. Animated Highway Traffic Lights */}
      <points ref={trafficRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[trafficParticles.positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.25}
          color="#D77A34"
          transparent
          opacity={0.9}
        />
      </points>

      {/* 5. Procedural Buildings Mesh Group */}
      <group>
        {buildings.map((b, idx) => (
          <group key={idx} position={b.pos}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={b.size} />
              <meshStandardMaterial
                color={b.color}
                roughness={0.75}
                metalness={0.1}
              />
            </mesh>
            {/* Rooftop Beacons on tall skyscrapers */}
            {b.hasAntenna && (
              <mesh position={[0, b.size[1] / 2 + 0.3, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 0.6, 6]} />
                <meshBasicMaterial color="#C84343" />
              </mesh>
            )}
          </group>
        ))}
      </group>

      {/* 6. Expanding Radar Sensor Ring */}
      {showRadar && (
        <mesh ref={radarRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.15, 0]}>
          <ringGeometry args={[0.9, 1.05, 64]} />
          <meshBasicMaterial
            color={TACTICAL_PALETTE.teal}
            transparent
            opacity={0.45}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Coastal Retaining Walls / Promenades */}
      <mesh position={[-11, 0.25, 0]}>
        <boxGeometry args={[0.4, 0.5, 60]} />
        <meshStandardMaterial color="#94A3B8" roughness={0.7} />
      </mesh>
    </group>
  );
};

