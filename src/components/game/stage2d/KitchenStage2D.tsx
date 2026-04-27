// 2.5D-сцена кухни. Чистый React + CSS + inline SVG, без Three.js.
// Слои:
//   1. background  — стены/пол/контр-топ
//   2. equipment   — плита/чайник/тостер/блендер/рисоварка (фон)
//   3. table       — стол с 5 слотами и рабочей зоной
//   4. vessels     — миска/тарелка/чашка (на столе)
//   5. trigger     — звонок (передний план)
//   6. hotspots    — кликабельные зоны + hover labels
//
// Колбэки совместимы с KitchenScene: onObjectAction(equipment_id, label) и onBellRing().
//
// Подсветка целевого объекта берётся из текущего шага через order-engine + expectedEquipmentForStep.
// Визуальные состояния (bowl/plate/cup/kettle/stove) берутся из selectKitchenVisualState.

import { useEffect, useRef, useState } from "react";
import { useGame } from "@/game/store";
import { useActivePick } from "@/game/active-pick";
import { useOrderEngine, expectedEquipmentForStep } from "@/game/order-engine";
import { STEPS_BY_ID, RECIPES_BY_ID, INGREDIENTS_BY_ID } from "@/game/data";
import {
  selectKitchenVisualState,
  type BowlVisualState,
  type CupVisualState,
  type KettleVisualState,
  type PlateVisualState,
  type StoveVisualState,
} from "@/game/derived-state";
import { getItemVisual } from "@/game/item-visuals";

interface KitchenStage2DProps {
  onHoverLabel: (label: string | null) => void;
  onPickIngredient: () => string | null;
  onObjectAction: (equipment_id: string, label: string) => void;
  onBellRing: () => void;
}

const LONG_PRESS_MS = 600;

