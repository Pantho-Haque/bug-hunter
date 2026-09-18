import type { CellSchema, MissionPackageSchema } from '@codequest/domain';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  BackSide,
  BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Fog,
  IcosahedronGeometry,
  Matrix4,
  PlaneGeometry,
  Quaternion,
  SphereGeometry,
  Vector3,
} from 'three';
import type { Group, InstancedMesh, Mesh, MeshPhongMaterial } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import { resolveQuality, type QualityTier } from '../quality/qualityTier';
import { cellBounds, worldFromCell } from '../world/worldTransform';
import { surfaceTexture } from '../world/surfaceTexture';
import { missionSeed, themeForZone, type FoliageShape, type ZoneTheme } from './zoneThemes';

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

const skyVertex = /* glsl */ `
  varying vec3 vDirection;
  void main() {
    vDirection = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const skyFragment = /* glsl */ `
  varying vec3 vDirection;
  uniform float time;
  uniform vec3 skyTop;
  uniform vec3 skyHorizon;
  uniform vec3 sunColor;
  uniform float cloudAmount;
  uniform float starAmount;
  uniform float warmth;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
  }
  void main() {
    vec3 d = normalize(vDirection);
    // Later missions in a zone drift toward evening: a warmer, lower horizon.
    vec3 horizon = mix(skyHorizon, vec3(0.98,0.68,0.42), warmth * 0.55);
    vec3 sky = mix(horizon, skyTop, pow(max(d.y,0.0),0.55));
    float sun = max(dot(d,normalize(vec3(6,10.0-6.0*warmth,-5))),0.0);
    sky += sunColor*(pow(sun,550.0)*1.8+pow(sun,12.0)*0.14);
    // Stars only where a theme asks for them, fading out near the horizon.
    float star = step(1.0 - 0.0035*starAmount, hash(floor(d.xz/max(d.y,0.05)*70.0))) * smoothstep(0.04,0.35,d.y);
    sky += vec3(star * starAmount * 0.9);
    vec2 p = d.xz / max(d.y+0.22,0.15) * 3.5 + vec2(time*0.009,0);
    float n = noise(p)*0.57 + noise(p*2.03)*0.28 + noise(p*4.07)*0.15;
    float clouds = smoothstep(0.48,0.7,n)*smoothstep(0.01,0.23,d.y)*cloudAmount;
    vec3 cloudColor = mix(vec3(0.64,0.70,0.73),vec3(0.97,0.95,0.89),smoothstep(0.49,0.8,n));
    gl_FragColor = vec4(mix(sky,cloudColor,clouds),1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function useDecorativeMotion() {
  const reduced = useRef(true);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      reduced.current = query.matches;
    };
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
}

function SkyDome({ theme, warmth }: { readonly theme: ZoneTheme; readonly warmth: number }) {
  const mesh = useRef<Mesh>(null);
  const reduced = useDecorativeMotion();
  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      skyTop: { value: new Vector3(...theme.skyTop) },
      skyHorizon: { value: new Vector3(...theme.skyHorizon) },
      sunColor: { value: new Vector3(...theme.sunColor) },
      cloudAmount: { value: theme.cloudAmount },
      starAmount: { value: theme.starAmount },
      warmth: { value: warmth },
    }),
    [theme, warmth],
  );
  useFrame(({ camera }, delta) => {
    mesh.current?.position.copy(camera.position);
    if (!reduced.current) uniforms.time.value += Math.min(delta, 0.05);
  });
  return (
    <mesh ref={mesh} renderOrder={-1} frustumCulled={false}>
      <boxGeometry args={[100, 100, 100]} />
      <shaderMaterial
        key={`${theme.fog}-${warmth}`}
        uniforms={uniforms}
        vertexShader={skyVertex}
        fragmentShader={skyFragment}
        side={BackSide}
        depthWrite={false}
        depthTest={false}
        fog={false}
      />
    </mesh>
  );
}

interface Placement {
  readonly x: number;
  readonly z: number;
  readonly scale: number;
  readonly yaw: number;
  readonly tone: number;
}
const randomAt = (n: number) => {
  const v = Math.sin(n * 127.1 + 74.7) * 43758.5453;
  return v - Math.floor(v);
};

