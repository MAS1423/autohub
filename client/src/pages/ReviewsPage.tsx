// AutoHub Reviews Page — Full review system
import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { Star, ChevronLeft, BadgeCheck, ThumbsUp } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { DEALERS } from '@/lib/data';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { startLogin } from '@/const';
import { toast } from 'sonner';

export default function ReviewsPage() {
  const params = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Try DB first, fallback to static
  const { data: dbDealer } = trpc.dealers.bySlug.useQuery({ slug: params.slug || '' });
  const staticDealer = DEALERS.find(d => d.slug === params.slug);
  const dealer = dbDealer || staticDealer;

  const { data: reviewsData, refetch } = trpc.reviews.byDealer.useQuery(
    { dealerId: typeof dealer?.id === 'number' ? dealer.id : 0 },
    { enabled: !!dealer?.id }
  );

  const createReviewMutation = trpc.reviews.create.useMutation({
    onSuccess: () => {
      toast.success('تم إرسال تقييمك بنجاح! شكراً لمشاركتك.');
      setSelectedRating(0);
      setComment('');
      refetch();
    },
    onError: (err: { message: string }) => {
      toast.error(err.message || 'حدث خطأ أثناء إرسال التقييم');
    },
  });

  const handleSubmit = async () => {
    if (!user) { startLogin(); return; }
    if (!selectedRating) { toast.error('يرجى اختيار تقييم من 1 إلى 5 نجوم'); return; }
    if (typeof dealer?.id !== 'number') { toast.error('المعرض غير موجود'); return; }
    setSubmitting(true);
    try {
      await createReviewMutation.mutateAsync({ dealerId: dealer.id as number, rating: selectedRating, comment: comment || undefined });
    } finally {
      setSubmitting(false);
    }
  };

  if (!dealer) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">المعرض غير موجود</h2>
          <button onClick={() => navigate('/dealers')} className="btn-gold px-6 py-2.5 mt-4">العودة للمعارض</button>
        </div>
      </div>
    );
  }

  const avgRating = reviewsData?.rating?.avg || 0;
  const reviewCount = reviewsData?.rating?.count || 0;
  const reviews = reviewsData?.reviews || [];

  const ratingLabels: Record<number, string> = { 1: 'سيء', 2: 'مقبول', 3: 'جيد', 4: 'ممتاز', 5: 'رائع جداً' };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      <div className="pt-16">
        {/* Hero */}
        <div className="autohub-dark py-12 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: 'repeating-linear-gradient(45deg, oklch(0.72 0.18 55) 0, oklch(0.72 0.18 55) 1px, transparent 0, transparent 50%)', backgroundSize: '20px 20px' }} />
          <div className="container relative z-10">
            <button onClick={() => navigate(`/dealer/${dealer.slug}`)}
              className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm mb-4 transition-colors font-bold">
              <ChevronLeft size={14} className="rotate-180" /> العودة لملف المعرض
            </button>
            <div className="flex items-center gap-4">
              <img src={dealer.logo ?? undefined} alt={dealer.name ?? ''} className="w-14 h-14 object-cover border-2 border-[oklch(0.72_0.18_55)]"
                style={{ clipPath: 'polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 5px 100%, 0 calc(100% - 5px))' }} />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-white">{dealer.name}</h1>
                  {dealer.isVerified && <BadgeCheck size={16} className="text-emerald-400" />}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} size={14} className={i <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-white/20'} />
                    ))}
                  </div>
                  <span className="text-white font-data font-black">{avgRating > 0 ? avgRating.toFixed(1) : '—'}</span>
                  <span className="text-white/40 text-sm font-body">({reviewCount} تقييم)</span>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-8" style={{ background: 'oklch(0.97 0.003 80)', clipPath: 'polygon(0 100%, 100% 0, 100% 100%)' }} />
        </div>

        <div className="container py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Write Review */}
            <div className="lg:col-span-1">
              <div className="border border-border bg-card p-6 sticky top-24"
                style={{ clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))' }}>
                <h3 className="font-black text-lg mb-4">أضف تقييمك</h3>
                {!user && (
                  <div className="mb-4 p-3 bg-secondary text-sm font-body text-center">
                    <p className="mb-2 text-muted-foreground">يجب تسجيل الدخول لإضافة تقييم</p>
                    <button onClick={() => startLogin()} className="btn-gold px-6 py-2 text-sm font-bold">تسجيل الدخول</button>
                  </div>
                )}
                <div className="mb-4">
                  <p className="text-xs font-bold tracking-wider uppercase text-muted-foreground mb-2">التقييم *</p>
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4,5].map(i => (
                      <button key={i}
                        onMouseEnter={() => setHoverRating(i)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setSelectedRating(i)}
                        className="transition-transform hover:scale-110">
                        <Star size={28} className={i <= (hoverRating || selectedRating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
                      </button>
                    ))}
                  </div>
                  {(hoverRating || selectedRating) > 0 && (
                    <p className="text-sm font-bold" style={{ color: 'oklch(0.72 0.18 55)' }}>
                      {ratingLabels[hoverRating || selectedRating]}
                    </p>
                  )}
                </div>
                <div className="mb-4">
                  <p className="text-xs font-bold tracking-wider uppercase text-muted-foreground mb-2">تعليقك (اختياري)</p>
                  <textarea value={comment} onChange={e => setComment(e.target.value)}
                    placeholder="شاركنا تجربتك مع هذا المعرض..."
                    rows={4} disabled={!user}
                    className="w-full border border-border bg-secondary p-3 text-sm focus:outline-none focus:border-[oklch(0.72_0.18_55)] resize-none font-body transition-colors disabled:opacity-50" />
                </div>
                <button onClick={handleSubmit} disabled={!user || submitting || !selectedRating}
                  className="btn-gold w-full py-3 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  {submitting ? 'جاري الإرسال...' : 'إرسال التقييم'}
                </button>
              </div>
            </div>

            {/* Reviews List */}
            <div className="lg:col-span-2">
              {/* Summary */}
              {reviewCount > 0 && (
                <div className="border border-border bg-card p-6 mb-6 flex items-center gap-6"
                  style={{ clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)' }}>
                  <div className="text-center flex-shrink-0">
                    <div className="text-5xl font-black font-data" style={{ color: 'oklch(0.72 0.18 55)' }}>{avgRating.toFixed(1)}</div>
                    <div className="flex gap-0.5 justify-center my-1">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} size={14} className={i <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground font-body">{reviewCount} تقييم</p>
                  </div>
                  <div className="flex-1">
                    {[5,4,3,2,1].map(star => {
                      const count = reviews.filter((r: { rating: number }) => r.rating === star).length;
                      const pct = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs font-bold w-3">{star}</span>
                          <Star size={10} className="fill-amber-400 text-amber-400 flex-shrink-0" />
                          <div className="flex-1 h-1.5 bg-secondary overflow-hidden">
                            <div className="h-full transition-all" style={{ width: `${pct}%`, background: 'oklch(0.72 0.18 55)' }} />
                          </div>
                          <span className="text-xs text-muted-foreground w-5">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Reviews */}
              <div className="space-y-4">
              {reviews.length > 0 ? reviews.map(review => (
                  <div key={(review as any).id} className="border border-border bg-card p-5"
                    style={{ clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))' }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 flex items-center justify-center font-black text-sm"
                          style={{ background: 'oklch(0.72 0.18 55)', color: 'oklch(0.10 0.01 260)', clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))' }}>
                          {((review as any).userName || 'م')?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{(review as any).userName || 'مستخدم'}</p>
                          <p className="text-xs text-muted-foreground font-body">
                            {new Date((review as any).createdAt).toLocaleDateString('ar-SA')}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} size={13} className={i <= (review as any).rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
                        ))}
                      </div>
                    </div>
                    {(review as any).comment && <p className="text-sm text-muted-foreground font-body leading-relaxed">{String((review as any).comment)}</p>}
                    <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                      <ThumbsUp size={11} />
                      <span className="font-body">مفيد</span>
                    </div>
                  </div>
                )) : (
                  <div className="border border-border bg-card p-10 text-center"
                    style={{ clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))' }}>
                    <Star size={36} className="mx-auto text-muted-foreground/20 mb-3" />
                    <p className="font-bold mb-1">لا توجد تقييمات بعد</p>
                    <p className="text-sm text-muted-foreground font-body">كن أول من يقيّم هذا المعرض!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
