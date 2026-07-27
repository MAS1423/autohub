import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Link } from 'wouter';
import { useI18n } from '@/lib/i18n';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  BarChart2, Car, Users, CheckCircle, XCircle, Clock, BadgeCheck,
  Shield, TrendingUp, Eye, MessageCircle, Star, Crown,
  Search, AlertCircle, Trash2, UserCheck, UserX, ClipboardList, Inbox, Phone, Mail
} from 'lucide-react';
import { toast } from 'sonner';

type AdminTab = 'overview' | 'dealers' | 'vehicles' | 'users' | 'vehicleRequests' | 'inquiries' | 'contactMessages' | 'reviews';

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const { lang } = useI18n();
  const isRtl = lang === 'ar';
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: stats, isLoading: statsLoading } = trpc.admin.stats.useQuery();
  const { data: allDealers = [], isLoading: dealersLoading, refetch: refetchDealers } = trpc.admin.dealers.useQuery();
  const { data: allUsers = [], isLoading: usersLoading, refetch: refetchUsers } = trpc.admin.allUsers.useQuery();
  const { data: allVehicles = [], isLoading: vehiclesLoading } = trpc.admin.allVehicles.useQuery();
  const { data: allInquiries = [], isLoading: inquiriesLoading } = trpc.admin.allInquiries.useQuery();
  const { data: contactMessages = [], isLoading: contactMessagesLoading, refetch: refetchContactMessages } = trpc.admin.contactMessages.useQuery();
  const { data: vehicleRequests = [], isLoading: vehicleRequestsLoading } = trpc.admin.vehicleRequests.useQuery();
  const { data: allReviews = [], isLoading: reviewsLoading, refetch: refetchReviews } = trpc.admin.allReviews.useQuery();

  const deleteReviewMutation = trpc.admin.deleteReview.useMutation({
    onSuccess: () => { toast.success('تم حذف التقييم'); refetchReviews(); },
    onError: () => toast.error('فشل حذف التقييم'),
  });
  const updateContactStatusMutation = trpc.admin.updateContactStatus.useMutation({
    onSuccess: () => { toast.success('تم تحديث حالة رسالة التواصل'); refetchContactMessages(); },
    onError: () => toast.error('تعذر تحديث حالة الرسالة'),
  });

  const dealers = allDealers.filter(d => {
    if (searchQuery && !d.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (planFilter && d.plan !== planFilter) return false;
    if (statusFilter && (d as any).status !== statusFilter) return false;
    return true;
  });

  const verifyMutation = trpc.admin.verifyDealer.useMutation({
    onSuccess: () => { toast.success('تم تحديث حالة التوثيق'); refetchDealers(); },
    onError: () => toast.error('حدث خطأ'),
  });
  const updatePlanMutation = trpc.admin.updatePlan.useMutation({
    onSuccess: () => { toast.success('تم تحديث الخطة'); refetchDealers(); },
    onError: () => toast.error('حدث خطأ'),
  });
  const updateStatusMutation = trpc.admin.updateDealerStatus.useMutation({
    onSuccess: () => { toast.success('تم تحديث الحالة'); refetchDealers(); },
    onError: () => toast.error('حدث خطأ'),
  });
  const deleteDealerMutation = trpc.admin.deleteDealer.useMutation({
    onSuccess: () => { toast.success('تم حذف المعرض'); refetchDealers(); },
    onError: () => toast.error('حدث خطأ'),
  });
  const updateUserRoleMutation = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => { toast.success('تم تحديث الصلاحية'); refetchUsers(); },
    onError: () => toast.error('حدث خطأ'),
  });

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="text-center">
          <Shield className="w-20 h-20 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">{isRtl ? 'غير مصرح لك' : 'Access Denied'}</h2>
          <p className="text-gray-400 mb-6">{isRtl ? 'هذه الصفحة للمشرفين فقط' : 'This page is for admins only'}</p>
          <Link href="/"><button className="px-6 py-3 bg-[#C9A84C] text-black font-bold rounded-xl">{isRtl ? 'العودة للرئيسية' : 'Back to Home'}</button></Link>
        </div>
      </div>
    );
  }

  const STATUS_COLORS: Record<string, string> = {
    active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    suspended: 'bg-red-500/20 text-red-400 border-red-500/30',
    rejected: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };
  const STATUS_LABELS: Record<string, string> = {
    active: 'نشط', pending: 'قيد المراجعة', suspended: 'موقوف', rejected: 'مرفوض',
  };
  const PLAN_COLORS: Record<string, string> = {
    free: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    basic: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    pro: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    premium: 'bg-[#C9A84C]/20 text-[#C9A84C] border-[#C9A84C]/30',
  };
  const CONTACT_STATUS_COLORS: Record<string, string> = {
    new: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    read: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    replied: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  };
  const CONTACT_STATUS_LABELS: Record<string, string> = {
    new: 'جديدة', read: 'مقروءة', replied: 'تم الرد',
  };
  const newContactMessages = (contactMessages as any[]).filter(message => message.status === 'new').length;

  const tabs: { id: AdminTab; label: string; icon: any; count?: number }[] = [
    { id: 'overview', label: 'نظرة عامة', icon: BarChart2 },
    { id: 'dealers', label: 'المعارض', icon: Car, count: allDealers.length },
    { id: 'vehicles', label: 'السيارات', icon: TrendingUp, count: allVehicles.length },
    { id: 'users', label: 'المستخدمون', icon: Users, count: allUsers.length },
    { id: 'vehicleRequests', label: 'طلبات السيارات', icon: ClipboardList, count: vehicleRequests.length },
    { id: 'inquiries', label: 'استفسارات المعارض', icon: MessageCircle, count: allInquiries.length },
    { id: 'contactMessages', label: 'رسائل التواصل', icon: Inbox, count: newContactMessages },
    { id: 'reviews', label: 'التقييمات', icon: Star, count: allReviews.length },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white" dir="rtl">
      <Header />
      <div className="max-w-7xl mx-auto px-4 pt-28 pb-20">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Shield className="w-8 h-8 text-[#C9A84C]" />
              <h1 className="text-3xl font-black text-white">لوحة تحكم الأدمن</h1>
            </div>
            <p className="text-gray-400">إدارة المعارض والاشتراكات والإحصائيات</p>
          </div>
          <div className="flex items-center gap-2 bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-xl px-4 py-2">
            <Crown className="w-5 h-5 text-[#C9A84C]" />
            <span className="text-[#C9A84C] font-bold text-sm">مشرف</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#111] border border-[#1e1e1e] rounded-xl p-1 mb-8 flex-wrap">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === tab.id ? 'bg-[#C9A84C] text-black' : 'text-gray-400 hover:text-white'}`}>
              <tab.icon className="w-4 h-4" />{tab.label}
              {tab.count !== undefined && <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-black/20' : 'bg-white/10'}`}>{tab.count}</span>}
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {statsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => <div key={i} className="bg-[#111] rounded-2xl h-28 animate-pulse border border-[#1e1e1e]" />)}
              </div>
            ) : stats ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { icon: Car, label: 'إجمالي المعارض', value: stats.totalDealers, color: 'text-[#C9A84C]' },
                    { icon: BadgeCheck, label: 'معارض موثقة', value: stats.verifiedDealers, color: 'text-emerald-400' },
                    { icon: Clock, label: 'بانتظار التوثيق', value: stats.pendingDealers, color: 'text-amber-400' },
                    { icon: Crown, label: 'اشتراكات مدفوعة', value: stats.paidDealers, color: 'text-[#C9A84C]' },
                    { icon: TrendingUp, label: 'إجمالي السيارات', value: stats.totalVehicles, color: 'text-blue-400' },
                    { icon: MessageCircle, label: 'إجمالي الاستفسارات', value: stats.totalInquiries, color: 'text-purple-400' },
                    { icon: Star, label: 'إجمالي التقييمات', value: stats.totalReviews, color: 'text-amber-400' },
                    { icon: Eye, label: 'إجمالي المشاهدات', value: (stats.totalViews ?? 0).toLocaleString('ar-SA'), color: 'text-cyan-400' },
                  ].map((card, i) => (
                    <div key={i} className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <card.icon className={`w-6 h-6 ${card.color}`} />
                        <span className="text-gray-400 text-sm">{card.label}</span>
                      </div>
                      <div className="text-3xl font-black text-white">{card.value}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-5">توزيع الخطط</h3>
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { plan: 'free', label: 'مجاني', count: stats.freeDealers ?? 0, color: 'bg-gray-500' },
                      { plan: 'basic', label: 'أساسي', count: (stats as any).basicDealers ?? 0, color: 'bg-blue-500' },
                      { plan: 'pro', label: 'برو', count: stats.proDealers ?? 0, color: 'bg-purple-500' },
                      { plan: 'premium', label: 'بريميوم', count: stats.premiumDealers ?? 0, color: 'bg-[#C9A84C]' },
                    ].map(p => (
                      <div key={p.plan} className="bg-[#1a1a1a] rounded-xl p-4 text-center">
                        <div className={`w-3 h-3 rounded-full ${p.color} mx-auto mb-2`} />
                        <div className="text-2xl font-black text-white">{p.count}</div>
                        <div className="text-sm text-gray-400">{p.label}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          {stats.totalDealers > 0 ? Math.round((p.count / stats.totalDealers) * 100) : 0}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* ── Dealers ── */}
        {activeTab === 'dealers' && (
          <div className="space-y-5">
            <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4">
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-48">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="text" placeholder="ابحث بالاسم..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pr-10 pl-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#C9A84C] text-sm" />
                </div>
                <select value={planFilter} onChange={e => setPlanFilter(e.target.value)}
                  className="px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white focus:outline-none focus:border-[#C9A84C] text-sm">
                  <option value="">كل الخطط</option>
                  <option value="free">مجاني</option>
                  <option value="basic">أساسي</option>
                  <option value="pro">برو</option>
                  <option value="premium">بريميوم</option>
                </select>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                  className="px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white focus:outline-none focus:border-[#C9A84C] text-sm">
                  <option value="">كل الحالات</option>
                  <option value="pending">قيد المراجعة</option>
                  <option value="active">نشط</option>
                  <option value="suspended">موقوف</option>
                  <option value="rejected">مرفوض</option>
                </select>
              </div>
            </div>
            {dealersLoading ? (
              <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="bg-[#111] rounded-xl h-20 animate-pulse border border-[#1e1e1e]" />)}</div>
            ) : (
              <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-[#1e1e1e]">
                  <span className="font-bold text-white">{dealers.length} معرض</span>
                </div>
                <div className="divide-y divide-[#1e1e1e]">
                  {dealers.map(dealer => (
                    <div key={dealer.id} className="p-4 flex items-center gap-4 hover:bg-[#1a1a1a] transition-colors">
                     <div className="w-12 h-12 rounded-xl bg-[#C9A84C]/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {(dealer as any).logo ? <img src={(dealer as any).logo} alt="" className="w-full h-full object-cover" /> : <Car className="w-6 h-6 text-[#C9A84C]" />}
                     </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white truncate">{dealer.name}</span>
                          {dealer.isVerified && <BadgeCheck className="w-4 h-4 text-[#C9A84C] flex-shrink-0" />}
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${STATUS_COLORS[(dealer as any).status ?? 'pending']}`}>
                            {STATUS_LABELS[(dealer as any).status ?? 'pending']}
                          </span>
                        </div>
                        <div className="text-sm text-gray-400">{dealer.city} • {dealer.phone}</div>
                      </div>
                      <span className={`px-3 py-1 rounded-full border text-xs font-bold flex-shrink-0 ${PLAN_COLORS[dealer.plan ?? 'free']}`}>
                        {dealer.plan === 'premium' ? 'بريميوم' : dealer.plan === 'pro' ? 'برو' : dealer.plan === 'basic' ? 'أساسي' : 'مجاني'}
                      </span>
                      <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                        <select value={(dealer as any).status ?? 'pending'}
                          onChange={e => updateStatusMutation.mutate({ id: dealer.id, status: e.target.value as any })}
                          className="px-2 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-xs text-white focus:outline-none focus:border-[#C9A84C]">
                          <option value="pending">قيد المراجعة</option>
                          <option value="active">نشط</option>
                          <option value="suspended">موقوف</option>
                          <option value="rejected">مرفوض</option>
                        </select>
                        <select value={dealer.plan ?? 'free'}
                          onChange={e => updatePlanMutation.mutate({ id: dealer.id, plan: e.target.value as any })}
                          className="px-2 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-xs text-white focus:outline-none focus:border-[#C9A84C]">
                          <option value="free">مجاني</option>
                          <option value="basic">أساسي</option>
                          <option value="pro">برو</option>
                          <option value="premium">بريميوم</option>
                        </select>
                        <Link href={`/dealer/${dealer.slug}`}>
                          <button className="w-8 h-8 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center hover:border-[#C9A84C] transition-all">
                            <Eye className="w-3.5 h-3.5 text-gray-400" />
                          </button>
                        </Link>
                        <button onClick={() => { if (confirm('هل أنت متأكد من حذف هذا المعرض؟')) deleteDealerMutation.mutate({ id: dealer.id }); }}
                          className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center hover:bg-red-500/20 transition-all">
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {dealers.length === 0 && (
                    <div className="p-12 text-center">
                      <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">لا توجد معارض</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Vehicles ── */}
        {activeTab === 'vehicles' && (
          <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-[#1e1e1e]">
              <span className="font-bold text-white">{allVehicles.length} سيارة</span>
            </div>
            {vehiclesLoading ? (
              <div className="p-8 text-center text-gray-400">جاري التحميل...</div>
            ) : (
              <div className="divide-y divide-[#1e1e1e]">
                {(allVehicles as any[]).map((v: any) => {
                  let imgs: string[] = [];
                  try { imgs = JSON.parse(v.images ?? '[]'); } catch {}
                  return (
                    <div key={v.id} className="p-4 flex items-center gap-4 hover:bg-[#1a1a1a] transition-colors">
                      <div className="w-14 h-10 rounded-lg bg-[#1a1a1a] flex items-center justify-center overflow-hidden flex-shrink-0">
                        {imgs[0] ? <img src={imgs[0]} alt="" className="w-full h-full object-cover" /> : <Car className="w-5 h-5 text-gray-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-sm">{v.brand} {v.model} {v.year}</p>
                        <p className="text-xs text-gray-400">{v.price?.toLocaleString('ar-SA')} ريال • {v.city ?? '—'}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${v.condition === 'new' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {v.condition === 'new' ? 'جديدة' : 'مستعملة'}
                      </span>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${v.status === 'available' ? 'bg-blue-500/20 text-blue-400' : v.status === 'sold' ? 'bg-gray-500/20 text-gray-400' : 'bg-orange-500/20 text-orange-400'}`}>
                        {v.status === 'available' ? 'متاحة' : v.status === 'sold' ? 'مباعة' : 'محجوزة'}
                      </span>
                    </div>
                  );
                })}
                {allVehicles.length === 0 && (
                  <div className="p-12 text-center">
                    <Car className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">لا توجد سيارات</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Users ── */}
        {activeTab === 'users' && (
          <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-[#1e1e1e]">
              <span className="font-bold text-white">{allUsers.length} مستخدم</span>
            </div>
            {usersLoading ? (
              <div className="p-8 text-center text-gray-400">جاري التحميل...</div>
            ) : (
              <div className="divide-y divide-[#1e1e1e]">
                {(allUsers as any[]).map((u: any) => (
                  <div key={u.id} className="p-4 flex items-center gap-4 hover:bg-[#1a1a1a] transition-colors">
                    <div className="w-10 h-10 rounded-full bg-[#C9A84C]/20 flex items-center justify-center font-black text-[#C9A84C] flex-shrink-0">
                      {u.name?.charAt(0) ?? 'م'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-sm">{u.name ?? '—'}</p>
                      <p className="text-xs text-gray-400" dir="ltr">{u.whatsapp ?? 'واتساب غير مسجل'} {u.email ? ` • ${u.email}` : ''}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${u.role === 'admin' ? 'bg-[#C9A84C]/20 text-[#C9A84C]' : 'bg-gray-500/20 text-gray-400'}`}>
                      {u.role === 'admin' ? 'أدمن' : 'مستخدم'}
                    </span>
                    <div className="flex gap-1.5 flex-shrink-0">
                      {u.role !== 'admin' ? (
                        <button onClick={() => updateUserRoleMutation.mutate({ id: u.id, role: 'admin' })}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#C9A84C]/20 text-[#C9A84C] hover:bg-[#C9A84C]/30 transition-colors">
                          <UserCheck className="w-3.5 h-3.5" /> ترقية لأدمن
                        </button>
                      ) : u.id !== user?.id ? (
                        <button onClick={() => updateUserRoleMutation.mutate({ id: u.id, role: 'user' })}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                          <UserX className="w-3.5 h-3.5" /> إزالة الأدمن
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
                {allUsers.length === 0 && (
                  <div className="p-12 text-center">
                    <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">لا يوجد مستخدمون</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Vehicle Requests ── */}
        {activeTab === 'vehicleRequests' && (
          <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-[#1e1e1e] flex items-center justify-between gap-3">
              <div><span className="font-bold text-white">{vehicleRequests.length} طلب سيارة</span><p className="mt-1 text-xs text-gray-500">كل طلب يظهر مرة واحدة مع محتواه ومعلومات المستخدم الذي أرسله.</p></div>
              <ClipboardList className="text-[#C9A84C]" size={22} />
            </div>
            {vehicleRequestsLoading ? <div className="p-8 text-center text-gray-400">جاري التحميل...</div> : (
              <div className="divide-y divide-[#1e1e1e]">
                {(vehicleRequests as any[]).map((request: any) => {
                  let models: string[] = [];
                  try { models = Array.isArray(request.models) ? request.models : JSON.parse(request.models || '[]'); } catch { models = []; }
                  const budget = request.targetPrice ? `ميزانية قصوى ${Number(request.targetPrice).toLocaleString('ar-SA')} ر.س` : request.minPrice || request.maxPrice ? `الميزانية من ${request.minPrice ? Number(request.minPrice).toLocaleString('ar-SA') : '—'} إلى ${request.maxPrice ? Number(request.maxPrice).toLocaleString('ar-SA') : '—'} ر.س` : 'الميزانية غير محددة';
                  return <article key={request.id} className="p-5 hover:bg-[#1a1a1a] transition-colors"><div className="flex flex-col gap-4 lg:flex-row lg:justify-between"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="font-data text-sm font-black text-[#C9A84C]">{request.requestCode}</span><span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-black text-emerald-300">موزع على {request.matchedDealers} معرضًا</span><span className="text-xs text-gray-500">{new Date(request.createdAt).toLocaleString('ar-SA')}</span></div><h3 className="mt-3 font-black text-white">{[request.brand, models.join('، '), request.trim].filter(Boolean).join(' — ') || 'طلب سيارة'}</h3><p className="mt-2 whitespace-pre-line text-sm leading-7 text-gray-300">{request.message}</p><div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-400"><span className="rounded-lg border border-white/10 px-2.5 py-1">{budget}</span>{request.minYear && <span className="rounded-lg border border-white/10 px-2.5 py-1">موديل {request.minYear}</span>}{request.condition && <span className="rounded-lg border border-white/10 px-2.5 py-1">{request.condition === 'new' ? 'جديد' : 'مستعمل'}</span>}</div></div><aside className="w-full rounded-xl border border-white/10 bg-black/20 p-4 lg:w-72"><p className="text-xs font-bold text-[#C9A84C]">معلومات المرسل</p><p className="mt-2 font-black text-white">{request.name}</p><p className="mt-2 flex items-center gap-2 text-xs text-gray-300" dir="ltr"><Phone size={13} className="text-[#C9A84C]" /> {request.senderWhatsapp ?? request.whatsapp}</p>{(request.senderEmail ?? request.email) && <p className="mt-2 flex items-center gap-2 text-xs text-gray-300" dir="ltr"><Mail size={13} className="text-[#C9A84C]" /> {request.senderEmail ?? request.email}</p>}</aside></div></article>;
                })}
                {vehicleRequests.length === 0 && <div className="p-12 text-center"><ClipboardList className="w-12 h-12 text-gray-600 mx-auto mb-3" /><p className="text-gray-400">لا توجد طلبات سيارات مرسلة</p></div>}
              </div>
            )}
          </div>
        )}

        {/* ── Inquiries ── */}
        {activeTab === 'inquiries' && (
          <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-[#1e1e1e]">
              <span className="font-bold text-white">{allInquiries.length} استفسار</span>
            </div>
            {inquiriesLoading ? (
              <div className="p-8 text-center text-gray-400">جاري التحميل...</div>
            ) : (
              <div className="divide-y divide-[#1e1e1e]">
                {(allInquiries as any[]).map((inq: any) => (
                  <div key={inq.id} className="p-4 flex items-start gap-4 hover:bg-[#1a1a1a] transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-[#C9A84C] flex items-center justify-center font-black text-black flex-shrink-0 text-sm">
                      {inq.name?.charAt(0) ?? 'م'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-white text-sm">{inq.name}</p>
                        <span className="text-xs text-gray-500">→ {inq.dealerName ?? '—'}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${inq.status === 'new' ? 'bg-blue-500/20 text-blue-400' : inq.status === 'replied' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                          {inq.status === 'new' ? 'جديد' : inq.status === 'replied' ? 'تم الرد' : 'مقروء'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{inq.phone}</p>
                      <p className="text-sm text-gray-300 mt-1 font-body">{inq.message}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {new Date(inq.createdAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))}
                {allInquiries.length === 0 && (
                  <div className="p-12 text-center">
                    <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">لا توجد استفسارات</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Contact Messages ── */}
        {activeTab === 'contactMessages' && (
          <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-[#1e1e1e] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2"><Inbox className="w-5 h-5 text-[#C9A84C]" /><span className="font-bold text-white">{contactMessages.length} رسالة تواصل</span></div>
                <p className="mt-1 text-xs text-gray-500">رسائل الزوار والعملاء المرسلة من صفحة «تواصل معنا» تصل هنا مباشرةً.</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl border border-blue-500/25 bg-blue-500/10 px-3 py-2 text-xs font-bold text-blue-200">
                <span className="flex h-2 w-2 rounded-full bg-blue-400" /> {newContactMessages} جديدة
              </div>
            </div>
            {contactMessagesLoading ? (
              <div className="p-8 text-center text-gray-400">جاري تحميل الرسائل...</div>
            ) : (
              <div className="divide-y divide-[#1e1e1e]">
                {(contactMessages as any[]).map((message: any) => (
                  <article key={message.id} className="p-5 hover:bg-[#1a1a1a] transition-colors">
                    <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/15 flex items-center justify-center font-black text-[#C9A84C] flex-shrink-0">{message.name?.charAt(0) ?? 'م'}</div>
                          <div>
                            <p className="font-black text-white">{message.name}</p>
                            <p className="mt-0.5 text-xs text-gray-500">{new Date(message.createdAt).toLocaleString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                          </div>
                          <span className={`mr-auto rounded-full border px-2.5 py-1 text-[10px] font-black ${CONTACT_STATUS_COLORS[message.status] ?? CONTACT_STATUS_COLORS.new}`}>{CONTACT_STATUS_LABELS[message.status] ?? 'جديدة'}</span>
                        </div>
                        <div className="mt-4 rounded-2xl border border-white/8 bg-black/20 p-4">
                          <p className="whitespace-pre-wrap text-sm leading-8 text-gray-200">{message.message}</p>
                        </div>
                      </div>
                      <aside className="w-full rounded-2xl border border-white/10 bg-black/20 p-4 lg:w-72">
                        <p className="text-xs font-bold text-[#C9A84C]">معلومات المرسل</p>
                        <p className="mt-3 flex items-center gap-2 text-sm text-gray-200" dir="ltr"><Phone size={14} className="text-[#C9A84C]" />{message.whatsapp}</p>
                        {message.email && <p className="mt-2 flex items-center gap-2 text-xs text-gray-300 break-all" dir="ltr"><Mail size={14} className="text-[#C9A84C]" />{message.email}</p>}
                        <label className="mt-5 block"><span className="mb-2 block text-[10px] font-bold text-gray-500">حالة المتابعة</span><select value={message.status} disabled={updateContactStatusMutation.isPending} onChange={event => updateContactStatusMutation.mutate({ id: message.id, status: event.target.value as 'new' | 'read' | 'replied' })} className="w-full rounded-lg border border-[#2a2a2a] bg-[#151515] px-2.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#C9A84C] disabled:opacity-60"><option value="new">جديدة</option><option value="read">مقروءة</option><option value="replied">تم الرد</option></select></label>
                      </aside>
                    </div>
                  </article>
                ))}
                {contactMessages.length === 0 && (
                  <div className="p-12 text-center"><Inbox className="w-12 h-12 text-gray-600 mx-auto mb-3" /><p className="text-gray-400">لا توجد رسائل تواصل حتى الآن</p><p className="mt-1 text-xs text-gray-600">ستظهر الرسائل الجديدة المرسلة من صفحة «تواصل معنا» هنا.</p></div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Reviews ── */}
        {activeTab === 'reviews' && (
          <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-[#1e1e1e] flex items-center justify-between">
              <span className="font-bold text-white">{allReviews.length} تقييم</span>
            </div>
            {reviewsLoading ? (
              <div className="p-8 text-center text-gray-400">جاري التحميل...</div>
            ) : (
              <div className="divide-y divide-[#1e1e1e]">
                {(allReviews as any[]).map((rev: any) => (
                  <div key={rev.id} className="p-4 flex items-start gap-4 hover:bg-[#1a1a1a] transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/20 flex items-center justify-center font-black text-[#C9A84C] flex-shrink-0 text-sm">
                      {rev.userName?.charAt(0) ?? 'م'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-white text-sm">{rev.userName ?? 'مجهول'}</p>
                        <span className="text-xs text-gray-500">→ {rev.dealerName ?? '—'}</span>
                        <div className="flex items-center gap-0.5">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} className={`w-3 h-3 ${s <= rev.rating ? 'text-[#C9A84C] fill-[#C9A84C]' : 'text-gray-600'}`} />
                          ))}
                        </div>
                      </div>
                      {rev.comment && <p className="text-sm text-gray-300 mt-1 font-body">{rev.comment}</p>}
                      <p className="text-xs text-gray-600 mt-1">
                        {new Date(rev.createdAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <button
                      onClick={() => { if (confirm('هل تريد حذف هذا التقييم؟')) deleteReviewMutation.mutate({ id: rev.id }); }}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all flex-shrink-0"
                      title="حذف التقييم"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {allReviews.length === 0 && (
                  <div className="p-12 text-center">
                    <Star className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">لا توجد تقييمات</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
