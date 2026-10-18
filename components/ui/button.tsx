import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva("focus-ring inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50", {
  variants: {
    variant: {
      default: "bg-[#a91d35] !text-white hover:bg-[#8f182d]",
      secondary: "border border-[#dfe3ec] bg-white text-[#1e293b] hover:bg-[#f7f8fb]",
      ghost: "text-[#475467] hover:bg-[#eef1f6] hover:text-[#11182a]",
      danger: "bg-red-600 text-white hover:bg-red-700",
    },
    size: { default: "h-11 px-5 text-[15px]", sm: "h-9 px-3 text-sm", lg: "h-13 px-6 text-base", icon: "size-10" },
  }, defaultVariants: { variant: "default", size: "default" },
});

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { asChild?: boolean }
export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
export { buttonVariants };
