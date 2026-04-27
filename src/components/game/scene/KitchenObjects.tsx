// Объекты кухни: плита, миска, тарелка, чашка, звонок. Все интерактивные.
// Визуал — стабильные low-poly примитивы (откат GLTF-интеграции).

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

// === Fallback-примитивы (используются, если GLTF не загрузился) ===

function StoveFallback() {
  return (
    <>
      <mesh castShadow>
        <boxGeometry args={[0.7, 0.4, 0.7]} />
        <meshStandardMaterial color={SCENE_COLORS.steel} roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.205, 0]} castShadow>
        <boxGeometry args={[0.66, 0.02, 0.66]} />
        <meshStandardMaterial color="#1d1d1d" roughness={0.6} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.232, 0]}>
        <torusGeometry args={[0.18, 0.012, 8, 28]} />
        <meshStandardMaterial color="#3a1a1a" emissive="#c44536" emissiveIntensity={0.5} />
      </mesh>
    </>
  );
}

function BowlFallback() {
  return (
    <mesh castShadow>
      <cylinderGeometry args={[0.22, 0.12, 0.13, 32]} />
      <meshStandardMaterial color={SCENE_COLORS.ceramic} roughness={0.45} />
    </mesh>
  );
}

function PlateFallback() {
  return (
    <mesh castShadow>
      <cylinderGeometry args={[0.27, 0.24, 0.025, 32]} />
      <meshStandardMaterial color={SCENE_COLORS.ceramic} roughness={0.35} />
    </mesh>
  );
}

function CupFallback() {
  return (
    <mesh castShadow>
      <cylinderGeometry args={[0.1, 0.085, 0.16, 24]} />
      <meshStandardMaterial color={SCENE_COLORS.ceramic} roughness={0.4} />
    </mesh>
  );
}

function KettleFallback() {
  return (
    <>
      <mesh castShadow>
        <cylinderGeometry args={[0.18, 0.16, 0.28, 24]} />
        <meshStandardMaterial color={SCENE_COLORS.steel} roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh castShadow position={[0.18, 0.05, 0]} rotation={[0, 0, -Math.PI / 3]}>
        <coneGeometry args={[0.045, 0.18, 12]} />
        <meshStandardMaterial color={SCENE_COLORS.steel} roughness={0.3} metalness={0.7} />
      </mesh>
    </>
  );
}

// === Объекты ===

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
      <StoveFallback />
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
      <BowlFallback />
      {content && (
        <group position={[0, 0.07, 0]}>
          <ItemShape itemId={content} scale={1.1} />
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
      <PlateFallback />
      {content && (
        <group position={[0, 0.04, 0]}>
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
      <CupFallback />
      {content && (
        <group position={[0, 0.06, 0]}>
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
      <KettleFallback />
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
  // Уменьшено в ~2.5 раза против предыдущего варианта.
  const scale = attention ? 1.1 : 1;
  const emissive = attention ? 0.55 : 0.08;
  return (
    <Clickable
      position={EQUIPMENT_POSITIONS.bell}
      onClick={onClick}
      onHover={onHover}
      label="Звонок гостя 🛎"
      attentionRadius={0.08}
    >
      <group scale={scale * 0.5}>
        {/* Подставка */}
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.09, 0.02, 24]} />
          <meshStandardMaterial color={SCENE_COLORS.bellBase} roughness={0.6} />
        </mesh>
        {/* Купол */}
        <mesh position={[0, 0.05, 0]} castShadow>
          <sphereGeometry args={[0.06, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial
            color={SCENE_COLORS.bell}
            roughness={0.25}
            metalness={0.85}
            emissive={SCENE_COLORS.bell}
            emissiveIntensity={emissive}
          />
        </mesh>
        {/* Кнопка-«пуговица» */}
        <mesh position={[0, 0.11, 0]} castShadow>
          <sphereGeometry args={[0.014, 14, 14]} />
          <meshStandardMaterial
            color={SCENE_COLORS.bell}
            metalness={0.85}
            emissive={SCENE_COLORS.bell}
            emissiveIntensity={emissive}
          />
        </mesh>
      </group>
    </Clickable>
  );
}

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

export function Toaster({ onClick, onHover, attention }: EquipProps) {
  // Нет готовой модели тостера — оставляем примитив.
  return (
    <Clickable
      position={EQUIPMENT_POSITIONS.toaster}
      onClick={onClick}
      onHover={onHover}
      label="Тостер"
      attention={attention}
      attentionRadius={0.3}
    >
      <mesh castShadow>
        <boxGeometry args={[0.4, 0.3, 0.25]} />
        <meshStandardMaterial color={SCENE_COLORS.steel} roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[-0.08, 0.16, 0]}>
        <boxGeometry args={[0.1, 0.02, 0.18]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.08, 0.16, 0]}>
        <boxGeometry args={[0.1, 0.02, 0.18]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
    </Clickable>
  );
}

export function Blender({ onClick, onHover, attention }: EquipProps) {
  return (
    <Clickable
      position={EQUIPMENT_POSITIONS.blender}
      onClick={onClick}
      onHover={onHover}
      label="Блендер"
      attention={attention}
      attentionRadius={0.3}
    >
      <mesh castShadow position={[0, -0.05, 0]}>
        <cylinderGeometry args={[0.15, 0.18, 0.18, 16]} />
        <meshStandardMaterial color={SCENE_COLORS.steelDark} roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh castShadow position={[0, 0.13, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.26, 16]} />
        <meshStandardMaterial color="#dce8f0" transparent opacity={0.55} roughness={0.1} />
      </mesh>
    </Clickable>
  );
}

export function RiceCooker({ onClick, onHover, attention }: EquipProps) {
  return (
    <Clickable
      position={EQUIPMENT_POSITIONS.rice_cooker}
      onClick={onClick}
      onHover={onHover}
      label="Рисоварка"
      attention={attention}
      attentionRadius={0.32}
    >
      <mesh castShadow>
        <cylinderGeometry args={[0.22, 0.24, 0.3, 24]} />
        <meshStandardMaterial color={SCENE_COLORS.ceramic} roughness={0.6} />
      </mesh>
      <mesh castShadow position={[0, 0.17, 0]}>
        <cylinderGeometry args={[0.2, 0.22, 0.04, 24]} />
        <meshStandardMaterial color={SCENE_COLORS.steelDark} roughness={0.4} metalness={0.5} />
      </mesh>
    </Clickable>
  );
}
