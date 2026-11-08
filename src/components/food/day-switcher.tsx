import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { addDays, dayLabel } from "@/lib/dates/tz";
import { cn } from "@/lib/utils";

const hrefFor = (day: string, today: string) =>
  day === today ? "/app/food" : `/app/food?day=${day}`;

/** Previous day, the current day's name, next day, and a way back to today. */
export function DaySwitcher({ day, today }: { day: string; today: string }) {
  const previous = addDays(day, -1);
  const next = addDays(day, 1);

  return (
    <div className="flex items-center gap-2">
      <Link
        href={hrefFor(previous, today)}
        aria-label="Previous day"
        className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }))}
      >
        <ChevronLeft />
      </Link>
      <span className="min-w-28 text-center font-semibold" aria-live="polite">
        {dayLabel(day, today)}
      </span>
      <Link
        href={hrefFor(next, today)}
        aria-label="Next day"
        className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }))}
      >
        <ChevronRight />
      </Link>
      {day !== today && (
        <Link
          href="/app/food"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "ml-1")}
        >
          Back to today
        </Link>
      )}
    </div>
  );
}
