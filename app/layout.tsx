import type { Metadata } from "next";
import { Suspense } from "react";
import { Toaster } from "sonner";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SubmissionNotice } from "@/components/submission-notice";

export const metadata: Metadata = { title: { default: "TriCo Reviews", template: "%s · TriCo Reviews" }, description: "Anonymous course reviews, professor insights, and real answers from the Tri-Co community.", icons: { icon: "/favicon.svg" } };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><SiteHeader/><main><Suspense><SubmissionNotice/></Suspense>{children}</main><SiteFooter/><Toaster richColors position="top-center" /></body></html>;
}
