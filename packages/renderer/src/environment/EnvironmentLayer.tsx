import type { CellSchema, MissionPackageSchema } from '@codequest/domain';

import { cellBounds, worldFromCell } from '../world/worldTransform';

export interface EnvironmentLayerProps {
  readonly mission: MissionPackageSchema;
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

export function EnvironmentLayer({ mission }: EnvironmentLayerProps) {
  const bounds = cellBounds(mission);
  const padX = 2;
  const padZ = 2;
  const width = Math.max(bounds.maxX - bounds.minX + padX * 2, 6);
  const depth = Math.max(bounds.maxZ - bounds.minZ + padZ * 2, 6);
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerZ = (bounds.minZ + bounds.maxZ) / 2;
  const routeCells = buildRouteCells(mission);

  return (
    <group name="environment-layer">
      <color attach="background" args={['#78bce8']} />
      <fog attach="fog" args={['#78bce8', 12, 28]} />
      <ambientLight intensity={1.5} />
      <directionalLight castShadow intensity={1.6} position={[6, 10, -5]} shadow-mapSize={[1024, 1024]} />
      <mesh receiveShadow position={[centerX, -0.06, centerZ]}>
        <boxGeometry args={[width, 0.18, depth]} />
        <meshStandardMaterial color="#68ad57" flatShading />
      </mesh>
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