// AutoHub Pricing Page — Precision Automotive Design
import { useLocation } from 'wouter';
import { BadgeCheck, Zap, Star, Crown, Check } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { toast } from 'sonner';

const PLANS = [
  {
    id: 'free', icon: Zap, name: 'مجانية', price: 0, period: 'دائماً',
    highlight: false, badge: null,
    features: ['ملف تعريفي أساسي', 'حتى 5 سيارات', 'إحصائيات محدودة', 'ظهور في نتائج البحث'],
    cta: 'ابدأ مجاناً',
  },
  {
    id: 'basic', icon: BadgeCheck, name: 'أساسية', price: 199, period: 'شهرياً',
    highlight: false, badge: null,
    features: ['حتى 30 سيارة', 'إحصائيات كاملة', 'شارة "موثق"', 'ظهور محسّن في البحث', 'دعم فني'],
    cta: 'اشترك الآن',
  },
  {
    id: 'pro', icon: Star, name: 'احترافية', price: 499, period: 'شهرياً',
    highlight: true, badge: 'الأكثر شعبية',
    features: ['سيارات غير محدودة', 'ظهور مميز في البحث', 'تقارير متقدمة', 'شارة "احترافي"', 'أولوية في الدعم', 'رابط مخصص'],
    cta: 'اشترك الآن',
  },
  {
    id: 'premium', icon: Crown, name: 'مميزة', price: 999, period: 'شهرياً',
    highlight: false, badge: 'الأفضل',
    features: ['كل مزايا الاحترافية', 'إعلان بارز في الرئيسية', 'مدير حساب مخصص', 'تحليلات AI متقدمة', 'شارة "مميز" الذهبية', 'ظهور أولي في كل البحوث'],
    cta: 'تواصل معنا',
  },
];