function treeGeometry(detailed: boolean, shape: FoliageShape) {
  const wood: BufferGeometry[] = [
    new CylinderGeometry(0.1, 0.23, 2.7, detailed ? 8 : 5).translate(0, 1.35, 0),
  ];
  const leaves: BufferGeometry[] = [];
  const limbs = detailed ? 7 : 3;
  for (let i = 0; i < limbs; i += 1) {
    const angle = i * 2.4;
    const end = new Vector3(
      Math.cos(angle) * (0.65 + i * 0.045),
      2.2 + i * 0.17,
      Math.sin(angle) * 0.8,
    );
    const start = new Vector3(0, 1.5 + i * 0.11, 0);
    const branch = new CylinderGeometry(0.035, 0.09, start.distanceTo(end), detailed ? 6 : 4);
    branch.applyQuaternion(
      new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), end.clone().sub(start).normalize()),
    );
    branch.translate(...start.clone().add(end).multiplyScalar(0.5).toArray());
    wood.push(branch);
    if (shape === 'cone') {
      // A pine: one tall cone per limb, no leaf cards needed.
      const cone = new ConeGeometry(0.75, 1.9, detailed ? 7 : 5);
      cone.translate(end.x, end.y + 0.7, end.z);
      leaves.push(cone);
      continue;
    }
    if (detailed) {
      // Intersecting opaque cutout cards show individual leaves at a fraction
      // of the polygon cost of modelling them, without transparent sorting.
      for (let card = 0; card < 3; card += 1) {
        const canopy = new PlaneGeometry(1.9, 1.75);
        canopy.rotateY((card * Math.PI) / 3 + angle);
        canopy.rotateX(card === 2 ? Math.PI / 2.5 : 0.2);
        canopy.translate(end.x, end.y + 0.35, end.z);
        leaves.push(canopy);
      }
      continue;
    }
    const canopy = new SphereGeometry(0.8, 5, 3);
    const positions = canopy.getAttribute('position');
    for (let v = 0; v < positions.count; v += 1) {
      const x = positions.getX(v),
        y = positions.getY(v),
        z = positions.getZ(v);
      const jitter = 1 + Math.sin(x * 17 + y * 9 + z * 13) * 0.14;
      positions.setXYZ(v, x * jitter, y * jitter * 0.85, z * jitter);
    }
    canopy.computeVertexNormals();
    canopy.translate(end.x, end.y + 0.35, end.z);
    leaves.push(canopy);
  }
  const trunk = mergeGeometries(wood)!;
  const foliage = mergeGeometries(leaves)!;
  [...wood, ...leaves].forEach((g) => g.dispose());
  return { trunk, foliage };
}

