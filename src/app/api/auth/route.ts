import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const expected = process.env.PORTFOLIO_PASSWORD;

  if (!expected) {
    return NextResponse.json({ ok: false, error: "Not configured" }, { status: 500 });
  }

  if (password !== expected) {
    return NextResponse.json({ ok: false, error: "Invalid password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("portfolio_auth", expected, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
  return res;
}
