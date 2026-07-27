import { useMemo, useState } from 'react';
import {
  Building2, Car, Check, CheckCircle2, CircleDollarSign, LockKeyhole,
  Mail, MessageSquareText, Phone, Send, ShieldCheck, Sparkles, Tag, UserRound, Users,
} from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import {
  BRAND_MODELS, MODEL_OPTIONS, TRIM_SUGGESTIONS, VEHICLE_BRANDS,
  VEHICLE_TYPES, formatSAR,
} from '@/lib/vehicleCatalog';

type RequestForm = {
  brand: string;
  bodyType: string;
  models: string[];
  trim: string;
  condition: '' | 'new' | 'used';
  minPrice: string;
  maxPrice: string;
  targetPrice: string;
  minYear: string;
  message: string;
  accepted: boolean;
};

type AccountForm = { name: string; whatsapp: string; email: string };

const INITIAL_FORM: RequestForm = {
  brand: '', bodyType: '', models: [], trim: '', condition: '',
  minPrice: '', maxPrice: '', targetPrice: '', minYear: '', message: '', accepted: false,
};

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 16 }, (_, index) => String(CURRENT_YEAR - index));

function positiveNumber(value: string): number | undefined {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : undefined;
}

export default function VehicleRequest() {
  const { isAuthenticated } = useAuth();
  const [form, setForm] = useState<RequestForm>(INITIAL_FORM);
  const [account, setAccount] = useState<AccountForm>({ name: '', whatsapp: '', email: '' });
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [success, setSuccess] = useState<{ code: string; count: number } | null>(null);
  const { data: profile, isLoading: profileLoading } = trpc.auth.profile.useQuery(undefined, { enabled: isAuthenticated });

  const models = useMemo(() => form.brand ? MODEL_OPTIONS(form.brand) : Object.values(BRAND_MODELS).flat().slice(0, 16), [form.brand]);
  const broadcast = trpc.vehicleRequests.broadcast.useMutation({
    onSuccess: result => {
      setSuccess({ code: result.requestCode, count: result.matchedDealers });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: error => toast.error(error.message || 'تعذر إرسال الطلب. يرجى المحاولة مرة أخرى.'),
  });

  function update<Key extends keyof RequestForm>(key: Key, value: RequestForm[Key]) {
    setForm(current => {
      const next = { ...current, [key]: value } as RequestForm;
      if (key === 'brand') next.models = [];
      return next;
    });
  }

  function toggleModel(model: string) {
    setForm(current => ({
      ...current,
      models: current.models.includes(model)
        ? current.models.filter(item => item !== model)
        : [...current.models, model].slice(0, 8),
    }));
  }

  async function createCustomerAccount() {
    const name = account.name.trim();
    const whatsapp = account.whatsapp.replace(/[\s()-]/g, '').trim();
    const email = account.email.trim();
    if (name.length < 2 || whatsapp.length < 9) {
      toast.error('الاسم ورقم واتساب صحيح مطلوبان لإرسال الطلب.');
      return;
    }
    setCreatingAccount(true);
    try {
      const response = await fetch('/api/auth/customer-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, whatsapp, email: email || undefined }),
      });
      const result = await response.json();
      if (!response.ok) {
        toast.error(result.error === 'Email already registered' ? 'هذا البريد مستخدم لحساب آخر.' : 'تعذر إنشاء الحساب. تحقق من البيانات وحاول مجددًا.');
        return;
      }
      toast.success('تم إنشاء حسابك بنجاح. يمكنك الآن إرسال الطلب.');
      window.location.reload();
    } catch {
      toast.error('تعذر الاتصال بخدمة التسجيل المحلية.');
    } finally {
      setCreatingAccount(false);
    }
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAuthenticated) {
      toast.error('سجّل بياناتك أولًا قبل إرسال طلب السيارة.');
      document.getElementById('request-account')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (!profile?.name || !profile?.whatsapp) {
      toast.error('أكمل الاسم ورقم واتساب في حسابك قبل الإرسال.');
      return;
    }
    const minPrice = positiveNumber(form.minPrice);
    const maxPrice = positiveNumber(form.maxPrice);
    if (!form.accepted) {
      toast.error('يرجى الموافقة على مشاركة طلبك مع المعارض المعتمدة.');
      return;
    }
    if (minPrice && maxPrice && minPrice > maxPrice) {
      toast.error('يرجى جعل السعر من أقل من أو يساوي السعر إلى.');
      return;
    }
    broadcast.mutate({
      brand: form.brand || undefined,
      bodyType: form.bodyType || undefined,
      models: form.models,
      trim: form.trim.trim() || undefined,
      condition: form.condition || undefined,
      minPrice,
      maxPrice,
      targetPrice: positiveNumber(form.targetPrice),
      minYear: positiveNumber(form.minYear),
      message: form.message.trim(),
    });
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#08090b] text-white" dir="rtl">
        <Header />
        <main className="relative flex min-h-[calc(100vh-180px)] items-center overflow-hidden px-4 py-28">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(201,168,76,.25),transparent_35%),linear-gradient(180deg,#12161d,#08090b)]" />
          <div className="relative mx-auto w-full max-w-2xl rounded-3xl border border-[#C9A84C]/35 bg-[#11151c]/95 p-7 text-center shadow-2xl shadow-black/45 md:p-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-400 text-black shadow-[0_0_0_12px_rgba(74,222,128,.1)]"><CheckCircle2 size={42} /></div>
            <div className="mt-7 inline-flex rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-3 py-1 text-xs font-bold text-[#f0d886]">تم تسجيل طلبك في حسابك</div>
            <h1 className="mt-4 text-3xl font-black md:text-4xl">وصل طلبك إلى المعارض المعتمدة</h1>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-8 text-white/65">تم توزيع طلبك على <strong className="text-white">{success.count}</strong> معرضًا معتمدًا ونشطًا. يمكنك مراجعة تفاصيله في لوحة حسابك في أي وقت.</p>
            <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-white/10 bg-black/25 p-4"><p className="text-xs font-bold text-white/45">رقم الطلب</p><p className="mt-1 font-data text-xl font-black tracking-wider text-[#ebd47d]">{success.code}</p></div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center"><a href="/account" className="rounded-xl bg-[#C9A84C] px-6 py-3 text-sm font-black text-black transition hover:bg-[#e3c56e]">عرض طلباتي</a><button onClick={() => { setForm(INITIAL_FORM); setSuccess(null); }} className="rounded-xl border border-white/15 px-6 py-3 text-sm font-black text-white transition hover:border-[#C9A84C]/55 hover:text-[#ecd57f]">إرسال طلب آخر</button></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const accountReady = isAuthenticated && !!profile?.name && !!profile?.whatsapp;

  return (
    <div className="min-h-screen bg-[#08090b] text-white" dir="rtl">
      <Header />
      <main>
        <section className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_83%_20%,rgba(201,168,76,.24),transparent_30%),linear-gradient(180deg,#12161d,#08090b)] pt-28 pb-16">
          <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'linear-gradient(45deg, #d6b55b 1px, transparent 1px), linear-gradient(-45deg, #d6b55b 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
          <div className="relative mx-auto max-w-7xl px-4">
            <div className="max-w-3xl"><div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#C9A84C]/35 bg-[#C9A84C]/10 px-3 py-1.5 text-xs font-bold text-[#f0d886]"><Sparkles size={14} /> خدمة طلب السيارة الذكية</div><h1 className="text-4xl font-black leading-tight md:text-6xl">أرسل ما تريده، ودع المعارض تتواصل معك</h1><p className="mt-5 max-w-2xl text-base leading-8 text-white/65 md:text-lg">لحماية الطلبات وتحفظها في حسابك، يلزم إنشاء حساب بسيط بالاسم ورقم واتساب قبل الإرسال.</p></div>
            <div className="mt-10 grid grid-cols-1 gap-3 md:grid-cols-3"><div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[#C9A84C] text-black"><UserRound size={18} /></div><p className="font-black">1. أنشئ حسابًا بسيطًا</p><p className="mt-1 text-xs leading-6 text-white/50">الاسم وواتساب مطلوبان، والبريد اختياري.</p></div><div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[#C9A84C] text-black"><Users size={18} /></div><p className="font-black">2. نوزع الطلب بذكاء</p><p className="mt-1 text-xs leading-6 text-white/50">يصل الطلب إلى المعارض المعتمدة والنشطة فقط.</p></div><div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[#C9A84C] text-black"><Building2 size={18} /></div><p className="font-black">3. راجع طلباتك لاحقًا</p><p className="mt-1 text-xs leading-6 text-white/50">كل طلب محفوظ في لوحة حسابك مع رقم متابعة واضح.</p></div></div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12">
          <form onSubmit={submit} className="grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_.65fr]">
            <div className="rounded-3xl border border-white/10 bg-[#11151c] p-5 shadow-2xl shadow-black/25 md:p-7">
              <div className="mb-6 flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#C9A84C] text-black"><Car size={22} /></div><div><h2 className="text-2xl font-black">مواصفات السيارة المطلوبة</h2><p className="mt-1 text-sm text-white/50">لا يشترط ملء جميع الحقول؛ كل تفصيلة تضيفها تساعد المعارض على تقديم عرض أدق.</p></div></div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><label className="block"><span className="mb-2 block text-xs font-bold text-white/55">الماركة</span><select value={form.brand} onChange={event => update('brand', event.target.value)} className="h-12 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm font-bold text-white outline-none focus:border-[#C9A84C]"><option value="" className="bg-[#15191f]">أي ماركة</option>{VEHICLE_BRANDS.map(brand => <option key={brand} value={brand} className="bg-[#15191f]">{brand}</option>)}</select></label><label className="block"><span className="mb-2 flex items-center gap-1 text-xs font-bold text-white/55"><Car size={13} /> نوع الهيكل (اختياري)</span><select value={form.bodyType} onChange={event => update('bodyType', event.target.value)} className="h-12 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm font-bold text-white outline-none focus:border-[#C9A84C]"><option value="" className="bg-[#15191f]">أي نوع</option>{VEHICLE_TYPES.map(type => <option key={type} value={type} className="bg-[#15191f]">{type}</option>)}</select></label></div>
              <div className="mt-4 rounded-2xl border border-white/8 bg-black/20 p-4"><div className="mb-3 flex items-center justify-between"><div><p className="font-black">النوع / الطراز المطلوب</p><p className="mt-1 text-xs text-white/45">اختر أكثر من طراز إن رغبت.</p></div>{form.models.length > 0 && <button type="button" onClick={() => update('models', [])} className="text-xs font-bold text-[#e7ca72]">مسح</button>}</div><div className="flex flex-wrap gap-2">{models.map(model => { const selected = form.models.includes(model); return <button type="button" key={model} onClick={() => toggleModel(model)} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold transition ${selected ? 'border-[#C9A84C] bg-[#C9A84C] text-black' : 'border-white/12 bg-white/[0.03] text-white/65 hover:border-[#C9A84C]/55 hover:text-white'}`}>{selected && <Check size={13} />}{model}</button>; })}</div></div>
              <div className="mt-4"><label className="block"><span className="mb-2 flex items-center gap-1 text-xs font-bold text-white/55"><Tag size={13} /> الفئة / التجهيز</span><input list="request-trims" value={form.trim} onChange={event => update('trim', event.target.value)} placeholder="مثال: فل كامل أو GXR" className="h-12 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm font-bold text-white placeholder:text-white/30 outline-none focus:border-[#C9A84C]" /><datalist id="request-trims">{TRIM_SUGGESTIONS.map(trim => <option key={trim} value={trim} />)}</datalist></label></div>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3"><label className="block"><span className="mb-2 flex items-center gap-1 text-xs font-bold text-white/55"><CircleDollarSign size={13} /> السعر من</span><input type="number" min="0" value={form.minPrice} onChange={event => update('minPrice', event.target.value)} placeholder="10,000" className="h-12 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm font-bold text-white placeholder:text-white/30 outline-none focus:border-[#C9A84C]" /></label><label className="block"><span className="mb-2 text-xs font-bold text-white/55">السعر إلى</span><input type="number" min="0" value={form.maxPrice} onChange={event => update('maxPrice', event.target.value)} placeholder="20,000" className="h-12 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm font-bold text-white placeholder:text-white/30 outline-none focus:border-[#C9A84C]" /></label><label className="block"><span className="mb-2 text-xs font-bold text-[#e7ca72]">أو ميزانيتك القصوى</span><input type="number" min="0" value={form.targetPrice} onChange={event => update('targetPrice', event.target.value)} placeholder="180,000" className="h-12 w-full rounded-xl border border-[#C9A84C]/25 bg-[#C9A84C]/[0.06] px-3 text-sm font-bold text-white placeholder:text-white/30 outline-none focus:border-[#C9A84C]" /></label></div>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2"><label className="block"><span className="mb-2 text-xs font-bold text-white/55">الحالة المطلوبة</span><div className="flex rounded-xl border border-white/10 bg-black/25 p-1"><button type="button" onClick={() => update('condition', form.condition === 'new' ? '' : 'new')} className={`flex-1 rounded-lg px-3 py-2.5 text-xs font-bold ${form.condition === 'new' ? 'bg-emerald-400 text-black' : 'text-white/55'}`}>جديد</button><button type="button" onClick={() => update('condition', form.condition === 'used' ? '' : 'used')} className={`flex-1 rounded-lg px-3 py-2.5 text-xs font-bold ${form.condition === 'used' ? 'bg-sky-400 text-black' : 'text-white/55'}`}>مستعمل</button></div></label><label className="block"><span className="mb-2 text-xs font-bold text-white/55">الموديل (سنة الصنع)</span><select value={form.minYear} onChange={event => update('minYear', event.target.value)} className="h-12 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm font-bold text-white outline-none focus:border-[#C9A84C]"><option value="" className="bg-[#15191f]">كل السنوات</option>{YEARS.map(year => <option key={year} value={year} className="bg-[#15191f]">{year}</option>)}</select></label></div>
              <label className="mt-5 block"><span className="mb-2 block text-sm font-black">رسالتك إلى المعارض <span className="text-rose-300">*</span></span><textarea required minLength={10} maxLength={2000} value={form.message} onChange={event => update('message', event.target.value)} placeholder="مثال: أبحث عن سيارة عائلية بحالة ممتازة، أفضل لونًا فاتحًا ودفعات مناسبة..." className="min-h-32 w-full resize-y rounded-2xl border border-white/10 bg-black/25 p-4 text-sm leading-7 text-white placeholder:text-white/30 outline-none transition focus:border-[#C9A84C]" /><div className="mt-1 flex justify-between text-xs text-white/35"><span>اكتب تفاصيل تساعد المعارض على خدمتك بشكل أفضل.</span><span>{form.message.length}/2000</span></div></label>
            </div>

            <aside id="request-account" className="h-fit space-y-5 lg:sticky lg:top-24">
              {!accountReady ? (
                <div className="rounded-3xl border border-[#C9A84C]/35 bg-[#11151c] p-5 shadow-xl shadow-black/20">
                  <div className="flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#C9A84C] text-black"><LockKeyhole size={21} /></div><div><h2 className="text-xl font-black">سجّل لإرسال طلبك</h2><p className="mt-1 text-sm leading-6 text-white/50">يحفظ حسابك طلباتك ويربطها ببيانات تواصل موثوقة.</p></div></div>
                  {isAuthenticated && profileLoading ? <p className="mt-5 text-sm text-white/50">جارٍ تحميل بيانات حسابك...</p> : isAuthenticated ? <div className="mt-5 rounded-xl border border-amber-300/25 bg-amber-300/10 p-3 text-xs leading-6 text-amber-100">حسابك يحتاج الاسم ورقم واتساب. افتح لوحة الحساب لإكمالهما.</div> : <><label className="mt-5 block"><span className="mb-2 block text-xs font-bold text-white/55">الاسم <span className="text-rose-300">*</span></span><input required value={account.name} onChange={event => setAccount(current => ({ ...current, name: event.target.value }))} placeholder="اسمك الكريم" className="h-12 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm font-bold text-white placeholder:text-white/30 outline-none focus:border-[#C9A84C]" /></label><label className="mt-4 block"><span className="mb-2 flex items-center gap-1 text-xs font-bold text-white/55"><Phone size={13} /> رقم واتساب <span className="text-rose-300">*</span></span><input required minLength={9} type="tel" value={account.whatsapp} onChange={event => setAccount(current => ({ ...current, whatsapp: event.target.value }))} placeholder="05xxxxxxxx" dir="ltr" className="h-12 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm font-bold text-white placeholder:text-white/30 outline-none focus:border-[#C9A84C]" /></label><label className="mt-4 block"><span className="mb-2 flex items-center gap-1 text-xs font-bold text-white/55"><Mail size={13} /> البريد الإلكتروني <span className="text-white/35">(اختياري)</span></span><input type="email" value={account.email} onChange={event => setAccount(current => ({ ...current, email: event.target.value }))} placeholder="name@email.com" dir="ltr" className="h-12 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm font-bold text-white placeholder:text-white/30 outline-none focus:border-[#C9A84C]" /></label><button type="button" disabled={creatingAccount} onClick={createCustomerAccount} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#C9A84C] px-5 py-3.5 text-sm font-black text-black transition hover:bg-[#e3c56e] disabled:opacity-60">{creatingAccount ? 'جارٍ إنشاء الحساب...' : <><UserRound size={17} /> إنشاء حساب وإكمال الطلب</>}</button><a href="/login?redirect=%2Fvehicle-request" className="mt-3 block text-center text-xs font-bold text-[#ecd57f] hover:text-white">لديك حساب مسبقًا؟ سجل الدخول</a></>}
                </div>
              ) : (
                <div className="rounded-3xl border border-emerald-400/25 bg-emerald-400/[0.06] p-5"><div className="flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-400 text-black"><Check size={21} /></div><div><h2 className="text-xl font-black text-emerald-100">حسابك جاهز للإرسال</h2><p className="mt-1 text-sm leading-6 text-emerald-100/65">سيُرسل الطلب باسمك ورقم واتسابك المسجل.</p></div></div><div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-sm"><p className="font-black">{profile.name}</p><p className="mt-1 text-white/60" dir="ltr">{profile.whatsapp}</p>{profile.email && <p className="mt-1 text-xs text-white/45" dir="ltr">{profile.email}</p>}</div><a href="/account" className="mt-4 block text-center text-xs font-bold text-[#ecd57f] hover:text-white">إدارة بيانات حسابي</a></div>
              )}
              <div className="rounded-3xl border border-white/10 bg-[#11151c] p-5"><h2 className="flex items-center gap-2 text-xl font-black"><MessageSquareText size={21} className="text-[#e7ca72]" /> تأكيد الإرسال</h2><label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-white/8 bg-black/20 p-3"><input checked={form.accepted} onChange={event => update('accepted', event.target.checked)} type="checkbox" className="mt-1 h-4 w-4 accent-[#C9A84C]" /><span className="text-xs leading-6 text-white/60">أوافق على مشاركة بيانات هذا الطلب مع <strong className="text-white">المعارض المعتمدة والنشطة</strong> فقط لتمكينها من التواصل معي بشأن طلبي.</span></label><button disabled={broadcast.isPending || !accountReady} type="submit" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#C9A84C] px-5 py-3.5 text-sm font-black text-black shadow-lg shadow-[#C9A84C]/15 transition hover:bg-[#e3c56e] disabled:cursor-not-allowed disabled:opacity-50">{broadcast.isPending ? 'يجري إرسال الطلب...' : <><Send size={17} /> أرسل طلبي إلى المعارض</>}</button>{!accountReady && <p className="mt-3 text-center text-xs leading-5 text-white/45">أنشئ حسابك أو سجّل الدخول لتفعيل زر الإرسال.</p>}</div>
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-emerald-300" size={20} /><div><p className="text-sm font-black text-emerald-100">توزيع آمن وذكي</p><p className="mt-1 text-xs leading-6 text-emerald-100/65">لا يصل طلبك إلى المعارض غير المعتمدة أو الموقوفة.</p></div></div></div>
              {(form.minPrice || form.maxPrice || form.targetPrice) && <div className="rounded-2xl border border-[#C9A84C]/20 bg-[#C9A84C]/[0.06] p-4 text-xs leading-6 text-[#efda91]"><p className="font-black">ملخص الميزانية</p><p className="mt-1">{form.targetPrice ? `ميزانية قصوى: ${formatSAR(form.targetPrice)}` : `من ${formatSAR(form.minPrice)} إلى ${formatSAR(form.maxPrice)}`}</p></div>}
            </aside>
          </form>
        </section>
      </main>
      <Footer />
    </div>
  );
}
