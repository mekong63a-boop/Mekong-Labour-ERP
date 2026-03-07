import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Set to true to skip auto-uppercase */
  skipUppercase?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, skipUppercase, onBlur, ...props }, ref) => {
  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    if (!skipUppercase && e.target.value) {
      const upper = e.target.value.toUpperCase();
      if (upper !== e.target.value) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype, 'value'
        )?.set;
        nativeInputValueSetter?.call(e.target, upper);
        e.target.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
    onBlur?.(e);
  };

  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      onBlur={handleBlur}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
