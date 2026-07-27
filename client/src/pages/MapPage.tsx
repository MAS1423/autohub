// AutoHub Map Page — Interactive Google Maps for Dealers
import { useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { MapPin, Star, BadgeCheck, ChevronLeft, Car } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { MapView, hasGoogleMapsKey } from '@/components/Map';
import { DEALERS } from '@/lib/data';
import { trpc } from '@/lib/trpc';

// Saudi Arabia city coordinates
const LOCAL_MARKER_POSITIONS = [
  { top: '25%', left: '18%' },
  { top: '52%', left: '56%' },
  { top: '32%', left: '72%' },
  { top: '71%', left: '35%' },
  { top: '66%', left: '76%' },
  { top: '44%', left: '42%' },
];

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'الرياض': { lat: 24.7136, lng: 46.6753 },
  'جدة': { lat: 21.4858, lng: 39.1925 },
  'مكة المكرمة': { lat: 21.3891, lng: 39.8579 },
  'المدينة المنورة': { lat: 24.5247, lng: 39.5692 },
  'الدمام': { lat: 26.4207, lng: 50.0888 },
  'الخبر': { lat: 26.2172, lng: 50.1971 },
  'تبوك': { lat: 28.3838, lng: 36.5550 },
  'أبها': { lat: 18.2164, lng: 42.5053 },
  'الطائف': { lat: 21.2854, lng: 40.4143 },
  'نجران': { lat: 17.4924, lng: 44.1277 },
};

