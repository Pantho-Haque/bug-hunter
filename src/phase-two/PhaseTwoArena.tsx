import { Canvas, useFrame } from '@react-three/fiber';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type RefObject,
} from 'react';
import { Group, MathUtils } from 'three';

export interface ArenaMetrics {
  frameCount: number;
  medianFps: number;
  onePercentLowFps: number;
  routeDurationMs: number;
}

interface PhaseTwoArenaProps {
  onComplete: (metrics: ArenaMetrics) => void;
  quality: 'balanced' | 'low';
  reducedMotion: boolean;
  runId: number;
}

const route: [number, number][] = [
  [-2.5, -2.5],
  [-1.5, -2.5],
  [-0.5, -2.5],
  [0.5, -2.5],
  [0.5, -1.5],
  [0.5, -0.5],
  [1.5, -0.5],
  [2.5, -0.5],
];

function useVisibleRendering(hostRef: RefObject<HTMLElement | null>) {
  const [isVisible, setIsVisible] = useState(true);
  const isIntersectingRef = useRef(true);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    function updateDocumentVisibility() {
      setIsVisible(
        isIntersectingRef.current && document.visibilityState === 'visible',
      );
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        isIntersectingRef.current = entry.isIntersecting;
        updateDocumentVisibility();
      },
      { threshold: 0.01 },
    );
    observer.observe(host);
    document.addEventListener('visibilitychange', updateDocumentVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener(
        'visibilitychange',
        updateDocumentVisibility,
      );
    };
  }, [hostRef]);

  return isVisible;
}

function AvatarProxy({ movingRef }: { movingRef: MutableRefObject<boolean> }) {
  const leftArm = useRef<Group>(null);
  const rightArm = useRef<Group>(null);
  const leftLeg = useRef<Group>(null);
  const rightLeg = useRef<Group>(null);

  useFrame(({ clock }) => {
    const swing = movingRef.current
      ? Math.sin(clock.elapsedTime * 10) * 0.55
      : 0;
    if (leftArm.current) leftArm.current.rotation.x = swing;
    if (rightArm.current) rightArm.current.rotation.x = -swing;
    if (leftLeg.current) leftLeg.current.rotation.x = -swing;
    if (rightLeg.current) rightLeg.current.rotation.x = swing;
  });

  return (
    <group scale={0.42}>
      <mesh castShadow position={[0, 2.5, 0]}>
        <sphereGeometry args={[0.42, 8, 6]} />
        <meshStandardMaterial color="#b97850" flatShading />
      </mesh>
      <mesh castShadow position={[0, 1.55, 0]}>
        <boxGeometry args={[0.9, 1.25, 0.55]} />
        <meshStandardMaterial color="#ff6b8b" flatShading />
      </mesh>
      <group ref={leftArm} position={[-0.58, 2, 0]}>
        <mesh castShadow position={[0, -0.48, 0]}>
          <boxGeometry args={[0.24, 0.95, 0.28]} />
          <meshStandardMaterial color="#ff6b8b" flatShading />
        </mesh>
      </group>
      <group ref={rightArm} position={[0.58, 2, 0]}>
        <mesh castShadow position={[0, -0.48, 0]}>
          <boxGeometry args={[0.24, 0.95, 0.28]} />
          <meshStandardMaterial color="#ff6b8b" flatShading />
        </mesh>
      </group>
      <group ref={leftLeg} position={[-0.24, 1, 0]}>
        <mesh castShadow position={[0, -0.48, 0]}>
          <boxGeometry args={[0.3, 0.95, 0.34]} />
          <meshStandardMaterial color="#25314d" flatShading />
        </mesh>
      </group>
      <group ref={rightLeg} position={[0.24, 1, 0]}>
        <mesh castShadow position={[0, -0.48, 0]}>
          <boxGeometry args={[0.3, 0.95, 0.34]} />
          <meshStandardMaterial color="#25314d" flatShading />
        </mesh>
      </group>
    </group>
  );
}

