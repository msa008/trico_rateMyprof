import { Star } from "lucide-react";
export function Rating({ value, count, size = "md" }: { value: number | null; count?: number; size?: "sm" | "md" | "lg" }) {
  if (value === null) return <span className="text-sm font-semibold text-[#667085]">Not yet rated</span>;
  const text = size === "lg" ? "text-5xl" : size === "sm" ? "text-sm" : "text-xl";
  return <div className="flex items-center gap-1.5"><Star className="size-4 fill-[#ffcf72] text-[#d7971d]"/><strong className={text}>{value.toFixed(1)}</strong>{typeof count === "number" && <span className="text-sm text-[#667085]">({count})</span>}</div>;
}
