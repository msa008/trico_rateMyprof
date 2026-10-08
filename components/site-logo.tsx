import Link from "next/link";
export function SiteLogo() {
  return <Link href="/" className="focus-ring inline-flex items-center gap-2 rounded-lg" aria-label="TriCo Reviews home">
    <span className="grid size-8 place-items-center rounded-[10px] bg-[#11182a] text-sm font-bold text-white">T</span>
    <span className="text-[17px] font-bold tracking-[-.02em]">TriCo Reviews</span>
  </Link>;
}
