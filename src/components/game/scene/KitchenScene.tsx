// Главная R3F-сцена кухни.
// First-person статичная камера, без OrbitControls.

import { Canvas } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { useGame } from "@/game/store";
import { useOrderEngine, expectedEquipmentForStep } from "@/game/order-engine";
import { STEPS_BY_ID, RECIPES_BY_ID } from "@/game/data";
import { Environment } from "./Environment";
import { TableSurface, WORK_SURFACE_POS } from "./Table";
import { TableSlots } from "./TableSlots";
import {
  Bell,
  Blender,
  Bowl,
  Cup,
  Kettle,
  Plate,
  RiceCooker,
  Stove,
  Toaster,
  WorkSurfaceMarker,
} from "./KitchenObjects";
import { Hand, type HandTarget } from "./Hand";
import { useActivePick } from "@/game/active-pick";

interface KitchenSceneProps {
  onHoverLabel: (label: string | null) => void;
  onPickIngredient: () => string | null;
  onObjectAction: (equipment_id: string, label: string) => void;
  onBellRing: () => void;
}

export function KitchenScene({
  onHoverLabel,
  onPickIngredient,
  onObjectAction,
  onBellRing,
}: KitchenSceneProps) {
  const slots = useGame((s) => s.table_slots);
  const equipmentOwned = useGame((s) => s.equipment_owned);
  const placeFromInventory = useGame((s) => s.placeFromInventory);
  const pickupToInventory = useGame((s) => s.pickupToInventory);
  const eatFromTable = useGame((s) => s.eatFromTable);
  const log = useGame((s) => s.log);
  const setLastClickedTarget = useGame((s) => s.setLastClickedTarget);

  const [handTarget, setHandTarget] = useState<HandTarget | null>(null);
  const handKeyRef = useRef(0);
  const [progress, setProgress] = useState<{ index: number; ratio: number } | null>(null);

  // Highlight target equipment for the current step.
  const orderProgress = useOrderEngine((s) => s.progress);
  const activeTarget = (() => {
    if (!orderProgress) return null;
    if (orderProgress.finished) return "bell";
    const recipe = RECIPES_BY_ID.get(orderProgress.recipe_id);
    const stepId = recipe?.step_ids[orderProgress.step_index];
    const step = stepId ? STEPS_BY_ID.get(stepId) : undefined;
    return step ? expectedEquipmentForStep(step) : null;
  })();

  // What to render inside bowl/plate/cup based on currently prepared items.
  const prepared = orderProgress?.prepared ?? [];
  const pickFirst = (...ids: string[]) => ids.find((id) => prepared.includes(id)) ?? null;
  const bowlContent = pickFirst("egg_mix", "egg_in_bowl");
  const plateContent = pickFirst("plated_omelet", "omelet_cooked");
  const cupContent = pickFirst("tea_brewed", "tea_with_leaves", "hot_water");

  const fireHand = (pos: [number, number, number], holdMs = 200) => {
    handKeyRef.current += 1;
    setHandTarget({ pos, holdMs, key: handKeyRef.current });
  };

  const setPick = useActivePick((s) => s.setPick);

  const handleSlotShortClick = (index: number, worldPos: [number, number, number]) => {
    setLastClickedTarget(`slot[${index}]`);
    const slot = slots[index];
    fireHand(worldPos);
    if (slot.ingredient_id) {
      pickupToInventory(index);
    } else {
      const pick = onPickIngredient();
      if (!pick) {
        log("Выберите ингредиент в «Продукты»");
        return;
      }
      const [id, quality] = pick.split("|") as [string, "basic" | "premium"];
      const placed = placeFromInventory(id, quality);
      if (placed >= 0) setPick(null);
    }
  };

  const handleSlotLongPress = (index: number, worldPos: [number, number, number]) => {
    setLastClickedTarget(`slot[${index}] (long)`);
    fireHand(worldPos, 280);
    eatFromTable(index);
  };

  const handleObjectClick = (
    equipment_id: string,
    label: string,
    worldPos: [number, number, number],
  ) => {
    setLastClickedTarget(`${label} (${equipment_id})`);
    fireHand(worldPos, 180);
    onObjectAction(equipment_id, label);
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
          attention={activeTarget === "stove"}
          onClick={(p) => handleObjectClick("stove", "Плита", p)}
          onHover={onHoverLabel}
        />
        {equipmentOwned.includes("kettle") && (
          <Kettle
            attention={activeTarget === "kettle"}
            onClick={(p) => handleObjectClick("kettle", "Чайник", p)}
            onHover={onHoverLabel}
          />
        )}
        {equipmentOwned.includes("toaster") && (
          <Toaster
            attention={activeTarget === "toaster"}
            onClick={(p) => handleObjectClick("toaster", "Тостер", p)}
            onHover={onHoverLabel}
          />
        )}
        {equipmentOwned.includes("blender") && (
          <Blender
            attention={activeTarget === "blender"}
            onClick={(p) => handleObjectClick("blender", "Блендер", p)}
            onHover={onHoverLabel}
          />
        )}
        {equipmentOwned.includes("rice_cooker") && (
          <RiceCooker
            attention={activeTarget === "rice_cooker"}
            onClick={(p) => handleObjectClick("rice_cooker", "Рисоварка", p)}
            onHover={onHoverLabel}
          />
        )}
        <Bowl
          attention={activeTarget === "bowl"}
          content={bowlContent}
          onClick={(p) => handleObjectClick("bowl", "Миска", p)}
          onHover={onHoverLabel}
        />
        <Plate
          attention={activeTarget === "plate"}
          content={plateContent}
          onClick={(p) => handleObjectClick("plate", "Тарелка", p)}
          onHover={onHoverLabel}
        />
        <Cup
          attention={activeTarget === "cup"}
          content={cupContent}
          onClick={(p) => handleObjectClick("cup", "Чашка", p)}
          onHover={onHoverLabel}
        />
        <Bell
          attention={activeTarget === "bell"}
          onClick={(p) => {
            fireHand(p, 160);
            onBellRing();
          }}
          onHover={onHoverLabel}
        />
        <WorkSurfaceMarker
          position={WORK_SURFACE_POS}
          attention={activeTarget === "work_surface"}
          onClick={(p) => handleObjectClick("work_surface", "Рабочая зона", p)}
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
