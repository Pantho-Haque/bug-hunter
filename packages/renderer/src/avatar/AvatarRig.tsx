import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  BufferGeometry,
  Float32BufferAttribute,
  CatmullRomCurve3,
  TubeGeometry,
  Vector3,
} from 'three';
import type { Group } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { surfaceTexture } from '../world/surfaceTexture';

import { type QualityTier } from '../quality/qualityTier';
import {
  type AvatarMovementState,
  type AvatarPresentation,
  avatarTheme,
} from './avatarPresentation';

export interface AvatarRigProps {
  readonly isMoving: boolean;
  readonly movementState: AvatarMovementState;
  readonly presentation: AvatarPresentation;
  readonly reducedEffects: boolean;
  readonly quality?: QualityTier;
}

export function AvatarRig({
  isMoving,
  movementState,
  presentation,
  reducedEffects,
  quality,
}: AvatarRigProps) {
  const leftUpperArm = useRef<Group>(null);
  const rightUpperArm = useRef<Group>(null);
  const leftForeArm = useRef<Group>(null);
  const rightForeArm = useRef<Group>(null);
  const leftThigh = useRef<Group>(null);
  const rightThigh = useRef<Group>(null);
  const leftShin = useRef<Group>(null);
  const rightShin = useRef<Group>(null);
  const leftPigtail = useRef<Group>(null);
  const rightPigtail = useRef<Group>(null);
  const reducedEffectsRef = useRef(reducedEffects);
  const celebrationUntilRef = useRef(0);

  useEffect(() => {
    reducedEffectsRef.current = reducedEffects;
  }, [reducedEffects]);

  useEffect(() => {
    if (reducedEffects) return;
    if (movementState === 'collecting' || movementState === 'interacting') {
      celebrationUntilRef.current = performance.now() + 600;
    }
  }, [movementState, reducedEffects]);

  useFrame(() => {
    if (reducedEffectsRef.current) return;
    const time = performance.now() / 1000;
    const swing = isMoving ? Math.sin(time * 9) * 0.8 : 0;
    const celebrate =
      performance.now() < celebrationUntilRef.current ? Math.sin(time * 16) * 0.7 : 0;
    const armSwing =
      movementState === 'turning-left' || movementState === 'turning-right'
        ? Math.sin(time * 12) * 0.45
        : swing;
    const elbowSwing = isMoving ? Math.sin(time * 9 + Math.PI / 2) * 0.35 : 0;
    const kneeSwing = isMoving ? Math.sin(time * 9 + Math.PI / 2) * 0.45 : 0;
    const pigtailSway = Math.sin(time * 4) * 0.18;

    if (leftUpperArm.current) leftUpperArm.current.rotation.x = armSwing;
    if (rightUpperArm.current) rightUpperArm.current.rotation.x = -armSwing + celebrate;
    if (leftForeArm.current) leftForeArm.current.rotation.x = -0.15 + elbowSwing;
    if (rightForeArm.current)
      rightForeArm.current.rotation.x = -0.15 + elbowSwing - celebrate * 0.6;
    if (leftThigh.current) leftThigh.current.rotation.x = -swing;
    if (rightThigh.current) rightThigh.current.rotation.x = swing;
    if (leftShin.current) leftShin.current.rotation.x = -0.2 + kneeSwing;
    if (rightShin.current) rightShin.current.rotation.x = -0.2 + kneeSwing;
    if (leftPigtail.current) leftPigtail.current.rotation.x = pigtailSway;
    if (rightPigtail.current) rightPigtail.current.rotation.x = -pigtailSway;
  });

  const theme = avatarTheme(presentation);
  const segments = quality === 'low' ? 6 : quality === 'medium' ? 12 : 20;
  const resources = useMemo(() => {
    const head = profileMesh(
      [
        [2.13, 0.07, 0.075, 0.015],
        [2.16, 0.115, 0.12, 0.025],
        [2.23, 0.17, 0.15, 0],
        [2.32, 0.2, 0.18, -0.01],
        [2.42, 0.195, 0.172, -0.015],
        [2.52, 0.185, 0.175, -0.025],
        [2.61, 0.14, 0.14, -0.035],
        [2.65, 0.04, 0.06, -0.035],
      ],
      segments,
      true,
    );
    const torso = profileMesh(
      [
        [1.33, 0.22, 0.14, 0],
        [1.43, 0.245, 0.15, 0],
        [1.6, 0.25, 0.15, 0],
        [1.79, 0.31, 0.18, 0],
        [1.94, 0.35, 0.155, -0.01],
        [2.0, 0.27, 0.125, 0],
        [2.04, 0.105, 0.095, 0],
      ],
      segments,
    );
    const pelvis = profileMesh(
      [
        [1.05, 0.21, 0.135, 0],
        [1.17, 0.275, 0.16, 0],
        [1.32, 0.235, 0.14, 0],
      ],
      segments,
    );
    const cap = profileMesh(
      [
        [2.44, 0.2, 0.18, -0.035],
        [2.53, 0.195, 0.184, -0.03],
        [2.63, 0.14, 0.14, -0.035],
        [2.68, 0.005, 0.005, -0.035],
      ],
      segments,
    );
    const strands: BufferGeometry[] = [];
    const count = quality === 'low' ? 10 : 22;
    for (let i = 0; i < count; i += 1) {
      const angle = (i / (count - 1)) * Math.PI;
      const x = Math.cos(angle) * 0.18;
      const z = -Math.sin(angle) * 0.18 - 0.035;
      const long = theme.hairStyle === 'long';
      const curve = new CatmullRomCurve3([
        new Vector3(x * 0.25, 2.655, z * 0.5),
        new Vector3(x, 2.52, z),
        new Vector3(x * 1.04, 2.32, z - 0.025),
        new Vector3(
          x * (long ? 1.2 : 0.95),
          long ? 1.91 + 0.045 * Math.sin(i) : 2.29,
          z - (long ? 0.08 : 0),
        ),
      ]);
      const strand = new TubeGeometry(
        curve,
        quality === 'low' ? 5 : 9,
        long ? 0.032 : 0.018,
        4,
        false,
      );
      strands.push(strand);
    }
    const hair = mergeGeometries(strands)!;
    strands.forEach((g) => g.dispose());
    return {
      head,
      torso,
      pelvis,
      cap,
      hair,
      fabric: surfaceTexture('fabric'),
      hairMap: surfaceTexture('hair'),
    };
  }, [segments, quality, theme.hairStyle]);
  useEffect(
    () => () => Object.values(resources).forEach((resource) => resource.dispose()),
    [resources],
  );
  const facialSegments = quality === 'low' ? 6 : 12;
  const facialRows = quality === 'low' ? 4 : 8;
  const skin = <meshPhongMaterial color={theme.skinColor} shininess={12} specular="#362a25" />;
  const cloth = (
    <meshPhongMaterial
      color={theme.shirtColor}
      map={resources.fabric}
      shininess={4}
      specular="#161616"
    />
  );
  const pants = (
    <meshPhongMaterial
      color={theme.pantsColor}
      map={resources.fabric}
      shininess={3}
      specular="#111111"
    />
  );
  const hair = (
    <meshPhongMaterial
      color={theme.hairColor}
      map={resources.hairMap}
      shininess={16}
      specular="#43382c"
    />
  );
  return (
    <group name="human-avatar">
      <mesh castShadow geometry={resources.head}>
        {skin}
      </mesh>
      <mesh castShadow geometry={resources.torso}>
        {cloth}
      </mesh>
      <mesh castShadow geometry={resources.pelvis}>
        {pants}
      </mesh>
      <mesh castShadow geometry={resources.cap}>
        {hair}
      </mesh>
      <mesh castShadow geometry={resources.hair}>
        {hair}
      </mesh>
      <mesh position={[0, 2.09, 0]}>
        <cylinderGeometry args={[0.083, 0.1, 0.18, segments]} />
        {skin}
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * 0.2, 2.34, -0.008]} scale={[0.5, 1, 0.65]}>
            <sphereGeometry args={[0.054, facialSegments, facialRows]} />
            {skin}
          </mesh>
          <mesh position={[side * 0.208, 2.34, 0.006]} scale={[0.3, 1, 0.5]}>
            <sphereGeometry args={[0.031, facialSegments, facialRows]} />
            <meshPhongMaterial color="#a97561" shininess={6} />
          </mesh>
          <mesh position={[side * 0.083, 2.392, 0.142]} scale={[1.4, 0.52, 0.35]}>
            <sphereGeometry args={[0.035, facialSegments, facialRows]} />
            <meshPhongMaterial color="#e0d6c5" shininess={30} />
          </mesh>
          <mesh position={[side * 0.083, 2.393, 0.155]} scale={[1, 1, 0.3]}>
            <sphereGeometry args={[0.014, facialSegments, facialRows]} />
            <meshPhongMaterial color="#423a28" shininess={65} />
          </mesh>
          <mesh position={[side * 0.083, 2.393, 0.16]} scale={[1, 1, 0.3]}>
            <sphereGeometry args={[0.006, facialSegments, facialRows]} />
            <meshPhongMaterial color="#111419" shininess={90} />
          </mesh>
          <mesh
            position={[side * 0.083, 2.435, 0.157]}
            rotation={[0, 0, side * -0.08]}
            scale={[1, 0.15, 0.4]}
          >
            <sphereGeometry args={[0.044, facialSegments, facialRows]} />
            {hair}
          </mesh>
        </group>
      ))}
      <mesh position={[0, 2.355, 0.17]} scale={[0.5, 1.3, 0.75]}>
        <sphereGeometry args={[0.038, facialSegments, facialRows]} />
        {skin}
      </mesh>
      <mesh position={[0, 2.317, 0.183]} scale={[1, 0.65, 0.85]}>
        <sphereGeometry args={[0.025, facialSegments, facialRows]} />
        {skin}
      </mesh>
      <mesh position={[0, 2.265, 0.149]} scale={[1, 0.16, 0.3]}>
        <sphereGeometry args={[0.055, facialSegments, facialRows]} />
        <meshPhongMaterial color="#986257" shininess={8} />
      </mesh>
      <mesh position={[0, 2.0, 0.112]} scale={[1, 0.45, 0.4]}>
        <torusGeometry args={[0.1, 0.016, 4, 12, Math.PI]} />
        {cloth}
      </mesh>
      {[-1, 1].map((side) => (
        <group
          key={side}
          ref={side === -1 ? leftUpperArm : rightUpperArm}
          position={[side * 0.35, 1.92, 0]}
          rotation={[0, 0, side * 0.065]}
        >
          <mesh position={[0, -0.19, 0]} scale={[1, 1, 0.95]}>
            <capsuleGeometry args={[0.105, 0.23, quality === 'low' ? 2 : 4, segments]} />
            {cloth}
          </mesh>
          <group ref={side === -1 ? leftForeArm : rightForeArm} position={[0, -0.4, 0]}>
            <mesh position={[0, -0.16, 0]}>
              <cylinderGeometry args={[0.087, 0.057, 0.34, segments]} />
              {skin}
            </mesh>
            <mesh position={[0, -0.385, 0.015]} scale={[0.75, 1.35, 0.45]}>
              <sphereGeometry args={[0.075, facialSegments, facialRows]} />
              {skin}
            </mesh>
            <mesh position={[-side * 0.052, -0.38, 0.04]} rotation={[0, 0, side * -0.4]}>
              <capsuleGeometry args={[0.02, 0.045, 2, 6]} />
              {skin}
            </mesh>
          </group>
        </group>
      ))}
      {[-1, 1].map((side) => (
        <group
          key={side}
          ref={side === -1 ? leftThigh : rightThigh}
          position={[side * 0.145, 1.12, 0]}
        >
          <mesh position={[0, -0.245, 0]}>
            <cylinderGeometry args={[0.135, 0.1, 0.5, segments]} />
            {pants}
          </mesh>
          <group ref={side === -1 ? leftShin : rightShin} position={[0, -0.49, 0]}>
            <mesh position={[0, -0.245, 0]}>
              <cylinderGeometry args={[0.103, 0.073, 0.49, segments]} />
              {pants}
            </mesh>
            <mesh position={[0, -0.51, 0.064]} scale={[0.85, 0.47, 1.55]}>
              <sphereGeometry args={[0.13, facialSegments, facialRows]} />
              <meshPhongMaterial color="#3c3936" shininess={12} />
            </mesh>
            <mesh position={[0, -0.56, 0.064]} scale={[0.85, 0.13, 1.55]}>
              <sphereGeometry args={[0.13, facialSegments, facialRows]} />
              <meshPhongMaterial color="#242425" shininess={3} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}

// Elliptical cross-sections define a continuous silhouette; facial offsets form
// the cheekbones, eye sockets and jaw instead of stacking balls on the face.
function profileMesh(
  rings: readonly (readonly [number, number, number, number])[],
  segments: number,
  face = false,
) {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  rings.forEach(([y, rx, rz, offset], row) => {
    for (let i = 0; i <= segments; i += 1) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.sin(angle) * rx;
      let z = Math.cos(angle) * rz + offset;
      if (face && z > 0) {
        const socket =
          Math.exp(-Math.pow((y - 2.4) / 0.05, 2)) *
          Math.exp(-Math.pow((Math.abs(x) - 0.085) / 0.04, 2));
        z -= socket * 0.018;
      }
      positions.push(x, y, z);
      uvs.push(i / segments, row / (rings.length - 1));
      if (row < rings.length - 1 && i < segments) {
        const a = row * (segments + 1) + i;
        indices.push(a, a + 1, a + segments + 1, a + 1, a + segments + 2, a + segments + 1);
      }
    }
  });
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
