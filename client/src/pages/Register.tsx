import { useState } from 'react';
import { useLocation } from 'wouter';
import { BadgeCheck, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { trpc } from '@/lib/trpc';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';

const BRANDS = ['تويوتا','هوندا','نيسان','هيونداي','كيا','مرسيدس','بي إم دبليو','أودي','لكزس','فولكس واجن','شيفروليه','فورد','جيب','لاند روفر','بورش'];
const CITIES = ['الرياض','جدة','مكة المكرمة','المدينة المنورة','الدمام','الخبر','الأحساء','تبوك','أبها','القصيم'];

export default function Register() {
  const [, navigate] = useLocation();
  const { t, lang, isRTL } = useI18n();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    dealerName: '', ownerName: '', phone: '', email: '',
    city: '', neighborhood: '', brands: [] as string[],
    bio: '', commercialReg: '',
  });

  const registerMutation = trpc.dealers.register.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success(lang === 'ar' ? 'تم تقديم طلب تسجيل معرضك بنجاح!' : 'Dealership registration submitted successfully!');
    },
    onError: (err) => {
      toast.error(lang === 'ar' ? `خطأ: ${err.message}` : `Error: ${err.message}`);
    },
  });

  const update = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));
  const toggleBrand = (b: string) => {
    setForm(prev => ({
      ...prev,
      brands: prev.brands.includes(b) ? prev.brands.filter(x => x !== b) : [...prev.brands, b],
    }));
  };

  const handleSubmit = () => {
    if (!form.dealerName || !form.ownerName || !form.phone || !form.city || form.brands.length === 0) {
      toast.error(lang === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }
    registerMutation.mutate({
      name: form.dealerName,
      ownerName: form.ownerName,
      phone: form.phone,
      email: form.email || undefined,
      city: form.city,
      neighborhood: form.neighborhood || undefined,
      brands: form.brands,
      bio: form.bio || undefined,
      commercialReg: form.commercialReg || undefined,
    });
  };

  const inputClass = "w-full border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:border-[oklch(0.72_0.18_55)] transition-colors rounded-lg font-body";
  const gold = 'oklch(0.72 0.18 55)';

  const STEPS = [
    { num: 1, label: lang === 'ar' ? 'معلومات المعرض' : 'Dealer Info' },
    { num: 2, label: lang === 'ar' ? 'الموقع والتخصص' : 'Location & Brands' },
    { num: 3, label: lang === 'ar' ? 'التوثيق' : 'Verification' },
  ];

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
        <Header />
        <main className="flex-1 flex items-center justify-center py-20 px-4">
          <div className="text-center max-w-md">
            <CheckCircle2 size={72} className="mx-auto mb-6" style={{ color: gold }} />
            <h1 className="text-3xl font-black mb-3" style={{ fontFamily: 'Cairo, sans-serif' }}>
              {lang === 'ar' ? 'تم التسجيل بنجاح!' : 'Registration Submitted!'}
            </h1>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              {lang === 'ar'
                ? 'تم استلام طلبك. سيتواصل معك فريقنا خلال 24 ساعة لإتمام التحقق وتفعيل معرضك.'
                : 'Your request has been received. Our team will contact you within 24 hours to complete verification and activate your dealership.'}
            </p>
            <button onClick={() => navigate('/')}
              className="px-8 py-3 rounded-xl font-black text-black"
              style={{ background: gold }}>
              {lang === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />
      <div className="pt-16">
        {/* Hero */}
        <div className="autohub-dark py-16 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: 'repeating-linear-gradient(45deg, oklch(0.72 0.18 55) 0, oklch(0.72 0.18 55) 1px, transparent 0, transparent 50%)', backgroundSize: '20px 20px' }} />
          <div className="container relative z-10">
            <div className="gold-badge mb-4">{lang === 'ar' ? 'انضم لأوتو هَب' : 'Join AutoHub'}</div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
              {lang === 'ar' ? 'سجّل معرضك الآن' : 'Register Your Dealership'}
            </h1>
            <p className="text-white/40 font-body">
              {lang === 'ar' ? 'احصل على حضور رقمي احترافي وتواصل مع آلاف العملاء' : 'Get a professional digital presence and connect with thousands of customers'}
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-10" style={{ background: 'oklch(0.97 0.003 80)', clipPath: 'polygon(0 100%, 100% 0, 100% 100%)' }} />
        </div>

        <div className="container py-12">
          <div className="max-w-xl">
            {/* Step Indicator */}
            <div className="flex items-center mb-10">
              {STEPS.map((s, i) => (
                <div key={s.num} className="flex items-center flex-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 flex items-center justify-center text-sm font-black flex-shrink-0 transition-all"
                      style={step >= s.num ? {
                        background: gold, color: 'oklch(0.10 0.01 260)',
                        clipPath: 'polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 5px 100%, 0 calc(100% - 5px))',
                      } : {
                        background: 'oklch(0.92 0.004 80)', color: 'oklch(0.60 0.01 260)',
                        clipPath: 'polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 5px 100%, 0 calc(100% - 5px))',
                      }}>
                      {step > s.num ? <BadgeCheck size={15} /> : s.num}
                    </div>
                    <span className={`text-xs font-bold hidden sm:block ${step >= s.num ? '' : 'text-muted-foreground'}`}>{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 h-0.5 mx-3 transition-colors"
                      style={{ background: step > s.num ? gold : 'oklch(0.88 0.005 80)' }} />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1 */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-black mb-6">{lang === 'ar' ? 'معلومات المعرض الأساسية' : 'Basic Dealership Information'}</h2>
                <div>
                  <label className="block text-xs font-black mb-1.5 text-muted-foreground uppercase tracking-wider">
                    {lang === 'ar' ? 'اسم المعرض *' : 'Dealership Name *'}
                  </label>
                  <input value={form.dealerName} onChange={e => update('dealerName', e.target.value)}
                    placeholder={lang === 'ar' ? 'مثال: معرض النخبة للسيارات' : 'e.g. Elite Motors'}
                    className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-black mb-1.5 text-muted-foreground uppercase tracking-wider">
                    {lang === 'ar' ? 'اسم المالك *' : 'Owner Name *'}
                  </label>
                  <input value={form.ownerName} onChange={e => update('ownerName', e.target.value)}
                    placeholder={lang === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                    className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black mb-1.5 text-muted-foreground uppercase tracking-wider">
                      {lang === 'ar' ? 'رقم الجوال *' : 'Phone *'}
                    </label>
                    <input value={form.phone} onChange={e => update('phone', e.target.value)}
                      placeholder="+966 5X XXX XXXX" className={inputClass} dir="ltr" />
                  </div>
                  <div>
                    <label className="block text-xs font-black mb-1.5 text-muted-foreground uppercase tracking-wider">
                      {lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                    </label>
                    <input value={form.email} onChange={e => update('email', e.target.value)}
                      placeholder="info@dealer.com" className={inputClass} dir="ltr" type="email" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black mb-1.5 text-muted-foreground uppercase tracking-wider">
                    {lang === 'ar' ? 'نبذة عن المعرض' : 'About the Dealership'}
                  </label>
                  <textarea value={form.bio} onChange={e => update('bio', e.target.value)} rows={3}
                    placeholder={lang === 'ar' ? 'اكتب نبذة مختصرة عن معرضك...' : 'Write a brief description of your dealership...'}
                    className={inputClass + ' resize-none'} />
                </div>
                <button onClick={() => {
                  if (!form.dealerName || !form.ownerName || !form.phone) {
                    toast.error(lang === 'ar' ? 'يرجى ملء الحقول المطلوبة' : 'Please fill required fields');
                    return;
                  }
                  setStep(2);
                }} className="w-full py-3.5 font-black text-black rounded-xl flex items-center justify-center gap-2"
                  style={{ background: gold }}>
                  {lang === 'ar' ? 'التالي' : 'Next'} {isRTL ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                </button>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl font-black mb-6">{lang === 'ar' ? 'الموقع والتخصص' : 'Location & Specialization'}</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black mb-1.5 text-muted-foreground uppercase tracking-wider">
                      {lang === 'ar' ? 'المدينة *' : 'City *'}
                    </label>
                    <select value={form.city} onChange={e => update('city', e.target.value)} className={inputClass}>
                      <option value="">{lang === 'ar' ? 'اختر المدينة' : 'Select City'}</option>
                      {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black mb-1.5 text-muted-foreground uppercase tracking-wider">
                      {lang === 'ar' ? 'الحي' : 'Neighborhood'}
                    </label>
                    <input value={form.neighborhood} onChange={e => update('neighborhood', e.target.value)}
                      placeholder={lang === 'ar' ? 'الحي أو المنطقة' : 'Area or District'}
                      className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black mb-3 text-muted-foreground uppercase tracking-wider">
                    {lang === 'ar' ? 'الماركات المتخصصة *' : 'Specialized Brands *'}
                    <span className="text-xs font-normal ms-2 normal-case">({form.brands.length} {lang === 'ar' ? 'محددة' : 'selected'})</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {BRANDS.map(b => (
                      <button key={b} onClick={() => toggleBrand(b)} type="button"
                        className="px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all"
                        style={form.brands.includes(b)
                          ? { background: gold, borderColor: gold, color: '#000' }
                          : { borderColor: 'oklch(0.88 0.005 80)', color: 'oklch(0.4 0.01 240)' }
                        }>
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setStep(1)}
                    className="flex-1 py-3.5 font-black rounded-xl border-2 flex items-center justify-center gap-2"
                    style={{ borderColor: 'oklch(0.88 0.005 80)', color: 'oklch(0.4 0.01 240)' }}>
                    {isRTL ? <ChevronRight size={18} /> : <ChevronLeft size={18} />} {lang === 'ar' ? 'السابق' : 'Back'}
                  </button>
                  <button onClick={() => {
                    if (!form.city || form.brands.length === 0) {
                      toast.error(lang === 'ar' ? 'يرجى اختيار المدينة والماركات' : 'Please select city and brands');
                      return;
                    }
                    setStep(3);
                  }} className="flex-1 py-3.5 font-black text-black rounded-xl flex items-center justify-center gap-2"
                    style={{ background: gold }}>
                    {lang === 'ar' ? 'التالي' : 'Next'} {isRTL ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-xl font-black mb-6">{lang === 'ar' ? 'التوثيق والتحقق' : 'Documentation & Verification'}</h2>
                <div>
                  <label className="block text-xs font-black mb-1.5 text-muted-foreground uppercase tracking-wider">
                    {lang === 'ar' ? 'رقم السجل التجاري' : 'Commercial Registration Number'}
                  </label>
                  <input value={form.commercialReg} onChange={e => update('commercialReg', e.target.value)}
                    placeholder={lang === 'ar' ? '10 أرقام' : '10 digits'} className={inputClass} dir="ltr" />
                </div>

                {/* Summary */}
                <div className="rounded-xl border border-border p-4 bg-card space-y-2 mt-4">
                  <h3 className="font-black text-sm mb-3">{lang === 'ar' ? 'ملخص الطلب' : 'Request Summary'}</h3>
                  {[
                    { label: lang === 'ar' ? 'المعرض' : 'Dealership', value: form.dealerName },
                    { label: lang === 'ar' ? 'المالك' : 'Owner', value: form.ownerName },
                    { label: lang === 'ar' ? 'الجوال' : 'Phone', value: form.phone },
                    { label: lang === 'ar' ? 'المدينة' : 'City', value: form.city },
                    { label: lang === 'ar' ? 'الماركات' : 'Brands', value: form.brands.join('، ') },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="font-bold">{row.value || '—'}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setStep(2)}
                    className="flex-1 py-3.5 font-black rounded-xl border-2 flex items-center justify-center gap-2"
                    style={{ borderColor: 'oklch(0.88 0.005 80)', color: 'oklch(0.4 0.01 240)' }}>
                    {isRTL ? <ChevronRight size={18} /> : <ChevronLeft size={18} />} {lang === 'ar' ? 'السابق' : 'Back'}
                  </button>
                  <button onClick={handleSubmit}
                    disabled={registerMutation.isPending}
                    className="flex-1 py-3.5 font-black text-black rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ background: gold }}>
                    {registerMutation.isPending
                      ? (lang === 'ar' ? 'جارٍ التسجيل...' : 'Registering...')
                      : (lang === 'ar' ? 'تأكيد التسجيل' : 'Confirm Registration')
                    }
                    <BadgeCheck size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
