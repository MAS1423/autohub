import { useCompare } from '@/contexts/CompareContext';
import { useI18n } from '@/lib/i18n';
import { useLocation } from 'wouter';
import { X, GitCompareArrows, ArrowLeft, Plus, CheckCircle2 } from 'lucide-react';

export default function CompareBar() {
  const { compareList, removeFromCompare, clearCompare } = useCompare();
  const { lang, isRTL } = useI18n();
  const [, navigate] = useLocation();

  if (compareList.length === 0) return null;

  const count = compareList.length;
  const ready = count >= 2;
  const remaining = 3 - count;
  const copy = lang === 'ar'
    ? {
        title: 'قائمة مقارنة السيارات',
        progress: `${count} من 3 سيارات مختارة`,
        ready: 'القائمة جاهزة للمقارنة',
        add: `أضف ${remaining} ${remaining === 1 ? 'سيارة أخرى' : 'سيارات أخرى'}`,
        clear: 'مسح القائمة',
        view: 'قارن السيارات الآن',
        remove: 'إزالة',
      }
    : {
        title: 'Car comparison list',
        progress: `${count} of 3 cars selected`,
        ready: 'Your comparison is ready',
        add: `Add ${remaining} more car${remaining === 1 ? '' : 's'}`,
        clear: 'Clear list',
        view: 'Compare cars now',
        remove: 'Remove',
      };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3 sm:px-5 sm:pb-5" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl border border-[#C9A84C]/45 bg-[#101319]/95 shadow-[0_16px_50px_rgba(0,0,0,.48)] backdrop-blur-xl">
        <div className="flex flex-col gap-3 p-3 sm:p-4 lg:flex-row lg:items-center">
          <div className="flex min-w-[185px] items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#C9A84C] text-black shadow-[0_0_0_4px_rgba(201,168,76,.12)]">
              <GitCompareArrows size={21} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-black text-white">{copy.title}</p>
              <p className="mt-0.5 text-xs font-semibold text-white/55">{ready ? copy.ready : copy.progress}</p>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
            {compareList.map(v => {
              const images = (() => { try { return JSON.parse(v.images) as string[]; } catch { return []; } })();
              const thumb = images[0] || '/assets/car-suv.jpg';
              return (
                <div key={v.id} className="group relative flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.055] py-1.5 ps-1.5 pe-2.5">
                  <img src={thumb} alt={`${v.brand} ${v.model}`} className="h-9 w-11 rounded-lg object-cover" />
                  <div className="max-w-28">
                    <p className="truncate text-xs font-black text-white">{v.brand} {v.model}</p>
                    <p className="text-[10px] font-semibold text-white/45">{v.year}</p>
                  </div>
                  <button onClick={() => removeFromCompare(v.id)} title={copy.remove} aria-label={`${copy.remove} ${v.brand} ${v.model}`}
                    className="ms-0.5 flex h-6 w-6 items-center justify-center rounded-md text-white/50 transition hover:bg-rose-500/20 hover:text-rose-300">
                    <X size={14} />
                  </button>
                </div>
              );
            })}
            {!ready && (
              <button onClick={() => navigate('/vehicles')}
                className="flex shrink-0 items-center gap-1.5 rounded-xl border border-dashed border-[#C9A84C]/55 px-3 py-2 text-xs font-black text-[#f2dc91] transition hover:bg-[#C9A84C]/10">
                <Plus size={15} /> {copy.add}
              </button>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button onClick={clearCompare} className="px-2 py-2 text-xs font-bold text-white/55 transition hover:text-rose-300">{copy.clear}</button>
            <button onClick={() => ready ? navigate('/compare') : navigate('/vehicles')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition ${ready ? 'bg-[#C9A84C] text-black hover:bg-[#e0c166]' : 'border border-[#C9A84C]/45 bg-[#C9A84C]/10 text-[#f2dc91] hover:bg-[#C9A84C]/20'}`}>
              {ready ? <CheckCircle2 size={16} /> : <Plus size={16} />}
              {ready ? copy.view : copy.add}
              {isRTL && ready ? <ArrowLeft size={15} /> : null}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
