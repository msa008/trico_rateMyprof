import "server-only";
import { createHmac, randomUUID } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "trico_anonymous_session";

export async function getAnonymousContributorHash(create = false) {
  const jar = await cookies();
  let sessionId = jar.get(COOKIE_NAME)?.value;
  if (!sessionId && create) {
    sessionId = randomUUID();
    jar.set(COOKIE_NAME, sessionId, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }
  if (!sessionId) return null;
  const secret = process.env.RATE_LIMIT_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) return null;
  return createHmac("sha256", secret).update(sessionId).digest("hex");
}
