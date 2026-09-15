import type { CellSchema, MissionPackageSchema } from '@codequest/domain';
import { useMemo } from 'react';
import { BackSide, Color } from 'three';

import { resolveQuality, type QualityTier } from '../quality/qualityTier';
import { cellBounds, worldFromCell } from '../world/worldTransform';

export interface EnvironmentLayerProps {
  readonly mission: MissionPackageSchema;
  readonly quality: QualityTier;
}

const buildRouteCells = (mission: MissionPackageSchema): readonly CellSchema[] => {
  const cells: CellSchema[] = [];
  for (const obj of mission.objects) {
    if (obj.kind === 'blocker') continue;
    if (obj.kind === 'decor') continue;
    if (obj.kind === 'trigger') continue;
    if (obj.cell) cells.push(obj.cell);
  }
  return cells;
};

const HORIZON = new Color('#c9def0');
const ZENITH = new Color('#5a8ec4');
const SUN = new Color('#fff2c5');
const SUN_DIR: readonly [number, number, number] = [6 / 12.04, 10 / 12.04, -5 / 12.04];

const skyVertex = /* glsl */ `
  varying vec3 vWorldDir;
  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldDir = normalize(worldPos.xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const skyFragment = /* glsl */ `
  precision highp float;
  varying vec3 vWorldDir;
  uniform vec3 uHorizon;
  uniform vec3 uZenith;
  uniform vec3 uSun;
  uniform vec3 uSunDir;
  void main() {
    float h = clamp(vWorldDir.y * 0.5 + 0.5, 0.0, 1.0);
    float skyT = smoothstep(0.35, 0.85, h);
    vec3 sky = mix(uHorizon, uZenith, skyT);
    float sunDot = max(0.0, dot(normalize(vWorldDir), normalize(uSunDir)));
    float disc = pow(sunDot, 256.0);
    float halo = pow(sunDot, 8.0) * 0.25;
    vec3 col = sky + uSun * (disc * 1.4 + halo);
    float horizonGlow = smoothstep(0.55, 0.4, h) * smoothstep(0.18, 0.32, h);
    col += vec3(0.06, 0.08, 0.1) * horizonGlow;
    gl_FragColor = vec4(col, 1.0);
  }
