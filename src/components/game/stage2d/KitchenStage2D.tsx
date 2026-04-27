// 2.5D-сцена кухни. PNG-ассеты из Isometric Kitchen Sprites + CSS-столешница.
// Все позиции предметов читаются из stage-layout.ts (anchor: bottom-center),
// никаких произвольных inline left/bottom внутри JSX.
//
// Принцип anchor "bottom-center":
//   StageObject рендерит абсолютный контейнер с координатами (left%, top%),
//   считает прозрачный padding снизу PNG через visibleBottomOffsetRatio и
//   сдвигает контейнер так, чтобы ВИДИМАЯ нижняя точка предмета попадала
//   в (left, top). Контактная тень кладётся в эту же точку опоры.

import { useEffect, useRef, useState } from "react";
import { useGame } from "@/game/store";
import { useActivePick } from "@/game/active-pick";
import { useOrderEngine, expectedEquipmentForStep } from "@/game/order-engine";
import { STEPS_BY_ID, RECIPES_BY_ID, INGREDIENTS_BY_ID } from "@/game/data";
import {
  selectKitchenVisualState,
  type BowlVisualState,
  type CupVisualState,
  type PlateVisualState,
} from "@/game/derived-state";
import { STAGE_ASSETS } from "./stage-assets";
import {
  STAGE_LAYOUT,
  TABLE_SLOT_IDS_2D,
  COUNTERTOP_TOP_PCT,
  COUNTERTOP_BOTTOM_PCT,
  COUNTERTOP_WIDTH_PCT,
  COUNTERTOP_MAX_WIDTH_PX,
  type StageObjectLayout,
} from "./stage-layout";
import { useHintMode } from "@/game/hint-mode";

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
  const hintMode = useHintMode((s) => s.mode);
  const showHereLabel = hintMode !== "minimal";

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

  const slotsActive = activePick !== null;

  return (
    <div className="absolute inset-0 select-none overflow-hidden">
      {/* Layer 0: фон — стены, фартук, пол */}
      <Background />

      {/* Layer 5: столешница (CSS) */}
      <Countertop />

      {/* Контактные плашки под предметами — на самой поверхности столешницы. */}
      <ContactBase layout={STAGE_LAYOUT.stove} width={105} height={10} />
      {equipmentOwned.includes("toaster") && (
        <ContactBase layout={STAGE_LAYOUT.toaster} width={64} height={8} />
      )}
      {equipmentOwned.includes("kettle") && (
        <ContactBase layout={STAGE_LAYOUT.kettle} width={66} height={8} />
      )}
      <ContactBase layout={STAGE_LAYOUT.bowl} width={78} height={8} />
      <ContactBase layout={STAGE_LAYOUT.plate} width={92} height={8} />
      <ContactBase layout={STAGE_LAYOUT.cup} width={44} height={7} />
      <ContactBase layout={STAGE_LAYOUT.bell} width={34} height={6} />

      {/* ── Back row ─────────────────────────────────────── */}
      <StageObject
        layout={STAGE_LAYOUT.stove}
        label="Плита"
        attention={activeTarget === "stove"}
        showHereLabel={showHereLabel}
        onHover={onHoverLabel}
        onClick={() => handleObject("stove", "Плита")}
      >
        <SpriteImg src={STAGE_ASSETS.stove} alt="Плита" widthPx={STAGE_LAYOUT.stove.width} />
        {visual.stove === "active" && <FlameOverlay />}
      </StageObject>

      {equipmentOwned.includes("toaster") && (
        <StageObject
          layout={STAGE_LAYOUT.toaster}
          label="Тостер"
          attention={activeTarget === "toaster"}
          showHereLabel={showHereLabel}
          onHover={onHoverLabel}
          onClick={() => handleObject("toaster", "Тостер")}
        >
          <SpriteImg src={STAGE_ASSETS.toaster} alt="Тостер" widthPx={STAGE_LAYOUT.toaster.width} />
        </StageObject>
      )}

      {equipmentOwned.includes("kettle") && (
        <StageObject
          layout={STAGE_LAYOUT.kettle}
          label="Чайник"
          attention={activeTarget === "kettle"}
          showHereLabel={showHereLabel}
          onHover={onHoverLabel}
          onClick={() => handleObject("kettle", "Чайник")}
        >
          <SpriteImg src={STAGE_ASSETS.kettle} alt="Чайник" widthPx={STAGE_LAYOUT.kettle.width} />
          {(visual.kettle === "boiling" || visual.kettle === "ready") && <SteamOverlay />}
          {visual.kettle === "ready" && (
            <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-orange-500 shadow ring-2 ring-orange-200 animate-pulse" />
          )}
        </StageObject>
      )}

      {/* ── Work row ─────────────────────────────────────── */}
      <StageObject
        layout={STAGE_LAYOUT.bowl}
        label="Миска"
        attention={activeTarget === "bowl"}
        showHereLabel={showHereLabel}
        onHover={onHoverLabel}
        onClick={() => handleObject("bowl", "Миска")}
      >
        <BowlSprite state={visual.bowl} widthPx={STAGE_LAYOUT.bowl.width} />
      </StageObject>

      <StageObject
        layout={STAGE_LAYOUT.plate}
        label="Тарелка"
        attention={activeTarget === "plate"}
        showHereLabel={showHereLabel}
        onHover={onHoverLabel}
        onClick={() => handleObject("plate", "Тарелка")}
      >
        <PlateSprite state={visual.plate} widthPx={STAGE_LAYOUT.plate.width} />
      </StageObject>

      <StageObject
        layout={STAGE_LAYOUT.cup}
        label="Чашка"
        attention={activeTarget === "cup"}
        showHereLabel={showHereLabel}
        onHover={onHoverLabel}
        onClick={() => handleObject("cup", "Чашка")}
      >
        <CupSprite state={visual.cup} widthPx={STAGE_LAYOUT.cup.width} />
      </StageObject>

      {/* ── Bell на столе ─────────────────────────────────── */}
      <StageObject
        layout={STAGE_LAYOUT.bell}
        label="Звонок"
        attention={activeTarget === "bell"}
        showHereLabel={showHereLabel}
        onHover={onHoverLabel}
        onClick={() => onBellRing()}
      >
        <BellSprite pulse={activeTarget === "bell"} widthPx={STAGE_LAYOUT.bell.width} />
      </StageObject>

      {/* ── Table slots ── */}
      {TABLE_SLOT_IDS_2D.map((id, i) => {
        const layout = STAGE_LAYOUT[id];
        const slot = slots[i];
        return (
          <SlotAnchor key={id} layout={layout}>
            <TableSlot2D
              index={i}
              ingredient_id={slot.ingredient_id}
              quality={slot.quality}
              category={slot.category}
              size={layout.width}
              highlight={slotsActive && !slot.ingredient_id}
              onShortClick={handleSlotShortClick}
              onLongPress={handleSlotLongPress}
            />
          </SlotAnchor>
        );
      })}
    </div>
  );
}

