"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export function SliderDemo() {
  const [weight, setWeight] = useState([76]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Label htmlFor="weight-slider">Weight</Label>
        <output className="font-mono text-sm tabular-nums" htmlFor="weight-slider">
          {weight[0]} kg
        </output>
      </div>
      <Slider id="weight-slider" min={40} max={140} value={weight} onValueChange={setWeight} />
    </div>
  );
}
