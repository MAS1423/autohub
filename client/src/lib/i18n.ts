import { createContext, useContext, useState, useEffect } from 'react';

export type Lang = 'ar' | 'en';

export const translations = {
  ar: {
    // Nav
    nav_home: 'الرئيسية',
    nav_dealers: 'المعارض',
    nav_vehicles: 'السيارات',
    nav_map: 'الخريطة',
    nav_pricing: 'الأسعار',
    nav_login: 'تسجيل الدخول',
    nav_register: 'سجّل معرضك مجاناً',
    nav_dashboard: 'لوحة التحكم',
    nav_logout: 'تسجيل الخروج',
    nav_favorites: 'مفضلتي',
    nav_compare: 'المقارنة',
    // Hero
    hero_badge: 'الدليل الأشمل لمعارض السيارات في المملكة',
    hero_title_1: 'اعثر على',
    hero_title_2: 'معرضك',
    hero_title_3: 'المثالي',
    hero_desc: 'أكثر من {dealers} معرض موثوق في {cities} مدينة سعودية. ابحث، قارن، وتواصل مع المعرض المناسب لك.',
    hero_search_btn: 'ابحث عن معرض',
    hero_stat_dealers: 'معرض مسجل',
    hero_stat_verified: 'معرض موثق',
    hero_stat_vehicles: 'سيارة متاحة',
    // Search
    search_city: 'كل المدن',
    search_brand: 'كل الماركات',
    search_placeholder: 'اسم المعرض أو الحي...',
    // Sections
    section_cities: 'تصفح حسب المدينة',
    section_view_all: 'عرض الكل',
    section_featured: 'المعارض المميزة',
    section_featured_badge: '★ معارض مميزة',
    section_all_dealers: 'جميع المعارض',
    section_browse_all: 'استعرض جميع المعارض',
    section_brands: 'ماركات السيارات المتوفرة في معارض أوتو هَب',
    // Why
    why_badge: 'لماذا أوتو هَب؟',
    why_title: 'منصة تبني الثقة',
    why_desc: 'نحن لا نبيع سيارات، نحن نبني جسور الثقة بين المعارض الموثوقة والعملاء الجادين.',
    why_1_title: 'توثيق رسمي',
    why_1_desc: 'كل معرض يمر بعملية تحقق من السجل التجاري والترخيص قبل النشر.',
    why_2_title: 'تقييمات حقيقية',
    why_2_desc: 'تقييمات من عملاء حقيقيين مع آلية تحقق لمنع التلاعب.',
    why_3_title: 'بحث ذكي وسريع',
    why_3_desc: 'ابحث بالمدينة والحي والماركة والموديل في ثوانٍ.',
    why_4_title: 'مجتمع موثوق',
    why_4_desc: 'شبكة من أكثر من 1,200 معرض موثوق في أنحاء المملكة.',
    // CTA
    cta_badge: 'للمعارض',
    cta_title: 'سجّل معرضك اليوم',
    cta_desc: 'احصل على صفحة احترافية تظهر في جوجل، وتواصل مع آلاف العملاء الجادين يومياً. ابدأ مجاناً، وطوّر اشتراكك متى شئت.',
    cta_free: 'مجاني للبدء',
    cta_no_card: 'لا يلزم بطاقة ائتمانية',
    cta_instant: 'ظهور فوري في البحث',
    cta_btn: 'سجّل معرضك مجاناً',
    cta_plans: 'استعرض الخطط',
    // Dealers page
    dealers_title: 'دليل المعارض',
    dealers_subtitle: 'اكتشف أفضل معارض السيارات الموثوقة في المملكة',
    dealers_filter_city: 'المدينة',
    dealers_filter_brand: 'الماركة',
    dealers_filter_verified: 'موثق فقط',
    dealers_results: 'معرض',
    dealers_empty: 'لا توجد نتائج مطابقة',
    dealers_empty_desc: 'جرّب تغيير معايير البحث',
    // Dealer card
    card_verified: 'موثق',
    card_rating: 'تقييم',
    card_vehicles: 'سيارة',
    card_views: 'مشاهدة',
    card_view_profile: 'عرض الملف',
    card_whatsapp: 'واتساب',
    card_compare: 'قارن',
    card_save: 'حفظ',
    card_saved: 'محفوظ',
    // Vehicle card
    vehicle_new: 'جديد',
    vehicle_used: 'مستعمل',
    vehicle_available: 'متاح',
    vehicle_reserved: 'محجوز',
    vehicle_sold: 'مباع',
    vehicle_km: 'كم',
    vehicle_sar: 'ر.س',
    vehicle_compare: 'قارن',
    vehicle_save: 'حفظ',
    vehicle_saved: 'محفوظ',
    vehicle_details: 'التفاصيل',
    // Compare
    compare_title: 'مقارنة السيارات',
    compare_subtitle: 'قارن حتى 3 سيارات جنباً إلى جنب',
    compare_add: 'أضف سيارة للمقارنة',
    compare_empty: 'لم تختر سيارات للمقارنة بعد',
    compare_empty_desc: 'انتقل لصفحة السيارات واضغط "قارن" على أي سيارة',
    compare_remove: 'إزالة',
    compare_clear: 'مسح الكل',
    compare_go_vehicles: 'تصفح السيارات',
    compare_spec_brand: 'الماركة',
    compare_spec_model: 'الموديل',
    compare_spec_year: 'سنة الصنع',
    compare_spec_price: 'السعر',
    compare_spec_condition: 'الحالة',
    compare_spec_fuel: 'الوقود',
    compare_spec_transmission: 'ناقل الحركة',
    compare_spec_mileage: 'المسافة المقطوعة',
    compare_spec_color: 'اللون',
    compare_spec_dealer: 'المعرض',
    compare_spec_city: 'المدينة',
    compare_bar_title: 'المقارنة',
    compare_bar_count: 'سيارة',
    compare_bar_view: 'عرض المقارنة',
    // Favorites
    favorites_title: 'مفضلتي',
    favorites_subtitle: 'السيارات والمعارض التي حفظتها',
    favorites_vehicles_tab: 'السيارات',
    favorites_dealers_tab: 'المعارض',
    favorites_empty_vehicles: 'لا توجد سيارات محفوظة',
    favorites_empty_vehicles_desc: 'تصفح السيارات واضغط أيقونة القلب لحفظ ما يعجبك',
    favorites_empty_dealers: 'لا توجد معارض محفوظة',
    favorites_empty_dealers_desc: 'تصفح المعارض واضغط أيقونة القلب لحفظ المعارض المفضلة',
    favorites_go_vehicles: 'تصفح السيارات',
    favorites_go_dealers: 'تصفح المعارض',
    favorites_remove: 'إزالة',
    // Register
    register_title: 'سجّل معرضك',
    register_subtitle: 'انضم لأكبر دليل معارض سيارات في المملكة',
    register_step1: 'بيانات المعرض',
    register_step2: 'معلومات الاتصال',
    register_step3: 'المستندات',
    register_step4: 'الخطة',
    register_name: 'اسم المعرض',
    register_owner: 'اسم المالك',
    register_city: 'المدينة',
    register_neighborhood: 'الحي',
    register_phone: 'رقم الهاتف',
    register_email: 'البريد الإلكتروني',
    register_brands: 'الماركات المتوفرة',
    register_bio: 'نبذة عن المعرض',
    register_commercial_reg: 'رقم السجل التجاري',
    register_upload_doc: 'رفع صورة السجل التجاري',
    register_next: 'التالي',
    register_prev: 'السابق',
    register_submit: 'تسجيل المعرض',
    register_success: 'تم تسجيل معرضك بنجاح!',
    // Pricing
    pricing_title: 'خطط الاشتراك',
    pricing_subtitle: 'ابدأ مجاناً وطوّر اشتراكك مع نمو معرضك',
    pricing_free: 'مجاني',
    pricing_pro: 'احترافي',
    pricing_premium: 'مميز',
    pricing_month: '/شهر',
    pricing_choose: 'اختر الخطة',
    pricing_current: 'خطتك الحالية',
    // Footer
    footer_desc: 'الدليل الأشمل لمعارض السيارات الموثوقة في المملكة العربية السعودية.',
    footer_links: 'روابط سريعة',
    footer_contact: 'تواصل معنا',
    footer_rights: 'جميع الحقوق محفوظة',
    // Common
    loading: 'جارٍ التحميل...',
    error: 'حدث خطأ',
    retry: 'إعادة المحاولة',
    back: 'رجوع',
    save: 'حفظ',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
    delete: 'حذف',
    edit: 'تعديل',
    add: 'إضافة',
    search: 'بحث',
    filter: 'تصفية',
    all: 'الكل',
    yes: 'نعم',
    no: 'لا',
    sar: 'ر.س',
    // Dealer profile
    dealer_not_found: 'المعرض غير موجود',
    back_to_dealers: 'العودة للمعارض',
    dealer_tab_vehicles: 'السيارات',
    dealer_tab_about: 'عن المعرض',
    dealer_tab_reviews: 'التقييمات',
    dealer_inquiry_title: 'إرسال استفسار',
    dealer_inquiry_name: 'اسمك',
    dealer_inquiry_phone: 'رقم الهاتف',
    dealer_inquiry_message: 'رسالتك',
    dealer_inquiry_send: 'إرسال',
    // Vehicle detail
    vehicle_detail_specs: 'المواصفات',
    vehicle_detail_desc: 'الوصف',
    vehicle_detail_inquiry: 'استفسر عن هذه السيارة',
    vehicle_detail_share: 'مشاركة',
    vehicle_detail_back: 'رجوع',
    km: 'كم',
  },
  en: {
    // Dealer profile
    dealer_not_found: 'Dealer Not Found',
    back_to_dealers: 'Back to Dealers',
    dealer_tab_vehicles: 'Vehicles',
    dealer_tab_about: 'About',
    dealer_tab_reviews: 'Reviews',
    dealer_inquiry_title: 'Send Inquiry',
    dealer_inquiry_name: 'Your Name',
    dealer_inquiry_phone: 'Phone Number',
    dealer_inquiry_message: 'Message',
    dealer_inquiry_send: 'Send',
    // Vehicle detail
    vehicle_detail_specs: 'Specifications',
    vehicle_detail_desc: 'Description',
    vehicle_detail_inquiry: 'Inquire About This Car',
    vehicle_detail_share: 'Share',
    vehicle_detail_back: 'Back',
    // Nav
    nav_home: 'Home',
    nav_dealers: 'Dealers',
    nav_vehicles: 'Vehicles',
    nav_map: 'Map',
    nav_pricing: 'Pricing',
    nav_login: 'Login',
    nav_register: 'List Your Dealership Free',
    nav_dashboard: 'Dashboard',
    nav_logout: 'Logout',
    nav_favorites: 'Favorites',
    nav_compare: 'Compare',
    // Hero
    hero_badge: 'Saudi Arabia\'s Most Comprehensive Car Dealership Directory',
    hero_title_1: 'Find Your',
    hero_title_2: 'Perfect',
    hero_title_3: 'Dealership',
    hero_desc: 'Over {dealers} trusted dealerships in {cities} Saudi cities. Search, compare, and connect with the right dealer.',
    hero_search_btn: 'Search Dealerships',
    hero_stat_dealers: 'Registered Dealers',
    hero_stat_verified: 'Verified Dealers',
    hero_stat_vehicles: 'Available Cars',
    // Search
    search_city: 'All Cities',
    search_brand: 'All Brands',
    search_placeholder: 'Dealership name or district...',
    // Sections
    section_cities: 'Browse by City',
    section_view_all: 'View All',
    section_featured: 'Featured Dealerships',
    section_featured_badge: '★ Featured',
    section_all_dealers: 'All Dealerships',
    section_browse_all: 'Browse All Dealerships',
    section_brands: 'Car Brands Available at AutoHub Dealerships',
    // Why
    why_badge: 'Why AutoHub?',
    why_title: 'A Platform Built on Trust',
    why_desc: 'We don\'t sell cars — we build bridges of trust between verified dealerships and serious buyers.',
    why_1_title: 'Official Verification',
    why_1_desc: 'Every dealership is verified against commercial registration and licensing before listing.',
    why_2_title: 'Real Reviews',
    why_2_desc: 'Reviews from real customers with anti-manipulation verification.',
    why_3_title: 'Smart Fast Search',
    why_3_desc: 'Search by city, district, brand, and model in seconds.',
    why_4_title: 'Trusted Community',
    why_4_desc: 'A network of over 1,200 verified dealerships across the Kingdom.',
    // CTA
    cta_badge: 'For Dealers',
    cta_title: 'List Your Dealership Today',
    cta_desc: 'Get a professional page that ranks on Google and connect with thousands of serious buyers daily. Start free, upgrade anytime.',
    cta_free: 'Free to start',
    cta_no_card: 'No credit card required',
    cta_instant: 'Instant search visibility',
    cta_btn: 'List Your Dealership Free',
    cta_plans: 'View Plans',
    // Dealers page
    dealers_title: 'Dealership Directory',
    dealers_subtitle: 'Discover the best verified car dealerships in Saudi Arabia',
    dealers_filter_city: 'City',
    dealers_filter_brand: 'Brand',
    dealers_filter_verified: 'Verified Only',
    dealers_results: 'dealers',
    dealers_empty: 'No matching results',
    dealers_empty_desc: 'Try changing your search criteria',
    // Dealer card
    card_verified: 'Verified',
    card_rating: 'rating',
    card_vehicles: 'cars',
    card_views: 'views',
    card_view_profile: 'View Profile',
    card_whatsapp: 'WhatsApp',
    card_compare: 'Compare',
    card_save: 'Save',
    card_saved: 'Saved',
    // Vehicle card
    vehicle_new: 'New',
    vehicle_used: 'Used',
    vehicle_available: 'Available',
    vehicle_reserved: 'Reserved',
    vehicle_sold: 'Sold',
    vehicle_km: 'km',
    vehicle_sar: 'SAR',
    vehicle_compare: 'Compare',
    vehicle_save: 'Save',
    vehicle_saved: 'Saved',
    vehicle_details: 'Details',
    // Compare
    compare_title: 'Compare Cars',
    compare_subtitle: 'Compare up to 3 cars side by side',
    compare_add: 'Add a car to compare',
    compare_empty: 'No cars selected for comparison',
    compare_empty_desc: 'Go to the vehicles page and click "Compare" on any car',
    compare_remove: 'Remove',
    compare_clear: 'Clear All',
    compare_go_vehicles: 'Browse Vehicles',
    compare_spec_brand: 'Brand',
    compare_spec_model: 'Model',
    compare_spec_year: 'Year',
    compare_spec_price: 'Price',
    compare_spec_condition: 'Condition',
    compare_spec_fuel: 'Fuel Type',
    compare_spec_transmission: 'Transmission',
    compare_spec_mileage: 'Mileage',
    compare_spec_color: 'Color',
    compare_spec_dealer: 'Dealer',
    compare_spec_city: 'City',
    compare_bar_title: 'Comparison',
    compare_bar_count: 'car(s)',
    compare_bar_view: 'View Comparison',
    // Favorites
    favorites_title: 'My Favorites',
    favorites_subtitle: 'Cars and dealerships you\'ve saved',
    favorites_vehicles_tab: 'Vehicles',
    favorites_dealers_tab: 'Dealers',
    favorites_empty_vehicles: 'No saved vehicles',
    favorites_empty_vehicles_desc: 'Browse vehicles and tap the heart icon to save your favorites',
    favorites_empty_dealers: 'No saved dealers',
    favorites_empty_dealers_desc: 'Browse dealers and tap the heart icon to save your favorites',
    favorites_go_vehicles: 'Browse Vehicles',
    favorites_go_dealers: 'Browse Dealers',
    favorites_remove: 'Remove',
    // Register
    register_title: 'List Your Dealership',
    register_subtitle: 'Join Saudi Arabia\'s largest car dealership directory',
    register_step1: 'Dealership Info',
    register_step2: 'Contact Details',
    register_step3: 'Documents',
    register_step4: 'Choose Plan',
    register_name: 'Dealership Name',
    register_owner: 'Owner Name',
    register_city: 'City',
    register_neighborhood: 'District',
    register_phone: 'Phone Number',
    register_email: 'Email Address',
    register_brands: 'Available Brands',
    register_bio: 'About the Dealership',
    register_commercial_reg: 'Commercial Registration Number',
    register_upload_doc: 'Upload Commercial Registration',
    register_next: 'Next',
    register_prev: 'Back',
    register_submit: 'Register Dealership',
    register_success: 'Your dealership has been registered successfully!',
    // Pricing
    pricing_title: 'Subscription Plans',
    pricing_subtitle: 'Start free and upgrade as your dealership grows',
    pricing_free: 'Free',
    pricing_pro: 'Professional',
    pricing_premium: 'Premium',
    pricing_month: '/month',
    pricing_choose: 'Choose Plan',
    pricing_current: 'Current Plan',
    // Footer
    footer_desc: 'Saudi Arabia\'s most comprehensive directory of trusted car dealerships.',
    footer_links: 'Quick Links',
    footer_contact: 'Contact Us',
    footer_rights: 'All rights reserved',
    // Common
    loading: 'Loading...',
    error: 'An error occurred',
    retry: 'Retry',
    back: 'Back',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    filter: 'Filter',
    all: 'All',
    yes: 'Yes',
    no: 'No',
    sar: 'SAR',
    km: 'km',
  },
} as const;

export type TranslationKey = keyof typeof translations.ar;

// i18n context
import React from 'react';

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  dir: 'rtl' | 'ltr';
  isRTL: boolean;
}

export const I18nContext = createContext<I18nContextType>({
  lang: 'ar',
  setLang: () => {},
  t: (key) => key,
  dir: 'rtl',
  isRTL: true,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try { return (localStorage.getItem('autohub_lang') as Lang) || 'ar'; } catch { return 'ar'; }
  });

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    try { localStorage.setItem('autohub_lang', newLang); } catch {}
    document.documentElement.lang = newLang;
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  };

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const t = (key: TranslationKey, vars?: Record<string, string | number>): string => {
    let str = (translations[lang] as any)[key] ?? (translations.ar as any)[key] ?? key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, String(v));
      });
    }
    return str;
  };

  return React.createElement(I18nContext.Provider, {
    value: { lang, setLang, t, dir: lang === 'ar' ? 'rtl' : 'ltr', isRTL: lang === 'ar' }
  }, children);
}

export function useI18n() {
  return useContext(I18nContext);
}
