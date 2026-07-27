import { useFavorites } from '@/contexts/FavoritesContext';
import { useI18n } from '@/lib/i18n';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLocation } from 'wouter';
import { Heart, Trash2, Car, Building2 } from 'lucide-react';
import { useState } from 'react';

export default function FavoritesPage() {
  const { vehicleFavorites, dealerFavorites, removeFavorite } = useFavorites();
  const { t, isRTL } = useI18n();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<'vehicles' | 'dealers'>('vehicles');

  const gold = 'oklch(0.72 0.18 55)';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'oklch(0.97 0.005 240)' }}>
      <Header />
      <main className="flex-1 py-10 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Title */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black mb-3"
              style={{ background: 'oklch(0.72 0.18 55 / 0.15)', color: 'oklch(0.55 0.18 55)' }}>
              <Heart size={14} fill="currentColor" />
              {t('favorites_title')}
            </div>
            <h1 className="text-3xl font-black" style={{ fontFamily: 'Cairo, sans-serif' }}>{t('favorites_title')}</h1>
            <p className="text-muted-foreground mt-1">{t('favorites_subtitle')}</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl mb-8 w-fit" style={{ background: 'oklch(0.92 0.005 240)' }}>
            {(['vehicles', 'dealers'] as const).map(tabKey => (
              <button
                key={tabKey}
                onClick={() => setTab(tabKey)}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-black transition-all"
                style={tab === tabKey
                  ? { background: gold, color: '#000' }
                  : { color: 'oklch(0.4 0.01 240)' }
                }
              >
                {tabKey === 'vehicles' ? <Car size={15} /> : <Building2 size={15} />}
                {t(tabKey === 'vehicles' ? 'favorites_vehicles_tab' : 'favorites_dealers_tab')}
                <span className="text-xs opacity-70">
                  ({tabKey === 'vehicles' ? vehicleFavorites.length : dealerFavorites.length})
                </span>
              </button>
            ))}
          </div>

          {/* Vehicles */}
          {tab === 'vehicles' && (
            vehicleFavorites.length === 0 ? (
              <div className="text-center py-20">
                <Heart size={56} className="mx-auto mb-4 opacity-20" />
                <h2 className="text-xl font-black mb-2">{t('favorites_empty_vehicles')}</h2>
                <p className="text-muted-foreground mb-6">{t('favorites_empty_vehicles_desc')}</p>
                <button onClick={() => navigate('/vehicles')}
                  className="px-6 py-3 rounded-xl font-black text-black" style={{ background: gold }}>
                  {t('favorites_go_vehicles')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {vehicleFavorites.map(fav => {
                  const v = fav.data;
                  const imgs = (() => { try { return JSON.parse(v.images || '[]'); } catch { return []; } })();
                  return (
                    <div key={fav.id} className="bg-white rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-all group">
                      <div className="relative aspect-video overflow-hidden bg-gray-100">
                        {imgs[0]
                          ? <img src={imgs[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          : <div className="w-full h-full flex items-center justify-center"><Car size={32} className="opacity-20" /></div>
                        }
                        <button
                          onClick={() => removeFavorite(fav.id, 'vehicle')}
                          className="absolute top-2 end-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors shadow"
                        ><Trash2 size={14} /></button>
                      </div>
                      <div className="p-4">
                        <h3 className="font-black text-base">{v.brand} {v.model} {v.year}</h3>
                        <p className="text-lg font-black mt-1" style={{ color: gold }}>
                          {Number(v.price).toLocaleString()} {t('sar')}
                        </p>
                        <button
                          onClick={() => navigate(`/vehicle/${fav.id}`)}
                          className="mt-3 w-full py-2 rounded-lg text-sm font-black border-2 transition-all hover:scale-105"
                          style={{ borderColor: gold, color: 'oklch(0.55 0.18 55)' }}
                        >
                          {t('vehicle_details')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* Dealers */}
          {tab === 'dealers' && (
            dealerFavorites.length === 0 ? (
              <div className="text-center py-20">
                <Building2 size={56} className="mx-auto mb-4 opacity-20" />
                <h2 className="text-xl font-black mb-2">{t('favorites_empty_dealers')}</h2>
                <p className="text-muted-foreground mb-6">{t('favorites_empty_dealers_desc')}</p>
                <button onClick={() => navigate('/dealers')}
                  className="px-6 py-3 rounded-xl font-black text-black" style={{ background: gold }}>
                  {t('favorites_go_dealers')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {dealerFavorites.map(fav => {
                  const d = fav.data;
                  return (
                    <div key={fav.id} className="bg-white rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-all group">
                      <div className="relative h-32 overflow-hidden bg-gray-100">
                        {d.cover
                          ? <img src={d.cover} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          : <div className="w-full h-full flex items-center justify-center"><Building2 size={32} className="opacity-20" /></div>
                        }
                        <button
                          onClick={() => removeFavorite(fav.id, 'dealer')}
                          className="absolute top-2 end-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors shadow"
                        ><Trash2 size={14} /></button>
                      </div>
                      <div className="p-4 flex items-center gap-3">
                        {d.logo && <img src={d.logo} alt="" className="w-12 h-12 rounded-lg object-cover border border-border" />}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-black text-base truncate">{d.name}</h3>
                          <p className="text-sm text-muted-foreground">{d.city}</p>
                        </div>
                      </div>
                      <div className="px-4 pb-4">
                        <button
                          onClick={() => navigate(`/dealer/${d.slug}`)}
                          className="w-full py-2 rounded-lg text-sm font-black border-2 transition-all hover:scale-105"
                          style={{ borderColor: gold, color: 'oklch(0.55 0.18 55)' }}
                        >
                          {t('card_view_profile')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

