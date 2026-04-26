// MIX minigame — circular stirring. Player drags around the bowl center.
// Quality = circles completed within 5s & smoothness of motion.

import { useEffect, useRef, useState } from "react";
import { useGame } from "@/game/store";
import { useOrderEngine } from "@/game/order-engine";
import { RECIPES_BY_ID, STEPS_BY_ID } from "@/game/data";

interface Props {
  onDone: (quality: number, errors: number) => void;
  onCancel: () => void;
}

const DURATION_MS = 5000;
const TARGET_CIRCLES = 4;

export function MixMinigame({ onDone, onCancel }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [angle, setAngle] = useState(0);
  const [circles, setCircles] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const stateRef = useRef({
    pressing: false,
    lastAngle: 0,
    accumulated: 0,
    direction: 0,
    flips: 0, // count direction flips (penalize jitter)
    started: false,
    startTime: 0,
  });

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const st = stateRef.current;
      if (st.started) {
        const e = performance.now() - st.startTime;
        setElapsed(Math.min(e, DURATION_MS));
        if (e >= DURATION_MS) {
          finalize();
          return;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finalize = () => {
    const st = stateRef.current;
    const ratio = Math.min(1, st.accumulated / (Math.PI * 2 * TARGET_CIRCLES));
    // Penalize too many direction flips
    const jitterPenalty = Math.min(0.4, st.flips * 0.04);
    const quality = Math.max(0, Math.min(1, ratio - jitterPenalty));
    const errors = st.flips > 8 ? 1 : 0;
    onDone(quality, errors);
  };

  const getAngle = (clientX: number, clientY: number) => {
    const el = ref.current!;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(clientY - cy, clientX - cx);
  };

  const onDown = (e: React.PointerEvent) => {
    const st = stateRef.current;
    st.pressing = true;
    if (!st.started) {
      st.started = true;
      st.startTime = performance.now();
    }
    st.lastAngle = getAngle(e.clientX, e.clientY);
    setAngle(st.lastAngle);
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const onMove = (e: React.PointerEvent) => {
    const st = stateRef.current;
    if (!st.pressing) return;
    const a = getAngle(e.clientX, e.clientY);
    let delta = a - st.lastAngle;
    if (delta > Math.PI) delta -= 2 * Math.PI;
    if (delta < -Math.PI) delta += 2 * Math.PI;

    const newDir = Math.sign(delta) || st.direction;
    if (newDir !== 0 && st.direction !== 0 && newDir !== st.direction) {
      st.flips += 1;
    }
    if (newDir !== 0) st.direction = newDir;

    st.accumulated += Math.abs(delta);
    st.lastAngle = a;
    setAngle(a);
    setCircles(Math.floor(st.accumulated / (Math.PI * 2)));
  };

  const onUp = (e: React.PointerEvent) => {
    stateRef.current.pressing = false;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  };

  const progress = elapsed / DURATION_MS;
  const circleProgress = Math.min(1, stateRef.current.accumulated / (Math.PI * 2 * TARGET_CIRCLES));

  return (
    <Overlay
      title="Перемешивай"
      subtitle="Веди по кругу — плавно и в одну сторону"
      onCancel={onCancel}
    >
      <div
        ref={ref}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className="relative mx-auto h-72 w-72 touch-none select-none rounded-full border-2 border-dashed border-border bg-card/80"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, var(--copper) 18%, var(--card)) 0%, var(--card) 70%)",
        }}
      >
        {/* center */}
        <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/40" />
        {/* indicator */}
        <div
          className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow"
          style={{
            transform: `translate(${Math.cos(angle) * 110 - 6}px, ${Math.sin(angle) * 110 - 6}px)`,
          }}
        />
        <p className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-xs text-muted-foreground">
          Кругов: {circles} / {TARGET_CIRCLES}
        </p>
      </div>

      <div className="mt-4 space-y-2">
        <ProgressBar value={progress} label="Время" />
        <ProgressBar value={circleProgress} label="Готовность" tone="primary" />
      </div>
    </Overlay>
  );
}

