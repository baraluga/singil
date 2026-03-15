import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, COOKIE_NAME } from "@/lib/session";

const HARDCODED_USERNAME = "admin";

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();

  const validUsername = username === HARDCODED_USERNAME;
  const validPassword = password === process.env.CREATOR_PASSWORD;

  if (!validUsername || !validPassword) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await createSessionToken();
  const response = NextResponse.json({ ok: true });

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });

  return response;
}
