import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { hash as bcryptHash } from "bcryptjs";
import type {
  InsertContactMessage,
  InsertDealer,
  InsertInquiry,
  InsertMediaUpload,
  InsertNotification,
  InsertReview,
  InsertUser,
  InsertVehicle,
  InsertVehicleRequest,
} from "../drizzle/schema";

export type LocalPlan = "free" | "basic" | "pro" | "premium";
export type LocalDealerStatus = "pending" | "active" | "suspended" | "rejected";
export type LocalVehicleStatus = "available" | "reserved" | "sold";
export type LocalInquiryStatus = "new" | "read" | "replied";
export type LocalContactMessageStatus = "new" | "read" | "replied";
export type LocalVehicleRequestStatus = "submitted" | "distributed" | "closed";

export type LocalUser = {
  id: number;
  openId: string;
  passwordHash: string | null;
  name: string | null;
  email: string | null;
  whatsapp: string | null;
  loginMethod: string | null;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
};

export type LocalDealer = {
  id: number;
  userId: number | null;
  name: string;
  slug: string;
  logo: string | null;
  cover: string | null;
  bio: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  city: string | null;
  neighborhood: string | null;
  lat: number | null;
  lng: number | null;
  address: string | null;
  workingHours: string | null;
  brands: string | null;
  isVerified: boolean;
  plan: LocalPlan;
  commercialReg: string | null;
  dealerType: "sell" | "buy" | "both";
  views: number;
  vehiclesCount: number;
  createdAt: Date;
  updatedAt: Date;
  instagram: string | null;
  twitter: string | null;
  snapchat: string | null;
  tiktok: string | null;
  website: string | null;
  workingHoursDetail: string | null;
  planStartDate: Date | null;
  planEndDate: Date | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  rejectionReason: string | null;
  status: LocalDealerStatus;
};

export type LocalVehicle = {
  id: number;
  dealerId: number;
  brand: string;
  model: string;
  bodyType: string | null;
  trim: string | null;
  year: number;
  price: number;
  condition: "new" | "used";
  fuelType: "petrol" | "diesel" | "hybrid" | "electric";
  transmission: "automatic" | "manual";
  color: string | null;
  mileage: number;
  description: string | null;
  images: string | null;
  city: string | null;
  videoUrl: string | null;
  videoKey: string | null;
  status: LocalVehicleStatus;
  views: number;
  createdAt: Date;
  updatedAt: Date;
};

export type LocalReview = {
  id: number;
  dealerId: number;
  userId: number;
  rating: number;
  comment: string | null;
  createdAt: Date;
};

export type LocalInquiry = {
  id: number;
  dealerId: number;
  vehicleId: number | null;
  userId: number | null;
  name: string | null;
  phone: string | null;
  message: string;
  status: LocalInquiryStatus;
  createdAt: Date;
};

export type LocalContactMessage = {
  id: number;
  name: string;
  email: string | null;
  whatsapp: string;
  message: string;
  status: LocalContactMessageStatus;
  createdAt: Date;
};

export type LocalVehicleRequest = {
  id: number;
  requestCode: string;
  userId: number;
  name: string;
  whatsapp: string;
  email: string | null;
  brand: string | null;
  bodyType: string | null;
  models: string[];
  trim: string | null;
  condition: "new" | "used" | null;
  minPrice: number | null;
  maxPrice: number | null;
  targetPrice: number | null;
  minYear: number | null;
  message: string;
  matchedDealers: number;
  status: LocalVehicleRequestStatus;
  createdAt: Date;
};

export type LocalMediaUpload = {
  id: number;
  dealerId: number;
  vehicleId: number | null;
  fileKey: string;
  fileUrl: string;
  fileType: "image" | "video" | "logo" | "cover";
  mimeType: string | null;
  originalName: string | null;
  sizeBytes: number | null;
  createdAt: Date;
};

export type LocalDealerStat = {
  id: number;
  dealerId: number;
  date: string;
  views: number;
  inquiries: number;
  vehicleViews: number;
};

export type LocalNotification = {
  id: number;
  userId: number;
  dealerId: number | null;
  type: "inquiry" | "review" | "system" | "approval";
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: Date;
};

type LocalState = {
  version: 1;
  counters: {
    user: number;
    dealer: number;
    vehicle: number;
    review: number;
    inquiry: number;
    contactMessage: number;
    vehicleRequest: number;
    media: number;
    stat: number;
    notification: number;
  };
  users: LocalUser[];
  dealers: LocalDealer[];
  vehicles: LocalVehicle[];
  reviews: LocalReview[];
  inquiries: LocalInquiry[];
  contactMessages: LocalContactMessage[];
  vehicleRequests: LocalVehicleRequest[];
  mediaUploads: LocalMediaUpload[];
  dealerStats: LocalDealerStat[];
  notifications: LocalNotification[];
};

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

let statePromise: Promise<LocalState> | null = null;
let saveQueue: Promise<void> = Promise.resolve();

export function isLocalDataMode(): boolean {
  return (process.env.DATA_MODE ?? "local").trim().toLowerCase() !== "mysql";
}

