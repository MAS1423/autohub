import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Car, CheckCircle2, ClipboardList, Heart, Mail, MessageSquareText, Phone, Save, Send, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/_core/hooks/useAuth';
import { useFavorites } from '@/contexts/FavoritesContext';
import { trpc } from '@/lib/trpc';

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat('ar-SA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function formatMoney(value: number | null | undefined) {
  return value ? `${value.toLocaleString('en-US')} ر.س` : 'غير محددة';
}

export default function UserDashboard() {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const { favorites, vehicleFavorites, dealerFavorites } = useFavorites();
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = trpc.auth.profile.useQuery(undefined, { enabled: isAuthenticated });
  const { data: requests = [], isLoading: requestsLoading, refetch: refetchRequests } = trpc.customer.requests.useQuery(undefined, { enabled: isAuthenticated });
  const [form, setForm] = useState({ name: '', whatsapp: '', email: '' });

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate('/login?redirect=%2Faccount');
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    if (profile) setForm({ name: profile.name ?? '', whatsapp: profile.whatsapp ?? '', email: profile.email ?? '' });
  }, [profile]);

  const updateProfile = trpc.auth.updateProfile.useMutation({
    onSuccess: async () => {
      await refetchProfile();
      toast.success('تم حفظ بيانات حسابك بنجاح');
    },
    onError: error => toast.error(error.message || 'تعذر حفظ بيانات الحساب'),
  });

  const requestSummary = useMemo(() => ({
    total: requests.length,
    distributed: requests.filter((request: any) => request.status === 'distributed').length,
  }), [requests]);

  if (loading || (isAuthenticated && profileLoading)) {
    return <div className="min-h-screen bg-[#08090b] text-white"><Header /><div className="flex min-h-[70vh] items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-2 border-[#C9A84C] border-t-transparent" /></div></div>;
  }

  if (!isAuthenticated) return null;

  const saveProfile = (event: React.FormEvent) => {
    event.preventDefault();
    if (form.name.trim().length < 2 || form.whatsapp.replace(/[\s()-]/g, '').length < 9) {
      toast.error('الاسم ورقم واتساب صحيح مطلوبان.');
      return;
    }
    updateProfile.mutate({
      name: form.name.trim(),
      whatsapp: form.whatsapp.replace(/[\s()-]/g, '').trim(),
      email: form.email.trim(),
    });
  };

  return (
    <div className="min-h-screen bg-[#08090b] text-white" dir="rtl">
      <Header />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-28">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_85%_20%,rgba(201,168,76,.25),transparent_32%),linear-gradient(135deg,#151a22,#090b10)] p-6 md:p-10">
          <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(45deg, #d6b55b 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><div className="inline-flex items-center gap-2 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-3 py-1 text-xs font-black text-[#efd981]"><UserRound size={14} /> حساب العميل</div><h1 className="mt-4 text-3xl font-black md:text-4xl">مرحبًا {profile?.name || 'بك'}</h1><p className="mt-3 max-w-xl text-sm leading-7 text-white/60">هنا تجد بيانات التواصل وطلبات السيارات التي أرسلتها ومفضلتك في مكان واحد.</p></div><Link href="/vehicle-request" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C9A84C] px-5 py-3 text-sm font-black text-black transition hover:bg-[#e3c56e]"><Send size={16} /> إرسال طلب سيارة</Link></div>
        </section>

        <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: 'الطلبات المرسلة', value: requestSummary.total, icon: ClipboardList, color: 'text-[#ecd57f]' },
            { label: 'طلبات موزعة', value: requestSummary.distributed, icon: CheckCircle2, color: 'text-emerald-300' },
            { label: 'سيارات مفضلة', value: vehicleFavorites.length, icon: Car, color: 'text-sky-300' },
            { label: 'معارض مفضلة', value: dealerFavorites.length, icon: Heart, color: 'text-rose-300' },
          ].map(card => <div key={card.label} className="rounded-2xl border border-white/10 bg-[#11151c] p-4"><card.icon className={card.color} size={21} /><p className="mt-4 text-3xl font-black">{card.value}</p><p className="mt-1 text-xs font-bold text-white/45">{card.label}</p></div>)}
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[.82fr_1.18fr]">
          <form onSubmit={saveProfile} className="rounded-3xl border border-white/10 bg-[#11151c] p-5 md:p-7">
            <div className="flex items-start gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#C9A84C] text-black"><UserRound size={21} /></div><div><h2 className="text-xl font-black">بياناتي</h2><p className="mt-1 text-sm text-white/50">الاسم والواتساب مطلوبان حتى تستقبل عروض المعارض.</p></div></div>
            <label className="mt-6 block"><span className="mb-2 block text-xs font-bold text-white/55">الاسم <span className="text-rose-300">*</span></span><input value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} className="h-12 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm font-bold text-white outline-none focus:border-[#C9A84C]" /></label>
            <label className="mt-4 block"><span className="mb-2 flex items-center gap-1 text-xs font-bold text-white/55"><Phone size={13} /> رقم واتساب <span className="text-rose-300">*</span></span><input value={form.whatsapp} onChange={event => setForm(current => ({ ...current, whatsapp: event.target.value }))} type="tel" dir="ltr" placeholder="05xxxxxxxx" className="h-12 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm font-bold text-white outline-none focus:border-[#C9A84C]" /></label>
            <label className="mt-4 block"><span className="mb-2 flex items-center gap-1 text-xs font-bold text-white/55"><Mail size={13} /> البريد الإلكتروني <span className="text-white/35">(اختياري)</span></span><input value={form.email} onChange={event => setForm(current => ({ ...current, email: event.target.value }))} type="email" dir="ltr" placeholder="name@email.com" className="h-12 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm font-bold text-white outline-none focus:border-[#C9A84C]" /></label>
            <button disabled={updateProfile.isPending} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#C9A84C] px-5 py-3.5 text-sm font-black text-black transition hover:bg-[#e3c56e] disabled:opacity-60"><Save size={16} /> {updateProfile.isPending ? 'جارٍ الحفظ...' : 'حفظ بياناتي'}</button>
          </form>

          <div className="rounded-3xl border border-white/10 bg-[#11151c] p-5 md:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-start gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#C9A84C] text-black"><MessageSquareText size={21} /></div><div><h2 className="text-xl font-black">طلباتي المرسلة</h2><p className="mt-1 text-sm text-white/50">تظهر هنا نسخة أصلية من كل طلب أرسلته إلى المعارض.</p></div></div><Link href="/vehicle-request" className="rounded-xl border border-[#C9A84C]/35 px-4 py-2 text-xs font-black text-[#ecd57f] hover:bg-[#C9A84C]/10">طلب جديد</Link></div>
            {requestsLoading ? <div className="mt-6 space-y-3">{[1, 2].map(item => <div key={item} className="h-28 animate-pulse rounded-2xl bg-white/[0.04]" />)}</div> : requests.length === 0 ? <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-black/15 p-8 text-center"><ClipboardList className="mx-auto text-white/25" size={36} /><h3 className="mt-4 font-black">لا توجد طلبات مرسلة حتى الآن</h3><p className="mt-2 text-sm text-white/45">أرسل طلبك الأول وسنحتفظ به هنا للمتابعة.</p><Link href="/vehicle-request" className="mt-5 inline-flex rounded-xl bg-[#C9A84C] px-4 py-2.5 text-sm font-black text-black">إرسال طلب سيارة</Link></div> : <div className="mt-6 space-y-3">{requests.map((request: any) => { const models = Array.isArray(request.models) ? request.models : (() => { try { return JSON.parse(request.models || '[]'); } catch { return []; } })(); return <article key={request.id} className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><span className="font-data text-sm font-black text-[#edda91]">{request.requestCode}</span><span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-black text-emerald-200">تم التوزيع</span></div><h3 className="mt-2 font-black">{[request.brand, models.join('، '), request.trim].filter(Boolean).join(' — ') || 'طلب سيارة'}</h3></div><p className="text-xs text-white/45">{formatDate(request.createdAt)}</p></div><p className="mt-3 line-clamp-2 text-sm leading-7 text-white/65">{request.message}</p><div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="rounded-lg border border-white/10 px-2.5 py-1 text-white/60">{request.matchedDealers} معرضًا مستهدفًا</span>{request.minYear && <span className="rounded-lg border border-white/10 px-2.5 py-1 text-white/60">موديل {request.minYear}</span>}{(request.targetPrice || request.maxPrice) && <span className="rounded-lg border border-white/10 px-2.5 py-1 text-white/60">{formatMoney(request.targetPrice || request.maxPrice)}</span>}</div></article>; })}</div>}
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-[#11151c] p-5 md:p-7"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="flex items-center gap-2 text-xl font-black"><Heart className="text-rose-300" size={21} /> مفضلتي</h2><p className="mt-1 text-sm text-white/50">مفضلتك محفوظة على هذا المتصفح وتظهر هنا لسهولة الرجوع إليها.</p></div><Link href="/favorites" className="rounded-xl border border-[#C9A84C]/35 px-4 py-2 text-xs font-black text-[#ecd57f] hover:bg-[#C9A84C]/10">فتح المفضلة</Link></div>{favorites.length === 0 ? <p className="mt-5 rounded-2xl bg-black/20 p-4 text-sm text-white/45">لم تحفظ أي سيارة أو معرض بعد.</p> : <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{favorites.slice(0, 6).map(item => <div key={`${item.type}-${item.id}`} className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-xs font-bold text-[#ecd57f]">{item.type === 'vehicle' ? 'سيارة محفوظة' : 'معرض محفوظ'}</p><p className="mt-2 line-clamp-1 font-black">{item.type === 'vehicle' ? `${item.data.brand ?? ''} ${item.data.model ?? ''}` : item.data.name ?? 'عنصر محفوظ'}</p></div>)}</div>}</section>
      </main>
      <Footer />
    </div>
  );
}
