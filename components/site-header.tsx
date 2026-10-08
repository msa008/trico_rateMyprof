import Link from "next/link";
import { Menu, Search } from "lucide-react";
import { SiteLogo } from "./site-logo";
import { Button } from "./ui/button";

export function SiteHeader() {
  return <header className="sticky top-0 z-40 border-b border-[#e5e8ef]/90 bg-white/90 backdrop-blur-xl">
    <div className="container flex h-16 items-center justify-between gap-4">
      <SiteLogo />
      <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
        <Link className="focus-ring rounded-lg px-3 py-2 text-sm font-medium text-[#475467] hover:text-[#11182a]" href="/questions">Questions</Link>
        <Link className="focus-ring rounded-lg px-3 py-2 text-sm font-medium text-[#475467] hover:text-[#11182a]" href="/colleges/haverford">Colleges</Link>
        <Link className="focus-ring rounded-lg px-3 py-2 text-sm font-medium text-[#475467] hover:text-[#11182a]" href="/guidelines">Guidelines</Link>
      </nav>
      <div className="flex items-center gap-2">
        <Link href="/#search" className="focus-ring grid size-10 place-items-center rounded-xl text-[#475467] hover:bg-[#f2f4f7]" aria-label="Search"><Search className="size-[18px]" /></Link>
        <Button asChild variant="secondary" size="sm" className="hidden sm:inline-flex"><Link href="/login">Sign in</Link></Button>
        <Button asChild size="sm"><Link href="/reviews/new">Write a review</Link></Button>
        <details className="relative md:hidden"><summary className="focus-ring grid size-10 cursor-pointer list-none place-items-center rounded-xl" aria-label="Open menu"><Menu className="size-5" /></summary><nav className="absolute right-0 top-12 grid w-48 gap-1 rounded-xl border border-[#e5e8ef] bg-white p-2 shadow-xl"><Link className="rounded-lg px-3 py-2 text-sm hover:bg-[#f2f4f7]" href="/questions">Questions</Link><Link className="rounded-lg px-3 py-2 text-sm hover:bg-[#f2f4f7]" href="/colleges/haverford">Colleges</Link><Link className="rounded-lg px-3 py-2 text-sm hover:bg-[#f2f4f7]" href="/guidelines">Guidelines</Link></nav></details>
      </div>
    </div>
  </header>;
}