/* ──────────────────────────── Background & Countertop ─────────────────────────── */

function Background() {
  return (
    <div className="absolute inset-0 z-0">
      {/* Стена */}
      <div
        className="absolute inset-x-0 top-0"
        style={{
          height: `${COUNTERTOP_TOP_PCT + 4}%`,
          background:
            "linear-gradient(180deg, #f6e9cf 0%, #ecd6ad 60%, #d6bd8c 100%)",
        }}
      />
      {/* Фартук — еле заметная сетка */}
      <div
        className="absolute inset-x-0 opacity-20"
        style={{
          top: `${COUNTERTOP_TOP_PCT - 14}%`,
          height: "14%",
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.55) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.55) 1px, transparent 1px)",
          backgroundSize: "44px 24px",
          backgroundPosition: "center",
        }}
      />
      {/* Пол */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          top: `${COUNTERTOP_BOTTOM_PCT}%`,
          background:
            "linear-gradient(180deg, #b09372 0%, #8b6e4d 60%, #6e553a 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.22) 100%)",
        }}
      />
    </div>
  );
}

/**
 * Компактная столешница. Верх ~44%, низ ~79%. Никаких отдельных тумб.
 */
function Countertop() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-[5] flex justify-center"
      style={{
        top: `${COUNTERTOP_TOP_PCT}%`,
        height: `${COUNTERTOP_BOTTOM_PCT - COUNTERTOP_TOP_PCT}%`,
      }}
    >
      <div
        className="relative h-full"
        style={{
          width: `${COUNTERTOP_WIDTH_PCT}%`,
          maxWidth: `${COUNTERTOP_MAX_WIDTH_PX}px`,
        }}
      >
        {/* Поверхность стола (трапеция) */}
        <div
          className="relative h-full w-full"
          style={{
            clipPath: "polygon(6% 0%, 94% 0%, 100% 100%, 0% 100%)",
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
      </div>
    </div>
  );
}

/* ──────────────────────────── StageObject (anchor bottom-center) ─────────────────────────── */

