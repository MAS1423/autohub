import { useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  ArrowLeft, Car, ChevronDown, CircleDollarSign, Fuel, Heart, GitCompareArrows,
  RotateCcw, Search, Send, Settings2, SlidersHorizontal, Sparkles, Tag, X,
} from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { trpc } from '@/lib/trpc';
import { useI18n } from '@/lib/i18n';
import { useCompare } from '@/contexts/CompareContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import {
  MODEL_OPTIONS, PRICE_SHORTCUTS, TRIM_SUGGESTIONS,
  VEHICLE_BRANDS, VEHICLE_TYPES, formatSAR,
} from '@/lib/vehicleCatalog';

type SearchFilters = {
  q: string;
  brand: string;
  bodyType: string;
  model: string;
  trim: string;
  year: string;
  condition: '' | 'new' | 'used';
  minPrice: string;
  maxPrice: string;
  targetPrice: string;
  fuelType: string;
  transmission: string;
};

const INITIAL_FILTERS: SearchFilters = {
  q: '', brand: '', bodyType: '', model: '', trim: '', year: '', condition: '',
  minPrice: '', maxPrice: '', targetPrice: '', fuelType: '', transmission: '',
};

const FUEL_LABELS: Record<string, string> = { petrol: 'بنزين', diesel: 'ديزل', hybrid: 'هجين', electric: 'كهربائي' };
const TRANS_LABELS: Record<string, string> = { automatic: 'أوتوماتيك', manual: 'يدوي' };
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 16 }, (_, index) => String(CURRENT_YEAR - index));

function filtersFromLocation(): SearchFilters {
  if (typeof window === 'undefined') return { ...INITIAL_FILTERS };
  const params = new URLSearchParams(window.location.search);
  return {
    ...INITIAL_FILTERS,
    q: params.get('q') ?? '',
    brand: params.get('brand') ?? '',
    model: params.get('model') ?? '',
    year: params.get('year') ?? '',
    bodyType: params.get('bodyType') ?? '',
  };
}

function toPositiveNumber(value: string): number | undefined {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : undefined;
}

