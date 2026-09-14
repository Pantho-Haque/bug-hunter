import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, type MutableRefObject } from 'react';
import { MathUtils, Vector3, type Group } from 'three';

export type AvatarPresentation = 'boy' | 'girl';
export type ManualDirection = 'forward' | 'backward' | 'left' | 'right';

interface ManualMove {
  direction: ManualDirection;
  id: number;
}

interface ThirdPersonWorldProps {
  commandCount: number;
  manualMove: ManualMove;
  onProgramComplete: (reachedGoal: boolean) => void;
  presentation: AvatarPresentation;
  reducedEffects: boolean;
  runId: number;
}

interface PlayerProps extends ThirdPersonWorldProps {
  readonly _unusedBrand?: never;
}

const startZ = -6;
const stepDistance = 2;

function LowPolyAvatar({
  isMoving,
  presentation,
}: {
  isMoving: MutableRefObject<boolean>;
  presentation: AvatarPresentation;
}) {
  const leftArm = useRef<Group>(null);
  const leftLeg = useRef<Group>(null);
  const rightArm = useRef<Group>(null);
  const rightLeg = useRef<Group>(null);

  useFrame(({ clock }) => {
    const swing = isMoving.current ? Math.sin(clock.elapsedTime * 9) * 0.55 : 0;

    if (leftArm.current) leftArm.current.rotation.x = -swing;
    if (rightArm.current) rightArm.current.rotation.x = swing;
    if (leftLeg.current) leftLeg.current.rotation.x = swing;
    if (rightLeg.current) rightLeg.current.rotation.x = -swing;
  });

  const shirtColor = presentation === 'girl' ? '#f05d9b' : '#29a7a1';
  const hairColor = presentation === 'girl' ? '#562f23' : '#2b241f';

  return (
    <group>
      <mesh castShadow position={[0, 2.25, 0]}>
        <sphereGeometry args={[0.38, 8, 6]} />
        <meshStandardMaterial color="#b97850" flatShading />
      </mesh>
      <mesh castShadow position={[-0.13, 2.29, 0.35]}>
        <sphereGeometry args={[0.045, 6, 4]} />
        <meshStandardMaterial color="#17233b" flatShading />
      </mesh>
      <mesh castShadow position={[0.13, 2.29, 0.35]}>
        <sphereGeometry args={[0.045, 6, 4]} />
        <meshStandardMaterial color="#17233b" flatShading />
      </mesh>
      <mesh castShadow position={[0, 2.18, 0.38]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.055, 0.11, 6]} />
        <meshStandardMaterial color="#a96343" flatShading />
      </mesh>
      <mesh castShadow position={[0, 2.47, -0.03]}>
        <sphereGeometry args={[0.39, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={hairColor} flatShading />
      </mesh>
      {presentation === 'girl' && (
        <>
          <mesh castShadow position={[-0.38, 2.25, 0]}>
            <sphereGeometry args={[0.16, 7, 5]} />
            <meshStandardMaterial color={hairColor} flatShading />
          </mesh>
          <mesh castShadow position={[0.38, 2.25, 0]}>
            <sphereGeometry args={[0.16, 7, 5]} />
            <meshStandardMaterial color={hairColor} flatShading />
          </mesh>
        </>
      )}
      <mesh castShadow position={[0, 1.48, 0]}>
        <boxGeometry args={[0.75, 1.05, 0.42]} />
        <meshStandardMaterial color={shirtColor} flatShading />
      </mesh>
      <mesh castShadow position={[0, 1.82, 0.23]}>
        <boxGeometry args={[0.42, 0.17, 0.05]} />
        <meshStandardMaterial color="#f4e7d0" flatShading />
      </mesh>
      <mesh castShadow position={[0, 1.5, -0.33]}>
        <boxGeometry args={[0.58, 0.72, 0.26]} />
        <meshStandardMaterial color="#f0a93c" flatShading />
      </mesh>
      <mesh castShadow position={[0, 1.02, 0.03]}>
        <boxGeometry args={[0.78, 0.24, 0.46]} />
        <meshStandardMaterial color="#263a67" flatShading />
      </mesh>
      <group ref={leftArm} position={[-0.5, 1.83, 0]}>
        <mesh castShadow position={[0, -0.38, 0]}>
          <boxGeometry args={[0.22, 0.78, 0.24]} />
          <meshStandardMaterial color={shirtColor} flatShading />
        </mesh>
        <mesh castShadow position={[0, -0.8, 0]}>
          <sphereGeometry args={[0.13, 6, 5]} />
          <meshStandardMaterial color="#b97850" flatShading />
        </mesh>
      </group>
      <group ref={rightArm} position={[0.5, 1.83, 0]}>
        <mesh castShadow position={[0, -0.38, 0]}>
          <boxGeometry args={[0.22, 0.78, 0.24]} />
          <meshStandardMaterial color={shirtColor} flatShading />
        </mesh>
        <mesh castShadow position={[0, -0.8, 0]}>
          <sphereGeometry args={[0.13, 6, 5]} />
          <meshStandardMaterial color="#b97850" flatShading />
        </mesh>
      </group>
      <group ref={leftLeg} position={[-0.22, 0.96, 0]}>
        <mesh castShadow position={[0, -0.46, 0]}>
          <boxGeometry args={[0.28, 0.9, 0.32]} />
          <meshStandardMaterial color="#25314d" flatShading />
        </mesh>
        <mesh castShadow position={[0, -0.88, 0.13]}>
          <boxGeometry args={[0.34, 0.18, 0.54]} />
          <meshStandardMaterial color="#eef3f5" flatShading />
        </mesh>
      </group>
      <group ref={rightLeg} position={[0.22, 0.96, 0]}>
        <mesh castShadow position={[0, -0.46, 0]}>
          <boxGeometry args={[0.28, 0.9, 0.32]} />
          <meshStandardMaterial color="#25314d" flatShading />
        </mesh>
        <mesh castShadow position={[0, -0.88, 0.13]}>
          <boxGeometry args={[0.34, 0.18, 0.54]} />
          <meshStandardMaterial color="#eef3f5" flatShading />
        </mesh>
      </group>
    </group>
  );
}

function Player({
  commandCount,
  manualMove,
  onProgramComplete,
  presentation,
  reducedEffects,
  runId,
}: PlayerProps) {
  const group = useRef<Group>(null);
  const isMoving = useRef(false);
  const reducedEffectsRef = useRef(reducedEffects);
  const activeKeys = useRef(new Set<string>());
  const programActive = useRef(false);
  const programTargetZ = useRef(startZ);
  const completedRunId = useRef(0);
  const { camera } = useThree();
  const cameraTarget = useRef(new Vector3());
  const cameraPosition = useRef(new Vector3());
  const lookTarget = useRef(new Vector3());

  useEffect(() => {
    reducedEffectsRef.current = reducedEffects;
  }, [reducedEffects]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.matches('textarea, input, select')) return;
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(event.key.toLowerCase())) {
        event.preventDefault();
        activeKeys.current.add(event.key.toLowerCase());
      }
    }

    function handleKeyUp(event: KeyboardEvent) {
      activeKeys.current.delete(event.key.toLowerCase());
    }

    function clearKeys() {
      activeKeys.current.clear();
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', clearKeys);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', clearKeys);
    };
  }, []);

  useEffect(() => {
    if (!group.current || runId === 0) return;

    group.current.position.set(0, 0, startZ);
    group.current.rotation.y = 0;
    programTargetZ.current = MathUtils.clamp(startZ + commandCount * stepDistance, startZ, 6);
    programActive.current = true;
    completedRunId.current = 0;

    if (reducedEffectsRef.current || commandCount === 0) {
      group.current.position.z = programTargetZ.current;
      programActive.current = false;
      completedRunId.current = runId;
      onProgramComplete(commandCount === 3);
    }
  }, [commandCount, onProgramComplete, runId]);

  useEffect(() => {
    if (!group.current || manualMove.id === 0 || programActive.current) return;

    const direction = manualMove.direction;
    const nextX = direction === 'left' ? -0.65 : direction === 'right' ? 0.65 : 0;
    const nextZ = direction === 'backward' ? -0.65 : direction === 'forward' ? 0.65 : 0;
    group.current.position.x = MathUtils.clamp(group.current.position.x + nextX, -4.5, 4.5);
    group.current.position.z = MathUtils.clamp(group.current.position.z + nextZ, -7, 6);
    group.current.rotation.y = Math.atan2(nextX, nextZ);
  }, [manualMove]);

  useFrame((_, delta) => {
    if (!group.current) return;

    const player = group.current;
    let moveX = 0;
    let moveZ = 0;

    if (programActive.current) {
      const distance = programTargetZ.current - player.position.z;
      const travel = Math.min(Math.abs(distance), delta * 3.2) * Math.sign(distance);
      player.position.z += travel;
      player.rotation.y = 0;

      if (Math.abs(distance) < 0.025 && completedRunId.current !== runId) {
        player.position.z = programTargetZ.current;
        programActive.current = false;
        completedRunId.current = runId;
        onProgramComplete(commandCount === 3);
      }
    } else {
      if (activeKeys.current.has('a') || activeKeys.current.has('arrowleft')) moveX -= 1;
      if (activeKeys.current.has('d') || activeKeys.current.has('arrowright')) moveX += 1;
      if (activeKeys.current.has('s') || activeKeys.current.has('arrowdown')) moveZ -= 1;
      if (activeKeys.current.has('w') || activeKeys.current.has('arrowup')) moveZ += 1;

      if (moveX !== 0 || moveZ !== 0) {
        const length = Math.hypot(moveX, moveZ);
        moveX /= length;
        moveZ /= length;
        player.position.x = MathUtils.clamp(player.position.x + moveX * delta * 3.6, -4.5, 4.5);
        player.position.z = MathUtils.clamp(player.position.z + moveZ * delta * 3.6, -7, 6);
        player.rotation.y = Math.atan2(moveX, moveZ);
      }
    }

    isMoving.current = programActive.current || moveX !== 0 || moveZ !== 0;

    const forwardX = Math.sin(player.rotation.y);
    const forwardZ = Math.cos(player.rotation.y);
    cameraPosition.current.set(
      player.position.x - forwardX * 6.5,
      4.8,
      player.position.z - forwardZ * 6.5,
    );
    camera.position.lerp(cameraPosition.current, Math.min(1, delta * 4.5));
    lookTarget.current.set(player.position.x, 1.35, player.position.z + forwardZ * 2.2);
    cameraTarget.current.lerp(lookTarget.current, Math.min(1, delta * 5));
    camera.lookAt(cameraTarget.current);
  });

  return (
    <group ref={group} position={[0, 0, startZ]}>
      <LowPolyAvatar isMoving={isMoving} presentation={presentation} />
    </group>
  );
}

