import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { Slot } from "radix-ui";

const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border border-transparent px-2.5 font-mono text-[0.7rem] font-medium tracking-wide whitespace-nowrap transition-all focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "border-primary/40 bg-primary/10 text-primary [a]:hover:bg-primary/20",
        secondary: "bg-secondary text-secondary-foreground [a]:hover:bg-accent",
        outline: "border-border text-foreground [a]:hover:bg-white/[.06]",
        ice: "border-ice/40 bg-ice/10 text-ice [a]:hover:bg-ice/20",
        gold: "border-gold/40 bg-gold/10 text-gold [a]:hover:bg-gold/20",
        success: "border-ok/40 bg-ok/10 text-ok [a]:hover:bg-ok/20",
        destructive:
          "border-destructive/40 bg-destructive/10 text-destructive [a]:hover:bg-destructive/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
