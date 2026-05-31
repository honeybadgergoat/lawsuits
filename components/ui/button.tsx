import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "destructive";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variantStyles: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-blue-900",
  secondary: "bg-white text-slate-900 border border-slate-200 hover:bg-slate-50",
  destructive: "bg-red-700 text-white hover:bg-red-800"
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "min-h-12 rounded-md px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-60",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