export default function VehicleSearch() {
  const { lang } = useI18n();
  const [, navigate] = useLocation();
  const { addToCompare, isInCompare, removeFromCompare, canAdd } = useCompare();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const [filters, setFilters] = useState<SearchFilters>(() => filtersFromLocation());
  const [submittedFilters, setSubmittedFilters] = useState<SearchFilters | null>(() => {
    const initial = filtersFromLocation();
    return initial.q || initial.brand || initial.model || initial.year || initial.bodyType ? initial : null;
  });
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const availableModels = useMemo(() => filters.brand ? MODEL_OPTIONS(filters.brand) : [], [filters.brand]);

  function update<Key extends keyof SearchFilters>(key: Key, value: SearchFilters[Key]) {
    setFilters(current => {
      const next = { ...current, [key]: value } as SearchFilters;
      if (key === 'brand') next.model = '';
      return next;
    });
  }

  function resetSearch() {
    setFilters(INITIAL_FILTERS);
    setSubmittedFilters(null);
  }

  function submitSearch() {
    const minPrice = toPositiveNumber(filters.minPrice);
    const maxPrice = toPositiveNumber(filters.maxPrice);
    if (minPrice && maxPrice && minPrice > maxPrice) {
      toast.error('يرجى جعل السعر من أقل من أو يساوي السعر إلى.');
      return;
    }
    setSubmittedFilters({ ...filters });
    window.setTimeout(() => document.getElementById('search-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }

  const queryInput = useMemo(() => {
    if (!submittedFilters) return undefined;
    const targetPrice = toPositiveNumber(submittedFilters.targetPrice);
    const minPrice = toPositiveNumber(submittedFilters.minPrice);
    const maxPrice = toPositiveNumber(submittedFilters.maxPrice) ?? (targetPrice && !minPrice ? targetPrice : undefined);
    return {
      q: submittedFilters.q.trim() || undefined,
      brand: submittedFilters.brand || undefined,
      bodyType: submittedFilters.bodyType || undefined,
      model: submittedFilters.model || undefined,
      trim: submittedFilters.trim.trim() || undefined,
      condition: submittedFilters.condition || undefined,
      minPrice,
      maxPrice,
      minYear: toPositiveNumber(submittedFilters.year),
      maxYear: toPositiveNumber(submittedFilters.year),
      fuelType: submittedFilters.fuelType || undefined,
      transmission: submittedFilters.transmission || undefined,
      limit: 36,
    };
  }, [submittedFilters]);

  const { data: results = [], isLoading } = trpc.vehicles.search.useQuery(queryInput, { enabled: Boolean(queryInput) });

  const chips = useMemo(() => {
    const labels: Array<{ key: string; label: string; action: () => void }> = [];
    if (filters.brand) labels.push({ key: 'brand', label: filters.brand, action: () => update('brand', '') });
    if (filters.bodyType) labels.push({ key: 'type', label: filters.bodyType, action: () => update('bodyType', '') });
    if (filters.model) labels.push({ key: 'model', label: filters.model, action: () => update('model', '') });
    if (filters.trim) labels.push({ key: 'trim', label: `الفئة: ${filters.trim}`, action: () => update('trim', '') });
    if (filters.year) labels.push({ key: 'year', label: `الموديل: ${filters.year}`, action: () => update('year', '') });
    if (filters.condition) labels.push({ key: 'condition', label: filters.condition === 'new' ? 'جديد' : 'مستعمل', action: () => update('condition', '') });
    if (filters.minPrice || filters.maxPrice || filters.targetPrice) {
      const price = filters.targetPrice
        ? `ميزانية حتى ${formatSAR(filters.targetPrice)}`
        : `${filters.minPrice ? formatSAR(filters.minPrice) : 'من دون حد'} — ${filters.maxPrice ? formatSAR(filters.maxPrice) : 'مفتوح'}`;
      labels.push({ key: 'price', label: price, action: () => setFilters(current => ({ ...current, minPrice: '', maxPrice: '', targetPrice: '' })) });
    }
    return labels;
  // The filter object is the only source of derived chips for this render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  function setPriceShortcut(min?: number, max?: number) {
    setFilters(current => ({ ...current, minPrice: min ? String(min) : '', maxPrice: max ? String(max) : '', targetPrice: '' }));
  }

  function toggleFavorite(id: number, vehicle: unknown) {
    if (isFavorite(id, 'vehicle')) {
      removeFavorite(id, 'vehicle');
      toast.info('تمت إزالة السيارة من المفضلة');
    } else {
      addFavorite({ id, type: 'vehicle', data: vehicle });
      toast.success('تم حفظ السيارة في المفضلة');
    }
  }

  function toggleCompareVehicle(vehicle: any) {
    if (isInCompare(vehicle.id)) {
      removeFromCompare(vehicle.id);
      toast.info('تمت إزالة السيارة من المقارنة');
      return;
    }
    if (!canAdd) {
      toast.error('يمكنك مقارنة 3 سيارات كحد أقصى');
      return;
    }
    addToCompare(vehicle);
    toast.success('تمت إضافة السيارة إلى قائمة المقارنة');
  }

  return (
    <div className="min-h-screen bg-[#08090b] text-white" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <Header />
      <main>
        <section className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_85%_5%,rgba(201,168,76,.24),transparent_28%),linear-gradient(180deg,#11151c_0%,#08090b_100%)] pt-28 pb-12">
          <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'linear-gradient(30deg, transparent 47%, #d6b55b 48%, #d6b55b 52%, transparent 53%)', backgroundSize: '34px 34px' }} />
          <div className="relative mx-auto max-w-7xl px-4">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#C9A84C]/35 bg-[#C9A84C]/10 px-3 py-1.5 text-xs font-bold text-[#ead48c]"><Sparkles size={14} /> بحث سيارة ذكي</div>
                <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">ابحث بالطريقة التي تفكر بها</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60 md:text-base">ابدأ بالماركة، ثم اختر النوع أو الطراز والفئة والموديل (سنة الصنع) وحدد ميزانيتك للحصول على نتائج دقيقة.</p>
              </div>
              <button onClick={() => navigate('/vehicle-request')} className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[#C9A84C]/45 bg-[#C9A84C]/10 px-5 py-3 text-sm font-black text-[#f4df99] transition-all hover:-translate-y-0.5 hover:bg-[#C9A84C] hover:text-black"><Send size={17} className="transition-transform group-hover:-translate-x-0.5" /> أرسل طلب سيارة للمعارض</button>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#11151c]/95 p-4 shadow-2xl shadow-black/40 backdrop-blur md:p-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <label className="relative block"><span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-white/55"><Car size={14} /> الماركة</span><select value={filters.brand} onChange={event => update('brand', event.target.value)} className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-black/25 px-3 text-sm font-bold text-white outline-none transition focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20"><option value="" className="bg-[#15191f]">كل الماركات</option>{VEHICLE_BRANDS.map(brand => <option key={brand} value={brand} className="bg-[#15191f]">{brand}</option>)}</select><ChevronDown size={16} className="pointer-events-none absolute bottom-4 left-3 text-white/45" /></label>
                <label className="relative block"><span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-white/55"><Car size={14} /> الطراز / النوع</span><select disabled={!filters.brand} value={filters.model} onChange={event => update('model', event.target.value)} className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-black/25 px-3 text-sm font-bold text-white outline-none transition focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 disabled:cursor-not-allowed disabled:opacity-45"><option value="" className="bg-[#15191f]">{filters.brand ? 'كل الطرازات' : 'اختر الماركة أولًا'}</option>{availableModels.map(model => <option key={model} value={model} className="bg-[#15191f]">{model}</option>)}</select><ChevronDown size={16} className="pointer-events-none absolute bottom-4 left-3 text-white/45" /></label>
                <label className="relative block"><span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-white/55"><Car size={14} /> سنة الصنع</span><select value={filters.year} onChange={event => update('year', event.target.value)} className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-black/25 px-3 text-sm font-bold text-white outline-none transition focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20"><option value="" className="bg-[#15191f]">كل السنوات</option>{YEARS.map(year => <option key={year} value={year} className="bg-[#15191f]">{year}</option>)}</select><ChevronDown size={16} className="pointer-events-none absolute bottom-4 left-3 text-white/45" /></label>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[1.2fr_1.2fr_1fr_auto] lg:items-end">
                <div className="grid grid-cols-2 gap-3"><label className="block"><span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-white/55"><CircleDollarSign size={14} /> السعر من</span><input inputMode="numeric" type="number" min="0" value={filters.minPrice} onChange={event => update('minPrice', event.target.value)} placeholder="10,000" className="h-12 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm font-bold text-white placeholder:text-white/30 outline-none transition focus:border-[#C9A84C]" /></label><label className="block"><span className="mb-1.5 text-xs font-bold text-white/55">السعر إلى</span><input inputMode="numeric" type="number" min="0" value={filters.maxPrice} onChange={event => update('maxPrice', event.target.value)} placeholder="20,000" className="h-12 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm font-bold text-white placeholder:text-white/30 outline-none transition focus:border-[#C9A84C]" /></label></div>
                <label className="block"><span className="mb-1.5 text-xs font-bold text-white/55">أو حدّد ميزانيتك القصوى</span><input inputMode="numeric" type="number" min="0" value={filters.targetPrice} onChange={event => update('targetPrice', event.target.value)} placeholder="مثال: 180,000" className="h-12 w-full rounded-xl border border-[#C9A84C]/25 bg-[#C9A84C]/[0.06] px-3 text-sm font-bold text-white placeholder:text-white/30 outline-none transition focus:border-[#C9A84C]" /></label>
                <div className="flex rounded-xl border border-white/10 bg-black/25 p-1"><button onClick={() => update('condition', filters.condition === 'new' ? '' : 'new')} className={`flex-1 rounded-lg px-3 py-2.5 text-xs font-bold transition ${filters.condition === 'new' ? 'bg-emerald-400 text-black' : 'text-white/55 hover:text-white'}`}>جديد</button><button onClick={() => update('condition', filters.condition === 'used' ? '' : 'used')} className={`flex-1 rounded-lg px-3 py-2.5 text-xs font-bold transition ${filters.condition === 'used' ? 'bg-sky-400 text-black' : 'text-white/55 hover:text-white'}`}>مستعمل</button></div>
                <button onClick={submitSearch} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#C9A84C] px-8 text-sm font-black text-black shadow-lg shadow-[#C9A84C]/15 transition-all hover:-translate-y-0.5 hover:bg-[#e3c56e] active:translate-y-0"><Search size={18} /> ابحث عن سيارة</button>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/8 pt-4"><span className="ml-1 text-xs font-bold text-white/40">نطاقات سريعة:</span>{PRICE_SHORTCUTS.map(shortcut => <button key={shortcut.label} onClick={() => setPriceShortcut(shortcut.min, shortcut.max)} className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold text-white/55 transition hover:border-[#C9A84C]/55 hover:text-[#f1d987]">{shortcut.label}</button>)}<button onClick={() => setShowMoreFilters(current => !current)} className="mr-auto inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold text-[#e7ca72] transition hover:bg-[#C9A84C]/10"><SlidersHorizontal size={14} />{showMoreFilters ? 'إخفاء الفلاتر الإضافية' : 'فلاتر إضافية'}</button></div>

              {showMoreFilters && <div className="mt-4 grid grid-cols-1 gap-3 rounded-2xl border border-white/8 bg-black/15 p-4 sm:grid-cols-2 lg:grid-cols-4"><label className="block"><span className="mb-1.5 flex items-center gap-1 text-xs font-bold text-white/50"><Tag size={13} /> الفئة / التجهيز</span><select value={filters.trim} onChange={event => update('trim', event.target.value)} className="h-11 w-full rounded-xl border border-white/10 bg-[#15191f] px-3 text-sm text-white outline-none focus:border-[#C9A84C]"><option value="">كل الفئات</option>{TRIM_SUGGESTIONS.map(trim => <option key={trim} value={trim}>{trim}</option>)}</select></label><label className="block"><span className="mb-1.5 flex items-center gap-1 text-xs font-bold text-white/50"><Car size={13} /> نوع الهيكل</span><select value={filters.bodyType} onChange={event => update('bodyType', event.target.value)} className="h-11 w-full rounded-xl border border-white/10 bg-[#15191f] px-3 text-sm text-white outline-none focus:border-[#C9A84C]"><option value="">كل الأنواع</option>{VEHICLE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}</select></label><label className="block"><span className="mb-1.5 flex items-center gap-1 text-xs font-bold text-white/50"><Fuel size={13} /> الوقود</span><select value={filters.fuelType} onChange={event => update('fuelType', event.target.value)} className="h-11 w-full rounded-xl border border-white/10 bg-[#15191f] px-3 text-sm text-white outline-none focus:border-[#C9A84C]"><option value="">كل الأنواع</option>{Object.entries(FUEL_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="block"><span className="mb-1.5 flex items-center gap-1 text-xs font-bold text-white/50"><Settings2 size={13} /> ناقل الحركة</span><select value={filters.transmission} onChange={event => update('transmission', event.target.value)} className="h-11 w-full rounded-xl border border-white/10 bg-[#15191f] px-3 text-sm text-white outline-none focus:border-[#C9A84C]"><option value="">الكل</option>{Object.entries(TRANS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>}
            </div>

            {chips.length > 0 && <div className="mt-4 flex flex-wrap items-center gap-2"><span className="text-xs font-bold text-white/45">الفلاتر المختارة:</span>{chips.map(chip => <button key={chip.key} onClick={chip.action} className="inline-flex items-center gap-1 rounded-full border border-[#C9A84C]/35 bg-[#C9A84C]/10 px-3 py-1.5 text-xs font-bold text-[#f0d886] transition hover:bg-[#C9A84C]/20"><X size={13} />{chip.label}</button>)}<button onClick={resetSearch} className="mr-auto inline-flex items-center gap-1 text-xs font-bold text-white/45 transition hover:text-white"><RotateCcw size={14} /> إعادة تعيين</button></div>}
          </div>
        </section>

        <section className="border-b border-white/8 bg-[#0e1218] px-4 py-5"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 rounded-2xl border border-[#C9A84C]/18 bg-[linear-gradient(110deg,rgba(201,168,76,.13),rgba(201,168,76,.03))] p-4 md:flex-row md:items-center md:p-5"><div className="flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#C9A84C] text-black"><Send size={20} /></div><div><p className="font-black text-white">لم تجد السيارة المناسبة؟</p><p className="mt-1 text-sm text-white/60">أرسل تفاصيل ما تريده، وسنوصّل طلبك إلى جميع المعارض المعتمدة لتتواصل معك بعروض مناسبة.</p></div></div><button onClick={() => navigate('/vehicle-request')} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-black transition hover:bg-[#f5df93]">أرسل طلبك الآن <ArrowLeft size={17} /></button></div></section>

        <section id="search-results" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-12">
          {!submittedFilters ? <div className="rounded-3xl border border-white/8 bg-[#11151c] p-10 text-center"><Search className="mx-auto mb-4 h-12 w-12 text-[#C9A84C]" /><h2 className="text-2xl font-black">ابدأ بتحديد ما تريده</h2><p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-white/55">ابدأ باختيار الماركة، ثم الطراز/النوع وسنة الصنع من القوائم المنسدلة للحصول على نتائج دقيقة. يمكنك استخدام الفلاتر الإضافية أو إرسال طلب إذا لم تجد السيارة المناسبة.</p></div>
          : isLoading ? <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <div className="overflow-hidden rounded-2xl border border-white/8 bg-[#11151c]" key={index}><div className="h-48 animate-pulse bg-white/5" /><div className="space-y-3 p-4"><div className="h-4 w-2/3 animate-pulse rounded bg-white/5" /><div className="h-4 w-1/2 animate-pulse rounded bg-white/5" /></div></div>)}</div>
          : results.length === 0 ? <div className="rounded-3xl border border-white/8 bg-[#11151c] p-10 text-center"><Car className="mx-auto mb-4 h-12 w-12 text-white/25" /><h2 className="text-2xl font-black">لا توجد نتائج مطابقة الآن</h2><p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-white/55">جرّب توسيع السعر أو إزالة أحد الفلاتر، أو أرسل طلبًا ليصل إلى المعارض المعتمدة.</p><button onClick={() => navigate('/vehicle-request')} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#C9A84C] px-5 py-3 text-sm font-black text-black">أرسل طلب سيارة <Send size={16} /></button></div>
          : <><div className="mb-6 flex items-center justify-between"><div><p className="text-sm text-white/50">نتائج مطابقة لمعاييرك</p><h2 className="mt-1 text-2xl font-black"><span className="text-[#e7ca72]">{results.length}</span> سيارة متاحة</h2></div><button onClick={() => setShowMoreFilters(true)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-white/65 transition hover:border-[#C9A84C]/50 hover:text-white"><SlidersHorizontal size={15} /> تعديل الفلاتر</button></div><div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{results.map(vehicle => {
            const imageList = (() => { try { return JSON.parse(vehicle.images || '[]') as string[]; } catch { return []; } })();
            const image = imageList[0] || '/assets/car-suv.jpg';
            const favorite = isFavorite(vehicle.id, 'vehicle');
            const comparing = isInCompare(vehicle.id);
            return <article key={vehicle.id} className="group overflow-hidden rounded-2xl border border-white/8 bg-[#11151c] transition-all hover:-translate-y-1 hover:border-[#C9A84C]/45 hover:shadow-2xl hover:shadow-black/25"><Link href={`/vehicle/${vehicle.id}`}><div className="relative h-48 overflow-hidden"><img src={image} alt={`${vehicle.brand} ${vehicle.model}`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" /><span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-black ${vehicle.condition === 'new' ? 'bg-emerald-400 text-black' : 'bg-sky-400 text-black'}`}>{vehicle.condition === 'new' ? 'جديد' : 'مستعمل'}</span><span className="absolute bottom-3 right-3 text-xs font-bold text-white/80">{vehicle.dealerName}</span></div></Link><div className="p-4"><p className="mb-1 text-xs font-bold text-[#e7ca72]">{vehicle.bodyType || 'سيارة'}{vehicle.trim ? ` · ${vehicle.trim}` : ''}</p><Link href={`/vehicle/${vehicle.id}`}><h3 className="line-clamp-1 text-base font-black text-white transition group-hover:text-[#ecd57f]">{vehicle.brand} {vehicle.model} <span className="text-white/45">{vehicle.year}</span></h3></Link><p className="mt-3 text-xl font-black text-[#e7ca72]">{formatSAR(vehicle.price)}</p><div className="mt-3 flex items-center justify-between text-xs text-white/50"><span>موديل {vehicle.year}</span><span>{vehicle.mileage ? `${new Intl.NumberFormat('ar-SA').format(vehicle.mileage)} كم` : 'ممشى 0 كم'}</span></div><div className="mt-4 grid grid-cols-2 gap-2"><button onClick={() => toggleFavorite(vehicle.id, vehicle)} className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border text-xs font-black transition ${favorite ? 'border-rose-400 bg-rose-400/15 text-rose-300' : 'border-white/10 text-white/65 hover:border-rose-400/65 hover:text-rose-300'}`} aria-label={favorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}><Heart size={16} fill={favorite ? 'currentColor' : 'none'} />{favorite ? 'ضمن المفضلة' : 'حفظ'}</button><button onClick={() => toggleCompareVehicle(vehicle)} className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border text-xs font-black transition ${comparing ? 'border-[#C9A84C] bg-[#C9A84C] text-black' : 'border-white/10 text-white/65 hover:border-[#C9A84C]/55 hover:text-white'}`}><GitCompareArrows size={16} />{comparing ? 'ضمن المقارنة' : 'أضف للمقارنة'}</button></div></div></article>;
          })}</div></>}
        </section>
      </main>
      <Footer />
    </div>
  );
}
