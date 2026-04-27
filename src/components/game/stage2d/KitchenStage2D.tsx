// 2.5D-сцена кухни. PNG-ассеты из Isometric Kitchen Sprites + CSS-столешница.
// Никаких ассетов из второго пака. counter.png больше не используется как ряд тумб.
//
// Слои (z-index):
//   0  background  — стены, фартук, пол
//   5  countertop  — единая CSS-столешница (передний край + поверхность)
//   10 back row    — плита слева, чайник справа (на задней линии стола)
//   20 work row    — миска, тарелка, чашка (рабочий ряд)
//   30 bell        — маленький звонок справа в зоне подачи
//   40 slots       — компактные овалы на самой столешнице, под HUD
//
// Подсветка активной цели — мягкий drop-shadow glow вокруг САМОГО предмета,
// без больших прямоугольных рамок и пунктирных зон.

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
import { STAGE_ASSETS } from "./stage-assets";

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
  const activePick = useActivePick((s) => s.pick);

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

  // Слоты «выделяются» только когда выбран ингредиент в Продуктах.
  const slotsActive = activePick !== null;

  return (
    <div className="absolute inset-0 select-none overflow-hidden">
      {/* Layer 0: background */}
      <Background />

      {/* Layer 5: единая CSS-столешница */}
      <Countertop />

      {/* Layer 10: задняя линия — плита слева, чайник справа.
          Базовая линия совпадает с верхним краем столешницы (~bottom 44%). */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[40%] z-10">
        <div className="mx-auto flex w-full max-w-5xl items-end justify-between px-[10%]">
          <Hotspot
            label="Плита"
            attention={activeTarget === "stove"}
            onHover={onHoverLabel}
            onClick={() => handleObject("stove", "Плита")}
          >
            <div className="relative">
              <SpriteImg src={STAGE_ASSETS.stove} alt="Плита" className="h-[170px] w-auto" />
              {visual.stove === "active" && <FlameOverlay />}
              <GroundShadow width={140} />
            </div>
          </Hotspot>

          {equipmentOwned.includes("toaster") && (
            <Hotspot
              label="Тостер"
              attention={activeTarget === "toaster"}
              onHover={onHoverLabel}
              onClick={() => handleObject("toaster", "Тостер")}
            >
              <div className="relative">
                <SpriteImg src={STAGE_ASSETS.toaster} alt="Тостер" className="h-[90px] w-auto" />
                <GroundShadow width={80} />
              </div>
            </Hotspot>
          )}

          {equipmentOwned.includes("kettle") && (
            <Hotspot
              label="Чайник"
              attention={activeTarget === "kettle"}
              onHover={onHoverLabel}
              onClick={() => handleObject("kettle", "Чайник")}
            >
              <div className="relative">
                <SpriteImg src={STAGE_ASSETS.kettle} alt="Чайник" className="h-[120px] w-auto" />
                {(visual.kettle === "boiling" || visual.kettle === "ready") && <SteamOverlay />}
                {visual.kettle === "ready" && (
                  <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-orange-500 shadow ring-2 ring-orange-200 animate-pulse" />
                )}
                <GroundShadow width={90} />
              </div>
            </Hotspot>
          )}
        </div>
      </div>

      {/* Layer 20: рабочий ряд — миска / тарелка / чашка на передней половине стола */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[26%] z-20">
        <div className="mx-auto flex w-full max-w-2xl items-end justify-around px-10">
          <Hotspot
            label="Миска"
            attention={activeTarget === "bowl"}
            onHover={onHoverLabel}
            onClick={() => handleObject("bowl", "Миска")}
          >
            <div className="relative">
              <BowlSprite state={visual.bowl} />
              <GroundShadow width={90} />
            </div>
          </Hotspot>

          <Hotspot
            label="Тарелка"
            attention={activeTarget === "plate"}
            onHover={onHoverLabel}
            onClick={() => handleObject("plate", "Тарелка")}
          >
            <div className="relative">
              <PlateSprite state={visual.plate} />
              <GroundShadow width={95} />
            </div>
          </Hotspot>

          <Hotspot
            label="Чашка"
            attention={activeTarget === "cup"}
            onHover={onHoverLabel}
            onClick={() => handleObject("cup", "Чашка")}
          >
            <div className="relative">
              <CupSprite state={visual.cup} />
              <GroundShadow width={70} />
            </div>
          </Hotspot>
        </div>
      </div>

      {/* Layer 30: bell — маленький, справа в зоне подачи */}
      <div className="pointer-events-none absolute right-[7%] bottom-[24%] z-30">
        <Hotspot
          label="Звонок"
          attention={activeTarget === "bell"}
          onHover={onHoverLabel}
          onClick={() => onBellRing()}
        >
          <div className="relative">
            <BellSprite pulse={activeTarget === "bell"} />
            <GroundShadow width={50} />
          </div>
        </Hotspot>
      </div>

      {/* Layer 40: table slots — компактные овалы на переднем крае столешницы.
          Стоят НАД нижним меню (bottom 18%, не заходят в HUD), маленькие. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[18%] z-40 px-6">
        <div className="mx-auto flex w-full max-w-xl items-center justify-between gap-2">
          {slots.map((slot, i) => (
            <TableSlot2D
              key={i}
              index={i}
              ingredient_id={slot.ingredient_id}
              quality={slot.quality}
              category={slot.category}
              highlight={slotsActive && !slot.ingredient_id}
              onShortClick={handleSlotShortClick}
              onLongPress={handleSlotLongPress}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────── Background & Countertop ─────────────────────────── */

function Background() {
  return (
    <div className="absolute inset-0 z-0">
      {/* Стена */}
      <div
        className="absolute inset-x-0 top-0 h-[58%]"
        style={{
          background:
            "linear-gradient(180deg, #f6e9cf 0%, #ecd6ad 60%, #d6bd8c 100%)",
        }}
      />
      {/* Кафельный фартук — еле заметный */}
      <div
        className="absolute inset-x-0 top-[42%] h-[16%] opacity-25"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.55) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.55) 1px, transparent 1px)",
          backgroundSize: "44px 28px",
          backgroundPosition: "center",
        }}
      />
      {/* Пол */}
      <div
        className="absolute inset-x-0 bottom-0 h-[42%]"
        style={{
          background:
            "linear-gradient(180deg, #b09372 0%, #8b6e4d 60%, #6e553a 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.22) 100%)",
        }}
      />
    </div>
  );
}

