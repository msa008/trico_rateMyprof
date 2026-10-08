import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = { title: { default: "TriCo Reviews", template: "%s · TriCo Reviews" }, description: "Honest course reviews, professor insights, and real answers from verified Tri-Co students.", icons: { icon: "/favicon.svg" } };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><SiteHeader/><main>{children}</main><SiteFooter/><Toaster richColors position="top-center" /></body></html>;
}
