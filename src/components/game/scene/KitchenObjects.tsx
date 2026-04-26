// Объекты кухни: плита, миска, тарелка, чашка, звонок. Все интерактивные.

import { ThreeEvent, useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { SCENE_COLORS } from "./colors";
import { ItemShape } from "./ItemShape";
import { EQUIPMENT_POSITIONS } from "@/game/kitchen-layout";

interface ClickableProps {
  position: [number, number, number];
  onClick: (worldPos: [number, number, number]) => void;
  onHover?: (label: string | null) => void;
  label: string;
  attention?: boolean;
  /** Approx XZ radius of the highlight ring placed around the object. */
  attentionRadius?: number;
  children: React.ReactNode;
}

const CLICK_GUARD_MS = 150;

function Clickable({
  position,
  onClick,
  onHover,
  label,
  attention = false,
  attentionRadius = 0.3,
  children,
}: ClickableProps) {
  const [hovered, setHovered] = useState(false);
  const [pulse, setPulse] = useState(0);
  const lastFireRef = useRef(0);
  const downAtRef = useRef<number | null>(null);

  // Soft sin-based pulse for attention ring
  useFrame(({ clock }) => {
    if (attention) setPulse(0.5 + 0.5 * Math.sin(clock.getElapsedTime() * 4));
  });

  const baseScale = hovered ? 1.04 : 1;
  const attnScale = attention ? 1 + 0.04 * pulse : 1;

  return (
    <group
      position={position}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setHovered(true);
        onHover?.(label);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setHovered(false);
        onHover?.(null);
        document.body.style.cursor = "default";
      }}
      onPointerDown={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        downAtRef.current = performance.now();
      }}
      onPointerUp={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        const down = downAtRef.current;
        downAtRef.current = null;
        if (down === null) return;
        const now = performance.now();
        if (now - lastFireRef.current < CLICK_GUARD_MS) return;
        lastFireRef.current = now;
        onClick([position[0], position[1], position[2]]);
      }}
      scale={baseScale * attnScale}
    >
      {children}
      {attention && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -position[1] + 0.005, 0]}>
          <ringGeometry args={[attentionRadius, attentionRadius + 0.06, 40]} />
          <meshBasicMaterial
            color={SCENE_COLORS.highlight}
            transparent
            opacity={0.35 + 0.45 * pulse}
          />
        </mesh>
      )}
    </group>
  );
}

interface EquipProps {
  onClick: ClickableProps["onClick"];
  onHover?: ClickableProps["onHover"];
  attention?: boolean;
}

export function Stove({ onClick, onHover, attention }: EquipProps) {
  return (
    <Clickable
      position={[-1.7, 0.2, -0.4]}
      onClick={onClick}
      onHover={onHover}
      label="Плита"
      attention={attention}
      attentionRadius={0.5}
    >
      {/* Корпус */}
      <mesh castShadow>
        <boxGeometry args={[0.7, 0.4, 0.7]} />
        <meshStandardMaterial color={SCENE_COLORS.steel} roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Конфорка */}
      <mesh position={[0, 0.21, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.03, 24]} />
        <meshStandardMaterial color={SCENE_COLORS.steelDark} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.23, 0]}>
        <torusGeometry args={[0.18, 0.015, 8, 24]} />
        <meshStandardMaterial color="#3a1a1a" emissive="#c44536" emissiveIntensity={0.4} />
      </mesh>
    </Clickable>
  );
}

export function Bowl({ onClick, onHover, attention }: EquipProps) {
  return (
    <Clickable
      position={[-0.7, 0.06, -0.35]}
      onClick={onClick}
      onHover={onHover}
      label="Миска"
      attention={attention}
      attentionRadius={0.28}
    >
      <mesh castShadow>
        <cylinderGeometry args={[0.2, 0.14, 0.16, 24]} />
        <meshStandardMaterial color={SCENE_COLORS.ceramic} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.17, 0.12, 0.1, 24]} />
        <meshStandardMaterial color={SCENE_COLORS.woodDark} roughness={0.6} />
      </mesh>
    </Clickable>
  );
}

export function Plate({ onClick, onHover, attention }: EquipProps) {
  return (
    <Clickable
      position={[0.5, 0.06, -0.35]}
      onClick={onClick}
      onHover={onHover}
      label="Тарелка"
      attention={attention}
      attentionRadius={0.32}
    >
      <mesh castShadow rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.26, 0.22, 0.04, 28]} />
        <meshStandardMaterial color={SCENE_COLORS.ceramic} roughness={0.35} />
      </mesh>
    </Clickable>
  );
}