/**
 * Единая столешница — CSS-слой. Никаких повторяющихся cabinet PNG.
 * Поверхность стола занимает середину экрана, у неё есть передний край и тень.
 */
function Countertop() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[16%] z-[5] flex justify-center">
      <div className="relative w-[92%] max-w-[1100px]">
        {/* Поверхность стола (трапеция: уже сзади, шире спереди) */}
        <div
          className="relative h-[260px] w-full"
          style={{
            clipPath: "polygon(8% 0%, 92% 0%, 100% 100%, 0% 100%)",
            background:
              "linear-gradient(180deg, #c79a6b 0%, #b3865a 55%, #966a40 100%)",
            boxShadow:
              "inset 0 6px 14px rgba(255, 230, 200, 0.35), inset 0 -10px 24px rgba(0,0,0,0.25)",
          }}
        >
          {/* Лёгкая текстура «дерева» */}
          <div
            className="absolute inset-0 opacity-25 mix-blend-overlay"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, rgba(255,255,255,0.08) 0 2px, transparent 2px 14px)",
            }}
          />
          {/* Передний кант */}
          <div
            className="absolute inset-x-0 bottom-0 h-3"
            style={{
              background:
                "linear-gradient(180deg, #7a5532 0%, #5a3d22 100%)",
              boxShadow: "0 6px 12px rgba(0,0,0,0.35)",
            }}
          />
        </div>
        {/* Мягкая теневая полоса под столом */}
        <div
          className="pointer-events-none absolute inset-x-[6%] -bottom-2 h-4 rounded-full"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(0,0,0,0.35) 0%, transparent 70%)",
          }}
        />
      </div>
    </div>
  );
}

/* ──────────────────────────── Hotspot wrapper ─────────────────────────── */

function Hotspot({
  label,
  attention,
  onHover,
  onClick,
  children,
}: {
  label: string;
  attention?: boolean;
  onHover: (l: string | null) => void;
  onClick: () => void;
  children: React.ReactNode;
}) {
  // Подсветка — только мягкий glow на самом контенте, без прямоугольной рамки.
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerEnter={() => onHover(label)}
      onPointerLeave={() => onHover(null)}
      className={`pointer-events-auto relative inline-flex cursor-pointer items-end justify-center bg-transparent p-0 transition-transform hover:scale-[1.04] focus:outline-none ${
        attention
          ? "drop-shadow-[0_0_14px_rgba(255,180,70,0.95)] animate-pulse"
          : ""
      }`}
      aria-label={label}
    >
      {children}
    </button>
  );
}

/** Мягкая овальная тень, которую кладём под спрайт, чтобы он «стоял». */
function GroundShadow({ width }: { width: number }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 -translate-x-1/2"
      style={{
        bottom: -6,
        width,
        height: Math.max(8, width * 0.18),
        background:
          "radial-gradient(ellipse at center, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.12) 50%, transparent 75%)",
        borderRadius: "50%",
      }}
    />
  );
}

function SpriteImg({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      className={`pointer-events-none select-none object-contain ${className ?? ""}`}
      style={{ filter: "drop-shadow(0 6px 6px rgba(0,0,0,0.28))" }}
    />
  );
}

