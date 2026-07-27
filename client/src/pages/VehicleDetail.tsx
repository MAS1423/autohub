import { useState } from 'react';
import { useParams, Link } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useI18n } from '@/lib/i18n';
import { useCompare } from '@/contexts/CompareContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Car, MapPin, Phone, MessageCircle, BadgeCheck, Heart,
  BarChart2, ChevronRight, Fuel, Settings2, Gauge, Calendar,
  Play, Eye, Share2, ArrowRight, ArrowLeft, Shield, Clock
} from 'lucide-react';
import { toast } from 'sonner';

const FUEL_LABELS: Record<string, { ar: string; en: string }> = {
  petrol: { ar: 'بنزين', en: 'Petrol' },
  diesel: { ar: 'ديزل', en: 'Diesel' },
  hybrid: { ar: 'هجين', en: 'Hybrid' },
  electric: { ar: 'كهربائي', en: 'Electric' },
};
const TRANS_LABELS: Record<string, { ar: string; en: string }> = {
  automatic: { ar: 'أوتوماتيك', en: 'Automatic' },
  manual: { ar: 'يدوي', en: 'Manual' },
};
const COND_LABELS: Record<string, { ar: string; en: string }> = {
  new: { ar: 'جديد', en: 'New' },
  used: { ar: 'مستعمل', en: 'Used' },
};

function toSaudiWhatsappNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('966')) return digits;
  if (digits.startsWith('0')) return `966${digits.slice(1)}`;
  return digits.startsWith('5') ? `966${digits}` : digits;
}

