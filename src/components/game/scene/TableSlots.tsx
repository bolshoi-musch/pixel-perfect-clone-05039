// 5 интерактивных слотов на столе. Click = pickup в инвентарь, long-press 600мс = eat (только raw).

import { ThreeEvent } from "@react-three/fiber";
import { useRef, useState } from "react";
import type { TableSlot } from "@/game/types";
import { INGREDIENTS_BY_ID } from "@/game/data";
import { SLOT_POSITIONS } from "./Table";
import { SCENE_COLORS, INGREDIENT_COLOR } from "./colors";

const LONG_PRESS_MS = 600;

interface TableSlotsProps {
  slots: TableSlot[];
  onShortClick: (index: number, worldPos: [number, number, number]) => void;
  onLongPress: (index: number, worldPos: [number, number, number]) => void;
  onProgress: (slotIndex: number | null, ratio: number) => void;
}

export function TableSlots({ slots, onShortClick, onLongPress, onProgress }: TableSlotsProps) {
  return (
    <group>
      {SLOT_POSITIONS.map((pos, i) => (
        <Slot
          key={i}
          index={i}
          position={pos}
          slot={slots[i]}
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
  onShortClick,
  onLongPress,
  onProgress,
}: {
  index: number;
  position: [number, number, number];
  slot: TableSlot;
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

  const startPress = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!ing) return;
    pressStartRef.current = performance.now();
    longFiredRef.current = false;
    if (isEdibleRaw) {
      const tick = () => {
        if (pressStartRef.current === null) return;
        const elapsed = performance.now() - pressStartRef.current;
        const ratio = Math.min(1, elapsed / LONG_PRESS_MS);
        onProgress(index, ratio);
        if (elapsed >= LONG_PRESS_MS) {
          longFiredRef.current = true;
          pressStartRef.current = null;
          onProgress(null, 0);
          onLongPress(index, position);
          return;
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    }
  };

  const endPress = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    onProgress(null, 0);
    if (pressStartRef.current === null) return;
    const elapsed = performance.now() - pressStartRef.current;
    pressStartRef.current = null;
    if (!longFiredRef.current && elapsed < LONG_PRESS_MS) {
      onShortClick(index, position);
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

  return (
    <group position={position}>
      {/* Подложка слота */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.05, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = ing ? "pointer" : "default";
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          cancelPress();
          document.body.style.cursor = "default";
        }}
        onPointerDown={startPress}
        onPointerUp={endPress}
      >
        <circleGeometry args={[0.22, 28]} />
        <meshStandardMaterial
          color={hovered ? SCENE_COLORS.slotHover : SCENE_COLORS.slotEmpty}
          transparent
          opacity={ing ? 0.55 : 0.35}
          roughness={0.9}
        />
      </mesh>

      {/* Содержимое слота */}
      {ing && (
        <mesh
          castShadow
          onPointerDown={startPress}
          onPointerUp={endPress}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            setHovered(false);
            cancelPress();
            document.body.style.cursor = "default";
          }}
        >
          <sphereGeometry args={[0.12, 18, 18]} />
          <meshStandardMaterial
            color={INGREDIENT_COLOR[ing.id] ?? "#cccccc"}
            roughness={0.6}
          />
        </mesh>
      )}

      {/* Premium-обводка */}
      {ing && slot.quality === "premium" && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
          <ringGeometry args={[0.18, 0.21, 24]} />
          <meshBasicMaterial color={SCENE_COLORS.bell} />
        </mesh>
      )}
    </group>
  );
}
