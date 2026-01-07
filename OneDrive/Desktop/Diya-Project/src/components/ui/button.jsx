import { forwardRef } from "react";
import { cn } from "../../lib/utils";

const Button = forwardRef(({ className, variant = "default", size = "default", ...props }, ref) => {
    const variants = {
        default: "bg-gradient-to-r from-gold-600 to-gold-400 text-dark-900 hover:from-gold-500 hover:to-gold-300 shadow-lg shadow-gold-900/20",
        outline: "border border-gold-500/30 text-gold-400 hover:bg-gold-500/10",
        ghost: "text-gray-300 hover:text-white hover:bg-white/5",
    };

    const sizes = {
        default: "h-12 px-6 py-3",
        sm: "h-9 px-3",
        icon: "h-10 w-10",
    };

    return (
        <button
            className={cn(
                "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-300 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-95",
                variants[variant],
                sizes[size],
                className
            )}
            ref={ref}
            {...props}
        />
    );
});
Button.displayName = "Button";

export { Button };
