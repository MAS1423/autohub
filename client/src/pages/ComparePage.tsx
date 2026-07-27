import { useCompare } from '@/contexts/CompareContext';
import { useI18n } from '@/lib/i18n';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLocation } from 'wouter';
import { X, GitCompareArrows, CheckCircle2, XCircle } from 'lucide-react';

const FUEL_LABELS: Record<string, { ar: string; en: string }> = {
  petrol: { ar: 'بنزين', en: 'Petrol' },
  diesel: { ar: 'ديزل', en: 'Diesel' },
  electric: { ar: 'كهربائي', en: 'Electric' },
  hybrid: { ar: 'هجين', en: 'Hybrid' },
};
const TRANS_LABELS: Record<string, { ar: string; en: string }> = {
  automatic: { ar: 'أوتوماتيك', en: 'Automatic' },
  manual: { ar: 'يدوي', en: 'Manual' },
};
const COND_LABELS: Record<string, { ar: string; en: string }> = {
  new: { ar: 'جديد', en: 'New' },
  used: { ar: 'مستعمل', en: 'Used' },
};

export default function ComparePage() {
  const { compareList, removeFromCompare, clearCompare } = useCompare();
  const { t, lang, isRTL } = useI18n();
  const [, navigate] = useLocation();

  const specs = [
    { key: 'compare_spec_brand', getValue: (v: any) => v.brand },
    { key: 'compare_spec_model', getValue: (v: any) => v.model },
    { key: 'compare_spec_year', getValue: (v: any) => String(v.year) },
    { key: 'compare_spec_price', getValue: (v: any) => `${Number(v.price).toLocaleString()} ${t('sar')}` },
    { key: 'compare_spec_condition', getValue: (v: any) => COND_LABELS[v.condition]?.[lang] || v.condition },
    { key: 'compare_spec_fuel', getValue: (v: any) => FUEL_LABELS[v.fuelType]?.[lang] || v.fuelType },
    { key: 'compare_spec_transmission', getValue: (v: any) => TRANS_LABELS[v.transmission]?.[lang] || v.transmission },
    { key: 'compare_spec_mileage', getValue: (v: any) => v.mileage ? `${Number(v.mileage).toLocaleString()} ${t('km')}` : '—' },
    { key: 'compare_spec_color', getValue: (v: any) => v.color || '—' },
    { key: 'compare_spec_dealer', getValue: (v: any) => v.dealerName || '—' },
    { key: 'compare_spec_city', getValue: (v: any) => v.dealerCity || '—' },
  ] as const;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'oklch(0.97 0.005 240)' }}>
      <Header />
      <main className="flex-1 py-10 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Title */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black mb-3"
              style={{ background: 'oklch(0.72 0.18 55 / 0.15)', color: 'oklch(0.55 0.18 55)' }}>
              <GitCompareArrows size={14} />
              {t('compare_title')}
            </div>
            <h1 className="text-3xl font-black" style={{ fontFamily: 'Cairo, sans-serif' }}>{t('compare_title')}</h1>
            <p className="text-muted-foreground mt-1">{t('compare_subtitle')}</p>
          </div>

          {compareList.length < 2 ? (
            <div className="text-center py-20">
              <GitCompareArrows size={56} className="mx-auto mb-4 opacity-20" />
              <h2 className="text-xl font-black mb-2">{t('compare_empty')}</h2>
              <p className="text-muted-foreground mb-6">{t('compare_empty_desc')}</p>
              <button
                onClick={() => navigate('/vehicles')}
                className="px-6 py-3 rounded-xl font-black text-black"
                style={{ background: 'oklch(0.72 0.18 55)' }}
              >
                {t('compare_go_vehicles')}
              </button>
            </div>
          ) : (
            <>
              {/* Clear button */}
              <div className="flex justify-end mb-4">
                <button onClick={clearCompare} className="text-sm text-red-500 hover:text-red-700 font-bold underline">
                  {t('compare_clear')}
                </button>
              </div>

              {/* Comparison table */}
              <div className="overflow-x-auto rounded-2xl border border-border shadow-sm">
                <table className="w-full" dir={isRTL ? 'rtl' : 'ltr'}>
                  <thead>
                    <tr style={{ background: 'oklch(0.12 0.01 240)' }}>
                      <th className="p-4 text-sm font-black text-white/60 w-40 text-start">{t('compare_spec_brand')}</th>
                      {compareList.map(v => {
                        const imgs = (() => { try { return JSON.parse(v.images); } catch { return []; } })();
                        return (
                          <th key={v.id} className="p-4 text-center relative">
                            <button
                              onClick={() => removeFromCompare(v.id)}
                              className="absolute top-2 end-2 text-white/40 hover:text-white"
                            ><X size={14} /></button>
                            {imgs[0] && (
                              <img src={imgs[0]} alt="" className="w-24 h-16 object-cover rounded-lg mx-auto mb-2" />
                            )}
                            <div className="text-white font-black text-sm">{v.brand} {v.model}</div>
                            <div className="text-white/60 text-xs">{v.year}</div>
                            <div className="text-sm font-black mt-1" style={{ color: 'oklch(0.72 0.18 55)' }}>
                              {Number(v.price).toLocaleString()} {t('sar')}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {specs.map((spec, idx) => {
                      const values = compareList.map(v => spec.getValue(v));
                      const allSame = values.every(val => val === values[0]);
                      return (
                        <tr key={spec.key} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/80'}>
                          <td className="p-4 text-sm font-black text-gray-500 border-e border-border">
                            {t(spec.key as any)}
                          </td>
                          {values.map((val, i) => (
                            <td key={i} className="p-4 text-center text-sm font-bold">
                              <span className={allSame ? 'text-gray-700' : 'text-gray-900 font-black'}>{val}</span>
                              {!allSame && spec.key === 'compare_spec_price' && (
                                <span className="block text-xs mt-0.5">
                                  {val === values.reduce((a, b) =>
                                    parseFloat(a.replace(/[^\d.]/g, '')) < parseFloat(b.replace(/[^\d.]/g, '')) ? a : b
                                  ) ? (
                                    <span className="text-green-600 flex items-center justify-center gap-1">
                                      <CheckCircle2 size={12} /> {lang === 'ar' ? 'الأقل سعراً' : 'Best Price'}
                                    </span>
                                  ) : null}
                                </span>
                              )}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* View details buttons */}
              <div className="grid mt-6" style={{ gridTemplateColumns: `160px repeat(${compareList.length}, 1fr)` }}>
                <div />
                {compareList.map(v => (
                  <div key={v.id} className="px-2">
                    <button
                      onClick={() => navigate(`/vehicle/${v.id}`)}
                      className="w-full py-2.5 rounded-xl text-sm font-black border-2 transition-all hover:scale-105"
                      style={{ borderColor: 'oklch(0.72 0.18 55)', color: 'oklch(0.55 0.18 55)' }}
                    >
                      {t('vehicle_details')}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
