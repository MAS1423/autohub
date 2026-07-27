import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getDealers, getDealerBySlug, createDealer, updateDealerViews,
  getVehicles, createVehicle, updateVehicleViews,
  getReviewsByDealer, createReview, getDealerRating, hasUserReviewed,
  createInquiry, getInquiriesByDealer,
  getDealerDashboard, getDealerByUserId, updateVehicle, deleteVehicle,
  updateInquiryStatus,
  getVehicleCountByDealer,
  getVehiclesWithDealer, getVehicleWithDealer,
  getAllDealersAdmin, verifyDealer, updateDealerPlan,
  getAdminStatsExtended,
  getDealerAnalytics, recordDealerStat,
  createNotification, getNotificationsByUser, markNotificationsRead, getUnreadNotificationCount,
  updateUserName, getDealerOwnerUserId, updateDealer, updateDealerStatus, deleteDealer,
  getAllUsers, updateUserRole, getAllInquiriesAdmin, getAllReviewsAdmin, deleteReview,
  getUserByOpenId, updateUserProfile, createVehicleRequest, getVehicleRequestsByUser, getAllVehicleRequestsAdmin,
  createContactMessage, getAllContactMessagesAdmin, updateContactMessageStatus,
} from "./db";
import { notifyOwner } from "./_core/notification";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(({ ctx }) => ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    profile: protectedProcedure.query(async ({ ctx }) => {
      return (await getUserByOpenId(ctx.user.openId)) ?? ctx.user;
    }),
    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().trim().min(2).max(120),
        whatsapp: z.string().trim().min(9).max(30),
        email: z.string().trim().email().optional().or(z.literal("")),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await getUserByOpenId(ctx.user.openId);
        if (!user) throw new Error('لم يتم العثور على حساب المستخدم');
        const updated = await updateUserProfile(user.id, {
          name: input.name,
          whatsapp: input.whatsapp,
          email: input.email || null,
        });
        return updated;
      }),
  }),

  dealers: router({
    list: publicProcedure
      .input(z.object({
        city: z.string().optional(),
        brand: z.string().optional(),
        q: z.string().optional(),
        verified: z.boolean().optional(),
        dealerType: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional())
      .query(async ({ input }) => getDealers(input ?? {})),

    bySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const dealer = await getDealerBySlug(input.slug);
        if (!dealer) return null;
        await updateDealerViews(dealer.id);
        await recordDealerStat(dealer.id, 'views').catch(() => {});
        return dealer;
      }),

    register: publicProcedure
      .input(z.object({
        name: z.string().min(2),
        ownerName: z.string().min(2),
        phone: z.string().min(9),
        email: z.string().email().optional(),
        city: z.string().min(1),
        neighborhood: z.string().optional(),
        brands: z.array(z.string()).min(1),
        bio: z.string().optional(),
        commercialReg: z.string().optional(),
        dealerType: z.enum(["sell", "buy", "both"]).default("sell"),
      }))
      .mutation(async ({ input, ctx }) => {
        const slug = input.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u0600-\u06FF-]/g, '') + '-' + Date.now().toString(36);
        // Keep the authenticated owner's display name in sync when possible.
        if (ctx.user?.id && input.ownerName) {
          await updateUserName(ctx.user.id, input.ownerName).catch(error => {
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
          dealerType: input.dealerType,
        });
        return { success: true, slug };
      }),
  }),

  vehicles: router({
    list: publicProcedure
      .input(z.object({
        dealerId: z.number().optional(),
        condition: z.enum(["new", "used"]).optional(),
        brand: z.string().optional(),
        model: z.string().optional(),
        models: z.array(z.string().min(1)).max(8).optional(),
        bodyType: z.string().optional(),
        trim: z.string().optional(),
        city: z.string().optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        minYear: z.number().optional(),
        maxYear: z.number().optional(),
        fuelType: z.string().optional(),
        transmission: z.string().optional(),
        status: z.string().optional(),
        q: z.string().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }).optional())
      .query(async ({ input }) => getVehiclesWithDealer(input ?? {})),

    search: publicProcedure
      .input(z.object({
        q: z.string().optional(),
        brand: z.string().optional(),
        model: z.string().optional(),
        models: z.array(z.string().min(1)).max(8).optional(),
        bodyType: z.string().optional(),
        trim: z.string().optional(),
        city: z.string().optional(),
        condition: z.enum(["new", "used"]).optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        minYear: z.number().optional(),
        maxYear: z.number().optional(),
        fuelType: z.string().optional(),
        transmission: z.string().optional(),
        limit: z.number().default(24),
        offset: z.number().default(0),
      }).optional())
      .query(async ({ input }) => getVehiclesWithDealer(input ?? {})),

    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const vehicle = await getVehicleWithDealer(input.id);
        if (!vehicle) return null;
        await updateVehicleViews(input.id);
        // Record daily vehicleViews stat for the dealer
        if (vehicle.dealerId) {
          await recordDealerStat(vehicle.dealerId, 'vehicleViews').catch(() => {});
        }
        return vehicle;
      }),

    create: protectedProcedure
      .input(z.object({
        dealerId: z.number(),
        brand: z.string(),
        model: z.string(),
        bodyType: z.string().optional(),
        trim: z.string().optional(),
        year: z.number(),
        price: z.number(),
        condition: z.enum(["new", "used"]),
        fuelType: z.enum(["petrol", "diesel", "hybrid", "electric"]).default("petrol"),
        transmission: z.enum(["automatic", "manual"]).default("automatic"),
        color: z.string().optional(),
        mileage: z.number().default(0),
        description: z.string().optional(),
        images: z.array(z.string()).default([]),
        videoUrl: z.string().optional(),
        videoKey: z.string().optional(),
        city: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Enforce plan limits
        const dealer = await getDealerByUserId(ctx.user.id);
        if (dealer) {
          const PLAN_LIMITS: Record<string, number> = { free: 5, basic: 15, pro: 50, premium: 999 };
          const limit = PLAN_LIMITS[dealer.plan] ?? 5;
          const count = await getVehicleCountByDealer(dealer.id);
          if (count >= limit) {
            throw new Error(`لقد وصلت للحد الأقصى لخطتك (${limit} سيارة). يرجى الترقية لإضافة المزيد.`);
          }
        }
        await createVehicle({
          ...input,
          color: input.color ?? null,
          description: input.description ?? null,
          images: JSON.stringify(input.images),
          videoUrl: input.videoUrl ?? null,
          videoKey: input.videoKey ?? null,
          city: input.city ?? null,
        });
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        brand: z.string().optional(),
        model: z.string().optional(),
        bodyType: z.string().optional(),
        trim: z.string().optional(),
        year: z.number().optional(),
        price: z.number().optional(),
        condition: z.enum(["new", "used"]).optional(),
        fuelType: z.enum(["petrol", "diesel", "hybrid", "electric"]).optional(),
        transmission: z.enum(["automatic", "manual"]).optional(),
        color: z.string().optional(),
        mileage: z.number().optional(),
        description: z.string().optional(),
        images: z.array(z.string()).optional(),
        videoUrl: z.string().optional(),
        videoKey: z.string().optional(),
        status: z.enum(["available", "reserved", "sold"]).optional(),
        city: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, images, ...rest } = input;
        await updateVehicle(id, { ...rest, images: images ? JSON.stringify(images) : undefined });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteVehicle(input.id);
        return { success: true };
      }),
  }),

  reviews: router({
    byDealer: publicProcedure
      .input(z.object({ dealerId: z.number() }))
      .query(async ({ input }) => {
        const [reviewsList, rating] = await Promise.all([
          getReviewsByDealer(input.dealerId),
          getDealerRating(input.dealerId),
        ]);
        return { reviews: reviewsList, rating };
      }),

    create: protectedProcedure
      .input(z.object({
        dealerId: z.number(),
        rating: z.number().min(1).max(5),
        comment: z.string().max(1000).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const alreadyReviewed = await hasUserReviewed(input.dealerId, ctx.user.id);
        if (alreadyReviewed) throw new Error("لقد قمت بتقييم هذا المعرض مسبقاً");
        await createReview({ dealerId: input.dealerId, userId: ctx.user.id, rating: input.rating, comment: input.comment ?? null });
        return { success: true };
      }),
  }),

  inquiries: router({
    create: publicProcedure
      .input(z.object({
        dealerId: z.number(),
        vehicleId: z.number().optional(),
        name: z.string().min(2),
        phone: z.string().min(9),
        message: z.string().min(5),
      }))
      .mutation(async ({ input, ctx }) => {
        await createInquiry({
          dealerId: input.dealerId,
          vehicleId: input.vehicleId ?? null,
          userId: ctx.user?.id ?? null,
          name: input.name,
          phone: input.phone,
          message: input.message,
        });
        await notifyOwner({
          title: `استفسار جديد من ${input.name}`,
          content: `📞 ${input.phone}\n💬 ${input.message}`,
        }).catch(() => {});
        await recordDealerStat(input.dealerId, 'inquiries').catch(() => {});
        // Create an in-app notification for the owning dealer where available.
        const ownerUserId = await getDealerOwnerUserId(input.dealerId).catch(() => null);
        if (ownerUserId) {
          await createNotification({
            userId: ownerUserId,
            dealerId: input.dealerId,
            type: 'inquiry',
            title: `استفسار جديد من ${input.name}`,
            body: input.message,
          }).catch(() => {});
        }
        return { success: true };
      }),

    byDealer: protectedProcedure
      .input(z.object({ dealerId: z.number() }))
      .query(async ({ input }) => getInquiriesByDealer(input.dealerId)),

    updateStatus: protectedProcedure
      .input(z.object({ id: z.number(), status: z.enum(["new", "read", "replied"]) }))
      .mutation(async ({ input }) => {
        await updateInquiryStatus(input.id, input.status);
        return { success: true };
      }),
  }),

  contact: router({
    send: publicProcedure
      .input(z.object({
        name: z.string().trim().min(2, 'الاسم يجب أن يحتوي على حرفين على الأقل').max(200),
        whatsapp: z.string().trim().min(9, 'رقم الواتساب غير مكتمل').max(30),
        email: z.string().trim().email('البريد الإلكتروني غير صالح').optional().or(z.literal('')),
        message: z.string().trim().min(10, 'الرسالة يجب أن تحتوي على 10 أحرف على الأقل').max(2000),
      }))
      .mutation(async ({ input }) => {
        const message = await createContactMessage({
          name: input.name,
          whatsapp: input.whatsapp,
          email: input.email || null,
          message: input.message,
          status: 'new',
        });
        return { success: true, id: message?.id ?? null };
      }),
  }),

  vehicleRequests: router({
    broadcast: protectedProcedure
      .input(z.object({
        city: z.string().trim().max(100).optional(),
        brand: z.string().trim().max(100).optional(),
        bodyType: z.string().trim().max(80).optional(),
        models: z.array(z.string().trim().min(1).max(100)).max(8).default([]),
        trim: z.string().trim().max(100).optional(),
        condition: z.enum(['new', 'used']).optional(),
        minPrice: z.number().positive().optional(),
        maxPrice: z.number().positive().optional(),
        targetPrice: z.number().positive().optional(),
        minYear: z.number().int().min(1980).max(2100).optional(),
        message: z.string().trim().min(10).max(2000),
      }).refine(input => !(input.minPrice && input.maxPrice && input.minPrice > input.maxPrice), {
        message: 'يجب أن يكون السعر من أقل من أو يساوي السعر إلى.',
        path: ['maxPrice'],
      }))
      .mutation(async ({ input, ctx }) => {
        const currentUser = await getUserByOpenId(ctx.user.openId);
        if (!currentUser?.name || !currentUser.whatsapp) {
          throw new Error('أكمل الاسم ورقم واتساب في حسابك قبل إرسال الطلب.');
        }
        const approvedDealers = await getDealers({ verified: true, limit: 100 });
        if (approvedDealers.length === 0) {
          throw new Error('لا توجد معارض معتمدة متاحة لاستقبال الطلب حاليًا.');
        }

        const requestCode = `REQ-${Date.now().toString(36).toUpperCase()}`;
        const price = input.targetPrice
          ? `الميزانية القصوى: ${input.targetPrice.toLocaleString('en-US')} ر.س`
          : input.minPrice || input.maxPrice
            ? `الميزانية: ${input.minPrice?.toLocaleString('en-US') ?? 'غير محدد'} — ${input.maxPrice?.toLocaleString('en-US') ?? 'غير محدد'} ر.س`
            : 'الميزانية: غير محددة';
        const details = [
          `طلب سيارة جديد (${requestCode})`,
          input.brand ? `الماركة: ${input.brand}` : null,
          input.bodyType ? `النوع: ${input.bodyType}` : null,
          input.models.length ? `الموديلات المطلوبة: ${input.models.join('، ')}` : null,
          input.trim ? `الفئة/التجهيز: ${input.trim}` : null,
          input.condition ? `الحالة: ${input.condition === 'new' ? 'جديد' : 'مستعمل'}` : null,
          input.city ? `المدينة: ${input.city}` : null,
          input.minYear ? `أقل سنة مقبولة: ${input.minYear}` : null,
          price,
          '',
          `رسالة العميل: ${input.message}`,
          '',
          `بيانات التواصل: ${currentUser.name} — واتساب ${currentUser.whatsapp}${currentUser.email ? ` — ${currentUser.email}` : ''}`,
        ].filter(Boolean).join('\n');

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
          status: 'distributed',
        });

        for (const dealer of approvedDealers) {
          await createInquiry({
            dealerId: dealer.id,
            vehicleId: null,
            userId: currentUser.id,
            name: currentUser.name,
            phone: currentUser.whatsapp,
            message: details,
          });
          await recordDealerStat(dealer.id, 'inquiries').catch(() => {});
          const ownerUserId = await getDealerOwnerUserId(dealer.id).catch(() => null);
          if (ownerUserId) {
            await createNotification({
              userId: ownerUserId,
              dealerId: dealer.id,
              type: 'inquiry',
              title: `طلب سيارة جديد: ${input.brand ?? input.bodyType ?? 'سيارة مطلوبة'}`,
              body: `${requestCode} — ${currentUser.name}: ${input.message}`,
            }).catch(() => {});
          }
        }

        await notifyOwner({
          title: `طلب سيارة جماعي جديد من ${currentUser.name}`,
          content: `${requestCode}\nتم توزيع الطلب على ${approvedDealers.length} معرضًا معتمدًا.\n${details}`,
        }).catch(() => {});

        return { success: true, requestCode, matchedDealers: approvedDealers.length };
      }),
  }),

  customer: router({
    requests: protectedProcedure.query(async ({ ctx }) => {
      const user = await getUserByOpenId(ctx.user.openId);
      if (!user) return [];
      return getVehicleRequestsByUser(user.id);
    }),
  }),

  dashboard: router({
    myDealer: protectedProcedure
      .query(async ({ ctx }) => {
        const dealer = await getDealerByUserId(ctx.user.id);
        return dealer ?? null;
      }),

    analytics: protectedProcedure
      .input(z.object({ days: z.number().min(7).max(90).default(30) }))
      .query(async ({ input, ctx }) => {
        const dealer = await getDealerByUserId(ctx.user.id);
        if (!dealer) return { daily: [], totals: { views: 0, inquiries: 0, vehicleViews: 0 } };
        return getDealerAnalytics(dealer.id, input.days);
      }),

    stats: protectedProcedure
      .input(z.object({ dealerId: z.number() }))
      .query(async ({ input }) => getDealerDashboard(input.dealerId)),

    myVehicles: protectedProcedure
      .input(z.object({ dealerId: z.number() }))
      .query(async ({ input }) => getVehicles({ dealerId: input.dealerId, limit: 100, offset: 0 })),

    myInquiries: protectedProcedure
      .input(z.object({ dealerId: z.number() }))
      .query(async ({ input }) => getInquiriesByDealer(input.dealerId)),

    updateDealer: protectedProcedure
      .input(z.object({
        dealerId: z.number(),
        name: z.string().optional(),
        bio: z.string().optional(),
        phone: z.string().optional(),
        whatsapp: z.string().optional(),
        email: z.string().email().optional(),
        address: z.string().optional(),
        workingHours: z.string().optional(),
        workingHoursDetail: z.string().optional(),
        logo: z.string().optional(),
        cover: z.string().optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
        instagram: z.string().optional(),
        twitter: z.string().optional(),
        snapchat: z.string().optional(),
        tiktok: z.string().optional(),
        website: z.string().optional(),
        brands: z.string().optional(),
        city: z.string().optional(),
        neighborhood: z.string().optional(),
        dealerType: z.enum(["sell", "buy", "both"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { dealerId, ...data } = input;
        await updateDealer(dealerId, data);
        return { success: true };
      }),
  }),

  admin: router({
    stats: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') throw new Error('Forbidden');
        return getAdminStatsExtended();
      }),

    dealers: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') throw new Error('Forbidden');
        return getAllDealersAdmin();
      }),

    verifyDealer: protectedProcedure
      .input(z.object({ id: z.number(), isVerified: z.boolean() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') throw new Error('Forbidden');
        await verifyDealer(input.id, input.isVerified);
        return { success: true };
      }),

    updateDealerStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "active", "suspended", "rejected"]),
        rejectionReason: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') throw new Error('Forbidden');
        await updateDealerStatus(input.id, input.status, input.rejectionReason ?? null);
        return { success: true };
      }),

    updatePlan: protectedProcedure
      .input(z.object({ id: z.number(), plan: z.enum(["free", "basic", "pro", "premium"]) }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') throw new Error('Forbidden');
        await updateDealerPlan(input.id, input.plan);
        return { success: true };
      }),

    deleteDealer: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') throw new Error('Forbidden');
        await deleteDealer(input.id);
        return { success: true };
      }),

    allUsers: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') throw new Error('Forbidden');
        return getAllUsers(200);
      }),

    updateUserRole: protectedProcedure
      .input(z.object({ id: z.number(), role: z.enum(["user", "admin"]) }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') throw new Error('Forbidden');
        await updateUserRole(input.id, input.role);
        return { success: true };
      }),

    allVehicles: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') throw new Error('Forbidden');
        return getVehicles({ limit: 200, offset: 0 });
      }),

    allInquiries: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') throw new Error('Forbidden');
        return getAllInquiriesAdmin();
      }),

    contactMessages: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') throw new Error('Forbidden');
        return getAllContactMessagesAdmin();
      }),

    updateContactStatus: protectedProcedure
      .input(z.object({ id: z.number(), status: z.enum(['new', 'read', 'replied']) }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') throw new Error('Forbidden');
        await updateContactMessageStatus(input.id, input.status);
        return { success: true };
      }),

    vehicleRequests: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') throw new Error('Forbidden');
        return getAllVehicleRequestsAdmin();
      }),

    allReviews: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') throw new Error('Forbidden');
        return getAllReviewsAdmin();
      }),

    deleteReview: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') throw new Error('Forbidden');
        await deleteReview(input.id);
        return { success: true };
      }),
  }),
  notifications: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return getNotificationsByUser(ctx.user.id, 30);
      }),

    unreadCount: protectedProcedure
      .query(async ({ ctx }) => {
        const count = await getUnreadNotificationCount(ctx.user.id);
        return { count };
      }),

    markRead: protectedProcedure
      .input(z.object({ ids: z.array(z.number()).optional() }))
      .mutation(async ({ input, ctx }) => {
        await markNotificationsRead(ctx.user.id, input.ids);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
