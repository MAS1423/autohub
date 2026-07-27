// AutoHub Header — Bilingual (AR/EN), Precision Automotive Theme
import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X, Heart, GitCompareArrows, Globe, Search, LayoutDashboard, ChevronDown, LogOut, Store, Bell } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useCompare } from '@/contexts/CompareContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { startLogin } from '@/const';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [location, navigate] = useLocation();
  const isHome = location === '/';
  const { t, lang, setLang, isRTL } = useI18n();
  const { compareList } = useCompare();
  const { favorites } = useFavorites();
  const { user, isAuthenticated, logout } = useAuth();
  const { data: myDealer } = trpc.dashboard.myDealer.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });
  const { data: unreadData } = trpc.notifications.unreadCount.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });
  const { data: notifList, refetch: refetchNotifs } = trpc.notifications.list.useQuery(undefined, {
    enabled: isAuthenticated && notifOpen,
  });
  const utils = trpc.useUtils();
  const markReadMutation = trpc.notifications.markRead.useMutation({
    onSuccess: () => {
      refetchNotifs();
      utils.notifications.unreadCount.invalidate();
    },
  });
  const unreadCount = unreadData?.count ?? 0;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { labelKey: 'nav_home', href: '/' },
    { labelKey: 'nav_dealers', href: '/dealers' },
    { labelKey: 'nav_vehicles', href: '/vehicles' },
  ] as const;

  const searchLink = { labelKey: 'search', href: '/search' };

  const headerBg = isHome && !scrolled
    ? 'bg-transparent'
    : 'bg-[oklch(0.12_0.01_260)]/95 backdrop-blur-xl shadow-lg shadow-black/20';

  const gold = 'oklch(0.72 0.18 55)';

  const handleLogout = async () => {
    setUserMenuOpen(false);
    setMenuOpen(false);
    try {
      await logout();
    } finally {
      navigate('/login?loggedOut=1');
    }
  };

  return (
    <header className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${headerBg}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0">
              <img src="/assets/logo-icon.png" alt="أوتو هَب" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-white font-black text-xl tracking-tight" style={{ fontFamily: 'Cairo' }}>
                {lang === 'ar' ? <>أوتو <span style={{ color: gold }}>هَب</span></> : <>Auto<span style={{ color: gold }}>Hub</span></>}
              </span>
              <span className="text-white/50 text-[10px] font-medium">
                {lang === 'ar' ? 'دليل المعارض الموثوقة' : 'Trusted Dealer Directory'}
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                  location === link.href
                    ? 'text-[oklch(0.72_0.18_55)] bg-white/10'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {t(link.labelKey)}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-2">
            {/* Search */}
            <Link href="/search" className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
              location === '/search' ? 'text-[oklch(0.72_0.18_55)] bg-white/10' : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}>
              <Search size={15} />
              <span className="hidden lg:inline">{lang === 'ar' ? 'بحث' : 'Search'}</span>
            </Link>

            {/* Language Toggle */}
            <button
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all text-sm font-bold"
              title={lang === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
            >
              <Globe size={15} />
              <span>{lang === 'ar' ? 'EN' : 'عر'}</span>
            </button>

            {/* Saved items: names, counts, and active state remain visible rather than icon-only. */}
            <Link href="/favorites" aria-label={lang === 'ar' ? `المفضلة: ${favorites.length} عناصر` : `Favorites: ${favorites.length} items`}
              className={`group flex items-center gap-2 rounded-xl border px-2.5 py-2 text-sm font-black transition-all ${location === '/favorites' ? 'border-rose-300/70 bg-rose-500/15 text-rose-100' : 'border-white/10 bg-white/[0.04] text-white/80 hover:border-rose-300/60 hover:bg-rose-500/10 hover:text-white'}`}>
              <Heart size={17} className={favorites.length > 0 ? 'fill-rose-400 text-rose-400' : 'text-white/75 group-hover:text-rose-300'} />
              <span className="hidden lg:inline">{lang === 'ar' ? 'المفضلة' : 'Favorites'}</span>
              <span className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] font-black ${favorites.length > 0 ? 'bg-rose-400 text-black' : 'bg-white/10 text-white/60'}`}>{favorites.length}</span>
            </Link>

            <Link href="/compare" aria-label={lang === 'ar' ? `مقارنة السيارات: ${compareList.length} من 3` : `Compare cars: ${compareList.length} of 3`}
              className={`group flex items-center gap-2 rounded-xl border px-2.5 py-2 text-sm font-black transition-all ${location === '/compare' ? 'border-[#C9A84C] bg-[#C9A84C]/15 text-[#f6df94]' : 'border-white/10 bg-white/[0.04] text-white/80 hover:border-[#C9A84C]/70 hover:bg-[#C9A84C]/10 hover:text-white'}`}>
              <GitCompareArrows size={17} className={compareList.length > 0 ? 'text-[#f0d886]' : 'text-white/75 group-hover:text-[#f0d886]'} />
              <span className="hidden lg:inline">{lang === 'ar' ? 'قارن السيارات' : 'Compare'}</span>
              <span className={`min-w-7 rounded-full px-1.5 py-0.5 text-center text-[10px] font-black ${compareList.length > 0 ? 'bg-[#C9A84C] text-black' : 'bg-white/10 text-white/60'}`}>{compareList.length}/3</span>
            </Link>

            {/* Notifications Bell (only when logged in) */}
            {isAuthenticated && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) refetchNotifs(); }}
                  className="relative flex items-center justify-center w-9 h-9 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -end-1 w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center text-black"
                      style={{ background: gold }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute top-full mt-2 end-0 w-80 bg-[oklch(0.14_0.01_260)] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                      <span className="text-sm font-black text-white">{lang === 'ar' ? 'الإشعارات' : 'Notifications'}</span>
                      {unreadCount > 0 && (
                        <button onClick={() => markReadMutation.mutate({})}
                          className="text-xs font-semibold" style={{ color: gold }}>
                          {lang === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all read'}
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {!notifList?.length ? (
                        <div className="py-8 text-center text-white/40 text-sm">
                          <Bell size={24} className="mx-auto mb-2 opacity-30" />
                          {lang === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}
                        </div>
                      ) : notifList.map((n: any) => (
                        <div key={n.id}
                          className={`px-4 py-3 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${!n.isRead ? 'bg-white/5' : ''}`}
                          onClick={() => !n.isRead && markReadMutation.mutate({ ids: [n.id] })}>
                          <div className="flex items-start gap-2">
                            {!n.isRead && <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: gold }} />}
                            <div className={!n.isRead ? '' : 'ms-4'}>
                              <p className="text-xs font-bold text-white">{n.title}</p>
                              {n.body && <p className="text-xs text-white/50 mt-0.5 line-clamp-2">{n.body}</p>}
                              <p className="text-[10px] text-white/30 mt-1">{new Date(n.createdAt).toLocaleString('ar-SA')}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {isAuthenticated && user ? (
              /* User is logged in */
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  onBlur={() => setTimeout(() => setUserMenuOpen(false), 150)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-all text-sm font-semibold text-white/90"
                >
                  <div className="w-7 h-7 rounded-full bg-[oklch(0.72_0.18_55)] flex items-center justify-center text-black text-xs font-black">
                    {user.name?.[0] ?? user.email?.[0] ?? '؟'}
                  </div>
                  <span className="hidden lg:inline max-w-[100px] truncate">{user.name ?? user.email}</span>
                  <ChevronDown size={13} className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {userMenuOpen && (
                  <div className="absolute top-full mt-1 end-0 w-52 bg-[oklch(0.14_0.01_260)] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-xs text-white/50">{lang === 'ar' ? 'مسجّل كـ' : 'Signed in as'}</p>
                      <p className="text-sm font-bold text-white truncate">{user.name ?? user.email}</p>
                    </div>
                    <Link href="/account"
                      className="flex items-center gap-2.5 border-b border-white/5 px-4 py-3 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                      onClick={() => setUserMenuOpen(false)}>
                      <LayoutDashboard size={15} />
                      {lang === 'ar' ? 'حسابي وطلباتي' : 'My account & requests'}
                    </Link>
                    {myDealer && (
                      <>
                        <button type="button" onClick={() => { setUserMenuOpen(false); navigate('/dashboard'); }}
                          className="flex w-full items-center gap-2.5 border-b border-white/5 bg-[#C9A84C]/10 px-4 py-3 text-start text-sm font-black text-[#f2dc91] transition-colors hover:bg-[#C9A84C]/20">
                          <LayoutDashboard size={15} />
                          {lang === 'ar' ? 'إدارة معرضي' : 'Manage my dealership'}
                        </button>
                        <Link href={`/dealer/${myDealer.slug}`}
                          className="flex items-center gap-2.5 border-b border-white/5 px-4 py-3 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                          onClick={() => setUserMenuOpen(false)}>
                          <Store size={15} />
                          {lang === 'ar' ? 'عرض صفحة المعرض العامة' : 'View public dealership page'}
                        </Link>
                      </>
                    )}
                    {user.role === 'admin' && (
                      <Link href="/admin"
                        className="flex items-center gap-2.5 px-4 py-3 text-sm text-amber-400 hover:text-amber-300 hover:bg-white/10 transition-colors border-b border-white/5"
                        onClick={() => setUserMenuOpen(false)}>
                        <LayoutDashboard size={15} />
                        {lang === 'ar' ? 'لوحة الإدارة' : 'Admin Panel'}
                      </Link>
                    )}
                    <button
                      onClick={() => void handleLogout()}
                      className="flex items-center gap-2.5 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-white/10 transition-colors w-full text-start"
                    >
                      <LogOut size={15} />
                      {lang === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* User is not logged in */
              <>
                <button onClick={() => startLogin()}
                  className="text-white/80 hover:text-white text-sm font-semibold transition-colors px-3 py-2">
                  {t('nav_login')}
                </button>
                <Link href="/register" className="btn-gold px-5 py-2.5 rounded-lg text-sm font-bold">
                  {t('nav_register')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile: Language + Menu */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all text-xs font-bold"
            >
              <Globe size={13} />
              {lang === 'ar' ? 'EN' : 'عر'}
            </button>
            <button
              className="text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-[oklch(0.12_0.01_260)] border-t border-white/10 px-4 pb-4">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-3 text-white/80 hover:text-white font-semibold border-b border-white/5 transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              {t(link.labelKey)}
            </Link>
          ))}
          <Link href="/favorites" className="flex items-center gap-2 py-3 text-white/80 hover:text-white font-semibold border-b border-white/5"
            onClick={() => setMenuOpen(false)}>
            <Heart size={16} /> {t('nav_favorites')} {favorites.length > 0 && `(${favorites.length})`}
          </Link>
          <Link href="/compare" className="flex items-center gap-2 py-3 text-white/80 hover:text-white font-semibold border-b border-white/5"
            onClick={() => setMenuOpen(false)}>
            <GitCompareArrows size={16} /> {t('nav_compare')} {compareList.length > 0 && `(${compareList.length})`}
          </Link>
          <Link href="/search" className="flex items-center gap-2 py-3 text-white/80 hover:text-white font-semibold border-b border-white/5"
            onClick={() => setMenuOpen(false)}>
            <Search size={16} /> {lang === 'ar' ? 'بحث السيارات' : 'Search Vehicles'}
          </Link>
          {isAuthenticated && user && (
            <Link href="/account" className="flex items-center gap-2 py-3 text-white/80 hover:text-white font-semibold border-b border-white/5"
              onClick={() => setMenuOpen(false)}>
              <LayoutDashboard size={16} /> {lang === 'ar' ? 'حسابي وطلباتي' : 'My account & requests'}
            </Link>
          )}
          {user?.role === 'admin' && (
            <Link href="/admin" className="flex items-center gap-2 py-3 text-amber-400 hover:text-amber-300 font-semibold border-b border-white/5"
              onClick={() => setMenuOpen(false)}>
              <LayoutDashboard size={16} /> {lang === 'ar' ? 'لوحة الأدمن' : 'Admin Panel'}
            </Link>
          )}
          <div className="pt-4 flex flex-col gap-2">
            {isAuthenticated && user ? (
              <>
                {myDealer && (
                  <>
                    <button type="button" onClick={() => { setMenuOpen(false); navigate('/dashboard'); }}
                      className="flex items-center justify-center gap-2 rounded-lg border border-[#C9A84C]/55 bg-[#C9A84C]/10 py-2.5 text-sm font-black text-[#f2dc91]">
                      <LayoutDashboard size={15} />
                      {lang === 'ar' ? 'إدارة معرضي' : 'Manage my dealership'}
                    </button>
                    <Link href={`/dealer/${myDealer.slug}`} className="flex items-center justify-center gap-2 rounded-lg border border-white/20 py-2.5 text-sm font-semibold text-white/70"
                      onClick={() => setMenuOpen(false)}>
                      <Store size={15} />
                      {lang === 'ar' ? 'صفحة المعرض العامة' : 'Public dealership page'}
                    </Link>
                  </>
                )}
                <button onClick={() => void handleLogout()}
                  className="py-2.5 text-red-400 border border-red-400/30 rounded-lg text-sm font-semibold flex items-center justify-center gap-2">
                  <LogOut size={15} />
                  {lang === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
                </button>
              </>
            ) : (
              <>
                <button onClick={() => { setMenuOpen(false); startLogin(); }}
                  className="text-center py-2.5 text-white/80 border border-white/20 rounded-lg text-sm font-semibold">
                  {t('nav_login')}
                </button>
                <Link href="/register" className="btn-gold text-center py-2.5 rounded-lg text-sm font-bold"
                  onClick={() => setMenuOpen(false)}>
                  {t('nav_register')}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
