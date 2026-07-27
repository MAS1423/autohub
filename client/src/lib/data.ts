// AutoHub — بيانات تجريبية للمنصة
// Design: Precision Automotive — Dark gold theme, RTL Arabic

export interface Dealer {
  id: string;
  slug: string;
  name: string;
  city: string;
  neighborhood: string;
  logo: string;
  cover: string;
  isVerified: boolean;
  plan: 'free' | 'basic' | 'pro' | 'premium';
  rating: number;
  reviewsCount: number;
  vehiclesCount: number;
  phone: string;
  whatsapp: string;
  bio: string;
  brands: string[];
  workingHours: string;
  views: number;
  inquiries: number;
}

export interface Vehicle {
  id: string;
  dealerId: string;
  dealerName: string;
  dealerCity: string;
  brand: string;
  model: string;
  year: number;
  condition: 'new' | 'used';
  mileage: number;
  price: number;
  fuelType: 'petrol' | 'diesel' | 'hybrid' | 'electric';
  transmission: 'automatic' | 'manual';
  color: string;
  status: 'available' | 'reserved' | 'sold';
  images: string[];
  description: string;
  views: number;
}

export const CITIES = [
  'الرياض', 'جدة', 'الدمام', 'مكة المكرمة', 'المدينة المنورة',
  'الخبر', 'الطائف', 'تبوك', 'أبها', 'نجران'
];

export const BRANDS = [
  'تويوتا', 'هيونداي', 'كيا', 'نيسان', 'فورد',
  'شيفروليه', 'مرسيدس', 'بي إم دبليو', 'لكزس', 'جيب',
  'لاند روفر', 'أودي', 'فولكس واغن', 'هوندا', 'ميتسوبيشي'
];

export const NEIGHBORHOODS: Record<string, string[]> = {
  'الرياض': ['العليا', 'النخيل', 'الملقا', 'حي الملك فهد', 'الروضة', 'الياسمين', 'الورود', 'السليمانية'],
  'جدة': ['الزهراء', 'الحمراء', 'الروضة', 'النزهة', 'الصفا', 'الربوة', 'البوادي', 'الشاطئ'],
  'الدمام': ['الشاطئ', 'الفيصلية', 'العزيزية', 'الروضة', 'الأمانة', 'المريكبات'],
};

export const DEALERS: Dealer[] = [
  {
    id: 'd1',
    slug: 'al-jazeera-motors',
    name: 'معرض الجزيرة للسيارات',
    city: 'الرياض',
    neighborhood: 'العليا',
    logo: '/assets/logo-icon.png',
    cover: '/assets/showroom-toyota.jpg',
    isVerified: true,
    plan: 'premium',
    rating: 4.8,
    reviewsCount: 124,
    vehiclesCount: 48,
    phone: '+966501234567',
    whatsapp: '+966501234567',
    bio: 'معرض الجزيرة للسيارات — أكثر من 15 عاماً من الخبرة في بيع السيارات الجديدة والمستعملة بالرياض. نتخصص في تويوتا ولكزس مع ضمان الجودة والشفافية الكاملة.',
    brands: ['تويوتا', 'لكزس'],
    workingHours: 'السبت - الخميس: 9ص - 10م | الجمعة: 4م - 10م',
    views: 3420,
    inquiries: 89,
  },
  {
    id: 'd2',
    slug: 'elite-auto-jeddah',
    name: 'معرض إيليت للسيارات الفاخرة',
    city: 'جدة',
    neighborhood: 'الزهراء',
    logo: '/assets/logo-icon.png',
    cover: '/assets/showroom-luxury.jpg',
    isVerified: true,
    plan: 'pro',
    rating: 4.9,
    reviewsCount: 87,
    vehiclesCount: 32,
    phone: '+966551234567',
    whatsapp: '+966551234567',
    bio: 'إيليت للسيارات الفاخرة — وجهتك الأولى للسيارات الأوروبية الفاخرة في جدة. نوفر مرسيدس وبي إم دبليو وأودي بأفضل الأسعار مع خدمة ما بعد البيع.',
    brands: ['مرسيدس', 'بي إم دبليو', 'أودي'],
    workingHours: 'يومياً: 10ص - 11م',
    views: 2890,
    inquiries: 67,
  },
  {
    id: 'd3',
    slug: 'najd-motors',
    name: 'معرض نجد موتورز',
    city: 'الرياض',
    neighborhood: 'الملقا',
    logo: '/assets/logo-icon.png',
    cover: '/assets/car-suv.jpg',
    isVerified: true,
    plan: 'basic',
    rating: 4.5,
    reviewsCount: 56,
    vehiclesCount: 25,
    phone: '+966521234567',
    whatsapp: '+966521234567',
    bio: 'معرض نجد موتورز متخصص في السيارات الكورية والإقتصادية. هيونداي وكيا ونيسان بأسعار تنافسية وتمويل ميسر.',
    brands: ['هيونداي', 'كيا', 'نيسان'],
    workingHours: 'السبت - الخميس: 8ص - 9م',
    views: 1560,
    inquiries: 43,
  },
  {
    id: 'd4',
    slug: 'gulf-premium-cars',
    name: 'معرض الخليج للسيارات المميزة',
    city: 'الدمام',
    neighborhood: 'الشاطئ',
    logo: '/assets/logo-icon.png',
    cover: '/assets/showroom-luxury.jpg',
    isVerified: false,
    plan: 'free',
    rating: 4.2,
    reviewsCount: 28,
    vehiclesCount: 18,
    phone: '+966531234567',
    whatsapp: '+966531234567',
    bio: 'معرض الخليج للسيارات المميزة في الدمام — تشكيلة واسعة من السيارات الأمريكية والآسيوية.',
    brands: ['فورد', 'شيفروليه', 'جيب'],
    workingHours: 'السبت - الخميس: 9ص - 9م',
    views: 890,
    inquiries: 22,
  },
  {
    id: 'd5',
    slug: 'makkah-auto-center',
    name: 'مركز مكة للسيارات',
    city: 'مكة المكرمة',
    neighborhood: 'العزيزية',
    logo: '/assets/logo-icon.png',
    cover: '/assets/showroom-toyota.jpg',
    isVerified: true,
    plan: 'pro',
    rating: 4.7,
    reviewsCount: 73,
    vehiclesCount: 35,
    phone: '+966561234567',
    whatsapp: '+966561234567',
    bio: 'مركز مكة للسيارات — خدمة متكاملة لبيع وشراء السيارات في قلب مكة المكرمة.',
    brands: ['تويوتا', 'هيونداي', 'كيا', 'نيسان'],
    workingHours: 'يومياً: 9ص - 10م',
    views: 2100,
    inquiries: 55,
  },
  {
    id: 'd6',
    slug: 'vision-motors-riyadh',
    name: 'معرض فيجن موتورز',
    city: 'الرياض',
    neighborhood: 'النخيل',
    logo: '/assets/logo-icon.png',
    cover: '/assets/hero-bg.jpg',
    isVerified: true,
    plan: 'premium',
    rating: 4.6,
    reviewsCount: 91,
    vehiclesCount: 52,
    phone: '+966571234567',
    whatsapp: '+966571234567',
    bio: 'فيجن موتورز — رؤية جديدة لتجربة شراء السيارات. أكبر تشكيلة من السيارات الجديدة والمستعملة في الرياض.',
    brands: ['لاند روفر', 'جيب', 'مرسيدس', 'بي إم دبليو'],
    workingHours: 'السبت - الخميس: 9ص - 11م | الجمعة: 4م - 11م',
    views: 4100,
    inquiries: 112,
  },
];

