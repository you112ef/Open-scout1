# 🤖 Scout AI Platform
## منصة الذكاء الاصطناعي المتكاملة

> منصة عربية حديثة للعمل مع أقوى نماذج الذكاء الاصطناعي العالمية

[![Version](https://img.shields.io/badge/version-2.1.0-blue.svg)](https://github.com/your-repo/scout-ai-platform)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.3.5-646CFF.svg)](https://vitejs.dev/)

---

## ✨ الميزات الرئيسية

### 🧠 الذكاء الاصطناعي المتقدم
- **OpenAI** - GPT-4، DALL-E، Whisper
- **Anthropic** - Claude (جميع الإصدارات)
- **Google Gemini** - Gemini Pro
- **Hugging Face** - النماذج المفتوحة المصدر
- **Cohere** - Command، Command Light
- **Mistral AI** - Mistral Tiny، Small، Medium

### 💬 واجهة المحادثة
- البث المباشر للاستجابات
- اختيار النماذج ومقدمي الخدمة
- دعم كامل للغة العربية
- تاريخ المحادثات والجلسات

### 🛠️ أدوات التطوير
- محرر كود متقدم مع تمييز الألوان
- إدارة ملفات شاملة
- وكيل ذكي لأتمتة المهام
- إدارة المشاريع والجلسات

### 🔒 الأمان والخصوصية
- حفظ مفاتيح API محلياً فقط
- تشفير البيانات الحساسة
- عدم إرسال البيانات لخوادم خارجية
- فحص صحة الاتصال

---

## 🚀 التثبيت والتشغيل

### المتطلبات
- Node.js 18+ 
- Bun (مفضل) أو npm/yarn

### التثبيت
```bash
# استنساخ المشروع
git clone <repository-url>
cd scout-ai-platform

# تثبيت التبعيات
bun install

# تشغيل البيئة التطويرية
bun dev

# بناء للإنتاج
bun run build
```

### إعداد مفاتيح API
1. انتقل إلى تبويب "الإعدادات" في المنصة
2. أضف مفاتيح API للخدمات التي تريد استخدامها:
   - [OpenAI](https://platform.openai.com/api-keys)
   - [Anthropic](https://console.anthropic.com/)
   - [Google Gemini](https://ai.google.dev/)
   - [Hugging Face](https://huggingface.co/settings/tokens)
   - [Cohere](https://dashboard.cohere.ai/api-keys)
   - [Mistral AI](https://console.mistral.ai/)

---

## 🏗️ البنية التقنية

### التقنيات المستخدمة
- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 6.3.5
- **UI Components**: ShadCN UI + Radix
- **Styling**: Tailwind CSS V4
- **Icons**: Lucide React
- **Package Manager**: Bun

### هيكل المشروع
```
src/
├── components/          # مكونات React
│   ├── ui/             # مكونات UI الأساسية
│   ├── ChatInterface.tsx
│   ├── AgentManager.tsx
│   ├── SettingsPage.tsx
│   └── ...
├── services/           # خدمات API
│   └── ai-services.ts
├── hooks/              # React Hooks مخصصة
├── lib/                # مكتبات مساعدة
└── types/              # تعريفات TypeScript
```

### خدمات الذكاء الاصطناعي
```typescript
// مدير الخدمات الموحد
AIServiceManager
├── OpenAIService      // GPT، DALL-E، Whisper
├── AnthropicService   // Claude
├── GeminiService      // Gemini Pro
├── HuggingFaceService // النماذج المفتوحة
├── CohereService      // Command، Command Light
└── MistralService     // Mistral Tiny، Small، Medium
```

---

## 📱 الواجهات والمكونات

### 1. واجهة المحادثة 💬
- محادثة تفاعلية مع النماذج المختلفة
- اختيار مقدم الخدمة والنموذج
- البث المباشر للاستجابات
- تاريخ المحادثات

### 2. مدير الوكيل الذكي 🤖
- إنشاء مهام ذكية
- مراقبة التقدم في الوقت الفعلي
- تكامل مع خدمات AI
- إدارة الأدوات والعمليات

### 3. محرر الكود 💻
- دعم لغات متعددة
- تمييز الألوان وإكمال تلقائي
- تكامل مع AI لتحليل الكود
- حفظ وإدارة الملفات

### 4. إدارة الملفات 📁
- تصفح الملفات والمجلدات
- رفع وتحميل الملفات
- معاينة المحتوى
- تنظيم المشروع

### 5. إعدادات API 🔧
- إدارة مفاتيح الخدمات
- اختبار الاتصال
- إعدادات الأمان
- معلومات الاستخدام

---

## 🔧 التخصيص والتطوير

### إضافة مقدم خدمة جديد
```typescript
// إنشاء خدمة جديدة
class NewAIService {
  async sendMessage(messages: Message[]): Promise<string> {
    // تنفيذ الاتصال بـ API
  }
}

// إضافة للمدير الرئيسي
export class AIServiceManager {
  private newService: NewAIService;
  // ...
}
```

### تخصيص الواجهة
```css
/* تخصيص الألوان */
:root {
  --primary: your-color;
  --secondary: your-color;
}

/* تخصيص المكونات */
.custom-component {
  /* أنماط مخصصة */
}
```

---

## 🧪 الاختبار

```bash
# تشغيل الاختبارات
bun test

# اختبار البناء
bun run build

# فحص TypeScript
bun run type-check

# فحص Linting
bun run lint
```

---

## 📊 الأداء والمراقبة

### مقاييس الأداء
- زمن تحميل المكونات
- سرعة استجابة APIs
- استخدام الذاكرة
- معدل نجاح العمليات

### مراقبة الأخطاء
- رصد أخطاء الاتصال
- تتبع أخطاء JavaScript
- مراقبة أداء APIs
- تقارير الاستخدام

---

## 🔐 الأمان

### حماية البيانات
- تشفير مفاتيح API في localStorage
- عدم إرسال البيانات الحساسة للخوادم
- فحص صحة الاتصالات
- حماية من XSS و CSRF

### أفضل الممارسات
- التحقق من صحة المدخلات
- معالجة الأخطاء بأمان
- حدود معدل الطلبات
- مراجعة الكود الأمنية

---

## 🌍 التدويل (i18n)

### دعم اللغات
- العربية (افتراضي)
- الإنجليزية
- لغات إضافية (قريباً)

### إضافة لغة جديدة
```typescript
// إضافة ترجمات جديدة
const translations = {
  en: { /* English translations */ },
  ar: { /* Arabic translations */ },
  newLang: { /* New language translations */ }
};
```

---

## 📈 خريطة الطريق

### الإصدار الحالي (2.1.0)
✅ تكامل APIs الحقيقية  
✅ واجهة إعدادات شاملة  
✅ مدير وكيل محدث  
✅ محادثة متقدمة  
✅ دعم Cohere و Mistral AI  
✅ تحسينات الأداء والأمان  

### الإصدارات القادمة

#### v2.2.0
- [ ] دعم Claude-3.5 Sonnet الجديد
- [ ] تكامل مع Perplexity AI
- [ ] ميزات إضافية للمحرر
- [ ] وضع العمل الجماعي التجريبي

#### v3.0.0
- [ ] نمط العمل الجماعي
- [ ] تكامل قواعد البيانات
- [ ] API مخصص للمطورين
- [ ] تطبيق محمول

---

## 🤝 المساهمة

نرحب بمساهماتكم! يرجى اتباع هذه الخطوات:

1. Fork المشروع
2. إنشاء فرع للميزة (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'إضافة ميزة رائعة'`)
4. Push للفرع (`git push origin feature/amazing-feature`)
5. فتح Pull Request

### إرشادات المساهمة
- اتبع معايير الكود الموجودة
- أضف اختبارات للميزات الجديدة
- وثق التغييرات في CHANGELOG
- استخدم رسائل commit واضحة

---

## 📄 الترخيص

هذا المشروع مرخص تحت رخصة MIT - راجع ملف [LICENSE](LICENSE) للتفاصيل.

---

## 🙏 شكر وتقدير

- [OpenAI](https://openai.com) - خدمات GPT وDALL-E
- [Anthropic](https://anthropic.com) - نماذج Claude
- [Google](https://ai.google.dev) - Gemini AI
- [Hugging Face](https://huggingface.co) - النماذج المفتوحة
- [Cohere](https://cohere.ai) - Command Models
- [Mistral AI](https://mistral.ai) - Mistral Models
- [ShadCN](https://ui.shadcn.com) - مكونات UI
- [Tailwind CSS](https://tailwindcss.com) - إطار CSS

---

## 📞 التواصل والدعم

- **البريد الإلكتروني**: support@scout-ai.com
- **المجتمع**: [Discord](https://discord.gg/scout-ai)
- **التوثيق**: [docs.scout-ai.com](https://docs.scout-ai.com)
- **الأخبار**: [Twitter @ScoutAI](https://twitter.com/scoutai)

---

<div align="center">
  <p><strong>منصة Scout AI - مستقبل الذكاء الاصطناعي باللغة العربية</strong></p>
  <p>صنع بـ ❤️ في العالم العربي</p>
</div>