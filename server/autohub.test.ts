import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 3,
      openId: "user@autohub.sa",
      email: "user@autohub.sa",
      whatsapp: "0500000003",
      name: "مستخدم تجريبي",
      loginMethod: "email",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin@autohub.sa",
      email: "admin@autohub.sa",
      whatsapp: "0500000001",
      name: "مدير النظام",
      loginMethod: "email",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

describe("auth", () => {
  it("me returns null for unauthenticated users", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("me returns user for authenticated users", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.name).toBe("مستخدم تجريبي");
  });

  it("logout clears session cookie", async () => {
    const clearedCookies: string[] = [];
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {
        clearCookie: (name: string) => { clearedCookies.push(name); },
      } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect(clearedCookies.length).toBeGreaterThan(0);
  });
});

describe("dealers router", () => {
  it("list returns array (empty when no DB)", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.dealers.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("bySlug returns null for non-existent slug", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.dealers.bySlug({ slug: "non-existent-slug-xyz" });
    expect(result).toBeNull();
  });

  it("register creates dealer with valid data", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.dealers.register({
      name: "معرض الاختبار",
      ownerName: "أحمد محمد",
      phone: "0501234567",
      city: "الرياض",
      brands: ["تويوتا", "هوندا"],
    });
    expect(result.success).toBe(true);
    expect(typeof result.slug).toBe("string");
    expect(result.slug).toContain("معرض");
  });
});

describe("vehicles router", () => {
  it("list returns array", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.vehicles.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("byId returns null for non-existent vehicle", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.vehicles.byId({ id: 999999 });
    expect(result).toBeNull();
  });
});

describe("reviews router", () => {
  it("byDealer returns reviews and rating", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.reviews.byDealer({ dealerId: 999999 });
    expect(result).toHaveProperty("reviews");
    expect(result).toHaveProperty("rating");
    expect(Array.isArray(result.reviews)).toBe(true);
    expect(result.rating.avg).toBe(0);
    expect(result.rating.count).toBe(0);
  });
});

describe("inquiries router", () => {
  it("create inquiry succeeds with valid data", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.inquiries.create({
      dealerId: 1,
      name: "سعد العمري",
      phone: "0551234567",
      message: "أريد الاستفسار عن سيارة تويوتا كامري",
    });
    expect(result.success).toBe(true);
  });
});

describe("contact router", () => {
  it("saves a public contact message and allows an admin to update its follow-up status", async () => {
    const publicCaller = appRouter.createCaller(createPublicContext());
    const adminCaller = appRouter.createCaller(createAdminContext());
    const before = await adminCaller.admin.contactMessages();

    const result = await publicCaller.contact.send({
      name: "سارة العتيبي",
      whatsapp: "0552345678",
      email: "sara@example.com",
      message: "أحتاج إلى مساعدة بخصوص آلية تسجيل معرض في منصة AutoHub.",
    });
    const after = await adminCaller.admin.contactMessages();
    const saved = after.find(message => message.id === result.id);

    expect(result.success).toBe(true);
    expect(after).toHaveLength(before.length + 1);
    expect(saved).toMatchObject({ name: "سارة العتيبي", whatsapp: "0552345678", status: "new" });

    await adminCaller.admin.updateContactStatus({ id: result.id!, status: "replied" });
    const updated = (await adminCaller.admin.contactMessages()).find(message => message.id === result.id);
    expect(updated?.status).toBe("replied");
  });
});


describe("advanced vehicle search", () => {
  it("filters results by more than one requested model", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.vehicles.search({
      models: ["لاند كروزر", "LX 600"],
      limit: 20,
    });

    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result.every(vehicle => ["لاند كروزر", "LX 600"].includes(vehicle.model))).toBe(true);
  });
});

describe("vehicle request broadcast", () => {
  it("requires an authenticated customer and saves the original request in the user history", async () => {
    const publicCaller = appRouter.createCaller(createPublicContext());
    await expect(publicCaller.vehicleRequests.broadcast({
      brand: "تويوتا",
      models: ["لاند كروزر"],
      message: "أبحث عن سيارة عائلية بحالة ممتازة مع سجل صيانة واضح.",
    })).rejects.toThrow();

    const customerCaller = appRouter.createCaller(createAuthContext());
    const before = await customerCaller.dashboard.myInquiries({ dealerId: 1 });
    const result = await customerCaller.vehicleRequests.broadcast({
      brand: "تويوتا",
      bodyType: "دفع رباعي",
      models: ["لاند كروزر", "راف 4"],
      trim: "GXR",
      minPrice: 100000,
      maxPrice: 200000,
      message: "أبحث عن سيارة عائلية بحالة ممتازة مع سجل صيانة واضح.",
    });

    const after = await customerCaller.dashboard.myInquiries({ dealerId: 1 });
    const ownRequests = await customerCaller.customer.requests();
    expect(result.success).toBe(true);
    expect(result.matchedDealers).toBeGreaterThan(0);
    expect(after.length).toBe(before.length + 1);
    expect(after[0]?.message).toContain(result.requestCode);
    expect(after[0]?.message).toContain("الموديلات المطلوبة: لاند كروزر، راف 4");
    expect(ownRequests.some(request => request.requestCode === result.requestCode)).toBe(true);
  });
});


describe("free-text vehicle search", () => {
  it("matches a vehicle trim as part of the search text", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.vehicles.search({ q: "GXR", limit: 20 });

    expect(result.some(vehicle => vehicle.model === "لاند كروزر" && vehicle.trim === "GXR")).toBe(true);
  });
});


describe("dropdown vehicle search", () => {
  it("filters by one selected model and one selected production year", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.vehicles.search({
      brand: "تويوتا",
      model: "لاند كروزر",
      minYear: 2024,
      maxYear: 2024,
      limit: 20,
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ brand: "تويوتا", model: "لاند كروزر", year: 2024 });
  });
});
