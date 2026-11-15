import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-[-0.005em] whitespace-nowrap transition-[background-color,box-shadow,transform,filter] duration-200 ease-out hover:-translate-y-px active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-hg-blue text-white hover:brightness-110 hover:shadow-[0_10px_24px_-14px_rgb(47_107_255/0.8)]",
        outline: "border border-line bg-card text-ink hover:border-hg-blue-tint hover:bg-hg-blue-soft",
        ghost: "text-ink hover:bg-hg-blue-soft",
        danger: "bg-alarm text-white hover:brightness-110",
        ink: "bg-ink text-white shadow-[0_8px_24px_-12px_rgb(11_18_32/0.6)] hover:bg-hg-ink-2",
      },
      size: {
        sm: "h-8 px-3.5 text-[13px]",
        default: "h-10 px-5 text-sm",
        lg: "h-12 px-6 text-[15px]",
        xl: "h-16 px-8 text-lg",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };
