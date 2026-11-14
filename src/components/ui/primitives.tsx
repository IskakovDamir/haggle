// Small shadcn-style primitives: card, badge, input, switch.
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border border-line bg-card", className)} {...props} />;
}

const badgeVariants = cva("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", {
  variants: {
    tone: {
      neutral: "bg-ink/7 text-ink",
      green: "bg-green-soft text-green",
      leak: "bg-leak-soft text-leak",
      lime: "bg-lime text-ink",
      alarm: "bg-alarm-soft text-alarm",
      outline: "border border-line text-muted",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export function Badge({
  className,
  tone,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-line bg-white px-3.5 text-base text-ink placeholder:text-muted/70",
        className,
      )}
      {...props}
    />
  );
}

export function Switch({
  checked,
  onCheckedChange,
  label,
  className,
}: {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative h-8 w-14 shrink-0 cursor-pointer rounded-full transition-colors",
        checked ? "bg-green" : "bg-ink/20",
        className,
      )}
    >
      <span
        className={cn(
          "absolute top-1 left-1 size-6 rounded-full bg-white shadow transition-transform",
          checked && "translate-x-6",
        )}
      />
    </button>
  );
}

/** Every screen that shows sample data carries this. */
export function SampleBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-leak/30 bg-leak-soft px-2.5 py-0.5 text-xs font-medium text-leak",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-leak" />
      Sample data
    </span>
  );
}
