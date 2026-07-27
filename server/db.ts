import { and, desc, eq, gte, like, lte, ne, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  contactMessages,
  dealers,
  dealerStats,
  inquiries,
  mediaUploads,
  notifications,
  reviews,
  users,
  vehicles,
  vehicleRequests,
  type InsertContactMessage,
  type InsertDealer,
  type InsertInquiry,
  type InsertMediaUpload,
  type InsertReview,
  type InsertUser,
  type InsertVehicle,
  type InsertVehicleRequest,
} from "../drizzle/schema";
import * as local from "./localStore";

type DealerListOptions = {
  city?: string;
  brand?: string;
  q?: string;
  verified?: boolean;
  dealerType?: string;
  limit?: number;
  offset?: number;
};

type VehicleListOptions = {
  dealerId?: number;
  condition?: "new" | "used";
  brand?: string;
  model?: string;
  models?: string[];
  bodyType?: string;
  trim?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  fuelType?: string;
  transmission?: string;
  status?: string;
  q?: string;
  limit?: number;
  offset?: number;
};

type Database = ReturnType<typeof drizzle>;
type DealerAnalytics = {
  daily: Array<{ date: string; views: number; inquiries: number; vehicleViews: number }>;
  totals: { views: number; inquiries: number; vehicleViews: number };
};

let database: Database | null = null;

/**
 * Returns the optional MySQL connection only when DATA_MODE=mysql is selected.
 * The default local mode intentionally returns null and is served by localStore.
 */
export async function getDb(): Promise<Database | null> {
  if (local.isLocalDataMode()) return null;
  if (!database && process.env.DATABASE_URL) {
    try {
      database = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to initialize MySQL:", error);
      database = null;
    }
  }
  return database;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  if (local.isLocalDataMode()) {
    await local.localUpsertUser(user);
    return;
  }

  const db = await getDb();
  if (!db) throw new Error("Database not available. Set DATA_MODE=local or configure DATABASE_URL for MySQL.");
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "whatsapp", "loginMethod", "passwordHash"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string): Promise<any | undefined> {
  if (local.isLocalDataMode()) return local.localGetUserByOpenId(openId);
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return rows[0];
}

export async function getUserByEmail(email: string): Promise<any | undefined> {
  if (local.isLocalDataMode()) return local.localGetUserByEmail(email);
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return rows[0];
}

export async function getUserByWhatsapp(whatsapp: string): Promise<any | undefined> {
  if (local.isLocalDataMode()) return local.localListUsers(500).then(usersList => usersList.find(user => user.whatsapp === whatsapp));
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(users).where(eq(users.whatsapp, whatsapp)).limit(1);
  return rows[0];
}

export async function updateUserName(id: number, name: string): Promise<void> {
  if (local.isLocalDataMode()) return local.localUpdateUserName(id, name);
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ name }).where(eq(users.id, id));
}

export async function updateUserProfile(id: number, data: { name?: string; whatsapp?: string; email?: string | null }): Promise<any> {
  if (local.isLocalDataMode()) return local.localUpdateUserProfile(id, data);
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set(data).where(eq(users.id, id));
  return getUserByOpenId((await db.select({ openId: users.openId }).from(users).where(eq(users.id, id)).limit(1))[0]?.openId ?? "");
}

export async function getAllUsers(limit = 200): Promise<any[]> {
  if (local.isLocalDataMode()) return local.localListUsers(limit);
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt)).limit(limit);
}

export async function updateUserRole(id: number, role: "user" | "admin"): Promise<void> {
  if (local.isLocalDataMode()) return local.localUpdateUserRole(id, role);
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ role }).where(eq(users.id, id));
}

export async function getDealers(options: DealerListOptions = {}): Promise<any[]> {
  if (local.isLocalDataMode()) return local.localGetDealers(options);
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (options.city) conditions.push(eq(dealers.city, options.city));
  if (options.brand) conditions.push(like(dealers.brands, `%${options.brand}%`));
  if (options.q) conditions.push(like(dealers.name, `%${options.q}%`));
  if (options.verified) {
    conditions.push(eq(dealers.isVerified, true));
    conditions.push(eq(dealers.status, 'active'));
  }
  if (options.dealerType && options.dealerType !== "all") {
    conditions.push(or(eq(dealers.dealerType, options.dealerType as any), eq(dealers.dealerType, "both"))!);
  }
  return db.select().from(dealers)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(dealers.plan), desc(dealers.views))
    .limit(options.limit ?? 50)
    .offset(options.offset ?? 0);
}

