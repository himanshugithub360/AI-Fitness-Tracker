import { Progress } from "@/components/ui/progress";
import type { Totals } from "@/lib/food/totals";
import { cn } from "@/lib/utils";

export type DayTargets = {
  calories: number;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
};

function MacroBar({
  label,
  value,
  target,
  color,
}: {
  label: string;
  value: number;
  target: number | null;
  color: string;
}) {
  const percent = target ? Math.min(100, (value / target) * 100) : 0;
  return (
    <div className="flex flex-col gap-2">
      <div className="text-muted-foreground flex items-baseline justify-between font-mono text-xs tracking-widest uppercase">
        <span>{label}</span>
        <span className="tabular-nums">
          {Math.round(value)}
          {target ? ` / ${target}` : ""} g
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10" role="presentation">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

/** Calories eaten against the daily target, with the three macros underneath. */
export function DaySummary({ totals, targets }: { totals: Totals; targets: DayTargets | null }) {
  const target = targets?.calories ?? 0;
  const remaining = target - totals.calories;
  const percent = target ? Math.min(100, (totals.calories / target) * 100) : 0;
  const over = target > 0 && remaining < 0;

  return (
    <section aria-label="Day summary" className="glass flex flex-col gap-5 rounded-3xl p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="eyebrow">Eaten</span>
          <p className="font-display text-5xl font-bold tracking-tight tabular-nums">
            {totals.calories.toLocaleString("en-US")}
            {target > 0 && (
              <span className="text-muted-foreground ml-2 text-lg font-medium">
                of {target.toLocaleString("en-US")} kcal
              </span>
            )}
          </p>
        </div>
        {target > 0 && (
          <p className={cn("font-mono text-sm", over ? "text-destructive" : "text-ok")}>
            {over
              ? `${Math.abs(remaining).toLocaleString("en-US")} kcal over`
              : `${remaining.toLocaleString("en-US")} kcal left`}
          </p>
        )}
      </div>

      {target > 0 && (
        <Progress
          value={percent}
          aria-label="Calories eaten"
          className={over ? "[&>div]:from-gold [&>div]:to-destructive" : undefined}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <MacroBar
          label="Protein"
          value={totals.proteinG}
          target={targets?.proteinG ?? null}
          color="bg-ice"
        />
        <MacroBar
          label="Carbs"
          value={totals.carbsG}
          target={targets?.carbsG ?? null}
          color="bg-gold"
        />
        <MacroBar label="Fat" value={totals.fatG} target={targets?.fatG ?? null} color="bg-ember" />
      </div>
    </section>
  );
}
