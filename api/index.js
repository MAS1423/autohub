// server/app.ts
import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/_core/oauth.ts
import { compare as bcryptCompare, hash as bcryptHash2 } from "bcryptjs";

// server/db.ts
import { and, desc, eq, gte, like, lte, ne, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { createPool } from "mysql2/promise";

// drizzle/schema.ts
import { float, boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
var users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Unique identifier — email-based auth uses email as openId. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  /** Hashed password for local email/password auth. Null for social-login users. */
  passwordHash: varchar("passwordHash", { length: 255 }),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  /** Primary contact number for the customer account; used for WhatsApp follow-up. */
  whatsapp: varchar("whatsapp", { length: 30 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var dealers = mysqlTable("dealers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  logo: text("logo"),
  cover: text("cover"),
  bio: text("bio"),
  phone: varchar("phone", { length: 30 }),
  whatsapp: varchar("whatsapp", { length: 30 }),
  email: varchar("email", { length: 200 }),
  city: varchar("city", { length: 100 }),
  neighborhood: varchar("neighborhood", { length: 100 }),
  lat: float("lat"),
  lng: float("lng"),
  address: text("address"),
  workingHours: varchar("workingHours", { length: 200 }),
  brands: text("brands"),
  isVerified: boolean("isVerified").default(false).notNull(),
  plan: mysqlEnum("plan", ["free", "basic", "pro", "premium"]).default("free").notNull(),
  commercialReg: varchar("commercialReg", { length: 100 }),
  dealerType: mysqlEnum("dealerType", ["sell", "buy", "both"]).default("sell").notNull(),
  views: int("views").default(0).notNull(),
  vehiclesCount: int("vehiclesCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  // Social media & extra contact
  instagram: varchar("instagram", { length: 200 }),
  twitter: varchar("twitter", { length: 200 }),
  snapchat: varchar("snapchat", { length: 200 }),
  tiktok: varchar("tiktok", { length: 200 }),
  website: varchar("website", { length: 300 }),
  // Detailed working hours (JSON: { sat: "9-5", sun: "9-5", ... })
  workingHoursDetail: text("workingHoursDetail"),
  // Subscription dates
  planStartDate: timestamp("planStartDate"),
  planEndDate: timestamp("planEndDate"),
  stripeCustomerId: varchar("stripeCustomerId", { length: 100 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 100 }),
  // Rejection reason for admin
  rejectionReason: text("rejectionReason"),
  status: mysqlEnum("status", ["pending", "active", "suspended", "rejected"]).default("pending").notNull()
});
var vehicles = mysqlTable("vehicles", {
  id: int("id").autoincrement().primaryKey(),
  dealerId: int("dealerId").notNull(),
  brand: varchar("brand", { length: 100 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  bodyType: varchar("bodyType", { length: 80 }),
  trim: varchar("trim", { length: 100 }),
  year: int("year").notNull(),
  price: int("price").notNull(),
  condition: mysqlEnum("condition", ["new", "used"]).notNull(),
  fuelType: mysqlEnum("fuelType", ["petrol", "diesel", "hybrid", "electric"]).default("petrol").notNull(),
  transmission: mysqlEnum("transmission", ["automatic", "manual"]).default("automatic").notNull(),
  color: varchar("color", { length: 80 }),
  mileage: int("mileage").default(0).notNull(),
  description: text("description"),
  images: text("images"),
  city: varchar("city", { length: 100 }),
  videoUrl: text("videoUrl"),
  videoKey: text("videoKey"),
  status: mysqlEnum("status", ["available", "reserved", "sold"]).default("available").notNull(),
  views: int("views").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  dealerId: int("dealerId").notNull(),
  userId: int("userId").notNull(),
  rating: int("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var inquiries = mysqlTable("inquiries", {
  id: int("id").autoincrement().primaryKey(),
  dealerId: int("dealerId").notNull(),
  vehicleId: int("vehicleId"),
  userId: int("userId"),
  name: varchar("name", { length: 200 }),
  phone: varchar("phone", { length: 30 }),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["new", "read", "replied"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var contactMessages = mysqlTable("contact_messages", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 320 }),
  whatsapp: varchar("whatsapp", { length: 30 }).notNull(),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["new", "read", "replied"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var vehicleRequests = mysqlTable("vehicle_requests", {
  id: int("id").autoincrement().primaryKey(),
  requestCode: varchar("requestCode", { length: 40 }).notNull().unique(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  whatsapp: varchar("whatsapp", { length: 30 }).notNull(),
  email: varchar("email", { length: 320 }),
  brand: varchar("brand", { length: 100 }),
  bodyType: varchar("bodyType", { length: 80 }),
  models: text("models"),
  trim: varchar("trim", { length: 100 }),
  condition: mysqlEnum("condition", ["new", "used"]),
  minPrice: int("minPrice"),
  maxPrice: int("maxPrice"),
  targetPrice: int("targetPrice"),
  minYear: int("minYear"),
  message: text("message").notNull(),
  matchedDealers: int("matchedDealers").default(0).notNull(),
  status: mysqlEnum("status", ["submitted", "distributed", "closed"]).default("submitted").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var mediaUploads = mysqlTable("media_uploads", {
  id: int("id").autoincrement().primaryKey(),
  dealerId: int("dealerId").notNull(),
  vehicleId: int("vehicleId"),
  fileKey: text("fileKey").notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileType: mysqlEnum("fileType", ["image", "video", "logo", "cover"]).notNull(),
  mimeType: varchar("mimeType", { length: 100 }),
  originalName: varchar("originalName", { length: 255 }),
  sizeBytes: int("sizeBytes"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var dealerStats = mysqlTable("dealer_stats", {
  id: int("id").autoincrement().primaryKey(),
  dealerId: int("dealerId").notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  views: int("views").default(0).notNull(),
  inquiries: int("inquiries").default(0).notNull(),
  vehicleViews: int("vehicleViews").default(0).notNull()
});
var notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  dealerId: int("dealerId"),
  type: mysqlEnum("type", ["inquiry", "review", "system", "approval"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body"),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});

// server/localStore.ts
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { hash as bcryptHash } from "bcryptjs";
var statePromise = null;
var saveQueue = Promise.resolve();
function isLocalDataMode() {
  const configuredMode = (process.env.DATA_MODE ?? "").trim().toLowerCase();
  if (configuredMode === "mysql") return false;
  if (process.env.NODE_ENV === "production") return false;
  return !(process.env.VERCEL === "1" && Boolean(process.env.DATABASE_URL));
}
function localDataPath() {
  return path.resolve(process.cwd(), process.env.LOCAL_DATA_FILE ?? "data/autohub.local.json");
}
function clone(value) {
  return structuredClone(value);
}
function asDate(value, fallback) {
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return fallback;
}
function hydrateState(raw) {
  const now = /* @__PURE__ */ new Date();
  const hydrateUser = (user) => ({
    ...user,
    whatsapp: user.whatsapp ?? null,
    createdAt: asDate(user.createdAt, now),
    updatedAt: asDate(user.updatedAt, now),
    lastSignedIn: asDate(user.lastSignedIn, now)
  });
  const hydrateDealer = (dealer) => ({
    ...dealer,
    createdAt: asDate(dealer.createdAt, now),
    updatedAt: asDate(dealer.updatedAt, now),
    planStartDate: dealer.planStartDate ? asDate(dealer.planStartDate, now) : null,
    planEndDate: dealer.planEndDate ? asDate(dealer.planEndDate, now) : null
  });
  const hydrateVehicle = (vehicle) => ({
    ...vehicle,
    createdAt: asDate(vehicle.createdAt, now),
    updatedAt: asDate(vehicle.updatedAt, now)
  });
  const hydrateReview = (review) => ({ ...review, createdAt: asDate(review.createdAt, now) });
  const hydrateInquiry = (inquiry) => ({ ...inquiry, createdAt: asDate(inquiry.createdAt, now) });
  const hydrateContactMessage = (message) => ({
    ...message,
    email: message.email ?? null,
    status: message.status ?? "new",
    createdAt: asDate(message.createdAt, now)
  });
  const hydrateVehicleRequest = (request) => ({
    ...request,
    email: request.email ?? null,
    brand: request.brand ?? null,
    bodyType: request.bodyType ?? null,
    models: Array.isArray(request.models) ? request.models : [],
    trim: request.trim ?? null,
    condition: request.condition ?? null,
    minPrice: request.minPrice ?? null,
    maxPrice: request.maxPrice ?? null,
    targetPrice: request.targetPrice ?? null,
    minYear: request.minYear ?? null,
    createdAt: asDate(request.createdAt, now)
  });
  const hydrateMedia = (media) => ({ ...media, createdAt: asDate(media.createdAt, now) });
  const hydrateNotification = (notification) => ({ ...notification, createdAt: asDate(notification.createdAt, now) });
  return {
    ...raw,
    users: (raw.users ?? []).map(hydrateUser),
    dealers: (raw.dealers ?? []).map(hydrateDealer),
    vehicles: (raw.vehicles ?? []).map(hydrateVehicle),
    reviews: (raw.reviews ?? []).map(hydrateReview),
    inquiries: (raw.inquiries ?? []).map(hydrateInquiry),
    contactMessages: (raw.contactMessages ?? []).map(hydrateContactMessage),
    vehicleRequests: (raw.vehicleRequests ?? []).map(hydrateVehicleRequest),
    mediaUploads: (raw.mediaUploads ?? []).map(hydrateMedia),
    dealerStats: raw.dealerStats ?? [],
    notifications: (raw.notifications ?? []).map(hydrateNotification)
  };
}
function buildCounters(state2) {
  const highest = (rows) => rows.reduce((max, row) => Math.max(max, row.id), 0);
  return {
    user: highest(state2.users),
    dealer: highest(state2.dealers),
    vehicle: highest(state2.vehicles),
    review: highest(state2.reviews),
    inquiry: highest(state2.inquiries),
    contactMessage: highest(state2.contactMessages),
    vehicleRequest: highest(state2.vehicleRequests),
    media: highest(state2.mediaUploads),
    stat: highest(state2.dealerStats),
    notification: highest(state2.notifications)
  };
}
async function persist(state2) {
  const filePath = localDataPath();
  const directory = path.dirname(filePath);
  saveQueue = saveQueue.then(async () => {
    await mkdir(directory, { recursive: true });
    const temporaryPath = `${filePath}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(state2, null, 2)}
`, "utf8");
    await rename(temporaryPath, filePath);
  });
  return saveQueue;
}
function dayOffset(daysAgo) {
  const date = /* @__PURE__ */ new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}
async function createDefaultState() {
  const now = /* @__PURE__ */ new Date();
  const [adminPassword, dealerPassword, userPassword] = await Promise.all([
    bcryptHash("admin123", 10),
    bcryptHash("dealer123", 10),
    bcryptHash("user123", 10)
  ]);
  const users2 = [
    {
      id: 1,
      openId: "admin@autohub.sa",
      email: "admin@autohub.sa",
      whatsapp: "0500000001",
      name: "\u0645\u062F\u064A\u0631 \u0627\u0644\u0646\u0638\u0627\u0645",
      passwordHash: adminPassword,
      role: "admin",
      loginMethod: "email",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now
    },
    {
      id: 2,
      openId: "dealer@autohub.sa",
      email: "dealer@autohub.sa",
      whatsapp: "0500000002",
      name: "\u0645\u0639\u0631\u0636 \u0627\u0644\u062C\u0632\u064A\u0631\u0629",
      passwordHash: dealerPassword,
      role: "user",
      loginMethod: "email",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now
    },
    {
      id: 3,
      openId: "user@autohub.sa",
      email: "user@autohub.sa",
      whatsapp: "0500000003",
      name: "\u0645\u0633\u062A\u062E\u062F\u0645 \u062A\u062C\u0631\u064A\u0628\u064A",
      passwordHash: userPassword,
      role: "user",
      loginMethod: "email",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now
    },
    {
      id: 4,
      openId: "dealer2@autohub.sa",
      email: "dealer2@autohub.sa",
      whatsapp: "0500000004",
      name: "\u0645\u0639\u0631\u0636 \u0625\u064A\u0644\u064A\u062A \u0644\u0644\u0633\u064A\u0627\u0631\u0627\u062A \u0627\u0644\u0641\u0627\u062E\u0631\u0629",
      passwordHash: dealerPassword,
      role: "user",
      loginMethod: "email",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now
    },
    {
      id: 5,
      openId: "dealer3@autohub.sa",
      email: "dealer3@autohub.sa",
      whatsapp: "0500000005",
      name: "\u0645\u0639\u0631\u0636 \u0646\u062C\u062F \u0645\u0648\u062A\u0648\u0631\u0632",
      passwordHash: dealerPassword,
      role: "user",
      loginMethod: "email",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now
    },
    {
      id: 6,
      openId: "dealer4@autohub.sa",
      email: "dealer4@autohub.sa",
      whatsapp: "0500000006",
      name: "\u0645\u0639\u0631\u0636 \u0627\u0644\u062E\u0644\u064A\u062C \u0644\u0644\u0633\u064A\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u0645\u064A\u0632\u0629",
      passwordHash: dealerPassword,
      role: "user",
      loginMethod: "email",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now
    },
    {
      id: 7,
      openId: "dealer5@autohub.sa",
      email: "dealer5@autohub.sa",
      whatsapp: "0500000007",
      name: "\u0645\u0631\u0643\u0632 \u0645\u0643\u0629 \u0644\u0644\u0633\u064A\u0627\u0631\u0627\u062A",
      passwordHash: dealerPassword,
      role: "user",
      loginMethod: "email",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now
    },
    {
      id: 8,
      openId: "dealer6@autohub.sa",
      email: "dealer6@autohub.sa",
      whatsapp: "0500000008",
      name: "\u0645\u0639\u0631\u0636 \u0641\u064A\u062C\u0646 \u0645\u0648\u062A\u0648\u0631\u0632",
      passwordHash: dealerPassword,
      role: "user",
      loginMethod: "email",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now
    }
  ];
  const dealerSeed = [
    [1, 2, "\u0645\u0639\u0631\u0636 \u0627\u0644\u062C\u0632\u064A\u0631\u0629 \u0644\u0644\u0633\u064A\u0627\u0631\u0627\u062A", "al-jazeera-motors", "\u0627\u0644\u0631\u064A\u0627\u0636", "\u0627\u0644\u0639\u0644\u064A\u0627", '["\u062A\u0648\u064A\u0648\u062A\u0627","\u0644\u0643\u0632\u0633"]', "premium", true, "/assets/showroom-toyota.jpg", 3420, 48],
    [2, 4, "\u0645\u0639\u0631\u0636 \u0625\u064A\u0644\u064A\u062A \u0644\u0644\u0633\u064A\u0627\u0631\u0627\u062A \u0627\u0644\u0641\u0627\u062E\u0631\u0629", "elite-auto-jeddah", "\u062C\u062F\u0629", "\u0627\u0644\u0632\u0647\u0631\u0627\u0621", '["\u0645\u0631\u0633\u064A\u062F\u0633","\u0628\u064A \u0625\u0645 \u062F\u0628\u0644\u064A\u0648","\u0623\u0648\u062F\u064A"]', "pro", true, "/assets/showroom-luxury.jpg", 2890, 32],
    [3, 5, "\u0645\u0639\u0631\u0636 \u0646\u062C\u062F \u0645\u0648\u062A\u0648\u0631\u0632", "najd-motors", "\u0627\u0644\u0631\u064A\u0627\u0636", "\u0627\u0644\u0645\u0644\u0642\u0627", '["\u0647\u064A\u0648\u0646\u062F\u0627\u064A","\u0643\u064A\u0627","\u0646\u064A\u0633\u0627\u0646"]', "basic", true, "/assets/car-suv.jpg", 1560, 25],
    [4, 6, "\u0645\u0639\u0631\u0636 \u0627\u0644\u062E\u0644\u064A\u062C \u0644\u0644\u0633\u064A\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u0645\u064A\u0632\u0629", "gulf-premium-cars", "\u0627\u0644\u062F\u0645\u0627\u0645", "\u0627\u0644\u0634\u0627\u0637\u0626", '["\u0641\u0648\u0631\u062F","\u0634\u064A\u0641\u0631\u0648\u0644\u064A\u0647","\u062C\u064A\u0628"]', "free", true, "/assets/showroom-luxury.jpg", 890, 18],
    [5, 7, "\u0645\u0631\u0643\u0632 \u0645\u0643\u0629 \u0644\u0644\u0633\u064A\u0627\u0631\u0627\u062A", "makkah-auto-center", "\u0645\u0643\u0629 \u0627\u0644\u0645\u0643\u0631\u0645\u0629", "\u0627\u0644\u0639\u0632\u064A\u0632\u064A\u0629", '["\u062A\u0648\u064A\u0648\u062A\u0627","\u0647\u064A\u0648\u0646\u062F\u0627\u064A","\u0643\u064A\u0627","\u0646\u064A\u0633\u0627\u0646"]', "pro", true, "/assets/showroom-toyota.jpg", 2100, 35],
    [6, 8, "\u0645\u0639\u0631\u0636 \u0641\u064A\u062C\u0646 \u0645\u0648\u062A\u0648\u0631\u0632", "vision-motors-riyadh", "\u0627\u0644\u0631\u064A\u0627\u0636", "\u0627\u0644\u0646\u062E\u064A\u0644", '["\u0644\u0627\u0646\u062F \u0631\u0648\u0641\u0631","\u062C\u064A\u0628","\u0645\u0631\u0633\u064A\u062F\u0633","\u0628\u064A \u0625\u0645 \u062F\u0628\u0644\u064A\u0648"]', "premium", true, "/assets/hero-bg.jpg", 4100, 52]
  ];
  const dealers2 = dealerSeed.map(([id, userId, name, slug, city, neighborhood, brands, plan, isVerified, cover, views, vehiclesCount]) => ({
    id,
    userId,
    name,
    slug,
    logo: "/assets/logo-icon.png",
    cover,
    bio: `${name} \u2014 \u0645\u0646\u0635\u0629 \u062A\u062C\u0631\u064A\u0628\u064A\u0629 \u0645\u062D\u0644\u064A\u0629 \u0644\u0639\u0631\u0636 \u0627\u0644\u0633\u064A\u0627\u0631\u0627\u062A \u0648\u062E\u062F\u0645\u0627\u062A \u0627\u0644\u0645\u0639\u0627\u0631\u0636 \u0641\u064A \u0627\u0644\u0645\u0645\u0644\u0643\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629.`,
    phone: `+9665${String(1e7 + id * 1111111).slice(0, 8)}`,
    whatsapp: `+9665${String(1e7 + id * 1111111).slice(0, 8)}`,
    email: `dealer${id}@autohub.sa`,
    city,
    neighborhood,
    lat: null,
    lng: null,
    address: `${city} \u2014 ${neighborhood}`,
    workingHours: "\u0627\u0644\u0633\u0628\u062A - \u0627\u0644\u062E\u0645\u064A\u0633: 9\u0635 - 10\u0645 | \u0627\u0644\u062C\u0645\u0639\u0629: 4\u0645 - 10\u0645",
    brands,
    isVerified,
    plan,
    commercialReg: `CR-${1e5 + id}`,
    dealerType: "both",
    views,
    vehiclesCount,
    createdAt: dayOffset(90 - id),
    updatedAt: now,
    instagram: null,
    twitter: null,
    snapchat: null,
    tiktok: null,
    website: null,
    workingHoursDetail: null,
    planStartDate: null,
    planEndDate: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    rejectionReason: null,
    status: isVerified ? "active" : "pending"
  }));
  const vehicleSeed = [
    [1, 1, "\u062A\u0648\u064A\u0648\u062A\u0627", "\u0644\u0627\u0646\u062F \u0643\u0631\u0648\u0632\u0631", 2024, 285e3, "new", "petrol", "automatic", "\u0623\u0628\u064A\u0636 \u0644\u0624\u0644\u0624\u064A", 0, "/assets/car-suv.jpg", "\u062A\u0648\u064A\u0648\u062A\u0627 \u0644\u0627\u0646\u062F \u0643\u0631\u0648\u0632\u0631 2024 \u0627\u0644\u062C\u062F\u064A\u062F\u0629 \u0643\u0644\u064A\u0627\u064B\u060C \u0641\u0644 \u0623\u0648\u0628\u0634\u0646\u060C \u0636\u0645\u0627\u0646 \u0627\u0644\u0648\u0643\u0627\u0644\u0629 3 \u0633\u0646\u0648\u0627\u062A.", "\u0627\u0644\u0631\u064A\u0627\u0636", 520],
    [2, 1, "\u0644\u0643\u0632\u0633", "LX 600", 2023, 42e4, "used", "petrol", "automatic", "\u0623\u0633\u0648\u062F", 28e3, "/assets/showroom-toyota.jpg", "\u0644\u0643\u0632\u0633 LX 600 2023 \u0628\u062D\u0627\u0644\u0629 \u0645\u0645\u062A\u0627\u0632\u0629\u060C \u0635\u064A\u0627\u0646\u0629 \u062F\u0648\u0631\u064A\u0629 \u0645\u0646 \u0627\u0644\u0648\u0643\u0627\u0644\u0629.", "\u0627\u0644\u0631\u064A\u0627\u0636", 380],
    [3, 2, "\u0645\u0631\u0633\u064A\u062F\u0633", "S-Class", 2024, 65e4, "new", "petrol", "automatic", "\u0641\u0636\u064A \u0645\u0639\u062F\u0646\u064A", 0, "/assets/showroom-luxury.jpg", "\u0645\u0631\u0633\u064A\u062F\u0633 S-Class 2024 \u0627\u0644\u0641\u0626\u0629 \u0627\u0644\u0623\u0648\u0644\u0649\u060C \u0645\u0648\u0627\u0635\u0641\u0627\u062A \u062E\u0644\u064A\u062C\u064A\u0629 \u0643\u0627\u0645\u0644\u0629.", "\u062C\u062F\u0629", 290],
    [4, 3, "\u0647\u064A\u0648\u0646\u062F\u0627\u064A", "\u062A\u0648\u0633\u0627\u0646", 2023, 89e3, "used", "petrol", "automatic", "\u0631\u0645\u0627\u062F\u064A", 45e3, "/assets/car-suv.jpg", "\u0647\u064A\u0648\u0646\u062F\u0627\u064A \u062A\u0648\u0633\u0627\u0646 2023 \u0628\u062D\u0627\u0644\u0629 \u0645\u0645\u062A\u0627\u0632\u0629\u060C \u0635\u064A\u0627\u0646\u0629 \u0645\u0646\u062A\u0638\u0645\u0629.", "\u0627\u0644\u0631\u064A\u0627\u0636", 210],
    [5, 6, "\u0644\u0627\u0646\u062F \u0631\u0648\u0641\u0631", "\u062F\u064A\u0641\u0646\u062F\u0631", 2024, 38e4, "new", "petrol", "automatic", "\u0623\u062E\u0636\u0631 \u062F\u0627\u0643\u0646", 0, "/assets/hero-bg.jpg", "\u0644\u0627\u0646\u062F \u0631\u0648\u0641\u0631 \u062F\u064A\u0641\u0646\u062F\u0631 2024 \u062C\u062F\u064A\u062F\u060C \u0645\u0648\u0627\u0635\u0641\u0627\u062A \u0643\u0627\u0645\u0644\u0629\u060C \u0636\u0645\u0627\u0646 \u0627\u0644\u0648\u0643\u0627\u0644\u0629.", "\u0627\u0644\u0631\u064A\u0627\u0636", 445],
    [6, 2, "\u0628\u064A \u0625\u0645 \u062F\u0628\u0644\u064A\u0648", "X7", 2023, 31e4, "used", "petrol", "automatic", "\u0623\u0628\u064A\u0636 \u0623\u0644\u0628\u0627\u064A\u0646", 35e3, "/assets/showroom-luxury.jpg", "\u0628\u064A \u0625\u0645 \u062F\u0628\u0644\u064A\u0648 X7 2023 \u0628\u062D\u0627\u0644\u0629 \u0645\u0645\u062A\u0627\u0632\u0629\u060C \u0641\u0644 \u0623\u0648\u0628\u0634\u0646.", "\u062C\u062F\u0629", 320]
  ];
  const vehicleMetadata = {
    "\u0644\u0627\u0646\u062F \u0643\u0631\u0648\u0632\u0631": { bodyType: "\u062F\u0641\u0639 \u0631\u0628\u0627\u0639\u064A", trim: "GXR" },
    "LX 600": { bodyType: "\u062F\u0641\u0639 \u0631\u0628\u0627\u0639\u064A", trim: "F Sport" },
    "S-Class": { bodyType: "\u0633\u064A\u062F\u0627\u0646", trim: "AMG" },
    "\u062A\u0648\u0633\u0627\u0646": { bodyType: "\u0643\u0631\u0648\u0633 \u0623\u0648\u0641\u0631", trim: "N Line" },
    "\u062F\u064A\u0641\u0646\u062F\u0631": { bodyType: "\u062F\u0641\u0639 \u0631\u0628\u0627\u0639\u064A", trim: "HSE" },
    "X7": { bodyType: "\u062F\u0641\u0639 \u0631\u0628\u0627\u0639\u064A", trim: "M Sport" }
  };
  const vehicles2 = vehicleSeed.map(([id, dealerId, brand, model, year, price, condition, fuelType, transmission, color, mileage, image, description, city, views]) => ({
    id,
    dealerId,
    brand,
    model,
    bodyType: vehicleMetadata[model]?.bodyType ?? null,
    trim: vehicleMetadata[model]?.trim ?? null,
    year,
    price,
    condition,
    fuelType,
    transmission,
    color,
    mileage,
    description,
    images: JSON.stringify([image]),
    city,
    videoUrl: null,
    videoKey: null,
    status: "available",
    views,
    createdAt: dayOffset(45 - id),
    updatedAt: now
  }));
  const reviews2 = [
    { id: 1, dealerId: 1, userId: 3, rating: 5, comment: "\u062A\u062C\u0631\u0628\u0629 \u0645\u0645\u062A\u0627\u0632\u0629 \u0648\u062E\u062F\u0645\u0629 \u0627\u062D\u062A\u0631\u0627\u0641\u064A\u0629.", createdAt: dayOffset(12) },
    { id: 2, dealerId: 2, userId: 3, rating: 5, comment: "\u062E\u064A\u0627\u0631\u0627\u062A \u0645\u062A\u0646\u0648\u0639\u0629 \u0648\u062A\u0639\u0627\u0645\u0644 \u0631\u0627\u0642\u064D.", createdAt: dayOffset(20) }
  ];
  const stateWithoutCounters = {
    version: 1,
    users: users2,
    dealers: dealers2,
    vehicles: vehicles2,
    reviews: reviews2,
    inquiries: [],
    contactMessages: [],
    vehicleRequests: [],
    mediaUploads: [],
    dealerStats: [],
    notifications: []
  };
  return {
    ...stateWithoutCounters,
    counters: buildCounters(stateWithoutCounters)
  };
}
async function loadState() {
  const filePath = localDataPath();
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed.version !== 1) throw new Error("Unsupported local data version");
    const hydrated = hydrateState(parsed);
    hydrated.counters = { ...buildCounters(hydrated), ...hydrated.counters };
    return hydrated;
  } catch (error) {
    const code = error.code;
    if (code && code !== "ENOENT") {
      console.warn("[Local data] Unable to read existing data; a clean demo store will be created.", error);
    }
    const initial = await createDefaultState();
    await persist(initial);
    return initial;
  }
}
async function state() {
  if (!statePromise) statePromise = loadState();
  return statePromise;
}
async function mutate(operation) {
  const current = await state();
  const result = await operation(current);
  await persist(current);
  return clone(result);
}
function nextId(current, key) {
  current.counters[key] += 1;
  return current.counters[key];
}
function matches(value, term) {
  if (!term) return true;
  return (value ?? "").toLocaleLowerCase("ar-SA").includes(term.toLocaleLowerCase("ar-SA"));
}
function planRank(plan) {
  return { free: 0, basic: 1, pro: 2, premium: 3 }[plan];
}
function jsonBrands(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((entry) => typeof entry === "string") : [];
  } catch {
    return value.split(",").map((entry) => entry.trim()).filter(Boolean);
  }
}
function dateOnly() {
  return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
async function localUpsertUser(input) {
  return mutate(async (current) => {
    const existing = current.users.find((user2) => user2.openId === input.openId);
    const now = /* @__PURE__ */ new Date();
    if (existing) {
      if (input.name !== void 0) existing.name = input.name ?? null;
      if (input.email !== void 0) existing.email = input.email ?? null;
      if (input.whatsapp !== void 0) existing.whatsapp = input.whatsapp ?? null;
      if (input.loginMethod !== void 0) existing.loginMethod = input.loginMethod ?? null;
      if (input.passwordHash !== void 0) existing.passwordHash = input.passwordHash ?? null;
      if (input.role !== void 0) existing.role = input.role;
      if (input.lastSignedIn !== void 0) existing.lastSignedIn = asDate(input.lastSignedIn, now);
      existing.updatedAt = now;
      return existing;
    }
    const user = {
      id: nextId(current, "user"),
      openId: input.openId,
      passwordHash: input.passwordHash ?? null,
      name: input.name ?? null,
      email: input.email ?? null,
      whatsapp: input.whatsapp ?? null,
      loginMethod: input.loginMethod ?? null,
      role: input.role ?? "user",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: input.lastSignedIn ? asDate(input.lastSignedIn, now) : now
    };
    current.users.push(user);
    return user;
  });
}
async function localGetUserByOpenId(openId) {
  const current = await state();
  const user = current.users.find((entry) => entry.openId === openId);
  return user ? clone(user) : void 0;
}
async function localGetUserByEmail(email) {
  const current = await state();
  const normalized = email.trim().toLowerCase();
  const user = current.users.find((entry) => entry.email?.toLowerCase() === normalized);
  return user ? clone(user) : void 0;
}
async function localUpdateUserName(id, name) {
  await mutate((current) => {
    const user = current.users.find((entry) => entry.id === id);
    if (user) {
      user.name = name;
      user.updatedAt = /* @__PURE__ */ new Date();
    }
  });
}
async function localUpdateUserProfile(id, data) {
  return mutate((current) => {
    const user = current.users.find((entry) => entry.id === id);
    if (!user) throw new Error("User not found");
    if (data.name !== void 0) user.name = data.name;
    if (data.whatsapp !== void 0) user.whatsapp = data.whatsapp;
    if (data.email !== void 0) user.email = data.email;
    user.updatedAt = /* @__PURE__ */ new Date();
    return user;
  });
}
async function localListUsers(limit = 200) {
  const current = await state();
  return clone([...current.users].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit));
}
async function localUpdateUserRole(id, role) {
  await mutate((current) => {
    const user = current.users.find((entry) => entry.id === id);
    if (!user) throw new Error("User not found");
    user.role = role;
    user.updatedAt = /* @__PURE__ */ new Date();
  });
}
async function localGetDealers(options = {}) {
  const current = await state();
  const filtered = current.dealers.filter((dealer) => {
    if (options.city && dealer.city !== options.city) return false;
    if (options.brand && !jsonBrands(dealer.brands).includes(options.brand)) return false;
    if (options.q && !matches(`${dealer.name} ${dealer.city ?? ""} ${dealer.neighborhood ?? ""}`, options.q)) return false;
    if (options.verified && (!dealer.isVerified || dealer.status !== "active")) return false;
    if (options.dealerType && options.dealerType !== "all" && dealer.dealerType !== options.dealerType && dealer.dealerType !== "both") return false;
    return true;
  });
  const offset = options.offset ?? 0;
  const limit = options.limit ?? 50;
  return clone(filtered.sort((a, b) => planRank(b.plan) - planRank(a.plan) || b.views - a.views).slice(offset, offset + limit));
}
async function localGetDealerBySlug(slug) {
  const current = await state();
  const dealer = current.dealers.find((entry) => entry.slug === slug);
  return dealer ? clone(dealer) : void 0;
}
async function localGetDealerById(id) {
  const current = await state();
  const dealer = current.dealers.find((entry) => entry.id === id);
  return dealer ? clone(dealer) : void 0;
}
async function localCreateDealer(input) {
  return mutate((current) => {
    const now = /* @__PURE__ */ new Date();
    const dealer = {
      id: nextId(current, "dealer"),
      userId: input.userId ?? null,
      name: input.name,
      slug: input.slug,
      logo: input.logo ?? "/assets/logo-icon.png",
      cover: input.cover ?? "/assets/showroom-luxury.jpg",
      bio: input.bio ?? null,
      phone: input.phone ?? null,
      whatsapp: input.whatsapp ?? input.phone ?? null,
      email: input.email ?? null,
      city: input.city ?? null,
      neighborhood: input.neighborhood ?? null,
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      address: input.address ?? null,
      workingHours: input.workingHours ?? null,
      brands: input.brands ?? JSON.stringify([]),
      isVerified: input.isVerified ?? false,
      plan: input.plan ?? "free",
      commercialReg: input.commercialReg ?? null,
      dealerType: input.dealerType ?? "sell",
      views: input.views ?? 0,
      vehiclesCount: input.vehiclesCount ?? 0,
      createdAt: now,
      updatedAt: now,
      instagram: input.instagram ?? null,
      twitter: input.twitter ?? null,
      snapchat: input.snapchat ?? null,
      tiktok: input.tiktok ?? null,
      website: input.website ?? null,
      workingHoursDetail: input.workingHoursDetail ?? null,
      planStartDate: input.planStartDate ? asDate(input.planStartDate, now) : null,
      planEndDate: input.planEndDate ? asDate(input.planEndDate, now) : null,
      stripeCustomerId: input.stripeCustomerId ?? null,
      stripeSubscriptionId: input.stripeSubscriptionId ?? null,
      rejectionReason: input.rejectionReason ?? null,
      status: input.status ?? "pending"
    };
    current.dealers.push(dealer);
    return dealer;
  });
}
async function localUpdateDealer(id, data) {
  await mutate((current) => {
    const dealer = current.dealers.find((entry) => entry.id === id);
    if (!dealer) throw new Error("Dealer not found");
    const allowed = [
      "userId",
      "name",
      "slug",
      "logo",
      "cover",
      "bio",
      "phone",
      "whatsapp",
      "email",
      "city",
      "neighborhood",
      "lat",
      "lng",
      "address",
      "workingHours",
      "brands",
      "isVerified",
      "plan",
      "commercialReg",
      "dealerType",
      "views",
      "vehiclesCount",
      "instagram",
      "twitter",
      "snapchat",
      "tiktok",
      "website",
      "workingHoursDetail",
      "planStartDate",
      "planEndDate",
      "stripeCustomerId",
      "stripeSubscriptionId",
      "rejectionReason",
      "status"
    ];
    for (const key of allowed) {
      if (data[key] !== void 0) dealer[key] = data[key] ?? null;
    }
    dealer.updatedAt = /* @__PURE__ */ new Date();
  });
}
async function localUpdateDealerViews(id) {
  await mutate((current) => {
    const dealer = current.dealers.find((entry) => entry.id === id);
    if (dealer) {
      dealer.views += 1;
      dealer.updatedAt = /* @__PURE__ */ new Date();
    }
  });
}
async function localUpdateDealerStatus(id, status, rejectionReason) {
  await mutate((current) => {
    const dealer = current.dealers.find((entry) => entry.id === id);
    if (!dealer) throw new Error("Dealer not found");
    dealer.status = status;
    dealer.rejectionReason = rejectionReason;
    dealer.isVerified = status === "active";
    dealer.updatedAt = /* @__PURE__ */ new Date();
  });
}
async function localDeleteDealer(id) {
  await mutate((current) => {
    current.dealers = current.dealers.filter((entry) => entry.id !== id);
    const vehicleIds = new Set(current.vehicles.filter((vehicle) => vehicle.dealerId === id).map((vehicle) => vehicle.id));
    current.vehicles = current.vehicles.filter((vehicle) => vehicle.dealerId !== id);
    current.reviews = current.reviews.filter((review) => review.dealerId !== id);
    current.inquiries = current.inquiries.filter((inquiry) => inquiry.dealerId !== id && (inquiry.vehicleId === null || !vehicleIds.has(inquiry.vehicleId)));
    current.mediaUploads = current.mediaUploads.filter((media) => media.dealerId !== id);
    current.dealerStats = current.dealerStats.filter((stat) => stat.dealerId !== id);
  });
}
async function localGetDealerOwnerUserId(id) {
  const current = await state();
  return current.dealers.find((entry) => entry.id === id)?.userId ?? null;
}
async function localGetDealerByUserId(userId) {
  const current = await state();
  const dealer = current.dealers.find((entry) => entry.userId === userId);
  return dealer ? clone(dealer) : void 0;
}
async function localGetAllDealersAdmin() {
  const current = await state();
  return clone(current.dealers.map((dealer) => {
    const owner = current.users.find((user) => user.id === dealer.userId);
    return { ...dealer, ownerName: owner?.name ?? null, ownerEmail: owner?.email ?? null };
  }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
}
async function localVerifyDealer(id, isVerified) {
  await mutate((current) => {
    const dealer = current.dealers.find((entry) => entry.id === id);
    if (!dealer) throw new Error("Dealer not found");
    dealer.isVerified = isVerified;
    dealer.status = isVerified ? "active" : "pending";
    dealer.updatedAt = /* @__PURE__ */ new Date();
  });
}
async function localUpdateDealerPlan(id, plan) {
  await mutate((current) => {
    const dealer = current.dealers.find((entry) => entry.id === id);
    if (!dealer) throw new Error("Dealer not found");
    dealer.plan = plan;
    dealer.updatedAt = /* @__PURE__ */ new Date();
  });
}
async function localGetAdminStats() {
  const current = await state();
  return {
    totalDealers: current.dealers.length,
    verifiedDealers: current.dealers.filter((dealer) => dealer.isVerified).length,
    totalVehicles: current.vehicles.length,
    totalInquiries: current.inquiries.length,
    totalUsers: current.users.length
  };
}
async function localGetAdminStatsExtended() {
  const base = await localGetAdminStats();
  const current = await state();
  return {
    ...base,
    pendingDealers: current.dealers.filter((dealer) => !dealer.isVerified).length,
    paidDealers: current.dealers.filter((dealer) => dealer.plan !== "free").length,
    freeDealers: current.dealers.filter((dealer) => dealer.plan === "free").length,
    proDealers: current.dealers.filter((dealer) => dealer.plan === "pro").length,
    premiumDealers: current.dealers.filter((dealer) => dealer.plan === "premium").length,
    totalReviews: current.reviews.length,
    totalViews: current.dealers.reduce((total, dealer) => total + dealer.views, 0)
  };
}
function filterVehicles(rows, options) {
  return rows.filter((vehicle) => {
    if (options.dealerId && vehicle.dealerId !== options.dealerId) return false;
    if (options.condition && vehicle.condition !== options.condition) return false;
    if (options.brand && vehicle.brand !== options.brand) return false;
    if (options.models?.length && !options.models.some((model) => matches(vehicle.model, model))) return false;
    if (!options.models?.length && options.model && !matches(vehicle.model, options.model)) return false;
    if (options.bodyType && vehicle.bodyType !== options.bodyType) return false;
    if (options.trim && !matches(vehicle.trim ?? "", options.trim)) return false;
    if (options.city && vehicle.city !== options.city) return false;
    if (options.minPrice !== void 0 && vehicle.price < options.minPrice) return false;
    if (options.maxPrice !== void 0 && vehicle.price > options.maxPrice) return false;
    if (options.minYear !== void 0 && vehicle.year < options.minYear) return false;
    if (options.maxYear !== void 0 && vehicle.year > options.maxYear) return false;
    if (options.fuelType && vehicle.fuelType !== options.fuelType) return false;
    if (options.transmission && vehicle.transmission !== options.transmission) return false;
    if (options.status && vehicle.status !== options.status) return false;
    if (!options.status && vehicle.status === "sold") return false;
    if (options.q && !matches(`${vehicle.brand} ${vehicle.model} ${vehicle.bodyType ?? ""} ${vehicle.trim ?? ""}`, options.q)) return false;
    return true;
  });
}
async function localGetVehicles(options = {}) {
  const current = await state();
  const offset = options.offset ?? 0;
  const limit = options.limit ?? 50;
  return clone(filterVehicles(current.vehicles, options).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(offset, offset + limit));
}
function vehicleWithDealer(vehicle, dealer) {
  return {
    ...vehicle,
    dealerName: dealer?.name ?? null,
    dealerSlug: dealer?.slug ?? null,
    dealerLogo: dealer?.logo ?? null,
    dealerCity: dealer?.city ?? null,
    dealerPhone: dealer?.phone ?? null,
    dealerWhatsapp: dealer?.whatsapp ?? null,
    dealerVerified: dealer?.isVerified ?? false
  };
}
async function localGetVehiclesWithDealer(options = {}) {
  const current = await state();
  const offset = options.offset ?? 0;
  const limit = options.limit ?? 50;
  const rows = filterVehicles(current.vehicles, options).map((vehicle) => vehicleWithDealer(vehicle, current.dealers.find((dealer) => dealer.id === vehicle.dealerId))).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(offset, offset + limit);
  return clone(rows);
}
async function localGetVehicleById(id) {
  const current = await state();
  const vehicle = current.vehicles.find((entry) => entry.id === id);
  return vehicle ? clone(vehicle) : void 0;
}
async function localGetVehicleWithDealer(id) {
  const current = await state();
  const vehicle = current.vehicles.find((entry) => entry.id === id);
  if (!vehicle) return void 0;
  const dealer = current.dealers.find((entry) => entry.id === vehicle.dealerId);
  return clone({
    ...vehicleWithDealer(vehicle, dealer),
    dealerBio: dealer?.bio ?? null,
    dealerAddress: dealer?.address ?? null,
    dealerLat: dealer?.lat ?? null,
    dealerLng: dealer?.lng ?? null
  });
}
async function localCreateVehicle(input) {
  return mutate((current) => {
    const now = /* @__PURE__ */ new Date();
    const vehicle = {
      id: nextId(current, "vehicle"),
      dealerId: input.dealerId,
      brand: input.brand,
      model: input.model,
      bodyType: input.bodyType ?? null,
      trim: input.trim ?? null,
      year: input.year,
      price: input.price,
      condition: input.condition,
      fuelType: input.fuelType ?? "petrol",
      transmission: input.transmission ?? "automatic",
      color: input.color ?? null,
      mileage: input.mileage ?? 0,
      description: input.description ?? null,
      images: input.images ?? JSON.stringify(["/assets/car-suv.jpg"]),
      city: input.city ?? null,
      videoUrl: input.videoUrl ?? null,
      videoKey: input.videoKey ?? null,
      status: input.status ?? "available",
      views: input.views ?? 0,
      createdAt: now,
      updatedAt: now
    };
    current.vehicles.push(vehicle);
    const dealer = current.dealers.find((entry) => entry.id === vehicle.dealerId);
    if (dealer) {
      dealer.vehiclesCount = current.vehicles.filter((entry) => entry.dealerId === vehicle.dealerId).length;
      dealer.updatedAt = now;
    }
    return vehicle;
  });
}
async function localUpdateVehicle(id, data) {
  await mutate((current) => {
    const vehicle = current.vehicles.find((entry) => entry.id === id);
    if (!vehicle) throw new Error("Vehicle not found");
    const allowed = ["brand", "model", "bodyType", "trim", "year", "price", "condition", "fuelType", "transmission", "color", "mileage", "description", "images", "city", "videoUrl", "videoKey", "status"];
    for (const key of allowed) {
      if (data[key] !== void 0) vehicle[key] = data[key] ?? null;
    }
    vehicle.updatedAt = /* @__PURE__ */ new Date();
  });
}
async function localDeleteVehicle(id) {
  await mutate((current) => {
    const vehicle = current.vehicles.find((entry) => entry.id === id);
    if (!vehicle) return;
    current.vehicles = current.vehicles.filter((entry) => entry.id !== id);
    current.inquiries = current.inquiries.filter((inquiry) => inquiry.vehicleId !== id);
    current.mediaUploads = current.mediaUploads.filter((media) => media.vehicleId !== id);
    const dealer = current.dealers.find((entry) => entry.id === vehicle.dealerId);
    if (dealer) dealer.vehiclesCount = current.vehicles.filter((entry) => entry.dealerId === vehicle.dealerId).length;
  });
}
async function localUpdateVehicleViews(id) {
  await mutate((current) => {
    const vehicle = current.vehicles.find((entry) => entry.id === id);
    if (vehicle) {
      vehicle.views += 1;
      vehicle.updatedAt = /* @__PURE__ */ new Date();
    }
  });
}
async function localGetReviewsByDealer(dealerId) {
  const current = await state();
  return clone(current.reviews.filter((review) => review.dealerId === dealerId).map((review) => ({ ...review, userName: current.users.find((user) => user.id === review.userId)?.name ?? null })).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
}
async function localCreateReview(input) {
  return mutate((current) => {
    const review = {
      id: nextId(current, "review"),
      dealerId: input.dealerId,
      userId: input.userId,
      rating: input.rating,
      comment: input.comment ?? null,
      createdAt: /* @__PURE__ */ new Date()
    };
    current.reviews.push(review);
    return review;
  });
}
async function localGetDealerRating(dealerId) {
  const current = await state();
  const reviews2 = current.reviews.filter((review) => review.dealerId === dealerId);
  const count = reviews2.length;
  return { avg: count ? reviews2.reduce((sum, review) => sum + review.rating, 0) / count : 0, count };
}
async function localHasUserReviewed(dealerId, userId) {
  const current = await state();
  return current.reviews.some((review) => review.dealerId === dealerId && review.userId === userId);
}
async function localDeleteReview(id) {
  await mutate((current) => {
    current.reviews = current.reviews.filter((review) => review.id !== id);
  });
}
async function localGetAllReviewsAdmin() {
  const current = await state();
  return clone(current.reviews.map((review) => ({
    ...review,
    dealerName: current.dealers.find((dealer) => dealer.id === review.dealerId)?.name ?? null,
    userName: current.users.find((user) => user.id === review.userId)?.name ?? null
  })).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
}
async function localCreateInquiry(input) {
  return mutate((current) => {
    const inquiry = {
      id: nextId(current, "inquiry"),
      dealerId: input.dealerId,
      vehicleId: input.vehicleId ?? null,
      userId: input.userId ?? null,
      name: input.name ?? null,
      phone: input.phone ?? null,
      message: input.message,
      status: input.status ?? "new",
      createdAt: /* @__PURE__ */ new Date()
    };
    current.inquiries.push(inquiry);
    return inquiry;
  });
}
async function localGetInquiriesByDealer(dealerId) {
  const current = await state();
  return clone(current.inquiries.filter((inquiry) => inquiry.dealerId === dealerId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
}
async function localUpdateInquiryStatus(id, status) {
  await mutate((current) => {
    const inquiry = current.inquiries.find((entry) => entry.id === id);
    if (!inquiry) throw new Error("Inquiry not found");
    inquiry.status = status;
  });
}
async function localGetAllInquiriesAdmin() {
  const current = await state();
  return clone(current.inquiries.map((inquiry) => {
    const user = inquiry.userId ? current.users.find((entry) => entry.id === inquiry.userId) : void 0;
    return {
      ...inquiry,
      dealerName: current.dealers.find((dealer) => dealer.id === inquiry.dealerId)?.name ?? null,
      senderEmail: user?.email ?? null,
      senderWhatsapp: user?.whatsapp ?? inquiry.phone ?? null
    };
  }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
}
async function localCreateContactMessage(input) {
  return mutate((current) => {
    const message = {
      id: nextId(current, "contactMessage"),
      name: input.name,
      email: input.email ?? null,
      whatsapp: input.whatsapp,
      message: input.message,
      status: input.status ?? "new",
      createdAt: /* @__PURE__ */ new Date()
    };
    current.contactMessages.push(message);
    return message;
  });
}
async function localGetAllContactMessagesAdmin() {
  const current = await state();
  return clone([...current.contactMessages].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
}
async function localUpdateContactMessageStatus(id, status) {
  await mutate((current) => {
    const message = current.contactMessages.find((entry) => entry.id === id);
    if (!message) throw new Error("Contact message not found");
    message.status = status;
  });
}
async function localCreateVehicleRequest(input) {
  return mutate((current) => {
    const request = {
      id: nextId(current, "vehicleRequest"),
      requestCode: input.requestCode,
      userId: input.userId,
      name: input.name,
      whatsapp: input.whatsapp,
      email: input.email ?? null,
      brand: input.brand ?? null,
      bodyType: input.bodyType ?? null,
      models: input.models ? JSON.parse(input.models) : [],
      trim: input.trim ?? null,
      condition: input.condition ?? null,
      minPrice: input.minPrice ?? null,
      maxPrice: input.maxPrice ?? null,
      targetPrice: input.targetPrice ?? null,
      minYear: input.minYear ?? null,
      message: input.message,
      matchedDealers: input.matchedDealers ?? 0,
      status: input.status ?? "submitted",
      createdAt: /* @__PURE__ */ new Date()
    };
    current.vehicleRequests.push(request);
    return request;
  });
}
async function localGetVehicleRequestsByUser(userId) {
  const current = await state();
  return clone(current.vehicleRequests.filter((request) => request.userId === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
}
async function localGetAllVehicleRequestsAdmin() {
  const current = await state();
  return clone(current.vehicleRequests.map((request) => {
    const user = current.users.find((entry) => entry.id === request.userId);
    return { ...request, senderEmail: user?.email ?? request.email, senderWhatsapp: user?.whatsapp ?? request.whatsapp };
  }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
}
async function localCreateMediaUpload(input) {
  return mutate((current) => {
    const media = {
      id: nextId(current, "media"),
      dealerId: input.dealerId,
      vehicleId: input.vehicleId ?? null,
      fileKey: input.fileKey,
      fileUrl: input.fileUrl,
      fileType: input.fileType,
      mimeType: input.mimeType ?? null,
      originalName: input.originalName ?? null,
      sizeBytes: input.sizeBytes ?? null,
      createdAt: /* @__PURE__ */ new Date()
    };
    current.mediaUploads.push(media);
    return media;
  });
}
async function localGetDealerDashboard(dealerId) {
  const current = await state();
  const dealer = current.dealers.find((entry) => entry.id === dealerId);
  const reviews2 = current.reviews.filter((review) => review.dealerId === dealerId);
  const inquiries2 = current.inquiries.filter((inquiry) => inquiry.dealerId === dealerId);
  const vehicles2 = current.vehicles.filter((vehicle) => vehicle.dealerId === dealerId);
  return clone({
    totalViews: dealer?.views ?? 0,
    totalInquiries: inquiries2.length,
    totalVehicles: vehicles2.length,
    avgRating: reviews2.length ? reviews2.reduce((sum, review) => sum + review.rating, 0) / reviews2.length : 0,
    reviewCount: reviews2.length,
    recentInquiries: inquiries2.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 10),
    recentVehicles: vehicles2.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 6)
  });
}
async function localGetVehicleCountByDealer(dealerId) {
  const current = await state();
  return current.vehicles.filter((vehicle) => vehicle.dealerId === dealerId).length;
}
async function localGetDealerAnalytics(dealerId, days = 30) {
  const current = await state();
  const start = /* @__PURE__ */ new Date();
  start.setDate(start.getDate() - days + 1);
  const startString = start.toISOString().slice(0, 10);
  const daily = current.dealerStats.filter((stat) => stat.dealerId === dealerId && stat.date >= startString).sort((a, b) => a.date.localeCompare(b.date));
  const totals = daily.reduce((total, row) => ({
    views: total.views + row.views,
    inquiries: total.inquiries + row.inquiries,
    vehicleViews: total.vehicleViews + row.vehicleViews
  }), { views: 0, inquiries: 0, vehicleViews: 0 });
  return clone({ daily, totals });
}
async function localRecordDealerStat(dealerId, field) {
  await mutate((current) => {
    const today = dateOnly();
    let stat = current.dealerStats.find((entry) => entry.dealerId === dealerId && entry.date === today);
    if (!stat) {
      stat = { id: nextId(current, "stat"), dealerId, date: today, views: 0, inquiries: 0, vehicleViews: 0 };
      current.dealerStats.push(stat);
    }
    stat[field] += 1;
  });
}
async function localCreateNotification(input) {
  return mutate((current) => {
    const notification = {
      id: nextId(current, "notification"),
      userId: input.userId,
      dealerId: input.dealerId ?? null,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      isRead: input.isRead ?? false,
      createdAt: /* @__PURE__ */ new Date()
    };
    current.notifications.push(notification);
    return notification;
  });
}
async function localGetNotificationsByUser(userId, limit = 30) {
  const current = await state();
  return clone(current.notifications.filter((notification) => notification.userId === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit));
}
async function localMarkNotificationsRead(userId, ids) {
  await mutate((current) => {
    const allowed = ids && ids.length > 0 ? new Set(ids) : null;
    for (const notification of current.notifications) {
      if (notification.userId === userId && (!allowed || allowed.has(notification.id))) notification.isRead = true;
    }
  });
}
async function localGetUnreadNotificationCount(userId) {
  const current = await state();
  return current.notifications.filter((notification) => notification.userId === userId && !notification.isRead).length;
}

// server/_core/env.ts
function readBoolean(value, fallback = false) {
  if (value === void 0 || value.trim() === "") return fallback;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}
function readPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
function cleanBaseUrl(value) {
  return (value ?? "").trim().replace(/\/+$/, "");
}
var isProduction = process.env.NODE_ENV === "production";
var dataMode = (process.env.DATA_MODE ?? "").trim().toLowerCase();
var ENV = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProduction,
  dataMode,
  databaseUrl: process.env.DATABASE_URL ?? "",
  databaseSsl: readBoolean(process.env.DATABASE_SSL, isProduction),
  databaseSslRejectUnauthorized: readBoolean(process.env.DATABASE_SSL_REJECT_UNAUTHORIZED, true),
  databaseSslCa: (process.env.DATABASE_SSL_CA ?? "").replace(/\\n/g, "\n"),
  databaseConnectionLimit: readPositiveInteger(process.env.DATABASE_CONNECTION_LIMIT, 5),
  databaseIdleTimeoutMs: readPositiveInteger(process.env.DATABASE_IDLE_TIMEOUT_MS, 5e3),
  cookieSecret: process.env.JWT_SECRET ?? "",
  sessionTtlDays: readPositiveInteger(process.env.SESSION_TTL_DAYS, isProduction ? 30 : 365),
  passwordHashRounds: readPositiveInteger(process.env.PASSWORD_HASH_ROUNDS, isProduction ? 12 : 10),
  allowInsecureCustomerLogin: readBoolean(process.env.ALLOW_INSECURE_CUSTOMER_LOGIN, !isProduction),
  appBaseUrl: cleanBaseUrl(process.env.APP_BASE_URL),
  uploadDir: process.env.UPLOAD_DIR ?? "uploads",
  maxProxyUploadBytes: readPositiveInteger(process.env.MAX_PROXY_UPLOAD_BYTES, isProduction ? 4 * 1024 * 1024 : 50 * 1024 * 1024),
  s3Bucket: (process.env.S3_BUCKET ?? "").trim(),
  s3Region: (process.env.S3_REGION ?? "us-east-1").trim(),
  s3AccessKey: (process.env.S3_ACCESS_KEY_ID ?? "").trim(),
  s3SecretKey: (process.env.S3_SECRET_ACCESS_KEY ?? "").trim(),
  s3Endpoint: cleanBaseUrl(process.env.S3_ENDPOINT),
  s3PublicBaseUrl: cleanBaseUrl(process.env.S3_PUBLIC_BASE_URL),
  s3ForcePathStyle: readBoolean(process.env.S3_FORCE_PATH_STYLE, false),
  s3Prefix: (process.env.S3_PREFIX ?? "autohub").trim().replace(/^\/+|\/+$/g, ""),
  s3SignedUploadExpiresIn: readPositiveInteger(process.env.S3_SIGNED_UPLOAD_EXPIRES_SECONDS, 300),
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  llmApiKey: process.env.LLM_API_KEY ?? process.env.OPENAI_API_KEY ?? "",
  llmApiUrl: process.env.LLM_API_URL ?? "",
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? ""
};
function isObjectStorageConfigured() {
  return Boolean(
    ENV.s3Bucket && ENV.s3AccessKey && ENV.s3SecretKey && ENV.s3PublicBaseUrl
  );
}
function assertProductionEnvironment() {
  if (!ENV.isProduction) return;
  const errors = [];
  if (!ENV.databaseUrl) errors.push("DATABASE_URL");
  if (ENV.cookieSecret.length < 32) errors.push("JWT_SECRET (32 characters or more)");
  if (!isObjectStorageConfigured()) {
    errors.push("S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, and S3_PUBLIC_BASE_URL");
  }
  if (errors.length) {
    throw new Error(`Production configuration is incomplete: ${errors.join("; ")}`);
  }
}

// server/db.ts
var pool = null;
function createDatabasePool() {
  if (!ENV.databaseUrl) throw new Error("DATABASE_URL is required when DATA_MODE=mysql");
  const url = new URL(ENV.databaseUrl);
  const ssl = ENV.databaseSsl ? { rejectUnauthorized: ENV.databaseSslRejectUnauthorized, ...ENV.databaseSslCa ? { ca: ENV.databaseSslCa } : {} } : void 0;
  return createPool({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, "")),
    waitForConnections: true,
    connectionLimit: ENV.databaseConnectionLimit,
    maxIdle: Math.min(ENV.databaseConnectionLimit, 2),
    idleTimeout: ENV.databaseIdleTimeoutMs,
    enableKeepAlive: true,
    ssl
  });
}
function createDrizzleDatabase() {
  pool = pool ?? createDatabasePool();
  return drizzle({ client: pool });
}
var database = null;
async function getDb() {
  if (isLocalDataMode()) return null;
  if (!database) {
    try {
      database = createDrizzleDatabase();
    } catch (error) {
      console.error("[Database] Failed to initialize MySQL pool");
      database = null;
    }
  }
  return database;
}
async function upsertUser(user) {
  if (!user.openId) throw new Error("User openId is required for upsert");
  if (isLocalDataMode()) {
    await localUpsertUser(user);
    return;
  }
  const db = await getDb();
  if (!db) throw new Error("Database not available. Set DATA_MODE=local or configure DATABASE_URL for MySQL.");
  const values = { openId: user.openId };
  const updateSet = {};
  const textFields = ["name", "email", "whatsapp", "loginMethod", "passwordHash"];
  for (const field of textFields) {
    if (user[field] !== void 0) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== void 0) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== void 0) {
    values.role = user.role;
    updateSet.role = user.role;
  }
  if (!values.lastSignedIn) values.lastSignedIn = /* @__PURE__ */ new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = /* @__PURE__ */ new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}
async function getUserByOpenId(openId) {
  if (isLocalDataMode()) return localGetUserByOpenId(openId);
  const db = await getDb();
  if (!db) return void 0;
  const rows = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return rows[0];
}
async function getUserByEmail(email) {
  if (isLocalDataMode()) return localGetUserByEmail(email);
  const db = await getDb();
  if (!db) return void 0;
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return rows[0];
}
async function getUserByWhatsapp(whatsapp) {
  if (isLocalDataMode()) return localListUsers(500).then((usersList) => usersList.find((user) => user.whatsapp === whatsapp));
  const db = await getDb();
  if (!db) return void 0;
  const rows = await db.select().from(users).where(eq(users.whatsapp, whatsapp)).limit(1);
  return rows[0];
}
async function updateUserName(id, name) {
  if (isLocalDataMode()) return localUpdateUserName(id, name);
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ name }).where(eq(users.id, id));
}
async function updateUserProfile(id, data) {
  if (isLocalDataMode()) return localUpdateUserProfile(id, data);
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set(data).where(eq(users.id, id));
  return getUserByOpenId((await db.select({ openId: users.openId }).from(users).where(eq(users.id, id)).limit(1))[0]?.openId ?? "");
}
async function getAllUsers(limit = 200) {
  if (isLocalDataMode()) return localListUsers(limit);
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt)).limit(limit);
}
async function updateUserRole(id, role) {
  if (isLocalDataMode()) return localUpdateUserRole(id, role);
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ role }).where(eq(users.id, id));
}
async function getDealers(options = {}) {
  if (isLocalDataMode()) return localGetDealers(options);
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (options.city) conditions.push(eq(dealers.city, options.city));
  if (options.brand) conditions.push(like(dealers.brands, `%${options.brand}%`));
  if (options.q) conditions.push(like(dealers.name, `%${options.q}%`));
  if (options.verified) {
    conditions.push(eq(dealers.isVerified, true));
    conditions.push(eq(dealers.status, "active"));
  }
  if (options.dealerType && options.dealerType !== "all") {
    conditions.push(or(eq(dealers.dealerType, options.dealerType), eq(dealers.dealerType, "both")));
  }
  return db.select().from(dealers).where(conditions.length ? and(...conditions) : void 0).orderBy(desc(dealers.plan), desc(dealers.views)).limit(options.limit ?? 50).offset(options.offset ?? 0);
}
async function getDealerBySlug(slug) {
  if (isLocalDataMode()) return localGetDealerBySlug(slug);
  const db = await getDb();
  if (!db) return void 0;
  const rows = await db.select().from(dealers).where(eq(dealers.slug, slug)).limit(1);
  return rows[0];
}
async function getDealerById(id) {
  if (isLocalDataMode()) return localGetDealerById(id);
  const db = await getDb();
  if (!db) return void 0;
  const rows = await db.select().from(dealers).where(eq(dealers.id, id)).limit(1);
  return rows[0];
}
async function createDealer(data) {
  if (isLocalDataMode()) return localCreateDealer(data);
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(dealers).values(data);
}
async function updateDealer(id, data) {
  if (isLocalDataMode()) return localUpdateDealer(id, data);
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(dealers).set(data).where(eq(dealers.id, id));
}
async function updateDealerViews(id) {
  if (isLocalDataMode()) return localUpdateDealerViews(id);
  const db = await getDb();
  if (!db) return;
  await db.update(dealers).set({ views: sql`${dealers.views} + 1` }).where(eq(dealers.id, id));
}
async function updateDealerStatus(id, status, rejectionReason) {
  if (isLocalDataMode()) return localUpdateDealerStatus(id, status, rejectionReason);
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(dealers).set({ status, rejectionReason, isVerified: status === "active" }).where(eq(dealers.id, id));
}
async function deleteDealer(id) {
  if (isLocalDataMode()) return localDeleteDealer(id);
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(dealers).where(eq(dealers.id, id));
}
async function getDealerOwnerUserId(id) {
  if (isLocalDataMode()) return localGetDealerOwnerUserId(id);
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select({ userId: dealers.userId }).from(dealers).where(eq(dealers.id, id)).limit(1);
  return rows[0]?.userId ?? null;
}
async function getDealerByUserId(userId) {
  if (isLocalDataMode()) return localGetDealerByUserId(userId);
  const db = await getDb();
  if (!db) return void 0;
  const rows = await db.select().from(dealers).where(eq(dealers.userId, userId)).limit(1);
  return rows[0];
}
async function getAllDealersAdmin() {
  if (isLocalDataMode()) return localGetAllDealersAdmin();
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: dealers.id,
    userId: dealers.userId,
    name: dealers.name,
    slug: dealers.slug,
    city: dealers.city,
    phone: dealers.phone,
    email: dealers.email,
    plan: dealers.plan,
    isVerified: dealers.isVerified,
    dealerType: dealers.dealerType,
    views: dealers.views,
    vehiclesCount: dealers.vehiclesCount,
    commercialReg: dealers.commercialReg,
    createdAt: dealers.createdAt,
    ownerName: users.name,
    ownerEmail: users.email,
    status: dealers.status,
    rejectionReason: dealers.rejectionReason
  }).from(dealers).leftJoin(users, eq(dealers.userId, users.id)).orderBy(desc(dealers.createdAt));
}
async function verifyDealer(id, isVerified) {
  if (isLocalDataMode()) return localVerifyDealer(id, isVerified);
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(dealers).set({ isVerified }).where(eq(dealers.id, id));
}
async function updateDealerPlan(id, plan) {
  if (isLocalDataMode()) return localUpdateDealerPlan(id, plan);
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(dealers).set({ plan }).where(eq(dealers.id, id));
}
async function getAdminStatsExtended() {
  if (isLocalDataMode()) return localGetAdminStatsExtended();
  const db = await getDb();
  const base = { totalDealers: 0, verifiedDealers: 0, totalVehicles: 0, totalInquiries: 0, totalUsers: 0, pendingDealers: 0, paidDealers: 0, freeDealers: 0, proDealers: 0, premiumDealers: 0, totalReviews: 0, totalViews: 0 };
  if (!db) return base;
  const [dealerCount] = await db.select({ count: sql`COUNT(*)` }).from(dealers);
  const [verifiedCount] = await db.select({ count: sql`COUNT(*)` }).from(dealers).where(eq(dealers.isVerified, true));
  const [pendingCount] = await db.select({ count: sql`COUNT(*)` }).from(dealers).where(eq(dealers.isVerified, false));
  const [vehicleCount] = await db.select({ count: sql`COUNT(*)` }).from(vehicles);
  const [inquiryCount] = await db.select({ count: sql`COUNT(*)` }).from(inquiries);
  const [userCount] = await db.select({ count: sql`COUNT(*)` }).from(users);
  const [freeCount] = await db.select({ count: sql`COUNT(*)` }).from(dealers).where(eq(dealers.plan, "free"));
  const [proCount] = await db.select({ count: sql`COUNT(*)` }).from(dealers).where(eq(dealers.plan, "pro"));
  const [premiumCount] = await db.select({ count: sql`COUNT(*)` }).from(dealers).where(eq(dealers.plan, "premium"));
  const [reviewCount] = await db.select({ count: sql`COUNT(*)` }).from(reviews);
  const [viewsSum] = await db.select({ total: sql`COALESCE(SUM(views), 0)` }).from(dealers);
  return {
    totalDealers: Number(dealerCount?.count ?? 0),
    verifiedDealers: Number(verifiedCount?.count ?? 0),
    pendingDealers: Number(pendingCount?.count ?? 0),
    totalVehicles: Number(vehicleCount?.count ?? 0),
    totalInquiries: Number(inquiryCount?.count ?? 0),
    totalUsers: Number(userCount?.count ?? 0),
    paidDealers: Number(proCount?.count ?? 0) + Number(premiumCount?.count ?? 0),
    freeDealers: Number(freeCount?.count ?? 0),
    proDealers: Number(proCount?.count ?? 0),
    premiumDealers: Number(premiumCount?.count ?? 0),
    totalReviews: Number(reviewCount?.count ?? 0),
    totalViews: Number(viewsSum?.total ?? 0)
  };
}
async function getVehicles(options = {}) {
  if (isLocalDataMode()) return localGetVehicles(options);
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (options.dealerId) conditions.push(eq(vehicles.dealerId, options.dealerId));
  if (options.condition) conditions.push(eq(vehicles.condition, options.condition));
  if (options.brand) conditions.push(eq(vehicles.brand, options.brand));
  if (options.models?.length) conditions.push(or(...options.models.map((model) => like(vehicles.model, `%${model}%`))));
  else if (options.model) conditions.push(like(vehicles.model, `%${options.model}%`));
  if (options.bodyType) conditions.push(eq(vehicles.bodyType, options.bodyType));
  if (options.trim) conditions.push(like(vehicles.trim, `%${options.trim}%`));
  if (options.city) conditions.push(eq(vehicles.city, options.city));
  if (options.minPrice !== void 0) conditions.push(gte(vehicles.price, options.minPrice));
  if (options.maxPrice !== void 0) conditions.push(lte(vehicles.price, options.maxPrice));
  if (options.minYear !== void 0) conditions.push(gte(vehicles.year, options.minYear));
  if (options.maxYear !== void 0) conditions.push(lte(vehicles.year, options.maxYear));
  if (options.fuelType) conditions.push(eq(vehicles.fuelType, options.fuelType));
  if (options.transmission) conditions.push(eq(vehicles.transmission, options.transmission));
  if (options.status) conditions.push(eq(vehicles.status, options.status));
  if (options.q) conditions.push(or(
    like(vehicles.brand, `%${options.q}%`),
    like(vehicles.model, `%${options.q}%`),
    like(vehicles.bodyType, `%${options.q}%`),
    like(vehicles.trim, `%${options.q}%`)
  ));
  if (!options.status) conditions.push(ne(vehicles.status, "sold"));
  return db.select().from(vehicles).where(conditions.length ? and(...conditions) : void 0).orderBy(desc(vehicles.createdAt)).limit(options.limit ?? 50).offset(options.offset ?? 0);
}
async function getVehiclesWithDealer(options = {}) {
  if (isLocalDataMode()) return localGetVehiclesWithDealer(options);
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (options.dealerId) conditions.push(eq(vehicles.dealerId, options.dealerId));
  if (options.condition) conditions.push(eq(vehicles.condition, options.condition));
  if (options.brand) conditions.push(eq(vehicles.brand, options.brand));
  if (options.models?.length) conditions.push(or(...options.models.map((model) => like(vehicles.model, `%${model}%`))));
  else if (options.model) conditions.push(like(vehicles.model, `%${options.model}%`));
  if (options.bodyType) conditions.push(eq(vehicles.bodyType, options.bodyType));
  if (options.trim) conditions.push(like(vehicles.trim, `%${options.trim}%`));
  if (options.city) conditions.push(or(eq(vehicles.city, options.city), eq(dealers.city, options.city)));
  if (options.minPrice !== void 0) conditions.push(gte(vehicles.price, options.minPrice));
  if (options.maxPrice !== void 0) conditions.push(lte(vehicles.price, options.maxPrice));
  if (options.minYear !== void 0) conditions.push(gte(vehicles.year, options.minYear));
  if (options.maxYear !== void 0) conditions.push(lte(vehicles.year, options.maxYear));
  if (options.fuelType) conditions.push(eq(vehicles.fuelType, options.fuelType));
  if (options.transmission) conditions.push(eq(vehicles.transmission, options.transmission));
  if (options.q) conditions.push(or(
    like(vehicles.brand, `%${options.q}%`),
    like(vehicles.model, `%${options.q}%`),
    like(vehicles.bodyType, `%${options.q}%`),
    like(vehicles.trim, `%${options.q}%`)
  ));
  if (!options.status) conditions.push(ne(vehicles.status, "sold"));
  return db.select({
    id: vehicles.id,
    dealerId: vehicles.dealerId,
    brand: vehicles.brand,
    model: vehicles.model,
    bodyType: vehicles.bodyType,
    trim: vehicles.trim,
    year: vehicles.year,
    price: vehicles.price,
    condition: vehicles.condition,
    fuelType: vehicles.fuelType,
    transmission: vehicles.transmission,
    color: vehicles.color,
    mileage: vehicles.mileage,
    description: vehicles.description,
    images: vehicles.images,
    videoUrl: vehicles.videoUrl,
    status: vehicles.status,
    views: vehicles.views,
    city: vehicles.city,
    createdAt: vehicles.createdAt,
    dealerName: dealers.name,
    dealerSlug: dealers.slug,
    dealerLogo: dealers.logo,
    dealerCity: dealers.city,
    dealerPhone: dealers.phone,
    dealerWhatsapp: dealers.whatsapp,
    dealerVerified: dealers.isVerified
  }).from(vehicles).leftJoin(dealers, eq(vehicles.dealerId, dealers.id)).where(conditions.length ? and(...conditions) : void 0).orderBy(desc(vehicles.createdAt)).limit(options.limit ?? 50).offset(options.offset ?? 0);
}
async function getVehicleById(id) {
  if (isLocalDataMode()) return localGetVehicleById(id);
  const db = await getDb();
  if (!db) return void 0;
  const rows = await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1);
  return rows[0];
}
async function getVehicleWithDealer(id) {
  if (isLocalDataMode()) return localGetVehicleWithDealer(id);
  const db = await getDb();
  if (!db) return void 0;
  const rows = await db.select({
    id: vehicles.id,
    dealerId: vehicles.dealerId,
    brand: vehicles.brand,
    model: vehicles.model,
    bodyType: vehicles.bodyType,
    trim: vehicles.trim,
    year: vehicles.year,
    price: vehicles.price,
    condition: vehicles.condition,
    fuelType: vehicles.fuelType,
    transmission: vehicles.transmission,
    color: vehicles.color,
    mileage: vehicles.mileage,
    description: vehicles.description,
    images: vehicles.images,
    videoUrl: vehicles.videoUrl,
    videoKey: vehicles.videoKey,
    status: vehicles.status,
    views: vehicles.views,
    city: vehicles.city,
    createdAt: vehicles.createdAt,
    updatedAt: vehicles.updatedAt,
    dealerName: dealers.name,
    dealerSlug: dealers.slug,
    dealerLogo: dealers.logo,
    dealerCity: dealers.city,
    dealerPhone: dealers.phone,
    dealerWhatsapp: dealers.whatsapp,
    dealerVerified: dealers.isVerified,
    dealerBio: dealers.bio,
    dealerAddress: dealers.address,
    dealerLat: dealers.lat,
    dealerLng: dealers.lng
  }).from(vehicles).leftJoin(dealers, eq(vehicles.dealerId, dealers.id)).where(eq(vehicles.id, id)).limit(1);
  return rows[0];
}
async function createVehicle(data) {
  if (isLocalDataMode()) return localCreateVehicle(data);
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(vehicles).values(data);
}
async function updateVehicle(id, data) {
  if (isLocalDataMode()) return localUpdateVehicle(id, data);
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(vehicles).set(data).where(eq(vehicles.id, id));
}
async function deleteVehicle(id) {
  if (isLocalDataMode()) return localDeleteVehicle(id);
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(vehicles).where(eq(vehicles.id, id));
}
async function updateVehicleViews(id) {
  if (isLocalDataMode()) return localUpdateVehicleViews(id);
  const db = await getDb();
  if (!db) return;
  await db.update(vehicles).set({ views: sql`${vehicles.views} + 1` }).where(eq(vehicles.id, id));
}
async function getReviewsByDealer(dealerId) {
  if (isLocalDataMode()) return localGetReviewsByDealer(dealerId);
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: reviews.id,
    dealerId: reviews.dealerId,
    userId: reviews.userId,
    rating: reviews.rating,
    comment: reviews.comment,
    createdAt: reviews.createdAt,
    userName: users.name
  }).from(reviews).leftJoin(users, eq(reviews.userId, users.id)).where(eq(reviews.dealerId, dealerId)).orderBy(desc(reviews.createdAt));
}
async function createReview(data) {
  if (isLocalDataMode()) return localCreateReview(data);
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(reviews).values(data);
}
async function getDealerRating(dealerId) {
  if (isLocalDataMode()) return localGetDealerRating(dealerId);
  const db = await getDb();
  if (!db) return { avg: 0, count: 0 };
  const rows = await db.select({ avg: sql`AVG(${reviews.rating})`, count: sql`COUNT(*)` }).from(reviews).where(eq(reviews.dealerId, dealerId));
  return { avg: Number(rows[0]?.avg ?? 0), count: Number(rows[0]?.count ?? 0) };
}
async function hasUserReviewed(dealerId, userId) {
  if (isLocalDataMode()) return localHasUserReviewed(dealerId, userId);
  const db = await getDb();
  if (!db) return false;
  const rows = await db.select({ id: reviews.id }).from(reviews).where(and(eq(reviews.dealerId, dealerId), eq(reviews.userId, userId))).limit(1);
  return rows.length > 0;
}
async function deleteReview(id) {
  if (isLocalDataMode()) return localDeleteReview(id);
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(reviews).where(eq(reviews.id, id));
}
async function getAllReviewsAdmin() {
  if (isLocalDataMode()) return localGetAllReviewsAdmin();
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: reviews.id,
    dealerId: reviews.dealerId,
    userId: reviews.userId,
    rating: reviews.rating,
    comment: reviews.comment,
    createdAt: reviews.createdAt,
    dealerName: dealers.name,
    userName: users.name
  }).from(reviews).leftJoin(dealers, eq(reviews.dealerId, dealers.id)).leftJoin(users, eq(reviews.userId, users.id)).orderBy(desc(reviews.createdAt)).limit(500);
}
async function createInquiry(data) {
  if (isLocalDataMode()) return localCreateInquiry(data);
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(inquiries).values(data);
}
async function createVehicleRequest(data) {
  if (isLocalDataMode()) return localCreateVehicleRequest(data);
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(vehicleRequests).values(data);
}
async function getVehicleRequestsByUser(userId) {
  if (isLocalDataMode()) return localGetVehicleRequestsByUser(userId);
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vehicleRequests).where(eq(vehicleRequests.userId, userId)).orderBy(desc(vehicleRequests.createdAt));
}
async function getAllVehicleRequestsAdmin() {
  if (isLocalDataMode()) return localGetAllVehicleRequestsAdmin();
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: vehicleRequests.id,
    requestCode: vehicleRequests.requestCode,
    userId: vehicleRequests.userId,
    name: vehicleRequests.name,
    whatsapp: vehicleRequests.whatsapp,
    email: vehicleRequests.email,
    brand: vehicleRequests.brand,
    bodyType: vehicleRequests.bodyType,
    models: vehicleRequests.models,
    trim: vehicleRequests.trim,
    condition: vehicleRequests.condition,
    minPrice: vehicleRequests.minPrice,
    maxPrice: vehicleRequests.maxPrice,
    targetPrice: vehicleRequests.targetPrice,
    minYear: vehicleRequests.minYear,
    message: vehicleRequests.message,
    matchedDealers: vehicleRequests.matchedDealers,
    status: vehicleRequests.status,
    createdAt: vehicleRequests.createdAt,
    senderName: users.name
  }).from(vehicleRequests).leftJoin(users, eq(vehicleRequests.userId, users.id)).orderBy(desc(vehicleRequests.createdAt)).limit(500);
}
async function getInquiriesByDealer(dealerId) {
  if (isLocalDataMode()) return localGetInquiriesByDealer(dealerId);
  const db = await getDb();
  if (!db) return [];
  return db.select().from(inquiries).where(eq(inquiries.dealerId, dealerId)).orderBy(desc(inquiries.createdAt));
}
async function updateInquiryStatus(id, status) {
  if (isLocalDataMode()) return localUpdateInquiryStatus(id, status);
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(inquiries).set({ status }).where(eq(inquiries.id, id));
}
async function getAllInquiriesAdmin() {
  if (isLocalDataMode()) return localGetAllInquiriesAdmin();
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: inquiries.id,
    dealerId: inquiries.dealerId,
    name: inquiries.name,
    phone: inquiries.phone,
    message: inquiries.message,
    status: inquiries.status,
    createdAt: inquiries.createdAt,
    dealerName: dealers.name
  }).from(inquiries).leftJoin(dealers, eq(inquiries.dealerId, dealers.id)).orderBy(desc(inquiries.createdAt)).limit(200);
}
async function createContactMessage(data) {
  if (isLocalDataMode()) return localCreateContactMessage(data);
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(contactMessages).values(data);
}
async function getAllContactMessagesAdmin() {
  if (isLocalDataMode()) return localGetAllContactMessagesAdmin();
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)).limit(500);
}
async function updateContactMessageStatus(id, status) {
  if (isLocalDataMode()) return localUpdateContactMessageStatus(id, status);
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(contactMessages).set({ status }).where(eq(contactMessages.id, id));
}
async function createMediaUpload(data) {
  if (isLocalDataMode()) return localCreateMediaUpload(data);
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(mediaUploads).values(data);
}
async function getDealerDashboard(dealerId) {
  if (isLocalDataMode()) return localGetDealerDashboard(dealerId);
  const db = await getDb();
  if (!db) return { totalViews: 0, totalInquiries: 0, totalVehicles: 0, avgRating: 0, reviewCount: 0, recentInquiries: [], recentVehicles: [] };
  const [dealer] = await db.select().from(dealers).where(eq(dealers.id, dealerId)).limit(1);
  const [rating] = await db.select({ avg: sql`AVG(${reviews.rating})`, count: sql`COUNT(*)` }).from(reviews).where(eq(reviews.dealerId, dealerId));
  const [inquiryCount] = await db.select({ count: sql`COUNT(*)` }).from(inquiries).where(eq(inquiries.dealerId, dealerId));
  const [vehicleCount] = await db.select({ count: sql`COUNT(*)` }).from(vehicles).where(eq(vehicles.dealerId, dealerId));
  const recentInquiries = await db.select().from(inquiries).where(eq(inquiries.dealerId, dealerId)).orderBy(desc(inquiries.createdAt)).limit(10);
  const recentVehicles = await db.select().from(vehicles).where(eq(vehicles.dealerId, dealerId)).orderBy(desc(vehicles.createdAt)).limit(6);
  return {
    totalViews: dealer?.views ?? 0,
    totalInquiries: Number(inquiryCount?.count ?? 0),
    totalVehicles: Number(vehicleCount?.count ?? 0),
    avgRating: Number(rating?.avg ?? 0),
    reviewCount: Number(rating?.count ?? 0),
    recentInquiries,
    recentVehicles
  };
}
async function getVehicleCountByDealer(dealerId) {
  if (isLocalDataMode()) return localGetVehicleCountByDealer(dealerId);
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ count: sql`COUNT(*)` }).from(vehicles).where(eq(vehicles.dealerId, dealerId));
  return Number(rows[0]?.count ?? 0);
}
async function getDealerAnalytics(dealerId, days = 30) {
  if (isLocalDataMode()) return localGetDealerAnalytics(dealerId, days);
  const db = await getDb();
  if (!db) return { daily: [], totals: { views: 0, inquiries: 0, vehicleViews: 0 } };
  const start = /* @__PURE__ */ new Date();
  start.setDate(start.getDate() - days + 1);
  const startString = start.toISOString().slice(0, 10);
  const daily = await db.select().from(dealerStats).where(and(eq(dealerStats.dealerId, dealerId), gte(dealerStats.date, startString))).orderBy(dealerStats.date);
  const totals = daily.reduce((total, row) => ({
    views: total.views + (row.views ?? 0),
    inquiries: total.inquiries + (row.inquiries ?? 0),
    vehicleViews: total.vehicleViews + (row.vehicleViews ?? 0)
  }), { views: 0, inquiries: 0, vehicleViews: 0 });
  return { daily, totals };
}
async function recordDealerStat(dealerId, field) {
  if (isLocalDataMode()) return localRecordDealerStat(dealerId, field);
  const db = await getDb();
  if (!db) return;
  const date = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const [existing] = await db.select().from(dealerStats).where(and(eq(dealerStats.dealerId, dealerId), eq(dealerStats.date, date))).limit(1);
  if (existing) {
    const increment = field === "views" ? { views: sql`${dealerStats.views} + 1` } : field === "inquiries" ? { inquiries: sql`${dealerStats.inquiries} + 1` } : { vehicleViews: sql`${dealerStats.vehicleViews} + 1` };
    await db.update(dealerStats).set(increment).where(and(eq(dealerStats.dealerId, dealerId), eq(dealerStats.date, date)));
  } else {
    await db.insert(dealerStats).values({ dealerId, date, views: field === "views" ? 1 : 0, inquiries: field === "inquiries" ? 1 : 0, vehicleViews: field === "vehicleViews" ? 1 : 0 });
  }
}
async function createNotification(data) {
  if (isLocalDataMode()) {
    await localCreateNotification(data);
    return;
  }
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values(data);
}
async function getNotificationsByUser(userId, limit = 30) {
  if (isLocalDataMode()) return localGetNotificationsByUser(userId, limit);
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(limit);
}
async function markNotificationsRead(userId, ids) {
  if (isLocalDataMode()) return localMarkNotificationsRead(userId, ids);
  const db = await getDb();
  if (!db) return;
  if (ids?.length) {
    await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.userId, userId), sql`${notifications.id} IN (${ids.join(",")})`));
  } else {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
  }
}
async function getUnreadNotificationCount(userId) {
  if (isLocalDataMode()) return localGetUnreadNotificationCount(userId);
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ count: sql`COUNT(*)` }).from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return Number(rows[0]?.count ?? 0);
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  const secure = isSecureRequest(req);
  return {
    httpOnly: true,
    path: "/",
    // AutoHub serves its SPA and API from the same site on Vercel. Lax protects
    // state-changing requests from routine cross-site navigation without a CORS flow.
    sameSite: "lax",
    secure
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
function getSecret() {
  const secret = ENV.cookieSecret;
  if (!secret || secret.length < 32) {
    if (ENV.isProduction) {
      throw new Error("JWT_SECRET must contain at least 32 characters in production");
    }
    console.warn("[Auth] JWT_SECRET is missing or short. Set a 32-character secret before deployment.");
  }
  return new TextEncoder().encode(secret || "local-development-secret-change-before-production");
}
var sdk = {
  /** Create a signed JWT session token. */
  async createSessionToken(openId, opts) {
    return new SignJWT({ openId, name: opts.name }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setIssuedAt().setExpirationTime(Math.floor((Date.now() + opts.expiresInMs) / 1e3)).sign(getSecret());
  },
  /** Verify a JWT and return openId, or null. */
  async verifySessionToken(token) {
    try {
      const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
      if (typeof payload.openId !== "string") return null;
      return { openId: payload.openId, name: payload.name ?? "" };
    } catch {
      return null;
    }
  },
  /** Authenticate an Express request via cookie or Bearer header. */
  async authenticateRequest(req) {
    let token;
    const cookies = parseCookieHeader(req.headers.cookie ?? "");
    token = cookies[COOKIE_NAME];
    if (!token) {
      const auth = req.headers.authorization ?? "";
      if (auth.startsWith("Bearer ")) token = auth.slice(7);
    }
    if (!token) throw ForbiddenError("No session token");
    const session = await sdk.verifySessionToken(token);
    if (!session) throw ForbiddenError("Invalid or expired session token");
    const user = await getUserByOpenId(session.openId);
    if (!user) throw ForbiddenError("User not found");
    return user;
  }
};

// server/_core/oauth.ts
function sessionTtlMs() {
  return ENV.sessionTtlDays * 24 * 60 * 60 * 1e3;
}
function validatePassword(password) {
  const minLength = ENV.isProduction ? 12 : 8;
  if (password.length < minLength) return `Password must contain at least ${minLength} characters`;
  return null;
}
function registerOAuthRoutes(app2) {
  const issueLocalSession = async (req, res, user, statusCode = 200) => {
    const sessionToken = await sdk.createSessionToken(user.openId, {
      name: user.name || "",
      expiresInMs: sessionTtlMs()
    });
    const dealer = await getDealerByUserId(user.id);
    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: sessionTtlMs() });
    res.status(statusCode).json({
      ok: true,
      user: { id: user.id, name: user.name, email: user.email, whatsapp: user.whatsapp, role: user.role },
      postLoginPath: user.role === "admin" ? "/admin" : dealer ? "/dashboard" : "/account"
    });
  };
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name, whatsapp } = req.body;
      const passwordError = password ? validatePassword(password) : "email and password are required";
      if (!email || !password || passwordError) {
        res.status(400).json({ error: passwordError });
        return;
      }
      const existing = await getUserByEmail(email.toLowerCase().trim());
      if (existing) {
        res.status(409).json({ error: "Email already registered" });
        return;
      }
      const passwordHash = await bcryptHash2(password, ENV.passwordHashRounds);
      const openId = `local_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      await upsertUser({
        openId,
        name: name?.trim() || email.split("@")[0],
        email: email.toLowerCase().trim(),
        whatsapp: whatsapp?.trim() || void 0,
        loginMethod: "email",
        passwordHash,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const user = await getUserByOpenId(openId);
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
  app2.post("/api/auth/customer-register", async (req, res) => {
    try {
      const { name, whatsapp, email } = req.body;
      const normalizedName = name?.trim();
      const normalizedWhatsapp = whatsapp?.replace(/[\s()-]/g, "").trim();
      const normalizedEmail = email?.trim().toLowerCase() || void 0;
      if (!normalizedName || normalizedName.length < 2 || !normalizedWhatsapp || normalizedWhatsapp.length < 9) {
        res.status(400).json({ error: "Name and WhatsApp are required" });
        return;
      }
      const existingByPhone = await getUserByWhatsapp(normalizedWhatsapp);
      if (normalizedEmail) {
        const existingByEmail = await getUserByEmail(normalizedEmail);
        if (existingByEmail && existingByEmail.id !== existingByPhone?.id) {
          res.status(409).json({ error: "Email already registered" });
          return;
        }
      }
      if (existingByPhone) {
        const user2 = await updateUserProfile(existingByPhone.id, {
          name: normalizedName,
          whatsapp: normalizedWhatsapp,
          ...normalizedEmail ? { email: normalizedEmail } : {}
        });
        await issueLocalSession(req, res, user2);
        return;
      }
      const openId = `customer_${normalizedWhatsapp.replace(/\D/g, "")}_${Date.now().toString(36)}`.slice(0, 64);
      await upsertUser({
        openId,
        name: normalizedName,
        email: normalizedEmail,
        whatsapp: normalizedWhatsapp,
        loginMethod: "whatsapp",
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const user = await getUserByOpenId(openId);
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
  app2.post("/api/auth/customer-login", async (req, res) => {
    try {
      if (!ENV.allowInsecureCustomerLogin) {
        res.status(403).json({ error: "Phone-only login is disabled in production. Please use email and password." });
        return;
      }
      const whatsapp = req.body.whatsapp?.replace(/[\s()-]/g, "").trim();
      if (!whatsapp || whatsapp.length < 9) {
        res.status(400).json({ error: "WhatsApp is required" });
        return;
      }
      const user = await getUserByWhatsapp(whatsapp);
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
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: "email and password are required" });
        return;
      }
      const user = await getUserByEmail(email.toLowerCase().trim());
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
  app2.post("/api/auth/logout", (req, res) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions });
    res.status(200).json({ ok: true });
  });
  app2.get("/api/oauth/callback", (_req, res) => {
    res.redirect(302, "/login");
  });
}

// server/_core/storageProxy.ts
import fs2 from "fs";
import path3 from "path";

// server/storage.ts
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs";
import path2 from "path";
var objectStorageClient = null;
function normalizeKey(relKey) {
  const normalized = relKey.replace(/^\/+/, "").replace(/\\/g, "/");
  if (!normalized || normalized.split("/").some((part) => part === "..")) {
    throw new Error("Invalid storage key");
  }
  return normalized;
}
function appendHashSuffix(relKey) {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}
function buildObjectKey(relKey) {
  const key = normalizeKey(relKey);
  return ENV.s3Prefix ? `${ENV.s3Prefix}/${key}` : key;
}
function getUploadDir() {
  const dir = path2.resolve(ENV.uploadDir);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}
function getObjectStorageClient() {
  if (!isObjectStorageConfigured()) throw new Error("S3-compatible storage is not configured");
  if (!objectStorageClient) {
    objectStorageClient = new S3Client({
      region: ENV.s3Region,
      endpoint: ENV.s3Endpoint || void 0,
      forcePathStyle: ENV.s3ForcePathStyle,
      credentials: {
        accessKeyId: ENV.s3AccessKey,
        secretAccessKey: ENV.s3SecretKey
      }
    });
  }
  return objectStorageClient;
}
function publicObjectUrl(key) {
  if (!ENV.s3PublicBaseUrl) throw new Error("S3_PUBLIC_BASE_URL is required for durable public assets");
  return `${ENV.s3PublicBaseUrl}/${key.split("/").map(encodeURIComponent).join("/")}`;
}
function storageUsesObjectStorage() {
  return isObjectStorageConfigured();
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const uniqueKey = appendHashSuffix(normalizeKey(relKey));
  if (storageUsesObjectStorage()) {
    const key = buildObjectKey(uniqueKey);
    await getObjectStorageClient().send(new PutObjectCommand({
      Bucket: ENV.s3Bucket,
      Key: key,
      Body: typeof data === "string" ? Buffer.from(data) : Buffer.from(data),
      ContentType: contentType
    }));
    return { key, url: publicObjectUrl(key) };
  }
  const uploadDir = getUploadDir();
  const filePath = path2.join(uploadDir, uniqueKey);
  if (!filePath.startsWith(uploadDir)) throw new Error("Invalid storage key");
  fs.mkdirSync(path2.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, typeof data === "string" ? Buffer.from(data) : Buffer.from(data));
  return { key: uniqueKey, url: `/uploads/${uniqueKey}` };
}
async function storageCreateUploadUrl(relKey, contentType) {
  if (!storageUsesObjectStorage()) throw new Error("Direct object storage uploads are unavailable in local mode");
  const key = buildObjectKey(appendHashSuffix(normalizeKey(relKey)));
  const command = new PutObjectCommand({ Bucket: ENV.s3Bucket, Key: key, ContentType: contentType });
  const uploadUrl = await getSignedUrl(getObjectStorageClient(), command, { expiresIn: ENV.s3SignedUploadExpiresIn });
  return { key, url: publicObjectUrl(key), uploadUrl, headers: { "Content-Type": contentType } };
}
async function storageGet(relKey) {
  const key = normalizeKey(relKey);
  if (storageUsesObjectStorage()) return { key, url: publicObjectUrl(key) };
  return { key, url: `/uploads/${key}` };
}
async function storageInspectObject(relKey) {
  if (!storageUsesObjectStorage()) throw new Error("Object inspection is unavailable in local mode");
  const key = normalizeKey(relKey);
  const response = await getObjectStorageClient().send(new HeadObjectCommand({ Bucket: ENV.s3Bucket, Key: key }));
  const size = Number(response.ContentLength ?? 0);
  const contentType = response.ContentType ?? "application/octet-stream";
  if (!Number.isFinite(size) || size <= 0) throw new Error("Uploaded object is empty or unavailable");
  return { size, contentType };
}

// server/_core/storageProxy.ts
function registerStorageProxy(app2) {
  if (storageUsesObjectStorage()) return;
  const serveFile = async (req, res, key) => {
    if (!key) {
      res.status(400).send("Missing file key");
      return;
    }
    const uploadDir = path3.resolve(ENV.uploadDir);
    const filePath = path3.resolve(uploadDir, key);
    if (!filePath.startsWith(uploadDir)) {
      res.status(403).send("Forbidden");
      return;
    }
    if (!fs2.existsSync(filePath)) {
      res.status(404).send("File not found");
      return;
    }
    res.sendFile(filePath);
  };
  app2.get("/uploads/*", async (req, res) => {
    const key = req.params[0];
    await serveFile(req, res, key);
  });
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
async function notifyOwner(payload) {
  console.log(`[Notification] ${payload.title}: ${payload.content}`);
  return true;
}

// server/_core/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
import { hash as bcryptHash3 } from "bcryptjs";
import { z as z2 } from "zod";

// server/_core/ownership.ts
import { TRPCError as TRPCError2 } from "@trpc/server";
async function requireDealerAccess(user, dealerId) {
  const dealer = await getDealerById(dealerId);
  if (!dealer) throw new TRPCError2({ code: "NOT_FOUND", message: "\u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u0645\u0639\u0631\u0636" });
  if (user.role === "admin") return dealer;
  const ownedDealer = await getDealerByUserId(user.id);
  if (!ownedDealer || ownedDealer.id !== dealerId) {
    throw new TRPCError2({ code: "FORBIDDEN", message: "\u0644\u064A\u0633 \u0644\u062F\u064A\u0643 \u0635\u0644\u0627\u062D\u064A\u0629 \u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u0628\u064A\u0627\u0646\u0627\u062A \u0647\u0630\u0627 \u0627\u0644\u0645\u0639\u0631\u0636" });
  }
  return dealer;
}
async function requireVehicleAccess(user, vehicleId) {
  const vehicle = await getVehicleById(vehicleId);
  if (!vehicle) throw new TRPCError2({ code: "NOT_FOUND", message: "\u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u0633\u064A\u0627\u0631\u0629" });
  await requireDealerAccess(user, vehicle.dealerId);
  return vehicle;
}

// server/routers.ts
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(({ ctx }) => ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    }),
    profile: protectedProcedure.query(async ({ ctx }) => {
      return await getUserByOpenId(ctx.user.openId) ?? ctx.user;
    }),
    updateProfile: protectedProcedure.input(z2.object({
      name: z2.string().trim().min(2).max(120),
      whatsapp: z2.string().trim().min(9).max(30),
      email: z2.string().trim().email().optional().or(z2.literal(""))
    })).mutation(async ({ input, ctx }) => {
      const user = await getUserByOpenId(ctx.user.openId);
      if (!user) throw new Error("\u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u062D\u0633\u0627\u0628 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645");
      const updated = await updateUserProfile(user.id, {
        name: input.name,
        whatsapp: input.whatsapp,
        email: input.email || null
      });
      return updated;
    })
  }),
  dealers: router({
    list: publicProcedure.input(z2.object({
      city: z2.string().optional(),
      brand: z2.string().optional(),
      q: z2.string().optional(),
      verified: z2.boolean().optional(),
      dealerType: z2.string().optional(),
      limit: z2.number().min(1).max(100).default(50),
      offset: z2.number().min(0).default(0)
    }).optional()).query(async ({ input }) => getDealers(input ?? {})),
    bySlug: publicProcedure.input(z2.object({ slug: z2.string() })).query(async ({ input }) => {
      const dealer = await getDealerBySlug(input.slug);
      if (!dealer) return null;
      await updateDealerViews(dealer.id);
      await recordDealerStat(dealer.id, "views").catch(() => {
      });
      return dealer;
    }),
    register: publicProcedure.input(z2.object({
      name: z2.string().min(2),
      ownerName: z2.string().min(2),
      phone: z2.string().min(9),
      email: z2.string().email().optional(),
      city: z2.string().min(1),
      neighborhood: z2.string().optional(),
      brands: z2.array(z2.string()).min(1),
      bio: z2.string().optional(),
      commercialReg: z2.string().optional(),
      dealerType: z2.enum(["sell", "buy", "both"]).default("sell")
    })).mutation(async ({ input, ctx }) => {
      const slug = input.name.toLowerCase().replace(/\s+/g, "-").replace(/[^\w\u0600-\u06FF-]/g, "") + "-" + Date.now().toString(36);
      if (ctx.user?.id && input.ownerName) {
        await updateUserName(ctx.user.id, input.ownerName).catch((error) => {
          console.warn("[register] Failed to update user name:", error);
        });
      }
      await createDealer({
        userId: ctx.user?.id ?? null,
        name: input.name,
        slug,
        phone: input.phone,
        email: input.email ?? null,
        city: input.city,
        neighborhood: input.neighborhood ?? null,
        brands: JSON.stringify(input.brands),
        bio: input.bio ?? null,
        commercialReg: input.commercialReg ?? null,
        whatsapp: input.phone,
        dealerType: input.dealerType
      });
      return { success: true, slug };
    })
  }),
  vehicles: router({
    list: publicProcedure.input(z2.object({
      dealerId: z2.number().optional(),
      condition: z2.enum(["new", "used"]).optional(),
      brand: z2.string().optional(),
      model: z2.string().optional(),
      models: z2.array(z2.string().min(1)).max(8).optional(),
      bodyType: z2.string().optional(),
      trim: z2.string().optional(),
      city: z2.string().optional(),
      minPrice: z2.number().optional(),
      maxPrice: z2.number().optional(),
      minYear: z2.number().optional(),
      maxYear: z2.number().optional(),
      fuelType: z2.string().optional(),
      transmission: z2.string().optional(),
      status: z2.string().optional(),
      q: z2.string().optional(),
      limit: z2.number().default(50),
      offset: z2.number().default(0)
    }).optional()).query(async ({ input }) => getVehiclesWithDealer(input ?? {})),
    search: publicProcedure.input(z2.object({
      q: z2.string().optional(),
      brand: z2.string().optional(),
      model: z2.string().optional(),
      models: z2.array(z2.string().min(1)).max(8).optional(),
      bodyType: z2.string().optional(),
      trim: z2.string().optional(),
      city: z2.string().optional(),
      condition: z2.enum(["new", "used"]).optional(),
      minPrice: z2.number().optional(),
      maxPrice: z2.number().optional(),
      minYear: z2.number().optional(),
      maxYear: z2.number().optional(),
      fuelType: z2.string().optional(),
      transmission: z2.string().optional(),
      limit: z2.number().default(24),
      offset: z2.number().default(0)
    }).optional()).query(async ({ input }) => getVehiclesWithDealer(input ?? {})),
    byId: publicProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      const vehicle = await getVehicleWithDealer(input.id);
      if (!vehicle) return null;
      await updateVehicleViews(input.id);
      if (vehicle.dealerId) {
        await recordDealerStat(vehicle.dealerId, "vehicleViews").catch(() => {
        });
      }
      return vehicle;
    }),
    create: protectedProcedure.input(z2.object({
      dealerId: z2.number(),
      brand: z2.string(),
      model: z2.string(),
      bodyType: z2.string().optional(),
      trim: z2.string().optional(),
      year: z2.number(),
      price: z2.number(),
      condition: z2.enum(["new", "used"]),
      fuelType: z2.enum(["petrol", "diesel", "hybrid", "electric"]).default("petrol"),
      transmission: z2.enum(["automatic", "manual"]).default("automatic"),
      color: z2.string().optional(),
      mileage: z2.number().default(0),
      description: z2.string().optional(),
      images: z2.array(z2.string()).default([]),
      videoUrl: z2.string().optional(),
      videoKey: z2.string().optional(),
      city: z2.string().optional()
    })).mutation(async ({ input, ctx }) => {
      const dealer = await requireDealerAccess(ctx.user, input.dealerId);
      if (ctx.user.role !== "admin") {
        const PLAN_LIMITS = { free: 5, basic: 15, pro: 50, premium: 999 };
        const limit = PLAN_LIMITS[dealer.plan] ?? 5;
        const count = await getVehicleCountByDealer(dealer.id);
        if (count >= limit) {
          throw new Error(`\u0644\u0642\u062F \u0648\u0635\u0644\u062A \u0644\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0644\u062E\u0637\u062A\u0643 (${limit} \u0633\u064A\u0627\u0631\u0629). \u064A\u0631\u062C\u0649 \u0627\u0644\u062A\u0631\u0642\u064A\u0629 \u0644\u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0645\u0632\u064A\u062F.`);
        }
      }
      await createVehicle({
        ...input,
        color: input.color ?? null,
        description: input.description ?? null,
        images: JSON.stringify(input.images),
        videoUrl: input.videoUrl ?? null,
        videoKey: input.videoKey ?? null,
        city: input.city ?? null
      });
      return { success: true };
    }),
    update: protectedProcedure.input(z2.object({
      id: z2.number(),
      brand: z2.string().optional(),
      model: z2.string().optional(),
      bodyType: z2.string().optional(),
      trim: z2.string().optional(),
      year: z2.number().optional(),
      price: z2.number().optional(),
      condition: z2.enum(["new", "used"]).optional(),
      fuelType: z2.enum(["petrol", "diesel", "hybrid", "electric"]).optional(),
      transmission: z2.enum(["automatic", "manual"]).optional(),
      color: z2.string().optional(),
      mileage: z2.number().optional(),
      description: z2.string().optional(),
      images: z2.array(z2.string()).optional(),
      videoUrl: z2.string().optional(),
      videoKey: z2.string().optional(),
      status: z2.enum(["available", "reserved", "sold"]).optional(),
      city: z2.string().optional()
    })).mutation(async ({ input, ctx }) => {
      const { id, images, ...rest } = input;
      await requireVehicleAccess(ctx.user, id);
      await updateVehicle(id, { ...rest, images: images ? JSON.stringify(images) : void 0 });
      return { success: true };
    }),
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input, ctx }) => {
      await requireVehicleAccess(ctx.user, input.id);
      await deleteVehicle(input.id);
      return { success: true };
    })
  }),
  reviews: router({
    byDealer: publicProcedure.input(z2.object({ dealerId: z2.number() })).query(async ({ input }) => {
      const [reviewsList, rating] = await Promise.all([
        getReviewsByDealer(input.dealerId),
        getDealerRating(input.dealerId)
      ]);
      return { reviews: reviewsList, rating };
    }),
    create: protectedProcedure.input(z2.object({
      dealerId: z2.number(),
      rating: z2.number().min(1).max(5),
      comment: z2.string().max(1e3).optional()
    })).mutation(async ({ input, ctx }) => {
      const alreadyReviewed = await hasUserReviewed(input.dealerId, ctx.user.id);
      if (alreadyReviewed) throw new Error("\u0644\u0642\u062F \u0642\u0645\u062A \u0628\u062A\u0642\u064A\u064A\u0645 \u0647\u0630\u0627 \u0627\u0644\u0645\u0639\u0631\u0636 \u0645\u0633\u0628\u0642\u0627\u064B");
      await createReview({ dealerId: input.dealerId, userId: ctx.user.id, rating: input.rating, comment: input.comment ?? null });
      return { success: true };
    })
  }),
  inquiries: router({
    create: publicProcedure.input(z2.object({
      dealerId: z2.number(),
      vehicleId: z2.number().optional(),
      name: z2.string().min(2),
      phone: z2.string().min(9),
      message: z2.string().min(5)
    })).mutation(async ({ input, ctx }) => {
      await createInquiry({
        dealerId: input.dealerId,
        vehicleId: input.vehicleId ?? null,
        userId: ctx.user?.id ?? null,
        name: input.name,
        phone: input.phone,
        message: input.message
      });
      await notifyOwner({
        title: `\u0627\u0633\u062A\u0641\u0633\u0627\u0631 \u062C\u062F\u064A\u062F \u0645\u0646 ${input.name}`,
        content: `\u{1F4DE} ${input.phone}