export async function getDealerBySlug(slug: string): Promise<any | undefined> {
  if (local.isLocalDataMode()) return local.localGetDealerBySlug(slug);
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(dealers).where(eq(dealers.slug, slug)).limit(1);
  return rows[0];
}

export async function getDealerById(id: number): Promise<any | undefined> {
  if (local.isLocalDataMode()) return local.localGetDealerById(id);
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(dealers).where(eq(dealers.id, id)).limit(1);
  return rows[0];
}

export async function createDealer(data: InsertDealer): Promise<any> {
  if (local.isLocalDataMode()) return local.localCreateDealer(data);
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(dealers).values(data);
}

export async function updateDealer(id: number, data: Partial<InsertDealer>): Promise<void> {
  if (local.isLocalDataMode()) return local.localUpdateDealer(id, data);
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(dealers).set(data).where(eq(dealers.id, id));
}

export async function updateDealerViews(id: number): Promise<void> {
  if (local.isLocalDataMode()) return local.localUpdateDealerViews(id);
  const db = await getDb();
  if (!db) return;
  await db.update(dealers).set({ views: sql`${dealers.views} + 1` }).where(eq(dealers.id, id));
}

export async function updateDealerStatus(id: number, status: "pending" | "active" | "suspended" | "rejected", rejectionReason: string | null): Promise<void> {
  if (local.isLocalDataMode()) return local.localUpdateDealerStatus(id, status, rejectionReason);
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(dealers).set({ status, rejectionReason, isVerified: status === "active" }).where(eq(dealers.id, id));
}

export async function deleteDealer(id: number): Promise<void> {
  if (local.isLocalDataMode()) return local.localDeleteDealer(id);
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(dealers).where(eq(dealers.id, id));
}

export async function getDealerOwnerUserId(id: number): Promise<number | null> {
  if (local.isLocalDataMode()) return local.localGetDealerOwnerUserId(id);
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select({ userId: dealers.userId }).from(dealers).where(eq(dealers.id, id)).limit(1);
  return rows[0]?.userId ?? null;
}

export async function getDealerByUserId(userId: number): Promise<any | undefined> {
  if (local.isLocalDataMode()) return local.localGetDealerByUserId(userId);
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(dealers).where(eq(dealers.userId, userId)).limit(1);
  return rows[0];
}

export async function getAllDealersAdmin(): Promise<any[]> {
  if (local.isLocalDataMode()) return local.localGetAllDealersAdmin();
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: dealers.id,
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
    rejectionReason: dealers.rejectionReason,
  }).from(dealers).leftJoin(users, eq(dealers.userId, users.id)).orderBy(desc(dealers.createdAt));
}

export async function verifyDealer(id: number, isVerified: boolean): Promise<void> {
  if (local.isLocalDataMode()) return local.localVerifyDealer(id, isVerified);
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(dealers).set({ isVerified }).where(eq(dealers.id, id));
}

export async function updateDealerPlan(id: number, plan: "free" | "basic" | "pro" | "premium"): Promise<void> {
  if (local.isLocalDataMode()) return local.localUpdateDealerPlan(id, plan);
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(dealers).set({ plan }).where(eq(dealers.id, id));
}

