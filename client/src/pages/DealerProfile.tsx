// AutoHub Dealer Profile — Precision Automotive Design
// Fully connected to database via tRPC
import { useParams, useLocation } from 'wouter';
import { useState } from 'react';
import { Star, MapPin, Car, Phone, MessageCircle, BadgeCheck, Clock, Eye, ChevronLeft, Share2, Gauge, Instagram, Twitter, Globe, Send } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';

export default function DealerProfile() {
  const params = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const { t, isRTL } = useI18n();
  const [activeTab, setActiveTab] = useState<'vehicles' | 'about' | 'reviews'>('vehicles');
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({ name: '', phone: '', message: '' });
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');

  // Fetch dealer from DB
  const { data: dealer, isLoading: dealerLoading } = trpc.dealers.bySlug.useQuery(
    { slug: params.slug || '' },
    { enabled: !!params.slug }
  );

  // Fetch vehicles for this dealer
  const { data: vehiclesData, isLoading: vehiclesLoading } = trpc.vehicles.list.useQuery(
    { dealerId: dealer?.id, limit: 50 },
    { enabled: !!dealer?.id }
  );

  // Fetch reviews for this dealer
  const { data: reviewsData, refetch: refetchReviews } = trpc.reviews.byDealer.useQuery(
    { dealerId: dealer?.id ?? 0 },
    { enabled: !!dealer?.id }
  );

  const inquiryMutation = trpc.inquiries.create.useMutation({
    onSuccess: () => {
      toast.success('تم إرسال استفسارك بنجاح! سيتواصل معك المعرض قريباً.');
      setInquiryForm({ name: '', phone: '', message: '' });
      setInquiryOpen(false);
    },
    onError: (err) => toast.error(err.message || 'حدث خطأ أثناء الإرسال'),
  });

  const reviewMutation = trpc.reviews.create.useMutation({
    onSuccess: () => {
      toast.success('شكراً! تم إرسال تقييمك بنجاح.');
      setNewRating(0);
      setReviewComment('');
      refetchReviews();
    },
    onError: (err) => toast.error(err.message || 'حدث خطأ'),
  });

  const handleInquiry = () => {
    if (!inquiryForm.name.trim() || !inquiryForm.phone.trim() || !inquiryForm.message.trim()) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }
    if (!dealer?.id) return;
    inquiryMutation.mutate({
      dealerId: dealer.id,
      name: inquiryForm.name,
      phone: inquiryForm.phone,
      message: inquiryForm.message,
    });
  };

  const handleReview = () => {
    if (!newRating) { toast.error('يرجى اختيار تقييم'); return; }
    if (!dealer?.id) return;
    reviewMutation.mutate({ dealerId: dealer.id, rating: newRating, comment: reviewComment || undefined });
  };

  // Loading state
  if (dealerLoading) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <Header />
        <div className="pt-16">
          <div className="h-72 bg-secondary animate-pulse" />
          <div className="container py-8">
            <div className="h-40 bg-secondary animate-pulse rounded-xl mb-6" />
            <div className="grid grid-cols-3 gap-5">
              {[1,2,3].map(i => <div key={i} className="h-64 bg-secondary animate-pulse rounded-xl" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not found
  if (!dealer) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">{t('dealer_not_found')}</h2>
          <button onClick={() => navigate('/dealers')} className="btn-gold px-6 py-2.5 mt-4">{t('back_to_dealers')}</button>
        </div>
      </div>
    );
  }

  const dealerVehicles = vehiclesData ?? [];
  const reviews = reviewsData?.reviews ?? [];
  const avgRating = reviewsData?.rating?.avg ?? 0;
  const reviewCount = reviewsData?.rating?.count ?? 0;

  // Parse brands from JSON string
  let brands: string[] = [];
  try { brands = JSON.parse((dealer as any).brands || '[]'); } catch { brands = []; }

  // Parse social links
  const instagram = (dealer as any).instagram;
  const twitter = (dealer as any).twitter;
  const website = (dealer as any).website;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      <div className="pt-16">
        {/* Cover Hero */}
        <div className="relative h-72 md:h-96 overflow-hidden">
          {(dealer as any).cover ? (
            <img src={(dealer as any).cover} alt={dealer.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-800" />
          )}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, oklch(0.10 0.01 260) 0%, oklch(0.10 0.01 260 / 0.5) 50%, transparent 100%)' }} />
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-background" style={{ clipPath: 'polygon(0 100%, 100% 0, 100% 100%)' }} />
          <button onClick={() => navigate('/dealers')}
            className="absolute top-6 right-6 flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-bold px-4 py-2 transition-colors border border-white/20 backdrop-blur-sm"
            style={{ background: 'oklch(0 0 0 / 0.35)', clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))' }}>
            <ChevronLeft size={14} className="rotate-180" />
            العودة
          </button>
          <button onClick={() => { navigator.clipboard?.writeText(window.location.href); toast.success('تم نسخ الرابط'); }}
            className="absolute top-6 left-6 text-white/60 hover:text-white transition-colors p-2 border border-white/15 backdrop-blur-sm"
            style={{ background: 'oklch(0 0 0 / 0.35)', clipPath: 'polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 5px 100%, 0 calc(100% - 5px))' }}>
            <Share2 size={16} />
          </button>
        </div>

        <div className="container">
          {/* Profile Header Card */}
          <div className="relative -mt-8 mb-8">
            <div className="border border-border bg-card p-6 shadow-lg" style={{ clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))' }}>
              <div className="flex flex-col md:flex-row gap-5 items-start">
                {/* Logo */}
                <div className="w-20 h-20 overflow-hidden border-2 flex-shrink-0 bg-white"
                  style={{ borderColor: 'oklch(0.72 0.18 55)', clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}>
                  {(dealer as any).logo ? (
                    <img src={(dealer as any).logo} alt={dealer.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <Car size={28} className="text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h1 className="text-2xl font-black">{dealer.name}</h1>
                    {dealer.isVerified && (
                      <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5"
                        style={{ background: 'oklch(0.35 0.12 155 / 0.12)', border: '1px solid oklch(0.55 0.15 155 / 0.35)', color: 'oklch(0.45 0.15 155)' }}>
                        <BadgeCheck size={11} /> موثق
                      </span>
                    )}
                    {dealer.plan !== 'free' && (
                      <span className="gold-badge">★ {dealer.plan === 'premium' ? 'مميز' : dealer.plan === 'pro' ? 'احترافي' : 'أساسي'}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-3">
                    <MapPin size={13} />
                    <span>{dealer.city}{(dealer as any).neighborhood ? ` — ${(dealer as any).neighborhood}` : ''}</span>
                  </div>
                  {brands.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {brands.map((b: string) => (
                        <span key={b} className="text-xs px-2.5 py-1 font-bold border border-border bg-secondary"
                          style={{ clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))' }}>
                          {b}
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Stats Row */}
                  <div className="flex flex-wrap gap-5 text-sm">
                    <div className="flex items-center gap-1.5">
                      <Star size={13} className="fill-amber-400 text-amber-400" />
                      <strong className="font-data">{Number(avgRating).toFixed(1)}</strong>
                      <span className="text-muted-foreground text-xs">({reviewCount} تقييم)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Car size={13} />
                      <span className="font-data font-bold">{dealerVehicles.length}</span>
                      <span className="text-xs">سيارة</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Eye size={13} />
                      <span className="font-data font-bold">{(dealer.views ?? 0).toLocaleString('ar-SA')}</span>
                      <span className="text-xs">مشاهدة</span>
                    </div>
                    {(dealer as any).workingHours && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock size={13} />
                        <span className="text-xs">{(dealer as any).workingHours}</span>
                      </div>
                    )}
                  </div>
                  {/* Social links */}
                  {(instagram || twitter || website) && (
                    <div className="flex gap-3 mt-3">
                      {instagram && (
                        <a href={`https://instagram.com/${instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-pink-400 transition-colors"><Instagram size={16} /></a>
                      )}
                      {twitter && (
                        <a href={`https://x.com/${twitter.replace('@','')}`} target="_blank" rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-blue-400 transition-colors"><Twitter size={16} /></a>
                      )}
                      {website && (
                        <a href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-[oklch(0.72_0.18_55)] transition-colors"><Globe size={16} /></a>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 flex-shrink-0 w-full md:w-44">
                  {dealer.whatsapp && (
                    <a href={`https://wa.me/${dealer.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-5 py-3 text-white font-bold text-sm transition-colors"
                      style={{ background: 'oklch(0.52 0.18 155)', clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}>
                      <MessageCircle size={15} /> واتساب
                    </a>
                  )}
                  {dealer.phone && (
                    <a href={`tel:${dealer.phone}`}
                      className="flex items-center justify-center gap-2 px-5 py-3 border border-border bg-secondary hover:bg-muted font-bold text-sm transition-colors"
                      style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}>
                      <Phone size={15} /> اتصال
                    </a>
                  )}
                  <button onClick={() => setInquiryOpen(true)}
                    className="btn-gold px-5 py-3 text-sm font-bold">
                    إرسال استفسار
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 mb-8 border-b border-border">
            {[
              { key: 'vehicles', label: `السيارات (${dealerVehicles.length})` },
              { key: 'about', label: 'عن المعرض' },
              { key: 'reviews', label: `التقييمات (${reviewCount})` },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                className={`px-6 py-3.5 text-sm font-bold border-b-2 transition-all ${
                  activeTab === tab.key
                    ? 'border-[oklch(0.72_0.18_55)] text-[oklch(0.50_0.16_55)]'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Vehicles Tab */}
          {activeTab === 'vehicles' && (
            <div className="pb-16">
              {vehiclesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[1,2,3].map(i => <div key={i} className="h-64 bg-secondary animate-pulse rounded-xl" />)}
                </div>
              ) : dealerVehicles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {dealerVehicles.map((v: any) => {
                    let images: string[] = [];
                    try { images = JSON.parse(v.images || '[]'); } catch { images = []; }
                    return (
                      <div key={v.id} className="autohub-card overflow-hidden cursor-pointer group"
                        onClick={() => navigate(`/vehicle/${v.id}`)}>
                        <div className="relative h-48 overflow-hidden bg-gray-100">
                          {images[0] ? (
                            <img src={images[0]} alt={`${v.brand} ${v.model}`}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-800">
                              <Car size={40} className="text-gray-600" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                          <div className="absolute top-3 right-3">
                            <span className={`text-xs font-bold px-2.5 py-1 ${v.condition === 'new' ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'}`}
                              style={{ clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))' }}>
                              {v.condition === 'new' ? 'جديد' : 'مستعمل'}
                            </span>
                          </div>
                          {v.condition === 'used' && v.mileage > 0 && (
                            <div className="absolute bottom-3 left-3 flex items-center gap-1 text-white/80 text-xs">
                              <Gauge size={10} />
                              {Number(v.mileage).toLocaleString('ar-SA')} كم
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-base mb-2">{v.brand} {v.model} {v.year}</h3>
                          <div className="flex items-center justify-between">
                            <span className="text-xl font-black font-data" style={{ color: 'oklch(0.72 0.18 55)' }}>
                              {Number(v.price).toLocaleString('ar-SA')} <span className="text-sm font-bold">ر.س</span>
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Eye size={10} /> {v.views ?? 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <Car size={40} className="mx-auto mb-3 opacity-20" />
                  <p className="font-body">لا توجد سيارات مدرجة حالياً</p>
                </div>
              )}
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="pb-16 max-w-2xl">
              <div className="border border-border bg-card p-6"
                style={{ clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)' }}>
                <h3 className="font-bold text-lg mb-3">عن المعرض</h3>
                <p className="text-muted-foreground leading-relaxed font-body">{dealer.bio || 'لا توجد نبذة تعريفية بعد.'}</p>
                <div className="mt-6 pt-6 border-t border-border grid grid-cols-2 gap-6">
                  {(dealer as any).workingHours && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 font-bold tracking-wider uppercase">ساعات العمل</p>
                      <p className="text-sm font-bold">{(dealer as any).workingHours}</p>
                    </div>
                  )}
                  {brands.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 font-bold tracking-wider uppercase">الماركات</p>
                      <p className="text-sm font-bold">{brands.join('، ')}</p>
                    </div>
                  )}
                  {dealer.phone && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 font-bold tracking-wider uppercase">الهاتف</p>
                      <p className="text-sm font-bold">{dealer.phone}</p>
                    </div>
                  )}
                  {(dealer as any).address && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 font-bold tracking-wider uppercase">العنوان</p>
                      <p className="text-sm font-bold">{(dealer as any).address}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className="pb-16 max-w-2xl space-y-5">
              {/* Rating Summary */}
              <div className="border border-border bg-card p-6 text-center"
                style={{ clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))' }}>
                <div className="text-6xl font-black font-data mb-2" style={{ color: 'oklch(0.72 0.18 55)' }}>
                  {Number(avgRating).toFixed(1)}
                </div>
                <div className="flex justify-center gap-1 mb-3">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} size={22} className={i <= Math.round(Number(avgRating)) ? 'fill-amber-400 text-amber-400' : 'text-gray-600'} />
                  ))}
                </div>
                <p className="text-muted-foreground text-sm font-body">بناءً على {reviewCount} تقييم</p>
              </div>

              {/* Add Review Form */}
              <div className="border border-border bg-card p-5"
                style={{ clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))' }}>
                <h4 className="font-bold mb-3 text-sm">أضف تقييمك</h4>
                <div className="flex gap-1 mb-3">
                  {[1,2,3,4,5].map(i => (
                    <button key={i}
                      onMouseEnter={() => setHoverRating(i)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setNewRating(i)}
                      className="transition-transform hover:scale-110">
                      <Star size={26} className={i <= (hoverRating || newRating) ? 'fill-amber-400 text-amber-400' : 'text-gray-600'} />
                    </button>
                  ))}
                </div>
                <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)}
                  placeholder="اكتب تعليقك (اختياري)..."
                  rows={3}
                  className="w-full border border-border p-3 text-sm bg-secondary focus:outline-none focus:border-[oklch(0.72_0.18_55)] resize-none font-body transition-colors rounded-lg mb-3" />
                <button onClick={handleReview} disabled={reviewMutation.isPending}
                  className="btn-gold px-6 py-2.5 text-sm font-bold flex items-center gap-2">
                  {reviewMutation.isPending ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" /> : <Send size={14} />}
                  إرسال التقييم
                </button>
              </div>

              {/* Reviews List */}
              {reviews.length > 0 ? (
                <div className="space-y-3">
                  {reviews.map((r: any) => (
                    <div key={r.id} className="border border-border bg-card p-4"
                      style={{ clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                          {r.userName?.[0] ?? '؟'}
                        </div>
                        <div>
                          <p className="text-sm font-bold">{r.userName ?? 'مستخدم'}</p>
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(i => (
                              <Star key={i} size={11} className={i <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-600'} />
                            ))}
                          </div>
                        </div>
                      </div>
                      {r.comment && <p className="text-sm text-muted-foreground font-body">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground text-sm py-6">لا توجد تقييمات بعد. كن أول من يقيّم!</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Inquiry Modal */}
      {inquiryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'oklch(0 0 0 / 0.6)' }} onClick={() => setInquiryOpen(false)}>
          <div className="bg-card border border-border p-6 w-full max-w-md shadow-2xl"
            style={{ clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))' }}
            onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-1">إرسال استفسار</h3>
            <p className="text-sm text-muted-foreground mb-4 font-body">لـ {dealer.name}</p>
            <div className="space-y-3">
              <input value={inquiryForm.name} onChange={e => setInquiryForm(p => ({ ...p, name: e.target.value }))}
                placeholder="اسمك الكريم *"
                className="w-full border border-border p-3 text-sm bg-secondary focus:outline-none focus:border-[oklch(0.72_0.18_55)] transition-colors rounded-lg" />
              <input value={inquiryForm.phone} onChange={e => setInquiryForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="رقم الجوال *"
                className="w-full border border-border p-3 text-sm bg-secondary focus:outline-none focus:border-[oklch(0.72_0.18_55)] transition-colors rounded-lg" />
              <textarea value={inquiryForm.message} onChange={e => setInquiryForm(p => ({ ...p, message: e.target.value }))}
                placeholder="اكتب استفسارك هنا... *"
                rows={4}
                className="w-full border border-border p-3 text-sm bg-secondary focus:outline-none focus:border-[oklch(0.72_0.18_55)] resize-none font-body transition-colors rounded-lg" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleInquiry} disabled={inquiryMutation.isPending}
                className="btn-gold flex-1 py-3 font-bold text-sm flex items-center justify-center gap-2">
                {inquiryMutation.isPending ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" /> : null}
                إرسال
              </button>
              <button onClick={() => setInquiryOpen(false)} className="flex-1 py-3 border border-border text-sm font-semibold hover:bg-secondary transition-colors">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