\u{1F4AC} ${input.message}`
      }).catch(() => {
      });
      await recordDealerStat(input.dealerId, "inquiries").catch(() => {
      });
      const ownerUserId = await getDealerOwnerUserId(input.dealerId).catch(() => null);
      if (ownerUserId) {
        await createNotification({
          userId: ownerUserId,
          dealerId: input.dealerId,
          type: "inquiry",
          title: `\u0627\u0633\u062A\u0641\u0633\u0627\u0631 \u062C\u062F\u064A\u062F \u0645\u0646 ${input.name}`,
          body: input.message
        }).catch(() => {
        });
      }
      return { success: true };
    }),
    byDealer: protectedProcedure.input(z2.object({ dealerId: z2.number() })).query(async ({ input, ctx }) => {
      await requireDealerAccess(ctx.user, input.dealerId);
      return getInquiriesByDealer(input.dealerId);
    }),
    updateStatus: protectedProcedure.input(z2.object({ id: z2.number(), status: z2.enum(["new", "read", "replied"]) })).mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        const dealer = await getDealerByUserId(ctx.user.id);
        if (!dealer) throw new Error("Forbidden");
        const inquiry = (await getInquiriesByDealer(dealer.id)).find((item) => item.id === input.id);
        if (!inquiry) throw new Error("Forbidden");
      }
      await updateInquiryStatus(input.id, input.status);
      return { success: true };
    })
  }),
  contact: router({
    send: publicProcedure.input(z2.object({
      name: z2.string().trim().min(2, "\u0627\u0644\u0627\u0633\u0645 \u064A\u062C\u0628 \u0623\u0646 \u064A\u062D\u062A\u0648\u064A \u0639\u0644\u0649 \u062D\u0631\u0641\u064A\u0646 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644").max(200),
      whatsapp: z2.string().trim().min(9, "\u0631\u0642\u0645 \u0627\u0644\u0648\u0627\u062A\u0633\u0627\u0628 \u063A\u064A\u0631 \u0645\u0643\u062A\u0645\u0644").max(30),
      email: z2.string().trim().email("\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u063A\u064A\u0631 \u0635\u0627\u0644\u062D").optional().or(z2.literal("")),
      message: z2.string().trim().min(10, "\u0627\u0644\u0631\u0633\u0627\u0644\u0629 \u064A\u062C\u0628 \u0623\u0646 \u062A\u062D\u062A\u0648\u064A \u0639\u0644\u0649 10 \u0623\u062D\u0631\u0641 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644").max(2e3)
    })).mutation(async ({ input }) => {
      const message = await createContactMessage({
        name: input.name,
        whatsapp: input.whatsapp,
        email: input.email || null,
        message: input.message,
        status: "new"
      });
      return { success: true, id: message?.id ?? null };
    })
  }),
  vehicleRequests: router({
    broadcast: protectedProcedure.input(z2.object({
      city: z2.string().trim().max(100).optional(),
      brand: z2.string().trim().max(100).optional(),
      bodyType: z2.string().trim().max(80).optional(),
      models: z2.array(z2.string().trim().min(1).max(100)).max(8).default([]),
      trim: z2.string().trim().max(100).optional(),
      condition: z2.enum(["new", "used"]).optional(),
      minPrice: z2.number().positive().optional(),
      maxPrice: z2.number().positive().optional(),
      targetPrice: z2.number().positive().optional(),
      minYear: z2.number().int().min(1980).max(2100).optional(),
      message: z2.string().trim().min(10).max(2e3)
    }).refine((input) => !(input.minPrice && input.maxPrice && input.minPrice > input.maxPrice), {
      message: "\u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0627\u0644\u0633\u0639\u0631 \u0645\u0646 \u0623\u0642\u0644 \u0645\u0646 \u0623\u0648 \u064A\u0633\u0627\u0648\u064A \u0627\u0644\u0633\u0639\u0631 \u0625\u0644\u0649.",
      path: ["maxPrice"]
    })).mutation(async ({ input, ctx }) => {
      const currentUser = await getUserByOpenId(ctx.user.openId);
      if (!currentUser?.name || !currentUser.whatsapp) {
        throw new Error("\u0623\u0643\u0645\u0644 \u0627\u0644\u0627\u0633\u0645 \u0648\u0631\u0642\u0645 \u0648\u0627\u062A\u0633\u0627\u0628 \u0641\u064A \u062D\u0633\u0627\u0628\u0643 \u0642\u0628\u0644 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0637\u0644\u0628.");
      }
      const approvedDealers = await getDealers({ verified: true, limit: 100 });
      if (approvedDealers.length === 0) {
        throw new Error("\u0644\u0627 \u062A\u0648\u062C\u062F \u0645\u0639\u0627\u0631\u0636 \u0645\u0639\u062A\u0645\u062F\u0629 \u0645\u062A\u0627\u062D\u0629 \u0644\u0627\u0633\u062A\u0642\u0628\u0627\u0644 \u0627\u0644\u0637\u0644\u0628 \u062D\u0627\u0644\u064A\u064B\u0627.");
      }
      const requestCode = `REQ-${Date.now().toString(36).toUpperCase()}`;
      const price = input.targetPrice ? `\u0627\u0644\u0645\u064A\u0632\u0627\u0646\u064A\u0629 \u0627\u0644\u0642\u0635\u0648\u0649: ${input.targetPrice.toLocaleString("en-US")} \u0631.\u0633` : input.minPrice || input.maxPrice ? `\u0627\u0644\u0645\u064A\u0632\u0627\u0646\u064A\u0629: ${input.minPrice?.toLocaleString("en-US") ?? "\u063A\u064A\u0631 \u0645\u062D\u062F\u062F"} \u2014 ${input.maxPrice?.toLocaleString("en-US") ?? "\u063A\u064A\u0631 \u0645\u062D\u062F\u062F"} \u0631.\u0633` : "\u0627\u0644\u0645\u064A\u0632\u0627\u0646\u064A\u0629: \u063A\u064A\u0631 \u0645\u062D\u062F\u062F\u0629";
      const details = [
        `\u0637\u0644\u0628 \u0633\u064A\u0627\u0631\u0629 \u062C\u062F\u064A\u062F (${requestCode})`,
        input.brand ? `\u0627\u0644\u0645\u0627\u0631\u0643\u0629: ${input.brand}` : null,
        input.bodyType ? `\u0627\u0644\u0646\u0648\u0639: ${input.bodyType}` : null,
        input.models.length ? `\u0627\u0644\u0645\u0648\u062F\u064A\u0644\u0627\u062A \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629: ${input.models.join("\u060C ")}` : null,
        input.trim ? `\u0627\u0644\u0641\u0626\u0629/\u0627\u0644\u062A\u062C\u0647\u064A\u0632: ${input.trim}` : null,
        input.condition ? `\u0627\u0644\u062D\u0627\u0644\u0629: ${input.condition === "new" ? "\u062C\u062F\u064A\u062F" : "\u0645\u0633\u062A\u0639\u0645\u0644"}` : null,
        input.city ? `\u0627\u0644\u0645\u062F\u064A\u0646\u0629: ${input.city}` : null,
        input.minYear ? `\u0623\u0642\u0644 \u0633\u0646\u0629 \u0645\u0642\u0628\u0648\u0644\u0629: ${input.minYear}` : null,
        price,
        "",
        `\u0631\u0633\u0627\u0644\u0629 \u0627\u0644\u0639\u0645\u064A\u0644: ${input.message}`,
        "",
        `\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062A\u0648\u0627\u0635\u0644: ${currentUser.name} \u2014 \u0648\u0627\u062A\u0633\u0627\u0628 ${currentUser.whatsapp}${currentUser.email ? ` \u2014 ${currentUser.email}` : ""}`
      ].filter(Boolean).join("\n");
      await createVehicleRequest({
        requestCode,
        userId: currentUser.id,
        name: currentUser.name,
        whatsapp: currentUser.whatsapp,
        email: currentUser.email ?? null,
        brand: input.brand ?? null,
        bodyType: input.bodyType ?? null,
        models: JSON.stringify(input.models),
        trim: input.trim ?? null,
        condition: input.condition ?? null,
        minPrice: input.minPrice ?? null,
        maxPrice: input.maxPrice ?? null,
        targetPrice: input.targetPrice ?? null,
        minYear: input.minYear ?? null,
        message: input.message,
        matchedDealers: approvedDealers.length,
        status: "distributed"
      });
      for (const dealer of approvedDealers) {
        await createInquiry({
          dealerId: dealer.id,
          vehicleId: null,
          userId: currentUser.id,
          name: currentUser.name,
          phone: currentUser.whatsapp,
          message: details
        });
        await recordDealerStat(dealer.id, "inquiries").catch(() => {
        });
        const ownerUserId = await getDealerOwnerUserId(dealer.id).catch(() => null);
        if (ownerUserId) {
          await createNotification({
            userId: ownerUserId,
            dealerId: dealer.id,
            type: "inquiry",
            title: `\u0637\u0644\u0628 \u0633\u064A\u0627\u0631\u0629 \u062C\u062F\u064A\u062F: ${input.brand ?? input.bodyType ?? "\u0633\u064A\u0627\u0631\u0629 \u0645\u0637\u0644\u0648\u0628\u0629"}`,
            body: `${requestCode} \u2014 ${currentUser.name}: ${input.message}`
          }).catch(() => {
          });
        }
      }
      await notifyOwner({
        title: `\u0637\u0644\u0628 \u0633\u064A\u0627\u0631\u0629 \u062C\u0645\u0627\u0639\u064A \u062C\u062F\u064A\u062F \u0645\u0646 ${currentUser.name}`,
        content: `${requestCode}