function Tree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.75, 0]}>
        <cylinderGeometry args={[0.18, 0.24, 1.5, 7]} />
        <meshStandardMaterial color="#7c4b2f" flatShading />
      </mesh>
      <mesh castShadow position={[0, 2, 0]}>
        <coneGeometry args={[1.1, 2.5, 7]} />
        <meshStandardMaterial color="#3e9c5b" flatShading />
      </mesh>
    </group>
  );
}

function Building({ color, position }: { color: string; position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, 1.4, 0]}>
        <boxGeometry args={[2.6, 2.8, 2.5]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
      <mesh castShadow position={[0, 3.12, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[2.05, 1.3, 4]} />
        <meshStandardMaterial color="#cb5d4c" flatShading />
      </mesh>
      {[-0.72, 0.72].map((x) => (
        <mesh key={x} position={[x, 1.75, -1.265]}>
          <boxGeometry args={[0.72, 0.82, 0.04]} />
          <meshStandardMaterial color="#bfe8f4" emissive="#5fa4bd" emissiveIntensity={0.15} roughness={0.35} />
        </mesh>
      ))}
      <mesh position={[0, 0.62, -1.27]}>
        <boxGeometry args={[0.68, 1.22, 0.05]} />
        <meshStandardMaterial color="#5d3d35" roughness={0.9} />
      </mesh>
      <mesh position={[0.23, 0.66, -1.31]}>
        <sphereGeometry args={[0.055, 6, 4]} />
        <meshStandardMaterial color="#f3c768" metalness={0.55} roughness={0.3} />
      </mesh>
    </group>
  );
}

