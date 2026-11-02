import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import {
  MUMBAI_BUILDING_FOOTPRINTS,
  MITHI_RIVER_COORDINATES,
  COASTLINE_COORDINATES,
  ROAD_POLYLINES,
  getElevationAt,
} from './mumbaiGeoData';
import { geoTo3D } from './coords';

interface RealMumbaiGeometryProps {
  isNight?: boolean;
}

export const RealMumbaiGeometry: React.FC<RealMumbaiGeometryProps> = ({ isNight = false }) => {
  const windowGlowRef = useRef<THREE.InstancedMesh>(null);

  // 1. Extrude Real Building Footprints from GeoJSON data
  const buildingMeshGroup = useMemo(() => {
    const group = new THREE.Group();

    // Palette: warm light grey, varied values, lighter roofs, subtle window glow
    const dayWallMaterial = new THREE.MeshStandardMaterial({
      color: 0xEAE6DF, // warm light grey
      roughness: 0.7,
      metalness: 0.1,
    });
    const dayRoofMaterial = new THREE.MeshStandardMaterial({
      color: 0xF8F6F2, // lighter roof
      roughness: 0.6,
      metalness: 0.05,
    });

    const nightWallMaterial = new THREE.MeshStandardMaterial({
      color: 0x1E293B, // dark slate
      roughness: 0.8,
      metalness: 0.2,
    });
    const nightRoofMaterial = new THREE.MeshStandardMaterial({
      color: 0x0F172A,
      roughness: 0.7,
      metalness: 0.3,
    });

    const wallMat = isNight ? nightWallMaterial : dayWallMaterial;
    const roofMat = isNight ? nightRoofMaterial : dayRoofMaterial;

    MUMBAI_BUILDING_FOOTPRINTS.forEach((footprint) => {
      // Calculate center GPS to determine ground elevation from heightmap
      const avgLon = footprint.points.reduce((acc, p) => acc + p[0], 0) / footprint.points.length;
      const avgLat = footprint.points.reduce((acc, p) => acc + p[1], 0) / footprint.points.length;
      const elevation = getElevationAt(avgLat, avgLon);

      // Height: building:levels * 3m scaled, default 9m
      const height = (footprint.levels || 3) * 0.35;

      const shape = new THREE.Shape();
      footprint.points.forEach((pt, idx) => {
        const [x, , z] = geoTo3D(pt[1], pt[0], 0);
        if (idx === 0) shape.moveTo(x, -z);
        else shape.lineTo(x, -z);
      });
      shape.closePath();

      const extrudeSettings = {
        depth: height,
        bevelEnabled: true,
        bevelSegments: 1,
        steps: 1,
        bevelSize: 0.05,
        bevelThickness: 0.05,
      };

      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      // Rotate shape so depth is in Y axis
      geometry.rotateX(Math.PI / 2);

      const mesh = new THREE.Mesh(geometry, [wallMat, roofMat]);
      mesh.position.y = elevation;
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // Subtle edge line
      const edges = new THREE.EdgesGeometry(geometry, 25);
      const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({
          color: isNight ? 0x334155 : 0xD1C9BD,
          transparent: true,
          opacity: 0.4,
        })
      );
      mesh.add(line);

      group.add(mesh);
    });

    return group;
  }, [isNight]);

  // 2. Mithi River Channel Geometry
  const riverGeometry = useMemo(() => {
    const points = MITHI_RIVER_COORDINATES.map(([lon, lat]) => {
      const [x, , z] = geoTo3D(lat, lon, -0.15);
      return new THREE.Vector3(x, -0.15, z);
    });
    const curve = new THREE.CatmullRomCurve3(points);
    return new THREE.TubeGeometry(curve, 64, 0.45, 8, false);
  }, []);

  // 3. Arabian Sea Coastline Ribbon
  const coastGeometry = useMemo(() => {
    const points = COASTLINE_COORDINATES.map(([lon, lat]) => {
      const [x, , z] = geoTo3D(lat, lon, -0.2);
      return new THREE.Vector3(x, -0.2, z);
    });
    const curve = new THREE.CatmullRomCurve3(points);
    return new THREE.TubeGeometry(curve, 64, 0.8, 8, false);
  }, []);

  // 4. Real Road Networks Geometry (Western Express Highway, LBS Marg, etc.)
  const roadMeshes = useMemo(() => {
    return ROAD_POLYLINES.map((road, idx) => {
      const points = road.points.map(([lon, lat]) => {
        const elevation = getElevationAt(lat, lon);
        const [x, , z] = geoTo3D(lat, lon, elevation + 0.02);
        return new THREE.Vector3(x, elevation + 0.02, z);
      });
      const curve = new THREE.CatmullRomCurve3(points);
      const tube = new THREE.TubeGeometry(curve, 32, 0.12, 6, false);
      return (
        <mesh key={idx} geometry={tube} receiveShadow>
          <meshStandardMaterial
            color={isNight ? 0x334155 : 0xC7BFB2}
            roughness={0.9}
            metalness={0.1}
          />
        </mesh>
      );
    });
  }, [isNight]);

  // 5. Instanced Night Windows with Gentle Twinkle
  const nightWindowMesh = useMemo(() => {
    if (!isNight) return null;
    const count = 120;
    const geom = new THREE.BoxGeometry(0.12, 0.18, 0.04);
    const mat = new THREE.MeshBasicMaterial({ color: 0xFDE047 });
    const mesh = new THREE.InstancedMesh(geom, mat, count);

    const dummy = new THREE.Object3D();
    let idx = 0;
    MUMBAI_BUILDING_FOOTPRINTS.forEach((b) => {
      if (idx >= count) return;
      const avgLon = b.points[0][0];
      const avgLat = b.points[0][1];
      const [x, , z] = geoTo3D(avgLat, avgLon, 0.5);
      const elev = getElevationAt(avgLat, avgLon);

      for (let level = 1; level < (b.levels || 3); level += 2) {
        if (idx >= count) break;
        dummy.position.set(x + (level % 2 === 0 ? 0.3 : -0.3), elev + level * 0.35, z);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        mesh.setMatrixAt(idx++, dummy.matrix);
      }
    });

    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }, [isNight]);

  return (
    <group>
      {/* Primitive building footprints */}
      <primitive object={buildingMeshGroup} />

      {/* Mithi River Channel */}
      <mesh geometry={riverGeometry} receiveShadow>
        <meshStandardMaterial
          color={isNight ? 0x0284C7 : 0x38BDF8}
          roughness={0.2}
          metalness={0.3}
        />
      </mesh>

      {/* Coastline Ribbon */}
      <mesh geometry={coastGeometry} receiveShadow>
        <meshStandardMaterial
          color={isNight ? 0x0369A1 : 0x0EA5E9}
          roughness={0.15}
          metalness={0.4}
        />
      </mesh>

      {/* Real Road Networks */}
      {roadMeshes}

      {/* Night window glow */}
      {nightWindowMesh && <primitive object={nightWindowMesh} ref={windowGlowRef} />}
    </group>
  );
};

