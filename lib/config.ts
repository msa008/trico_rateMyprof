import type { CSSProperties } from "react";

export const colleges = [
  { slug: "haverford", name: "Haverford College", short: "HC", color: "#981E32", darkColor: "#731526", softColor: "#F8ECEF", borderColor: "#D9A3AE", highlightColor: "#D6B56D" },
  { slug: "bryn-mawr", name: "Bryn Mawr College", short: "BMC", color: "#03335F", darkColor: "#022440", softColor: "#EEF4F9", borderColor: "#9BB4CB", highlightColor: "#F3B720" },
  { slug: "swarthmore", name: "Swarthmore College", short: "SC", color: "#631919", darkColor: "#481111", softColor: "#F6ECEC", borderColor: "#C9A0A0", highlightColor: "#D7B56D" },
] as const;

export function getCollegeTheme(slug: string) {
  return colleges.find((college) => college.slug === slug) ?? colleges[0];
}

export function collegeThemeStyle(slug: string): CSSProperties {
  const theme = getCollegeTheme(slug);
  return {
    "--college": theme.color,
    "--college-dark": theme.darkColor,
    "--college-soft": theme.softColor,
    "--college-border": theme.borderColor,
    "--college-highlight": theme.highlightColor,
  } as CSSProperties;
}