/**
 * Универсальная обёртка для предмета сцены.
 *  - читает позицию из layout (left%, top%);
 *  - крепится anchor: нижняя центральная точка спрайта = (left, top);
 *  - кладёт компактную тень прямо под anchor;
 *  - подсветка active — мягкий glow на самом спрайте.
 */
function StageObject({
  layout,
  label,
  attention,
  showHereLabel,
  onHover,
  onClick,
  children,
}: {
  layout: StageObjectLayout;
  label: string;
  attention?: boolean;
  showHereLabel?: boolean;
  onHover: (l: string | null) => void;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const offsetPx = (layout.visibleBottomOffsetRatio ?? 0) * layout.width;
  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: `${layout.left}%`,
        top: `${layout.top}%`,
        width: layout.width,
        zIndex: layout.zIndex,
        // anchor bottom-center с компенсацией прозрачного нижнего паддинга PNG:
        // (left, top) = ВИДИМАЯ нижняя центральная точка предмета (где он
        // касается стола), а не нижняя граница PNG-файла.
        transform: `translate(-50%, calc(-100% + ${offsetPx}px))`,
      }}
    >
      {layout.shadowWidth > 0 && (
        <ContactShadow
          width={layout.shadowWidth}
          visibleBottomOffsetPx={offsetPx}
        />
      )}
      {attention && <ActiveContactHalo width={layout.shadowWidth || layout.width} visibleBottomOffsetPx={offsetPx} />}
      <button
        type="button"
        onClick={onClick}
        onPointerEnter={() => onHover(label)}
        onPointerLeave={() => onHover(null)}
        className={`pointer-events-auto relative z-[1] inline-flex w-full cursor-pointer items-end justify-center bg-transparent p-0 transition-transform hover:scale-[1.04] focus:outline-none ${attention ? "animate-pulse" : ""}`}
        aria-label={label}
      >
        {children}
      </button>
      {attention && showHereLabel && <HereLabel />}
    </div>
  );
}

/**
 * Маленькая подпись "Сюда" над активным объектом со стрелкой вниз.
 * Показывается только в detailed/normal hint mode.
 */
function HereLabel() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 -top-7 -translate-x-1/2 flex flex-col items-center"
      style={{ zIndex: 50 }}
    >
      <span className="rounded-full bg-primary/95 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground shadow-md animate-pulse">
        Сюда
      </span>
      <svg width="10" height="6" viewBox="0 0 10 6" className="-mt-px">
        <path d="M0 0 L10 0 L5 6 Z" fill="currentColor" className="text-primary" />
      </svg>
    </div>
  );
}

