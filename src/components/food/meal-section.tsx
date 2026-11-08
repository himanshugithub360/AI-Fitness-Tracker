"use client";

import { useState } from "react";
import { LoaderCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { deleteFood } from "@/app/app/food/actions";
import { Button } from "@/components/ui/button";
import { MEAL_LABELS, type MealType } from "@/lib/food/meals";
import { sumEntries, type FoodEntry } from "@/lib/food/totals";
import { FoodForm, type RecentFood } from "./food-form";

function DeleteButton({ name }: { name: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="ghost"
      size="icon-sm"
      disabled={pending}
      aria-label={`Delete ${name}`}
    >
      {pending ? <LoaderCircle className="animate-spin" /> : <Trash2 />}
    </Button>
  );
}

function EntryRow({ entry, day, meal }: { entry: FoodEntry; day: string; meal: MealType }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <FoodForm mode="edit" day={day} meal={meal} entry={entry} onDone={() => setEditing(false)} />
    );
  }

  const hasMacros = entry.protein_g + entry.carbs_g + entry.fat_g > 0;

  return (
    <li className="border-border flex items-center gap-3 rounded-2xl border bg-white/[.03] py-2.5 pr-2 pl-4">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{entry.name}</p>
        {hasMacros && (
          <p className="text-muted-foreground font-mono text-xs">
            P {entry.protein_g} · C {entry.carbs_g} · F {entry.fat_g}
          </p>
        )}
      </div>
      <span className="font-display text-xl font-bold tabular-nums">
        {Math.round(entry.calories)}
      </span>
      <span className="text-muted-foreground -ml-2 font-mono text-xs">kcal</span>
      <div className="flex">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setEditing(true)}
          aria-label={`Edit ${entry.name}`}
        >
          <Pencil />
        </Button>
        <form action={deleteFood}>
          <input type="hidden" name="id" value={entry.id} />
          <DeleteButton name={entry.name} />
        </form>
      </div>
    </li>
  );
}

type MealSectionProps = {
  meal: MealType;
  entries: FoodEntry[];
  day: string;
  recent: RecentFood[];
};

/** One meal of the day: its foods, their total, and a button to add another. */
export function MealSection({ meal, entries, day, recent }: MealSectionProps) {
  const [adding, setAdding] = useState(false);
  const total = sumEntries(entries).calories;
  const headingId = `meal-${meal}`;

  return (
    <section aria-labelledby={headingId} className="glass flex flex-col gap-4 rounded-3xl p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id={headingId} className="text-2xl font-bold">
          {MEAL_LABELS[meal]}
        </h2>
        <span className="text-muted-foreground font-mono text-sm tabular-nums">{total} kcal</span>
      </div>

      {entries.length > 0 && (
        <ul className="flex flex-col gap-2">
          {entries.map((entry) => (
            <EntryRow key={entry.id} entry={entry} day={day} meal={meal} />
          ))}
        </ul>
      )}

      {adding ? (
        <FoodForm
          mode="add"
          day={day}
          meal={meal}
          recent={recent}
          onDone={() => setAdding(false)}
        />
      ) : (
        <div className="flex items-center justify-between gap-3">
          {entries.length === 0 && (
            <p className="text-muted-foreground text-sm">Nothing logged yet.</p>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={() => setAdding(true)}
          >
            <Plus /> Add food
          </Button>
        </div>
      )}
    </section>
  );
}
