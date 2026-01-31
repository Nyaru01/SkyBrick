import { cn } from "../../lib/utils";

export function Button({ className, variant = "primary", size = "default", ...props }) {
    const variants = {
        primary: "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm",
        secondary: "bg-slate-200 text-slate-900 hover:bg-slate-300 active:bg-slate-400 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600 dark:active:bg-slate-500",
        danger: "bg-red-500 text-white hover:bg-red-600 active:bg-red-700",
        outline: "border-2 border-slate-300 bg-transparent hover:bg-slate-50 text-slate-700 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800",
        ghost: "bg-transparent hover:bg-slate-100 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800",
    };

    const sizes = {
        default: "h-12 px-6 text-base",
        sm: "h-9 px-3 text-sm",
        lg: "h-14 px-8 text-lg",
        icon: "h-12 w-12 p-2 flex items-center justify-center",
    };

    return (
        <button
            className={cn(
                "inline-flex items-center justify-center rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-50",
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        />
    );
}
