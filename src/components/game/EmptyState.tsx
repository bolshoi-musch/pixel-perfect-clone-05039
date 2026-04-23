export function EmptyState({
  icon,
  title,
  hint,
}: {
  icon: string;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-muted/30 py-12 text-center">
      <span className="text-4xl">{icon}</span>
      <p className="text-base font-medium text-foreground">{title}</p>
      {hint && <p className="max-w-xs text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}