function localDataPath(): string {
  return path.resolve(process.cwd(), process.env.LOCAL_DATA_FILE ?? "data/autohub.local.json");
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function asDate(value: unknown, fallback: Date): Date {
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return fallback;
}

function hydrateState(raw: LocalState): LocalState {
  const now = new Date();
  const hydrateUser = (user: LocalUser): LocalUser => ({
    ...user,
    whatsapp: user.whatsapp ?? null,
    createdAt: asDate(user.createdAt, now),
    updatedAt: asDate(user.updatedAt, now),
    lastSignedIn: asDate(user.lastSignedIn, now),
  });
  const hydrateDealer = (dealer: LocalDealer): LocalDealer => ({
    ...dealer,
    createdAt: asDate(dealer.createdAt, now),
    updatedAt: asDate(dealer.updatedAt, now),
    planStartDate: dealer.planStartDate ? asDate(dealer.planStartDate, now) : null,
    planEndDate: dealer.planEndDate ? asDate(dealer.planEndDate, now) : null,
  });
  const hydrateVehicle = (vehicle: LocalVehicle): LocalVehicle => ({
    ...vehicle,
    createdAt: asDate(vehicle.createdAt, now),
    updatedAt: asDate(vehicle.updatedAt, now),
  });
  const hydrateReview = (review: LocalReview): LocalReview => ({ ...review, createdAt: asDate(review.createdAt, now) });
  const hydrateInquiry = (inquiry: LocalInquiry): LocalInquiry => ({ ...inquiry, createdAt: asDate(inquiry.createdAt, now) });
  const hydrateContactMessage = (message: LocalContactMessage): LocalContactMessage => ({
    ...message,
    email: message.email ?? null,
    status: message.status ?? "new",
    createdAt: asDate(message.createdAt, now),
  });
  const hydrateVehicleRequest = (request: LocalVehicleRequest): LocalVehicleRequest => ({
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
    createdAt: asDate(request.createdAt, now),
  });
  const hydrateMedia = (media: LocalMediaUpload): LocalMediaUpload => ({ ...media, createdAt: asDate(media.createdAt, now) });
  const hydrateNotification = (notification: LocalNotification): LocalNotification => ({ ...notification, createdAt: asDate(notification.createdAt, now) });

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
    notifications: (raw.notifications ?? []).map(hydrateNotification),
  };
}

function buildCounters(state: Omit<LocalState, "counters">): LocalState["counters"] {
  const highest = (rows: Array<{ id: number }>) => rows.reduce((max, row) => Math.max(max, row.id), 0);
  return {
    user: highest(state.users),
    dealer: highest(state.dealers),
    vehicle: highest(state.vehicles),
    review: highest(state.reviews),
    inquiry: highest(state.inquiries),
    contactMessage: highest(state.contactMessages),
    vehicleRequest: highest(state.vehicleRequests),
    media: highest(state.mediaUploads),
    stat: highest(state.dealerStats),
    notification: highest(state.notifications),
  };
}