/** Аналог StageObject для слота — без button-обёртки и hover-glow. */
function SlotAnchor({
  layout,
  children,
}: {
  layout: StageObjectLayout;
  children: React.ReactNode;
}) {
  const offsetPx = (layout.visibleBottomOffsetRatio ?? 0) * layout.width;
  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: `${layout.left}%`,
        top: `${layout.top}%`,
        width: layout.width,
        zIndex: layout.zIndex,
        transform: `translate(-50%, calc(-100% + ${offsetPx}px))`,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Маленькая контактная тень прямо под видимой нижней точкой предмета.
 * После transform контейнер опущен на visibleBottomOffsetPx, поэтому тень
 * поднимается на эту же величину вверх от нижней кромки контейнера.
 * Без drop-shadow на самом спрайте — иначе получаем двойную тень и
 * усиление ощущения «парения».
 */
function ContactShadow({
  width,
  visibleBottomOffsetPx,
}: {
  width: number;
  visibleBottomOffsetPx: number;
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 -translate-x-1/2"
      style={{
        bottom: Math.max(0, visibleBottomOffsetPx - 1),
        width,
        height: Math.max(4, width * 0.09),
        background:
          "radial-gradient(ellipse at center, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.07) 55%, transparent 80%)",
        borderRadius: "50%",
        filter: "blur(1px)",
        zIndex: 0,
      }}
    />
  );
}

function ActiveContactHalo({
  width,
  visibleBottomOffsetPx,
}: {
  width: number;
  visibleBottomOffsetPx: number;
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 -translate-x-1/2"
      style={{
        bottom: Math.max(0, visibleBottomOffsetPx - 4),
        width: Math.max(42, width * 1.2),
        height: Math.max(8, width * 0.14),
        background:
          "radial-gradient(ellipse at center, color-mix(in oklab, var(--primary) 42%, transparent) 0%, color-mix(in oklab, var(--primary) 18%, transparent) 48%, transparent 78%)",
        borderRadius: "50%",
        filter: "blur(1px)",
        zIndex: 0,
      }}
    />
  );
}

function SpriteImg({
  src,
  alt,
  widthPx,
}: {
  src: string;
  alt: string;
  widthPx: number;
}) {
  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      className="pointer-events-none block select-none object-contain"
      style={{
        width: widthPx,
        height: "auto",
        filter: "none",
      }}
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

/* ──────────────────────────── Vessels ─────────────────────────── */

function BowlSprite({ state, widthPx }: { state: BowlVisualState; widthPx: number }) {
  return (
    <div className="relative" style={{ width: widthPx }}>
      <SpriteImg src={STAGE_ASSETS.bowl} alt="Миска" widthPx={widthPx} />
      {state !== "empty" && (
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0"
          viewBox="0 0 176 134"
          preserveAspectRatio="xMidYMid meet"
        >
          <ellipse
            cx="88"
            cy="62"
            rx="46"
            ry="9"
            fill={state === "mix" ? "#f3c84e" : "#fff1c8"}
            stroke={state === "mix" ? "#c79318" : "#d8b86a"}
            strokeWidth="1"
          />
          {state === "egg" && <ellipse cx="88" cy="60" rx="11" ry="5" fill="#f6c945" />}
        </svg>
      )}
    </div>
  );
}

function PlateSprite({ state, widthPx }: { state: PlateVisualState; widthPx: number }) {
  return (
    <div className="relative" style={{ width: widthPx }}>
      <SpriteImg src={STAGE_ASSETS.plate} alt="Тарелка" widthPx={widthPx} />
      {state !== "empty" && (
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0"
          viewBox="0 0 176 134"
          preserveAspectRatio="xMidYMid meet"
        >
          {state === "omelet" && (
            <>
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

function CupSprite({ state, widthPx }: { state: CupVisualState; widthPx: number }) {
  return (
    <div className="relative" style={{ width: widthPx }}>
      <SpriteImg src={STAGE_ASSETS.cup} alt="Чашка" widthPx={widthPx} />
      {state !== "empty" && (
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0"
          viewBox="0 0 72 71"
          preserveAspectRatio="xMidYMid meet"
        >
          {state === "tea" && <ellipse cx="33" cy="22" rx="17" ry="4" fill="#7a3a1a" />}
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

/* ──────────────────────────── Bell (SVG) ─────────────────────────── */

function BellSprite({ pulse, widthPx }: { pulse?: boolean; widthPx: number }) {
  return (
    <svg
      width={widthPx}
      height={widthPx * 1.13}
      viewBox="0 0 64 74"
      aria-hidden
      className={pulse ? "animate-pulse" : ""}
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

/* ──────────────────────────── Table slot ─────────────────────────── */

function TableSlot2D({
  index,
  ingredient_id,
  quality,
  category,
  size,
  highlight,
  onShortClick,
  onLongPress,
}: {
  index: number;
  ingredient_id: string | null;
  quality: "basic" | "premium" | null;
  category: string | null;
  size: number;
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

  // Видимость:
  //  - есть ингредиент → виден заметно (тёплый овал, opacity 1);
  //  - выбран pick, слот пуст → подсвечен (0.35);
  //  - hover на пустой → 0.20;
  //  - иначе → невидим (opacity 0), чтобы стартовый экран не пестрил кружками.
  const occupied = !!ing;
  let opacity = 0;
  if (occupied) opacity = 1;
  else if (highlight) opacity = 0.35;
  else if (hover) opacity = 0.2;

  const bg = occupied
    ? "rgba(255,248,225,0.85)"
    : highlight
      ? "rgba(255,210,140,0.55)"
      : "rgba(255,255,255,0.35)";

  const borderColor = occupied
    ? quality === "premium"
      ? "rgba(212,161,60,0.9)"
      : "rgba(94,58,24,0.45)"
    : highlight
      ? "rgba(212,161,60,0.55)"
      : "transparent";

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
      className="pointer-events-auto relative flex items-center justify-center rounded-full transition"
      style={{
        width: size,
        height: size,
        background: bg,
        border: `1px solid ${borderColor}`,
        boxShadow: occupied ? "inset 0 1px 2px rgba(255,255,255,0.6), 0 1px 2px rgba(0,0,0,0.2)" : "none",
        opacity,
      }}
      aria-label={ing ? `Слот ${index + 1}: ${ing.name}` : `Пустой слот ${index + 1}`}
    >
      {ing && (
        <span className="text-[15px] leading-none">
          {iconForCategory(category, ing.name)}
        </span>
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
