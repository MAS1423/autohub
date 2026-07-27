import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useEffect, useRef } from 'react';
import { Search, Car, X, Heart, GitCompareArrows, Play } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { trpc } from '@/lib/trpc';
import { useI18n } from '@/lib/i18n';
import { useCompare } from '@/contexts/CompareContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { toast } from 'sonner';

const BRANDS = ['تويوتا','هوندا','نيسان','هيونداي','كيا','مرسيدس','بي إم دبليو','أودي','لكزس','فولكس واجن','شيفروليه','فورد','جيب','لاند روفر','بورش'];
const CITIES = ['الرياض','جدة','مكة المكرمة','المدينة المنورة','الدمام','الخبر','الأحساء','تبوك','أبها','القصيم'];

const FUEL_LABELS: Record<string, { ar: string; en: string }> = {
  petrol: { ar: 'بنزين', en: 'Petrol' },
  diesel: { ar: 'ديزل', en: 'Diesel' },
  electric: { ar: 'كهربائي', en: 'Electric' },
  hybrid: { ar: 'هجين', en: 'Hybrid' },
};

export default function Vehicles() {
  const [, navigate] = useLocation();
  const { t, lang, isRTL } = useI18n();
  const { addToCompare, removeFromCompare, isInCompare, canAdd } = useCompare();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();

  const [brand, setBrand] = useState('');
  const [city, setCity] = useState('');
  const [condition, setCondition] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [query, setQuery] = useState('');

  const PAGE_SIZE = 20;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when filters change
  const prevFiltersRef = useRef({ brand, city, condition, maxPrice, query });
  useEffect(() => {
    const prev = prevFiltersRef.current;
    if (prev.brand !== brand || prev.city !== city || prev.condition !== condition || prev.maxPrice !== maxPrice || prev.query !== query) {
      setCurrentPage(1);
      prevFiltersRef.current = { brand, city, condition, maxPrice, query };
    }
  }, [brand, city, condition, maxPrice, query]);

  const { data: vehiclesData, isLoading } = trpc.vehicles.list.useQuery({
    brand: brand || undefined,
    condition: (condition as any) || undefined,
    limit: PAGE_SIZE,
    offset: (currentPage - 1) * PAGE_SIZE,
  });

  const vehicles = Array.isArray(vehiclesData) ? vehiclesData : [];

  const filtered = useMemo(() => {
    let result = [...vehicles];
    if (city) result = result.filter(v => (v as any).dealerCity === city);
    if (maxPrice) result = result.filter(v => Number(v.price) <= parseInt(maxPrice));
    if (query) result = result.filter(v => `${v.brand} ${v.model}`.toLowerCase().includes(query.toLowerCase()));
    return result;
  }, [vehicles, city, maxPrice, query]);

  const clearFilters = () => { setBrand(''); setCity(''); setCondition(''); setMaxPrice(''); setQuery(''); };
  const gold = 'oklch(0.72 0.18 55)';

  // Estimate pagination: if we got a full page, there might be more
  const hasNextPage = filtered.length === PAGE_SIZE;
  const hasPrevPage = currentPage > 1;

  const handleCompare = (e: React.MouseEvent, v: any) => {
    e.stopPropagation();
    if (isInCompare(v.id)) {
      removeFromCompare(v.id);
    } else if (!canAdd) {
      toast.error(lang === 'ar' ? 'يمكنك مقارنة 3 سيارات كحد أقصى' : 'Maximum 3 cars for comparison');
    } else {
      const imgs = (() => { try { return JSON.parse(v.images || '[]'); } catch { return []; } })();
      addToCompare({ ...v, images: v.images || '[]' });
      toast.success(lang === 'ar' ? 'تمت الإضافة للمقارنة' : 'Added to comparison');
    }
  };

  const handleFav = (e: React.MouseEvent, v: any) => {
    e.stopPropagation();
    if (isFavorite(v.id, 'vehicle')) {
      removeFavorite(v.id, 'vehicle');
    } else {
      addFavorite({ id: v.id, type: 'vehicle', data: v });
      toast.success(lang === 'ar' ? 'تمت الإضافة للمفضلة' : 'Added to favorites');
    }
  };

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />
      <div className="pt-20">
        <div className="autohub-dark py-12">
          <div className="container">
            <h1 className="text-4xl font-black text-white mb-2">{t('nav_vehicles')}</h1>
            <p className="text-white/50 font-body">
              {lang === 'ar' ? 'تصفح أحدث السيارات المتاحة من معارض موثوقة' : 'Browse the latest vehicles from verified dealerships'}
            </p>
          </div>
        </div>

        <div className="container py-8">
          {/* Filters */}
          <div className="bg-card rounded-2xl border border-border p-4 mb-6 shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="relative col-span-2 md:col-span-1">
                <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input value={query} onChange={e => setQuery(e.target.value)}
                  placeholder={lang === 'ar' ? 'ابحث...' : 'Search...'}
                  className="w-full ps-8 pe-3 py-2.5 rounded-xl border border-border bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <select value={brand} onChange={e => setBrand(e.target.value)}
                className="py-2.5 px-3 rounded-xl border border-border bg-secondary text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">{t('search_brand')}</option>
                {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <select value={city} onChange={e => setCity(e.target.value)}
                className="py-2.5 px-3 rounded-xl border border-border bg-secondary text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">{t('search_city')}</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={condition} onChange={e => setCondition(e.target.value)}
                className="py-2.5 px-3 rounded-xl border border-border bg-secondary text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">{lang === 'ar' ? 'جديد ومستعمل' : 'New & Used'}</option>
                <option value="new">{t('vehicle_new')}</option>
                <option value="used">{t('vehicle_used')}</option>
              </select>
              <select value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                className="py-2.5 px-3 rounded-xl border border-border bg-secondary text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">{lang === 'ar' ? 'كل الأسعار' : 'All Prices'}</option>
                <option value="100000">{lang === 'ar' ? 'حتى 100,000 ر.س' : 'Up to 100,000 SAR'}</option>
                <option value="200000">{lang === 'ar' ? 'حتى 200,000 ر.س' : 'Up to 200,000 SAR'}</option>
                <option value="300000">{lang === 'ar' ? 'حتى 300,000 ر.س' : 'Up to 300,000 SAR'}</option>
                <option value="500000">{lang === 'ar' ? 'حتى 500,000 ر.س' : 'Up to 500,000 SAR'}</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between mb-5">
            <span className="text-sm text-muted-foreground font-body">
              <strong className="text-foreground">{filtered.length}</strong> {t('dealers_results')}
            </span>
            {(brand || city || condition || maxPrice || query) && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-destructive hover:underline">
                <X size={12} /> {lang === 'ar' ? 'مسح الفلاتر' : 'Clear Filters'}
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card rounded-2xl overflow-hidden border border-border animate-pulse">
                  <div className="h-52 bg-gray-200" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-6 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map(v => {
                const imgs = (() => { try { return JSON.parse(v.images || '[]'); } catch { return []; } })();
                const inCompare = isInCompare(v.id);
                const inFav = isFavorite(v.id, 'vehicle');
                return (
                  <div key={v.id} className="autohub-card overflow-hidden cursor-pointer group relative"
                    onClick={() => navigate(`/vehicle/${v.id}`)}>
                    <div className="relative h-52 overflow-hidden bg-gray-100">
                      {imgs[0]
                        ? <img src={imgs[0]} alt={`${v.brand} ${v.model}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        : <div className="w-full h-full flex items-center justify-center bg-gray-200"><Car size={32} className="opacity-30" /></div>
                      }
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

                      {/* Video badge */}
                      {v.videoUrl && (
                        <div className="absolute top-3 start-3 flex items-center gap-1 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded-full">
                          <Play size={10} fill="white" /> {lang === 'ar' ? 'فيديو' : 'Video'}
                        </div>
                      )}

                      {/* Condition badge */}
                      <div className="absolute top-3 end-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${v.condition === 'new' ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'}`}>
                          {v.condition === 'new' ? t('vehicle_new') : t('vehicle_used')}
                        </span>
                      </div>

                      <div className="absolute bottom-3 end-3 flex gap-1.5">
                        <button onClick={e => handleFav(e, v)} title={inFav ? (lang === 'ar' ? 'إزالة من المفضلة' : 'Remove from favorites') : (lang === 'ar' ? 'حفظ في المفضلة' : 'Save to favorites')}
                          className={`inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-black shadow-md transition-all ${inFav ? 'bg-rose-500 text-white' : 'bg-white/95 text-gray-700 hover:bg-rose-50 hover:text-rose-600'}`}>
                          <Heart size={14} fill={inFav ? 'currentColor' : 'none'} />
                          <span className="hidden sm:inline">{inFav ? (lang === 'ar' ? 'محفوظة' : 'Saved') : (lang === 'ar' ? 'مفضلة' : 'Favorite')}</span>
                        </button>
                        <button onClick={e => handleCompare(e, v)} title={inCompare ? (lang === 'ar' ? 'إزالة من المقارنة' : 'Remove from comparison') : (lang === 'ar' ? 'أضف للمقارنة' : 'Add to comparison')}
                          className={`inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-black shadow-md transition-all ${inCompare ? 'bg-[#C9A84C] text-black' : 'bg-white/95 text-gray-700 hover:bg-amber-50 hover:text-amber-800'}`}>
                          <GitCompareArrows size={14} />
                          <span className="hidden sm:inline">{inCompare ? (lang === 'ar' ? 'ضمن المقارنة' : 'Comparing') : (lang === 'ar' ? 'قارن' : 'Compare')}</span>
                        </button>
                      </div>

                      <div className="absolute bottom-3 start-3 text-white/70 text-xs">{(v as any).dealerName}</div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-base mb-1">{v.brand} {v.model} {v.year}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-black font-data" style={{ color: gold }}>
                          {Number(v.price).toLocaleString()} <span className="text-sm font-semibold text-muted-foreground">{t('sar')}</span>
                        </span>
                        {v.condition === 'used' && v.mileage && (
                          <span className="text-xs text-muted-foreground">{Number(v.mileage).toLocaleString()} {t('km')}</span>
                        )}
                      </div>
                     <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                       <Car size={11} />
                        <span>{(v as any).dealerCity || '—'}</span>
                       {v.fuelType && <span className="ms-2">· {FUEL_LABELS[v.fuelType]?.[lang] || v.fuelType}</span>}
                     </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-24">
              <Car size={48} className="mx-auto text-muted-foreground mb-4 opacity-30" />
              <h3 className="text-xl font-bold mb-2">{t('dealers_empty')}</h3>
              <p className="text-muted-foreground font-body">{t('dealers_empty_desc')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {(hasNextPage || hasPrevPage) && (
        <div className="flex items-center justify-center gap-2 pb-10">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={!hasPrevPage}
            className="px-4 py-2 rounded-xl bg-card border border-border text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-semibold"
          >
            {lang === 'ar' ? 'السابق' : 'Prev'}
          </button>
          <span className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-black text-sm min-w-[2.5rem] text-center">{currentPage}</span>
          <button
            onClick={() => setCurrentPage(p => p + 1)}
            disabled={!hasNextPage}
            className="px-4 py-2 rounded-xl bg-card border border-border text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-semibold"
          >
            {lang === 'ar' ? 'التالي' : 'Next'}
          </button>
        </div>
      )}

      <Footer />
    </div>
  );
}
