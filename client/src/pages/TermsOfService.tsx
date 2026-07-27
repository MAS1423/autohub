import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { FileText } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      <div className="pt-24 pb-20 container max-w-3xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'oklch(0.72 0.18 55 / 0.15)' }}>
            <FileText size={20} style={{ color: 'oklch(0.72 0.18 55)' }} />
          </div>
          <div>
            <h1 className="text-2xl font-black">شروط الاستخدام</h1>
            <p className="text-sm text-muted-foreground">آخر تحديث: يوليو 2025</p>
          </div>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground font-body">
          <section>
            <h2 className="text-base font-bold text-foreground mb-3">١. القبول بالشروط</h2>
            <p>باستخدامك لمنصة أوتو هَب، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي من هذه الشروط، يرجى عدم استخدام المنصة.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-3">٢. وصف الخدمة</h2>
            <p>أوتو هَب منصة إلكترونية تربط بين المعارض والمشترين المحتملين. نحن نوفر فضاءً للإعلان عن السيارات وعرض المعارض، ولسنا طرفاً في أي صفقة بيع أو شراء.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-3">٣. التزامات المعارض</h2>
            <ul className="list-disc list-inside space-y-1 mr-4">
              <li>تقديم معلومات صحيحة ودقيقة عن المعرض والسيارات</li>
              <li>عدم نشر محتوى مضلل أو احتيالي</li>
              <li>الالتزام بالأنظمة والقوانين المعمول بها في المملكة العربية السعودية</li>
              <li>الرد على استفسارات العملاء بشكل احترافي</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-3">٤. الخطط والاشتراكات</h2>
            <p className="mb-2">تتوفر خطط متعددة بمزايا مختلفة:</p>
            <ul className="list-disc list-inside space-y-1 mr-4">
              <li><strong className="text-foreground">مجاني:</strong> حتى 5 سيارات، ظهور أساسي</li>
              <li><strong className="text-foreground">أساسي:</strong> حتى 15 سيارة، ظهور محسّن</li>
              <li><strong className="text-foreground">احترافي:</strong> حتى 50 سيارة، أولوية في البحث</li>
              <li><strong className="text-foreground">مميز:</strong> سيارات غير محدودة، ظهور في الصفحة الرئيسية</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-3">٥. المحتوى المحظور</h2>
            <ul className="list-disc list-inside space-y-1 mr-4">
              <li>نشر معلومات كاذبة أو مضللة</li>
              <li>انتهاك حقوق الملكية الفكرية</li>
              <li>أي نشاط احتيالي أو غير قانوني</li>
              <li>إرسال رسائل غير مرغوب فيها (Spam)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-3">٦. إنهاء الحساب</h2>
            <p>نحتفظ بالحق في إيقاف أو حذف أي حساب يخالف هذه الشروط، دون الحاجة لإشعار مسبق.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-3">٧. تحديد المسؤولية</h2>
            <p>أوتو هَب غير مسؤولة عن أي خسائر ناتجة عن المعاملات التجارية بين المعارض والعملاء. نحن نوفر المنصة فقط كوسيط.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-3">٨. التواصل معنا</h2>
            <p>لأي استفسارات، يرجى التواصل عبر: <span className="text-foreground font-semibold">support@autohub.sa</span></p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}

