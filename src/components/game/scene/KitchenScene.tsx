// Главная R3F-сцена кухни.
// First-person статичная камера, без OrbitControls.

import { Canvas } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { useGame } from "@/game/store";
import { Environment } from "./Environment";
import { TableSurface, WORK_SURFACE_POS } from "./Table";
import { TableSlots } from "./TableSlots";
import { Bell, Bowl, Cup, Plate, Stove, WorkSurfaceMarker } from "./KitchenObjects";
import { Hand, type HandTarget } from "./Hand";
import { useActivePick } from "@/game/active-pick";

interface KitchenSceneProps {
  onHoverLabel: (label: string | null) => void;
  onPickIngredient: () => string | null; // возвращает выбранный ингредиент к размещению (или null)
  onBellRing: () => void;
}

export function KitchenScene({ onHoverLabel, onPickIngredient, onBellRing }: KitchenSceneProps) {
  const slots = useGame((s) => s.table_slots);
  const placeFromInventory = useGame((s) => s.placeFromInventory);
  const pickupToInventory = useGame((s) => s.pickupToInventory);
  const eatFromTable = useGame((s) => s.eatFromTable);
  const log = useGame((s) => s.log);

  const [handTarget, setHandTarget] = useState<HandTarget | null>(null);
  const handKeyRef = useRef(0);
  const [progress, setProgress] = useState<{ index: number; ratio: number } | null>(null);

  const fireHand = (pos: [number, number, number], holdMs = 200) => {
    handKeyRef.current += 1;
    setHandTarget({ pos, holdMs, key: handKeyRef.current });
  };

  const handleSlotShortClick = (index: number, worldPos: [number, number, number]) => {
    const slot = slots[index];
    fireHand(worldPos);
    if (slot.ingredient_id) {
      // pickup в инвентарь
      pickupToInventory(index);
    } else {
      // попытаться положить выбранный ингредиент
      const pick = onPickIngredient();
      if (!pick) {
        log("Выберите ингредиент в инвентаре");
        return;
      }
      const [id, quality] = pick.split("|") as [string, "basic" | "premium"];
      placeFromInventory(id, quality);
    }
  };

  const handleSlotLongPress = (index: number, worldPos: [number, number, number]) => {
    fireHand(worldPos, 280);
    eatFromTable(index);
  };

  const handleObjectClick = (label: string, worldPos: [number, number, number]) => {
    fireHand(worldPos, 180);
    log(`Действие: ${label}`);
  };

  return (
    <>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 1.05, 1.6], fov: 55, near: 0.05, far: 50 }}
        gl={{ antialias: true }}
        style={{ width: "100%", height: "100%" }}
      >
        <color attach="background" args={["#f3e6cf"]} />
        <fog attach="fog" args={["#f3e6cf", 6, 14]} />

        {/* Свет */}
        <ambientLight intensity={0.55} />
        <directionalLight
          position={[2.5, 4, 3]}
          intensity={1.1}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[-2, 2, 1]} intensity={0.4} color="#ffb86b" />

        <Environment />
        <TableSurface />

        <Stove
          onClick={(p) => handleObjectClick("Плита", p)}
          onHover={onHoverLabel}
        />
        <Bowl
          onClick={(p) => handleObjectClick("Миска", p)}
          onHover={onHoverLabel}
        />
        <Plate
          onClick={(p) => handleObjectClick("Тарелка", p)}
          onHover={onHoverLabel}
        />
        <Cup
          onClick={(p) => handleObjectClick("Чашка", p)}
          onHover={onHoverLabel}
        />
        <Bell
          onClick={(p) => {
            fireHand(p, 160);
            onBellRing();
          }}
          onHover={onHoverLabel}
        />
        <WorkSurfaceMarker
          position={WORK_SURFACE_POS}
          onClick={(p) => handleObjectClick("Рабочая зона", p)}
          onHover={onHoverLabel}
        />

        <TableSlots
          slots={slots}
          onShortClick={handleSlotShortClick}
          onLongPress={handleSlotLongPress}
          onProgress={(idx, ratio) => setProgress(idx === null ? null : { index: idx, ratio })}
        />

        <Hand target={handTarget} />
      </Canvas>

      <LongPressOverlay progress={progress} />
    </>
  );
}

/** Круговой индикатор long-press поверх 3D-канваса. */
function LongPressOverlay({ progress }: { progress: { index: number; ratio: number } | null }) {
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const move = (e: PointerEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);

  if (!progress) return null;
  const r = 22;
  const c = 2 * Math.PI * r;
  const dash = c * progress.ratio;

  return (
    <svg
      width={64}
      height={64}
      viewBox="0 0 64 64"
      className="pointer-events-none fixed z-30"
      style={{ left: pos.x - 32, top: pos.y - 32 }}
    >
      <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="4" />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke="oklch(0.65 0.16 38)"
        strokeWidth="4"
        strokeDasharray={`${dash} ${c - dash}`}
        strokeDashoffset={c / 4}
        transform="rotate(-90 32 32)"
        strokeLinecap="round"
      />
    </svg>
  );
}