function StreetLamp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 1.55, 0]}>
        <cylinderGeometry args={[0.055, 0.09, 3.1, 8]} />
        <meshStandardMaterial color="#273b50" metalness={0.45} roughness={0.55} />
      </mesh>
      <mesh castShadow position={[0, 3.1, 0]}>
        <cylinderGeometry args={[0.24, 0.13, 0.34, 8]} />
        <meshStandardMaterial color="#f7d987" emissive="#f7b955" emissiveIntensity={1.4} />
      </mesh>
      <pointLight color="#ffd790" distance={5} intensity={4} position={[0, 2.95, 0]} />
    </group>
  );
}

function Beacon({ reducedEffects }: { reducedEffects: boolean }) {
  const group = useRef<Group>(null);

  useFrame((_, delta) => {
    if (group.current && !reducedEffects) group.current.rotation.y += delta * 1.4;
  });

  return (
    <group ref={group} position={[0, 0.15, 0]}>
      <mesh castShadow position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.65, 0.16, 8, 16]} />
        <meshStandardMaterial color="#ffe166" emissive="#d78520" emissiveIntensity={1.2} flatShading />
      </mesh>
      <pointLight color="#ffd65c" intensity={18} distance={5} position={[0, 1.1, 0]} />
    </group>
  );
}