/* ──────────────────────────── Overlays (steam, flame) ─────────────────────────── */

function SteamOverlay() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2"
      width="60"
      height="60"
      viewBox="0 0 60 60"
    >
      <g opacity="0.75" fill="#ffffff">
        <circle cx="22" cy="40" r="5">
          <animate attributeName="cy" values="40;6;40" dur="2.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0;0.8" dur="2.2s" repeatCount="indefinite" />
        </circle>
        <circle cx="36" cy="44" r="4">
          <animate attributeName="cy" values="44;10;44" dur="2.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.7;0;0.7" dur="2.6s" repeatCount="indefinite" />
        </circle>
      </g>
    </svg>
  );
}

function FlameOverlay() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute left-[28%] top-[34%]"
      width="40"
      height="40"
      viewBox="0 0 40 40"
    >
      <ellipse cx="20" cy="22" rx="7" ry="4" fill="#ff7a3a" opacity="0.8">
        <animate attributeName="ry" values="4;6;4" dur="0.9s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.8;0.4;0.8" dur="0.9s" repeatCount="indefinite" />
      </ellipse>
    </svg>
  );
}

/* ──────────────────────────── Vessels with PNG + overlays ─────────────────────────── */

/**
 * Все vessel-спрайты:
 *   — снизу настоящий PNG из ISO-пака,
 *   — сверху небольшой overlay внутри ободка для содержимого.
 * Размеры подобраны так, чтобы overlay аккуратно лёг внутрь миски/тарелки/чашки.
 */

function BowlSprite({ state }: { state: BowlVisualState }) {
  return (
    <div className="relative">
      <SpriteImg src={STAGE_ASSETS.bowl} alt="Миска" className="h-[110px] w-auto" />
      {/* Overlay — внутри ободка миски (PNG: ~176×134, ободок ~центр-верх) */}
      {state !== "empty" && (
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0"
          viewBox="0 0 176 134"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Жидкость в миске (mix = взбитое, egg = просто содержимое) */}
          <ellipse
            cx="88"
            cy="62"
            rx="46"
            ry="9"
            fill={state === "mix" ? "#f3c84e" : "#fff1c8"}
            stroke={state === "mix" ? "#c79318" : "#d8b86a"}
            strokeWidth="1"
          />
          {state === "egg" && (
            <ellipse cx="88" cy="60" rx="11" ry="5" fill="#f6c945" />
          )}
        </svg>
      )}
    </div>
  );
}

function PlateSprite({ state }: { state: PlateVisualState }) {
  return (
    <div className="relative">
      <SpriteImg src={STAGE_ASSETS.plate} alt="Тарелка" className="h-[100px] w-auto" />
      {state !== "empty" && (
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0"
          viewBox="0 0 176 134"
          preserveAspectRatio="xMidYMid meet"
        >
          {state === "omelet" && (
            <>
              {/* Неровный овал омлета */}
              <path
                d="M48 64 Q56 48 92 50 Q128 52 132 70 Q126 84 90 84 Q56 82 48 64 Z"
                fill="#f5c84a"
                stroke="#c89318"
                strokeWidth="1.2"
              />
              <ellipse cx="78" cy="62" rx="6" ry="2.5" fill="#ffe27a" />
              <ellipse cx="106" cy="72" rx="5" ry="2" fill="#ffe27a" />
            </>
          )}
          {state === "toast" && (
            <>
              <rect x="56" y="50" width="64" height="28" rx="4" fill="#d09e58" stroke="#8a5a25" strokeWidth="1.2" />
              <rect x="62" y="56" width="52" height="16" rx="2" fill="#e9b870" />
            </>
          )}
        </svg>
      )}
    </div>
  );
}

function CupSprite({ state }: { state: CupVisualState }) {
  return (
    <div className="relative">
      <SpriteImg src={STAGE_ASSETS.cup} alt="Чашка" className="h-[90px] w-auto" />
      {state !== "empty" && (
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0"
          viewBox="0 0 72 71"
          preserveAspectRatio="xMidYMid meet"
        >
          {state === "tea" && (
            <ellipse cx="33" cy="22" rx="17" ry="4" fill="#7a3a1a" />
          )}
          {state === "leaves" && (
            <>
              <ellipse cx="33" cy="22" rx="16" ry="3.5" fill="#3d5a2a" opacity="0.55" />
              <circle cx="27" cy="22" r="1.6" fill="#243819" />
              <circle cx="34" cy="21" r="1.6" fill="#243819" />
              <circle cx="40" cy="23" r="1.6" fill="#243819" />
            </>
          )}
        </svg>
      )}
      {state === "tea" && (
        <svg
          aria-hidden
          className="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2"
          width="40"
          height="40"
          viewBox="0 0 40 40"
        >
          <g opacity="0.7" fill="#ffffff">
            <circle cx="14" cy="28" r="2.5">
              <animate attributeName="cy" values="28;6;28" dur="2.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;0;0.7" dur="2.4s" repeatCount="indefinite" />
            </circle>
            <circle cx="24" cy="30" r="2">
              <animate attributeName="cy" values="30;8;30" dur="2.8s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;0;0.7" dur="2.8s" repeatCount="indefinite" />
            </circle>
          </g>
        </svg>
      )}
    </div>
  );
}

