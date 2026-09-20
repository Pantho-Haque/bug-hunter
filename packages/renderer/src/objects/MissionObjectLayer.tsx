import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';

import type { MissionObjectSchema, SimulationStateSchema } from '@codequest/domain';

import type { QualityTier } from '../quality/qualityTier';
import { blockerAppearance } from '../world/blockerAppearance';
import { defaultWorldConfig, worldFromCell } from '../world/worldTransform';

export interface MissionObjectLayerProps {
  readonly objects: readonly MissionObjectSchema[];
  readonly reducedEffects?: boolean;
  readonly quality: QualityTier;
  readonly state: SimulationStateSchema;
}

const goalPalette = {
  base: '#283044',
  glow: '#ffe166',
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
  // The beacon is the reward for arriving: unlit until the avatar stands on it.
  const reached =
    state.avatar.cellX === object.cell.cellX && state.avatar.cellZ === object.cell.cellZ;
  return (
    <group position={[x, y, z]}>
      <mesh castShadow position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.65, 0.16, 8, 16]} />
        <meshStandardMaterial
          color={reached ? goalPalette.glow : '#8a6d3a'}
          emissive="#d78520"
          emissiveIntensity={reached ? 1.6 : 0.08}
          flatShading
        />
      </mesh>
      <mesh castShadow position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.32, 0.36, 0.1, 12]} />
        <meshStandardMaterial color={goalPalette.base} flatShading />
      </mesh>
      {reached && quality !== 'low' ? (
        <pointLight color="#ffd65c" intensity={9} distance={4.5} position={[0, 0.8, 0]} />
      ) : null}
    </group>
  );
};

/**
 * A collectible reads as "pick me up": a gold gem hovering over a marked ring,
 * turning slowly and bobbing. No glitter light — the ring on the ground is the
 * cue, and it stays put when motion is reduced.
 */
const CollectibleObjectMesh = ({
  object,
  state,
  reducedEffects,
}: {
  object: Extract<MissionObjectSchema, { kind: 'collectible' }>;
  state: SimulationStateSchema;
  reducedEffects: boolean;
}) => {
  const [x, y, z] = worldFromCell(object.cell);
  const gem = useRef<Group>(null);
  const hover = y + 0.62;
  useFrame(({ clock }, delta) => {
    if (reducedEffects || !gem.current) return;
    gem.current.rotation.y += delta * 1.4;
    gem.current.position.y = hover + Math.sin(clock.elapsedTime * 2.4 + x) * 0.06;
  });
  if (isCollected(state, object.id)) return null;
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.28, 0.42, 20]} />
        <meshStandardMaterial color="#ffd166" emissive="#ffb703" emissiveIntensity={0.45} />
      </mesh>
      <group ref={gem} position={[0, hover, 0]}>
        <mesh castShadow>
          <octahedronGeometry args={[0.26, 0]} />
          <meshStandardMaterial
            color="#ffd166"
            emissive="#ff9f1c"
            emissiveIntensity={0.3}
            flatShading
            metalness={0.25}
            roughness={0.35}
          />
        </mesh>
      </group>
    </group>
  );
};

