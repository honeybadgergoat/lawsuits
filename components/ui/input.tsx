import { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      dir={props.dir ?? "auto"}
      className={cn(
        "min-h-12 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20",
        className
      )}
      {...props}
    />
  );
}