export function KitchenStage2D({
  onHoverLabel,
  onPickIngredient,
  onObjectAction,
  onBellRing,
}: KitchenStage2DProps) {
  const slots = useGame((s) => s.table_slots);
  const equipmentOwned = useGame((s) => s.equipment_owned);
  const placeFromInventory = useGame((s) => s.placeFromInventory);
  const pickupToInventory = useGame((s) => s.pickupToInventory);
  const eatFromTable = useGame((s) => s.eatFromTable);
  const log = useGame((s) => s.log);
  const setLastClickedTarget = useGame((s) => s.setLastClickedTarget);
  const setPick = useActivePick((s) => s.setPick);

  const orderProgress = useOrderEngine((s) => s.progress);

  const { activeTarget, activeStepId } = (() => {
    if (!orderProgress) return { activeTarget: null as string | null, activeStepId: null as string | null };
    if (orderProgress.finished) return { activeTarget: "bell", activeStepId: null };
    const recipe = RECIPES_BY_ID.get(orderProgress.recipe_id);
    const stepId = recipe?.step_ids[orderProgress.step_index] ?? null;
    const step = stepId ? STEPS_BY_ID.get(stepId) : undefined;
    return {
      activeTarget: step ? expectedEquipmentForStep(step) : null,
      activeStepId: stepId,
    };
  })();

  const visual = selectKitchenVisualState(orderProgress, activeStepId);

  const handleObject = (equipment_id: string, label: string) => {
    setLastClickedTarget(`${label} (${equipment_id})`);
    onObjectAction(equipment_id, label);
  };

  const handleSlotShortClick = (index: number) => {
    setLastClickedTarget(`slot[${index}]`);
    const slot = slots[index];
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

  const handleSlotLongPress = (index: number) => {
    setLastClickedTarget(`slot[${index}] (long)`);
    eatFromTable(index);
  };

  return (
    <div className="absolute inset-0 select-none overflow-hidden">
      {/* === Layer 1: Background — стены, пол, кафельный фартук === */}
      <Background />

      {/* === Layer 2: Equipment row (back wall) === */}
      <div className="absolute inset-x-0 top-[18%] z-10 flex justify-center">
        <div className="flex w-full max-w-5xl items-end justify-between gap-2 px-6">
          <Hotspot
            label="Плита"
            attention={activeTarget === "stove"}
            onHover={onHoverLabel}
            onClick={() => handleObject("stove", "Плита")}
          >
            <StoveSprite state={visual.stove} />
          </Hotspot>

          {equipmentOwned.includes("kettle") && (
            <Hotspot
              label="Чайник"
              attention={activeTarget === "kettle"}
              onHover={onHoverLabel}
              onClick={() => handleObject("kettle", "Чайник")}
            >
              <KettleSprite state={visual.kettle} />
            </Hotspot>
          )}

          {equipmentOwned.includes("toaster") && (
            <Hotspot
              label="Тостер"
              attention={activeTarget === "toaster"}
              onHover={onHoverLabel}
              onClick={() => handleObject("toaster", "Тостер")}
            >
              <ToasterSprite />
            </Hotspot>
          )}

          {equipmentOwned.includes("blender") && (
            <Hotspot
              label="Блендер"
              attention={activeTarget === "blender"}
              onHover={onHoverLabel}
              onClick={() => handleObject("blender", "Блендер")}
            >
              <BlenderSprite />
            </Hotspot>
          )}

          {equipmentOwned.includes("rice_cooker") && (
            <Hotspot
              label="Рисоварка"
              attention={activeTarget === "rice_cooker"}
              onHover={onHoverLabel}
              onClick={() => handleObject("rice_cooker", "Рисоварка")}
            >
              <RiceCookerSprite />
            </Hotspot>
          )}
        </div>
      </div>

      {/* === Layer 3: Table — стол с дощатой текстурой === */}
      <Table />

      {/* === Layer 4: Vessels (миска, тарелка, чашка) — на столе === */}
      <div className="absolute inset-x-0 bottom-[36%] z-20 flex justify-center">
        <div className="flex w-full max-w-3xl items-end justify-around px-10">
          <Hotspot
            label="Миска"
            attention={activeTarget === "bowl"}
            onHover={onHoverLabel}
            onClick={() => handleObject("bowl", "Миска")}
          >
            <BowlSprite state={visual.bowl} />
          </Hotspot>

          <Hotspot
            label="Тарелка"
            attention={activeTarget === "plate"}
            onHover={onHoverLabel}
            onClick={() => handleObject("plate", "Тарелка")}
          >
            <PlateSprite state={visual.plate} />
          </Hotspot>

          <Hotspot
            label="Чашка"
            attention={activeTarget === "cup"}
            onHover={onHoverLabel}
            onClick={() => handleObject("cup", "Чашка")}
          >
            <CupSprite state={visual.cup} />
          </Hotspot>
        </div>
      </div>

      {/* === Layer 5: Bell + Work surface (передний край стола) === */}
      <div className="absolute inset-x-0 bottom-[20%] z-30 flex justify-center">
        <div className="flex w-full max-w-4xl items-end justify-between px-12">
          <Hotspot
            label="Рабочая зона"
            attention={activeTarget === "work_surface"}
            onHover={onHoverLabel}
            onClick={() => handleObject("work_surface", "Рабочая зона")}
            subtle
          >
            <WorkSurfaceSprite />
          </Hotspot>

          <Hotspot
            label="Звонок"
            attention={activeTarget === "bell"}
            onHover={onHoverLabel}
            onClick={() => onBellRing()}
          >
            <BellSprite pulse={activeTarget === "bell"} />
          </Hotspot>
        </div>
      </div>

      {/* === Layer 6: Table slots === */}
      <div className="absolute inset-x-0 bottom-[6%] z-30 flex justify-center px-4">
        <div className="flex w-full max-w-3xl items-center justify-between gap-2">
          {slots.map((slot, i) => (
            <TableSlot2D
              key={i}
              index={i}
              ingredient_id={slot.ingredient_id}
              quality={slot.quality}
              category={slot.category}
              onShortClick={handleSlotShortClick}
              onLongPress={handleSlotLongPress}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────── Background & Table ─────────────────────────── */

function Background() {
  return (
    <div className="absolute inset-0 z-0">
      {/* Стена */}
      <div
        className="absolute inset-x-0 top-0 h-[55%]"
        style={{
          background:
            "linear-gradient(180deg, #f1e2c4 0%, #ead5ad 60%, #d8bf8e 100%)",
        }}
      />
      {/* Кафельный фартук */}
      <div
        className="absolute inset-x-0 top-[40%] h-[18%] opacity-50"
        style={{
          backgroundImage:
            "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
          backgroundSize: "44px 28px",
          backgroundPosition: "center",
        }}
      />
      {/* Пол */}
      <div
        className="absolute inset-x-0 bottom-0 h-[45%]"
        style={{
          background:
            "linear-gradient(180deg, #b3946a 0%, #8a6d48 60%, #6e5436 100%)",
        }}
      />
      {/* Лёгкий виньетинг */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.18) 100%)",
        }}
      />
    </div>
  );
}

function Table() {
  return (
    <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center">
      <div
        className="h-[45%] w-full max-w-6xl"
        style={{
          background:
            "linear-gradient(180deg, #c69a68 0%, #a87a4c 35%, #8a5e36 100%)",
          boxShadow:
            "inset 0 6px 12px rgba(255,255,255,0.18), inset 0 -10px 16px rgba(0,0,0,0.25)",
          backgroundImage: `repeating-linear-gradient(
            90deg,
            transparent 0px,
            transparent 90px,
            rgba(0,0,0,0.08) 90px,
            rgba(0,0,0,0.08) 91px
          )`,
        }}
      />
    </div>
  );
}

/* ──────────────────────────── Hotspot wrapper ─────────────────────────── */

function Hotspot({
  label,
  attention,
  subtle,
  onHover,
  onClick,
  children,
}: {
  label: string;
  attention?: boolean;
  subtle?: boolean;
  onHover: (l: string | null) => void;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerEnter={() => onHover(label)}
      onPointerLeave={() => onHover(null)}
      className={`group pointer-events-auto relative cursor-pointer rounded-2xl p-2 transition ${
        attention
          ? "ring-4 ring-primary/80 ring-offset-2 ring-offset-transparent animate-pulse"
          : subtle
            ? "ring-1 ring-border/40 hover:ring-border"
            : "hover:ring-2 hover:ring-foreground/30"
      }`}
      aria-label={label}
    >
      {children}
    </button>
  );
}

/* ──────────────────────────── Sprites (SVG) ─────────────────────────── */

function StoveSprite({ state }: { state: StoveVisualState }) {
  const burner = state === "active" ? "#ff7a3a" : "#3a3a3a";
  return (
    <svg width="140" height="120" viewBox="0 0 140 120" aria-hidden>
      {/* Корпус */}
      <rect x="6" y="20" width="128" height="92" rx="8" fill="#cfcfd2" stroke="#6e6e72" strokeWidth="2" />
      {/* Задняя панель */}
      <rect x="6" y="6" width="128" height="22" rx="6" fill="#9d9da3" stroke="#6e6e72" strokeWidth="2" />
      {/* Регуляторы */}
      <circle cx="30" cy="17" r="4" fill="#2a2a2e" />
      <circle cx="55" cy="17" r="4" fill="#2a2a2e" />
      <circle cx="85" cy="17" r="4" fill="#2a2a2e" />
      <circle cx="110" cy="17" r="4" fill="#2a2a2e" />
      {/* Конфорки */}
      <circle cx="40" cy="60" r="16" fill="#1a1a1e" />
      <circle cx="40" cy="60" r="11" fill={burner} />
      <circle cx="100" cy="60" r="16" fill="#1a1a1e" />
      <circle cx="100" cy="60" r="11" fill="#3a3a3a" />
      {/* Дверца духовки */}
      <rect x="14" y="84" width="112" height="22" rx="3" fill="#8d8d92" stroke="#5a5a5e" strokeWidth="1.5" />
      <rect x="42" y="92" width="56" height="6" rx="2" fill="#2a2a2e" />
      {state === "active" && (
        <g>
          <ellipse cx="40" cy="48" rx="6" ry="3" fill="#ffb070" opacity="0.7">
            <animate attributeName="cy" values="48;42;48" dur="1.2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.7;0.2;0.7" dur="1.2s" repeatCount="indefinite" />
          </ellipse>
        </g>
      )}
    </svg>
  );
}

function KettleSprite({ state }: { state: KettleVisualState }) {
  const showSteam = state === "boiling" || state === "ready";
  return (
    <svg width="110" height="110" viewBox="0 0 110 110" aria-hidden>
      {/* Корпус */}
      <path
        d="M22 50 Q22 38 36 36 L74 36 Q88 38 88 50 L88 86 Q88 96 78 96 L32 96 Q22 96 22 86 Z"
        fill="#d6d6db"
        stroke="#5a5a5e"
        strokeWidth="2"
      />
      {/* Носик */}
      <path d="M22 56 L8 50 L8 56 L22 64 Z" fill="#c0c0c5" stroke="#5a5a5e" strokeWidth="2" />
      {/* Ручка */}
      <path
        d="M55 36 Q55 18 70 18 Q85 18 85 36"
        fill="none"
        stroke="#5a5a5e"
        strokeWidth="3"
      />
      {/* Крышка */}
      <ellipse cx="55" cy="36" rx="22" ry="5" fill="#9d9da3" stroke="#5a5a5e" strokeWidth="2" />
      <circle cx="55" cy="33" r="3" fill="#5a5a5e" />
      {/* Индикатор готовности */}
      {state === "ready" && (
        <circle cx="55" cy="70" r="6" fill="#ff7a3a">
          <animate attributeName="opacity" values="1;0.4;1" dur="1.4s" repeatCount="indefinite" />
        </circle>
      )}
      {/* Пар */}
      {showSteam && (
        <g opacity="0.7">
          <circle cx="6" cy="38" r="4" fill="#ffffff">
            <animate attributeName="cy" values="38;22;38" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.7;0;0.7" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="14" cy="32" r="3" fill="#ffffff">
            <animate attributeName="cy" values="32;14;32" dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.7;0;0.7" dur="2.4s" repeatCount="indefinite" />
          </circle>
        </g>
      )}
    </svg>
  );
}

function BowlSprite({ state }: { state: BowlVisualState }) {
  const fill =
    state === "mix" ? "#f3c95b" : state === "egg" ? "#fff0d0" : "transparent";
  return (
    <svg width="120" height="80" viewBox="0 0 120 80" aria-hidden>
      {/* Содержимое */}
      {state !== "empty" && (
        <ellipse cx="60" cy="40" rx="44" ry="10" fill={fill} stroke="#b88a30" strokeWidth="1" />
      )}
      {state === "egg" && (
        <ellipse cx="60" cy="38" rx="10" ry="6" fill="#f7c948" />
      )}
      {/* Корпус миски */}
      <path
        d="M10 40 Q10 70 60 72 Q110 70 110 40 Z"
        fill="#e9e3d6"
        stroke="#7a6a48"
        strokeWidth="2"
      />
      {/* Ободок */}
      <ellipse cx="60" cy="40" rx="50" ry="8" fill="none" stroke="#7a6a48" strokeWidth="2" />
    </svg>
  );
}

function PlateSprite({ state }: { state: PlateVisualState }) {
  return (
    <svg width="130" height="60" viewBox="0 0 130 60" aria-hidden>
      {/* Тарелка */}
      <ellipse cx="65" cy="36" rx="60" ry="18" fill="#f6f2e8" stroke="#7a6a48" strokeWidth="2" />
      <ellipse cx="65" cy="34" rx="48" ry="13" fill="#ffffff" stroke="#c8b890" strokeWidth="1.2" />
      {/* Содержимое */}
      {state === "omelet" && (
        <>
          <ellipse cx="65" cy="32" rx="40" ry="9" fill="#f7c948" stroke="#c79a18" strokeWidth="1.2" />
          <ellipse cx="55" cy="30" rx="6" ry="2.5" fill="#ffe082" />
          <ellipse cx="78" cy="34" rx="5" ry="2" fill="#ffe082" />
        </>
      )}
      {state === "toast" && (
        <>
          <rect x="40" y="22" width="50" height="20" rx="4" fill="#d2a05a" stroke="#8a5b25" strokeWidth="1.2" />
          <rect x="44" y="26" width="42" height="12" rx="2" fill="#e8b870" />
        </>
      )}
    </svg>
  );
}

function CupSprite({ state }: { state: CupVisualState }) {
  const liquid =
    state === "tea"
      ? "#7a3f1f"
      : state === "water"
        ? "#cfe7f2"
        : state === "leaves"
          ? "#3f5d2a"
          : null;
  return (
    <svg width="90" height="100" viewBox="0 0 90 100" aria-hidden>
      {/* Ручка */}
      <path
        d="M62 40 Q86 40 86 58 Q86 76 62 76"
        fill="none"
        stroke="#7a6a48"
        strokeWidth="3"
      />
      {/* Корпус чашки */}
      <path
        d="M14 32 L14 80 Q14 92 28 92 L56 92 Q70 92 70 80 L70 32 Z"
        fill="#ffffff"
        stroke="#7a6a48"
        strokeWidth="2"
      />
      {/* Содержимое */}
      {liquid && (
        <rect
          x="18"
          y={state === "leaves" ? 60 : 40}
          width="48"
          height={state === "leaves" ? 8 : 48}
          rx="4"
          fill={liquid}
          opacity={state === "water" ? 0.85 : 1}
        />
      )}
      {state === "leaves" && (
        <>
          <circle cx="28" cy="64" r="2" fill="#2a3f1a" />
          <circle cx="40" cy="62" r="2" fill="#2a3f1a" />
          <circle cx="52" cy="65" r="2" fill="#2a3f1a" />
        </>
      )}
      {/* Ободок */}
      <ellipse cx="42" cy="32" rx="28" ry="5" fill="#f3efe0" stroke="#7a6a48" strokeWidth="2" />
      {/* Пар при готовом чае */}
      {state === "tea" && (
        <g opacity="0.75">
          <circle cx="34" cy="24" r="2.5" fill="#ffffff">
            <animate attributeName="cy" values="24;6;24" dur="2.2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.7;0;0.7" dur="2.2s" repeatCount="indefinite" />
          </circle>
          <circle cx="50" cy="22" r="2" fill="#ffffff">
            <animate attributeName="cy" values="22;4;22" dur="2.6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.7;0;0.7" dur="2.6s" repeatCount="indefinite" />
          </circle>
        </g>
      )}
    </svg>
  );
}

function BellSprite({ pulse }: { pulse?: boolean }) {
  return (
    <svg width="64" height="74" viewBox="0 0 64 74" aria-hidden className={pulse ? "drop-shadow-md" : ""}>
      {/* Кнопка-молоточек */}
      <circle cx="32" cy="10" r="6" fill="#7a3f1f" stroke="#3a1d0e" strokeWidth="1.5" />
      {/* Купол */}
      <path
        d="M10 44 Q10 18 32 18 Q54 18 54 44 Z"
        fill="#d4a13c"
        stroke="#8a5e1a"
        strokeWidth="2"
      />
      {/* Блик */}
      <path d="M18 38 Q22 26 32 24" fill="none" stroke="#fde7a0" strokeWidth="2" strokeLinecap="round" />
      {/* Подставка */}
      <ellipse cx="32" cy="50" rx="26" ry="6" fill="#a87a2a" stroke="#5e3f10" strokeWidth="2" />
      <rect x="6" y="50" width="52" height="6" rx="2" fill="#7e5418" stroke="#3e2a08" strokeWidth="1.5" />
    </svg>
  );
}

function ToasterSprite() {
  return (
    <svg width="100" height="80" viewBox="0 0 100 80" aria-hidden>
      <rect x="10" y="20" width="80" height="50" rx="6" fill="#c47d4a" stroke="#5e3a18" strokeWidth="2" />
      <rect x="22" y="14" width="22" height="10" rx="2" fill="#3a1d0e" />
      <rect x="56" y="14" width="22" height="10" rx="2" fill="#3a1d0e" />
      <circle cx="78" cy="58" r="3" fill="#3a1d0e" />
    </svg>
  );
}

function BlenderSprite() {
  return (
    <svg width="80" height="110" viewBox="0 0 80 110" aria-hidden>
      <rect x="22" y="60" width="36" height="40" rx="4" fill="#9d9da3" stroke="#5a5a5e" strokeWidth="2" />
      <rect x="14" y="14" width="52" height="50" rx="4" fill="#cfe7f2" stroke="#5a5a5e" strokeWidth="2" opacity="0.85" />
      <circle cx="40" cy="86" r="4" fill="#3a3a3e" />
    </svg>
  );
}

function RiceCookerSprite() {
  return (
    <svg width="100" height="80" viewBox="0 0 100 80" aria-hidden>
      <ellipse cx="50" cy="68" rx="42" ry="8" fill="#5a5a5e" />
      <path d="M10 40 Q10 26 30 22 L70 22 Q90 26 90 40 L90 62 L10 62 Z" fill="#e9e3d6" stroke="#5a5a5e" strokeWidth="2" />
      <ellipse cx="50" cy="22" rx="22" ry="5" fill="#cfcfd2" stroke="#5a5a5e" strokeWidth="2" />
      <circle cx="50" cy="50" r="4" fill="#ff7a3a" />
    </svg>
  );
}

function WorkSurfaceSprite() {
  return (
    <div
      className="h-12 w-28 rounded-md border-2 border-dashed border-foreground/30"
      style={{
        background:
          "repeating-linear-gradient(45deg, rgba(0,0,0,0.05) 0 6px, transparent 6px 12px)",
      }}
    />
  );
}

/* ──────────────────────────── Table slot ─────────────────────────── */

function TableSlot2D({
  index,
  ingredient_id,
  quality,
  category,
  onShortClick,
  onLongPress,
}: {
  index: number;
  ingredient_id: string | null;
  quality: "basic" | "premium" | null;
  category: string | null;
  onShortClick: (i: number) => void;
  onLongPress: (i: number) => void;
}) {
  const ing = ingredient_id ? INGREDIENTS_BY_ID.get(ingredient_id) : null;
  const isEdibleRaw = category === "raw";
  const visual = ingredient_id ? getItemVisual(ingredient_id) : null;

  const pressStartRef = useRef<number | null>(null);
  const longFiredRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [hover, setHover] = useState(false);

  const cancel = () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    pressStartRef.current = null;
    setProgress(0);
  };

  useEffect(() => () => cancel(), []);

  const handleDown = () => {
    pressStartRef.current = performance.now();
    longFiredRef.current = false;
    if (ing && isEdibleRaw) {
      const tick = () => {
        if (pressStartRef.current === null) return;
        const elapsed = performance.now() - pressStartRef.current;
        const ratio = Math.min(1, elapsed / LONG_PRESS_MS);
        setProgress(ratio);
        if (elapsed >= LONG_PRESS_MS) {
          longFiredRef.current = true;
          pressStartRef.current = null;
          setProgress(0);
          onLongPress(index);
          return;
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    }
  };

  const handleUp = () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setProgress(0);
    const start = pressStartRef.current;
    pressStartRef.current = null;
    if (longFiredRef.current) return;
    if (start === null) return;
    if (performance.now() - start < LONG_PRESS_MS) {
      onShortClick(index);
    }
  };

  const bg = ing
    ? hover
      ? "rgba(255,255,255,0.5)"
      : "rgba(255,255,255,0.35)"
    : hover
      ? "rgba(255,255,255,0.3)"
      : "rgba(255,255,255,0.15)";

  return (
    <button
      type="button"
      onPointerDown={handleDown}
      onPointerUp={handleUp}
      onPointerLeave={() => {
        cancel();
        setHover(false);
      }}
      onPointerEnter={() => setHover(true)}
      className="pointer-events-auto relative flex h-20 w-20 flex-col items-center justify-center rounded-full border-2 transition"
      style={{
        background: bg,
        borderColor: quality === "premium" ? "#d4a13c" : "rgba(94,58,24,0.55)",
        borderStyle: ing ? "solid" : "dashed",
      }}
      aria-label={ing ? `Слот ${index + 1}: ${ing.name}` : `Пустой слот ${index + 1}`}
    >
      {/* Number */}
      <span className="absolute left-1 top-0.5 text-[10px] font-semibold text-foreground/60">
        {index + 1}
      </span>

      {/* Content */}
      {ing && (
        <div className="flex flex-col items-center gap-0.5">
          <div
            className="h-7 w-7 rounded-full border border-foreground/20"
            style={{ background: visual?.color ?? "#cccccc" }}
          />
          <span className="px-1 text-[9px] font-medium leading-tight text-foreground/80 truncate max-w-[64px]">
            {ing.name}
          </span>
        </div>
      )}

      {/* Long-press progress ring */}
      {progress > 0 && (
        <svg className="pointer-events-none absolute inset-0" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="oklch(0.65 0.16 38)"
            strokeWidth="3"
            strokeDasharray={`${2 * Math.PI * 36 * progress} ${2 * Math.PI * 36}`}
            strokeDashoffset={(2 * Math.PI * 36) / 4}
            transform="rotate(-90 40 40)"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  );
}