/* ──────────────────────────── Bell (SVG, временно) ─────────────────────────── */

function BellSprite({ pulse }: { pulse?: boolean }) {
  return (
    <svg
      width="44"
      height="50"
      viewBox="0 0 64 74"
      aria-hidden
      className={pulse ? "drop-shadow-md" : ""}
      style={{ filter: "drop-shadow(0 4px 4px rgba(0,0,0,0.25))" }}
    >
      <circle cx="32" cy="10" r="5" fill="#7a3f1f" stroke="#3a1d0e" strokeWidth="1.2" />
      <path
        d="M10 44 Q10 18 32 18 Q54 18 54 44 Z"
        fill="#d4a13c"
        stroke="#8a5e1a"
        strokeWidth="2"
      />
      <path d="M18 38 Q22 26 32 24" fill="none" stroke="#fde7a0" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="32" cy="50" rx="26" ry="6" fill="#a87a2a" stroke="#5e3f10" strokeWidth="1.5" />
      <rect x="6" y="50" width="52" height="6" rx="2" fill="#7e5418" stroke="#3e2a08" strokeWidth="1.2" />
    </svg>
  );
}

/* ──────────────────────────── Table slot (спокойный) ─────────────────────────── */

function TableSlot2D({
  index,
  ingredient_id,
  quality,
  category,
  highlight,
  onShortClick,
  onLongPress,
}: {
  index: number;
  ingredient_id: string | null;
  quality: "basic" | "premium" | null;
  category: string | null;
  highlight: boolean;
  onShortClick: (i: number) => void;
  onLongPress: (i: number) => void;
}) {
  const ing = ingredient_id ? INGREDIENTS_BY_ID.get(ingredient_id) : null;
  const isEdibleRaw = category === "raw";

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

  // Спокойный фон. Слот заметнее когда hover, ИЛИ когда у игрока выбран продукт и слот пуст.
  const bg = ing
    ? hover
      ? "rgba(255,255,255,0.45)"
      : "rgba(255,255,255,0.28)"
    : highlight
      ? "rgba(255,210,140,0.45)"
      : hover
        ? "rgba(255,255,255,0.22)"
        : "rgba(255,255,255,0.10)";

  const borderColor = ing
    ? quality === "premium"
      ? "rgba(212,161,60,0.9)"
      : "rgba(94,58,24,0.55)"
    : highlight
      ? "rgba(212,161,60,0.85)"
      : "rgba(94,58,24,0.25)";

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
      className="pointer-events-auto relative flex h-14 w-14 flex-col items-center justify-center rounded-xl transition"
      style={{
        background: bg,
        border: `1.5px solid ${borderColor}`,
        backdropFilter: "blur(2px)",
      }}
      aria-label={ing ? `Слот ${index + 1}: ${ing.name}` : `Пустой слот ${index + 1}`}
    >
      {ing && (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[14px] leading-none">
            {iconForCategory(category, ing.name)}
          </span>
          <span className="px-1 text-[8px] font-medium leading-tight text-foreground/80 truncate max-w-[50px]">
            {ing.name}
          </span>
        </div>
      )}

      {progress > 0 && (
        <svg className="pointer-events-none absolute inset-0" viewBox="0 0 56 56">
          <circle
            cx="28"
            cy="28"
            r="24"
            fill="none"
            stroke="oklch(0.65 0.16 38)"
            strokeWidth="2.5"
            strokeDasharray={`${2 * Math.PI * 24 * progress} ${2 * Math.PI * 24}`}
            strokeDashoffset={(2 * Math.PI * 24) / 4}
            transform="rotate(-90 28 28)"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  );
}

/** Простая иконка по категории, чтобы не показывать большой текст. */
function iconForCategory(category: string | null, name: string): string {
  if (!category) return "•";
  const n = name.toLowerCase();
  if (n.includes("яйц")) return "🥚";
  if (n.includes("чай") || n.includes("заварк")) return "🍃";
  if (n.includes("хлеб")) return "🍞";
  if (n.includes("молок")) return "🥛";
  if (n.includes("помидор") || n.includes("томат")) return "🍅";
  if (n.includes("сыр")) return "🧀";
  return "•";
}