export default function MapPage() {
  const [, navigate] = useLocation();
  const mapRef = useRef<google.maps.Map | null>(null);
  const [selectedDealer, setSelectedDealer] = useState<any>(null);
  const [activeCity, setActiveCity] = useState<string>('الرياض');
  const [mapsUnavailable, setMapsUnavailable] = useState(!hasGoogleMapsKey);

  const { data: dbDealers } = trpc.dealers.list.useQuery({ limit: 100 });
  const allDealers = (dbDealers && dbDealers.length > 0)
    ? dbDealers.map(d => ({
        ...d,
        brands: d.brands ? JSON.parse(d.brands) : [],
        rating: 4.5,
        reviewsCount: 0,
        cover: d.cover || DEALERS[0]?.cover || '',
        logo: d.logo || DEALERS[0]?.logo || '',
        whatsapp: d.whatsapp || d.phone || '',
        vehiclesCount: d.vehiclesCount || 0,
        views: d.views || 0,
        workingHours: d.workingHours || '9ص - 9م',
      }))
    : DEALERS;

  const handleMapReady = (map: google.maps.Map) => {
    mapRef.current = map;
    placeMarkers(map, allDealers);
  };

  const placeMarkers = (map: google.maps.Map, dealerList: any[]) => {
    const geocoder = new google.maps.Geocoder();
    dealerList.forEach((dealer) => {
      const cityCoords = CITY_COORDS[dealer.city || 'الرياض'] || CITY_COORDS['الرياض'];
      // Use stored lat/lng or geocode city
      const position = (dealer.lat && dealer.lng)
        ? { lat: dealer.lat, lng: dealer.lng }
        : { lat: cityCoords.lat + (Math.random() - 0.5) * 0.05, lng: cityCoords.lng + (Math.random() - 0.5) * 0.05 };

      const markerEl = document.createElement('div');
      markerEl.innerHTML = `
        <div style="
          background: oklch(0.10 0.01 260);
          border: 2px solid oklch(0.72 0.18 55);
          color: white;
          padding: 4px 8px;
          font-family: Cairo, sans-serif;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
          cursor: pointer;
          clip-path: polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 5px 100%, 0 calc(100% - 5px));
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        ">📍 ${dealer.name}</div>
      `;

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position,
        content: markerEl,
        title: dealer.name,
      });

      marker.addListener('click', () => {
        setSelectedDealer(dealer);
        map.panTo(position);
        map.setZoom(14);
      });
    });
  };

  const flyToCity = (city: string) => {
    setActiveCity(city);
    const coords = CITY_COORDS[city];
    if (coords && mapRef.current) {
      mapRef.current.panTo(coords);
      mapRef.current.setZoom(12);
    }
  };

  const activeDealers = allDealers.filter((dealer: any) => dealer.city === activeCity);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      <div className="pt-16">
        {/* Hero */}
        <div className="autohub-dark py-10 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: 'repeating-linear-gradient(45deg, oklch(0.72 0.18 55) 0, oklch(0.72 0.18 55) 1px, transparent 0, transparent 50%)', backgroundSize: '20px 20px' }} />
          <div className="container relative z-10">
            <div className="gold-badge mb-3">📍 خريطة المعارض</div>
            <h1 className="text-3xl font-black text-white mb-1">اكتشف المعارض على الخريطة</h1>
            <p className="text-white/40 font-body">ابحث عن أقرب معرض إليك بشكل مرئي وتفاعلي</p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-8" style={{ background: 'oklch(0.97 0.003 80)', clipPath: 'polygon(0 100%, 100% 0, 100% 100%)' }} />
        </div>

        <div className="container py-6">
          {/* City Filter */}
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.keys(CITY_COORDS).map(city => (
              <button key={city} onClick={() => flyToCity(city)}
                className={`px-3 py-1.5 text-sm font-bold border transition-all ${activeCity === city ? 'border-[oklch(0.72_0.18_55)] text-[oklch(0.50_0.16_55)] bg-[oklch(0.72_0.18_55)]/10' : 'border-border bg-card text-muted-foreground hover:border-foreground/30'}`}
                style={{ clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))' }}>
                {city}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Map */}
            <div className="lg:col-span-2">
              <div className="border border-border overflow-hidden"
                style={{ clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)' }}>
                {mapsUnavailable ? (
                  <div className="relative h-[500px] overflow-hidden bg-[#111]">
                    <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'linear-gradient(rgba(201,168,76,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,.18) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(201,168,76,.16),transparent_58%)]" />
                    <div className="absolute top-5 right-5 left-5 z-10 rounded-lg border border-[#C9A84C]/30 bg-black/65 px-4 py-3 backdrop-blur-sm">
                      <p className="text-sm font-bold text-white">وضع الخريطة المحلية</p>
                      <p className="mt-1 text-xs text-white/60">اختر علامة لعرض معلومات المعرض. أضف مفتاح Google Maps اختياريًا لتفعيل الخريطة الجغرافية.</p>
                    </div>
                    <div className="relative h-full">
                      {activeDealers.map((dealer: any, index: number) => {
                        const position = LOCAL_MARKER_POSITIONS[index % LOCAL_MARKER_POSITIONS.length];
                        return (
                          <button key={dealer.id} onClick={() => setSelectedDealer(dealer)}
                            className="absolute z-10 flex max-w-40 -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full border border-[#C9A84C] bg-[#111]/95 px-3 py-2 text-right text-xs font-bold text-white shadow-[0_8px_24px_rgba(0,0,0,.35)] transition-transform hover:scale-105"
                            style={{ top: position.top, left: position.left }}>
                            <MapPin size={15} className="shrink-0 text-[#C9A84C]" />
                            <span className="truncate">{dealer.name}</span>
                          </button>
                        );
                      })}
                      {activeDealers.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center px-8 text-center text-sm text-white/55">لا توجد معارض مسجلة في هذه المدينة حاليًا.</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <MapView
                    className="h-[500px]"
                    initialCenter={CITY_COORDS['الرياض']}
                    initialZoom={11}
                    onMapReady={handleMapReady}
                    onMapUnavailable={() => setMapsUnavailable(true)}
                  />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2 font-body text-center">اضغط على أي علامة لرؤية تفاصيل المعرض</p>
            </div>

            {/* Sidebar: selected dealer or list */}
            <div className="space-y-3">
              {selectedDealer ? (
                <div className="border border-[oklch(0.72_0.18_55)] bg-card p-5"
                  style={{ clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))' }}>
                  <div className="flex items-start gap-3 mb-4">
                    <img src={selectedDealer.logo} alt={selectedDealer.name} className="w-14 h-14 object-cover border border-border flex-shrink-0"
                      style={{ clipPath: 'polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 5px 100%, 0 calc(100% - 5px))' }} />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-black text-base">{selectedDealer.name}</h3>
                        {selectedDealer.isVerified && <BadgeCheck size={13} className="text-emerald-500" />}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <MapPin size={10} /> {selectedDealer.city} — {selectedDealer.neighborhood}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Star size={9} className="fill-amber-400 text-amber-400" /> {selectedDealer.rating}</span>
                        <span className="flex items-center gap-1"><Car size={9} /> {selectedDealer.vehiclesCount} سيارة</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {(selectedDealer.brands || []).slice(0, 4).map((b: string) => (
                      <span key={b} className="text-xs px-2 py-0.5 border border-border bg-secondary font-bold"
                        style={{ clipPath: 'polygon(0 0, calc(100% - 3px) 0, 100% 3px, 100% 100%, 3px 100%, 0 calc(100% - 3px))' }}>{b}</span>
                    ))}
                  </div>
                  <button onClick={() => navigate(`/dealer/${selectedDealer.slug}`)} className="btn-gold w-full py-2.5 text-sm font-bold">
                    عرض ملف المعرض
                  </button>
                  <button onClick={() => setSelectedDealer(null)} className="w-full py-2 text-xs text-muted-foreground hover:text-foreground mt-2 transition-colors font-body">
                    إغلاق
                  </button>
                </div>
              ) : (
                <div className="border border-border bg-card p-4 text-center"
                  style={{ clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))' }}>
                  <MapPin size={28} className="mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm font-bold mb-1">اضغط على معرض</p>
                  <p className="text-xs text-muted-foreground font-body">اضغط على أي علامة على الخريطة لرؤية تفاصيل المعرض</p>
                </div>
              )}

              {/* Quick list */}
              <div className="border border-border bg-card overflow-hidden"
                style={{ clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)' }}>
                <div className="p-3 border-b border-border">
                  <p className="text-xs font-bold tracking-wider uppercase text-muted-foreground">المعارض في {activeCity}</p>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {allDealers.filter((d: any) => d.city === activeCity).map((dealer: any) => (
                    <button key={dealer.id} onClick={() => setSelectedDealer(dealer)}
                      className="w-full flex items-center gap-3 p-3 border-b border-border/50 hover:bg-secondary transition-colors text-right">
                      <img src={dealer.logo} alt={dealer.name} className="w-9 h-9 object-cover flex-shrink-0"
                        style={{ clipPath: 'polygon(0 0, calc(100% - 3px) 0, 100% 3px, 100% 100%, 3px 100%, 0 calc(100% - 3px))' }} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{dealer.name}</p>
                        <p className="text-xs text-muted-foreground">{dealer.neighborhood}</p>
                      </div>
                    </button>
                  ))}
                  {allDealers.filter((d: any) => d.city === activeCity).length === 0 && (
                    <p className="p-4 text-center text-sm text-muted-foreground font-body">لا توجد معارض مسجلة في هذه المدينة</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