\u062A\u0645 \u062A\u0648\u0632\u064A\u0639 \u0627\u0644\u0637\u0644\u0628 \u0639\u0644\u0649 ${approvedDealers.length} \u0645\u0639\u0631\u0636\u064B\u0627 \u0645\u0639\u062A\u0645\u062F\u064B\u0627.
${details}`
      }).catch(() => {
      });
      return { success: true, requestCode, matchedDealers: approvedDealers.length };
    })
  }),
  customer: router({
    requests: protectedProcedure.query(async ({ ctx }) => {
      const user = await getUserByOpenId(ctx.user.openId);
      if (!user) return [];
      return getVehicleRequestsByUser(user.id);
    })
  }),
  dashboard: router({
    myDealer: protectedProcedure.query(async ({ ctx }) => {
      const dealer = await getDealerByUserId(ctx.user.id);
      return dealer ?? null;
    }),
    analytics: protectedProcedure.input(z2.object({ days: z2.number().min(7).max(90).default(30) })).query(async ({ input, ctx }) => {
      const dealer = await getDealerByUserId(ctx.user.id);
      if (!dealer) return { daily: [], totals: { views: 0, inquiries: 0, vehicleViews: 0 } };
      return getDealerAnalytics(dealer.id, input.days);
    }),
    stats: protectedProcedure.input(z2.object({ dealerId: z2.number() })).query(async ({ input, ctx }) => {
      await requireDealerAccess(ctx.user, input.dealerId);
      return getDealerDashboard(input.dealerId);
    }),
    myVehicles: protectedProcedure.input(z2.object({ dealerId: z2.number() })).query(async ({ input, ctx }) => {
      await requireDealerAccess(ctx.user, input.dealerId);
      return getVehicles({ dealerId: input.dealerId, limit: 100, offset: 0 });
    }),
    myInquiries: protectedProcedure.input(z2.object({ dealerId: z2.number() })).query(async ({ input, ctx }) => {
      await requireDealerAccess(ctx.user, input.dealerId);
      return getInquiriesByDealer(input.dealerId);
    }),
    updateDealer: protectedProcedure.input(z2.object({
      dealerId: z2.number(),
      name: z2.string().optional(),
      bio: z2.string().optional(),
      phone: z2.string().optional(),
      whatsapp: z2.string().optional(),
      email: z2.string().email().optional(),
      address: z2.string().optional(),
      workingHours: z2.string().optional(),
      workingHoursDetail: z2.string().optional(),
      logo: z2.string().optional(),
      cover: z2.string().optional(),
      lat: z2.number().optional(),
      lng: z2.number().optional(),
      instagram: z2.string().optional(),
      twitter: z2.string().optional(),
      snapchat: z2.string().optional(),
      tiktok: z2.string().optional(),
      website: z2.string().optional(),
      brands: z2.string().optional(),
      city: z2.string().optional(),
      neighborhood: z2.string().optional(),
      dealerType: z2.enum(["sell", "buy", "both"]).optional()
    })).mutation(async ({ input, ctx }) => {
      const { dealerId, ...data } = input;
      await requireDealerAccess(ctx.user, dealerId);
      await updateDealer(dealerId, data);
      return { success: true };
    })
  }),
  admin: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      return getAdminStatsExtended();
    }),
    dealers: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      return getAllDealersAdmin();
    }),
    verifyDealer: protectedProcedure.input(z2.object({ id: z2.number(), isVerified: z2.boolean() })).mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      await verifyDealer(input.id, input.isVerified);
      return { success: true };
    }),
    updateDealerStatus: protectedProcedure.input(z2.object({
      id: z2.number(),
      status: z2.enum(["pending", "active", "suspended", "rejected"]),
      rejectionReason: z2.string().optional()
    })).mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      await updateDealerStatus(input.id, input.status, input.rejectionReason ?? null);
      return { success: true };
    }),
    grantDemoDealerAccount: protectedProcedure.input(z2.object({
      dealerId: z2.number().int().positive(),
      email: z2.string().trim().email().max(320),
      password: z2.string().min(ENV.isProduction ? 12 : 8).max(100)
    })).mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      const dealer = await getDealerById(input.dealerId);
      if (!dealer) throw new Error("\u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0637\u0644\u0628 \u0627\u0644\u0645\u0639\u0631\u0636");
      const email = input.email.toLowerCase();
      const existingByEmail = await getUserByEmail(email);
      if (dealer.userId && dealer.userId !== existingByEmail?.id) {
        throw new Error("\u0647\u0630\u0627 \u0627\u0644\u0645\u0639\u0631\u0636 \u0645\u0631\u062A\u0628\u0637 \u0628\u062D\u0633\u0627\u0628 \u0622\u062E\u0631 \u0628\u0627\u0644\u0641\u0639\u0644");
      }
      if (!dealer.userId && existingByEmail) {
        throw new Error("\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0645\u0633\u062A\u062E\u062F\u0645 \u0641\u064A \u062D\u0633\u0627\u0628 \u0622\u062E\u0631\u061B \u0627\u062E\u062A\u0631 \u0628\u0631\u064A\u062F\u064B\u0627 \u0645\u062E\u062A\u0644\u0641\u064B\u0627 \u0644\u0644\u0645\u0639\u0631\u0636");
      }
      let owner = existingByEmail;
      if (!owner) {
        const passwordHash = await bcryptHash3(input.password, ENV.passwordHashRounds);
        const openId = `dealer_demo_${dealer.id}_${Date.now().toString(36)}`;
        await upsertUser({
          openId,
          name: dealer.name,
          email,
          whatsapp: dealer.whatsapp ?? dealer.phone ?? null,
          loginMethod: "email",
          passwordHash,
          role: "user",
          lastSignedIn: /* @__PURE__ */ new Date()
        });
        owner = await getUserByOpenId(openId);
      }
      if (!owner) throw new Error("\u062A\u0639\u0630\u0631 \u0625\u0646\u0634\u0627\u0621 \u062D\u0633\u0627\u0628 \u0627\u0644\u0645\u0639\u0631\u0636 \u0627\u0644\u062A\u062C\u0631\u064A\u0628\u064A");
      await updateDealer(dealer.id, { userId: owner.id, email, status: "active", isVerified: true, rejectionReason: null });
      await createNotification({
        userId: owner.id,
        dealerId: dealer.id,
        type: "approval",
        title: "\u062A\u0645 \u062A\u0641\u0639\u064A\u0644 \u062D\u0633\u0627\u0628 \u0627\u0644\u0645\u0639\u0631\u0636 \u0627\u0644\u062A\u062C\u0631\u064A\u0628\u064A",
        body: `\u062A\u0645 \u062A\u0641\u0639\u064A\u0644 \u062D\u0633\u0627\u0628 ${dealer.name}. \u064A\u0645\u0643\u0646\u0643 \u0627\u0644\u0622\u0646 \u0627\u0644\u062F\u062E\u0648\u0644 \u0625\u0644\u0649 \u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645 \u0648\u0625\u062F\u0627\u0631\u0629 \u0633\u064A\u0627\u0631\u0627\u062A\u0643 \u0627\u0644\u062A\u062C\u0631\u064A\u0628\u064A\u0629.`
      }).catch(() => {
      });
      return { success: true, dealerId: dealer.id, email, existingAccount: Boolean(existingByEmail) };
    }),
    updatePlan: protectedProcedure.input(z2.object({ id: z2.number(), plan: z2.enum(["free", "basic", "pro", "premium"]) })).mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      await updateDealerPlan(input.id, input.plan);
      return { success: true };
    }),
    deleteDealer: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      await deleteDealer(input.id);
      return { success: true };
    }),
    allUsers: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      return getAllUsers(200);
    }),
    updateUserRole: protectedProcedure.input(z2.object({ id: z2.number(), role: z2.enum(["user", "admin"]) })).mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      await updateUserRole(input.id, input.role);
      return { success: true };
    }),
    allVehicles: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      return getVehicles({ limit: 200, offset: 0 });
    }),
    allInquiries: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      return getAllInquiriesAdmin();
    }),
    contactMessages: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      return getAllContactMessagesAdmin();
    }),
    updateContactStatus: protectedProcedure.input(z2.object({ id: z2.number(), status: z2.enum(["new", "read", "replied"]) })).mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      await updateContactMessageStatus(input.id, input.status);
      return { success: true };
    }),
    vehicleRequests: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      return getAllVehicleRequestsAdmin();
    }),
    allReviews: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      return getAllReviewsAdmin();
    }),
    deleteReview: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      await deleteReview(input.id);
      return { success: true };
    })
  }),
  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getNotificationsByUser(ctx.user.id, 30);
    }),
    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      const count = await getUnreadNotificationCount(ctx.user.id);
      return { count };
    }),
    markRead: protectedProcedure.input(z2.object({ ids: z2.array(z2.number()).optional() })).mutation(async ({ input, ctx }) => {
      await markNotificationsRead(ctx.user.id, input.ids);
      return { success: true };
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/upload.ts
import { Router } from "express";
import multer from "multer";

// server/_core/media.ts
var IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
var VIDEO_MIME_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
function isImageMimeType(contentType) {
  return IMAGE_MIME_TYPES.includes(contentType);
}
function isVideoMimeType(contentType) {
  return VIDEO_MIME_TYPES.includes(contentType);
}
function validateMediaUpload(input) {
  const contentType = input.contentType.toLowerCase().trim();
  const video = isVideoMimeType(contentType);
  const image = isImageMimeType(contentType);
  const expectsVideo = input.fileType === "video";
  if (!expectsVideo && !image || expectsVideo && !video) {
    throw new Error("\u0646\u0648\u0639 \u0627\u0644\u0645\u0644\u0641 \u0644\u0627 \u064A\u062A\u0648\u0627\u0641\u0642 \u0645\u0639 \u0646\u0648\u0639 \u0627\u0644\u0648\u0633\u064A\u0637 \u0627\u0644\u0645\u0637\u0644\u0648\u0628");
  }
  const maxSize = video ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
  if (!Number.isFinite(input.size) || input.size <= 0 || input.size > maxSize) {
    throw new Error(`\u062D\u062C\u0645 \u0627\u0644\u0645\u0644\u0641 \u064A\u062A\u062C\u0627\u0648\u0632 \u0627\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 ${video ? 50 : 10} \u0645\u064A\u062C\u0627\u0628\u0627\u064A\u062A`);
  }
  return { maxSize };
}
function extensionForMimeType(contentType) {
  const extensions = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov"
  };
  return extensions[contentType.toLowerCase()] ?? "bin";
}

// server/upload.ts
var uploadRouter = Router();
var multipartUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: ENV.maxProxyUploadBytes, files: 1 }
});
function parsePositiveId(value, field) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) throw new Error(`${field} is required`);
  return parsed;
}
function parseFileType(value) {
  if (value === "image" || value === "video" || value === "logo" || value === "cover") return value;
  throw new Error("Unsupported media type");
}
function mediaPrefix(fileType) {
  if (fileType === "video") return "videos";
  if (fileType === "logo") return "logos";
  if (fileType === "cover") return "covers";
  return "images";
}
function mediaPath(dealerId, fileType, contentType) {
  return `dealers/${dealerId}/${mediaPrefix(fileType)}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extensionForMimeType(contentType)}`;
}
async function requireDealerUploadAccess(req, dealerId, vehicleId) {
  const user = await sdk.authenticateRequest(req);
  const dealer = await getDealerById(dealerId);
  if (!dealer) throw new Error("Dealer not found");
  if (user.role !== "admin") {
    const ownerDealer = await getDealerByUserId(user.id);
    if (!ownerDealer || ownerDealer.id !== dealerId) throw new Error("Forbidden");
  }
  if (vehicleId) {
    const vehicle = await getVehicleById(vehicleId);
    if (!vehicle || vehicle.dealerId !== dealerId) throw new Error("Vehicle does not belong to this dealer");
  }
  return { user, dealer };
}
uploadRouter.post("/presign", async (req, res) => {
  try {
    if (!storageUsesObjectStorage()) {
      res.status(409).json({ error: "Direct object storage is unavailable in local mode." });
      return;
    }
    const body = req.body;
    const dealerId = parsePositiveId(body.dealerId, "dealerId");
    const vehicleId = body.vehicleId ? parsePositiveId(body.vehicleId, "vehicleId") : void 0;
    const fileType = parseFileType(body.fileType);
    const contentType = typeof body.contentType === "string" ? body.contentType : "";
    const size = Number(body.size);
    validateMediaUpload({ contentType, fileType, size });
    await requireDealerUploadAccess(req, dealerId, vehicleId);
    const signed = await storageCreateUploadUrl(mediaPath(dealerId, fileType, contentType), contentType);
    res.json({ success: true, mode: "direct", fileType, ...signed });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload authorization failed";
    const status = ["Forbidden", "Dealer not found", "Vehicle does not belong to this dealer"].includes(message) ? 403 : 400;
    res.status(status).json({ error: message });
  }
});
uploadRouter.post("/complete", async (req, res) => {
  try {
    if (!storageUsesObjectStorage()) {
      res.status(409).json({ error: "Direct object storage is unavailable in local mode." });
      return;
    }
    const body = req.body;
    const dealerId = parsePositiveId(body.dealerId, "dealerId");
    const vehicleId = body.vehicleId ? parsePositiveId(body.vehicleId, "vehicleId") : void 0;
    const fileType = parseFileType(body.fileType);
    const contentType = typeof body.contentType === "string" ? body.contentType : "";
    const size = Number(body.size);
    const key = typeof body.key === "string" ? body.key : "";
    const originalName = typeof body.originalName === "string" ? body.originalName.slice(0, 255) : "upload";
    validateMediaUpload({ contentType, fileType, size });
    await requireDealerUploadAccess(req, dealerId, vehicleId);
    const expectedPrefix = `${ENV.s3Prefix ? `${ENV.s3Prefix}/` : ""}dealers/${dealerId}/${mediaPrefix(fileType)}/`;
    if (!key.startsWith(expectedPrefix)) throw new Error("Invalid object key");
    const object = await storageInspectObject(key);
    validateMediaUpload({ contentType: object.contentType, fileType, size: object.size });
    if (object.size !== size || object.contentType.toLowerCase() !== contentType.toLowerCase()) {
      throw new Error("Uploaded object metadata does not match the authorized upload");
    }
    const stored = await storageGet(key);
    await createMediaUpload({
      dealerId,
      vehicleId: vehicleId ?? null,
      fileKey: key,
      fileUrl: stored.url,
      fileType,
      mimeType: object.contentType,
      originalName,
      sizeBytes: object.size
    });
    res.json({ success: true, key, url: stored.url, fileType });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload completion failed";
    const status = ["Forbidden", "Dealer not found", "Vehicle does not belong to this dealer"].includes(message) ? 403 : 400;
    res.status(status).json({ error: message });
  }
});
uploadRouter.post("/", multipartUpload.single("file"), async (req, res) => {
  try {
    if (storageUsesObjectStorage()) {
      res.status(409).json({ error: "Use the signed direct upload flow in production." });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: "No file found in request" });
      return;
    }
    const dealerId = parsePositiveId(req.body.dealerId, "dealerId");
    const vehicleId = req.body.vehicleId ? parsePositiveId(req.body.vehicleId, "vehicleId") : void 0;
    const fileType = parseFileType(req.body.fileType ?? "image");
    const contentType = req.file.mimetype;
    validateMediaUpload({ contentType, fileType, size: req.file.size });
    await requireDealerUploadAccess(req, dealerId, vehicleId);
    const stored = await storagePut(mediaPath(dealerId, fileType, contentType), req.file.buffer, contentType);
    await createMediaUpload({
      dealerId,
      vehicleId: vehicleId ?? null,
      fileKey: stored.key,
      fileUrl: stored.url,
      fileType,
      mimeType: contentType,
      originalName: req.file.originalname.slice(0, 255),
      sizeBytes: req.file.size
    });
    res.json({ success: true, ...stored, fileType });
  } catch (error) {
    const message = error instanceof Error ? error.message : "\u0641\u0634\u0644 \u0631\u0641\u0639 \u0627\u0644\u0645\u0644\u0641. \u064A\u0631\u062C\u0649 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649.";
    const status = ["Forbidden", "Dealer not found", "Vehicle does not belong to this dealer"].includes(message) ? 403 : 400;
    res.status(status).json({ error: message });
  }
});

// server/_core/security.ts
function getClientKey(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || "unknown";
}
function createRateLimiter(options) {
  const attempts = /* @__PURE__ */ new Map();
  return (req, res, next) => {
    const now = Date.now();
    const key = getClientKey(req);
    const current = attempts.get(key);
    if (!current || current.resetAt <= now) {
      attempts.set(key, { count: 1, resetAt: now + options.windowMs });
      next();
      return;
    }
    current.count += 1;
    if (current.count > options.max) {
      res.setHeader("Retry-After", Math.ceil((current.resetAt - now) / 1e3));
      res.status(429).json({ error: options.message });
      return;
    }
    next();
  };
}
function applySecurityHeaders(_req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  next();
}

// server/app.ts
function createApp() {
  assertProductionEnvironment();
  const app2 = express();
  app2.set("trust proxy", 1);
  app2.disable("x-powered-by");
  app2.use(applySecurityHeaders);
  app2.use(express.json({ limit: "1mb" }));
  app2.use(express.urlencoded({ limit: "1mb", extended: true }));
  app2.use("/api/auth", createRateLimiter({ windowMs: 15 * 60 * 1e3, max: 20, message: "Too many authentication attempts. Please try again later." }));
  app2.use("/api/trpc", createRateLimiter({ windowMs: 60 * 1e3, max: 180, message: "Too many requests. Please slow down." }));
  registerStorageProxy(app2);
  registerOAuthRoutes(app2);
  app2.use("/api/upload", uploadRouter);
  app2.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  app2.use((err, _req, res, _next) => {
    const error = err;
    if (error.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({ error: "File exceeds the permitted upload size." });
      return;
    }
    console.error("[API] Request failed", error.message ?? "Unknown error");
    if (!res.headersSent) res.status(500).json({ error: "An unexpected server error occurred." });
  });
  return app2;
}

// server/vercel-handler.ts
var app = createApp();
function getPathValue(value) {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
    return value.join("/");
  }
  return "";
}
function restoreExpressUrl(req) {
  const url = new URL(req.url ?? "/", "http://localhost");
  const rewrittenPath = getPathValue(req.query?.__vercel_path) || url.searchParams.get("__vercel_path") || "";
  const route = getPathValue(req.query?.__vercel_route) || url.searchParams.get("__vercel_route") || "api";
  if (!rewrittenPath) return req.url ?? "/";
  url.searchParams.delete("__vercel_path");
  url.searchParams.delete("__vercel_route");
  const path4 = rewrittenPath.replace(/^\/+/, "");
  const search = url.searchParams.toString();
  const prefix = route === "uploads" ? "/uploads" : "/api";
  return `${prefix}/${path4}${search ? `?${search}` : ""}`;
}
function vercelHandler(req, res) {
  const request = req;
  request.url = restoreExpressUrl(request);
  return app(request, res);
}
export {
  vercelHandler as default
};
