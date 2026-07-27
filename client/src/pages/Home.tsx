// AutoHub Home Page — Precision Automotive Theme, RTL Arabic
import { useState } from 'react';
import { useLocation } from 'wouter';
import { Search, Car, ChevronLeft, Star, BadgeCheck, Shield, Zap, Users, Send, SlidersHorizontal } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DealerCard from '@/components/DealerCard';
import { DEALERS, BRANDS, STATS } from '@/lib/data';
import { trpc } from '@/lib/trpc';
import { useI18n } from '@/lib/i18n';
import { MODEL_OPTIONS } from '@/lib/vehicleCatalog';

export default function Home() {
  const [, navigate] = useLocation();
  const { t, lang, isRTL } = useI18n();
  const [searchBrand, setSearchBrand] = useState('');
  const [searchModel, setSearchModel] = useState('');
  const [searchYear, setSearchYear] = useState('');
  const searchModels = searchBrand ? MODEL_OPTIONS(searchBrand) : [];
  const searchYears = Array.from({ length: 16 }, (_, index) => String(new Date().getFullYear() - index));

  // Try to load from DB, fallback to static data
  const { data: dbDealers } = trpc.dealers.list.useQuery({ limit: 6 });
  const displayDealers = (dbDealers && dbDealers.length > 0)
    ? dbDealers.map(d => ({
        ...d,
        brands: d.brands ? JSON.parse(d.brands) : [],
        rating: 4.5,
        reviewsCount: 0,
        cover: d.cover || DEALERS[0]?.cover || '',
        logo: d.logo || DEALERS[0]?.logo || '',
        workingHours: d.workingHours || '9ص - 9م',
        vehiclesCount: d.vehiclesCount || 0,
        views: d.views || 0,
        whatsapp: d.whatsapp || d.phone || '',
      }))
    : DEALERS;

  const featuredDealers = displayDealers.filter((d: any) => d.plan === 'premium' || d.plan === 'pro').slice(0, 3);
  const allDealers = displayDealers.slice(0, 6);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchBrand) params.set('brand', searchBrand);
    if (searchModel) params.set('model', searchModel);
    if (searchYear) params.set('year', searchYear);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />

      {/* ═══ HERO ═══ */}
      <section className="relative min-h-screen flex items-center" style={{ background: 'oklch(0.10 0.01 260)' }}>
        <div className="absolute inset-0">
          <img src="/assets/hero-bg.jpg" alt="أوتو هَب" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-l from-[oklch(0.10_0.01_260)] via-[oklch(0.10_0.01_260)]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.10_0.01_260)] via-transparent to-[oklch(0.10_0.01_260)]/40" />
        </div>
        <div className="container relative z-10 pt-24 pb-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full border border-[oklch(0.72_0.18_55)]/30 bg-[oklch(0.72_0.18_55)]/10">
              <span className="w-2 h-2 rounded-full bg-[oklch(0.72_0.18_55)] animate-pulse" />
              <span className="text-[oklch(0.72_0.18_55)] text-sm font-bold">{t('hero_badge')}</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-6" style={{ fontFamily: 'Cairo' }}>
              {t('hero_title_1')} <span style={{ color: 'oklch(0.72 0.18 55)' }}>{t('hero_title_2')}</span><br />{t('hero_title_3')}
            </h1>
            <p className="text-white/60 text-lg md:text-xl leading-relaxed mb-10 font-body max-w-xl">
              أكثر من <strong className="text-white">{STATS.totalDealers.toLocaleString('ar-SA')}</strong> معرض موثوق بسيارات متاحة من معارض معتمدة في المملكة.
            </p>
            <div className="bg-white rounded-2xl p-4 shadow-2xl shadow-black/40">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div className="relative">
                  <Car size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <select value={searchBrand} onChange={e => { setSearchBrand(e.target.value); setSearchModel(''); }}
                    className="w-full pr-9 pl-3 py-3 rounded-xl border border-border bg-secondary text-sm font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-[oklch(0.72_0.18_55)]">
                    <option value="">الماركة</option>
                    {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="relative">
                  <Car size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <select disabled={!searchBrand} value={searchModel} onChange={e => setSearchModel(e.target.value)}
                    className="w-full pr-9 pl-3 py-3 rounded-xl border border-border bg-secondary text-sm font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-[oklch(0.72_0.18_55)] disabled:cursor-not-allowed disabled:opacity-55">
                    <option value="">{searchBrand ? 'الطراز / النوع' : 'اختر الماركة أولًا'}</option>
                    {searchModels.map(model => <option key={model} value={model}>{model}</option>)}
                  </select>
                </div>
                <div className="relative">
                  <Car size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <select value={searchYear} onChange={e => setSearchYear(e.target.value)}
                    className="w-full pr-9 pl-3 py-3 rounded-xl border border-border bg-secondary text-sm font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-[oklch(0.72_0.18_55)]">
                    <option value="">سنة الصنع</option>
                    {searchYears.map(year => <option key={year} value={year}>{year}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={handleSearch} className="btn-gold w-full py-3.5 rounded-xl text-base font-bold flex items-center justify-center gap-2">
                <Search size={18} /> ابحث عن سيارة
              </button>
              <div className="mt-3 flex flex-col gap-2 rounded-xl border border-border bg-secondary/40 p-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-semibold leading-5 text-muted-foreground">اختر الماركة ثم الطراز/النوع وسنة الصنع من القوائم المنسدلة، ثم استخدم الفلاتر الإضافية عند الحاجة.</p>
                <button onClick={() => navigate('/vehicle-request')} className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[oklch(0.10_0.01_260)] px-3 py-2 text-xs font-black text-white transition hover:bg-[oklch(0.72_0.18_55)] hover:text-black"><Send size={14} /> أرسل طلب سيارة</button>
              </div>
              <button onClick={() => navigate('/search')} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[oklch(0.72_0.18_55)]/35 px-4 py-2.5 text-sm font-bold text-[oklch(0.55_0.16_55)] transition hover:bg-[oklch(0.72_0.18_55)]/10"><SlidersHorizontal size={16} /> فتح البحث المتقدم</button>
            </div>
            <div className="flex flex-wrap gap-6 mt-8">
              {[
                { label: 'معرض مسجل', value: STATS.totalDealers.toLocaleString('ar-SA') },
                { label: 'معرض موثق', value: STATS.verifiedDealers.toLocaleString('ar-SA') },
                { label: 'سيارة متاحة', value: STATS.totalVehicles.toLocaleString('ar-SA') },
              ].map(stat => (
                <div key={stat.label} className="flex flex-col">
                  <span className="text-2xl font-black text-white font-data">{stat.value}</span>
                  <span className="text-white/50 text-xs font-body">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-16">
            <path d="M0 80L1440 0V80H0Z" fill="oklch(0.97 0.005 80)" />
          </svg>
        </div>
      </section>

      {/* ═══ FEATURED DEALERS ═══ */}
      <section className="py-16 bg-background">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="gold-badge mb-2">★ معارض مميزة</div>
              <h2 className="text-3xl font-black">المعارض المميزة</h2>
            </div>
            <button onClick={() => navigate('/dealers')} className="text-sm font-semibold hidden md:flex items-center gap-1" style={{ color: 'oklch(0.72 0.18 55)' }}>
              عرض جميع المعارض <ChevronLeft size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(featuredDealers.length > 0 ? featuredDealers : DEALERS.slice(0, 3)).map((dealer: any) => (
              <DealerCard key={dealer.id} dealer={dealer} featured />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ ALL DEALERS ═══ */}
      <section className="py-16" style={{ background: 'oklch(0.95 0.005 80)' }}>
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-black">جميع المعارض</h2>
            <button onClick={() => navigate('/dealers')} className="text-sm font-semibold flex items-center gap-1" style={{ color: 'oklch(0.72 0.18 55)' }}>
              عرض الكل <ChevronLeft size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allDealers.map((dealer: any) => (
              <DealerCard key={dealer.id} dealer={dealer} />
            ))}
          </div>
          <div className="text-center mt-10">
            <button onClick={() => navigate('/dealers')} className="btn-gold px-10 py-4 rounded-xl text-base font-bold inline-flex items-center gap-2">
              استعرض جميع المعارض <ChevronLeft size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* ═══ WHY AUTOHUB ═══ */}
      <section className="py-20 autohub-dark">
        <div className="container">
          <div className="text-center mb-14">
            <div className="gold-badge mb-3 mx-auto w-fit">لماذا أوتو هَب؟</div>
            <h2 className="text-4xl font-black text-white">منصة تبني الثقة</h2>
            <p className="text-white/50 mt-3 max-w-xl mx-auto font-body">نحن لا نبيع سيارات، نحن نبني جسور الثقة بين المعارض الموثوقة والعملاء الجادين.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: 'توثيق رسمي', desc: 'كل معرض يمر بعملية تحقق من السجل التجاري والترخيص قبل النشر.' },
              { icon: Star, title: 'تقييمات حقيقية', desc: 'تقييمات من عملاء حقيقيين مع آلية تحقق لمنع التلاعب.' },
              { icon: Zap, title: 'بحث ذكي وسريع', desc: 'ابحث بالماركة والطراز والفئة والموديل في ثوانٍ.' },
              { icon: Users, title: 'مجتمع موثوق', desc: 'شبكة من أكثر من 1,200 معرض موثوق في أنحاء المملكة.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'oklch(0.72 0.18 55 / 0.15)' }}>
                  <Icon size={22} style={{ color: 'oklch(0.72 0.18 55)' }} />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
                <p className="text-white/50 text-sm leading-relaxed font-body">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ BRANDS STRIP ═══ */}
      <section className="py-12 bg-background border-y border-border">
        <div className="container">
          <p className="text-center text-muted-foreground text-sm font-semibold mb-6">ماركات السيارات المتوفرة في معارض أوتو هَب</p>
          <div className="flex flex-wrap justify-center gap-3">
            {BRANDS.map(brand => (
              <button key={brand} onClick={() => navigate(`/search?brand=${brand}`)}
                className="px-4 py-2 rounded-lg border border-border bg-card text-sm font-semibold text-muted-foreground hover:border-[oklch(0.72_0.18_55)] hover:text-[oklch(0.72_0.18_55)] transition-all duration-150">
                {brand}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA FOR DEALERS ═══ */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="rounded-3xl overflow-hidden relative" style={{ background: 'oklch(0.12 0.01 260)' }}>
            <div className="absolute inset-0 opacity-20">
              <img src="/assets/showroom-luxury.jpg" alt="" className="w-full h-full object-cover" />
            </div>
            <div className="relative z-10 p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <div className="gold-badge mb-4">للمعارض</div>
                <h2 className="text-3xl md:text-4xl font-black text-white mb-3">سجّل معرضك اليوم</h2>
                <p className="text-white/60 max-w-lg font-body leading-relaxed">احصل على صفحة احترافية تظهر في جوجل، وتواصل مع آلاف العملاء الجادين يومياً.</p>
                <div className="flex flex-wrap gap-4 mt-5 text-white/50 text-sm font-body">
                  <span className="flex items-center gap-1.5"><BadgeCheck size={14} style={{ color: 'oklch(0.72 0.18 55)' }} /> مجاني للبدء</span>
                  <span className="flex items-center gap-1.5"><BadgeCheck size={14} style={{ color: 'oklch(0.72 0.18 55)' }} /> لا يلزم بطاقة ائتمانية</span>
                  <span className="flex items-center gap-1.5"><BadgeCheck size={14} style={{ color: 'oklch(0.72 0.18 55)' }} /> ظهور فوري في البحث</span>
                </div>
              </div>
              <div className="flex flex-col gap-3 flex-shrink-0">
                <button onClick={() => navigate('/register')} className="btn-gold px-10 py-4 rounded-xl text-base font-bold whitespace-nowrap">سجّل معرضك مجاناً</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
