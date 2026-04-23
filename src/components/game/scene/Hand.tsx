// Простая 3D-рука: меш-капсула «вылетает» из-под камеры к мировой точке и обратно.
// Без рига — анимация позиции/масштаба через useFrame и easing.

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Mesh, Vector3 } from "three";
import { SCENE_COLORS } from "./colors";

export type HandPhase = "idle" | "out" | "hold" | "back";

export interface HandTarget {
  pos: [number, number, number];
  /** Сколько времени держать у цели (мс) */
  holdMs?: number;
  /** Триггер пересчёта при одинаковой позиции */
  key: number;
}

interface HandProps {
  target: HandTarget | null;
  onArrived?: () => void;
  onReturned?: () => void;
}

const REST_POS = new Vector3(0.6, -0.55, -0.4);
const tmp = new Vector3();
const lerpFactor = 8;

export function Hand({ target, onArrived, onReturned }: HandProps) {
  const ref = useRef<Mesh>(null);
  const phaseRef = useRef<HandPhase>("idle");
  const arrivedAtRef = useRef<number>(0);
  const lastKeyRef = useRef<number>(-1);

  useFrame((_, dt) => {
    const mesh = ref.current;
    if (!mesh) return;

    // Новая цель?
    if (target && target.key !== lastKeyRef.current) {
      lastKeyRef.current = target.key;
      phaseRef.current = "out";
      arrivedAtRef.current = 0;
    }

    let goal: Vector3;
    if (phaseRef.current === "out" && target) {
      goal = tmp.set(target.pos[0], target.pos[1], target.pos[2]);
    } else if (phaseRef.current === "hold" && target) {
      goal = tmp.set(target.pos[0], target.pos[1], target.pos[2]);
    } else {
      goal = REST_POS;
    }

    const k = 1 - Math.exp(-lerpFactor * dt);
    mesh.position.lerp(goal, k);

    const dist = mesh.position.distanceTo(goal);

    if (phaseRef.current === "out" && dist < 0.06) {
      phaseRef.current = "hold";
      arrivedAtRef.current = performance.now();
      onArrived?.();
    } else if (phaseRef.current === "hold") {
      const hold = target?.holdMs ?? 180;
      if (performance.now() - arrivedAtRef.current >= hold) {
        phaseRef.current = "back";
      }
    } else if (phaseRef.current === "back" && dist < 0.04) {
      phaseRef.current = "idle";
      onReturned?.();
    }
  });

  return (
    <mesh ref={ref} position={REST_POS.toArray()}>
      <capsuleGeometry args={[0.09, 0.18, 6, 12]} />
      <meshStandardMaterial color={SCENE_COLORS.skin} roughness={0.8} />
    </mesh>
  );
}
