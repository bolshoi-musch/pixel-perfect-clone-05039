// 5 интерактивных слотов на столе.
// Single-handler model: только onPointerDown стартует жест, onPointerUp решает
// short vs long-press. Short-click = pickup/place. Long-press 600мс = eat (только raw).

import { ThreeEvent } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { useRef, useState } from "react";
import type { TableSlot } from "@/game/types";
import { INGREDIENTS_BY_ID } from "@/game/data";
import { SLOT_POSITIONS } from "./Table";
import { SCENE_COLORS, INGREDIENT_COLOR } from "./colors";

const LONG_PRESS_MS = 600;
const CLICK_GUARD_MS = 150;

interface TableSlotsProps {
  slots: TableSlot[];
  onShortClick: (index: number, worldPos: [number, number, number]) => void;
  onLongPress: (index: number, worldPos: [number, number, number]) => void;
  onProgress: (slotIndex: number | null, ratio: number) => void;
}

export function TableSlots({ slots, onShortClick, onLongPress, onProgress }: TableSlotsProps) {
  // Глобальный guard от двойного срабатывания на одном жесте.
  const lastFireRef = useRef(0);
  return (
    <group>
      {SLOT_POSITIONS.map((pos, i) => (
        <Slot
          key={i}
          index={i}
          position={pos}
          slot={slots[i]}
          lastFireRef={lastFireRef}
          onShortClick={onShortClick}
          onLongPress={onLongPress}
          onProgress={onProgress}
        />
      ))}
    </group>
  );
}

function Slot({
  index,
  position,
  slot,
  lastFireRef,
  onShortClick,
  onLongPress,
  onProgress,
}: {
  index: number;
  position: [number, number, number];
  slot: TableSlot;
  lastFireRef: React.MutableRefObject<number>;
  onShortClick: TableSlotsProps["onShortClick"];
  onLongPress: TableSlotsProps["onLongPress"];
  onProgress: TableSlotsProps["onProgress"];
}) {
  const [hovered, setHovered] = useState(false);
  const pressStartRef = useRef<number | null>(null);
  const longFiredRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  const ing = slot.ingredient_id ? INGREDIENTS_BY_ID.get(slot.ingredient_id) : null;
  const isEdibleRaw = slot.category === "raw";
  const filled = !!ing;

  const tryFire = (kind: "short" | "long") => {
    const now = performance.now();
    if (now - lastFireRef.current < CLICK_GUARD_MS) return false;
    lastFireRef.current = now;
    if (kind === "short") onShortClick(index, position);
    else onLongPress(index, position);
    return true;
  };

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    pressStartRef.current = performance.now();
    longFiredRef.current = false;
    if (filled && isEdibleRaw) {
      const tick = () => {
        if (pressStartRef.current === null) return;
        const elapsed = performance.now() - pressStartRef.current;
        const ratio = Math.min(1, elapsed / LONG_PRESS_MS);
        onProgress(index, ratio);
        if (elapsed >= LONG_PRESS_MS) {
          longFiredRef.current = true;
          pressStartRef.current = null;
          onProgress(null, 0);
          tryFire("long");
          return;
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    }
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    onProgress(null, 0);
    const start = pressStartRef.current;
    pressStartRef.current = null;
    if (longFiredRef.current) return; // long-press уже отработал — не дублируем short
    if (start === null) return;
    const elapsed = performance.now() - start;
    if (elapsed < LONG_PRESS_MS) {
      tryFire("short");
    }
  };

  const cancelPress = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    pressStartRef.current = null;
    onProgress(null, 0);
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = "pointer";
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(false);
    cancelPress();
    document.body.style.cursor = "default";
  };

  return (
    <group
      position={position}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Подложка слота */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <circleGeometry args={[0.24, 32]} />
        <meshStandardMaterial
          color={hovered ? SCENE_COLORS.slotHover : SCENE_COLORS.slotEmpty}
          transparent
          opacity={filled ? 0.6 : 0.4}
          roughness={0.9}
        />
      </mesh>

      {/* Внешняя обводка слота — всегда видна */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.045, 0]}>
        <ringGeometry args={[0.235, 0.255, 32]} />
        <meshBasicMaterial
          color={hovered ? SCENE_COLORS.copper : SCENE_COLORS.woodDark}
          transparent
          opacity={hovered ? 0.95 : 0.55}
        />
      </mesh>

      {/* Номер слота 1..5 */}
      <Text
        position={[0, -0.04, 0.18]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.06}
        color={filled ? SCENE_COLORS.woodDark : SCENE_COLORS.woodDark}
        anchorX="center"
        anchorY="middle"
      >
        {String(index + 1)}
      </Text>

      {/* Содержимое слота — без своих pointer-обработчиков, наследует от группы */}
      {ing && (
        <mesh castShadow position={[0, 0.05, 0]}>
          <sphereGeometry args={[0.12, 18, 18]} />
          <meshStandardMaterial
            color={INGREDIENT_COLOR[ing.id] ?? "#cccccc"}
            roughness={0.6}
          />
        </mesh>
      )}

      {/* Premium-обводка */}
      {ing && slot.quality === "premium" && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.035, 0]}>
          <ringGeometry args={[0.19, 0.215, 24]} />
          <meshBasicMaterial color={SCENE_COLORS.bell} />
        </mesh>
      )}
    </group>
  );
}
