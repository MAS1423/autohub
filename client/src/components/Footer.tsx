import { Link } from 'wouter';
import { Phone, Mail, MapPin, Instagram, MessageCircleMore, Twitter } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export default function Footer() {
  const { t, lang, isRTL } = useI18n();

  const quickLinks = lang === 'ar'
    ? [['/', 'الرئيسية'], ['/dealers', 'المعارض'], ['/vehicles', 'السيارات'], ['/about', 'عن المنصة']]
    : [['/', 'Home'], ['/dealers', 'Dealers'], ['/vehicles', 'Vehicles'], ['/about', 'About Us']];

  const dealerLinks = lang === 'ar'
    ? [['/register', 'سجّل معرضك'], ['/dashboard', 'لوحة التحكم']]
    : [['/register', 'List Your Dealership'], ['/dashboard', 'Dashboard']];

  return (
    <footer style={{ background: 'oklch(0.10 0.01 260)' }} className="text-white/80" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl overflow-hidden">
                <img src="/assets/logo-icon.png" alt="AutoHub" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="text-white font-black text-xl" style={{ fontFamily: 'Cairo' }}>
                  {lang === 'ar' ? <>أوتو <span style={{ color: 'oklch(0.72 0.18 55)' }}>هَب</span></> : <>Auto<span style={{ color: 'oklch(0.72 0.18 55)' }}>Hub</span></>}
                </div>
                <div className="text-white/40 text-xs">
                  {lang === 'ar' ? 'دليل المعارض الموثوقة' : 'Trusted Dealer Directory'}
                </div>
              </div>
            </div>
            <p className="text-sm text-white/50 leading-relaxed font-body">{t('footer_desc')}</p>
            <div className="flex gap-3 mt-5">
              <a href="#" className="w-9 h-9 rounded-lg bg-white/10 hover:bg-[oklch(0.72_0.18_55)] flex items-center justify-center transition-colors">
                <Twitter size={16} />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-white/10 hover:bg-[oklch(0.72_0.18_55)] flex items-center justify-center transition-colors">
                <Instagram size={16} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-4 text-sm">{t('footer_links')}</h4>
            <ul className="space-y-2.5">
              {quickLinks.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-white/50 hover:text-[oklch(0.72_0.18_55)] transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Dealer Links */}
          <div>
            <h4 className="text-white font-bold mb-4 text-sm">
              {lang === 'ar' ? 'للمعارض' : 'For Dealers'}
            </h4>
            <ul className="space-y-2.5">
              {dealerLinks.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-white/50 hover:text-[oklch(0.72_0.18_55)] transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold mb-4 text-sm">{t('footer_contact')}</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-white/50">
                <Phone size={14} style={{ color: 'oklch(0.72 0.18 55)' }} />
                <span dir="ltr">+966 11 000 0000</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-white/50">
                <Mail size={14} style={{ color: 'oklch(0.72 0.18 55)' }} />
                <span>info@autohub.sa</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-white/50">
                <MapPin size={14} style={{ color: 'oklch(0.72 0.18 55)' }} />
                <span>{lang === 'ar' ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia'}</span>
              </li>
            </ul>
            <Link href="/contact" className="mt-5 inline-flex items-center gap-2 rounded-lg border border-[oklch(0.72_0.18_55)]/45 bg-[oklch(0.72_0.18_55)]/10 px-3 py-2 text-xs font-bold text-[oklch(0.82_0.15_70)] transition-colors hover:bg-[oklch(0.72_0.18_55)] hover:text-black">
              <MessageCircleMore size={15} />
              {lang === 'ar' ? 'أرسل رسالة إلى فريق AutoHub' : 'Message the AutoHub team'}
            </Link>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30">
            © 2025 {lang === 'ar' ? 'أوتو هَب' : 'AutoHub'}. {t('footer_rights')}.
          </p>
          <div className="flex gap-5">
            <Link href="/privacy" className="text-xs text-white/30 hover:text-white/60 transition-colors">
              {lang === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
            </Link>
            <Link href="/terms" className="text-xs text-white/30 hover:text-white/60 transition-colors">
              {lang === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions'}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
