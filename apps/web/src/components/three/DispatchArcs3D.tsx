import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { geoTo3D } from './coords';

interface ArcProps {
  startLat: number;
  startLon: number;
  endLat: number;
  endLon: number;
  color?: string;
  arcHeight?: number;
}

export const DispatchArc3D: React.FC<ArcProps> = ({
  startLat,
  startLon,
  endLat,
  endLon,
  color = '#137C82',
  arcHeight = 3.5,
}) => {
  const lineObject = useMemo(() => {
    const [x1, y1, z1] = geoTo3D(startLat, startLon, 0.5);
    const [x2, y2, z2] = geoTo3D(endLat, endLon, 0.5);

    const midX = (x1 + x2) / 2;
    const midZ = (z1 + z2) / 2;
    const midY = Math.max(y1, y2) + arcHeight;

    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(x1, y1, z1),
      new THREE.Vector3(midX, midY, midZ),
      new THREE.Vector3(x2, y2, z2)
    );

    const points = curve.getPoints(40);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.75,
      linewidth: 2,
    });
    return new THREE.Line(geometry, material);
  }, [startLat, startLon, endLat, endLon, color, arcHeight]);

  return <primitive object={lineObject} />;
};