export default function VehicleDetail() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id ?? '0');
  const { lang } = useI18n();
  const isRtl = lang === 'ar';
  const { addToCompare, isInCompare, removeFromCompare, canAdd } = useCompare();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();

  const [activeImg, setActiveImg] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [showInquiry, setShowInquiry] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({ name: '', phone: '', message: '' });

  const { data: vehicle, isLoading } = trpc.vehicles.byId.useQuery({ id }, { enabled: !!id && !isNaN(id) });
  const createInquiry = trpc.inquiries.create.useMutation({
    onSuccess: () => {
      toast.success(isRtl ? 'تم إرسال استفسارك بنجاح!' : 'Inquiry sent successfully!');
      setShowInquiry(false);
      setInquiryForm({ name: '', phone: '', message: '' });
    },
    onError: () => toast.error(isRtl ? 'حدث خطأ، حاول مجدداً' : 'Error, please try again'),
  });

  if (isLoading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">{isRtl ? 'جاري التحميل...' : 'Loading...'}</p>
      </div>
    </div>
  );

  if (!vehicle) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="text-center">
        <Car className="w-20 h-20 text-gray-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">{isRtl ? 'السيارة غير موجودة' : 'Vehicle Not Found'}</h2>
        <Link href="/vehicles/search">
          <button className="mt-4 px-6 py-3 bg-[#C9A84C] text-black font-bold rounded-lg">
            {isRtl ? 'العودة للبحث' : 'Back to Search'}
          </button>
        </Link>
      </div>
    </div>
  );

  const imgs: string[] = (() => { try { return JSON.parse(vehicle.images || '[]'); } catch { return []; } })();
  if (imgs.length === 0) imgs.push('/assets/car-suv.jpg');

  const inFav = isFavorite(vehicle.id, 'vehicle');
  const inCmp = isInCompare(vehicle.id);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success(isRtl ? 'تم نسخ الرابط' : 'Link copied');
  };

  const handleInquiry = () => {
    if (!inquiryForm.name || !inquiryForm.phone || !inquiryForm.message) {
      toast.error(isRtl ? 'يرجى ملء جميع الحقول' : 'Please fill all fields');
      return;
    }
    createInquiry.mutate({
      dealerId: vehicle.dealerId,
      vehicleId: vehicle.id,
      name: inquiryForm.name,
      phone: inquiryForm.phone,
      message: inquiryForm.message,
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white" dir={isRtl ? 'rtl' : 'ltr'}>
      <Header />

      <div className="max-w-7xl mx-auto px-4 pt-28 pb-20">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-[#C9A84C] transition-colors">{isRtl ? 'الرئيسية' : 'Home'}</Link>
          <ChevronRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
          <Link href="/vehicles/search" className="hover:text-[#C9A84C] transition-colors">{isRtl ? 'السيارات' : 'Vehicles'}</Link>
          <ChevronRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
          <span className="text-white">{vehicle.brand} {vehicle.model} {vehicle.year}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Left: Gallery + Info ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gallery */}
            <div className="bg-[#111] rounded-2xl overflow-hidden border border-[#1e1e1e]">
              <div className="relative h-[400px] md:h-[500px]">
                {showVideo && vehicle.videoUrl ? (
                  <video src={vehicle.videoUrl} controls autoPlay className="w-full h-full object-cover" />
                ) : (
                  <img src={imgs[activeImg]} alt={`${vehicle.brand} ${vehicle.model}`} className="w-full h-full object-cover" />
                )}
                <span className={`absolute top-4 ${isRtl ? 'right-4' : 'left-4'} text-sm font-bold px-3 py-1 rounded-full ${vehicle.condition === 'new' ? 'bg-green-500 text-black' : 'bg-blue-500 text-white'}`}>
                  {COND_LABELS[vehicle.condition]?.[lang] ?? vehicle.condition}
                </span>
                {vehicle.videoUrl && !showVideo && (
                  <button onClick={() => setShowVideo(true)}
                    className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/70 text-white px-4 py-2 rounded-full hover:bg-[#C9A84C] hover:text-black transition-all font-bold text-sm">
                    <Play className="w-4 h-4 fill-current" />
                    {isRtl ? 'شاهد الفيديو' : 'Watch Video'}
                  </button>
                )}
                {imgs.length > 1 && (
                  <>
                    <button onClick={() => setActiveImg(i => (i - 1 + imgs.length) % imgs.length)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 rounded-full flex items-center justify-center hover:bg-[#C9A84C] hover:text-black transition-all">
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <button onClick={() => setActiveImg(i => (i + 1) % imgs.length)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 rounded-full flex items-center justify-center hover:bg-[#C9A84C] hover:text-black transition-all">
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
              {imgs.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto">
                  {imgs.map((img, i) => (
                    <button key={i} onClick={() => { setActiveImg(i); setShowVideo(false); }}
                      className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all ${activeImg === i ? 'border-[#C9A84C]' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                  {vehicle.videoUrl && (
                    <button onClick={() => setShowVideo(true)}
                      className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 bg-[#1a1a1a] flex items-center justify-center transition-all ${showVideo ? 'border-[#C9A84C]' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                      <Play className="w-6 h-6 text-[#C9A84C]" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Title + Actions */}
            <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-3xl font-black text-white">{vehicle.brand} {vehicle.model}</h1>
                  <p className="text-gray-400 mt-1">{vehicle.year} • {FUEL_LABELS[vehicle.fuelType]?.[lang]} • {TRANS_LABELS[vehicle.transmission]?.[lang]}</p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button onClick={() => {
                    if (inFav) { removeFavorite(vehicle.id, 'vehicle'); toast.info(isRtl ? 'تمت إزالة السيارة من المفضلة' : 'Removed from favorites'); }
                    else { addFavorite({ id: vehicle.id, type: 'vehicle', data: vehicle }); toast.success(isRtl ? 'تم حفظ السيارة في المفضلة' : 'Saved to favorites'); }
                  }}
                    className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-black transition-all ${inFav ? 'border-rose-400 bg-rose-500 text-white' : 'border-[#2a2a2a] text-gray-300 hover:border-rose-400 hover:text-rose-300'}`}>
                    <Heart className="w-4 h-4" fill={inFav ? 'currentColor' : 'none'} />
                    {inFav ? (isRtl ? 'ضمن المفضلة' : 'Saved') : (isRtl ? 'حفظ في المفضلة' : 'Save')}
                  </button>
                  <button onClick={() => {
                    if (inCmp) { removeFromCompare(vehicle.id); toast.info(isRtl ? 'تمت إزالة السيارة من المقارنة' : 'Removed from comparison'); return; }
                    if (!canAdd) { toast.error(isRtl ? 'يمكنك مقارنة 3 سيارات كحد أقصى' : 'You can compare up to 3 cars'); return; }
                    addToCompare({ id: vehicle.id, brand: vehicle.brand, model: vehicle.model, year: vehicle.year, price: vehicle.price, condition: vehicle.condition as 'new' | 'used', fuelType: vehicle.fuelType, transmission: vehicle.transmission, mileage: vehicle.mileage, color: vehicle.color ?? null, images: vehicle.images || '[]', dealerName: vehicle.dealerName ?? undefined });
                    toast.success(isRtl ? 'تمت إضافة السيارة إلى المقارنة' : 'Added to comparison');
                  }}
                    className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-black transition-all ${inCmp ? 'border-[#C9A84C] bg-[#C9A84C] text-black' : 'border-[#2a2a2a] text-gray-300 hover:border-[#C9A84C] hover:text-[#f0d886]'}`}>
                    <BarChart2 className="w-4 h-4" />
                    {inCmp ? (isRtl ? 'ضمن المقارنة' : 'In comparison') : (isRtl ? 'أضف للمقارنة' : 'Compare')}
                  </button>
                  <button onClick={handleShare} title={isRtl ? 'مشاركة السيارة' : 'Share vehicle'} aria-label={isRtl ? 'مشاركة السيارة' : 'Share vehicle'}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#2a2a2a] text-gray-400 transition-all hover:border-white hover:text-white">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="text-4xl font-black text-[#C9A84C] mb-4">
                {vehicle.price.toLocaleString()} {isRtl ? 'ر.س' : 'SAR'}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{vehicle.views} {isRtl ? 'مشاهدة' : 'views'}</span>
                {(vehicle.city || vehicle.dealerCity) && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{vehicle.city || vehicle.dealerCity}</span>}
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{new Date(vehicle.createdAt).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US')}</span>
              </div>
            </div>

            {/* Specs */}
            <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">{isRtl ? 'المواصفات' : 'Specifications'}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: <Calendar className="w-5 h-5 text-[#C9A84C]" />, label: isRtl ? 'سنة الصنع' : 'Year', value: vehicle.year },
                  { icon: <Gauge className="w-5 h-5 text-[#C9A84C]" />, label: isRtl ? 'المسافة' : 'Mileage', value: `${vehicle.mileage.toLocaleString()} ${isRtl ? 'كم' : 'km'}` },
                  { icon: <Fuel className="w-5 h-5 text-[#C9A84C]" />, label: isRtl ? 'الوقود' : 'Fuel', value: FUEL_LABELS[vehicle.fuelType]?.[lang] ?? vehicle.fuelType },
                  { icon: <Settings2 className="w-5 h-5 text-[#C9A84C]" />, label: isRtl ? 'ناقل الحركة' : 'Transmission', value: TRANS_LABELS[vehicle.transmission]?.[lang] ?? vehicle.transmission },
                  { icon: <Car className="w-5 h-5 text-[#C9A84C]" />, label: isRtl ? 'الحالة' : 'Condition', value: COND_LABELS[vehicle.condition]?.[lang] ?? vehicle.condition },
                  { icon: <Shield className="w-5 h-5 text-[#C9A84C]" />, label: isRtl ? 'اللون' : 'Color', value: vehicle.color || (isRtl ? 'غير محدد' : 'N/A') },
                  { icon: <MapPin className="w-5 h-5 text-[#C9A84C]" />, label: isRtl ? 'المدينة' : 'City', value: vehicle.city || vehicle.dealerCity || (isRtl ? 'غير محدد' : 'N/A') },
                ].map((spec, i) => (
                  <div key={i} className="bg-[#1a1a1a] rounded-xl p-4 flex flex-col gap-2">
                    {spec.icon}
                    <p className="text-xs text-gray-500">{spec.label}</p>
                    <p className="font-bold text-white text-sm">{spec.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {vehicle.description && (
              <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-3">{isRtl ? 'وصف السيارة' : 'Description'}</h2>
                <p className="text-gray-300 leading-relaxed">{vehicle.description}</p>
              </div>
            )}
          </div>

          {/* ── Right: Dealer Card + Inquiry ── */}
          <div className="space-y-6">
            {vehicle.dealerName && (
              <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-6 sticky top-28">
                <h3 className="text-sm text-gray-400 mb-4 font-medium">{isRtl ? 'معروض بواسطة' : 'Listed by'}</h3>
                <div className="flex items-center gap-3 mb-5">
                  {vehicle.dealerLogo ? (
                    <img src={vehicle.dealerLogo} alt={vehicle.dealerName} className="w-14 h-14 rounded-xl object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-[#C9A84C]/20 flex items-center justify-center">
                      <Car className="w-7 h-7 text-[#C9A84C]" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1">
                      <h4 className="font-bold text-white text-lg">{vehicle.dealerName}</h4>
                      {vehicle.dealerVerified && <BadgeCheck className="w-5 h-5 text-[#C9A84C]" />}
                    </div>
                    {vehicle.dealerCity && (
                      <p className="text-gray-400 text-sm flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />{vehicle.dealerCity}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <button onClick={() => setShowInquiry(!showInquiry)}
                    className="w-full py-3 bg-[#C9A84C] text-black font-black rounded-xl hover:bg-[#b8973b] transition-all flex items-center justify-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    {isRtl ? 'أرسل استفساراً' : 'Send Inquiry'}
                  </button>
                  {vehicle.dealerWhatsapp && (
                    <a href={`https://wa.me/${toSaudiWhatsappNumber(vehicle.dealerWhatsapp)}`} target="_blank" rel="noopener noreferrer"
                      className="w-full py-3 bg-[#25D366] text-white font-bold rounded-xl hover:bg-[#1fba57] transition-all flex items-center justify-center gap-2">
                      <MessageCircle className="w-5 h-5" />
                      {isRtl ? 'تواصل عبر واتساب' : 'WhatsApp'}
                    </a>
                  )}
                  {vehicle.dealerPhone && (
                    <a href={`tel:${vehicle.dealerPhone}`}
                      className="w-full py-3 bg-[#1a1a1a] border border-[#2a2a2a] text-white font-bold rounded-xl hover:border-[#C9A84C] transition-all flex items-center justify-center gap-2">
                      <Phone className="w-5 h-5" />
                      {vehicle.dealerPhone}
                    </a>
                  )}
                </div>

                {showInquiry && (
                  <div className="border-t border-[#2a2a2a] pt-4 space-y-3">
                    <input type="text" placeholder={isRtl ? 'اسمك الكريم' : 'Your Name'}
                      value={inquiryForm.name} onChange={e => setInquiryForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#C9A84C] text-sm" />
                    <input type="tel" placeholder={isRtl ? 'رقم الجوال' : 'Phone Number'}
                      value={inquiryForm.phone} onChange={e => setInquiryForm(f => ({ ...f, phone: e.target.value }))}
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#C9A84C] text-sm" />
                    <textarea placeholder={isRtl ? 'رسالتك...' : 'Your message...'}
                      value={inquiryForm.message} onChange={e => setInquiryForm(f => ({ ...f, message: e.target.value }))}
                      rows={3}
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#C9A84C] text-sm resize-none" />
                    <button onClick={handleInquiry} disabled={createInquiry.isPending}
                      className="w-full py-3 bg-[#C9A84C] text-black font-bold rounded-lg hover:bg-[#b8973b] transition-all disabled:opacity-50">
                      {createInquiry.isPending ? (isRtl ? 'جاري الإرسال...' : 'Sending...') : (isRtl ? 'إرسال' : 'Send')}
                    </button>
                  </div>
                )}

                {vehicle.dealerSlug && (
                  <Link href={`/dealer/${vehicle.dealerSlug}`}>
                    <button className="w-full mt-4 py-3 border border-[#2a2a2a] text-gray-300 font-bold rounded-xl hover:border-[#C9A84C] hover:text-[#C9A84C] transition-all flex items-center justify-center gap-2">
                      <Car className="w-5 h-5" />
                      {isRtl ? 'عرض صفحة المعرض كاملاً' : 'View Full Dealership'}
                      <ChevronRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
                    </button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