export async function getAdminStats() {
  if (local.isLocalDataMode()) return local.localGetAdminStats();
  const db = await getDb();
  if (!db) return { totalDealers: 0, verifiedDealers: 0, totalVehicles: 0, totalInquiries: 0, totalUsers: 0 };
  const [dealerCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(dealers);
  const [verifiedCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(dealers).where(eq(dealers.isVerified, true));
  const [vehicleCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(vehicles);
  const [inquiryCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(inquiries);
  const [userCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(users);
  return {
    totalDealers: Number(dealerCount?.count ?? 0),
    verifiedDealers: Number(verifiedCount?.count ?? 0),
    totalVehicles: Number(vehicleCount?.count ?? 0),
    totalInquiries: Number(inquiryCount?.count ?? 0),
    totalUsers: Number(userCount?.count ?? 0),
  };
}

export async function getAdminStatsExtended() {
  if (local.isLocalDataMode()) return local.localGetAdminStatsExtended();
  const db = await getDb();
  const base = { totalDealers: 0, verifiedDealers: 0, totalVehicles: 0, totalInquiries: 0, totalUsers: 0, pendingDealers: 0, paidDealers: 0, freeDealers: 0, proDealers: 0, premiumDealers: 0, totalReviews: 0, totalViews: 0 };
  if (!db) return base;
  const [dealerCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(dealers);
  const [verifiedCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(dealers).where(eq(dealers.isVerified, true));
  const [pendingCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(dealers).where(eq(dealers.isVerified, false));
  const [vehicleCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(vehicles);
  const [inquiryCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(inquiries);
  const [userCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(users);
  const [freeCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(dealers).where(eq(dealers.plan, "free"));
  const [proCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(dealers).where(eq(dealers.plan, "pro"));
  const [premiumCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(dealers).where(eq(dealers.plan, "premium"));
  const [reviewCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(reviews);
  const [viewsSum] = await db.select({ total: sql<number>`COALESCE(SUM(views), 0)` }).from(dealers);
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
    totalViews: Number(viewsSum?.total ?? 0),
  };
}

export async function getVehicles(options: VehicleListOptions = {}): Promise<any[]> {
  if (local.isLocalDataMode()) return local.localGetVehicles(options);
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (options.dealerId) conditions.push(eq(vehicles.dealerId, options.dealerId));
  if (options.condition) conditions.push(eq(vehicles.condition, options.condition));
  if (options.brand) conditions.push(eq(vehicles.brand, options.brand));
  if (options.models?.length) conditions.push(or(...options.models.map(model => like(vehicles.model, `%${model}%`)))!);
  else if (options.model) conditions.push(like(vehicles.model, `%${options.model}%`));
  if (options.bodyType) conditions.push(eq(vehicles.bodyType, options.bodyType));
  if (options.trim) conditions.push(like(vehicles.trim, `%${options.trim}%`));
  if (options.city) conditions.push(eq(vehicles.city, options.city));
  if (options.minPrice !== undefined) conditions.push(gte(vehicles.price, options.minPrice));
  if (options.maxPrice !== undefined) conditions.push(lte(vehicles.price, options.maxPrice));
  if (options.minYear !== undefined) conditions.push(gte(vehicles.year, options.minYear));
  if (options.maxYear !== undefined) conditions.push(lte(vehicles.year, options.maxYear));
  if (options.fuelType) conditions.push(eq(vehicles.fuelType, options.fuelType as any));
  if (options.transmission) conditions.push(eq(vehicles.transmission, options.transmission as any));
  if (options.status) conditions.push(eq(vehicles.status, options.status as any));
  if (options.q) conditions.push(or(
    like(vehicles.brand, `%${options.q}%`),
    like(vehicles.model, `%${options.q}%`),
    like(vehicles.bodyType, `%${options.q}%`),
    like(vehicles.trim, `%${options.q}%`),
  )!);
  if (!options.status) conditions.push(ne(vehicles.status, "sold"));
  return db.select().from(vehicles)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(vehicles.createdAt))
    .limit(options.limit ?? 50)
    .offset(options.offset ?? 0);
}

export async function getVehiclesWithDealer(options: VehicleListOptions = {}): Promise<any[]> {
  if (local.isLocalDataMode()) return local.localGetVehiclesWithDealer(options);
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (options.dealerId) conditions.push(eq(vehicles.dealerId, options.dealerId));
  if (options.condition) conditions.push(eq(vehicles.condition, options.condition));
  if (options.brand) conditions.push(eq(vehicles.brand, options.brand));
  if (options.models?.length) conditions.push(or(...options.models.map(model => like(vehicles.model, `%${model}%`)))!);
  else if (options.model) conditions.push(like(vehicles.model, `%${options.model}%`));
  if (options.bodyType) conditions.push(eq(vehicles.bodyType, options.bodyType));
  if (options.trim) conditions.push(like(vehicles.trim, `%${options.trim}%`));
  if (options.city) conditions.push(or(eq(vehicles.city, options.city), eq(dealers.city, options.city))!);
  if (options.minPrice !== undefined) conditions.push(gte(vehicles.price, options.minPrice));
  if (options.maxPrice !== undefined) conditions.push(lte(vehicles.price, options.maxPrice));
  if (options.minYear !== undefined) conditions.push(gte(vehicles.year, options.minYear));
  if (options.maxYear !== undefined) conditions.push(lte(vehicles.year, options.maxYear));
  if (options.fuelType) conditions.push(eq(vehicles.fuelType, options.fuelType as any));
  if (options.transmission) conditions.push(eq(vehicles.transmission, options.transmission as any));
  if (options.q) conditions.push(or(
    like(vehicles.brand, `%${options.q}%`),
    like(vehicles.model, `%${options.q}%`),
    like(vehicles.bodyType, `%${options.q}%`),
    like(vehicles.trim, `%${options.q}%`),
  )!);
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
    dealerVerified: dealers.isVerified,
  }).from(vehicles).leftJoin(dealers, eq(vehicles.dealerId, dealers.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(vehicles.createdAt))
    .limit(options.limit ?? 50)
    .offset(options.offset ?? 0);
}

export async function getVehicleById(id: number): Promise<any | undefined> {
  if (local.isLocalDataMode()) return local.localGetVehicleById(id);
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1);
  return rows[0];
}

export async function getVehicleWithDealer(id: number): Promise<any | undefined> {
  if (local.isLocalDataMode()) return local.localGetVehicleWithDealer(id);
  const db = await getDb();
  if (!db) return undefined;
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
    dealerLng: dealers.lng,
  }).from(vehicles).leftJoin(dealers, eq(vehicles.dealerId, dealers.id)).where(eq(vehicles.id, id)).limit(1);
  return rows[0];
}

export async function createVehicle(data: InsertVehicle): Promise<any> {
  if (local.isLocalDataMode()) return local.localCreateVehicle(data);
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(vehicles).values(data);
}

export async function updateVehicle(id: number, data: Partial<InsertVehicle>): Promise<void> {
  if (local.isLocalDataMode()) return local.localUpdateVehicle(id, data);
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(vehicles).set(data).where(eq(vehicles.id, id));
}

export async function deleteVehicle(id: number): Promise<void> {
  if (local.isLocalDataMode()) return local.localDeleteVehicle(id);
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(vehicles).where(eq(vehicles.id, id));
}

export async function updateVehicleViews(id: number): Promise<void> {
  if (local.isLocalDataMode()) return local.localUpdateVehicleViews(id);
  const db = await getDb();
  if (!db) return;
  await db.update(vehicles).set({ views: sql`${vehicles.views} + 1` }).where(eq(vehicles.id, id));
}

export async function getReviewsByDealer(dealerId: number): Promise<any[]> {
  if (local.isLocalDataMode()) return local.localGetReviewsByDealer(dealerId);
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: reviews.id,
    dealerId: reviews.dealerId,
    userId: reviews.userId,
    rating: reviews.rating,
    comment: reviews.comment,
    createdAt: reviews.createdAt,
    userName: users.name,
  }).from(reviews).leftJoin(users, eq(reviews.userId, users.id)).where(eq(reviews.dealerId, dealerId)).orderBy(desc(reviews.createdAt));
}

export async function createReview(data: InsertReview): Promise<any> {
  if (local.isLocalDataMode()) return local.localCreateReview(data);
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(reviews).values(data);
}

export async function getDealerRating(dealerId: number): Promise<{ avg: number; count: number }> {
  if (local.isLocalDataMode()) return local.localGetDealerRating(dealerId);
  const db = await getDb();
  if (!db) return { avg: 0, count: 0 };
  const rows = await db.select({ avg: sql<number>`AVG(${reviews.rating})`, count: sql<number>`COUNT(*)` }).from(reviews).where(eq(reviews.dealerId, dealerId));
  return { avg: Number(rows[0]?.avg ?? 0), count: Number(rows[0]?.count ?? 0) };
}

export async function hasUserReviewed(dealerId: number, userId: number): Promise<boolean> {
  if (local.isLocalDataMode()) return local.localHasUserReviewed(dealerId, userId);
  const db = await getDb();
  if (!db) return false;
  const rows = await db.select({ id: reviews.id }).from(reviews).where(and(eq(reviews.dealerId, dealerId), eq(reviews.userId, userId))).limit(1);
  return rows.length > 0;
}

export async function deleteReview(id: number): Promise<void> {
  if (local.isLocalDataMode()) return local.localDeleteReview(id);
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(reviews).where(eq(reviews.id, id));
}

export async function getAllReviewsAdmin(): Promise<any[]> {
  if (local.isLocalDataMode()) return local.localGetAllReviewsAdmin();
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
    userName: users.name,
  }).from(reviews).leftJoin(dealers, eq(reviews.dealerId, dealers.id)).leftJoin(users, eq(reviews.userId, users.id)).orderBy(desc(reviews.createdAt)).limit(500);
}

export async function createInquiry(data: InsertInquiry): Promise<any> {
  if (local.isLocalDataMode()) return local.localCreateInquiry(data);
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(inquiries).values(data);
}

export async function createVehicleRequest(data: InsertVehicleRequest): Promise<any> {
  if (local.isLocalDataMode()) return local.localCreateVehicleRequest(data);
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(vehicleRequests).values(data);
}

export async function getVehicleRequestsByUser(userId: number): Promise<any[]> {
  if (local.isLocalDataMode()) return local.localGetVehicleRequestsByUser(userId);
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vehicleRequests).where(eq(vehicleRequests.userId, userId)).orderBy(desc(vehicleRequests.createdAt));
}

export async function getAllVehicleRequestsAdmin(): Promise<any[]> {
  if (local.isLocalDataMode()) return local.localGetAllVehicleRequestsAdmin();
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
    senderName: users.name,
  }).from(vehicleRequests).leftJoin(users, eq(vehicleRequests.userId, users.id)).orderBy(desc(vehicleRequests.createdAt)).limit(500);
}

export async function getInquiriesByDealer(dealerId: number): Promise<any[]> {
  if (local.isLocalDataMode()) return local.localGetInquiriesByDealer(dealerId);
  const db = await getDb();
  if (!db) return [];
  return db.select().from(inquiries).where(eq(inquiries.dealerId, dealerId)).orderBy(desc(inquiries.createdAt));
}

export async function updateInquiryStatus(id: number, status: "new" | "read" | "replied"): Promise<void> {
  if (local.isLocalDataMode()) return local.localUpdateInquiryStatus(id, status);
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(inquiries).set({ status }).where(eq(inquiries.id, id));
}

export async function getInquiriesCount(dealerId: number): Promise<number> {
  if (local.isLocalDataMode()) return local.localGetInquiriesCount(dealerId);
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ count: sql<number>`COUNT(*)` }).from(inquiries).where(eq(inquiries.dealerId, dealerId));
  return Number(rows[0]?.count ?? 0);
}