const BlockerObjectMesh = ({
  object,
  state,
}: {
  object: Extract<MissionObjectSchema, { kind: 'blocker' }>;
  state: SimulationStateSchema;
}) => {
  // Mirrors isBlockerOpen() in @codequest/simulation. The renderer cannot
  // import the simulation, and the simulation still owns the rule: this only
  // decides how an already-open gate looks.
  const open =
    object.unlockedByFlag !== undefined && state.flags[object.unlockedByFlag] === true;
  const appearance = blockerAppearance(object);

  return (
    <group>
      {object.occupiedCells.map((cell, index) => {
        const [x, y, z] = worldFromCell(cell);
        if (appearance !== 'solid') {
          const water = appearance === 'water';
          return (
            <group key={`${object.id}-${index}`} position={[x, y, z]}>
              <mesh position={[0, -0.005, 0]} receiveShadow>
                <boxGeometry args={[1, 0.04, 1]} />
                <meshStandardMaterial color={water ? '#167e96' : '#403943'} roughness={water ? 0.3 : 1} />
              </mesh>
              {water ? [-0.2, 0.2].map((offset) => (
                <mesh key={offset} position={[offset * 0.4, 0.02, offset]} rotation={[-Math.PI / 2, 0, 0]}>
                  <planeGeometry args={[0.38, 0.025]} />
                  <meshBasicMaterial color="#85d4dc" />
                </mesh>
              )) : (
                <mesh position={[0, 0.018, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <planeGeometry args={[0.8, 0.8]} />
                  <meshBasicMaterial color="#24232e" />
                </mesh>
              )}
            </group>
          );
        }
        return (
          <group key={`${object.id}-${index}`} position={[x, y, z]}>
            <mesh castShadow={!open} position={[0, open ? 0.06 : 0.5, 0]}>
              <boxGeometry args={[0.95, open ? 0.12 : 1, 0.95]} />
              <meshStandardMaterial
                color={blockerPalette.base}
                flatShading
                opacity={open ? 0.55 : 1}
                transparent={open}
              />
            </mesh>
            {open ? null : (
              <mesh castShadow position={[0, 1.05, 0]}>
                <boxGeometry args={[1.05, 0.08, 1.05]} />
                <meshStandardMaterial color={blockerPalette.cap} flatShading />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
};

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
  // The avatar uses this from the cell in front and then walks onto its cell,
  // so the post stands in the cell's corner and a floor plate takes the centre:
  // nothing solid is ever drawn where the avatar's body will be.
  return (
    <group position={[x, y, z]}>
      <mesh receiveShadow position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.42, 0.46, 0.06, 16]} />
        <meshStandardMaterial
          color={active ? interactablePalette.glow : '#4a3d66'}
          emissive={interactablePalette.glow}
          emissiveIntensity={active ? 0.6 : 0}
          flatShading
        />
      </mesh>
      <group position={[0.34, 0, 0.34]}>
        <mesh castShadow position={[0, 0.32, 0]}>
          <cylinderGeometry args={[0.13, 0.16, 0.64, 10]} />
          <meshStandardMaterial color={interactablePalette.base} flatShading />
        </mesh>
        <mesh castShadow position={[0, 0.68, 0]}>
          <boxGeometry args={[0.3, 0.1, 0.3]} />
          <meshStandardMaterial color={active ? interactablePalette.glow : '#5a4870'} flatShading />
        </mesh>
      </group>
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
            {object.assetId === 'asset.prop.turning-sign' ? (
              <>
                <mesh castShadow position={[0, 0.42, 0]}>
                  <cylinderGeometry args={[0.045, 0.065, 0.84, 6]} />
                  <meshStandardMaterial color={decorPalette.trunk} flatShading />
                </mesh>
                <mesh castShadow position={[0, 0.83, 0]}>
                  <boxGeometry args={[0.7, 0.25, 0.09]} />
                  <meshStandardMaterial color="#e6cb8d" flatShading />
                </mesh>
                {[-1, 1].map((side) => (
                  <mesh key={side} position={[-0.12, 0.83 + side * 0.045, 0.055]} rotation={[0, 0, side * Math.PI / 4]}>
                    <boxGeometry args={[0.18, 0.045, 0.03]} />
                    <meshStandardMaterial color="#473520" />
                  </mesh>
                ))}
              </>
            ) : object.assetId === 'asset.forest.ferns' ? (
              <group>
                {Array.from({ length: 6 }, (_, i) => {
                  const angle = i * Math.PI / 3;
                  return (
                    <mesh key={i} castShadow position={[Math.sin(angle) * 0.17, 0.22, Math.cos(angle) * 0.17]}
                      rotation={[0.65, angle, 0]} scale={[0.08, 0.28, 0.035]}>
                      <sphereGeometry args={[1, 6, 4]} />
                      <meshStandardMaterial color={decorPalette.foliage} flatShading />
                    </mesh>
                  );
                })}
              </group>
            ) : object.assetId === 'asset.grass.reeds' ? (
              <group>
                {[-1, 0, 1].map((i) => (
                  <group key={i} position={[i * 0.12, 0, i * 0.09]}>
                    <mesh position={[0, 0.26, 0]}>
                      <cylinderGeometry args={[0.025, 0.035, 0.52, 5]} />
                      <meshStandardMaterial color={decorPalette.foliage} />
                    </mesh>
                    <mesh position={[0, 0.55, 0]}>
                      <cylinderGeometry args={[0.05, 0.05, 0.2, 6]} />
                      <meshStandardMaterial color="#88613a" />
                    </mesh>
                  </group>
                ))}
              </group>
            ) : (
              // Unknown scenery remains a compact, visible obstacle in its cell.
              <mesh castShadow position={[0, 0.2, 0]} scale={[1, 0.65, 1]}>
                <icosahedronGeometry args={[0.38, 0]} />
                <meshStandardMaterial color="#879181" flatShading />
              </mesh>
            )}
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
  reducedEffects: boolean,
) => {
  switch (object.kind) {
    case 'spawn':
      return <SpawnObjectMesh key={object.id} object={object} />;
    case 'goal':
      return <GoalObjectMesh key={object.id} object={object} quality={quality} state={state} />;
    case 'collectible':
      return (
        <CollectibleObjectMesh
          key={object.id}
          object={object}
          reducedEffects={reducedEffects}
          state={state}
        />
      );
    case 'blocker':
      return <BlockerObjectMesh key={object.id} object={object} state={state} />;
    case 'interactable':
      return <InteractableObjectMesh key={object.id} object={object} state={state} />;
    case 'trigger':
      return <TriggerObjectMesh key={object.id} object={object} />;
    case 'decor':
      return <DecorObjectMesh key={object.id} object={object} />;
  }
};

export function MissionObjectLayer({
  objects,
  quality,
  state,
  reducedEffects = false,
}: MissionObjectLayerProps) {
  void defaultWorldConfig;
  return (
    <group name="mission-object-layer">
      {objects.map((object) => renderObject(object, state, quality, reducedEffects))}
    </group>
  );
}
