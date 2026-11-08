"use client";

import { useActionState, useState } from "react";
import { addFood, updateFood } from "@/app/app/food/actions";
import { FormMessage } from "@/components/auth/form-parts";
import { SubmitButton } from "@/components/auth/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialFormState, type FormState } from "@/lib/auth/form-state";
import { MEAL_LABELS, MEAL_TYPES, type MealType } from "@/lib/food/meals";
import { cn } from "@/lib/utils";
import type { FoodEntry } from "@/lib/food/totals";

export type RecentFood = {
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

type FoodFormProps = {
  mode: "add" | "edit";
  day: string;
  meal: MealType;
  entry?: FoodEntry;
  recent?: RecentFood[];
  onDone: () => void;
};

const show = (value: number | undefined) =>
  value === undefined || value === 0 ? "" : String(value);

function NumberField({
  label,
  name,
  value,
  onChange,
  error,
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
}) {
  const id = `food-${name}`;
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        inputMode="decimal"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

/** Adds a food, or edits one. The same fields serve both. */
export function FoodForm({ mode, day, meal, entry, recent = [], onDone }: FoodFormProps) {
  const [name, setName] = useState(entry?.name ?? "");
  const [calories, setCalories] = useState(entry ? String(entry.calories) : "");
  const [protein, setProtein] = useState(show(entry?.protein_g));
  const [carbs, setCarbs] = useState(show(entry?.carbs_g));
  const [fat, setFat] = useState(show(entry?.fat_g));
  const [chosenMeal, setChosenMeal] = useState<MealType>(meal);

  const [state, formAction] = useActionState(async (previous: FormState, formData: FormData) => {
    const result = await (mode === "add" ? addFood : updateFood)(previous, formData);
    if (result.message) onDone();
    return result;
  }, initialFormState);

  function fillFrom(food: RecentFood) {
    setName(food.name);
    setCalories(String(food.calories));
    setProtein(show(food.protein_g));
    setCarbs(show(food.carbs_g));
    setFat(show(food.fat_g));
  }

  return (
    <form
      action={formAction}
      noValidate
      className="border-border flex flex-col gap-4 rounded-2xl border bg-white/[.03] p-4"
    >
      <input type="hidden" name="day" value={day} />
      <input type="hidden" name="meal" value={chosenMeal} />
      {entry && <input type="hidden" name="id" value={entry.id} />}

      {mode === "add" && recent.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="eyebrow">Eat this often?</span>
          <div className="flex flex-wrap gap-2">
            {recent.map((food) => (
              <button
                key={food.name}
                type="button"
                onClick={() => fillFrom(food)}
                className="border-border hover:border-ring/60 focus-visible:ring-ring/50 max-w-full truncate rounded-full border bg-white/[.04] px-3 py-1.5 text-sm transition-colors outline-none focus-visible:ring-3"
              >
                {food.name}{" "}
                <span className="text-muted-foreground font-mono text-xs">{food.calories}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <FormMessage state={state} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="food-name">What did you eat?</Label>
        <Input
          id="food-name"
          name="name"
          autoComplete="off"
          autoFocus
          value={name}
          placeholder="Dal tadka, 1 katori"
          aria-invalid={state.fieldErrors?.name ? true : undefined}
          onChange={(event) => setName(event.target.value)}
        />
      </div>

      <NumberField
        label="Calories"
        name="calories"
        value={calories}
        onChange={setCalories}
        placeholder="250"
        error={state.fieldErrors?.calories?.[0]}
      />

      {/* Buttons, not a dropdown: React resets a native dropdown after a failed save. */}
      <div role="group" aria-label="Meal" className="flex flex-col gap-1.5">
        <span className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
          Meal
        </span>
        <div className="grid grid-cols-4 gap-1.5">
          {MEAL_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              aria-pressed={chosenMeal === type}
              onClick={() => setChosenMeal(type)}
              className={cn(
                "focus-visible:ring-ring/50 h-10 rounded-xl border text-sm font-semibold transition-colors outline-none focus-visible:ring-3",
                chosenMeal === type
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:border-ring/50 hover:text-foreground bg-white/[.03]",
              )}
            >
              {MEAL_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <NumberField
          label="Protein g"
          name="protein"
          value={protein}
          onChange={setProtein}
          placeholder="0"
          error={state.fieldErrors?.protein?.[0]}
        />
        <NumberField
          label="Carbs g"
          name="carbs"
          value={carbs}
          onChange={setCarbs}
          placeholder="0"
          error={state.fieldErrors?.carbs?.[0]}
        />
        <NumberField
          label="Fat g"
          name="fat"
          value={fat}
          onChange={setFat}
          placeholder="0"
          error={state.fieldErrors?.fat?.[0]}
        />
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <SubmitButton pendingLabel="Saving">
          {mode === "add" ? "Add food" : "Save changes"}
        </SubmitButton>
      </div>
    </form>
  );
}