export async function getAllInquiriesAdmin(): Promise<any[]> {
  if (local.isLocalDataMode()) return local.localGetAllInquiriesAdmin();
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
    dealerName: dealers.name,
  }).from(inquiries).leftJoin(dealers, eq(inquiries.dealerId, dealers.id)).orderBy(desc(inquiries.createdAt)).limit(200);
}

export async function createContactMessage(data: InsertContactMessage): Promise<any> {
  if (local.isLocalDataMode()) return local.localCreateContactMessage(data);
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(contactMessages).values(data);
}

export async function getAllContactMessagesAdmin(): Promise<any[]> {
  if (local.isLocalDataMode()) return local.localGetAllContactMessagesAdmin();
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)).limit(500);
}

export async function updateContactMessageStatus(id: number, status: "new" | "read" | "replied"): Promise<void> {
  if (local.isLocalDataMode()) return local.localUpdateContactMessageStatus(id, status);
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(contactMessages).set({ status }).where(eq(contactMessages.id, id));
}

export async function createMediaUpload(data: InsertMediaUpload): Promise<any> {
  if (local.isLocalDataMode()) return local.localCreateMediaUpload(data);
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(mediaUploads).values(data);
}

export async function getMediaByDealer(dealerId: number): Promise<any[]> {
  if (local.isLocalDataMode()) return local.localGetMediaByDealer(dealerId);
  const db = await getDb();
  if (!db) return [];
  return db.select().from(mediaUploads).where(eq(mediaUploads.dealerId, dealerId)).orderBy(desc(mediaUploads.createdAt));
}