export const VEHICLES: Vehicle[] = [
  {
    id: 'v1', dealerId: 'd1', dealerName: 'معرض الجزيرة للسيارات', dealerCity: 'الرياض',
    brand: 'تويوتا', model: 'لاند كروزر', year: 2024, condition: 'new',
    mileage: 0, price: 285000, fuelType: 'petrol', transmission: 'automatic',
    color: 'أبيض لؤلؤي', status: 'available',
    images: ['/assets/car-suv.jpg', '/assets/showroom-toyota.jpg'],
    description: 'تويوتا لاند كروزر 2024 الجديدة كلياً، فل أوبشن، ضمان الوكالة 3 سنوات.',
    views: 520,
  },
  {
    id: 'v2', dealerId: 'd1', dealerName: 'معرض الجزيرة للسيارات', dealerCity: 'الرياض',
    brand: 'لكزس', model: 'LX 600', year: 2023, condition: 'used',
    mileage: 28000, price: 420000, fuelType: 'petrol', transmission: 'automatic',
    color: 'أسود', status: 'available',
    images: ['/assets/showroom-toyota.jpg'],
    description: 'لكزس LX 600 2023 بحالة ممتازة، صيانة دورية من الوكالة.',
    views: 380,
  },
  {
    id: 'v3', dealerId: 'd2', dealerName: 'معرض إيليت للسيارات الفاخرة', dealerCity: 'جدة',
    brand: 'مرسيدس', model: 'S-Class', year: 2024, condition: 'new',
    mileage: 0, price: 650000, fuelType: 'petrol', transmission: 'automatic',
    color: 'فضي معدني', status: 'available',
    images: ['/assets/showroom-luxury.jpg'],
    description: 'مرسيدس S-Class 2024 الفئة الأولى، مواصفات خليجية كاملة.',
    views: 290,
  },
  {
    id: 'v4', dealerId: 'd3', dealerName: 'معرض نجد موتورز', dealerCity: 'الرياض',
    brand: 'هيونداي', model: 'توسان', year: 2023, condition: 'used',
    mileage: 45000, price: 89000, fuelType: 'petrol', transmission: 'automatic',
    color: 'رمادي', status: 'available',
    images: ['/assets/car-suv.jpg'],
    description: 'هيونداي توسان 2023 بحالة ممتازة، صيانة منتظمة.',
    views: 210,
  },
  {
    id: 'v5', dealerId: 'd6', dealerName: 'معرض فيجن موتورز', dealerCity: 'الرياض',
    brand: 'لاند روفر', model: 'ديفندر', year: 2024, condition: 'new',
    mileage: 0, price: 380000, fuelType: 'petrol', transmission: 'automatic',
    color: 'أخضر داكن', status: 'available',
    images: ['/assets/hero-bg.jpg'],
    description: 'لاند روفر ديفندر 2024 جديد، مواصفات كاملة، ضمان الوكالة.',
    views: 445,
  },
  {
    id: 'v6', dealerId: 'd2', dealerName: 'معرض إيليت للسيارات الفاخرة', dealerCity: 'جدة',
    brand: 'بي إم دبليو', model: 'X7', year: 2023, condition: 'used',
    mileage: 35000, price: 310000, fuelType: 'petrol', transmission: 'automatic',
    color: 'أبيض ألباين', status: 'available',
    images: ['/assets/showroom-luxury.jpg'],
    description: 'بي إم دبليو X7 2023 بحالة ممتازة، فل أوبشن.',
    views: 320,
  },
];

export const STATS = {
  totalDealers: 1240,
  verifiedDealers: 890,
  totalVehicles: 18500,
  totalCities: 24,
};
