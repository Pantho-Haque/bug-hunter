import type { MissionObjectSchema, SimulationStateSchema } from '@codequest/domain';

import type { QualityTier } from '../quality/qualityTier';
import { defaultWorldConfig, worldFromCell } from '../world/worldTransform';

export interface MissionObjectLayerProps {
  readonly objects: readonly MissionObjectSchema[];
  readonly quality: QualityTier;
  readonly state: SimulationStateSchema;
}

const goalPalette = {
  base: '#283044',
  glow: '#ffe166',
};

const collectiblePalette = {
  base: '#8be9fd',
  glow: '#7af0c2',
};

const blockerPalette = {
  base: '#7a4a30',
  cap: '#3a2517',
};

const interactablePalette = {
  base: '#bd93f9',
  glow: '#ff79c6',
};

const decorPalette = {
  trunk: '#7c4b2f',
  foliage: '#3e9c5b',
};

const isCollected = (
  state: SimulationStateSchema,
  objectId: string,
): boolean => state.collected.includes(objectId);

const isFlagOn = (
  state: SimulationStateSchema,
  flagKey: string | undefined,
): boolean => (flagKey ? state.flags[flagKey] === true : false);

const SpawnObjectMesh = ({ object }: { object: Extract<MissionObjectSchema, { kind: 'spawn' }> }) => {
  const [x, y, z] = worldFromCell(object.cell);
  return (
    <group position={[x, y, z]}>
      <mesh receiveShadow position={[0, 0.01, 0]}>
        <circleGeometry args={[0.48, 24]} />
        <meshStandardMaterial color="#fff5b3" emissive="#ffd166" emissiveIntensity={0.4} flatShading />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <torusGeometry args={[0.42, 0.05, 8, 24]} />
        <meshStandardMaterial color="#caa15a" emissive="#f6c560" emissiveIntensity={0.7} flatShading />
      </mesh>
    </group>
  );
};

const GoalObjectMesh = ({
  object,
  quality,
  state,
}: {
  object: Extract<MissionObjectSchema, { kind: 'goal' }>;
  quality: QualityTier;
  state: SimulationStateSchema;
}) => {
  const [x, y, z] = worldFromCell(object.cell);
  const collected = isCollected(state, `goal-${object.id}`);
  return (
    <group position={[x, y, z]}>
      <mesh castShadow position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.65, 0.16, 8, 16]} />
        <meshStandardMaterial
          color={goalPalette.glow}
          emissive="#d78520"
          emissiveIntensity={collected ? 0 : 1.2}
          flatShading
        />
      </mesh>
      <mesh castShadow position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.32, 0.36, 0.1, 12]} />
        <meshStandardMaterial color={goalPalette.base} flatShading />
      </mesh>
      {!collected && quality !== 'low' ? (
        <pointLight color="#ffd65c" intensity={8} distance={4} position={[0, 0.8, 0]} />
      ) : null}
    </group>
  );
};

const CollectibleObjectMesh = ({
  object,
  state,
}: {
  object: Extract<MissionObjectSchema, { kind: 'collectible' }>;
  state: SimulationStateSchema;
}) => {
  const [x, y, z] = worldFromCell(object.cell);
  const collected = isCollected(state, object.id);
  if (collected) return null;
  return (
    <group position={[x, y + 0.4, z]}>
      <mesh castShadow>
        <sphereGeometry args={[0.18, 10, 8]} />
        <meshStandardMaterial color={collectiblePalette.base} emissive={collectiblePalette.glow} emissiveIntensity={0.9} flatShading />
      </mesh>
      <pointLight color="#aef0ff" intensity={3} distance={2} position={[0, 0.1, 0]} />
    </group>
  );
};

const BlockerObjectMesh = ({
  object,
}: {
  object: Extract<MissionObjectSchema, { kind: 'blocker' }>;
}) => (
  <group>
    {object.occupiedCells.map((cell, index) => {
      const [x, y, z] = worldFromCell(cell);
      return (
        <group key={`${object.id}-${index}`} position={[x, y, z]}>
          <mesh castShadow position={[0, 0.5, 0]}>
            <boxGeometry args={[0.95, 1, 0.95]} />
            <meshStandardMaterial color={blockerPalette.base} flatShading />
          </mesh>
          <mesh castShadow position={[0, 1.05, 0]}>
            <boxGeometry args={[1.05, 0.08, 1.05]} />
            <meshStandardMaterial color={blockerPalette.cap} flatShading />
          </mesh>
        </group>
      );
    })}
  </group>
);