export async function getDealerDashboard(dealerId: number): Promise<any> {
  if (local.isLocalDataMode()) return local.localGetDealerDashboard(dealerId);
  const db = await getDb();
  if (!db) return { totalViews: 0, totalInquiries: 0, totalVehicles: 0, avgRating: 0, reviewCount: 0, recentInquiries: [], recentVehicles: [] };
  const [dealer] = await db.select().from(dealers).where(eq(dealers.id, dealerId)).limit(1);
  const [rating] = await db.select({ avg: sql<number>`AVG(${reviews.rating})`, count: sql<number>`COUNT(*)` }).from(reviews).where(eq(reviews.dealerId, dealerId));
  const [inquiryCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(inquiries).where(eq(inquiries.dealerId, dealerId));
  const [vehicleCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(vehicles).where(eq(vehicles.dealerId, dealerId));
  const recentInquiries = await db.select().from(inquiries).where(eq(inquiries.dealerId, dealerId)).orderBy(desc(inquiries.createdAt)).limit(10);
  const recentVehicles = await db.select().from(vehicles).where(eq(vehicles.dealerId, dealerId)).orderBy(desc(vehicles.createdAt)).limit(6);
  return {
    totalViews: dealer?.views ?? 0,
    totalInquiries: Number(inquiryCount?.count ?? 0),
    totalVehicles: Number(vehicleCount?.count ?? 0),
    avgRating: Number(rating?.avg ?? 0),
    reviewCount: Number(rating?.count ?? 0),
    recentInquiries,
    recentVehicles,
  };
}

export async function getVehicleCountByDealer(dealerId: number): Promise<number> {
  if (local.isLocalDataMode()) return local.localGetVehicleCountByDealer(dealerId);
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ count: sql<number>`COUNT(*)` }).from(vehicles).where(eq(vehicles.dealerId, dealerId));
  return Number(rows[0]?.count ?? 0);
}

