import { float, boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
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
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Dealers ──────────────────────────────────────────────────────────────────
export const dealers = mysqlTable("dealers", {
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
  status: mysqlEnum("status", ["pending", "active", "suspended", "rejected"]).default("pending").notNull(),
});

export type Dealer = typeof dealers.$inferSelect;
export type InsertDealer = typeof dealers.$inferInsert;

// ─── Vehicles ─────────────────────────────────────────────────────────────────
export const vehicles = mysqlTable("vehicles", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = typeof vehicles.$inferInsert;

// ─── Reviews ──────────────────────────────────────────────────────────────────
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  dealerId: int("dealerId").notNull(),
  userId: int("userId").notNull(),
  rating: int("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

// ─── Inquiries ────────────────────────────────────────────────────────────────
export const inquiries = mysqlTable("inquiries", {
  id: int("id").autoincrement().primaryKey(),
  dealerId: int("dealerId").notNull(),
  vehicleId: int("vehicleId"),
  userId: int("userId"),
  name: varchar("name", { length: 200 }),
  phone: varchar("phone", { length: 30 }),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["new", "read", "replied"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = typeof inquiries.$inferInsert;

// ─── Contact Messages ─────────────────────────────────────────────────────────
/** Messages sent from the public "Contact Us" form to system administrators. */
export const contactMessages = mysqlTable("contact_messages", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 320 }),
  whatsapp: varchar("whatsapp", { length: 30 }).notNull(),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["new", "read", "replied"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = typeof contactMessages.$inferInsert;

// ─── Vehicle Requests ─────────────────────────────────────────────────────────
/**
 * One customer request, broadcast as one or more dealer inquiries. Keeping this
 * record lets the customer and administrators see the original request once.
 */
export const vehicleRequests = mysqlTable("vehicle_requests", {
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
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VehicleRequest = typeof vehicleRequests.$inferSelect;
export type InsertVehicleRequest = typeof vehicleRequests.$inferInsert;

// ─── Media Uploads ────────────────────────────────────────────────────────────
export const mediaUploads = mysqlTable("media_uploads", {
  id: int("id").autoincrement().primaryKey(),
  dealerId: int("dealerId").notNull(),
  vehicleId: int("vehicleId"),
  fileKey: text("fileKey").notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileType: mysqlEnum("fileType", ["image", "video", "logo", "cover"]).notNull(),
  mimeType: varchar("mimeType", { length: 100 }),
  originalName: varchar("originalName", { length: 255 }),
  sizeBytes: int("sizeBytes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MediaUpload = typeof mediaUploads.$inferSelect;
export type InsertMediaUpload = typeof mediaUploads.$inferInsert;

// ─── Dealer Stats (daily snapshots) ──────────────────────────────────────────
export const dealerStats = mysqlTable("dealer_stats", {
  id: int("id").autoincrement().primaryKey(),
  dealerId: int("dealerId").notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  views: int("views").default(0).notNull(),
  inquiries: int("inquiries").default(0).notNull(),
  vehicleViews: int("vehicleViews").default(0).notNull(),
});

export type DealerStat = typeof dealerStats.$inferSelect;

// ─── In-App Notifications ────────────────────────────────────────────────────
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  dealerId: int("dealerId"),
  type: mysqlEnum("type", ["inquiry", "review", "system", "approval"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body"),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
