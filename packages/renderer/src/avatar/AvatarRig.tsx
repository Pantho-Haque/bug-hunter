import type { ReactNode, RefObject } from 'react';
import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';

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

  const detailed = !quality || quality !== 'low';

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
    const celebrate = performance.now() < celebrationUntilRef.current ? Math.sin(time * 16) * 0.7 : 0;
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
    if (rightForeArm.current) rightForeArm.current.rotation.x = -0.15 + elbowSwing - celebrate * 0.6;
    if (leftThigh.current) leftThigh.current.rotation.x = -swing;
    if (rightThigh.current) rightThigh.current.rotation.x = swing;
    if (leftShin.current) leftShin.current.rotation.x = -0.2 + kneeSwing;
    if (rightShin.current) rightShin.current.rotation.x = -0.2 + kneeSwing;
    if (leftPigtail.current) leftPigtail.current.rotation.x = pigtailSway;
    if (rightPigtail.current) rightPigtail.current.rotation.x = -pigtailSway;
  });

  const theme = avatarTheme(presentation);
  const flat = quality === 'low';
  const sphereSeg = detailed ? 16 : 10;
  const sphereStack = detailed ? 12 : 6;

  const skinProps = { color: theme.skinColor, flatShading: flat, shininess: 30, specular: '#5a4030' };
  const shirtProps = { color: theme.shirtColor, flatShading: flat, shininess: 40, specular: '#666' };
  const pantsProps = { color: theme.pantsColor, flatShading: flat, shininess: 30, specular: '#444' };
  const hairProps = { color: theme.hairColor, flatShading: flat, shininess: 60, specular: '#3a2a18' };
  const hairShadowProps = { color: theme.hairColor, flatShading: flat, shininess: 50, specular: '#1a1008' };
  const eyeProps = { color: '#172239', flatShading: flat, shininess: 120, specular: '#ffffff' };
  const lipProps = { color: '#b85f72', flatShading: flat, shininess: 80, specular: '#5a2a32' };
  const collarProps = { color: '#f4f7fb', flatShading: flat, shininess: 60, specular: '#aab' };
  const shoeProps = { color: '#eef3f5', flatShading: flat, shininess: 20, specular: '#888' };

  const hairSeg = detailed ? 6 : 4;
  const strandGrain = detailed ? 0.035 : 0.05;
  const strandTipRatio = 0.45;
  const sampleBezier = (
    p0: readonly [number, number, number],
    p1: readonly [number, number, number],
    p2: readonly [number, number, number],
    p3: readonly [number, number, number],
    t: number,
  ): readonly [number, number, number] => {
    const it = 1 - t;
    const b0 = it * it * it;
    const b1 = 3 * it * it * t;
    const b2 = 3 * it * t * t;
    const b3 = t * t * t;
    return [
      b0 * p0[0] + b1 * p1[0] + b2 * p2[0] + b3 * p3[0],
      b0 * p0[1] + b1 * p1[1] + b2 * p2[1] + b3 * p3[1],
      b0 * p0[2] + b1 * p1[2] + b2 * p2[2] + b3 * p3[2],
    ];
  };

  interface StrandSpec {
    readonly p0: readonly [number, number, number];
    readonly p1: readonly [number, number, number];
    readonly p2: readonly [number, number, number];
    readonly p3: readonly [number, number, number];
    readonly thickness: number;
    readonly segments?: number;
    readonly swayRef?: RefObject<Group>;
  }

  const renderStrand = (spec: StrandSpec, key: string) => {
    const segments = spec.segments ?? 6;
    const tip = spec.thickness * strandTipRatio;
    const grains: ReactNode[] = [];
    for (let i = 0; i <= segments; i += 1) {
      const t = i / segments;
      const [x, y, z] = sampleBezier(spec.p0, spec.p1, spec.p2, spec.p3, t);
      const radius = spec.thickness * (1 - t) + tip * t;
      grains.push(
        <mesh key={`${key}-${i}`} castShadow position={[x, y, z]}>
          <sphereGeometry args={[radius, hairSeg, hairSeg]} />
          <meshPhongMaterial {...hairProps} />
        </mesh>,
      );
    }
    if (!spec.swayRef) return <group key={key}>{grains}</group>;
    return (
      <group ref={spec.swayRef} key={key}>
        {grains}
      </group>
    );
  };

  return (
    <group>
      {detailed ? (
        <>
          <mesh castShadow position={[0, 2.4, 0]}>
            <sphereGeometry args={[0.34, 18, 14]} />
            <meshPhongMaterial {...skinProps} />
          </mesh>
          <mesh castShadow position={[-0.13, 2.32, 0.26]}>
            <sphereGeometry args={[0.055, 10, 8]} />
            <meshPhongMaterial {...skinProps} />
          </mesh>
          <mesh castShadow position={[0.13, 2.32, 0.26]}>
            <sphereGeometry args={[0.055, 10, 8]} />
            <meshPhongMaterial {...skinProps} />
          </mesh>
        </>
      ) : (
        <mesh castShadow position={[0, 2.4, 0]}>
          <sphereGeometry args={[0.34, sphereSeg, sphereStack]} />
          <meshPhongMaterial {...skinProps} />
        </mesh>
      )}

      <mesh castShadow position={[0, 2.55, -0.05]}>
        {theme.hairStyle === 'short' ? (
          <sphereGeometry args={[0.38, sphereSeg + 4, sphereStack + 2, 0, Math.PI * 2, 0, Math.PI / 2]} />
        ) : (
          <sphereGeometry args={[0.44, sphereSeg + 4, sphereStack + 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
        )}
        <meshPhongMaterial {...hairProps} />
      </mesh>

      {theme.hairStyle === 'short' ? (
        <>
          <mesh castShadow position={[0, 2.62, 0.18]}>
            <sphereGeometry args={[0.22, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2.2]} />
            <meshPhongMaterial {...hairProps} />
          </mesh>
          <mesh castShadow position={[-0.12, 2.7, 0.04]}>
            <sphereGeometry args={[0.09, 10, 8]} />
            <meshPhongMaterial {...hairProps} />
          </mesh>
          <mesh castShadow position={[0.1, 2.71, -0.02]}>
            <sphereGeometry args={[0.085, 10, 8]} />
            <meshPhongMaterial {...hairProps} />
          </mesh>
          <mesh castShadow position={[0, 2.74, -0.18]}>
            <sphereGeometry args={[0.1, 10, 8]} />
            <meshPhongMaterial {...hairProps} />
          </mesh>
          {Array.from({ length: detailed ? 18 : 10 }, (_, i) => {
            const angle = (i / (detailed ? 17 : 9)) * Math.PI * 0.7 + Math.PI * 0.15;
            const radius = 0.34;
            const dx = Math.sin(angle) * radius;
            const dz = -Math.abs(Math.cos(angle)) * radius * 0.85;
            const tipDx = dx * 1.05;
            const tipDz = dz - 0.04 - Math.abs(Math.sin(angle)) * 0.06;
            const tipY = 2.5 - (1 - Math.cos(angle)) * 0.18;
            return renderStrand(
              {
                p0: [dx, 2.62, dz],
                p1: [dx * 1.02, 2.56, dz - 0.02],
                p2: [tipDx, tipY + 0.05, tipDz],
                p3: [tipDx, tipY, tipDz],
                thickness: strandGrain,
                segments: 3,
              },
              `short-grains-${i}`,
            );
          })}
          {detailed ? (
            <>
              <mesh castShadow position={[-0.3, 2.5, -0.08]}>
                <sphereGeometry args={[0.07, 8, 6]} />
                <meshPhongMaterial {...hairShadowProps} />
              </mesh>
              <mesh castShadow position={[0.3, 2.5, -0.08]}>
                <sphereGeometry args={[0.07, 8, 6]} />
                <meshPhongMaterial {...hairShadowProps} />
              </mesh>
            </>
          ) : null}
        </>
      ) : (
        <>
          <mesh castShadow position={[0, 2.6, 0.2]}>
            <sphereGeometry args={[0.24, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2.4]} />
            <meshPhongMaterial {...hairProps} />
          </mesh>
          {Array.from({ length: 14 }, (_, i) => {
            const angle = (i / 14) * Math.PI - Math.PI * 0.05;
            const dx = Math.sin(angle) * 0.34;
            const dz = -Math.abs(Math.cos(angle)) * 0.32;
            const tipDx = dx * 1.45;
            const tipDz = -0.55 - i * 0.005;
            const tipY = 1.1 + i * 0.02;
            return renderStrand(
              {
                p0: [dx, 2.45, dz],
                p1: [dx * 1.1, 2.05, dz - 0.1],
                p2: [tipDx * 0.92, 1.55, tipDz * 0.85],
                p3: [tipDx, tipY, tipDz],
                thickness: strandGrain + 0.005,
                segments: detailed ? 7 : 5,
              },
              `crown-${i}`,
            );
          })}
          {Array.from({ length: detailed ? 22 : 12 }, (_, i) => {
            const dx = (i / (detailed ? 21 : 11) - 0.5) * 0.62;
            const tipDx = dx * 1.08;
            const tipY = 1.35 + Math.sin(i * 0.7) * 0.06;
            const tipDz = -0.36 - Math.sin(i * 0.5) * 0.04;
            return renderStrand(
              {
                p0: [dx * 0.95, 2.4, -0.32],
                p1: [dx, 2.1, -0.34],
                p2: [tipDx * 0.95, 1.7, tipDz * 1.05],
                p3: [tipDx, tipY, tipDz],
                thickness: strandGrain + 0.002,
                segments: detailed ? 8 : 5,
              },
              `back-${i}`,
            );
          })}
          {Array.from({ length: detailed ? 12 : 6 }, (_, i) => {
            const side = i % 2 === 0 ? -1 : 1;
            const idx = Math.floor(i / 2);
            const startDx = side * (0.28 + idx * 0.04);
            const tipDx = side * (0.34 + idx * 0.06);
            const startY = 2.35 - idx * 0.05;
            const tipY = 1.55 - idx * 0.08;
            return renderStrand(
              {
                p0: [startDx, startY, -0.05],
                p1: [side * 0.32, startY - 0.15, -0.18],
                p2: [tipDx * 1.05, tipY + 0.15, -0.32],
                p3: [tipDx, tipY, -0.34],
                thickness: strandGrain + 0.002,
                segments: detailed ? 7 : 4,
              },
              `side-${i}`,
            );
          })}
          {detailed ? (
            <>
              {Array.from({ length: 10 }, (_, i) => {
                const t = i / 9;
                const dx = (t - 0.5) * 0.5;
                return renderStrand(
                  {
                    p0: [dx * 0.5, 2.62, 0.18],
                    p1: [dx * 0.7, 2.52, 0.22],
                    p2: [dx * 1.05, 2.42, 0.22],
                    p3: [dx, 2.32, 0.18],
                    thickness: strandGrain * 0.9,
                    segments: 4,
                  },
                  `fringe-${i}`,
                );
              })}
              <group ref={leftPigtail} position={[-0.34, 2.15, -0.18]}>
                {[
                  { phase: 0, dz: -0.02 },
                  { phase: Math.PI * (2 / 3), dz: 0.015 },
                  { phase: Math.PI * (4 / 3), dz: -0.005 },
                ].map((strand, idx) => {
                  const twistAmp = 0.04;
                  return renderStrand(
                    {
                      p0: [0, 0, 0],
                      p1: [
                        Math.sin(strand.phase + 0.6) * twistAmp,
                        -0.3,
                        Math.cos(strand.phase + 0.6) * twistAmp * 0.6 + strand.dz,
                      ],
                      p2: [
                        Math.sin(strand.phase + 1.8) * twistAmp,
                        -0.6,
                        Math.cos(strand.phase + 1.8) * twistAmp * 0.6 + strand.dz,
                      ],
                      p3: [
                        Math.sin(strand.phase + 3.0) * twistAmp * 0.6,
                        -0.85,
                        Math.cos(strand.phase + 3.0) * twistAmp * 0.4 + strand.dz,
                      ],
                      thickness: strandGrain + 0.01,
                      segments: 7,
                    },
                    `left-pigtail-${idx}`,
                  );
                })}
              </group>
              <group ref={rightPigtail} position={[0.34, 2.15, -0.18]}>
                {[
                  { phase: 0, dz: -0.02 },
                  { phase: Math.PI * (2 / 3), dz: 0.015 },
                  { phase: Math.PI * (4 / 3), dz: -0.005 },
                ].map((strand, idx) => {
                  const twistAmp = 0.04;
                  return renderStrand(
                    {
                      p0: [0, 0, 0],
                      p1: [
                        Math.sin(strand.phase + 0.6) * twistAmp,
                        -0.3,
                        Math.cos(strand.phase + 0.6) * twistAmp * 0.6 + strand.dz,
                      ],
                      p2: [
                        Math.sin(strand.phase + 1.8) * twistAmp,
                        -0.6,
                        Math.cos(strand.phase + 1.8) * twistAmp * 0.6 + strand.dz,
                      ],
                      p3: [
                        Math.sin(strand.phase + 3.0) * twistAmp * 0.6,
                        -0.85,
                        Math.cos(strand.phase + 3.0) * twistAmp * 0.4 + strand.dz,
                      ],
                      thickness: strandGrain + 0.01,
                      segments: 7,
                    },
                    `right-pigtail-${idx}`,
                  );
                })}
              </group>
            </>
          ) : null}
        </>
      )}

      <mesh castShadow position={[0, 2.06, 0]}>
        <cylinderGeometry args={[0.08, 0.09, 0.2, 8]} />
        <meshPhongMaterial {...skinProps} />
      </mesh>

      <mesh castShadow position={[0, 2.35, 0.32]}>
        <coneGeometry args={[0.085, 0.14, 8]} />
        <meshPhongMaterial {...skinProps} />
      </mesh>

      <mesh castShadow position={[-0.12, 2.47, 0.31]}>
        <sphereGeometry args={[0.05, 12, 8]} />
        <meshPhongMaterial {...eyeProps} />
      </mesh>
      <mesh castShadow position={[0.12, 2.47, 0.31]}>
        <sphereGeometry args={[0.05, 12, 8]} />
        <meshPhongMaterial {...eyeProps} />
      </mesh>
      {detailed ? (
        <>
          <mesh castShadow position={[-0.12, 2.475, 0.345]}>
            <sphereGeometry args={[0.022, 8, 6]} />
            <meshPhongMaterial color="#050a14" shininess={140} specular="#ffffff" />
          </mesh>
          <mesh castShadow position={[0.12, 2.475, 0.345]}>
            <sphereGeometry args={[0.022, 8, 6]} />
            <meshPhongMaterial color="#050a14" shininess={140} specular="#ffffff" />
          </mesh>
        </>
      ) : null}

      {detailed ? (
        <mesh castShadow position={[0, 2.25, 0.32]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.045, 0.014, 6, 12, Math.PI]} />
          <meshPhongMaterial {...lipProps} />
        </mesh>
      ) : (
        <mesh castShadow position={[0, 2.25, 0.315]}>
          <boxGeometry args={[0.12, 0.025, 0.025]} />
          <meshPhongMaterial {...lipProps} />
        </mesh>
      )}

      <mesh castShadow position={[-0.3, 2.4, 0]}>
        <sphereGeometry args={[0.05, 8, 6]} />
        <meshPhongMaterial {...skinProps} />
      </mesh>
      <mesh castShadow position={[0.3, 2.4, 0]}>
        <sphereGeometry args={[0.05, 8, 6]} />
        <meshPhongMaterial {...skinProps} />
      </mesh>

      {detailed ? (
        <mesh castShadow position={[0, 1.97, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.2, 0.04, 8, 16]} />
          <meshPhongMaterial {...collarProps} />
        </mesh>
      ) : null}

      <mesh castShadow position={[0, 1.85, 0]}>
        <boxGeometry args={[0.78, 0.5, 0.46]} />
        <meshPhongMaterial {...shirtProps} />
      </mesh>
      <mesh castShadow position={[0, 1.5, 0]}>
        <boxGeometry args={[0.78, 0.05, 0.46]} />
        <meshPhongMaterial color={theme.pantsColor} flatShading={flat} shininess={20} specular="#222" />
      </mesh>
      <mesh castShadow position={[0, 1.22, 0]}>
        <boxGeometry args={[0.78, 0.4, 0.46]} />
        <meshPhongMaterial {...pantsProps} />
      </mesh>

      {detailed ? (
        <>
          <group ref={leftUpperArm} position={[-0.5, 1.83, 0]}>
            <mesh castShadow position={[0, -0.22, 0]}>
              <boxGeometry args={[0.22, 0.42, 0.24]} />
              <meshPhongMaterial {...shirtProps} />
            </mesh>
            <group ref={leftForeArm} position={[0, -0.45, 0]}>
              <mesh castShadow position={[0, -0.21, 0]}>
                <boxGeometry args={[0.2, 0.4, 0.22]} />
                <meshPhongMaterial {...skinProps} />
              </mesh>
              <mesh castShadow position={[0, -0.45, 0]}>
                <sphereGeometry args={[0.13, 10, 8]} />
                <meshPhongMaterial {...skinProps} />
              </mesh>
            </group>
          </group>
          <group ref={rightUpperArm} position={[0.5, 1.83, 0]}>
            <mesh castShadow position={[0, -0.22, 0]}>
              <boxGeometry args={[0.22, 0.42, 0.24]} />
              <meshPhongMaterial {...shirtProps} />
            </mesh>
            <group ref={rightForeArm} position={[0, -0.45, 0]}>
              <mesh castShadow position={[0, -0.21, 0]}>
                <boxGeometry args={[0.2, 0.4, 0.22]} />
                <meshPhongMaterial {...skinProps} />
              </mesh>
              <mesh castShadow position={[0, -0.45, 0]}>
                <sphereGeometry args={[0.13, 10, 8]} />
                <meshPhongMaterial {...skinProps} />
              </mesh>
            </group>
          </group>
        </>
      ) : (
        <>
          <group ref={leftUpperArm} position={[-0.5, 1.83, 0]}>
            <mesh castShadow position={[0, -0.38, 0]}>
              <boxGeometry args={[0.22, 0.78, 0.24]} />
              <meshPhongMaterial {...shirtProps} />
            </mesh>
            <mesh castShadow position={[0, -0.8, 0]}>
              <sphereGeometry args={[0.13, 8, 6]} />
              <meshPhongMaterial {...skinProps} />
            </mesh>
          </group>
          <group ref={rightUpperArm} position={[0.5, 1.83, 0]}>
            <mesh castShadow position={[0, -0.38, 0]}>
              <boxGeometry args={[0.22, 0.78, 0.24]} />
              <meshPhongMaterial {...shirtProps} />
            </mesh>
            <mesh castShadow position={[0, -0.8, 0]}>
              <sphereGeometry args={[0.13, 8, 6]} />
              <meshPhongMaterial {...skinProps} />
            </mesh>
          </group>
        </>
      )}

      {detailed ? (
        <>
          <group ref={leftThigh} position={[-0.22, 0.96, 0]}>
            <mesh castShadow position={[0, -0.27, 0]}>
              <boxGeometry args={[0.28, 0.54, 0.32]} />
              <meshPhongMaterial {...pantsProps} />
            </mesh>
            <group ref={leftShin} position={[0, -0.54, 0]}>
              <mesh castShadow position={[0, -0.22, 0]}>
                <boxGeometry args={[0.26, 0.42, 0.3]} />
                <meshPhongMaterial {...pantsProps} />
              </mesh>
              <mesh castShadow position={[0, -0.46, 0.13]}>
                <boxGeometry args={[0.34, 0.18, 0.54]} />
                <meshPhongMaterial {...shoeProps} />
              </mesh>
            </group>
          </group>
          <group ref={rightThigh} position={[0.22, 0.96, 0]}>
            <mesh castShadow position={[0, -0.27, 0]}>
              <boxGeometry args={[0.28, 0.54, 0.32]} />
              <meshPhongMaterial {...pantsProps} />
            </mesh>
            <group ref={rightShin} position={[0, -0.54, 0]}>
              <mesh castShadow position={[0, -0.22, 0]}>
                <boxGeometry args={[0.26, 0.42, 0.3]} />
                <meshPhongMaterial {...pantsProps} />
              </mesh>
              <mesh castShadow position={[0, -0.46, 0.13]}>
                <boxGeometry args={[0.34, 0.18, 0.54]} />
                <meshPhongMaterial {...shoeProps} />
              </mesh>
            </group>
          </group>
        </>
      ) : (
        <>
          <group ref={leftThigh} position={[-0.22, 0.96, 0]}>
            <mesh castShadow position={[0, -0.46, 0]}>
              <boxGeometry args={[0.28, 0.9, 0.32]} />
              <meshPhongMaterial {...pantsProps} />
            </mesh>
            <mesh castShadow position={[0, -0.88, 0.13]}>
              <boxGeometry args={[0.34, 0.18, 0.54]} />
              <meshPhongMaterial {...shoeProps} />
            </mesh>
          </group>
          <group ref={rightThigh} position={[0.22, 0.96, 0]}>
            <mesh castShadow position={[0, -0.46, 0]}>
              <boxGeometry args={[0.28, 0.9, 0.32]} />
              <meshPhongMaterial {...pantsProps} />
            </mesh>
            <mesh castShadow position={[0, -0.88, 0.13]}>
              <boxGeometry args={[0.34, 0.18, 0.54]} />
              <meshPhongMaterial {...shoeProps} />
            </mesh>
          </group>
        </>
      )}
    </group>
  );
}
