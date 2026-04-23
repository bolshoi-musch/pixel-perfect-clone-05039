import { useEffect, type ReactNode } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function PanelDialog({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <div
        className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="relative z-10 max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-t-3xl border border-border bg-card shadow-[var(--shadow-warm)] md:rounded-3xl"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            aria-label="Закрыть"
          >
            ✕
          </button>
        </header>
        <div className="max-h-[calc(85vh-64px)] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
