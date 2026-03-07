import * as React from "react";

import { cn } from "@/lib/utils";

const SKIP_UPPERCASE_TYPES = ["email", "password", "search", "url"];

export interface InputProps extends React.ComponentProps<"input"> {
  /** Set to true to skip auto-uppercase (e.g. for furigana fields) */
  skipUppercase?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, skipUppercase, onBlur, ...props }, ref) => {
    const shouldUppercase = !skipUppercase && !SKIP_UPPERCASE_TYPES.includes(type || "");

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (shouldUppercase && e.target.value) {
        const upper = e.target.value.toUpperCase();
        if (upper !== e.target.value) {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype, 'value'
          )?.set;
          nativeInputValueSetter?.call(e.target, upper);
          e.target.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
      onBlur?.(e);
    };

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        onBlur={handleBlur}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