// ============================================

interface WindowProps {
  onDone: (quality: number, errors: number) => void;
  onCancel: () => void;
}

const WINDOW_DURATION_MS = 6000;
const SWEEP_PERIOD_MS = 1800;
const TARGET_X = 0.5; // ideal center
const TARGET_HALF_WIDTH = 0.18; // green zone

/**
 * WINDOW minigame — кулинарный таймер. Курсор скользит по шкале, нужно
 * нажать пробел / тапнуть, когда индикатор в зелёной зоне («готово»).
 */
export function WindowMinigame({ onDone, onCancel }: WindowProps) {
  const startRef = useRef(performance.now());
  const [pos, setPos] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [tapped, setTapped] = useState<{ x: number; quality: number } | null>(null);
  const lockRef = useRef(false);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const e = performance.now() - startRef.current;
      setElapsed(e);
      // triangular wave 0..1..0
      const t = (e % SWEEP_PERIOD_MS) / SWEEP_PERIOD_MS;
      const tri = t < 0.5 ? t * 2 : 2 - t * 2;
      setPos(tri);
      if (e >= WINDOW_DURATION_MS && !lockRef.current) {
        lockRef.current = true;
        // missed — fail
        onDone(0.1, 1);
        return;
      }
      if (!lockRef.current) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tap = () => {
    if (lockRef.current) return;
    lockRef.current = true;
    const dist = Math.abs(pos - TARGET_X);
    let q = 0;
    let errors = 0;
    if (dist <= TARGET_HALF_WIDTH) {
      // 1.0 in dead-center, ramps down to 0.6 at edge of green zone
      q = 1 - (dist / TARGET_HALF_WIDTH) * 0.4;
    } else {
      q = Math.max(0.1, 0.6 - (dist - TARGET_HALF_WIDTH) * 1.5);
      errors = 1;
    }
    setTapped({ x: pos, quality: q });
    setTimeout(() => onDone(q, errors), 600);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        tap();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const timeProgress = Math.min(1, elapsed / WINDOW_DURATION_MS);

  return (
    <Overlay
      title="Поймай момент"
      subtitle="Нажми, когда индикатор в зелёной зоне (или Пробел)"
      onCancel={onCancel}
    >
      <button
        type="button"
        onClick={tap}
        className="relative h-36 w-full select-none overflow-hidden rounded-2xl border border-border bg-card/80"
      >
        {/* track */}
        <div className="absolute inset-x-4 top-1/2 h-3 -translate-y-1/2 rounded-full bg-muted" />
        {/* green zone */}
        <div
          className="absolute top-1/2 h-3 -translate-y-1/2 rounded-full bg-primary/60"
          style={{
            left: `calc(${(TARGET_X - TARGET_HALF_WIDTH) * 100}% + 0px)`,
            width: `${TARGET_HALF_WIDTH * 200}%`,
          }}
        />
        {/* indicator */}
        <div
          className="absolute top-1/2 h-8 w-1.5 -translate-y-1/2 rounded-full bg-foreground shadow"
          style={{ left: `calc(${pos * 100}% - 3px)` }}
        />
        {tapped && (
          <div
            className="absolute top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary"
            style={{ left: `${tapped.x * 100}%` }}
          />
        )}
        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
          ТАП!
        </span>
      </button>

      <div className="mt-4">
        <ProgressBar value={timeProgress} label="Время" />
      </div>
    </Overlay>
  );
}

// ============================================

function Overlay({
  title,
  subtitle,
  onCancel,
  children,
}: {
  title: string;
  subtitle: string;
  onCancel: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-warm)]">
        <header className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold text-foreground">{title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            ✕
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}

function ProgressBar({ value, label, tone }: { value: number; label: string; tone?: "primary" }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div>
      <div className="mb-1 flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>{label}</span>
        <span>{pct.toFixed(0)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full transition-[width] duration-100 ${tone === "primary" ? "bg-primary" : "bg-foreground/60"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
