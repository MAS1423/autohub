import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useI18n } from '@/lib/i18n';
import { useFavorites } from '@/contexts/FavoritesContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Search, MapPin, Car, BadgeCheck, Star, Heart, ChevronRight,
  SlidersHorizontal, X, ShoppingCart, Tag, RefreshCw, Eye
} from 'lucide-react';

const CITIES = ['الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'الخبر', 'الطائف', 'تبوك', 'أبها', 'القصيم'];
const BRANDS = ['تويوتا', 'لكزس', 'هيونداي', 'كيا', 'نيسان', 'مرسيدس', 'بي إم دبليو', 'أودي', 'فورد', 'شيفروليه'];

const DEALER_TYPE_LABELS: Record<string, { ar: string; en: string; icon: React.ReactNode; color: string }> = {
  sell: { ar: 'بيع', en: 'Sell', icon: <Tag className="w-3 h-3" />, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  buy: { ar: 'شراء', en: 'Buy', icon: <ShoppingCart className="w-3 h-3" />, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  both: { ar: 'بيع وشراء', en: 'Buy & Sell', icon: <RefreshCw className="w-3 h-3" />, color: 'bg-[#C9A84C]/20 text-[#C9A84C] border-[#C9A84C]/30' },
};

export default function Dealers() {
  const { lang } = useI18n();
  const isRtl = lang === 'ar';
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();

  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [dealerType, setDealerType] = useState('');
  const [brand, setBrand] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'rating' | 'vehicles' | 'views'>('rating');
  const [showFilters, setShowFilters] = useState(false);

  const PAGE_SIZE = 20;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 when filters change
  const prevFiltersRef = useRef({ city, brand, query, verifiedOnly, dealerType });
  useEffect(() => {
    const prev = prevFiltersRef.current;
    if (prev.city !== city || prev.brand !== brand || prev.query !== query || prev.verifiedOnly !== verifiedOnly || prev.dealerType !== dealerType) {
      setCurrentPage(1);
      prevFiltersRef.current = { city, brand, query, verifiedOnly, dealerType };
    }
  }, [city, brand, query, verifiedOnly, dealerType]);

  const { data: dealers = [], isLoading } = trpc.dealers.list.useQuery({
    city: city || undefined,
    brand: brand || undefined,
    q: query || undefined,
    verified: verifiedOnly || undefined,
    dealerType: dealerType || undefined,
    limit: PAGE_SIZE,
    offset: (currentPage - 1) * PAGE_SIZE,
  });

  const sorted = [...dealers].sort((a, b) => {
    if (sortBy === 'rating') return (((b as any).rating ?? 0)) - (((a as any).rating ?? 0));
    if (sortBy === 'vehicles') return (((b as any).vehiclesCount ?? 0)) - (((a as any).vehiclesCount ?? 0));
    return (((b as any).views ?? 0)) - (((a as any).views ?? 0));
  });

  const clearFilters = () => { setCity(''); setBrand(''); setQuery(''); setVerifiedOnly(false); setDealerType(''); };
  const hasFilters = city || brand || query || verifiedOnly || dealerType;

  // Estimate pagination: if we got a full page, there might be more
  const hasNextPage = sorted.length === PAGE_SIZE;
  const hasPrevPage = currentPage > 1;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white" dir={isRtl ? 'rtl' : 'ltr'}>
      <Header />

      {/* Hero */}
      <div className="bg-[#0d0d0d] border-b border-[#1e1e1e] pt-24 pb-10">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-2">
            {isRtl ? 'ابحث عن معرض' : 'Find a Dealership'}
          </h1>
          <p className="text-gray-400 text-lg">
            {isRtl ? 'اكتشف أفضل معارض السيارات الموثوقة في المملكة' : 'Discover trusted car dealerships across Saudi Arabia'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search + Filters */}
        <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-5 mb-8">
          {/* Main Search Row */}
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500`} />
              <input
                type="text"
                placeholder={isRtl ? 'ابحث باسم المعرض أو الحي...' : 'Search by name or area...'}
                value={query}
                onChange={e => setQuery(e.target.value)}
                className={`w-full ${isRtl ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#C9A84C] text-sm`}
              />
            </div>
            <button onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-5 py-3.5 rounded-xl border transition-all font-bold text-sm ${showFilters ? 'bg-[#C9A84C] text-black border-[#C9A84C]' : 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-300 hover:border-[#C9A84C]'}`}>
              <SlidersHorizontal className="w-4 h-4" />
              {isRtl ? 'فلاتر' : 'Filters'}
              {hasFilters && <span className="w-2 h-2 bg-red-500 rounded-full" />}
            </button>
          </div>

          {/* Dealer Type Quick Filter */}
          <div className="flex gap-2 flex-wrap">
            {[
              { value: '', label: isRtl ? 'الكل' : 'All', icon: null },
              { value: 'sell', label: isRtl ? 'معارض البيع' : 'Sell Dealers', icon: <Tag className="w-3 h-3" /> },
              { value: 'buy', label: isRtl ? 'معارض الشراء' : 'Buy Dealers', icon: <ShoppingCart className="w-3 h-3" /> },
              { value: 'both', label: isRtl ? 'بيع وشراء' : 'Buy & Sell', icon: <RefreshCw className="w-3 h-3" /> },
            ].map(opt => (
              <button key={opt.value} onClick={() => setDealerType(opt.value)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-bold transition-all ${dealerType === opt.value ? 'bg-[#C9A84C] text-black border-[#C9A84C]' : 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-400 hover:border-[#C9A84C] hover:text-[#C9A84C]'}`}>
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-[#1e1e1e] grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative">
                <MapPin className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500`} />
                <select value={city} onChange={e => setCity(e.target.value)}
                  className={`w-full ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white focus:outline-none focus:border-[#C9A84C] text-sm appearance-none`}>
                  <option value="">{isRtl ? 'كل المدن' : 'All Cities'}</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="relative">
                <Car className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500`} />
                <select value={brand} onChange={e => setBrand(e.target.value)}
                  className={`w-full ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white focus:outline-none focus:border-[#C9A84C] text-sm appearance-none`}>
                  <option value="">{isRtl ? 'كل الماركات' : 'All Brands'}</option>
                  {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-3 px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl cursor-pointer hover:border-[#C9A84C] transition-all">
                <input type="checkbox" checked={verifiedOnly} onChange={e => setVerifiedOnly(e.target.checked)}
                  className="w-4 h-4 accent-[#C9A84C]" />
                <span className="text-sm text-gray-300 font-bold">{isRtl ? 'موثق فقط' : 'Verified Only'}</span>
                <BadgeCheck className="w-4 h-4 text-[#C9A84C]" />
              </label>
            </div>
          )}
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm">
              <strong className="text-white font-bold">{sorted.length}</strong> {isRtl ? 'معرض' : 'dealerships'}
            </span>
            {hasFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors">
                <X className="w-3 h-3" /> {isRtl ? 'مسح الفلاتر' : 'Clear filters'}
              </button>
            )}
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as 'rating' | 'vehicles' | 'views')}
            className="text-sm bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2 text-gray-300 focus:outline-none focus:border-[#C9A84C]">
            <option value="rating">{isRtl ? 'الأعلى تقييماً' : 'Top Rated'}</option>
            <option value="vehicles">{isRtl ? 'الأكثر سيارات' : 'Most Vehicles'}</option>
            <option value="views">{isRtl ? 'الأكثر مشاهدة' : 'Most Viewed'}</option>
          </select>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#111] rounded-2xl h-72 animate-pulse border border-[#1e1e1e]" />
            ))}
          </div>
        ) : sorted.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sorted.map(dealer => {
              const inFav = isFavorite(dealer.id, 'dealer');
              const typeInfo = DEALER_TYPE_LABELS[dealer.dealerType ?? 'sell'];
              const brandsArr: string[] = (() => { try { return JSON.parse(dealer.brands || '[]'); } catch { return []; } })();
              return (
                <div key={dealer.id} className="bg-[#111] border border-[#1e1e1e] rounded-2xl overflow-hidden hover:border-[#C9A84C]/40 transition-all group">
                  {/* Cover */}
                  <div className="relative h-40 bg-[#1a1a1a]">
                    {dealer.cover ? (
                      <img src={dealer.cover} alt={dealer.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car className="w-16 h-16 text-gray-700" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    {/* Favorite */}
                    <button onClick={() => inFav ? removeFavorite(dealer.id, 'dealer') : addFavorite({ id: dealer.id, type: 'dealer', data: dealer })}
                      className={`absolute top-3 ${isRtl ? 'left-3' : 'right-3'} w-9 h-9 rounded-full flex items-center justify-center transition-all ${inFav ? 'bg-red-500 text-white' : 'bg-black/50 text-gray-300 hover:bg-red-500 hover:text-white'}`}>
                      <Heart className="w-4 h-4" fill={inFav ? 'currentColor' : 'none'} />
                    </button>
                    {/* Plan Badge */}
                    {dealer.plan === 'premium' && (
                      <span className="absolute top-3 left-3 bg-[#C9A84C] text-black text-xs font-black px-2 py-1 rounded-full">
                        {isRtl ? 'مميز' : 'Premium'}
                      </span>
                    )}
                    {/* Logo */}
                    <div className={`absolute bottom-3 ${isRtl ? 'right-3' : 'left-3'}`}>
                      {dealer.logo ? (
                        <img src={dealer.logo} alt={dealer.name} className="w-12 h-12 rounded-xl object-cover border-2 border-[#C9A84C]" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-[#C9A84C]/20 border-2 border-[#C9A84C] flex items-center justify-center">
                          <Car className="w-6 h-6 text-[#C9A84C]" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-black text-white text-lg">{dealer.name}</h3>
                          {dealer.isVerified && <BadgeCheck className="w-5 h-5 text-[#C9A84C]" />}
                        </div>
                        <p className="text-gray-400 text-sm flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />{dealer.city}{dealer.neighborhood ? ` · ${dealer.neighborhood}` : ''}
                        </p>
                      </div>
                      {typeInfo && (
                        <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold ${typeInfo.color}`}>
                          {typeInfo.icon}
                          {typeInfo[lang]}
                        </span>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-[#C9A84C] fill-[#C9A84C]" />
                        <span className="text-white font-bold">{((dealer as any).rating ?? 0).toFixed(1)}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Car className="w-3.5 h-3.5" />
                        {(dealer as any).vehiclesCount ?? 0} {isRtl ? 'سيارة' : 'cars'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {((dealer as any).views ?? 0).toLocaleString()}
                      </span>
                    </div>

                    {/* Brands */}
                    {brandsArr.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {brandsArr.slice(0, 3).map(b => (
                          <span key={b} className="text-xs bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 px-2 py-0.5 rounded-full">{b}</span>
                        ))}
                        {brandsArr.length > 3 && (
                          <span className="text-xs bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 px-2 py-0.5 rounded-full">+{brandsArr.length - 3}</span>
                        )}
                      </div>
                    )}

                    <Link href={`/dealer/${dealer.slug}`}>
                      <button className="w-full py-2.5 bg-[#C9A84C] text-black font-black rounded-xl hover:bg-[#b8973b] transition-all flex items-center justify-center gap-2 text-sm">
                        {isRtl ? 'عرض المعرض' : 'View Dealership'}
                        <ChevronRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24">
            <Car className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">{isRtl ? 'لا توجد نتائج' : 'No results found'}</h3>
            <p className="text-gray-500">{isRtl ? 'جرّب تغيير معايير البحث' : 'Try changing your search criteria'}</p>
            <button onClick={clearFilters} className="mt-4 px-6 py-3 bg-[#C9A84C] text-black font-bold rounded-xl text-sm">
              {isRtl ? 'مسح الفلاتر' : 'Clear Filters'}
            </button>
          </div>
        )}

        {/* Pagination */}
        {(hasNextPage || hasPrevPage) && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={!hasPrevPage}
              className="px-4 py-2 rounded-xl bg-[#111] border border-[#2a2a2a] text-gray-300 hover:border-[#C9A84C] hover:text-[#C9A84C] disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-semibold"
            >
              {isRtl ? 'السابق' : 'Prev'}
            </button>
            <span className="px-4 py-2 rounded-xl bg-[#C9A84C] text-black font-black text-sm min-w-[2.5rem] text-center">{currentPage}</span>
            <button
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={!hasNextPage}
              className="px-4 py-2 rounded-xl bg-[#111] border border-[#2a2a2a] text-gray-300 hover:border-[#C9A84C] hover:text-[#C9A84C] disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-semibold"
            >
              {isRtl ? 'التالي' : 'Next'}
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
