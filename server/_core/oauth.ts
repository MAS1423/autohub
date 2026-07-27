import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const";
import { compare as bcryptCompare, hash as bcryptHash } from "bcryptjs";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

/**
 * Portable email/password authentication routes.
 * Standard email/password authentication with bcrypt + JWT session cookies.
 *
 * POST /api/auth/register  — create account
 * POST /api/auth/login     — sign in
 * POST /api/auth/logout    — clear session cookie
 */
export function registerOAuthRoutes(app: Express) {
  const issueLocalSession = async (req: Request, res: Response, user: { openId: string; name?: string | null; id: number; email?: string | null; whatsapp?: string | null; role: string }, statusCode = 200) => {
    const sessionToken = await sdk.createSessionToken(user.openId, {
      name: user.name || "",
      expiresInMs: ONE_YEAR_MS,
    });
    const dealer = await db.getDealerByUserId(user.id);
    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
    res.status(statusCode).json({
      ok: true,
      user: { id: user.id, name: user.name, email: user.email, whatsapp: user.whatsapp, role: user.role },
      postLoginPath: user.role === "admin" ? "/admin" : dealer ? "/dashboard" : "/account",
    });
  };

  // ── Register ──────────────────────────────────────────────────────────────
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, name, whatsapp } = req.body as {
        email?: string;
        password?: string;
        name?: string;
        whatsapp?: string;
      };

      if (!email || !password) {
        res.status(400).json({ error: "email and password are required" });
        return;
      }

      const existing = await db.getUserByEmail(email.toLowerCase().trim());
      if (existing) {
        res.status(409).json({ error: "Email already registered" });
        return;
      }

      const passwordHash = await bcryptHash(password, 10);
      const openId = `local_${Date.now()}_${Math.random().toString(36).slice(2)}`;

      await db.upsertUser({
        openId,
        name: name?.trim() || email.split("@")[0],
        email: email.toLowerCase().trim(),
        whatsapp: whatsapp?.trim() || undefined,
        loginMethod: "email",
        passwordHash,
        lastSignedIn: new Date(),
      });

      const user = await db.getUserByOpenId(openId);
      if (!user) {
        res.status(500).json({ error: "Failed to create user" });
        return;
      }

      await issueLocalSession(req, res, user, 201);
    } catch (error) {
      console.error("[Auth] Register failed", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // ── Customer registration (name + WhatsApp required, email optional) ───────
  app.post("/api/auth/customer-register", async (req: Request, res: Response) => {
    try {
      const { name, whatsapp, email } = req.body as { name?: string; whatsapp?: string; email?: string };
      const normalizedName = name?.trim();
      const normalizedWhatsapp = whatsapp?.replace(/[\s()-]/g, "").trim();
      const normalizedEmail = email?.trim().toLowerCase() || undefined;
      if (!normalizedName || normalizedName.length < 2 || !normalizedWhatsapp || normalizedWhatsapp.length < 9) {
        res.status(400).json({ error: "Name and WhatsApp are required" });
        return;
      }
      const existingByPhone = await db.getUserByWhatsapp(normalizedWhatsapp);
      if (normalizedEmail) {
        const existingByEmail = await db.getUserByEmail(normalizedEmail);
        if (existingByEmail && existingByEmail.id !== existingByPhone?.id) {
          res.status(409).json({ error: "Email already registered" });
          return;
        }
      }
      if (existingByPhone) {
        const user = await db.updateUserProfile(existingByPhone.id, {
          name: normalizedName,
          whatsapp: normalizedWhatsapp,
          ...(normalizedEmail ? { email: normalizedEmail } : {}),
        });
        await issueLocalSession(req, res, user);
        return;
      }
      const openId = `customer_${normalizedWhatsapp.replace(/\D/g, "")}_${Date.now().toString(36)}`.slice(0, 64);
      await db.upsertUser({
        openId,
        name: normalizedName,
        email: normalizedEmail,
        whatsapp: normalizedWhatsapp,
        loginMethod: "whatsapp",
        lastSignedIn: new Date(),
      });
      const user = await db.getUserByOpenId(openId);
      if (!user) {
        res.status(500).json({ error: "Failed to create customer account" });
        return;
      }
      await issueLocalSession(req, res, user, 201);
    } catch (error) {
      console.error("[Auth] Customer registration failed", error);
      res.status(500).json({ error: "Customer registration failed" });
    }
  });

  // ── Customer local login by WhatsApp (for portable local demos) ─────────────
  app.post("/api/auth/customer-login", async (req: Request, res: Response) => {
    try {
      const whatsapp = (req.body as { whatsapp?: string }).whatsapp?.replace(/[\s()-]/g, "").trim();
      if (!whatsapp || whatsapp.length < 9) {
        res.status(400).json({ error: "WhatsApp is required" });
        return;
      }
      const user = await db.getUserByWhatsapp(whatsapp);
      if (!user) {
        res.status(404).json({ error: "Customer account not found" });
        return;
      }
      await issueLocalSession(req, res, user);
    } catch (error) {
      console.error("[Auth] Customer login failed", error);
      res.status(500).json({ error: "Customer login failed" });
    }
  });

  // ── Login ─────────────────────────────────────────────────────────────────
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body as { email?: string; password?: string };

      if (!email || !password) {
        res.status(400).json({ error: "email and password are required" });
        return;
      }

      const user = await db.getUserByEmail(email.toLowerCase().trim());
      if (!user || !user.passwordHash) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      const valid = await bcryptCompare(password, user.passwordHash);
      if (!valid) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      await issueLocalSession(req, res, user);
    } catch (error) {
      console.error("[Auth] Login failed", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // ── Logout ────────────────────────────────────────────────────────────────
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions });
    res.status(200).json({ ok: true });
  });

  // Legacy redirect: old OAuth callback URL → redirect to login page
  app.get("/api/oauth/callback", (_req: Request, res: Response) => {
    res.redirect(302, "/login");
  });
}