export function Cup({ onClick, onHover, attention }: EquipProps) {
  return (
    <Clickable
      position={[1.3, 0.1, -0.35]}
      onClick={onClick}
      onHover={onHover}
      label="Чашка"
      attention={attention}
      attentionRadius={0.2}
    >
      <mesh castShadow>
        <cylinderGeometry args={[0.1, 0.085, 0.16, 20]} />
        <meshStandardMaterial color={SCENE_COLORS.ceramic} roughness={0.4} />
      </mesh>
      {/* Ручка */}
      <mesh position={[0.13, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.05, 0.014, 8, 16]} />
        <meshStandardMaterial color={SCENE_COLORS.ceramic} roughness={0.4} />
      </mesh>
    </Clickable>
  );
}

export function Kettle({ onClick, onHover, attention }: EquipProps) {
  return (
    <Clickable
      position={[-1.0, 0.18, -0.4]}
      onClick={onClick}
      onHover={onHover}
      label="Чайник"
      attention={attention}
      attentionRadius={0.32}
    >
      {/* Корпус */}
      <mesh castShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.16, 0.28, 24]} />
        <meshStandardMaterial color={SCENE_COLORS.steel} roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Крышка */}
      <mesh castShadow position={[0, 0.155, 0]}>
        <cylinderGeometry args={[0.1, 0.12, 0.04, 20]} />
        <meshStandardMaterial color={SCENE_COLORS.steelDark} roughness={0.4} metalness={0.7} />
      </mesh>
      {/* Кнопка-набалдашник */}
      <mesh castShadow position={[0, 0.19, 0]}>
        <sphereGeometry args={[0.025, 12, 12]} />
        <meshStandardMaterial color={SCENE_COLORS.bell} metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Носик */}
      <mesh castShadow position={[0.18, 0.05, 0]} rotation={[0, 0, -Math.PI / 3]}>
        <coneGeometry args={[0.045, 0.18, 12]} />
        <meshStandardMaterial color={SCENE_COLORS.steel} roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Ручка */}
      <mesh castShadow position={[-0.18, 0.06, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.07, 0.018, 8, 18, Math.PI]} />
        <meshStandardMaterial color={SCENE_COLORS.steelDark} roughness={0.5} metalness={0.5} />
      </mesh>
    </Clickable>
  );
}

export function Bell({
  onClick,
  onHover,
  attention = false,
}: {
  onClick: ClickableProps["onClick"];
  onHover?: ClickableProps["onHover"];
  attention?: boolean;
}) {
  const scale = attention ? 1.35 : 1;
  const emissive = attention ? 0.6 : 0.05;
  return (
    <Clickable position={[1.55, 0.08, 0.2]} onClick={onClick} onHover={onHover} label="Звонок гостя 🛎">
      <group scale={scale}>
        {/* Подставка */}
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.16, 0.18, 0.035, 28]} />
          <meshStandardMaterial color={SCENE_COLORS.bellBase} roughness={0.5} />
        </mesh>
        {/* Купол колокольчика */}
        <mesh position={[0, 0.105, 0]} castShadow>
          <sphereGeometry args={[0.13, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial
            color={SCENE_COLORS.bell}
            roughness={0.25}
            metalness={0.85}
            emissive={SCENE_COLORS.bell}
            emissiveIntensity={emissive}
          />
        </mesh>
        {/* Кнопка-«пуговица» сверху */}
        <mesh position={[0, 0.235, 0]} castShadow>
          <sphereGeometry args={[0.028, 16, 16]} />
          <meshStandardMaterial
            color={SCENE_COLORS.bell}
            metalness={0.85}
            emissive={SCENE_COLORS.bell}
            emissiveIntensity={emissive}
          />
        </mesh>
        {attention && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
            <ringGeometry args={[0.22, 0.27, 32]} />
            <meshBasicMaterial color={SCENE_COLORS.bell} transparent opacity={0.6} />
          </mesh>
        )}
      </group>
    </Clickable>
  );
}

// Visual marker «рабочей зоны» (work_surface) — мягкий контур на столе
export function WorkSurfaceMarker({
  onClick,
  onHover,
  position,
  attention,
}: {
  position: [number, number, number];
  onClick: ClickableProps["onClick"];
  onHover?: ClickableProps["onHover"];
  attention?: boolean;
}) {
  return (
    <Clickable
      position={position}
      onClick={onClick}
      onHover={onHover}
      label="Рабочая зона"
      attention={attention}
      attentionRadius={0.3}
    >
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <ringGeometry args={[0.22, 0.27, 32]} />
        <meshBasicMaterial color={SCENE_COLORS.copper} transparent opacity={0.5} />
      </mesh>
    </Clickable>
  );
}
