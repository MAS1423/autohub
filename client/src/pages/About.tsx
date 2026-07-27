import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useI18n } from '@/lib/i18n';
import { Link } from 'wouter';
import { Shield, Star, Car, Users, MapPin, TrendingUp, CheckCircle, Heart, Zap, Globe } from 'lucide-react';

export default function About() {
  const { lang } = useI18n();
  const isRtl = lang === 'ar';

  const stats = [
    { value: '1,240+', label: isRtl ? 'معرض موثوق' : 'Trusted Dealers', icon: Car },
    { value: '18,500+', label: isRtl ? 'سيارة متاحة' : 'Available Cars', icon: TrendingUp },
    { value: '24', label: isRtl ? 'مدينة سعودية' : 'Saudi Cities', icon: MapPin },
    { value: '890+', label: isRtl ? 'معرض موثّق' : 'Verified Dealers', icon: Shield },
  ];

  const values = [
    { icon: Shield, title: isRtl ? 'الموثوقية' : 'Trust', desc: isRtl ? 'نتحقق من كل معرض قبل إدراجه لضمان تجربة آمنة للمشترين' : 'We verify every dealer before listing to ensure a safe experience for buyers.' },
    { icon: Star, title: isRtl ? 'الجودة' : 'Quality', desc: isRtl ? 'نحرص على عرض أفضل المعارض والسيارات بمعلومات دقيقة وموثوقة' : 'We ensure the best dealerships and cars are listed with accurate information.' },
    { icon: Zap, title: isRtl ? 'السرعة' : 'Speed', desc: isRtl ? 'ابحث عن سيارتك المثالية في ثوانٍ بفضل خوارزميات البحث الذكية' : 'Find your perfect car in seconds with smart search algorithms.' },
    { icon: Heart, title: isRtl ? 'تجربة المستخدم' : 'User Experience', desc: isRtl ? 'نصمم كل تفصيلة لتجعل تجربتك سلسة وممتعة' : 'Every detail is designed to make your experience smooth and enjoyable.' },
  ];

  const team = [
    { name: isRtl ? 'فريق التطوير' : 'Dev Team', role: isRtl ? 'هندسة البرمجيات والبنية التحتية' : 'Software Engineering & Infrastructure', icon: '💻' },
    { name: isRtl ? 'فريق التصميم' : 'Design Team', role: isRtl ? 'تجربة المستخدم والهوية البصرية' : 'UX & Visual Identity', icon: '🎨' },
    { name: isRtl ? 'فريق العمليات' : 'Operations Team', role: isRtl ? 'التحقق من المعارض ودعم العملاء' : 'Dealer Verification & Customer Support', icon: '🛡️' },
    { name: isRtl ? 'فريق التسويق' : 'Marketing Team', role: isRtl ? 'النمو والشراكات الاستراتيجية' : 'Growth & Strategic Partnerships', icon: '📈' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white" dir={isRtl ? 'rtl' : 'ltr'}>
      <Header />

      {/* Hero */}
      <div className="relative pt-28 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#C9A84C]/5 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-full px-4 py-1.5 text-[#C9A84C] text-sm font-bold mb-6">
            <Globe className="w-4 h-4" />
            {isRtl ? 'عن أوتو هَب' : 'About AutoHub'}
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
            {isRtl ? (
              <>الدليل الأشمل<br /><span className="text-[#C9A84C]">لمعارض السيارات</span><br />في المملكة</>
            ) : (
              <>The Most Comprehensive<br /><span className="text-[#C9A84C]">Car Dealer Directory</span><br />in Saudi Arabia</>
            )}
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed max-w-2xl mx-auto font-body">
            {isRtl
              ? 'أوتو هَب منصة رقمية متخصصة تربط المشترين بأفضل معارض السيارات الموثوقة في المملكة العربية السعودية. نهدف إلى جعل تجربة شراء السيارة شفافة وسهلة وموثوقة.'
              : 'AutoHub is a specialized digital platform connecting buyers with the best trusted car dealerships in Saudi Arabia. We aim to make the car buying experience transparent, easy, and reliable.'}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map(({ value, label, icon: Icon }) => (
            <div key={label} className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-6 text-center hover:border-[#C9A84C]/40 transition-all">
              <Icon className="w-6 h-6 text-[#C9A84C] mx-auto mb-3" />
              <div className="text-3xl font-black text-white mb-1">{value}</div>
              <div className="text-sm text-gray-400">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Mission */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl font-black text-white mb-4">
              {isRtl ? 'مهمتنا' : 'Our Mission'}
            </h2>
            <p className="text-gray-400 leading-relaxed font-body mb-4">
              {isRtl
                ? 'نسعى إلى بناء أكبر دليل رقمي لمعارض السيارات في المملكة، مع ضمان أعلى معايير الجودة والموثوقية في كل معرض مدرج على المنصة.'
                : 'We strive to build the largest digital car dealer directory in Saudi Arabia, while ensuring the highest standards of quality and reliability for every dealership listed on the platform.'}
            </p>
            <p className="text-gray-400 leading-relaxed font-body mb-6">
              {isRtl
                ? 'نؤمن بأن كل مشتري يستحق الوصول إلى معلومات دقيقة وشفافة تساعده على اتخاذ القرار الصحيح.'
                : 'We believe every buyer deserves access to accurate and transparent information to help them make the right decision.'}
            </p>
            <div className="space-y-3">
              {[
                isRtl ? 'التحقق من هوية كل معرض' : 'Verifying every dealership identity',
                isRtl ? 'عرض معلومات دقيقة وشفافة' : 'Displaying accurate and transparent info',
                isRtl ? 'دعم المعارض الصغيرة والمتوسطة' : 'Supporting small and medium dealerships',
                isRtl ? 'تطوير مستمر بناءً على ملاحظات المستخدمين' : 'Continuous improvement based on user feedback',
              ].map(item => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-[#C9A84C] flex-shrink-0" />
                  <span className="text-gray-300 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-8">
            <h3 className="text-xl font-black text-white mb-6">
              {isRtl ? 'كيف نعمل؟' : 'How We Work'}
            </h3>
            <div className="space-y-5">
              {[
                { step: '01', title: isRtl ? 'تسجيل المعرض' : 'Dealer Registration', desc: isRtl ? 'يسجّل المعرض بياناته ومعلوماته التجارية' : 'Dealer registers their information and business details' },
                { step: '02', title: isRtl ? 'مراجعة الفريق' : 'Team Review', desc: isRtl ? 'يراجع فريقنا الطلب ويتحقق من صحة البيانات' : 'Our team reviews the application and verifies the data' },
                { step: '03', title: isRtl ? 'الإدراج والتوثيق' : 'Listing & Verification', desc: isRtl ? 'يُدرج المعرض على المنصة ويحصل على شارة التوثيق' : 'Dealer is listed and receives the verification badge' },
                { step: '04', title: isRtl ? 'التواصل مع العملاء' : 'Customer Connection', desc: isRtl ? 'يتواصل المشترون مع المعرض مباشرة عبر المنصة' : 'Buyers connect directly with the dealer through the platform' },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/20 border border-[#C9A84C]/30 flex items-center justify-center text-[#C9A84C] font-black text-sm flex-shrink-0">{step}</div>
                  <div>
                    <p className="font-bold text-white text-sm">{title}</p>
                    <p className="text-gray-400 text-xs mt-0.5 font-body">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <h2 className="text-3xl font-black text-white mb-8 text-center">
          {isRtl ? 'قيمنا' : 'Our Values'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {values.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-6 hover:border-[#C9A84C]/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#C9A84C]/10 flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-[#C9A84C]" />
              </div>
              <h3 className="font-black text-white mb-2">{title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed font-body">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Team */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <h2 className="text-3xl font-black text-white mb-8 text-center">
          {isRtl ? 'فريقنا' : 'Our Team'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {team.map(({ name, role, icon }) => (
            <div key={name} className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-6 text-center hover:border-[#C9A84C]/40 transition-all">
              <div className="text-4xl mb-3">{icon}</div>
              <h3 className="font-black text-white mb-1">{name}</h3>
              <p className="text-gray-400 text-sm font-body">{role}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-4 pb-20 text-center">
        <div className="bg-gradient-to-br from-[#C9A84C]/10 to-[#C9A84C]/5 border border-[#C9A84C]/20 rounded-3xl p-12">
          <Users className="w-12 h-12 text-[#C9A84C] mx-auto mb-4" />
          <h2 className="text-3xl font-black text-white mb-4">
            {isRtl ? 'انضم إلى منصتنا' : 'Join Our Platform'}
          </h2>
          <p className="text-gray-400 mb-8 font-body">
            {isRtl ? 'سجّل معرضك اليوم وابدأ في الوصول إلى آلاف المشترين المحتملين' : 'Register your dealership today and start reaching thousands of potential buyers'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <button className="px-8 py-3 bg-[#C9A84C] text-black font-black rounded-xl hover:bg-[#b8973b] transition-all">
                {isRtl ? 'سجّل معرضك' : 'Register Your Dealership'}
              </button>
            </Link>
            <Link href="/dealers">
              <button className="px-8 py-3 bg-transparent border border-[#C9A84C]/40 text-[#C9A84C] font-bold rounded-xl hover:border-[#C9A84C] transition-all">
                {isRtl ? 'تصفح المعارض' : 'Browse Dealers'}
              </button>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

