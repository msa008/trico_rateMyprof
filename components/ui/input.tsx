import * as React from "react";
import { cn } from "@/lib/utils";
export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) { return <input className={cn("focus-ring h-11 w-full rounded-xl border border-[#dfe3ec] bg-white px-3.5 text-[15px] placeholder:text-[#98a2b3] disabled:bg-[#f2f4f7]", className)} {...props} />; }