function Batch({
  geometry,
  placements,
  color,
  map,
  shadow = false,
  wind = false,
  windScale = 1,
  cutout = false,
}: {
  readonly geometry: BufferGeometry;
  readonly placements: readonly Placement[];
  readonly color: string;
  readonly map?: ReturnType<typeof surfaceTexture>;
  readonly shadow?: boolean;
  readonly wind?: boolean;
  readonly windScale?: number;
  readonly cutout?: boolean;
}) {
  const ref = useRef<InstancedMesh>(null);
  const material = useRef<MeshPhongMaterial>(null);
  const reduced = useDecorativeMotion();
  const breeze = useMemo(() => ({ value: 0 }), []);
  useFrame((_, delta) => {
    if (wind && !reduced.current) breeze.value += Math.min(delta, 0.05) * windScale;
  });
  useEffect(() => {
    const ownedMaterial = material.current;
    return () => {
      ownedMaterial?.dispose();
    };
  }, [wind]);
  useEffect(() => {
    const ownedMesh = ref.current;
    return () => {
      ownedMesh?.dispose();
    };
  }, []);
  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const matrix = new Matrix4();
    const rotation = new Quaternion();
    const tint = new Color(color);
    placements.forEach((p, i) => {
      rotation.setFromAxisAngle(new Vector3(0, 1, 0), p.yaw);
      matrix.compose(
        new Vector3(p.x, 0.045, p.z),
        rotation,
        new Vector3(p.scale, p.scale, p.scale),
      );
      mesh.setMatrixAt(i, matrix);
      mesh.setColorAt(i, tint.clone().multiplyScalar(p.tone));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [placements, color]);
  return (
    <instancedMesh
      ref={ref}
      args={[geometry, undefined, placements.length]}
      castShadow={shadow}
      receiveShadow={!cutout}
      dispose={null}
    >
      <meshPhongMaterial
        key={wind ? 'breeze' : 'still'}
        ref={material}
        map={map}
        color="#ffffff"
        shininess={5}
        specular="#182019"
        side={DoubleSide}
        alphaTest={cutout ? 0.45 : 0}
        emissive={cutout ? '#314722' : '#000000'}
        emissiveIntensity={0.25}
        customProgramCacheKey={() => (wind ? `grass-breeze-v2-${windScale.toFixed(2)}` : 'static-phong-v1')}
        onBeforeCompile={(shader) => {
          if (!wind) return;
          shader.uniforms.breeze = breeze;
          shader.vertexShader = 'uniform float breeze;\n' + shader.vertexShader;
          shader.vertexShader = shader.vertexShader.replace(
            '#include <begin_vertex>',
            `
          #include <begin_vertex>
          transformed.x += sin(breeze * 1.5 + instanceMatrix[3].x * 0.7 + instanceMatrix[3].z) * position.y * 0.12 * ${windScale.toFixed(2)};
        `,
          );
        }}
      />
    </instancedMesh>
  );
}

function Birds({
  quality,
  centerX,
  centerZ,
}: {
  readonly quality: QualityTier;
  readonly centerX: number;
  readonly centerZ: number;
}) {
  const flock = useRef<Group>(null);
  const reduced = useDecorativeMotion();
  const time = useRef(0);
  useFrame((_, delta) => {
    if (reduced.current || !flock.current) return;
    time.current += Math.min(delta, 0.05);
    flock.current.rotation.y = time.current * 0.035;
    flock.current.children.forEach((bird, i) => {
      const flap = Math.sin(time.current * 3 + i) * 0.28;
      bird.rotation.z = flap * 0.3;
      bird.scale.y = 0.5 + Math.abs(flap);
    });
  });
  return (
    <group ref={flock} position={[centerX, 0, centerZ]} name="distant-birds">
      {Array.from({ length: quality === 'low' ? 3 : 7 }, (_, i) => (
        <mesh
          key={i}
          position={[Math.cos(i * 0.7) * 17, 12 + i * 0.45, Math.sin(i * 0.7) * 17]}
          rotation={[0, -i * 0.7, 0]}
        >
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[
                new Float32Array([
                  -0.65, 0, 0, -0.18, 0.22, 0.06, 0, 0, 0.15, 0, 0, 0.15, 0.18, 0.22, 0.06, 0.65, 0,
                  0,
                ]),
                3,
              ]}
            />
          </bufferGeometry>
          <meshBasicMaterial color="#37444c" side={DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function Motes({
  color,
  count,
  height,
  centerX,
  centerZ,
  seed,
}: {
  readonly color: string;
  readonly count: number;
  readonly height: number;
  readonly centerX: number;
  readonly centerZ: number;
  readonly seed: number;
}) {
  const group = useRef<Group>(null);
  const reduced = useDecorativeMotion();
  const time = useRef(0);
  const spots = useMemo(
    () =>
      // A ring around the play area, never over it, so no mote drifts across
      // the avatar or the goal.
      Array.from({ length: count }, (_, i) => {
        const angle = randomAt(seed + i * 3) * Math.PI * 2;
        const radius = 6 + randomAt(seed + i * 3 + 1) * 9;
        return {
          x: centerX + Math.cos(angle) * radius,
          z: centerZ + Math.sin(angle) * radius,
          phase: randomAt(seed + i * 3 + 2) * Math.PI * 2,
        };
      }),
    [count, centerX, centerZ, seed],
  );
  useFrame((_, delta) => {
    if (reduced.current || !group.current) return;
    time.current += Math.min(delta, 0.05);
    group.current.children.forEach((mote, i) => {
      const spot = spots[i];
      mote.position.y = height + Math.sin(time.current * 0.9 + spot.phase) * 0.35;
      mote.position.x = spot.x + Math.sin(time.current * 0.4 + spot.phase) * 0.6;
      const pulse = 0.6 + Math.sin(time.current * 2.3 + spot.phase) * 0.4;
      mote.scale.setScalar(0.5 + pulse * 0.5);
    });
  });
  return (
    <group ref={group} name="motes">
      {spots.map((spot, i) => (
        <mesh key={i} position={[spot.x, height, spot.z]}>
          <sphereGeometry args={[0.06, 6, 5]} />
          <meshBasicMaterial color={color} fog={false} />
        </mesh>
      ))}
    </group>
  );
}

export function EnvironmentLayer({ mission, quality }: EnvironmentLayerProps) {
  const qualityConfig = resolveQuality(quality);
  const theme = themeForZone(mission.identity.zoneId);
  const seed = missionSeed(mission.identity.levelId);
  // Six missions per zone drift from a bright morning to a warm evening.
  const warmth = Math.min(1, Math.max(0, (mission.identity.ordinal - 1) / 5));
  const scene = useThree((state) => state.scene);
  useEffect(() => {
    // Fog belongs to the scene, not the containing group; otherwise distant
    // scenery and the edge of the ground remain fully visible.
    const previous = scene.fog;
    const fog = new Fog(theme.fog, ...qualityConfig.fogRange);
    scene.fog = fog;
    return () => {
      if (scene.fog === fog) scene.fog = previous;
    };
  }, [scene, qualityConfig, theme.fog]);
  const bounds = cellBounds(mission);
  const padX = 40;
  const padZ = 40;
  const width = Math.max(bounds.maxX - bounds.minX + padX * 2, 80);
  const depth = Math.max(bounds.maxZ - bounds.minZ + padZ * 2, 80);
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerZ = (bounds.minZ + bounds.maxZ) / 2;
  const routeCells = buildRouteCells(mission);
  const resources = useMemo(() => {
    const near = treeGeometry(true, theme.foliageShape);
    const far = treeGeometry(false, theme.foliageShape);
    const grass = new BufferGeometry();
    // Three bent blades per tuft, shared by every grass instance.
    grass.setAttribute(
      'position',
      new Float32BufferAttribute(
        [
          -0.09, 0, 0, 0.09, 0, 0, 0.06, 0.34, 0.04, 0.06, 0.34, 0.04, 0.09, 0, 0, 0.12, 0.48, 0.08,
          0, 0, -0.08, 0, 0, 0.08, -0.08, 0.38, 0, -0.08, 0.38, 0, 0, 0, 0.08, -0.13, 0.5, 0.06,
          -0.04, 0, 0.02, 0.04, 0, -0.02, 0.16, 0.29, -0.1,
        ],
        3,
      ),
    );
    grass.computeVertexNormals();
    return {
      nearTrunk: near.trunk,
      nearFoliage: near.foliage,
      farTrunk: far.trunk,
      farFoliage: far.foliage,
      grass,
      rock: new IcosahedronGeometry(0.55, 0).scale(1.3, 0.65, 0.9),
      groundMap: surfaceTexture('grass'),
      barkMap: surfaceTexture('bark'),
      stoneMap: surfaceTexture('stone'),
      leafMap: surfaceTexture('foliage'),
    };
  }, [theme.foliageShape]);
  useEffect(() => () => Object.values(resources).forEach((r) => r.dispose()), [resources]);
  const placements = useMemo(() => {
    const trees: Placement[] = [];
    const grass: Placement[] = [];
    const rocks: Placement[] = [];
    const safe = (x: number, z: number) =>
      x < bounds.minX - 2 || x > bounds.maxX + 2 || z < bounds.minZ - 2 || z > bounds.maxZ + 2;
    const baseCount = quality === 'low' ? 24 : quality === 'medium' ? 42 : 64;
    const count = Math.round(baseCount * theme.treeDensity);
    for (let i = 0; i < count; i += 1) {
      const angle = i * 2.399 + randomAt(seed) * 6.28;
      const radius = 7 + randomAt(seed + i) * 27;
      const x = centerX + Math.cos(angle) * radius,
        z = centerZ + Math.sin(angle) * radius;
      if (safe(x, z))
        trees.push({
          x,
          z,
          scale: 0.8 + randomAt(seed + i + 90) * 0.65,
          yaw: i,
          tone: 0.78 + randomAt(seed + i + 50) * 0.38,
        });
    }
    const baseBlades = quality === 'low' ? 250 : quality === 'medium' ? 900 : 1800;
    const blades = Math.round(baseBlades * theme.grassDensity);
    for (let i = 0; i < blades; i += 1) {
      const x = centerX + (randomAt(seed + i + 800) - 0.5) * 48,
        z = centerZ + (randomAt(seed + i + 3100) - 0.5) * 48;
      if (safe(x, z))
        grass.push({
          x,
          z,
          scale: 0.35 + randomAt(seed + i + 33) * 0.65,
          yaw: i,
          tone: 0.7 + randomAt(seed + i + 7) * 0.5,
        });
    }
    for (let i = 0; i < theme.rockCount; i += 1) {
      const angle = i * 2.4 + randomAt(seed + 5) * 6.28;
      const x = centerX + Math.cos(angle) * (5 + (i % 12) * 1.3 + randomAt(seed + i + 200) * 3),
        z = centerZ + Math.sin(angle) * (5 + (i % 12) * 1.3 + randomAt(seed + i + 300) * 3);
      if (safe(x, z))
        rocks.push({ x, z, scale: 0.4 + randomAt(seed + i + 15), yaw: i, tone: 0.8 + randomAt(seed + i) * 0.3 });
    }
    const nearCount = quality === 'low' ? 2 : quality === 'medium' ? 12 : 24;
    trees.sort(
      (a, b) => Math.hypot(a.x - centerX, a.z - centerZ) - Math.hypot(b.x - centerX, b.z - centerZ),
    );
    return { near: trees.slice(0, nearCount), far: trees.slice(nearCount), grass, rocks };
  }, [quality, centerX, centerZ, bounds.minX, bounds.maxX, bounds.minZ, bounds.maxZ, seed, theme]);
  return (
    <group name="environment-layer">
      <SkyDome theme={theme} warmth={warmth} />
      <hemisphereLight args={[theme.hemisphere[0], theme.hemisphere[1], theme.hemisphere[2]]} />
      <directionalLight
        color={theme.sun.color}
        castShadow={qualityConfig.shadowEnabled}
        intensity={theme.sun.intensity * (1 - warmth * 0.25)}
        position={[6, 10 - warmth * 5, -5]}
        shadow-camera-bottom={-16}
        shadow-camera-far={70}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-normalBias={0.04}
        shadow-mapSize={[qualityConfig.shadowMapSize, qualityConfig.shadowMapSize]}
      />
      <mesh receiveShadow position={[centerX, -0.06, centerZ]}>
        <boxGeometry args={[width, 0.18, depth]} />
        <meshPhongMaterial color={theme.groundBase} shininess={2} />
      </mesh>
      <mesh receiveShadow position={[centerX, 0.041, centerZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth, 12, 12]} />
        <meshPhongMaterial
          color={theme.groundTop}
          map={resources.groundMap}
          shininess={2}
          specular="#161c12"
        />
      </mesh>
      <Batch
        geometry={resources.nearTrunk}
        placements={placements.near}
        color={theme.trunk}
        map={resources.barkMap}
        shadow={qualityConfig.shadowEnabled}
      />
      <Batch
        geometry={resources.nearFoliage}
        placements={placements.near}
        color={theme.foliageNear}
        map={theme.foliageShape === 'round' ? resources.leafMap : undefined}
        cutout={theme.foliageShape === 'round'}
        shadow={qualityConfig.shadowEnabled}
      />
      <Batch
        geometry={resources.farTrunk}
        placements={placements.far}
        color={theme.trunk}
        map={resources.barkMap}
      />
      <Batch geometry={resources.farFoliage} placements={placements.far} color={theme.foliageFar} />
      <Batch
        geometry={resources.grass}
        placements={placements.grass}
        color={theme.grass}
        wind={quality !== 'low'}
        windScale={theme.windScale}
      />
      <Batch
        geometry={resources.rock}
        placements={placements.rocks}
        color={theme.rock}
        map={resources.stoneMap}
      />
      {theme.birds ? <Birds quality={quality} centerX={centerX} centerZ={centerZ} /> : null}
      {theme.motes && quality !== 'low' ? (
        <Motes
          centerX={centerX}
          centerZ={centerZ}
          color={theme.motes.color}
          count={theme.motes.count}
          height={theme.motes.height}
          seed={seed}
        />
      ) : null}
      {routeCells.map((cell, index) => {
        const [x, , z] = worldFromCell(cell);
        return (
          <mesh key={`tile-${index}`} receiveShadow position={[x, 0.01, z]}>
            <boxGeometry args={[0.9, 0.04, 0.9]} />
            <meshPhongMaterial color={theme.tile} map={resources.stoneMap} shininess={4} />
          </mesh>
        );
      })}
    </group>
  );
}
