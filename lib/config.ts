export const COLLEGE_EMAIL_DOMAINS = ["haverford.edu", "brynmawr.edu", "swarthmore.edu"] as const;

export const colleges = [
  { slug: "haverford", name: "Haverford College", short: "HC", color: "#C43A30" },
  { slug: "bryn-mawr", name: "Bryn Mawr College", short: "BMC", color: "#F4C542" },
  { slug: "swarthmore", name: "Swarthmore College", short: "SC", color: "#8B1E3F" },
] as const;

export function emailDomain(email: string) {
  return email.trim().toLowerCase().split("@").at(-1) ?? "";
}

export function isAllowedEmail(email: string, allowed: readonly string[] = COLLEGE_EMAIL_DOMAINS) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && allowed.includes(emailDomain(email) as (typeof allowed)[number]);
}