`;

interface TreeSpec {
  readonly x: number;
  readonly z: number;
  readonly heightScale: number;
  readonly canopyJitter: readonly [number, number, number];
  readonly hue: number;
}

const buildForest = (
  centerX: number,
  centerZ: number,
  detail: 'greybox' | 'medium' | 'high',
): readonly TreeSpec[] => {
  const count = detail === 'high' ? 28 : detail === 'medium' ? 22 : 14;
  const trees: TreeSpec[] = [];
  let state = 1729;
  const rand = (): number => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * Math.PI * 2 + rand() * 0.12;
    const radius = 14 + rand() * 22;
    const heightScale = 0.85 + rand() * 0.3;
    trees.push({
      x: centerX + Math.cos(angle) * radius,
      z: centerZ + Math.sin(angle) * radius,
      heightScale,
      canopyJitter: [(rand() - 0.5) * 0.18, (rand() - 0.5) * 0.18, 0],
      hue: 100 + rand() * 30,
    });
  }
  return trees;
};

interface RockSpec {
  readonly x: number;
  readonly z: number;
  readonly radius: number;
  readonly tone: number;
}

const buildRocks = (
  centerX: number,
  centerZ: number,
  detail: 'greybox' | 'medium' | 'high',
): readonly RockSpec[] => {
  const count = detail === 'high' ? 8 : detail === 'medium' ? 4 : 0;
  const rocks: RockSpec[] = [];
  let state = 7919;
  const rand = (): number => {
    state = (state * 1103 + 49297) % 233280;
    return state / 233280;
  };
  for (let index = 0; index < count; index += 1) {
    const angle = (index / Math.max(count, 1)) * Math.PI * 2 + rand() * 0.4;
    const radius = 12 + rand() * 25;
    rocks.push({
      x: centerX + Math.cos(angle) * radius,
      z: centerZ + Math.sin(angle) * radius,
      radius: 0.3 + rand() * 0.25,
      tone: 0.45 + rand() * 0.25,
    });
  }
  return rocks;
};

interface BushSpec {
  readonly x: number;
  readonly z: number;
  readonly radius: number;
  readonly hue: number;
}

const buildBushes = (
  centerX: number,
  centerZ: number,
  detail: 'greybox' | 'medium' | 'high',
): readonly BushSpec[] => {
  const count = detail === 'high' ? 12 : detail === 'medium' ? 6 : 0;
  const bushes: BushSpec[] = [];
  let state = 4093;
  const rand = (): number => {
    state = (state * 7919 + 49297) % 233280;
    return state / 233280;
  };
  for (let index = 0; index < count; index += 1) {
    const angle = rand() * Math.PI * 2;
    const radius = 8 + rand() * 28;
    bushes.push({
      x: centerX + Math.cos(angle) * radius,
      z: centerZ + Math.sin(angle) * radius,
      radius: 0.2 + rand() * 0.15,
      hue: 100 + rand() * 35,
    });
  }
  return bushes;
};

const SkyDome = () => {
  const uniforms = useMemo(
    () => ({
      uHorizon: { value: HORIZON },
      uZenith: { value: ZENITH },
      uSun: { value: SUN },
      uSunDir: { value: SUN_DIR },
    }),
    [],
  );
  return (
    <mesh renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[70, 32, 16]} />
      <shaderMaterial
        args={[{
          uniforms,
          vertexShader: skyVertex,
          fragmentShader: skyFragment,
          side: BackSide,
          depthWrite: false,
          depthTest: false,
          fog: false,
        }]}
      />
    </mesh>
  );
};

interface TreeProps {
  readonly tree: TreeSpec;
  readonly detail: 'greybox' | 'medium' | 'high';
}

const Tree = ({ tree, detail }: TreeProps) => {
  const trunkHeight = 1.6 * tree.heightScale;
  const foliageColor = `hsl(${tree.hue.toFixed(1)}, 38%, 32%)`;
  const canopySpec: ReadonlyArray<{ radius: number; height: number; yOffset: number }> =
    detail === 'high'
      ? [
          { radius: 1.15 * tree.heightScale, height: 1.9, yOffset: 2.0 },
          { radius: 0.9 * tree.heightScale, height: 1.3, yOffset: 2.6 },
          { radius: 0.65 * tree.heightScale, height: 0.95, yOffset: 3.1 },
        ]
      : detail === 'medium'
        ? [
            { radius: 1.05 * tree.heightScale, height: 1.8, yOffset: 2.0 },
            { radius: 0.75 * tree.heightScale, height: 1.2, yOffset: 2.55 },
          ]
        : [{ radius: 1.05 * tree.heightScale, height: 2.0, yOffset: 2.1 }];

  const canopySeg = detail === 'high' ? 9 : 7;
  return (
    <group position={[tree.x, 0, tree.z]}>
      <mesh castShadow position={[0, trunkHeight / 2, 0]}>
        <cylinderGeometry args={[0.13, 0.22, trunkHeight, 7]} />
        <meshPhongMaterial color="#70452e" flatShading={detail === 'greybox'} shininess={20} specular="#33221a" />
      </mesh>
      {canopySpec.map((c, idx) => {
        const jitter = tree.canopyJitter;
        return (
          <mesh
            key={`canopy-${idx}`}
            position={[jitter[0] * c.radius, c.yOffset + idx * 0.04, jitter[1] * c.radius]}
          >
            <coneGeometry args={[c.radius, c.height, canopySeg]} />
            <meshPhongMaterial color={foliageColor} flatShading={detail === 'greybox'} shininess={25} specular="#1a3a22" />
          </mesh>
        );
      })}
    </group>
  );
};

const Rock = ({ rock }: { rock: RockSpec }) => (
  <mesh castShadow={false} position={[rock.x, rock.radius * 0.6, rock.z]} rotation={[0.4, 0.6, 0.2]}>
    <icosahedronGeometry args={[rock.radius, 0]} />
    <meshPhongMaterial
      color={`hsl(40, 8%, ${(rock.tone * 100).toFixed(0)}%)`}
      flatShading
      shininess={12}
      specular="#3a3530"
    />
  </mesh>
);

const Bush = ({ bush }: { bush: BushSpec }) => {
  const color = `hsl(${bush.hue.toFixed(1)}, 45%, 36%)`;
  return (
    <group position={[bush.x, 0, bush.z]}>
      <mesh castShadow={false} position={[0, bush.radius * 0.5, 0]}>
        <sphereGeometry args={[bush.radius, 8, 6]} />
        <meshPhongMaterial color={color} flatShading shininess={20} specular="#1a3a22" />
      </mesh>
      <mesh castShadow={false} position={[bush.radius * 0.5, bush.radius * 0.35, bush.radius * 0.2]}>
        <sphereGeometry args={[bush.radius * 0.7, 8, 6]} />
        <meshPhongMaterial color={color} flatShading shininess={20} specular="#1a3a22" />
      </mesh>
      <mesh castShadow={false} position={[-bush.radius * 0.4, bush.radius * 0.4, -bush.radius * 0.3]}>
        <sphereGeometry args={[bush.radius * 0.6, 8, 6]} />
        <meshPhongMaterial color={color} flatShading shininess={20} specular="#1a3a22" />
      </mesh>
    </group>
  );
};

export function EnvironmentLayer({ mission, quality }: EnvironmentLayerProps) {
  const qualityConfig = resolveQuality(quality);
  const bounds = cellBounds(mission);
  const padX = 40;
  const padZ = 40;
  const width = Math.max(bounds.maxX - bounds.minX + padX * 2, 80);
  const depth = Math.max(bounds.maxZ - bounds.minZ + padZ * 2, 80);
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerZ = (bounds.minZ + bounds.maxZ) / 2;
  const routeCells = buildRouteCells(mission);

  const trees = useMemo(
    () => buildForest(centerX, centerZ, qualityConfig.detailLevel),
    [centerX, centerZ, qualityConfig.detailLevel],
  );
  const rocks = useMemo(
    () => buildRocks(centerX, centerZ, qualityConfig.detailLevel),
    [centerX, centerZ, qualityConfig.detailLevel],
  );
  const bushes = useMemo(
    () => buildBushes(centerX, centerZ, qualityConfig.detailLevel),
    [centerX, centerZ, qualityConfig.detailLevel],
  );

  return (
    <group name="environment-layer">
      <SkyDome />
      <fog attach="fog" args={['#c9def0', ...qualityConfig.fogRange]} />
      <ambientLight intensity={1.4} />
      <directionalLight
        castShadow={qualityConfig.shadowEnabled}
        intensity={1.7}
        position={[6, 10, -5]}
        shadow-camera-bottom={-45}
        shadow-camera-far={70}
        shadow-camera-left={-45}
        shadow-camera-right={45}
        shadow-camera-top={45}
        shadow-mapSize={[qualityConfig.shadowMapSize, qualityConfig.shadowMapSize]}
      />
      <mesh receiveShadow position={[centerX, -0.06, centerZ]}>
        <boxGeometry args={[width, 0.18, depth]} />
        <meshPhongMaterial color="#5d9c4f" flatShading shininess={5} specular="#222" />
      </mesh>
      <mesh receiveShadow position={[centerX, 0.041, centerZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth, 12, 12]} />
        <meshPhongMaterial color="#6cae57" flatShading shininess={5} specular="#222" />
      </mesh>
      {trees.map((tree, index) => (
        <Tree key={`tree-${index}`} tree={tree} detail={qualityConfig.detailLevel} />
      ))}
      {rocks.map((rock, index) => (
        <Rock key={`rock-${index}`} rock={rock} />
      ))}
      {bushes.map((bush, index) => (
        <Bush key={`bush-${index}`} bush={bush} />
      ))}
      {routeCells.map((cell, index) => {
        const [x, , z] = worldFromCell(cell);
        return (
          <mesh key={`tile-${index}`} receiveShadow position={[x, 0.01, z]}>
            <boxGeometry args={[0.9, 0.04, 0.9]} />
            <meshPhongMaterial color="#d4c69a" shininess={5} specular="#444" />
          </mesh>
        );
      })}
    </group>
  );
}
