import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AFFILIATE_SESSION_COOKIE } from "@/lib/affiliate";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/affiliates?error=missing_token", req.url));
  }

  const affiliate = await prisma.affiliate.findFirst({
    where: {
      accessToken: token,
      accessTokenExpiresAt: { gt: new Date() },
      status: "ACTIVE",
    },
    select: { id: true },
  });

  if (!affiliate) {
    return NextResponse.redirect(new URL("/affiliates?error=invalid_token", req.url));
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://flowfiy.com";
  const response = NextResponse.redirect(new URL("/affiliate/dashboard", appUrl));

  response.cookies.set(AFFILIATE_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: "/",
  });

  return response;
}