function MovingAvatar({
  onComplete,
  reducedMotion,
  runId,
}: Pick<PhaseTwoArenaProps, 'onComplete' | 'reducedMotion' | 'runId'>) {
  const avatarRef = useRef<Group>(null);
  const activeRef = useRef(false);
  const frameDurationsRef = useRef<number[]>([]);
  const movingRef = useRef(false);
  const routeIndexRef = useRef(0);
  const startedAtRef = useRef(0);

  useEffect(() => {
    const avatar = avatarRef.current;
    if (!avatar || runId === 0) return;
    avatar.position.set(route[0][0], 0.18, route[0][1]);
    activeRef.current = true;
    frameDurationsRef.current = [];
    routeIndexRef.current = 1;
    startedAtRef.current = performance.now();
  }, [runId]);

  useFrame((_, delta) => {
    const avatar = avatarRef.current;
    if (!avatar || !activeRef.current) {
      movingRef.current = false;
      return;
    }

    frameDurationsRef.current.push(delta * 1000);
    const target = route[routeIndexRef.current];
    const distanceX = target[0] - avatar.position.x;
    const distanceZ = target[1] - avatar.position.z;
    const distance = Math.hypot(distanceX, distanceZ);
    const speed = reducedMotion ? 10 : 2.2;

    if (distance < 0.035) {
      avatar.position.set(target[0], 0.18, target[1]);
      routeIndexRef.current += 1;
      if (routeIndexRef.current >= route.length) {
        activeRef.current = false;
        movingRef.current = false;
        const sorted = [...frameDurationsRef.current].sort((a, b) => a - b);
        const medianFrame = sorted[Math.floor(sorted.length / 2)] ?? 0;
        const slowFrame =
          sorted[
            Math.min(sorted.length - 1, Math.floor(sorted.length * 0.99))
          ] ?? 0;
        onComplete({
          frameCount: sorted.length,
          medianFps: medianFrame > 0 ? Math.round(1000 / medianFrame) : 0,
          onePercentLowFps: slowFrame > 0 ? Math.round(1000 / slowFrame) : 0,
          routeDurationMs: Math.round(performance.now() - startedAtRef.current),
        });
      }
      return;
    }

    movingRef.current = true;
    const travel = Math.min(distance, speed * delta);
    avatar.position.x += (distanceX / distance) * travel;
    avatar.position.z += (distanceZ / distance) * travel;
    avatar.rotation.y = Math.atan2(distanceX, distanceZ);
  });

  return (
    <group ref={avatarRef} position={[route[0][0], 0.18, route[0][1]]}>
      <AvatarProxy movingRef={movingRef} />
    </group>
  );
}

function ArenaScene(
  props: Pick<PhaseTwoArenaProps, 'onComplete' | 'reducedMotion' | 'runId'>,
) {
  const routeKeys = useMemo(
    () => new Set(route.map(([x, z]) => `${x}:${z}`)),
    [],
  );

  return (
    <>
      <color attach="background" args={['#87c8ed']} />
      <ambientLight intensity={1.7} />
      <directionalLight
        castShadow
        intensity={2.1}
        position={[5, 10, -4]}
        shadow-mapSize={[512, 512]}
      />
      {Array.from({ length: 36 }, (_, index) => {
        const x = (index % 6) - 2.5;
        const z = Math.floor(index / 6) - 2.5;
        const isRoute = routeKeys.has(`${x}:${z}`);
        return (
          <mesh key={`${x}:${z}`} receiveShadow position={[x, 0, z]}>
            <boxGeometry args={[0.94, 0.16, 0.94]} />
            <meshStandardMaterial
              color={isRoute ? '#f0c96e' : '#5f9f68'}
              flatShading
            />
          </mesh>
        );
      })}
      <mesh castShadow position={[2.5, 0.55, -0.5]}>
        <octahedronGeometry args={[0.42]} />
        <meshStandardMaterial
          color="#ffe166"
          emissive="#e59120"
          emissiveIntensity={1.4}
          flatShading
        />
      </mesh>
      <MovingAvatar {...props} />
    </>
  );
}

export function PhaseTwoArena(props: PhaseTwoArenaProps) {
  const hostRef = useRef<HTMLElement>(null);
  const isVisible = useVisibleRendering(hostRef);

  return (
    <figure className="spike-arena" ref={hostRef}>
      <div className="spike-arena__canvas">
        <Canvas
          aria-hidden="true"
          camera={{ fov: 48, position: [6.8, 7.2, 8.6] }}
          dpr={props.quality === 'low' ? 1 : [1, 1.5]}
          frameloop={isVisible ? 'always' : 'never'}
          shadows={props.quality === 'balanced' ? 'basic' : false}
        >
          <ArenaScene
            onComplete={props.onComplete}
            reducedMotion={props.reducedMotion}
            runId={props.runId}
          />
        </Canvas>
      </div>
      <figcaption>
        Six by six benchmark arena. The highlighted route moves seven cells to
        the beacon. Rendering pauses when this spike is hidden.
      </figcaption>
    </figure>
  );
}
