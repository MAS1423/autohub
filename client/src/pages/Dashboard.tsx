// لوحة تحكم المعرض الكاملة — أوتو هَب (مرتبطة بقاعدة البيانات)
import { useState, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard, Car, MessageSquare, Settings, LogOut, BarChart2, TrendingUp,
  Eye, Phone, ChevronLeft, Plus, Trash2, BadgeCheck, Menu, X, Video,
  Image as ImageIcon, Instagram, Twitter, Globe, Clock, MapPin, Star,
  Building2, Share2, Edit3, Save
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { useAuth } from '@/_core/hooks/useAuth';
import { startLogin } from '@/const';
import { toast } from 'sonner';
import MediaUploader from '@/components/MediaUploader';

type Tab = 'overview' | 'analytics' | 'vehicles' | 'inquiries' | 'info' | 'media' | 'settings';

const BRANDS = ['تويوتا','هوندا','نيسان','هيونداي','كيا','مرسيدس','بي إم دبليو','أودي','لكزس','فولكس واجن','شيفروليه','فورد','جيب','لاند روفر','بورش'];
const FUEL_LABELS: Record<string, string> = { petrol: 'بنزين', diesel: 'ديزل', hybrid: 'هايبرد', electric: 'كهربائي' };
const TRANS_LABELS: Record<string, string> = { automatic: 'أوتوماتيك', manual: 'يدوي' };
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  new: { label: 'جديد', color: 'text-blue-400 bg-blue-500/10' },
  read: { label: 'مقروء', color: 'text-amber-400 bg-amber-500/10' },
  replied: { label: 'تم الرد', color: 'text-emerald-400 bg-emerald-500/10' },
};

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [vehicleImages, setVehicleImages] = useState<string[]>([]);
  const [vehicleVideo, setVehicleVideo] = useState<{ url: string; key: string } | null>(null);
  const [newVehicle, setNewVehicle] = useState({
    brand: '', model: '', year: new Date().getFullYear(), price: 0,
    condition: 'used' as 'new' | 'used', fuelType: 'petrol' as 'petrol' | 'diesel' | 'hybrid' | 'electric',
    transmission: 'automatic' as 'automatic' | 'manual', color: '', mileage: 0, description: '', city: '',
  });

  // Info tab state
  const [infoForm, setInfoForm] = useState<Record<string, string>>({});
  const [infoEdited, setInfoEdited] = useState(false);

  // Settings tab state
  const [settingsForm, setSettingsForm] = useState<Record<string, string>>({});
  const [settingsEdited, setSettingsEdited] = useState(false);

  const utils = trpc.useUtils();

  const updateDealerMutation = trpc.dashboard.updateDealer.useMutation({
    onSuccess: () => {
      toast.success('تم تحديث بيانات المعرض');
      utils.dashboard.myDealer.invalidate();
      setInfoEdited(false);
      setSettingsEdited(false);
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : 'حدث خطأ'),
  });

  // All hooks must be called unconditionally before any early return
  const { data: myDealer } = trpc.dashboard.myDealer.useQuery(undefined, {
    enabled: isAuthenticated && !authLoading,
    onSuccess: (data: any) => {
      if (data) {
        setInfoForm({
          instagram: data.instagram ?? '',
          twitter: data.twitter ?? '',
          snapchat: data.snapchat ?? '',
          tiktok: data.tiktok ?? '',
          website: data.website ?? '',
          workingHours: data.workingHours ?? '',
          workingHoursDetail: data.workingHoursDetail ?? '',
          dealerType: data.dealerType ?? 'sell',
        });
        setSettingsForm({
          name: data.name ?? '',
          phone: data.phone ?? '',
          whatsapp: data.whatsapp ?? '',
          email: data.email ?? '',
          city: data.city ?? '',
          neighborhood: data.neighborhood ?? '',
          address: data.address ?? '',
          bio: data.bio ?? '',
        });
      }
    },
  } as any);
  const dealerId = myDealer?.id;
  const [analyticsDays, setAnalyticsDays] = useState(30);
  const analyticsData = trpc.dashboard.analytics.useQuery(
    { days: analyticsDays },
    { enabled: !!dealerId && activeTab === 'analytics' }
  );

  const { data: stats, refetch: refetchStats } = trpc.dashboard.stats.useQuery(
    { dealerId: dealerId! }, { enabled: !!dealerId, refetchInterval: 30000 }
  );
  const { data: vehiclesData, refetch: refetchVehicles } = trpc.vehicles.list.useQuery(
    { dealerId: dealerId!, limit: 100 }, { enabled: !!dealerId, refetchInterval: 60000 }
  );
  const { data: inquiriesData, refetch: refetchInquiries } = trpc.inquiries.byDealer.useQuery(
    { dealerId: dealerId! }, { enabled: !!dealerId, refetchInterval: 20000 }
  );

  const createVehicleMutation = trpc.vehicles.create.useMutation({
    onSuccess: () => {
      toast.success('تم إضافة السيارة بنجاح!');
      setShowAddVehicle(false);
      setVehicleImages([]);
      setVehicleVideo(null);
      setNewVehicle({ brand: '', model: '', year: new Date().getFullYear(), price: 0, condition: 'used', fuelType: 'petrol', transmission: 'automatic', color: '', mileage: 0, description: '', city: '' });
      refetchVehicles(); refetchStats();
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : 'حدث خطأ'),
  });

  const deleteVehicleMutation = trpc.vehicles.delete.useMutation({
    onSuccess: () => { toast.success('تم حذف السيارة'); refetchVehicles(); refetchStats(); },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : 'حدث خطأ'),
  });

  const updateStatusMutation = trpc.inquiries.updateStatus.useMutation({
    onSuccess: () => refetchInquiries(),
  });

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      toast.success('تم تسجيل الخروج بنجاح');
      navigate('/login?loggedOut=1');
    } catch {
      toast.error('تعذر تسجيل الخروج، حاول مجددًا');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Early returns AFTER all hooks
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'oklch(0.10 0.01 260)' }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'oklch(0.72 0.18 55)' }} />
      </div>
    );
  }
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'oklch(0.10 0.01 260)' }}>
        <div className="text-center p-8">
          <h2 className="text-white text-2xl font-black mb-3">تسجيل الدخول مطلوب</h2>
          <p className="text-white/50 mb-6 font-body">يجب تسجيل الدخول للوصول إلى لوحة التحكم</p>
          <button onClick={() => navigate('/login?redirect=%2Fdashboard')} className="btn-gold px-8 py-3 rounded-xl font-bold">تسجيل الدخول</button>
        </div>
      </div>
    );
  }

  const handleAddVehicle = () => {
    if (!dealerId) { toast.error('لا يوجد معرض مرتبط بحسابك'); return; }
    if (!newVehicle.brand || !newVehicle.model) { toast.error('يرجى ملء الماركة والموديل'); return; }
    if (!newVehicle.price) { toast.error('يرجى إدخال السعر'); return; }
    createVehicleMutation.mutate({
      dealerId, ...newVehicle,
      images: vehicleImages,
      videoUrl: vehicleVideo?.url,
      videoKey: vehicleVideo?.key,
    });
  };

  const handleSaveInfo = () => {
    if (!dealerId) return;
    updateDealerMutation.mutate({ dealerId, ...infoForm as any });
  };

  const handleSaveSettings = () => {
    if (!dealerId) return;
    updateDealerMutation.mutate({ dealerId, ...settingsForm as any });
  };

  const newInquiriesCount = (inquiriesData as any[])?.filter((i: any) => i.status === 'new').length ?? 0;

  const navItems: { id: Tab; label: string; icon: any; badge?: number }[] = [
    { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard },
    { id: 'analytics', label: 'التحليلات', icon: BarChart2 },
    { id: 'vehicles', label: 'السيارات', icon: Car, badge: (vehiclesData as any[])?.length },
    { id: 'inquiries', label: 'الاستفسارات', icon: MessageSquare, badge: newInquiriesCount },
    { id: 'info', label: 'معلومات المعرض', icon: Building2 },
    { id: 'media', label: 'الوسائط', icon: ImageIcon },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ background: 'oklch(0.10 0.01 260)' }}>
      <div className="p-5 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="text-white font-black text-lg" style={{ fontFamily: 'Cairo' }}>
            أوتو <span style={{ color: 'oklch(0.72 0.18 55)' }}>هَب</span>
          </span>
        </Link>
        <p className="text-white/40 text-xs mt-0.5 font-body">لوحة تحكم المعرض</p>
      </div>
      {myDealer && (
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center flex-shrink-0">
              {myDealer.logo ? <img src={myDealer.logo} alt="" className="w-full h-full object-cover" /> : <Car size={18} className="text-white/50" />}
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-sm truncate">{myDealer.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                {myDealer.isVerified && <BadgeCheck size={12} className="text-emerald-400" />}
                <span className="text-white/40 text-xs font-body">{myDealer.city}</span>
              </div>
            </div>
          </div>
          <div className="mt-3">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              (myDealer as any).status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
              (myDealer as any).status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
              'bg-red-500/20 text-red-400'
            }`}>
            {(myDealer as any).status === 'active' ? '● نشط' :
             (myDealer as any).status === 'pending' ? '● قيد المراجعة' : '● موقوف'}
          </span>
            {(myDealer as any).status === 'rejected' && (myDealer as any).rejectionReason && (
              <div className="mt-2 text-[10px] text-red-300/80 bg-red-500/10 border border-red-500/20 rounded-lg px-2 py-1.5 leading-relaxed">
                <span className="font-bold block mb-0.5">سبب الرفض:</span>
                {(myDealer as any).rejectionReason}
              </div>
            )}
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/60 mr-1.5">
              {(myDealer as any).plan === 'premium' ? '★ بريميوم' :
               (myDealer as any).plan === 'pro' ? '★ برو' :
               (myDealer as any).plan === 'basic' ? 'أساسي' : 'مجاني'}
            </span>
          </div>
        </div>
      )}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(item => (
          <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
              activeTab === item.id ? 'text-[oklch(0.10_0.01_260)] font-bold' : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
            style={activeTab === item.id ? { background: 'oklch(0.72 0.18 55)' } : {}}>
            <div className="flex items-center gap-2.5"><item.icon size={16} />{item.label}</div>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="text-xs font-black px-1.5 py-0.5 rounded-full bg-white/20 text-white min-w-[20px] text-center">{item.badge}</span>
            )}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-sm">
            {user?.name?.charAt(0) ?? 'م'}
          </div>
          <p className="text-white text-xs font-bold truncate">{user?.name ?? 'مستخدم'}</p>
        </div>
        {myDealer && (
          <Link href={`/dealer/${myDealer.slug}`} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 text-xs font-semibold transition-colors mb-1">
            <Eye size={14} /> عرض الصفحة العامة للمعرض
          </Link>
        )}
        <Link href="/" className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 text-xs font-semibold transition-colors mb-1">
          <Eye size={14} /> العودة للموقع
        </Link>
        <button onClick={handleLogout} disabled={isLoggingOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-300/80 hover:text-red-200 hover:bg-red-500/10 text-xs font-semibold transition-colors disabled:opacity-60">
          <LogOut size={14} /> {isLoggingOut ? 'جارٍ تسجيل الخروج...' : 'تسجيل الخروج'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background" dir="rtl">
      <div className="hidden lg:flex w-64 flex-shrink-0 flex-col border-l border-white/10"><SidebarContent /></div>
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64 flex-shrink-0"><SidebarContent /></div>
          <div className="flex-1 bg-black/60" onClick={() => setSidebarOpen(false)} />
        </div>
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-background">
          <button className="lg:hidden p-2 rounded-lg hover:bg-secondary" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
          <h1 className="text-lg font-black text-foreground">{navItems.find(n => n.id === activeTab)?.label}</h1>
          {!myDealer && <Link href="/register" className="btn-gold px-4 py-2 rounded-lg text-xs font-bold">سجّل معرضك</Link>}
        </div>

        <div className="flex-1 overflow-y-auto p-5">

          {/* ═══ OVERVIEW ═══ */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {!myDealer ? (
                <div className="text-center py-16">
                  <Car size={48} className="mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-black mb-2">لا يوجد معرض مرتبط</h3>
                  <p className="text-muted-foreground font-body mb-6">سجّل معرضك للبدء في إدارة سياراتك</p>
                  <Link href="/register" className="btn-gold px-8 py-3 rounded-xl font-bold inline-block">سجّل معرضك الآن</Link>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'إجمالي الزيارات', value: stats?.totalViews ?? 0, icon: Eye, color: 'oklch(0.55 0.20 260)' },
                      { label: 'الاستفسارات', value: stats?.totalInquiries ?? 0, icon: MessageSquare, color: 'oklch(0.72 0.18 55)' },
                      { label: 'السيارات المعروضة', value: stats?.totalVehicles ?? 0, icon: Car, color: 'oklch(0.55 0.18 145)' },
                      { label: 'متوسط التقييم', value: stats?.avgRating ? (stats.avgRating as number).toFixed(1) : '—', icon: Star, color: 'oklch(0.75 0.18 55)' },
                    ].map(stat => (
                      <div key={stat.label} className="bg-card border border-border rounded-xl p-4"
                        style={{ clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))' }}>
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: `${stat.color}/0.15` }}>
                          <stat.icon size={16} style={{ color: stat.color }} />
                        </div>
                        <p className="text-2xl font-black text-foreground">{typeof stat.value === 'number' ? stat.value.toLocaleString('ar-SA') : stat.value}</p>
                        <p className="text-xs text-muted-foreground font-body mt-0.5">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-border">
                      <h3 className="font-black text-foreground">آخر الاستفسارات</h3>
                      <button onClick={() => setActiveTab('inquiries')} className="text-xs font-semibold flex items-center gap-1" style={{ color: 'oklch(0.72 0.18 55)' }}>
                        عرض الكل <ChevronLeft size={14} />
                      </button>
                    </div>
                    {!(stats?.recentInquiries as any[])?.length ? (
                      <div className="p-8 text-center text-muted-foreground font-body text-sm">لا توجد استفسارات بعد</div>
                    ) : (
                      <div className="divide-y divide-border">
                        {(stats?.recentInquiries as any[])?.slice(0, 5).map((inq: any) => (
                          <div key={inq.id} className="flex items-center gap-3 p-4">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm flex-shrink-0"
                              style={{ background: 'oklch(0.72 0.18 55)', color: 'oklch(0.10 0.01 260)' }}>
                              {inq.name?.charAt(0) ?? 'م'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm text-foreground">{inq.name}</p>
                              <p className="text-xs text-muted-foreground font-body truncate">{inq.message}</p>
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_CONFIG[inq.status]?.color}`}>
                              {STATUS_CONFIG[inq.status]?.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-border">
                      <h3 className="font-black text-foreground">آخر السيارات</h3>
                      <button onClick={() => setActiveTab('vehicles')} className="text-xs font-semibold flex items-center gap-1" style={{ color: 'oklch(0.72 0.18 55)' }}>
                        إدارة السيارات <ChevronLeft size={14} />
                      </button>
                    </div>
                    {!(stats?.recentVehicles as any[])?.length ? (
                      <div className="p-8 text-center text-muted-foreground font-body text-sm">لا توجد سيارات بعد</div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                        {(stats?.recentVehicles as any[])?.map((v: any) => (
                          <div key={v.id} className="border border-border rounded-lg overflow-hidden bg-secondary">
                            <div className="aspect-video bg-muted flex items-center justify-center relative">
                              {v.images && (() => { try { return JSON.parse(v.images)?.[0]; } catch { return null; } })() ? (
                                <img src={JSON.parse(v.images)[0]} alt="" className="w-full h-full object-cover" />
                              ) : <Car size={28} className="text-muted-foreground" />}
                              {v.videoUrl && (
                                <div className="absolute top-2 right-2 bg-black/70 rounded px-1.5 py-0.5 flex items-center gap-1">
                                  <Video size={10} className="text-white" /><span className="text-white text-[10px] font-bold">فيديو</span>
                                </div>
                              )}
                            </div>
                            <div className="p-3">
                              <p className="font-bold text-sm">{v.brand} {v.model} {v.year}</p>
                              <p className="text-xs text-muted-foreground font-body">{v.price?.toLocaleString('ar-SA')} ريال</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ═══ VEHICLES ═══ */}
          {activeTab === 'vehicles' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black">إدارة السيارات</h2>
                {myDealer && (
                  <button onClick={() => setShowAddVehicle(true)} className="btn-gold px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                    <Plus size={16} /> إضافة سيارة
                  </button>
                )}
              </div>

              {showAddVehicle && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" dir="rtl">
                  <div className="bg-background border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between p-5 border-b border-border">
                      <h3 className="text-lg font-black">إضافة سيارة جديدة</h3>
                      <button onClick={() => setShowAddVehicle(false)} className="p-2 rounded-lg hover:bg-secondary"><X size={18} /></button>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold mb-1.5">الماركة *</label>
                          <select value={newVehicle.brand} onChange={e => setNewVehicle(p => ({ ...p, brand: e.target.value }))}
                            className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary text-sm appearance-none">
                            <option value="">اختر الماركة</option>
                            {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold mb-1.5">الموديل *</label>
                          <input value={newVehicle.model} onChange={e => setNewVehicle(p => ({ ...p, model: e.target.value }))}
                            placeholder="مثال: كامري" className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold mb-1.5">السنة</label>
                          <input type="number" value={newVehicle.year} onChange={e => setNewVehicle(p => ({ ...p, year: +e.target.value }))}
                            min={1990} max={2026} className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold mb-1.5">السعر (ريال) *</label>
                          <input type="number" value={newVehicle.price || ''} onChange={e => setNewVehicle(p => ({ ...p, price: +e.target.value }))}
                            placeholder="0" className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold mb-1.5">الحالة</label>
                          <select value={newVehicle.condition} onChange={e => setNewVehicle(p => ({ ...p, condition: e.target.value as any }))}
                            className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary text-sm appearance-none">
                            <option value="used">مستعملة</option>
                            <option value="new">جديدة</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold mb-1.5">ناقل الحركة</label>
                          <select value={newVehicle.transmission} onChange={e => setNewVehicle(p => ({ ...p, transmission: e.target.value as any }))}
                            className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary text-sm appearance-none">
                            <option value="automatic">أوتوماتيك</option>
                            <option value="manual">يدوي</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold mb-1.5">نوع الوقود</label>
                          <select value={newVehicle.fuelType} onChange={e => setNewVehicle(p => ({ ...p, fuelType: e.target.value as any }))}
                            className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary text-sm appearance-none">
                            <option value="petrol">بنزين</option>
                            <option value="diesel">ديزل</option>
                            <option value="hybrid">هايبرد</option>
                            <option value="electric">كهربائي</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold mb-1.5">اللون</label>
                          <input value={newVehicle.color} onChange={e => setNewVehicle(p => ({ ...p, color: e.target.value }))}
                            placeholder="أبيض" className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold mb-1.5">المسافة المقطوعة (كم)</label>
                          <input type="number" value={newVehicle.mileage || ''} onChange={e => setNewVehicle(p => ({ ...p, mileage: +e.target.value }))}
                            placeholder="0" className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold mb-1.5">المدينة</label>
                          <input value={newVehicle.city} onChange={e => setNewVehicle(p => ({ ...p, city: e.target.value }))}
                            placeholder="الرياض" className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary text-sm" />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-bold mb-1.5">الوصف</label>
                          <textarea value={newVehicle.description} onChange={e => setNewVehicle(p => ({ ...p, description: e.target.value }))}
                            rows={3} placeholder="وصف تفصيلي للسيارة..." className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary text-sm resize-none font-body" />
                        </div>
                      </div>
                      <MediaUploader dealerId={dealerId!} fileType="image" multiple maxFiles={10}
                        label="صور السيارة (حتى 10 صور)" hint="الصورة الأولى ستكون الصورة الرئيسية"
                        onUpload={(files) => setVehicleImages(files.map(f => f.url))} />
                      <MediaUploader dealerId={dealerId!} fileType="video" multiple={false}
                        label="فيديو السيارة (اختياري)" hint="MP4 أو WebM — حتى 50 ميجابايت"
                        onUpload={(files) => { if (files[0]) setVehicleVideo({ url: files[0].url, key: files[0].key }); else setVehicleVideo(null); }} />
                      <div className="flex gap-3 pt-2">
                        <button onClick={handleAddVehicle} disabled={createVehicleMutation.isPending}
                          className="btn-gold flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                          {createVehicleMutation.isPending ? <><div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" />جاري الحفظ...</> : <><Plus size={16} />إضافة السيارة</>}
                        </button>
                        <button onClick={() => setShowAddVehicle(false)} className="px-6 py-3 rounded-xl border border-border font-semibold text-sm hover:bg-secondary transition-colors">إلغاء</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!(vehiclesData as any[])?.length ? (
                <div className="text-center py-16 border border-dashed border-border rounded-xl">
                  <Car size={40} className="mx-auto mb-3 text-muted-foreground" />
                  <p className="font-bold text-foreground mb-1">لا توجد سيارات بعد</p>
                  <p className="text-sm text-muted-foreground font-body mb-4">ابدأ بإضافة سيارتك الأولى</p>
                  {myDealer && <button onClick={() => setShowAddVehicle(true)} className="btn-gold px-6 py-2.5 rounded-lg text-sm font-bold">إضافة سيارة</button>}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(vehiclesData as any[]).map((v: any) => {
                    let imgs: string[] = [];
                    try { imgs = JSON.parse(v.images ?? '[]'); } catch {}
                    return (
                      <div key={v.id} className="bg-card border border-border rounded-xl overflow-hidden">
                        <div className="aspect-video bg-secondary relative">
                          {imgs[0] ? (
                            <img src={imgs[0]} alt="" className="w-full h-full object-cover" />
                          ) : <div className="w-full h-full flex items-center justify-center"><Car size={32} className="text-muted-foreground" /></div>}
                          <div className="absolute top-2 right-2 flex gap-1.5">
                            {v.videoUrl && (
                              <span className="bg-black/70 rounded px-1.5 py-0.5 flex items-center gap-1">
                                <Video size={10} className="text-white" /><span className="text-white text-[10px] font-bold">فيديو</span>
                              </span>
                            )}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${v.condition === 'new' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                              {v.condition === 'new' ? 'جديدة' : 'مستعملة'}
                            </span>
                          </div>
                        </div>
                        <div className="p-3">
                          <p className="font-black text-sm">{v.brand} {v.model} {v.year}</p>
                          <p className="font-black text-base mt-0.5" style={{ color: 'oklch(0.72 0.18 55)' }}>{v.price?.toLocaleString('ar-SA')} ريال</p>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-xs text-muted-foreground font-body">{FUEL_LABELS[v.fuelType]} · {TRANS_LABELS[v.transmission]}</span>
                            <button onClick={() => { if (confirm('هل أنت متأكد من حذف هذه السيارة؟')) deleteVehicleMutation.mutate({ id: v.id }); }}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══ INQUIRIES ═══ */}
          {activeTab === 'inquiries' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black">الاستفسارات الواردة</h2>
                <span className="text-sm text-muted-foreground font-body">{newInquiriesCount > 0 ? `${newInquiriesCount} جديد` : 'لا يوجد جديد'}</span>
              </div>
              {!(inquiriesData as any[])?.length ? (
                <div className="text-center py-16 border border-dashed border-border rounded-xl">
                  <MessageSquare size={40} className="mx-auto mb-3 text-muted-foreground" />
                  <p className="font-bold text-foreground mb-1">لا توجد استفسارات بعد</p>
                  <p className="text-sm text-muted-foreground font-body">ستظهر هنا استفسارات العملاء</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(inquiriesData as any[]).map((inq: any) => (
                    <div key={inq.id} className="bg-card border border-border rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                            style={{ background: 'oklch(0.72 0.18 55)', color: 'oklch(0.10 0.01 260)' }}>
                            {inq.name?.charAt(0) ?? 'م'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-black text-sm">{inq.name}</p>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_CONFIG[inq.status]?.color}`}>
                                {STATUS_CONFIG[inq.status]?.label}
                              </span>
                            </div>
                            <a href={`tel:${inq.phone}`} className="text-xs font-body flex items-center gap-1 mt-0.5 hover:underline" style={{ color: 'oklch(0.72 0.18 55)' }}>
                              <Phone size={11} /> {inq.phone}
                            </a>
                            <p className="text-sm text-foreground font-body mt-2 leading-relaxed">{inq.message}</p>
                            <p className="text-xs text-muted-foreground font-body mt-1.5">
                              {new Date(inq.createdAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5 flex-shrink-0">
                          {inq.status !== 'replied' && (
                            <button onClick={() => updateStatusMutation.mutate({ id: inq.id, status: 'replied' })}
                              className="text-xs px-3 py-1.5 rounded-lg font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors">تم الرد</button>
                          )}
                          {inq.status === 'new' && (
                            <button onClick={() => updateStatusMutation.mutate({ id: inq.id, status: 'read' })}
                              className="text-xs px-3 py-1.5 rounded-lg font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-colors">تحديد كمقروء</button>
                          )}
                          <a href={`https://wa.me/966${inq.phone?.replace(/^0/, '')}`} target="_blank" rel="noopener noreferrer"
                            className="text-xs px-3 py-1.5 rounded-lg font-bold text-green-400 bg-green-500/10 hover:bg-green-500/20 transition-colors text-center">واتساب</a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ INFO (معلومات المعرض) ═══ */}
          {activeTab === 'info' && (
            <div className="space-y-5 max-w-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black">معلومات المعرض</h2>
                {infoEdited && (
                  <button onClick={handleSaveInfo} disabled={updateDealerMutation.isPending}
                    className="btn-gold px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                    <Save size={14} /> حفظ التغييرات
                  </button>
                )}
              </div>
              {!myDealer ? (
                <div className="text-center py-12 text-muted-foreground font-body">سجّل معرضك أولاً</div>
              ) : (
                <div className="space-y-5">
                  {/* نوع المعرض */}
                  <div className="bg-card border border-border rounded-xl p-5">
                    <h3 className="font-black mb-4 flex items-center gap-2 text-sm"><Building2 size={15} style={{ color: 'oklch(0.72 0.18 55)' }} />نوع المعرض</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'sell', label: 'بيع فقط' },
                        { value: 'buy', label: 'شراء فقط' },
                        { value: 'both', label: 'بيع وشراء' },
                      ].map(opt => (
                        <button key={opt.value}
                          onClick={() => { setInfoForm(p => ({ ...p, dealerType: opt.value })); setInfoEdited(true); }}
                          className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                            infoForm.dealerType === opt.value
                              ? 'border-[oklch(0.72_0.18_55)] text-[oklch(0.72_0.18_55)] bg-[oklch(0.72_0.18_55)]/10'
                              : 'border-border text-muted-foreground hover:border-[oklch(0.72_0.18_55)]/50'
                          }`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ساعات العمل */}
                  <div className="bg-card border border-border rounded-xl p-5">
                    <h3 className="font-black mb-4 flex items-center gap-2 text-sm"><Clock size={15} style={{ color: 'oklch(0.72 0.18 55)' }} />ساعات العمل</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold mb-1.5">ملخص ساعات العمل</label>
                        <input value={infoForm.workingHours ?? ''} onChange={e => { setInfoForm(p => ({ ...p, workingHours: e.target.value })); setInfoEdited(true); }}
                          placeholder="السبت - الخميس: 9 صباحاً - 9 مساءً"
                          className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1.5">تفاصيل إضافية (اختياري)</label>
                        <textarea value={infoForm.workingHoursDetail ?? ''} onChange={e => { setInfoForm(p => ({ ...p, workingHoursDetail: e.target.value })); setInfoEdited(true); }}
                          rows={3} placeholder="مثال: الجمعة: مغلق، الأعياد: مغلق..."
                          className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary text-sm resize-none font-body" />
                      </div>
                    </div>
                  </div>

                  {/* حسابات التواصل الاجتماعي */}
                  <div className="bg-card border border-border rounded-xl p-5">
                    <h3 className="font-black mb-4 flex items-center gap-2 text-sm"><Share2 size={15} style={{ color: 'oklch(0.72 0.18 55)' }} />حسابات التواصل الاجتماعي</h3>
                    <div className="space-y-3">
                      {[
                        { key: 'instagram', label: 'إنستغرام', icon: Instagram, placeholder: 'اسم المستخدم (بدون @)' },
                        { key: 'twitter', label: 'تويتر / X', icon: Twitter, placeholder: 'اسم المستخدم (بدون @)' },
                        { key: 'snapchat', label: 'سناب شات', icon: Share2, placeholder: 'اسم المستخدم' },
                        { key: 'tiktok', label: 'تيك توك', icon: Video, placeholder: 'اسم المستخدم (بدون @)' },
                        { key: 'website', label: 'الموقع الإلكتروني', icon: Globe, placeholder: 'https://example.com' },
                      ].map(field => (
                        <div key={field.key} className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-secondary border border-border">
                            <field.icon size={16} className="text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs font-bold mb-1">{field.label}</label>
                            <input value={infoForm[field.key] ?? ''} onChange={e => { setInfoForm(p => ({ ...p, [field.key]: e.target.value })); setInfoEdited(true); }}
                              placeholder={field.placeholder}
                              className="w-full px-3 py-2 rounded-lg border border-border bg-secondary text-sm" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button onClick={handleSaveInfo} disabled={updateDealerMutation.isPending}
                    className="btn-gold w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                    {updateDealerMutation.isPending ? <><div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" />جاري الحفظ...</> : <><Save size={16} />حفظ معلومات المعرض</>}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ═══ MEDIA ═══ */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              <h2 className="text-xl font-black">إدارة الوسائط</h2>
              {!myDealer ? (
                <div className="text-center py-12 text-muted-foreground font-body">سجّل معرضك أولاً لرفع الوسائط</div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-card border border-border rounded-xl p-5">
                    <h3 className="font-black mb-4 flex items-center gap-2"><ImageIcon size={16} style={{ color: 'oklch(0.72 0.18 55)' }} />شعار المعرض</h3>
                    {myDealer.logo && (
                      <div className="mb-3 flex items-center gap-3 p-3 bg-secondary rounded-lg">
                        <img src={myDealer.logo} alt="الشعار الحالي" className="w-14 h-14 object-cover rounded border border-border" />
                        <div>
                          <p className="text-xs font-bold text-muted-foreground">الشعار الحالي</p>
                          <p className="text-xs text-muted-foreground mt-0.5">ارفع شعاراً جديداً لاستبداله</p>
                        </div>
                      </div>
                    )}
                    <MediaUploader dealerId={dealerId!} fileType="logo" multiple={false}
                      label="رفع شعار المعرض" hint="PNG أو JPG — مربع 200×200 بكسل على الأقل"
                      onUpload={(files) => {
                        if (files[0] && dealerId) {
                          updateDealerMutation.mutate({ dealerId, logo: files[0].url });
                        }
                      }} />
                  </div>
                  <div className="bg-card border border-border rounded-xl p-5">
                    <h3 className="font-black mb-4 flex items-center gap-2"><ImageIcon size={16} style={{ color: 'oklch(0.72 0.18 55)' }} />صورة الغلاف</h3>
                    {myDealer.cover && (
                      <div className="mb-3 rounded-lg overflow-hidden border border-border relative aspect-video">
                        <img src={myDealer.cover} alt="الغلاف الحالي" className="w-full h-full object-cover" />
                        <span className="absolute bottom-2 right-2 text-[10px] font-bold bg-black/60 text-white px-2 py-0.5 rounded">الغلاف الحالي</span>
                      </div>
                    )}
                    <MediaUploader dealerId={dealerId!} fileType="cover" multiple={false}
                      label="رفع صورة الغلاف" hint="JPEG أو PNG — 1200×400 بكسل مثالي"
                      onUpload={(files) => {
                        if (files[0] && dealerId) {
                          updateDealerMutation.mutate({ dealerId, cover: files[0].url });
                        }
                      }} />
                  </div>
                  <div className="bg-card border border-border rounded-xl p-5 lg:col-span-2">
                    <h3 className="font-black mb-4 flex items-center gap-2"><Video size={16} style={{ color: 'oklch(0.72 0.18 55)' }} />فيديو تعريفي للمعرض</h3>
                    <p className="text-xs text-muted-foreground font-body mb-3">يظهر في صفحة ملف معرضك للزوار</p>
                    <MediaUploader dealerId={dealerId!} fileType="video" multiple={false}
                      label="رفع فيديو تعريفي" hint="MP4 أو WebM — حتى 50 ميجابايت"
                      onUpload={(files) => {
                        if (files[0] && dealerId) {
                          toast.success('تم رفع الفيديو التعريفي بنجاح!');
                        }
                      }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ SETTINGS ═══ */}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Period selector */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black">تحليلات المعرض</h2>
                <div className="flex gap-2">
                  {[7, 14, 30, 90].map(d => (
                    <button key={d} onClick={() => setAnalyticsDays(d)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${analyticsDays === d ? 'text-black' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}
                      style={analyticsDays === d ? { background: 'oklch(0.72 0.18 55)' } : {}}>
                      {d} يوم
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'إجمالي الزيارات', value: analyticsData.data?.totals.views ?? 0, color: 'oklch(0.72 0.18 55)', icon: Eye },
                  { label: 'إجمالي الاستفسارات', value: analyticsData.data?.totals.inquiries ?? 0, color: 'oklch(0.55 0.22 260)', icon: MessageSquare },
                  { label: 'مشاهدات السيارات', value: analyticsData.data?.totals.vehicleViews ?? 0, color: 'oklch(0.55 0.22 150)', icon: Car },
                ].map(card => (
                  <div key={card.label} className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <card.icon size={16} style={{ color: card.color }} />
                      <span className="text-xs text-muted-foreground">{card.label}</span>
                    </div>
                    <div className="text-2xl font-black" style={{ color: card.color }}>
                      {analyticsData.isLoading ? '...' : card.value.toLocaleString('ar-SA')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Views chart */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-black text-sm mb-4 flex items-center gap-2">
                  <TrendingUp size={14} style={{ color: 'oklch(0.72 0.18 55)' }} />
                  الزيارات اليومية
                </h3>
                {analyticsData.isLoading ? (
                  <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">جاري التحميل...</div>
                ) : !analyticsData.data?.daily?.length ? (
                  <div className="h-48 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                    <BarChart2 size={32} className="opacity-30" />
                    <span>لا توجد بيانات بعد. ستظهر البيانات عند زيارة العملاء لملف معرضك.</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={analyticsData.data.daily.map(d => ({ date: d.date?.slice(5), views: d.views, inquiries: d.inquiries, vehicleViews: d.vehicleViews }))}>
                      <defs>
                        <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="oklch(0.72 0.18 55)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="oklch(0.72 0.18 55)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#888' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#888' }} />
                      <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                      <Area type="monotone" dataKey="views" stroke="oklch(0.72 0.18 55)" fill="url(#viewsGrad)" strokeWidth={2} name="زيارات" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Inquiries & vehicle views chart */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-black text-sm mb-4 flex items-center gap-2">
                  <BarChart2 size={14} style={{ color: 'oklch(0.55 0.22 260)' }} />
                  الاستفسارات ومشاهدات السيارات
                </h3>
                {analyticsData.isLoading ? (
                  <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">جاري التحميل...</div>
                ) : !analyticsData.data?.daily?.length ? (
                  <div className="h-48 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                    <BarChart2 size={32} className="opacity-30" />
                    <span>لا توجد بيانات بعد.</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={analyticsData.data.daily.map(d => ({ date: d.date?.slice(5), inquiries: d.inquiries, vehicleViews: d.vehicleViews }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#888' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#888' }} />
                      <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="inquiries" fill="oklch(0.55 0.22 260)" name="استفسارات" radius={[4,4,0,0]} />
                      <Bar dataKey="vehicleViews" fill="oklch(0.55 0.22 150)" name="مشاهدات سيارات" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-5 max-w-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black">إعدادات المعرض</h2>
                {settingsEdited && (
                  <button onClick={handleSaveSettings} disabled={updateDealerMutation.isPending}
                    className="btn-gold px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                    <Save size={14} /> حفظ
                  </button>
                )}
              </div>
              {!myDealer ? (
                <div className="text-center py-12 text-muted-foreground font-body">سجّل معرضك أولاً</div>
              ) : (
                <div className="space-y-5">
                  <div className="bg-card border border-border rounded-xl p-5">
                    <h3 className="font-black mb-4 text-sm flex items-center gap-2"><Edit3 size={14} style={{ color: 'oklch(0.72 0.18 55)' }} />المعلومات الأساسية</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold mb-1.5">اسم المعرض</label>
                        <input value={settingsForm.name ?? ''} onChange={e => { setSettingsForm(p => ({ ...p, name: e.target.value })); setSettingsEdited(true); }}
                          className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1.5">المدينة</label>
                        <input value={settingsForm.city ?? ''} onChange={e => { setSettingsForm(p => ({ ...p, city: e.target.value })); setSettingsEdited(true); }}
                          placeholder="الرياض" className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1.5">الحي</label>
                        <input value={settingsForm.neighborhood ?? ''} onChange={e => { setSettingsForm(p => ({ ...p, neighborhood: e.target.value })); setSettingsEdited(true); }}
                          placeholder="حي النزهة" className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1.5">العنوان التفصيلي</label>
                        <input value={settingsForm.address ?? ''} onChange={e => { setSettingsForm(p => ({ ...p, address: e.target.value })); setSettingsEdited(true); }}
                          placeholder="شارع الملك فهد..." className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary text-sm" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-xl p-5">
                    <h3 className="font-black mb-4 text-sm flex items-center gap-2"><Phone size={14} style={{ color: 'oklch(0.72 0.18 55)' }} />معلومات التواصل</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold mb-1.5">رقم الهاتف</label>
                        <input value={settingsForm.phone ?? ''} onChange={e => { setSettingsForm(p => ({ ...p, phone: e.target.value })); setSettingsEdited(true); }}
                          placeholder="05xxxxxxxx" className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1.5">واتساب</label>
                        <input value={settingsForm.whatsapp ?? ''} onChange={e => { setSettingsForm(p => ({ ...p, whatsapp: e.target.value })); setSettingsEdited(true); }}
                          placeholder="05xxxxxxxx" className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary text-sm" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold mb-1.5">البريد الإلكتروني</label>
                        <input value={settingsForm.email ?? ''} onChange={e => { setSettingsForm(p => ({ ...p, email: e.target.value })); setSettingsEdited(true); }}
                          placeholder="info@dealer.com" className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary text-sm" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-xl p-5">
                    <h3 className="font-black mb-4 text-sm flex items-center gap-2"><Building2 size={14} style={{ color: 'oklch(0.72 0.18 55)' }} />نبذة عن المعرض</h3>
                    <textarea value={settingsForm.bio ?? ''} onChange={e => { setSettingsForm(p => ({ ...p, bio: e.target.value })); setSettingsEdited(true); }}
                      rows={5} placeholder="اكتب نبذة تعريفية عن معرضك، تخصصاتك، وما يميزك..."
                      className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary text-sm resize-none font-body" />
                  </div>

                  <button onClick={handleSaveSettings} disabled={updateDealerMutation.isPending}
                    className="btn-gold w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                    {updateDealerMutation.isPending ? <><div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" />جاري الحفظ...</> : <><Save size={16} />حفظ الإعدادات</>}
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
