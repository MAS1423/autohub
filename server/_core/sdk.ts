import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const";
import { ForbiddenError } from "../../shared/_core/errors";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

export type SessionPayload = {
  userId: number;
  openId: string;
  name: string;
};

// ─── Portable JWT Auth SDK ────────────────────────────────────────────────────
// No external OAuth provider required. Uses standard HS256 JWT.

function getSecret(): Uint8Array {
  const secret = ENV.cookieSecret;
  if (!secret || secret.length < 16) {
    console.warn("[Auth] JWT_SECRET is short — using insecure default. Set JWT_SECRET in .env");
  }
  return new TextEncoder().encode(secret || "insecure-default-secret-change-me!!");
}

export type AuthenticatedUser = User;

export const sdk = {
  /** Create a signed JWT session token. */
  async createSessionToken(
    openId: string,
    opts: { name: string; expiresInMs: number }
  ): Promise<string> {
    return new SignJWT({ openId, name: opts.name } as Record<string, unknown>)
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt()
      .setExpirationTime(Math.floor((Date.now() + opts.expiresInMs) / 1000))
      .sign(getSecret());
  },

  /** Verify a JWT and return openId, or null. */
  async verifySessionToken(token: string): Promise<{ openId: string; name: string } | null> {
    try {
      const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
      if (typeof payload.openId !== "string") return null;
      return { openId: payload.openId as string, name: (payload.name as string) ?? "" };
    } catch {
      return null;
    }
  },

  /** Authenticate an Express request via cookie or Bearer header. */
  async authenticateRequest(req: Request): Promise<AuthenticatedUser> {
    let token: string | undefined;
    const cookies = parseCookieHeader(req.headers.cookie ?? "");
    token = cookies[COOKIE_NAME];
    if (!token) {
      const auth = req.headers.authorization ?? "";
      if (auth.startsWith("Bearer ")) token = auth.slice(7);
    }
    if (!token) throw ForbiddenError("No session token");
    const session = await sdk.verifySessionToken(token);
    if (!session) throw ForbiddenError("Invalid or expired session token");
    const user = await db.getUserByOpenId(session.openId);
    if (!user) throw ForbiddenError("User not found");
    return user;
  },
};
