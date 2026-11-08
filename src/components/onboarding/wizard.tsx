"use client";

import { useActionState, useState, useSyncExternalStore, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { completeOnboarding } from "@/app/onboarding/actions";
import { FormMessage } from "@/components/auth/form-parts";
import { SubmitButton } from "@/components/auth/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { initialFormState } from "@/lib/auth/form-state";
import {
  MAX_AGE,
  MAX_CALORIES,
  MIN_AGE,
  MIN_CALORIES,
  ageOn,
  calculateTargets,
  cmToFtIn,
  ftInToCm,
  kgToLb,
  lbToKg,
  macrosForCalories,
  type ActivityLevel,
  type GoalType,
  type Sex,
  type Units,
} from "@/lib/nutrition/targets";
import { cn } from "@/lib/utils";

export type OnboardingDefaults = {
  displayName: string;
  sex?: Sex;
  birthDate?: string;
  heightCm?: number;
  weightKg?: number;
  units: Units;
  activity?: ActivityLevel;
  goal?: GoalType;
  targetWeightKg?: number;
};

const STEPS = ["About you", "Your body", "Your goal", "Your plan"] as const;

const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const ACTIVITY_OPTIONS: { value: ActivityLevel; title: string; hint: string }[] = [
  { value: "sedentary", title: "Mostly sitting", hint: "Desk job, little exercise" },
  { value: "light", title: "Lightly active", hint: "Exercise 1 to 3 days a week" },
  { value: "moderate", title: "Moderately active", hint: "Exercise 3 to 5 days a week" },
  { value: "active", title: "Very active", hint: "Hard exercise 6 to 7 days a week" },
  { value: "very_active", title: "Athlete", hint: "Hard daily training or a physical job" },
];

const GOAL_OPTIONS: { value: GoalType; title: string; hint: string }[] = [
  { value: "lose_fat", title: "Lose fat", hint: "About half a kilo a week" },
  { value: "maintain", title: "Stay the same", hint: "Keep your current weight" },
  { value: "build_muscle", title: "Build muscle", hint: "A small, steady surplus" },
];

const num = (text: string) => (text.trim() === "" ? NaN : Number(text));
const round1 = (value: number) => Math.round(value * 10) / 10;
const show = (value: number | undefined, digits = 0) =>
  value === undefined || Number.isNaN(value) ? "" : String(Number(value.toFixed(digits)));

function subscribeNothing() {
  return () => {};
}
const readTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
const readTimezoneOnServer = () => "UTC";

function OptionButton({
  selected,
  onClick,
  title,
  hint,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "focus-visible:ring-ring/50 flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-colors outline-none focus-visible:ring-3",
        selected
          ? "border-primary bg-primary/10"
          : "border-border hover:border-ring/50 bg-white/[.03] hover:bg-white/[.06]",
      )}
    >
      <span className="flex flex-col">
        <span className="font-semibold">{title}</span>
        {hint && <span className="text-muted-foreground text-sm">{hint}</span>}
      </span>
      {selected && <Check className="text-primary size-5 shrink-0" aria-hidden="true" />}
    </button>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T | "";
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="grid gap-1.5"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "focus-visible:ring-ring/50 h-11 rounded-xl border text-sm font-semibold transition-colors outline-none focus-visible:ring-3",
            value === option.value
              ? "border-primary bg-primary/10 text-foreground"
              : "border-border text-muted-foreground hover:border-ring/50 hover:text-foreground bg-white/[.03]",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
  hint,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-muted-foreground text-sm">{hint}</p>}
    </div>
  );
}

