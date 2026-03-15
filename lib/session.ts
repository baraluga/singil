import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "singil_session";
const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "fallback-secret-change-in-prod"
);

export async function createSessionToken(): Promise<string> {
  return new SignJWT({ admin: true })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export { COOKIE_NAME };