async function persist(state: LocalState): Promise<void> {
  const filePath = localDataPath();
  const directory = path.dirname(filePath);
  saveQueue = saveQueue.then(async () => {
    await mkdir(directory, { recursive: true });
    const temporaryPath = `${filePath}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
    await rename(temporaryPath, filePath);
  });
  return saveQueue;
}

function dayOffset(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}

async function createDefaultState(): Promise<LocalState> {
  const now = new Date();
  const [adminPassword, dealerPassword, userPassword] = await Promise.all([
    bcryptHash("admin123", 10),
    bcryptHash("dealer123", 10),
    bcryptHash("user123", 10),
  ]);

  const users: LocalUser[] = [
    {
      id: 1,
      openId: "admin@autohub.sa",
      email: "admin@autohub.sa",
      whatsapp: "0500000001",
      name: "مدير النظام",
      passwordHash: adminPassword,
      role: "admin",
      loginMethod: "email",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    },
    {
      id: 2,
      openId: "dealer@autohub.sa",
      email: "dealer@autohub.sa",
      whatsapp: "0500000002",
      name: "معرض الجزيرة",
      passwordHash: dealerPassword,
      role: "user",
      loginMethod: "email",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    },
    {
      id: 3,
      openId: "user@autohub.sa",
      email: "user@autohub.sa",
      whatsapp: "0500000003",
      name: "مستخدم تجريبي",
      passwordHash: userPassword,
      role: "user",
      loginMethod: "email",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    },
  ];

  const dealerSeed = [
    [1, 2, "معرض الجزيرة للسيارات", "al-jazeera-motors", "الرياض", "العليا", "[\"تويوتا\",\"لكزس\"]", "premium", true, "/assets/showroom-toyota.jpg", 3420, 48],
    [2, null, "معرض إيليت للسيارات الفاخرة", "elite-auto-jeddah", "جدة", "الزهراء", "[\"مرسيدس\",\"بي إم دبليو\",\"أودي\"]", "pro", true, "/assets/showroom-luxury.jpg", 2890, 32],
    [3, null, "معرض نجد موتورز", "najd-motors", "الرياض", "الملقا", "[\"هيونداي\",\"كيا\",\"نيسان\"]", "basic", true, "/assets/car-suv.jpg", 1560, 25],
    [4, null, "معرض الخليج للسيارات المميزة", "gulf-premium-cars", "الدمام", "الشاطئ", "[\"فورد\",\"شيفروليه\",\"جيب\"]", "free", false, "/assets/showroom-luxury.jpg", 890, 18],
    [5, null, "مركز مكة للسيارات", "makkah-auto-center", "مكة المكرمة", "العزيزية", "[\"تويوتا\",\"هيونداي\",\"كيا\",\"نيسان\"]", "pro", true, "/assets/showroom-toyota.jpg", 2100, 35],
    [6, null, "معرض فيجن موتورز", "vision-motors-riyadh", "الرياض", "النخيل", "[\"لاند روفر\",\"جيب\",\"مرسيدس\",\"بي إم دبليو\"]", "premium", true, "/assets/hero-bg.jpg", 4100, 52],
  ] as const;

  const dealers: LocalDealer[] = dealerSeed.map(([id, userId, name, slug, city, neighborhood, brands, plan, isVerified, cover, views, vehiclesCount]) => ({
    id,
    userId,
    name,
    slug,
    logo: "/assets/logo-icon.png",
    cover,
    bio: `${name} — منصة تجريبية محلية لعرض السيارات وخدمات المعارض في المملكة العربية السعودية.`,
    phone: `+9665${String(10000000 + id * 1111111).slice(0, 8)}`,
    whatsapp: `+9665${String(10000000 + id * 1111111).slice(0, 8)}`,
    email: `dealer${id}@autohub.sa`,
    city,
    neighborhood,
    lat: null,
    lng: null,
    address: `${city} — ${neighborhood}`,
    workingHours: "السبت - الخميس: 9ص - 10م | الجمعة: 4م - 10م",
    brands,
    isVerified,
    plan,
    commercialReg: `CR-${100000 + id}`,
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
    status: isVerified ? "active" : "pending",
  }));

  const vehicleSeed = [
    [1, 1, "تويوتا", "لاند كروزر", 2024, 285000, "new", "petrol", "automatic", "أبيض لؤلؤي", 0, "/assets/car-suv.jpg", "تويوتا لاند كروزر 2024 الجديدة كلياً، فل أوبشن، ضمان الوكالة 3 سنوات.", "الرياض", 520],
    [2, 1, "لكزس", "LX 600", 2023, 420000, "used", "petrol", "automatic", "أسود", 28000, "/assets/showroom-toyota.jpg", "لكزس LX 600 2023 بحالة ممتازة، صيانة دورية من الوكالة.", "الرياض", 380],
    [3, 2, "مرسيدس", "S-Class", 2024, 650000, "new", "petrol", "automatic", "فضي معدني", 0, "/assets/showroom-luxury.jpg", "مرسيدس S-Class 2024 الفئة الأولى، مواصفات خليجية كاملة.", "جدة", 290],
    [4, 3, "هيونداي", "توسان", 2023, 89000, "used", "petrol", "automatic", "رمادي", 45000, "/assets/car-suv.jpg", "هيونداي توسان 2023 بحالة ممتازة، صيانة منتظمة.", "الرياض", 210],
    [5, 6, "لاند روفر", "ديفندر", 2024, 380000, "new", "petrol", "automatic", "أخضر داكن", 0, "/assets/hero-bg.jpg", "لاند روفر ديفندر 2024 جديد، مواصفات كاملة، ضمان الوكالة.", "الرياض", 445],
    [6, 2, "بي إم دبليو", "X7", 2023, 310000, "used", "petrol", "automatic", "أبيض ألباين", 35000, "/assets/showroom-luxury.jpg", "بي إم دبليو X7 2023 بحالة ممتازة، فل أوبشن.", "جدة", 320],
  ] as const;

  const vehicleMetadata: Record<string, { bodyType: string; trim: string }> = {
    'لاند كروزر': { bodyType: 'دفع رباعي', trim: 'GXR' },
    'LX 600': { bodyType: 'دفع رباعي', trim: 'F Sport' },
    'S-Class': { bodyType: 'سيدان', trim: 'AMG' },
    'توسان': { bodyType: 'كروس أوفر', trim: 'N Line' },
    'ديفندر': { bodyType: 'دفع رباعي', trim: 'HSE' },
    'X7': { bodyType: 'دفع رباعي', trim: 'M Sport' },
  };

  const vehicles: LocalVehicle[] = vehicleSeed.map(([id, dealerId, brand, model, year, price, condition, fuelType, transmission, color, mileage, image, description, city, views]) => ({
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
    updatedAt: now,
  }));

  const reviews: LocalReview[] = [
    { id: 1, dealerId: 1, userId: 3, rating: 5, comment: "تجربة ممتازة وخدمة احترافية.", createdAt: dayOffset(12) },
    { id: 2, dealerId: 2, userId: 3, rating: 5, comment: "خيارات متنوعة وتعامل راقٍ.", createdAt: dayOffset(20) },
  ];

  const stateWithoutCounters = {
    version: 1 as const,
    users,
    dealers,
    vehicles,
    reviews,
    inquiries: [] as LocalInquiry[],
    contactMessages: [] as LocalContactMessage[],
    vehicleRequests: [] as LocalVehicleRequest[],
    mediaUploads: [] as LocalMediaUpload[],
    dealerStats: [] as LocalDealerStat[],
    notifications: [] as LocalNotification[],
  };

  return {
    ...stateWithoutCounters,
    counters: buildCounters(stateWithoutCounters),
  };
}

async function loadState(): Promise<LocalState> {
  const filePath = localDataPath();
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as LocalState;
    if (parsed.version !== 1) throw new Error("Unsupported local data version");
    const hydrated = hydrateState(parsed);
    hydrated.counters = { ...buildCounters(hydrated), ...hydrated.counters };
    return hydrated;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code && code !== "ENOENT") {
      console.warn("[Local data] Unable to read existing data; a clean demo store will be created.", error);
    }
    const initial = await createDefaultState();
    await persist(initial);
    return initial;
  }
}

async function state(): Promise<LocalState> {
  if (!statePromise) statePromise = loadState();
  return statePromise;
}

async function mutate<T>(operation: (current: LocalState) => T | Promise<T>): Promise<T> {
  const current = await state();
  const result = await operation(current);
  await persist(current);
  return clone(result);
}

export async function ensureLocalStore(): Promise<void> {
  if (!isLocalDataMode()) return;
  await state();
}

export async function resetLocalStore(): Promise<void> {
  statePromise = createDefaultState();
  const current = await statePromise;
  await persist(current);
}

function nextId(current: LocalState, key: keyof LocalState["counters"]): number {
  current.counters[key] += 1;
  return current.counters[key];
}

function matches(value: string | null | undefined, term: string | undefined): boolean {
  if (!term) return true;
  return (value ?? "").toLocaleLowerCase("ar-SA").includes(term.toLocaleLowerCase("ar-SA"));
}

function planRank(plan: LocalPlan): number {
  return { free: 0, basic: 1, pro: 2, premium: 3 }[plan];
}

function jsonBrands(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === "string") : [];
  } catch {
    return value.split(",").map(entry => entry.trim()).filter(Boolean);
  }
}

function dateOnly(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function localUpsertUser(input: InsertUser): Promise<LocalUser> {
  return mutate(async current => {
    const existing = current.users.find(user => user.openId === input.openId);
    const now = new Date();
    if (existing) {
      if (input.name !== undefined) existing.name = input.name ?? null;
      if (input.email !== undefined) existing.email = input.email ?? null;
      if (input.whatsapp !== undefined) existing.whatsapp = input.whatsapp ?? null;
      if (input.loginMethod !== undefined) existing.loginMethod = input.loginMethod ?? null;
      if (input.passwordHash !== undefined) existing.passwordHash = input.passwordHash ?? null;
      if (input.role !== undefined) existing.role = input.role;
      if (input.lastSignedIn !== undefined) existing.lastSignedIn = asDate(input.lastSignedIn, now);
      existing.updatedAt = now;
      return existing;
    }

    const user: LocalUser = {
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
      lastSignedIn: input.lastSignedIn ? asDate(input.lastSignedIn, now) : now,
    };
    current.users.push(user);
    return user;
  });
}

export async function localGetUserByOpenId(openId: string): Promise<LocalUser | undefined> {
  const current = await state();
  const user = current.users.find(entry => entry.openId === openId);
  return user ? clone(user) : undefined;
}

export async function localGetUserByEmail(email: string): Promise<LocalUser | undefined> {
  const current = await state();
  const normalized = email.trim().toLowerCase();
  const user = current.users.find(entry => entry.email?.toLowerCase() === normalized);
  return user ? clone(user) : undefined;
}

export async function localUpdateUserName(id: number, name: string): Promise<void> {
  await mutate(current => {
    const user = current.users.find(entry => entry.id === id);
    if (user) {
      user.name = name;
      user.updatedAt = new Date();
    }
  });
}

export async function localUpdateUserProfile(id: number, data: { name?: string; whatsapp?: string; email?: string | null }): Promise<LocalUser> {
  return mutate(current => {
    const user = current.users.find(entry => entry.id === id);
    if (!user) throw new Error("User not found");
    if (data.name !== undefined) user.name = data.name;
    if (data.whatsapp !== undefined) user.whatsapp = data.whatsapp;
    if (data.email !== undefined) user.email = data.email;
    user.updatedAt = new Date();
    return user;
  });
}

export async function localListUsers(limit = 200): Promise<LocalUser[]> {
  const current = await state();
  return clone([...current.users].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit));
}

export async function localUpdateUserRole(id: number, role: "user" | "admin"): Promise<void> {
  await mutate(current => {
    const user = current.users.find(entry => entry.id === id);
    if (!user) throw new Error("User not found");
    user.role = role;
    user.updatedAt = new Date();
  });
}

export async function localGetDealers(options: DealerListOptions = {}): Promise<LocalDealer[]> {
  const current = await state();
  const filtered = current.dealers.filter(dealer => {
    if (options.city && dealer.city !== options.city) return false;
    if (options.brand && !jsonBrands(dealer.brands).includes(options.brand)) return false;
    if (options.q && !matches(`${dealer.name} ${dealer.city ?? ""} ${dealer.neighborhood ?? ""}`, options.q)) return false;
    if (options.verified && (!dealer.isVerified || dealer.status !== 'active')) return false;
    if (options.dealerType && options.dealerType !== "all" && dealer.dealerType !== options.dealerType && dealer.dealerType !== "both") return false;
    return true;
  });
  const offset = options.offset ?? 0;
  const limit = options.limit ?? 50;
  return clone(filtered.sort((a, b) => planRank(b.plan) - planRank(a.plan) || b.views - a.views).slice(offset, offset + limit));
}

export async function localGetDealerBySlug(slug: string): Promise<LocalDealer | undefined> {
  const current = await state();
  const dealer = current.dealers.find(entry => entry.slug === slug);
  return dealer ? clone(dealer) : undefined;
}

export async function localGetDealerById(id: number): Promise<LocalDealer | undefined> {
  const current = await state();
  const dealer = current.dealers.find(entry => entry.id === id);
  return dealer ? clone(dealer) : undefined;
}

export async function localCreateDealer(input: InsertDealer): Promise<LocalDealer> {
  return mutate(current => {
    const now = new Date();
    const dealer: LocalDealer = {
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
      status: input.status ?? "pending",
    };
    current.dealers.push(dealer);
    return dealer;
  });
}

export async function localUpdateDealer(id: number, data: Partial<InsertDealer>): Promise<void> {
  await mutate(current => {
    const dealer = current.dealers.find(entry => entry.id === id);
    if (!dealer) throw new Error("Dealer not found");
    const allowed = [
      "name", "slug", "logo", "cover", "bio", "phone", "whatsapp", "email", "city", "neighborhood", "lat", "lng", "address", "workingHours", "brands", "isVerified", "plan", "commercialReg", "dealerType", "views", "vehiclesCount", "instagram", "twitter", "snapchat", "tiktok", "website", "workingHoursDetail", "planStartDate", "planEndDate", "stripeCustomerId", "stripeSubscriptionId", "rejectionReason", "status",
    ] as const;
    for (const key of allowed) {
      if (data[key] !== undefined) (dealer as Record<string, unknown>)[key] = data[key] ?? null;
    }
    dealer.updatedAt = new Date();
  });
}

export async function localUpdateDealerViews(id: number): Promise<void> {
  await mutate(current => {
    const dealer = current.dealers.find(entry => entry.id === id);
    if (dealer) {
      dealer.views += 1;
      dealer.updatedAt = new Date();
    }
  });
}

export async function localUpdateDealerStatus(id: number, status: LocalDealerStatus, rejectionReason: string | null): Promise<void> {
  await mutate(current => {
    const dealer = current.dealers.find(entry => entry.id === id);
    if (!dealer) throw new Error("Dealer not found");
    dealer.status = status;
    dealer.rejectionReason = rejectionReason;
    dealer.isVerified = status === "active";
    dealer.updatedAt = new Date();
  });
}

export async function localDeleteDealer(id: number): Promise<void> {
  await mutate(current => {
    current.dealers = current.dealers.filter(entry => entry.id !== id);
    const vehicleIds = new Set(current.vehicles.filter(vehicle => vehicle.dealerId === id).map(vehicle => vehicle.id));
    current.vehicles = current.vehicles.filter(vehicle => vehicle.dealerId !== id);
    current.reviews = current.reviews.filter(review => review.dealerId !== id);
    current.inquiries = current.inquiries.filter(inquiry => inquiry.dealerId !== id && (inquiry.vehicleId === null || !vehicleIds.has(inquiry.vehicleId)));
    current.mediaUploads = current.mediaUploads.filter(media => media.dealerId !== id);
    current.dealerStats = current.dealerStats.filter(stat => stat.dealerId !== id);
  });
}

export async function localGetDealerOwnerUserId(id: number): Promise<number | null> {
  const current = await state();
  return current.dealers.find(entry => entry.id === id)?.userId ?? null;
}

export async function localGetDealerByUserId(userId: number): Promise<LocalDealer | undefined> {
  const current = await state();
  const dealer = current.dealers.find(entry => entry.userId === userId);
  return dealer ? clone(dealer) : undefined;
}

export async function localGetAllDealersAdmin(): Promise<Array<LocalDealer & { ownerName: string | null; ownerEmail: string | null }>> {
  const current = await state();
  return clone(current.dealers
    .map(dealer => {
      const owner = current.users.find(user => user.id === dealer.userId);
      return { ...dealer, ownerName: owner?.name ?? null, ownerEmail: owner?.email ?? null };
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
}

export async function localVerifyDealer(id: number, isVerified: boolean): Promise<void> {
  await mutate(current => {
    const dealer = current.dealers.find(entry => entry.id === id);
    if (!dealer) throw new Error("Dealer not found");
    dealer.isVerified = isVerified;
    dealer.status = isVerified ? "active" : "pending";
    dealer.updatedAt = new Date();
  });
}

export async function localUpdateDealerPlan(id: number, plan: LocalPlan): Promise<void> {
  await mutate(current => {
    const dealer = current.dealers.find(entry => entry.id === id);
    if (!dealer) throw new Error("Dealer not found");
    dealer.plan = plan;
    dealer.updatedAt = new Date();
  });
}

export async function localGetAdminStats() {
  const current = await state();
  return {
    totalDealers: current.dealers.length,
    verifiedDealers: current.dealers.filter(dealer => dealer.isVerified).length,
    totalVehicles: current.vehicles.length,
    totalInquiries: current.inquiries.length,
    totalUsers: current.users.length,
  };
}

export async function localGetAdminStatsExtended() {
  const base = await localGetAdminStats();
  const current = await state();
  return {
    ...base,
    pendingDealers: current.dealers.filter(dealer => !dealer.isVerified).length,
    paidDealers: current.dealers.filter(dealer => dealer.plan !== "free").length,
    freeDealers: current.dealers.filter(dealer => dealer.plan === "free").length,
    proDealers: current.dealers.filter(dealer => dealer.plan === "pro").length,
    premiumDealers: current.dealers.filter(dealer => dealer.plan === "premium").length,
    totalReviews: current.reviews.length,
    totalViews: current.dealers.reduce((total, dealer) => total + dealer.views, 0),
  };
}

function filterVehicles(rows: LocalVehicle[], options: VehicleListOptions): LocalVehicle[] {
  return rows.filter(vehicle => {
    if (options.dealerId && vehicle.dealerId !== options.dealerId) return false;
    if (options.condition && vehicle.condition !== options.condition) return false;
    if (options.brand && vehicle.brand !== options.brand) return false;
    if (options.models?.length && !options.models.some(model => matches(vehicle.model, model))) return false;
    if (!options.models?.length && options.model && !matches(vehicle.model, options.model)) return false;
    if (options.bodyType && vehicle.bodyType !== options.bodyType) return false;
    if (options.trim && !matches(vehicle.trim ?? '', options.trim)) return false;
    if (options.city && vehicle.city !== options.city) return false;
    if (options.minPrice !== undefined && vehicle.price < options.minPrice) return false;
    if (options.maxPrice !== undefined && vehicle.price > options.maxPrice) return false;
    if (options.minYear !== undefined && vehicle.year < options.minYear) return false;
    if (options.maxYear !== undefined && vehicle.year > options.maxYear) return false;
    if (options.fuelType && vehicle.fuelType !== options.fuelType) return false;
    if (options.transmission && vehicle.transmission !== options.transmission) return false;
    if (options.status && vehicle.status !== options.status) return false;
    if (!options.status && vehicle.status === "sold") return false;
    if (options.q && !matches(`${vehicle.brand} ${vehicle.model} ${vehicle.bodyType ?? ''} ${vehicle.trim ?? ''}`, options.q)) return false;
    return true;
  });
}

export async function localGetVehicles(options: VehicleListOptions = {}): Promise<LocalVehicle[]> {
  const current = await state();
  const offset = options.offset ?? 0;
  const limit = options.limit ?? 50;
  return clone(filterVehicles(current.vehicles, options)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(offset, offset + limit));
}

function vehicleWithDealer(vehicle: LocalVehicle, dealer: LocalDealer | undefined) {
  return {
    ...vehicle,
    dealerName: dealer?.name ?? null,
    dealerSlug: dealer?.slug ?? null,
    dealerLogo: dealer?.logo ?? null,
    dealerCity: dealer?.city ?? null,
    dealerPhone: dealer?.phone ?? null,
    dealerWhatsapp: dealer?.whatsapp ?? null,
    dealerVerified: dealer?.isVerified ?? false,
  };
}

export async function localGetVehiclesWithDealer(options: VehicleListOptions = {}) {
  const current = await state();
  const offset = options.offset ?? 0;
  const limit = options.limit ?? 50;
  const rows = filterVehicles(current.vehicles, options)
    .map(vehicle => vehicleWithDealer(vehicle, current.dealers.find(dealer => dealer.id === vehicle.dealerId)))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(offset, offset + limit);
  return clone(rows);
}

export async function localGetVehicleById(id: number): Promise<LocalVehicle | undefined> {
  const current = await state();
  const vehicle = current.vehicles.find(entry => entry.id === id);
  return vehicle ? clone(vehicle) : undefined;
}

export async function localGetVehicleWithDealer(id: number) {
  const current = await state();
  const vehicle = current.vehicles.find(entry => entry.id === id);
  if (!vehicle) return undefined;
  const dealer = current.dealers.find(entry => entry.id === vehicle.dealerId);
  return clone({
    ...vehicleWithDealer(vehicle, dealer),
    dealerBio: dealer?.bio ?? null,
    dealerAddress: dealer?.address ?? null,
    dealerLat: dealer?.lat ?? null,
    dealerLng: dealer?.lng ?? null,
  });
}

export async function localCreateVehicle(input: InsertVehicle): Promise<LocalVehicle> {
  return mutate(current => {
    const now = new Date();
    const vehicle: LocalVehicle = {
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
      updatedAt: now,
    };
    current.vehicles.push(vehicle);
    const dealer = current.dealers.find(entry => entry.id === vehicle.dealerId);
    if (dealer) {
      dealer.vehiclesCount = current.vehicles.filter(entry => entry.dealerId === vehicle.dealerId).length;
      dealer.updatedAt = now;
    }
    return vehicle;
  });
}

export async function localUpdateVehicle(id: number, data: Partial<InsertVehicle>): Promise<void> {
  await mutate(current => {
    const vehicle = current.vehicles.find(entry => entry.id === id);
    if (!vehicle) throw new Error("Vehicle not found");
    const allowed = ["brand", "model", "bodyType", "trim", "year", "price", "condition", "fuelType", "transmission", "color", "mileage", "description", "images", "city", "videoUrl", "videoKey", "status"] as const;
    for (const key of allowed) {
      if (data[key] !== undefined) (vehicle as Record<string, unknown>)[key] = data[key] ?? null;
    }
    vehicle.updatedAt = new Date();
  });
}

export async function localDeleteVehicle(id: number): Promise<void> {
  await mutate(current => {
    const vehicle = current.vehicles.find(entry => entry.id === id);
    if (!vehicle) return;
    current.vehicles = current.vehicles.filter(entry => entry.id !== id);
    current.inquiries = current.inquiries.filter(inquiry => inquiry.vehicleId !== id);
    current.mediaUploads = current.mediaUploads.filter(media => media.vehicleId !== id);
    const dealer = current.dealers.find(entry => entry.id === vehicle.dealerId);
    if (dealer) dealer.vehiclesCount = current.vehicles.filter(entry => entry.dealerId === vehicle.dealerId).length;
  });
}

export async function localUpdateVehicleViews(id: number): Promise<void> {
  await mutate(current => {
    const vehicle = current.vehicles.find(entry => entry.id === id);
    if (vehicle) {
      vehicle.views += 1;
      vehicle.updatedAt = new Date();
    }
  });
}

export async function localGetReviewsByDealer(dealerId: number) {
  const current = await state();
  return clone(current.reviews
    .filter(review => review.dealerId === dealerId)
    .map(review => ({ ...review, userName: current.users.find(user => user.id === review.userId)?.name ?? null }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
}

export async function localCreateReview(input: InsertReview): Promise<LocalReview> {
  return mutate(current => {
    const review: LocalReview = {
      id: nextId(current, "review"),
      dealerId: input.dealerId,
      userId: input.userId,
      rating: input.rating,
      comment: input.comment ?? null,
      createdAt: new Date(),
    };
    current.reviews.push(review);
    return review;
  });
}

export async function localGetDealerRating(dealerId: number): Promise<{ avg: number; count: number }> {
  const current = await state();
  const reviews = current.reviews.filter(review => review.dealerId === dealerId);
  const count = reviews.length;
  return { avg: count ? reviews.reduce((sum, review) => sum + review.rating, 0) / count : 0, count };
}

export async function localHasUserReviewed(dealerId: number, userId: number): Promise<boolean> {
  const current = await state();
  return current.reviews.some(review => review.dealerId === dealerId && review.userId === userId);
}

export async function localDeleteReview(id: number): Promise<void> {
  await mutate(current => {
    current.reviews = current.reviews.filter(review => review.id !== id);
  });
}

export async function localGetAllReviewsAdmin() {
  const current = await state();
  return clone(current.reviews
    .map(review => ({
      ...review,
      dealerName: current.dealers.find(dealer => dealer.id === review.dealerId)?.name ?? null,
      userName: current.users.find(user => user.id === review.userId)?.name ?? null,
    }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
}

export async function localCreateInquiry(input: InsertInquiry): Promise<LocalInquiry> {
  return mutate(current => {
    const inquiry: LocalInquiry = {
      id: nextId(current, "inquiry"),
      dealerId: input.dealerId,
      vehicleId: input.vehicleId ?? null,
      userId: input.userId ?? null,
      name: input.name ?? null,
      phone: input.phone ?? null,
      message: input.message,
      status: input.status ?? "new",
      createdAt: new Date(),
    };
    current.inquiries.push(inquiry);
    return inquiry;
  });
}

export async function localGetInquiriesByDealer(dealerId: number): Promise<LocalInquiry[]> {
  const current = await state();
  return clone(current.inquiries.filter(inquiry => inquiry.dealerId === dealerId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
}

export async function localUpdateInquiryStatus(id: number, status: LocalInquiryStatus): Promise<void> {
  await mutate(current => {
    const inquiry = current.inquiries.find(entry => entry.id === id);
    if (!inquiry) throw new Error("Inquiry not found");
    inquiry.status = status;
  });
}

export async function localGetInquiriesCount(dealerId: number): Promise<number> {
  const current = await state();
  return current.inquiries.filter(inquiry => inquiry.dealerId === dealerId).length;
}

export async function localGetAllInquiriesAdmin() {
  const current = await state();
  return clone(current.inquiries
    .map(inquiry => {
      const user = inquiry.userId ? current.users.find(entry => entry.id === inquiry.userId) : undefined;
      return {
        ...inquiry,
        dealerName: current.dealers.find(dealer => dealer.id === inquiry.dealerId)?.name ?? null,
        senderEmail: user?.email ?? null,
        senderWhatsapp: user?.whatsapp ?? inquiry.phone ?? null,
      };
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
}

export async function localCreateContactMessage(input: InsertContactMessage): Promise<LocalContactMessage> {
  return mutate(current => {
    const message: LocalContactMessage = {
      id: nextId(current, "contactMessage"),
      name: input.name,
      email: input.email ?? null,
      whatsapp: input.whatsapp,
      message: input.message,
      status: input.status ?? "new",
      createdAt: new Date(),
    };
    current.contactMessages.push(message);
    return message;
  });
}

export async function localGetAllContactMessagesAdmin(): Promise<LocalContactMessage[]> {
  const current = await state();
  return clone([...current.contactMessages].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
}

export async function localUpdateContactMessageStatus(id: number, status: LocalContactMessageStatus): Promise<void> {
  await mutate(current => {
    const message = current.contactMessages.find(entry => entry.id === id);
    if (!message) throw new Error("Contact message not found");
    message.status = status;
  });
}

export async function localCreateVehicleRequest(input: InsertVehicleRequest): Promise<LocalVehicleRequest> {
  return mutate(current => {
    const request: LocalVehicleRequest = {
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
      createdAt: new Date(),
    };
    current.vehicleRequests.push(request);
    return request;
  });
}

export async function localGetVehicleRequestsByUser(userId: number): Promise<LocalVehicleRequest[]> {
  const current = await state();
  return clone(current.vehicleRequests.filter(request => request.userId === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
}

export async function localGetAllVehicleRequestsAdmin() {
  const current = await state();
  return clone(current.vehicleRequests
    .map(request => {
      const user = current.users.find(entry => entry.id === request.userId);
      return { ...request, senderEmail: user?.email ?? request.email, senderWhatsapp: user?.whatsapp ?? request.whatsapp };
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
}

export async function localCreateMediaUpload(input: InsertMediaUpload): Promise<LocalMediaUpload> {
  return mutate(current => {
    const media: LocalMediaUpload = {
      id: nextId(current, "media"),
      dealerId: input.dealerId,
      vehicleId: input.vehicleId ?? null,
      fileKey: input.fileKey,
      fileUrl: input.fileUrl,
      fileType: input.fileType,
      mimeType: input.mimeType ?? null,
      originalName: input.originalName ?? null,
      sizeBytes: input.sizeBytes ?? null,
      createdAt: new Date(),
    };
    current.mediaUploads.push(media);
    return media;
  });
}

export async function localGetMediaByDealer(dealerId: number): Promise<LocalMediaUpload[]> {
  const current = await state();
  return clone(current.mediaUploads.filter(media => media.dealerId === dealerId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
}

export async function localGetDealerDashboard(dealerId: number) {
  const current = await state();
  const dealer = current.dealers.find(entry => entry.id === dealerId);
  const reviews = current.reviews.filter(review => review.dealerId === dealerId);
  const inquiries = current.inquiries.filter(inquiry => inquiry.dealerId === dealerId);
  const vehicles = current.vehicles.filter(vehicle => vehicle.dealerId === dealerId);
  return clone({
    totalViews: dealer?.views ?? 0,
    totalInquiries: inquiries.length,
    totalVehicles: vehicles.length,
    avgRating: reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0,
    reviewCount: reviews.length,
    recentInquiries: inquiries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 10),
    recentVehicles: vehicles.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 6),
  });
}

export async function localGetVehicleCountByDealer(dealerId: number): Promise<number> {
  const current = await state();
  return current.vehicles.filter(vehicle => vehicle.dealerId === dealerId).length;
}

export async function localGetDealerAnalytics(dealerId: number, days = 30) {
  const current = await state();
  const start = new Date();
  start.setDate(start.getDate() - days + 1);
  const startString = start.toISOString().slice(0, 10);
  const daily = current.dealerStats.filter(stat => stat.dealerId === dealerId && stat.date >= startString).sort((a, b) => a.date.localeCompare(b.date));
  const totals = daily.reduce((total, row) => ({
    views: total.views + row.views,
    inquiries: total.inquiries + row.inquiries,
    vehicleViews: total.vehicleViews + row.vehicleViews,
  }), { views: 0, inquiries: 0, vehicleViews: 0 });
  return clone({ daily, totals });
}

export async function localRecordDealerStat(dealerId: number, field: "views" | "inquiries" | "vehicleViews"): Promise<void> {
  await mutate(current => {
    const today = dateOnly();
    let stat = current.dealerStats.find(entry => entry.dealerId === dealerId && entry.date === today);
    if (!stat) {
      stat = { id: nextId(current, "stat"), dealerId, date: today, views: 0, inquiries: 0, vehicleViews: 0 };
      current.dealerStats.push(stat);
    }
    stat[field] += 1;
  });
}

export async function localCreateNotification(input: Omit<InsertNotification, "id" | "createdAt" | "isRead"> & { isRead?: boolean }): Promise<LocalNotification> {
  return mutate(current => {
    const notification: LocalNotification = {
      id: nextId(current, "notification"),
      userId: input.userId,
      dealerId: input.dealerId ?? null,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      isRead: input.isRead ?? false,
      createdAt: new Date(),
    };
    current.notifications.push(notification);
    return notification;
  });
}

export async function localGetNotificationsByUser(userId: number, limit = 30): Promise<LocalNotification[]> {
  const current = await state();
  return clone(current.notifications.filter(notification => notification.userId === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit));
}

export async function localMarkNotificationsRead(userId: number, ids?: number[]): Promise<void> {
  await mutate(current => {
    const allowed = ids && ids.length > 0 ? new Set(ids) : null;
    for (const notification of current.notifications) {
      if (notification.userId === userId && (!allowed || allowed.has(notification.id))) notification.isRead = true;
    }
  });
}

export async function localGetUnreadNotificationCount(userId: number): Promise<number> {
  const current = await state();
  return current.notifications.filter(notification => notification.userId === userId && !notification.isRead).length;
}
