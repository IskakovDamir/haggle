// Small shadcn-style primitives: card, badge, input, switch.
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-line/80 bg-card shadow-[0_1px_2px_rgb(11_18_32/0.04),0_12px_32px_-18px_rgb(11_18_32/0.18)]",
        className,
      )}
      {...props}
    />
  );
}

const badgeVariants = cva("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", {
  variants: {
    tone: {
      neutral: "bg-hg-surface text-hg-ink-2",
      green: "bg-green-soft text-green",
      leak: "bg-leak-soft text-leak",
      lime: "bg-hg-blue text-white",
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
        "h-11 w-full rounded-2xl border border-line bg-white px-4 text-base text-ink transition-[border-color,box-shadow] placeholder:text-muted/70 hover:border-hg-blue-tint focus:border-hg-blue focus:shadow-[0_0_0_4px_rgb(47_107_255/0.12)] focus:outline-none",
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
        checked ? "bg-hg-blue" : "bg-ink/15",
        className,
      )}
    >
      <span
        className={cn(
          "absolute top-1 left-1 size-6 rounded-full bg-white shadow transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
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
        "inline-flex items-center gap-1.5 rounded-full border border-hg-blue-tint bg-hg-blue-soft px-2.5 py-0.5 text-xs font-medium text-hg-blue",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-hg-blue" />
      Sample data
    </span>
  );
}
