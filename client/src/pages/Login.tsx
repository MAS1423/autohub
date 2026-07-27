import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { KeyRound, Phone, UserRound } from 'lucide-react';
import { toast } from 'sonner';

const DEMO_ACCOUNTS = [
  { label: 'مدير النظام', email: 'admin@autohub.sa', password: 'admin123', accent: 'bg-amber-50 border-amber-200' },
  { label: 'حساب معرض', email: 'dealer@autohub.sa', password: 'dealer123', accent: 'bg-sky-50 border-sky-200' },
  { label: 'مستخدم تجريبي', email: 'user@autohub.sa', password: 'user123', accent: 'bg-emerald-50 border-emerald-200' },
] as const;

type LoginMode = 'business' | 'customer';

export default function Login() {
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<LoginMode>('business');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(false);

  const finishLogin = (data: any) => {
    toast.success('تم تسجيل الدخول بنجاح!');
    const params = new URLSearchParams(window.location.search);
    const requestedRedirect = params.get('redirect');
    const safeRequestedRedirect = requestedRedirect?.startsWith('/') && !requestedRedirect.startsWith('//') ? requestedRedirect : null;
    const redirect = typeof data.postLoginPath === 'string' ? data.postLoginPath : (safeRequestedRedirect || '/');
    navigate(redirect);
    window.location.href = redirect;
  };

  const fillDemoAccount = (account: typeof DEMO_ACCOUNTS[number]) => {
    setMode('business');
    setEmail(account.email);
    setPassword(account.password);
    toast.info(`تم إدخال بيانات ${account.label}. اضغط دخول للمتابعة.`);
  };

  const handleBusinessLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || !password) { toast.error('يرجى ملء البريد وكلمة المرور'); return; }
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ email, password }) });
      const data = await response.json();
      if (!response.ok) { toast.error(data.error === 'Invalid email or password' ? 'بيانات الدخول غير صحيحة.' : (data.error || 'فشل تسجيل الدخول')); return; }
      finishLogin(data);
    } catch { toast.error('حدث خطأ، يرجى المحاولة مرة أخرى'); } finally { setLoading(false); }
  };

  const handleCustomerLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedWhatsapp = whatsapp.replace(/[\s()-]/g, '').trim();
    if (normalizedWhatsapp.length < 9) { toast.error('يرجى إدخال رقم واتساب صحيح.'); return; }
    setLoading(true);
    try {
      const response = await fetch('/api/auth/customer-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ whatsapp: normalizedWhatsapp }) });
      const data = await response.json();
      if (!response.ok) { toast.error(data.error === 'Customer account not found' ? 'لا يوجد حساب بهذا الرقم. أنشئ حسابك من صفحة طلب السيارة.' : (data.error || 'تعذر تسجيل الدخول')); return; }
      finishLogin(data);
    } catch { toast.error('حدث خطأ، يرجى المحاولة مرة أخرى'); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex" dir="rtl">
      <div className="hidden lg:flex lg:w-1/2 autohub-dark flex-col justify-between p-12 relative overflow-hidden"><div className="absolute inset-0 opacity-20"><div className="w-full h-full bg-gradient-to-br from-amber-900 to-zinc-900" /></div><div className="relative z-10"><Link href="/" className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center"><span className="text-black font-black text-lg">أ</span></div><span className="text-white font-black text-2xl" style={{ fontFamily: 'Cairo' }}>أوتو <span style={{ color: 'oklch(0.72 0.18 55)' }}>هَب</span></span></Link></div><div className="relative z-10"><h2 className="text-4xl font-black text-white mb-4">مرحبًا بعودتك</h2><p className="text-white/50 font-body leading-relaxed max-w-sm">سجّل دخولك لإدارة معرضك، أو لمراجعة طلبات السيارة التي أرسلتها ومفضلتك.</p></div><div className="relative z-10 text-white/30 text-xs font-body">© 2025 أوتو هَب</div></div>
      <div className="flex-1 flex items-center justify-center p-6 bg-background"><div className="w-full max-w-sm"><div className="lg:hidden flex items-center gap-3 mb-8"><div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center"><span className="text-black font-black">أ</span></div><span className="font-black text-xl" style={{ fontFamily: 'Cairo' }}>أوتو <span style={{ color: 'oklch(0.72 0.18 55)' }}>هَب</span></span></div><h1 className="text-2xl font-black mb-1">تسجيل الدخول</h1><p className="text-muted-foreground text-sm mb-6 font-body">اختر طريقة الدخول المناسبة لحسابك.</p>
        <div className="grid grid-cols-2 rounded-xl border border-border bg-muted/50 p-1"><button type="button" onClick={() => setMode('business')} className={`rounded-lg px-3 py-2.5 text-xs font-black transition ${mode === 'business' ? 'bg-[#C9A84C] text-black shadow-sm' : 'text-muted-foreground'}`}><KeyRound className="mx-auto mb-1" size={15} />معرض / إدارة</button><button type="button" onClick={() => setMode('customer')} className={`rounded-lg px-3 py-2.5 text-xs font-black transition ${mode === 'customer' ? 'bg-[#C9A84C] text-black shadow-sm' : 'text-muted-foreground'}`}><UserRound className="mx-auto mb-1" size={15} />عميل</button></div>
        {mode === 'business' ? <><form onSubmit={handleBusinessLogin} className="mt-6 space-y-4"><div><label className="block text-sm font-semibold mb-1.5">البريد الإلكتروني</label><input value={email} onChange={event => setEmail(event.target.value)} placeholder="example@email.com" dir="ltr" type="email" className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary" /></div><div><label className="block text-sm font-semibold mb-1.5">كلمة المرور</label><input value={password} onChange={event => setPassword(event.target.value)} placeholder="••••••••" type="password" className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary" /></div><button type="submit" disabled={loading} className="btn-gold w-full py-3.5 rounded-xl font-bold mt-2 disabled:opacity-60">{loading ? 'جارٍ الدخول...' : 'دخول'}</button></form><div className="mt-6 rounded-2xl border border-border bg-muted/60 p-4 font-body"><div className="mb-3 flex items-start justify-between gap-3"><div><p className="font-black text-sm text-foreground">حسابات تجريبية جاهزة</p><p className="mt-1 text-xs leading-5 text-muted-foreground">اختر حسابًا لملء البريد وكلمة المرور تلقائيًا.</p></div><span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-black text-emerald-700">محلي</span></div><div className="grid gap-2">{DEMO_ACCOUNTS.map(account => <button key={account.email} type="button" onClick={() => fillDemoAccount(account)} className={`group flex items-center justify-between gap-3 rounded-xl border p-3 text-start transition hover:-translate-y-0.5 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 ${account.accent}`}><span className="font-bold text-xs text-foreground">{account.label}</span><span className="font-mono text-[10px] text-muted-foreground transition group-hover:text-foreground">استخدم هذا الحساب</span></button>)}</div></div><p className="text-center text-sm text-muted-foreground mt-6 font-body">ليس لديك حساب معرض؟ <Link href="/register" className="font-bold" style={{ color: 'oklch(0.72 0.18 55)' }}>سجّل معرضك مجانًا</Link></p></> : <><form onSubmit={handleCustomerLogin} className="mt-6 space-y-4"><div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-950">لدخول العميل في هذه البيئة المحلية، استخدم رقم واتساب الذي سجّلت به عند إرسال طلب السيارة.</div><div><label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold"><Phone size={15} /> رقم واتساب</label><input value={whatsapp} onChange={event => setWhatsapp(event.target.value)} placeholder="05xxxxxxxx" dir="ltr" type="tel" className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary" /></div><button type="submit" disabled={loading} className="btn-gold w-full py-3.5 rounded-xl font-bold disabled:opacity-60">{loading ? 'جارٍ الدخول...' : 'دخول إلى حسابي'}</button></form><div className="mt-6 rounded-2xl border border-border bg-muted/60 p-4 text-center"><UserRound className="mx-auto text-[#C9A84C]" size={24} /><p className="mt-3 text-sm font-black">لا تملك حساب عميل بعد؟</p><p className="mt-1 text-xs leading-5 text-muted-foreground">أرسل طلب سيارة وسينشأ حسابك بالاسم ورقم واتساب في خطوة واحدة.</p><Link href="/vehicle-request" className="mt-4 inline-flex rounded-xl bg-[#C9A84C] px-4 py-2.5 text-sm font-black text-black">إرسال طلب سيارة</Link></div></>}
      </div></div>
    </div>
  );
}