export default function Pricing() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      <div className="pt-16">
        {/* Hero */}
        <div className="autohub-dark py-20 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: 'repeating-linear-gradient(45deg, oklch(0.72 0.18 55) 0, oklch(0.72 0.18 55) 1px, transparent 0, transparent 50%)', backgroundSize: '20px 20px' }} />
          <div className="container text-center relative z-10">
            <div className="gold-badge mb-5 mx-auto w-fit">خطط الاشتراك</div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
              ابدأ مجاناً،<br />
              <span style={{ color: 'oklch(0.72 0.18 55)' }}>طوّر متى شئت</span>
            </h1>
            <p className="text-white/40 max-w-xl mx-auto font-body text-lg">اختر الخطة المناسبة لحجم معرضك. لا عقود طويلة، لا رسوم خفية.</p>
          </div>
          {/* Bottom diagonal */}
          <div className="absolute bottom-0 left-0 right-0 h-10" style={{ background: 'oklch(0.97 0.003 80)', clipPath: 'polygon(0 100%, 100% 0, 100% 100%)' }} />
        </div>

        <div className="container py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {PLANS.map(plan => {
              const Icon = plan.icon;
              return (
                <div key={plan.id} className="relative flex flex-col"
                  style={plan.highlight ? {
                    background: 'oklch(0.10 0.01 260)',
                    border: '1px solid oklch(0.72 0.18 55)',
                    clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))',
                    boxShadow: '0 0 40px oklch(0.72 0.18 55 / 0.2)',
                  } : {
                    background: 'oklch(1 0 0)',
                    border: '1px solid oklch(0.88 0.005 80)',
                    clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))',
                  }}>
                  {plan.badge && (
                    <div className="absolute -top-3.5 right-1/2 translate-x-1/2 z-10">
                      <span className="gold-badge text-xs px-4 py-1">{plan.badge}</span>
                    </div>
                  )}
                  <div className="p-6 flex flex-col flex-1">
                    {/* Icon */}
                    <div className="w-11 h-11 flex items-center justify-center mb-4 flex-shrink-0"
                      style={{
                        background: plan.highlight ? 'oklch(0.72 0.18 55 / 0.15)' : 'oklch(0.94 0.004 80)',
                        clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
                      }}>
                      <Icon size={20} style={{ color: plan.highlight ? 'oklch(0.72 0.18 55)' : 'oklch(0.50 0.01 260)' }} />
                    </div>
                    <h3 className={`text-lg font-black mb-1 ${plan.highlight ? 'text-white' : ''}`}>{plan.name}</h3>
                    <div className="mb-6">
                      <span className={`text-4xl font-black font-data ${plan.highlight ? 'text-white' : ''}`}>
                        {plan.price === 0 ? 'مجاني' : plan.price.toLocaleString('ar-SA')}
                      </span>
                      {plan.price > 0 && (
                        <span className={`text-sm mr-1 ${plan.highlight ? 'text-white/40' : 'text-muted-foreground'}`}>
                          ر.س / {plan.period}
                        </span>
                      )}
                    </div>
                    <ul className="space-y-3 flex-1 mb-6">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-center gap-2.5 text-sm font-body">
                          <Check size={13} style={{ color: 'oklch(0.72 0.18 55)', flexShrink: 0 }} />
                          <span className={plan.highlight ? 'text-white/80' : ''}>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => plan.id === 'premium' ? toast.info('سيتواصل معك فريقنا قريباً') : navigate('/register')}
                      className={`w-full py-3.5 font-bold text-sm transition-all ${plan.highlight ? 'btn-gold' : 'border border-border hover:bg-secondary transition-colors'}`}
                      style={!plan.highlight ? { clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' } : {}}>
                      {plan.cta}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Comparison hint */}
          <div className="mt-10 text-center">
            <p className="text-muted-foreground text-sm font-body">جميع الخطط تشمل: SSL مجاني · نسخ احتياطي يومي · دعم عربي متخصص</p>
          </div>

          {/* FAQ */}
          <div className="mt-20 max-w-2xl mx-auto">
            <h2 className="text-2xl font-black text-center mb-2">أسئلة شائعة</h2>
            <p className="text-center text-muted-foreground font-body mb-10">كل ما تحتاج معرفته قبل الاشتراك</p>
            <div className="border border-border" style={{ clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)' }}>
              {[
                { q: 'هل يمكنني الترقية أو التخفيض في أي وقت؟', a: 'نعم، يمكنك تغيير خطتك في أي وقت. سيتم احتساب الفرق بشكل تناسبي.' },
                { q: 'هل أحتاج لبطاقة ائتمانية للبدء المجاني؟', a: 'لا، الخطة المجانية لا تتطلب أي معلومات دفع.' },
                { q: 'كيف يتم التحقق من المعرض؟', a: 'نطلب نسخة من السجل التجاري والترخيص التجاري. يستغرق التحقق 1-2 يوم عمل.' },
                { q: 'هل يمكنني إضافة أكثر من معرض؟', a: 'نعم، كل معرض يحتاج اشتراكاً مستقلاً.' },
              ].map(({ q, a }, i, arr) => (
                <div key={q} className={`p-6 ${i < arr.length - 1 ? 'border-b border-border' : ''}`}>
                  <h4 className="font-bold mb-2">{q}</h4>
                  <p className="text-muted-foreground text-sm font-body leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-16 autohub-dark p-10 text-center relative overflow-hidden"
            style={{ clipPath: 'polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 24px 100%, 0 calc(100% - 24px))' }}>
            <div className="absolute inset-0 opacity-5"
              style={{ backgroundImage: 'repeating-linear-gradient(45deg, oklch(0.72 0.18 55) 0, oklch(0.72 0.18 55) 1px, transparent 0, transparent 50%)', backgroundSize: '20px 20px' }} />
            <h3 className="text-2xl font-black text-white mb-3 relative z-10">هل أنت مستعد للانطلاق؟</h3>
            <p className="text-white/40 font-body mb-6 relative z-10">انضم لأكثر من 1,200 معرض يثقون بأوتو هَب</p>
            <button onClick={() => navigate('/register')} className="btn-gold px-10 py-4 font-bold text-base relative z-10">
              سجّل معرضك مجاناً
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

