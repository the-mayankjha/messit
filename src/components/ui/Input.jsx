import { forwardRef } from "react";
import { cn } from "../../lib/utils";

const Input = forwardRef(({ className, type, icon: Icon, label, ...props }, ref) => {
  return (
    <div className="space-y-2 w-full">
      {label && (
        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">
          {label}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary/70 transition-colors" />
        )}
        <input
          type={type}
          className={cn(
            "flex w-full rounded-2xl border border-border/40 bg-secondary/15 px-5 py-4 text-sm transition-all shadow-inner",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "placeholder:text-muted-foreground/30",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-primary/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "selection:bg-primary/30 selection:text-foreground",
            /* Autofill styling override - Using a neutral theme-adaptive shadow */
            "dark:[&:-webkit-autofill]:shadow-[0_0_0_1000px_#191919_inset] [&:-webkit-autofill]:shadow-[0_0_0_1000px_#ffffff_inset] [&:-webkit-autofill]:text-fill-foreground",
            Icon && "pl-12",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    </div>
  );
});

Input.displayName = "Input";

export { Input };