function World({
  commandCount,
  manualMove,
  onProgramComplete,
  presentation,
  reducedEffects,
  runId,
}: ThirdPersonWorldProps) {
  return (
    <>
      <color attach="background" args={['#78bce8']} />
      <fog attach="fog" args={['#78bce8', 16, 34]} />
      <ambientLight intensity={1.8} />
      <directionalLight castShadow intensity={2.2} position={[7, 12, -6]} shadow-mapSize={[1024, 1024]} />
      <mesh receiveShadow position={[0, -0.14, 0]}>
        <boxGeometry args={[24, 0.25, 30]} />
        <meshStandardMaterial color="#68ad57" flatShading />
      </mesh>
      <mesh receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[4.2, 0.08, 18]} />
        <meshStandardMaterial color="#617083" roughness={0.95} />
      </mesh>
      <mesh receiveShadow position={[-2.7, 0.08, 0]}>
        <boxGeometry args={[1.15, 0.18, 18]} />
        <meshStandardMaterial color="#c6bba3" roughness={1} />
      </mesh>
      <mesh receiveShadow position={[2.7, 0.08, 0]}>
        <boxGeometry args={[1.15, 0.18, 18]} />
        <meshStandardMaterial color="#c6bba3" roughness={1} />
      </mesh>
      {[-6, -4, -2, 0, 2, 4].map((z) => (
        <mesh key={z} position={[0, 0.055, z]}>
          <boxGeometry args={[0.12, 0.02, 0.75]} />
          <meshStandardMaterial color="#f6df83" />
        </mesh>
      ))}
      <mesh receiveShadow position={[0, 0.02, 4.5]}>
        <boxGeometry args={[13, 0.09, 3.4]} />
        <meshStandardMaterial color="#6c7887" roughness={0.95} />
      </mesh>
      {[-1.45, -0.72, 0, 0.72, 1.45].map((x) => (
        <mesh key={x} position={[x, 0.075, 4.5]}>
          <boxGeometry args={[0.42, 0.025, 2.7]} />
          <meshStandardMaterial color="#eef2df" roughness={0.9} />
        </mesh>
      ))}
      <Building color="#f0bf72" position={[-5, 0, -2]} />
      <Building color="#7fc5c0" position={[5, 0, 2]} />
      <Building color="#9e8bd1" position={[-5, 0, 6]} />
      <Tree position={[4.5, 0, -5]} />
      <Tree position={[-4, 0, 2]} />
      <Tree position={[4.5, 0, 7]} />
      <StreetLamp position={[-3.3, 0, -5.3]} />
      <StreetLamp position={[3.3, 0, -1.2]} />
      <StreetLamp position={[-3.3, 0, 3.2]} />
      <mesh castShadow position={[-8, 2.1, 12]} rotation={[0, 0.2, 0]}>
        <coneGeometry args={[4.8, 6, 6]} />
        <meshStandardMaterial color="#5b7990" flatShading />
      </mesh>
      <mesh castShadow position={[8, 1.7, 13]} rotation={[0, -0.3, 0]}>
        <coneGeometry args={[4.2, 5, 6]} />
        <meshStandardMaterial color="#668697" flatShading />
      </mesh>
      <Beacon reducedEffects={reducedEffects} />
      <Player
        commandCount={commandCount}
        manualMove={manualMove}
        onProgramComplete={onProgramComplete}
        presentation={presentation}
        reducedEffects={reducedEffects}
        runId={runId}
      />
    </>
  );
}

export function ThirdPersonWorld(props: ThirdPersonWorldProps) {
  return (
    <Canvas
      aria-hidden="true"
      camera={{ fov: 52, position: [0, 4.8, -12] }}
      dpr={[1, 1.5]}
      shadows="basic"
    >
      <World {...props} />
    </Canvas>
  );
}