export async function getDealerAnalytics(dealerId: number, days = 30): Promise<DealerAnalytics> {
  if (local.isLocalDataMode()) return local.localGetDealerAnalytics(dealerId, days);
  const db = await getDb();
  if (!db) return { daily: [], totals: { views: 0, inquiries: 0, vehicleViews: 0 } };
  const start = new Date();
  start.setDate(start.getDate() - days + 1);
  const startString = start.toISOString().slice(0, 10);
  const daily = await db.select().from(dealerStats).where(and(eq(dealerStats.dealerId, dealerId), gte(dealerStats.date, startString))).orderBy(dealerStats.date);
  const totals = daily.reduce((total, row) => ({
    views: total.views + (row.views ?? 0),
    inquiries: total.inquiries + (row.inquiries ?? 0),
    vehicleViews: total.vehicleViews + (row.vehicleViews ?? 0),
  }), { views: 0, inquiries: 0, vehicleViews: 0 });
  return { daily, totals };
}

export async function recordDealerStat(dealerId: number, field: "views" | "inquiries" | "vehicleViews"): Promise<void> {
  if (local.isLocalDataMode()) return local.localRecordDealerStat(dealerId, field);
  const db = await getDb();
  if (!db) return;
  const date = new Date().toISOString().slice(0, 10);
  const [existing] = await db.select().from(dealerStats).where(and(eq(dealerStats.dealerId, dealerId), eq(dealerStats.date, date))).limit(1);
  if (existing) {
    const increment = field === "views" ? { views: sql`${dealerStats.views} + 1` } : field === "inquiries" ? { inquiries: sql`${dealerStats.inquiries} + 1` } : { vehicleViews: sql`${dealerStats.vehicleViews} + 1` };
    await db.update(dealerStats).set(increment).where(and(eq(dealerStats.dealerId, dealerId), eq(dealerStats.date, date)));
  } else {
    await db.insert(dealerStats).values({ dealerId, date, views: field === "views" ? 1 : 0, inquiries: field === "inquiries" ? 1 : 0, vehicleViews: field === "vehicleViews" ? 1 : 0 });
  }
}

export async function createNotification(data: { userId: number; dealerId?: number; type: "inquiry" | "review" | "system" | "approval"; title: string; body?: string }): Promise<void> {
  if (local.isLocalDataMode()) {
    await local.localCreateNotification(data);
    return;
  }
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values(data);
}

export async function getNotificationsByUser(userId: number, limit = 30): Promise<any[]> {
  if (local.isLocalDataMode()) return local.localGetNotificationsByUser(userId, limit);
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(limit);
}

export async function markNotificationsRead(userId: number, ids?: number[]): Promise<void> {
  if (local.isLocalDataMode()) return local.localMarkNotificationsRead(userId, ids);
  const db = await getDb();
  if (!db) return;
  if (ids?.length) {
    await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.userId, userId), sql`${notifications.id} IN (${ids.join(",")})`));
  } else {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
  }
}

export async function getUnreadNotificationCount(userId: number): Promise<number> {
  if (local.isLocalDataMode()) return local.localGetUnreadNotificationCount(userId);
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ count: sql<number>`COUNT(*)` }).from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return Number(rows[0]?.count ?? 0);
}
