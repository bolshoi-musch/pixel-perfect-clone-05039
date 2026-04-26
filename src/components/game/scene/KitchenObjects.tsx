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
  /** Если задан id готового продукта — показать его внутри (для bowl/plate/cup). */
  content?: string | null;
}

export function Stove({ onClick, onHover, attention }: EquipProps) {
  return (
    <Clickable
      position={EQUIPMENT_POSITIONS.stove}
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
      {/* Ручки управления спереди */}
      <mesh position={[-0.2, -0.05, 0.36]}>
        <cylinderGeometry args={[0.025, 0.025, 0.04, 12]} />
        <meshStandardMaterial color={SCENE_COLORS.steelDark} />
      </mesh>
      <mesh position={[0.2, -0.05, 0.36]}>
        <cylinderGeometry args={[0.025, 0.025, 0.04, 12]} />
        <meshStandardMaterial color={SCENE_COLORS.steelDark} />
      </mesh>
    </Clickable>
  );
}

export function Bowl({ onClick, onHover, attention, content }: EquipProps) {
  return (
    <Clickable
      position={EQUIPMENT_POSITIONS.bowl}
      onClick={onClick}
      onHover={onHover}
      label="Миска"
      attention={attention}
      attentionRadius={0.28}
    >
      {/* Внешняя стенка миски */}
      <mesh castShadow>
        <cylinderGeometry args={[0.2, 0.13, 0.14, 28]} />
        <meshStandardMaterial color={SCENE_COLORS.ceramic} roughness={0.45} />
      </mesh>
      {/* Внутренняя «впадина» */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.17, 0.1, 0.1, 28]} />
        <meshStandardMaterial color={SCENE_COLORS.woodLight} roughness={0.7} />
      </mesh>
      {content && (
        <group position={[0, 0.06, 0]}>
          <ItemShape itemId={content} scale={0.9} />
        </group>
      )}
    </Clickable>
  );
}

export function Plate({ onClick, onHover, attention, content }: EquipProps) {
  return (
    <Clickable
      position={EQUIPMENT_POSITIONS.plate}
      onClick={onClick}
      onHover={onHover}
      label="Тарелка"
      attention={attention}
      attentionRadius={0.32}
    >
      {/* Бортик */}
      <mesh castShadow>
        <cylinderGeometry args={[0.27, 0.24, 0.025, 32]} />
        <meshStandardMaterial color={SCENE_COLORS.ceramic} roughness={0.35} />
      </mesh>
      {/* Углубление */}
      <mesh position={[0, 0.013, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.008, 32]} />
        <meshStandardMaterial color="#fff8ec" roughness={0.4} />
      </mesh>
      {content && (
        <group position={[0, 0.02, 0]}>
          <ItemShape itemId={content} scale={1} />
        </group>
      )}
    </Clickable>
  );
}

export function Cup({ onClick, onHover, attention, content }: EquipProps) {
  return (
    <Clickable
      position={EQUIPMENT_POSITIONS.cup}
      onClick={onClick}
      onHover={onHover}
      label="Чашка"
      attention={attention}
      attentionRadius={0.2}
    >
      {/* Корпус */}
      <mesh castShadow>
        <cylinderGeometry args={[0.1, 0.085, 0.16, 24]} />
        <meshStandardMaterial color={SCENE_COLORS.ceramic} roughness={0.4} />
      </mesh>
      {/* Внутренняя темная полость */}
      <mesh position={[0, 0.07, 0]}>
        <cylinderGeometry args={[0.085, 0.075, 0.02, 20]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.8} />
      </mesh>
      {/* Ручка */}
      <mesh position={[0.13, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.05, 0.014, 8, 16]} />
        <meshStandardMaterial color={SCENE_COLORS.ceramic} roughness={0.4} />
      </mesh>
      {content && (
        <group position={[0, 0.075, 0]}>
          <ItemShape itemId={content} scale={0.85} />
        </group>
      )}
    </Clickable>
  );
}

export function Kettle({ onClick, onHover, attention }: EquipProps) {
  return (
    <Clickable
      position={EQUIPMENT_POSITIONS.kettle}
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
    <Clickable position={EQUIPMENT_POSITIONS.bell} onClick={onClick} onHover={onHover} label="Звонок гостя 🛎">
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