const InteractableObjectMesh = ({
  object,
  state,
}: {
  object: Extract<MissionObjectSchema, { kind: 'interactable' }>;
  state: SimulationStateSchema;
}) => {
  const [x, y, z] = worldFromCell(object.cell);
  const activeKey = `interactable.${object.id}.state`;
  const active = isFlagOn(state, activeKey) || object.initialState === 'on';
  return (
    <group position={[x, y, z]}>
      <mesh castShadow position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.3, 0.34, 0.9, 12]} />
        <meshStandardMaterial color={interactablePalette.base} flatShading />
      </mesh>
      <mesh castShadow position={[0, 0.95, 0]}>
        <boxGeometry args={[0.6, 0.12, 0.6]} />
        <meshStandardMaterial color={active ? interactablePalette.glow : '#5a4870'} flatShading />
      </mesh>
    </group>
  );
};

const TriggerObjectMesh = ({ object }: { object: Extract<MissionObjectSchema, { kind: 'trigger' }> }) => (
  <group>
    {object.cells.map((cell, index) => {
      const [x, , z] = worldFromCell(cell);
      return (
        <mesh key={`${object.id}-${index}`} position={[x, 0.01, z]}>
          <ringGeometry args={[0.32, 0.46, 24]} />
          <meshStandardMaterial color="#ffb86c" emissive="#ff7a45" emissiveIntensity={0.6} flatShading />
        </mesh>
      );
    })}
  </group>
);

const DecorObjectMesh = ({ object }: { object: Extract<MissionObjectSchema, { kind: 'decor' }> }) => {
  if (object.assetId === 'asset.grass.tuft') {
    return (
      <group>
        {object.cells.map((cell, index) => {
          const [x, , z] = worldFromCell(cell);
          return (
            <mesh key={`${object.id}-${index}`} position={[x, 0.18, z]}>
              <coneGeometry args={[0.22, 0.36, 6]} />
              <meshStandardMaterial color={decorPalette.foliage} flatShading />
            </mesh>
          );
        })}
      </group>
    );
  }
  return (
    <group>
      {object.cells.map((cell, index) => {
        const [x, , z] = worldFromCell(cell);
        return (
          <group key={`${object.id}-${index}`} position={[x, 0, z]}>
            <mesh castShadow position={[0, 0.75, 0]}>
              <cylinderGeometry args={[0.18, 0.24, 1.5, 7]} />
              <meshStandardMaterial color={decorPalette.trunk} flatShading />
            </mesh>
            <mesh castShadow position={[0, 2, 0]}>
              <coneGeometry args={[1.1, 2.5, 7]} />
              <meshStandardMaterial color={decorPalette.foliage} flatShading />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

const renderObject = (
  object: MissionObjectSchema,
  state: SimulationStateSchema,
  quality: QualityTier,
) => {
  switch (object.kind) {
    case 'spawn':
      return <SpawnObjectMesh key={object.id} object={object} />;
    case 'goal':
      return <GoalObjectMesh key={object.id} object={object} quality={quality} state={state} />;
    case 'collectible':
      return <CollectibleObjectMesh key={object.id} object={object} state={state} />;
    case 'blocker':
      return <BlockerObjectMesh key={object.id} object={object} />;
    case 'interactable':
      return <InteractableObjectMesh key={object.id} object={object} state={state} />;
    case 'trigger':
      return <TriggerObjectMesh key={object.id} object={object} />;
    case 'decor':
      return <DecorObjectMesh key={object.id} object={object} />;
  }
};

export function MissionObjectLayer({ objects, quality, state }: MissionObjectLayerProps) {
  void defaultWorldConfig;
  return (
    <group name="mission-object-layer">
      {objects.map((object) => renderObject(object, state, quality))}
    </group>
  );
}
