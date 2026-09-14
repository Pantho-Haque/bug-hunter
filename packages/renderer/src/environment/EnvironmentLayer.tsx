import type { CellSchema, MissionPackageSchema } from '@codequest/domain';

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

  return (
    <group name="environment-layer">
      <color attach="background" args={['#78bce8']} />
      <fog attach="fog" args={['#78bce8', ...qualityConfig.fogRange]} />
      <ambientLight intensity={1.5} />
      <directionalLight
        castShadow={qualityConfig.shadowEnabled}
        intensity={1.6}
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
        <meshStandardMaterial color="#68ad57" flatShading />
      </mesh>
      <mesh receiveShadow position={[centerX, 0.041, centerZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth, 12, 12]} />
        <meshStandardMaterial color="#73b962" flatShading roughness={1} />
      </mesh>
      {Array.from({ length: 24 }, (_, index) => {
        const angle = (index / 24) * Math.PI * 2;
        const radius = 18 + (index % 4) * 5;
        const x = centerX + Math.cos(angle) * radius;
        const z = centerZ + Math.sin(angle) * radius;
        return (
          <group key={`distant-tree-${index}`} position={[x, 0, z]}>
            <mesh castShadow position={[0, 0.9, 0]}>
              <cylinderGeometry args={[0.14, 0.2, 1.8, 6]} />
              <meshStandardMaterial color="#70452e" flatShading />
            </mesh>
            <mesh castShadow position={[0, 2.4, 0]}>
              <coneGeometry args={[1.15, 2.6, 7]} />
              <meshStandardMaterial color="#32874e" flatShading />
            </mesh>
          </group>
        );
      })}
      {routeCells.map((cell, index) => {
        const [x, , z] = worldFromCell(cell);
        return (
          <mesh key={`tile-${index}`} receiveShadow position={[x, 0.01, z]}>
            <boxGeometry args={[0.9, 0.04, 0.9]} />
            <meshStandardMaterial color="#d4c69a" roughness={0.9} />
          </mesh>
        );
      })}
    </group>
  );
}