export function OnboardingWizard({ defaults }: { defaults: OnboardingDefaults }) {
  const [state, action] = useActionState(completeOnboarding, initialFormState);
  const timezone = useSyncExternalStore(subscribeNothing, readTimezone, readTimezoneOnServer);

  const [step, setStep] = useState(0);

  // Step 1
  const [name, setName] = useState(defaults.displayName);
  const [sex, setSex] = useState<Sex | "">(defaults.sex ?? "");
  const [birthDate, setBirthDate] = useState(defaults.birthDate ?? "");

  // Step 2. Each unit system keeps its own text so typing never fights a conversion.
  const [units, setUnits] = useState<Units>(defaults.units);
  const startHeight = defaults.heightCm;
  const startWeight = defaults.weightKg;
  const [cm, setCm] = useState(show(startHeight, 1));
  const [feet, setFeet] = useState(startHeight ? String(cmToFtIn(startHeight).feet) : "");
  const [inches, setInches] = useState(startHeight ? String(cmToFtIn(startHeight).inches) : "");
  const [kg, setKg] = useState(show(startWeight, 1));
  const [lb, setLb] = useState(startWeight ? show(kgToLb(startWeight), 1) : "");

  // Step 3
  const [activity, setActivity] = useState<ActivityLevel | "">(defaults.activity ?? "");
  const [goal, setGoal] = useState<GoalType | "">(defaults.goal ?? "");
  const [targetWeight, setTargetWeight] = useState(
    defaults.targetWeightKg
      ? show(
          defaults.units === "imperial" ? kgToLb(defaults.targetWeightKg) : defaults.targetWeightKg,
          1,
        )
      : "",
  );

  // Step 4. null means "use the suggestion".
  const [calorieChoice, setCalorieChoice] = useState<number | null>(null);

  const heightCm = round1(units === "metric" ? num(cm) : ftInToCm(num(feet), num(inches) || 0));
  const weightKg = round1(units === "metric" ? num(kg) : lbToKg(num(lb)));
  const targetWeightKg =
    targetWeight.trim() === ""
      ? undefined
      : round1(units === "metric" ? num(targetWeight) : lbToKg(num(targetWeight)));
  const age = birthDate ? ageOn(birthDate) : NaN;

  function switchUnits(next: Units) {
    if (next === units) return;
    if (next === "imperial") {
      if (heightCm > 0) {
        const parts = cmToFtIn(heightCm);
        setFeet(String(parts.feet));
        setInches(String(parts.inches));
      }
      if (weightKg > 0) setLb(show(kgToLb(weightKg), 1));
      if (targetWeightKg) setTargetWeight(show(kgToLb(targetWeightKg), 1));
    } else {
      if (heightCm > 0) setCm(show(heightCm, 1));
      if (weightKg > 0) setKg(show(weightKg, 1));
      if (targetWeightKg) setTargetWeight(show(targetWeightKg, 1));
    }
    setUnits(next);
  }

  const stepValid = [
    name.trim().length > 0 && sex !== "" && age >= MIN_AGE && age <= MAX_AGE,
    heightCm >= 100 && heightCm <= 250 && weightKg >= 30 && weightKg <= 300,
    activity !== "" && goal !== "",
    true,
  ][step];

  const ready =
    sex !== "" && activity !== "" && goal !== "" && age >= MIN_AGE && heightCm > 0 && weightKg > 0;
  const targets = ready ? calculateTargets({ sex, age, heightCm, weightKg, activity, goal }) : null;

  const calories = calorieChoice ?? targets?.calories ?? 2000;
  const macros = ready && goal ? macrosForCalories(calories, weightKg, goal) : null;
  const sliderMin = MIN_CALORIES;
  const sliderMax = Math.min(MAX_CALORIES, Math.max(2600, (targets?.maintenance ?? 2000) + 1200));

  function next() {
    if (!stepValid) return;
    if (step === 2) setCalorieChoice(null); // always start from a fresh suggestion
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  const lastStep = step === STEPS.length - 1;
  const maxBirthDate = new Date(new Date().getFullYear() - MIN_AGE, 11, 31)
    .toISOString()
    .slice(0, 10);

  return (
    <form
      action={action}
      noValidate
      className="flex flex-col gap-8"
      onKeyDown={(event) => {
        // Enter should move forward, not submit the form half way through.
        if (event.key === "Enter" && !lastStep && event.target instanceof HTMLInputElement) {
          event.preventDefault();
          next();
        }
      }}
    >
      {/* Everything is sent on the last step, whichever step the fields live on. */}
      <input type="hidden" name="displayName" value={name} />
      <input type="hidden" name="sex" value={sex} />
      <input type="hidden" name="birthDate" value={birthDate} />
      <input type="hidden" name="units" value={units} />
      <input type="hidden" name="heightCm" value={Number.isNaN(heightCm) ? "" : heightCm} />
      <input type="hidden" name="weightKg" value={Number.isNaN(weightKg) ? "" : weightKg} />
      <input type="hidden" name="activity" value={activity} />
      <input type="hidden" name="goal" value={goal} />
      <input
        type="hidden"
        name="targetWeightKg"
        value={targetWeightKg === undefined || Number.isNaN(targetWeightKg) ? "" : targetWeightKg}
      />
      <input type="hidden" name="calories" value={calories} />
      <input type="hidden" name="timezone" value={timezone} />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="eyebrow">
            Step {step + 1} of {STEPS.length}
          </span>
          <span className="text-muted-foreground font-mono text-xs uppercase">{STEPS[step]}</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
          {STEPS.map((title, index) => (
            <span
              key={title}
              className={cn(
                "h-1.5 rounded-full transition-colors",
                index <= step ? "bg-primary" : "bg-white/10",
              )}
            />
          ))}
        </div>
      </div>

      {step === 0 && (
        <section className="flex flex-col gap-6" aria-labelledby="step-title">
          <div className="flex flex-col gap-2">
            <h1 id="step-title" className="text-4xl font-bold">
              Let&apos;s set you up
            </h1>
            <p className="text-muted-foreground">
              Four quick questions to work out your daily targets.
            </p>
          </div>
          <Field label="Your name" htmlFor="ob-name">
            <Input
              id="ob-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              placeholder="Your name"
            />
          </Field>
          <Field label="Sex" hint="Only used for the calorie estimate.">
            <Segmented label="Sex" value={sex} options={SEX_OPTIONS} onChange={setSex} />
          </Field>
          <Field
            label="Date of birth"
            htmlFor="ob-birth"
            hint={
              Number.isNaN(age)
                ? undefined
                : age < MIN_AGE || age > MAX_AGE
                  ? `APEX is for ages ${MIN_AGE} to ${MAX_AGE}.`
                  : `You are ${age}.`
            }
          >
            <Input
              id="ob-birth"
              type="date"
              value={birthDate}
              max={maxBirthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              autoComplete="bday"
            />
          </Field>
        </section>
      )}

      {step === 1 && (
        <section className="flex flex-col gap-6" aria-labelledby="step-title">
          <div className="flex flex-col gap-2">
            <h1 id="step-title" className="text-4xl font-bold">
              Your body
            </h1>
            <p className="text-muted-foreground">Your current height and weight.</p>
          </div>
          <Segmented
            label="Units"
            value={units}
            options={[
              { value: "metric", label: "Metric (cm, kg)" },
              { value: "imperial", label: "Imperial (ft, lb)" },
            ]}
            onChange={switchUnits}
          />
          {units === "metric" ? (
            <>
              <Field label="Height (cm)" htmlFor="ob-cm">
                <Input
                  id="ob-cm"
                  inputMode="decimal"
                  value={cm}
                  onChange={(e) => setCm(e.target.value)}
                  placeholder="178"
                />
              </Field>
              <Field label="Weight (kg)" htmlFor="ob-kg">
                <Input
                  id="ob-kg"
                  inputMode="decimal"
                  value={kg}
                  onChange={(e) => setKg(e.target.value)}
                  placeholder="76"
                />
              </Field>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Height (ft)" htmlFor="ob-ft">
                  <Input
                    id="ob-ft"
                    inputMode="numeric"
                    value={feet}
                    onChange={(e) => setFeet(e.target.value)}
                    placeholder="5"
                  />
                </Field>
                <Field label="(in)" htmlFor="ob-in">
                  <Input
                    id="ob-in"
                    inputMode="numeric"
                    value={inches}
                    onChange={(e) => setInches(e.target.value)}
                    placeholder="10"
                  />
                </Field>
              </div>
              <Field label="Weight (lb)" htmlFor="ob-lb">
                <Input
                  id="ob-lb"
                  inputMode="decimal"
                  value={lb}
                  onChange={(e) => setLb(e.target.value)}
                  placeholder="168"
                />
              </Field>
            </>
          )}
          {!stepValid && (heightCm > 0 || weightKg > 0) && (
            <p className="text-muted-foreground text-sm">
              Enter a height between 100 and 250 cm and a weight between 30 and 300 kg.
            </p>
          )}
        </section>
      )}

      {step === 2 && (
        <section className="flex flex-col gap-6" aria-labelledby="step-title">
          <div className="flex flex-col gap-2">
            <h1 id="step-title" className="text-4xl font-bold">
              Your goal
            </h1>
            <p className="text-muted-foreground">
              How active you are, and what you are aiming for.
            </p>
          </div>
          <Field label="Activity level">
            <div className="flex flex-col gap-2">
              {ACTIVITY_OPTIONS.map((option) => (
                <OptionButton
                  key={option.value}
                  selected={activity === option.value}
                  onClick={() => setActivity(option.value)}
                  title={option.title}
                  hint={option.hint}
                />
              ))}
            </div>
          </Field>
          <Field label="Goal">
            <div className="flex flex-col gap-2">
              {GOAL_OPTIONS.map((option) => (
                <OptionButton
                  key={option.value}
                  selected={goal === option.value}
                  onClick={() => setGoal(option.value)}
                  title={option.title}
                  hint={option.hint}
                />
              ))}
            </div>
          </Field>
          {(goal === "lose_fat" || goal === "build_muscle") && (
            <Field
              label={`Target weight (${units === "metric" ? "kg" : "lb"}), optional`}
              htmlFor="ob-target"
            >
              <Input
                id="ob-target"
                inputMode="decimal"
                value={targetWeight}
                onChange={(e) => setTargetWeight(e.target.value)}
                placeholder={units === "metric" ? "70" : "154"}
              />
            </Field>
          )}
        </section>
      )}

      {lastStep && targets && macros && (
        <section className="flex flex-col gap-6" aria-labelledby="step-title">
          <div className="flex flex-col gap-2">
            <h1 id="step-title" className="text-4xl font-bold">
              Your daily plan
            </h1>
            <p className="text-muted-foreground">
              A starting point worked out from your answers. Change it if you like.
            </p>
          </div>

          <div className="glass flex flex-col gap-5 rounded-3xl p-6">
            <div className="flex items-baseline justify-between gap-4">
              <span className="eyebrow">Calories a day</span>
              {calorieChoice !== null && calorieChoice !== targets.calories && (
                <button
                  type="button"
                  className="text-ice text-sm underline-offset-4 hover:underline"
                  onClick={() => setCalorieChoice(null)}
                >
                  Reset to {targets.calories.toLocaleString("en-US")}
                </button>
              )}
            </div>
            <p className="font-display text-6xl font-bold tracking-tight tabular-nums">
              {calories.toLocaleString("en-US")}
              <span className="text-muted-foreground ml-2 text-lg font-medium">kcal</span>
            </p>
            <Slider
              min={sliderMin}
              max={sliderMax}
              step={10}
              value={[Math.min(Math.max(calories, sliderMin), sliderMax)]}
              onValueChange={([value]) => setCalorieChoice(value)}
              aria-label="Daily calories"
            />
            <p className="text-muted-foreground text-sm">
              Resting burn {targets.bmr.toLocaleString("en-US")} kcal, maintenance{" "}
              {targets.maintenance.toLocaleString("en-US")} kcal.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: "Protein", value: macros.proteinG, color: "bg-ice" },
              { label: "Carbs", value: macros.carbsG, color: "bg-gold" },
              { label: "Fat", value: macros.fatG, color: "bg-ember" },
            ].map((macro) => (
              <div
                key={macro.label}
                className="border-border rounded-2xl border bg-white/[.03] p-4"
              >
                <span
                  className={cn("mx-auto mb-2 block h-1.5 w-8 rounded-full", macro.color)}
                  aria-hidden="true"
                />
                <p className="font-display text-3xl font-bold tabular-nums">{macro.value}g</p>
                <p className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
                  {macro.label}
                </p>
              </div>
            ))}
          </div>

          <p className="text-muted-foreground text-sm">
            These are estimates, not medical advice. Talk to a doctor before a big change to how you
            eat.
          </p>

          <FormMessage state={state} />
        </section>
      )}

      <div className="flex items-center justify-between gap-3">
        {step > 0 ? (
          <Button type="button" variant="ghost" onClick={() => setStep((current) => current - 1)}>
            <ArrowLeft /> Back
          </Button>
        ) : (
          <span />
        )}
        {lastStep ? (
          <SubmitButton size="lg" pendingLabel="Saving your plan">
            Start tracking <ArrowRight />
          </SubmitButton>
        ) : (
          <Button type="button" size="lg" disabled={!stepValid} onClick={next}>
            Continue <ArrowRight />
          </Button>
        )}
      </div>
    </form>
  );
}
