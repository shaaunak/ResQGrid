import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface DynamicFloodPlaneProps {
  waterLevel: number; // 0 to 3 meters (mapped to 3D Y elevation)
  isNight?: boolean;
}

export const DynamicFloodPlane: React.FC<DynamicFloodPlaneProps> = ({
  waterLevel,
  isNight = false,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Custom Shader Material with animated ripples, depth tint & edge foam
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uWaterLevel: { value: waterLevel },
        uDeepColor: { value: new THREE.Color(isNight ? '#0C2D48' : '#0284C7') },
        uShallowColor: { value: new THREE.Color(isNight ? '#145DA0' : '#38BDF8') },
        uFoamColor: { value: new THREE.Color(isNight ? '#B1D4E0' : '#FFFFFF') },
      },
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        varying vec3 vWorldPosition;

        void main() {
          vUv = uv;
          vec3 pos = position;
          // Animated ripples
          float ripple = sin(pos.x * 2.0 + uTime * 1.5) * cos(pos.y * 2.0 + uTime * 1.2) * 0.04;
          pos.z += ripple;

          vec4 worldPos = modelMatrix * vec4(pos, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uDeepColor;
        uniform vec3 uShallowColor;
        uniform vec3 uFoamColor;
        varying vec2 vUv;
        varying vec3 vWorldPosition;

        void main() {
          // Normal ripple noise
          float n = sin(vUv.x * 40.0 + uTime * 2.0) * cos(vUv.y * 40.0 + uTime * 1.8);
          float depthFactor = smoothstep(-1.0, 1.5, vWorldPosition.y);
          
          vec3 waterCol = mix(uDeepColor, uShallowColor, depthFactor);
          // Foam at edges / wave crests
          if (n > 0.65) {
            waterCol = mix(waterCol, uFoamColor, 0.45);
          }

          gl_FragColor = vec4(waterCol, 0.72);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }, [isNight]);

  useFrame((state) => {
    if (shaderMaterial) {
      shaderMaterial.uniforms.uTime.value = state.clock.getElapsedTime();
      // Smoothly animate water level elevation
      const targetY = -0.3 + waterLevel * 0.4;
      if (meshRef.current) {
        meshRef.current.position.y = THREE.MathUtils.lerp(
          meshRef.current.position.y,
          targetY,
          0.05
        );
      }
    }
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.3, 0]}
      receiveShadow
    >
      <planeGeometry args={[140, 140, 128, 128]} />
      <primitive object={shaderMaterial} attach="material" />
    </mesh>
  );
};

// Weather Particle System: Dynamic Rainfall
export const WeatherSystem: React.FC<{ rainIntensity: number; isNight?: boolean }> = ({
  rainIntensity = 0.5,
  isNight = false,
}) => {
  const rainRef = useRef<THREE.Points>(null);

  const [positions, count] = useMemo(() => {
    const c = Math.floor(1200 * Math.max(0.1, rainIntensity));
    const pos = new Float32Array(c * 3);
    for (let i = 0; i < c; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 80;
      pos[i * 3 + 1] = Math.random() * 35;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }
    return [pos, c];
  }, [rainIntensity]);

  useFrame((_, delta) => {
    if (!rainRef.current) return;
    const posAttr = rainRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] -= delta * 24; // fall speed
      if (arr[i * 3 + 1] < 0) {
        arr[i * 3 + 1] = 30 + Math.random() * 5;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={rainRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color={isNight ? 0x93C5FD : 0x60A5FA}
        size={0.12}
        transparent
        opacity={0.45}
        depthWrite={false}
      />
    </points>
  );
};

