import * as React from "react";
import { cn } from "@/lib/utils";
export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea className={cn("focus-ring min-h-28 w-full resize-y rounded-xl border border-[#dfe3ec] bg-white px-3.5 py-3 text-[15px] placeholder:text-[#98a2b3]", className)} {...props} />; }
