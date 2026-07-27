import { useState } from 'react';
import {
  CheckCircle2, Clock3, Mail, MapPin, MessageCircleMore,
  Phone, Send, ShieldCheck, UserRound,
} from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { trpc } from '@/lib/trpc';
import { useI18n } from '@/lib/i18n';

type ContactFormState = {
  name: string;
  whatsapp: string;
  email: string;
  message: string;
};

const EMPTY_FORM: ContactFormState = { name: '', whatsapp: '', email: '', message: '' };

export default function ContactPage() {
  const { lang, isRTL } = useI18n();
  const [form, setForm] = useState<ContactFormState>(EMPTY_FORM);
  const [sent, setSent] = useState(false);
  const isArabic = lang === 'ar';

  const sendMessage = trpc.contact.send.useMutation({
    onSuccess: () => {
      setSent(true);
      setForm(EMPTY_FORM);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: error => toast.error(error.message || (isArabic ? 'تعذر إرسال رسالتك. حاول مرة أخرى.' : 'We could not send your message. Please try again.')),
  });

  function updateField<Key extends keyof ContactFormState>(field: Key, value: ContactFormState[Key]) {
    setForm(current => ({ ...current, [field]: value }));
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = form.name.trim();
    const whatsapp = form.whatsapp.trim();
    const email = form.email.trim();
    const message = form.message.trim();

    if (name.length < 2 || whatsapp.length < 9 || message.length < 10) {
      toast.error(isArabic ? 'أكمل الاسم ورقم الواتساب ورسالة لا تقل عن 10 أحرف.' : 'Please complete your name, WhatsApp number, and a message of at least 10 characters.');
      return;
    }

    sendMessage.mutate({ name, whatsapp, email, message });
  }

  return (
    <div className="min-h-screen bg-[#08090b] text-white" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />
      <main>
        <section className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_85%_15%,rgba(201,168,76,.28),transparent_32%),radial-gradient(circle_at_12%_72%,rgba(36,119,171,.15),transparent_26%),linear-gradient(180deg,#12161d,#08090b)] pb-16 pt-28">
          <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'linear-gradient(45deg, #d6b55b 1px, transparent 1px), linear-gradient(-45deg, #d6b55b 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
          <div className="relative mx-auto max-w-7xl px-4">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#C9A84C]/35 bg-[#C9A84C]/10 px-3 py-1.5 text-xs font-bold text-[#f0d886]">
                <MessageCircleMore size={14} />
                {isArabic ? 'فريق AutoHub جاهز لمساعدتك' : 'The AutoHub team is ready to help'}
              </div>
              <h1 className="text-4xl font-black leading-tight md:text-6xl">{isArabic ? 'تواصل معنا، ونعود إليك سريعًا' : 'Contact us, and we will get back to you promptly'}</h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/65 md:text-lg">{isArabic ? 'أرسل استفسارك أو اقتراحك إلى فريق المنصة مباشرةً. تُحفظ الرسالة في لوحة المتابعة لدى مدير النظام لضمان مراجعتها.' : 'Send your question or suggestion directly to the platform team. Every message is saved in the system administrator follow-up dashboard.'}</p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12">
          {sent ? (
            <div className="mx-auto max-w-2xl rounded-3xl border border-emerald-400/30 bg-emerald-400/[0.07] p-7 text-center shadow-2xl shadow-black/25 md:p-12">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-400 text-black shadow-[0_0_0_12px_rgba(74,222,128,.1)]"><CheckCircle2 size={42} /></div>
              <h2 className="mt-7 text-3xl font-black">{isArabic ? 'تم إرسال رسالتك بنجاح' : 'Your message has been sent'}</h2>
              <p className="mx-auto mt-4 max-w-lg text-sm leading-8 text-emerald-50/75">{isArabic ? 'شكرًا لتواصلك مع AutoHub. وصلت رسالتك إلى قسم المتابعة لدى مدير النظام، وسيتواصل معك الفريق عبر واتساب أو البريد الإلكتروني عند الحاجة.' : 'Thank you for contacting AutoHub. Your message has reached the administrator follow-up queue, and the team will contact you by WhatsApp or email when needed.'}</p>
              <button type="button" onClick={() => setSent(false)} className="mt-8 rounded-xl bg-[#C9A84C] px-6 py-3 text-sm font-black text-black transition hover:bg-[#e3c56e]">{isArabic ? 'إرسال رسالة أخرى' : 'Send another message'}</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.25fr_.75fr]">
              <form onSubmit={submit} className="rounded-3xl border border-white/10 bg-[#11151c] p-5 shadow-2xl shadow-black/25 md:p-7">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#C9A84C] text-black"><Send size={21} /></div>
                  <div>
                    <h2 className="text-2xl font-black">{isArabic ? 'اكتب رسالتك' : 'Write your message'}</h2>
                    <p className="mt-1 text-sm leading-6 text-white/50">{isArabic ? 'الاسم ورقم الواتساب مطلوبان لنتمكن من متابعة رسالتك، والبريد الإلكتروني اختياري.' : 'Your name and WhatsApp number are required so we can follow up. Email is optional.'}</p>
                  </div>
                </div>

                <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 flex items-center gap-1.5 text-xs font-bold text-white/55"><UserRound size={13} /> {isArabic ? 'الاسم' : 'Name'} <span className="text-rose-300">*</span></span>
                    <input required minLength={2} autoComplete="name" value={form.name} onChange={event => updateField('name', event.target.value)} placeholder={isArabic ? 'اسمك الكريم' : 'Your name'} className="h-12 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm font-bold text-white placeholder:text-white/30 outline-none transition focus:border-[#C9A84C]" />
                  </label>
                  <label className="block">
                    <span className="mb-2 flex items-center gap-1.5 text-xs font-bold text-white/55"><Phone size={13} /> {isArabic ? 'رقم واتساب' : 'WhatsApp number'} <span className="text-rose-300">*</span></span>
                    <input required minLength={9} type="tel" autoComplete="tel" value={form.whatsapp} onChange={event => updateField('whatsapp', event.target.value)} placeholder="05xxxxxxxx" dir="ltr" className="h-12 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm font-bold text-white placeholder:text-white/30 outline-none transition focus:border-[#C9A84C]" />
                  </label>
                </div>

                <label className="mt-4 block">
                  <span className="mb-2 flex items-center gap-1.5 text-xs font-bold text-white/55"><Mail size={13} /> {isArabic ? 'البريد الإلكتروني' : 'Email'} <span className="text-white/35">({isArabic ? 'اختياري' : 'optional'})</span></span>
                  <input type="email" autoComplete="email" value={form.email} onChange={event => updateField('email', event.target.value)} placeholder="name@email.com" dir="ltr" className="h-12 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm font-bold text-white placeholder:text-white/30 outline-none transition focus:border-[#C9A84C]" />
                </label>

                <label className="mt-4 block">
                  <span className="mb-2 flex items-center justify-between gap-3 text-sm font-black"><span>{isArabic ? 'نص الرسالة' : 'Message'} <span className="text-rose-300">*</span></span><span className="text-xs font-normal text-white/35">{form.message.length}/2000</span></span>
                  <textarea required minLength={10} maxLength={2000} value={form.message} onChange={event => updateField('message', event.target.value)} placeholder={isArabic ? 'كيف يمكننا مساعدتك؟ اكتب تفاصيل استفسارك أو اقتراحك هنا...' : 'How can we help? Write your question or suggestion here...'} className="min-h-44 w-full resize-y rounded-2xl border border-white/10 bg-black/25 p-4 text-sm leading-7 text-white placeholder:text-white/30 outline-none transition focus:border-[#C9A84C]" />
                  <p className="mt-2 text-xs leading-6 text-white/38">{isArabic ? 'يرجى عدم إرسال بيانات حساسة مثل كلمات المرور أو معلومات البطاقات.' : 'Please do not send sensitive information such as passwords or card details.'}</p>
                </label>

                <button disabled={sendMessage.isPending} type="submit" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#C9A84C] px-5 py-3.5 text-sm font-black text-black shadow-lg shadow-[#C9A84C]/15 transition hover:bg-[#e3c56e] disabled:cursor-not-allowed disabled:opacity-60"><Send size={17} />{sendMessage.isPending ? (isArabic ? 'يجري إرسال الرسالة...' : 'Sending message...') : (isArabic ? 'إرسال الرسالة' : 'Send message')}</button>
              </form>

              <aside className="space-y-5 lg:sticky lg:top-24 lg:h-fit">
                <div className="rounded-3xl border border-[#C9A84C]/30 bg-[linear-gradient(145deg,rgba(201,168,76,.15),rgba(17,21,28,.96)_48%)] p-5 shadow-xl shadow-black/20">
                  <h2 className="text-xl font-black">{isArabic ? 'ماذا يحدث بعد الإرسال؟' : 'What happens after you send?'}</h2>
                  <div className="mt-5 space-y-4">
                    <div className="flex items-start gap-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#C9A84C] text-xs font-black text-black">1</div><p className="pt-1 text-sm leading-6 text-white/65">{isArabic ? 'تصل الرسالة إلى قسم رسائل التواصل في لوحة مدير النظام.' : 'Your message arrives in the administrator contact-message queue.'}</p></div>
                    <div className="flex items-start gap-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#C9A84C] text-xs font-black text-black">2</div><p className="pt-1 text-sm leading-6 text-white/65">{isArabic ? 'يراجع الفريق محتواها ويحدّث حالة المتابعة.' : 'The team reviews it and updates its follow-up status.'}</p></div>
                    <div className="flex items-start gap-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#C9A84C] text-xs font-black text-black">3</div><p className="pt-1 text-sm leading-6 text-white/65">{isArabic ? 'نتواصل معك عبر واتساب أو البريد عند الحاجة.' : 'We contact you by WhatsApp or email when needed.'}</p></div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-[#11151c] p-5">
                  <h2 className="text-xl font-black">{isArabic ? 'معلومات المنصة' : 'Platform information'}</h2>
                  <div className="mt-4 space-y-3 text-sm text-white/60">
                    <p className="flex items-center gap-2"><Phone size={15} className="text-[#e7ca72]" /><span dir="ltr">+966 11 000 0000</span></p>
                    <p className="flex items-center gap-2"><Mail size={15} className="text-[#e7ca72]" /><span dir="ltr">info@autohub.sa</span></p>
                    <p className="flex items-center gap-2"><MapPin size={15} className="text-[#e7ca72]" />{isArabic ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia'}</p>
                    <p className="flex items-center gap-2"><Clock3 size={15} className="text-[#e7ca72]" />{isArabic ? 'السبت–الخميس، 9 ص–6 م' : 'Sunday–Thursday, 9 AM–6 PM'}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-emerald-300" size={20} /><div><p className="text-sm font-black text-emerald-100">{isArabic ? 'متابعة منظمة وآمنة' : 'Organized, secure follow-up'}</p><p className="mt-1 text-xs leading-6 text-emerald-100/65">{isArabic ? 'لا تُنشر بياناتك في المنصة؛ تستخدم فقط للرد على استفسارك.' : 'Your details are not published on the platform; they are used only to respond to your inquiry.'}</p></div></div></div>
              </aside>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
