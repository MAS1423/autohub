import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Shield } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      <div className="pt-24 pb-20 container max-w-3xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'oklch(0.72 0.18 55 / 0.15)' }}>
            <Shield size={20} style={{ color: 'oklch(0.72 0.18 55)' }} />
          </div>
          <div>
            <h1 className="text-2xl font-black">سياسة الخصوصية</h1>
            <p className="text-sm text-muted-foreground">آخر تحديث: يوليو 2025</p>
          </div>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground font-body">
          <section>
            <h2 className="text-base font-bold text-foreground mb-3">١. مقدمة</h2>
            <p>تلتزم منصة أوتو هَب بحماية خصوصية مستخدميها. تصف هذه السياسة كيفية جمع معلوماتك واستخدامها وحمايتها عند استخدامك لخدماتنا.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-3">٢. المعلومات التي نجمعها</h2>
            <p className="mb-2">نجمع المعلومات التالية:</p>
            <ul className="list-disc list-inside space-y-1 mr-4">
              <li>معلومات الحساب: الاسم وعنوان البريد الإلكتروني عند التسجيل</li>
              <li>معلومات المعرض: الاسم والموقع وبيانات التواصل</li>
              <li>بيانات الاستخدام: الصفحات التي تزورها والإجراءات التي تتخذها</li>
              <li>بيانات الاستفسارات: الرسائل التي ترسلها للمعارض</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-3">٣. كيف نستخدم معلوماتك</h2>
            <ul className="list-disc list-inside space-y-1 mr-4">
              <li>تشغيل المنصة وتحسين خدماتها</li>
              <li>التواصل معك بشأن حسابك أو استفساراتك</li>
              <li>تحليل استخدام المنصة لتحسين التجربة</li>
              <li>الامتثال للمتطلبات القانونية</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-3">٤. مشاركة المعلومات</h2>
            <p>لا نبيع معلوماتك الشخصية لأطراف ثالثة. قد نشارك المعلومات مع المعارض المسجّلة عند إرسال استفسار، أو عند الضرورة القانونية.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-3">٥. أمان البيانات</h2>
            <p>نستخدم تشفير SSL وإجراءات أمنية متعددة لحماية بياناتك. ومع ذلك، لا يمكن ضمان الأمان الكامل لأي نظام إلكتروني.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-3">٦. حقوقك</h2>
            <ul className="list-disc list-inside space-y-1 mr-4">
              <li>طلب الاطلاع على بياناتك الشخصية</li>
              <li>طلب تصحيح أو حذف بياناتك</li>
              <li>الاعتراض على معالجة بياناتك</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-3">٧. التواصل معنا</h2>
            <p>لأي استفسارات تتعلق بالخصوصية، يرجى التواصل معنا عبر البريد الإلكتروني: <span className="text-foreground font-semibold">privacy@autohub.sa</span></p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
