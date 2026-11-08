import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { Slot } from "radix-ui";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-transparent text-sm font-semibold whitespace-nowrap transition-all duration-200 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-linear-to-b from-[#ff8660] to-primary text-primary-foreground shadow-[0_12px_30px_-10px_rgba(255,106,61,0.7),inset_0_1px_0_rgba(255,255,255,0.35)] hover:-translate-y-0.5 hover:from-[#ff9272] hover:to-[#ff7448]",
        outline:
          "border-border bg-white/[.03] text-foreground backdrop-blur-md hover:-translate-y-0.5 hover:border-ice/60 hover:bg-white/[.06] aria-expanded:bg-white/[.06]",
        secondary: "bg-secondary text-secondary-foreground hover:bg-accent aria-expanded:bg-accent",
        ghost:
          "text-foreground/80 hover:bg-white/[.06] hover:text-foreground aria-expanded:bg-white/[.06]",
        destructive:
          "bg-destructive/15 text-destructive hover:bg-destructive/25 focus-visible:ring-destructive/30",
        link: "rounded-none text-ice underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6",
        xs: "h-7 gap-1 px-3 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 px-4 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 px-8 text-base",
        icon: "size-11",
        "icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
