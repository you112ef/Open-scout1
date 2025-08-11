import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Key,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Save,
  Trash2,
  Plus,
  Settings,
  Zap,
  AlertTriangle,
  Download,
  Upload,
  BarChart3,
  Globe,
  Cpu,
  DollarSign,
  Clock,
  Shield,
  Info,
  Copy,
  RefreshCw
} from 'lucide-react';
import LLMManager from '../services/llm-manager';
import { SettingsManager, APISettings } from '../services/ai-services';

export default function SettingsPage() {
  const [settings, setSettings] = useState<APISettings>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, 'success' | 'error' | 'testing'>>({});
  const [saved, setSaved] = useState(false);
  const [llmManager] = useState(() => LLMManager.getInstance());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [exportData, setExportData] = useState('');
  const [importData, setImportData] = useState('');

  useEffect(() => {
    const loadedSettings = SettingsManager.loadSettings();
    setSettings(loadedSettings);
    // تحديث إعدادات LLMManager
    Object.entries(loadedSettings).forEach(([providerId, config]) => {
      if (config.apiKey) {
        llmManager.setApiKey(providerId, config.apiKey, {
          organizationId: config.organizationId,
          baseUrl: config.baseUrl,
        });
      }
    });
  }, [llmManager]);

  const handleSave = () => {
    SettingsManager.saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    SettingsManager.clearSettings();
    setSettings({});
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleKeyVisibility = (provider: string) => {
    setShowKeys(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
  };

  const testApiKey = async (providerId: string) => {
    setTestResults(prev => ({ ...prev, [providerId]: 'testing' }));
    
    try {
      const provider = llmManager.getProvider(providerId);
      if (!provider) {
        setTestResults(prev => ({ ...prev, [providerId]: 'error' }));
        return;
      }

      const apiKey = settings[providerId as keyof APISettings]?.apiKey;
      if (!apiKey) {
        setTestResults(prev => ({ ...prev, [providerId]: 'error' }));
        return;
      }

      let testUrl = '';
      let testOptions: RequestInit = {};
      
      // بناء عنوان URL للاختبار
      if (provider.isOpenAICompatible) {
        testUrl = `${provider.baseUrl}/models`;
        testOptions = {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            ...(provider.headers || {})
          }
        };
      } else {
        // معالجة خاصة لكل مقدم خدمة
        switch (providerId) {
          case 'anthropic':
            testUrl = `${provider.baseUrl}/messages`;
            testOptions = {
              method: 'POST',
              headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: 'claude-3-haiku-20240307',
                max_tokens: 10,
                messages: [{ role: 'user', content: 'test' }]
              })
            };
            break;
          
          case 'gemini':
            testUrl = `${provider.baseUrl}/models?key=${apiKey}`;
            break;
          
          case 'huggingface':
            testUrl = 'https://huggingface.co/api/whoami';
            testOptions = {
              headers: {
                'Authorization': `Bearer ${apiKey}`
              }
            };
            break;
            
          default:
            testUrl = `${provider.baseUrl}/models`;
            testOptions = {
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              }
            };
        }
      }

      const response = await fetch(testUrl, testOptions);
      
      if (response.ok || response.status === 429) { // 429 = rate limited but key is valid
        setTestResults(prev => ({ ...prev, [providerId]: 'success' }));
      } else {
        setTestResults(prev => ({ ...prev, [providerId]: 'error' }));
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, [providerId]: 'error' }));
    }
  };

  const updateSettings = (providerId: string, field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [providerId]: {
        ...prev[providerId as keyof APISettings],
        [field]: value
      }
    }));
    
    // تحديث LLMManager أيضاً
    if (field === 'apiKey' && value) {
      llmManager.setApiKey(providerId, value, {
        organizationId: settings[providerId as keyof APISettings]?.organizationId,
        baseUrl: settings[providerId as keyof APISettings]?.baseUrl,
      });
    }
  };

  const exportSettings = () => {
    const exportData = llmManager.exportSettings();
    setExportData(exportData);
    navigator.clipboard.writeText(exportData);
  };

  const importSettings = () => {
    if (importData.trim()) {
      const success = llmManager.importSettings(importData);
      if (success) {
        const loadedSettings = SettingsManager.loadSettings();
        setSettings(loadedSettings);
        setSaved(true);
        setImportData('');
        setTimeout(() => setSaved(false), 2000);
      }
    }
  };

  // الحصول على جميع المقدمين من LLMManager
  const allProviders = llmManager.getAllProviders();
  const stats = llmManager.getStats();
  
  // تصفية المقدمين حسب الفئة
  const filteredProviders = selectedCategory === 'all' 
    ? allProviders 
    : allProviders.filter(provider => provider.category === selectedCategory);

  const categories = [
    { id: 'all', name: 'الكل', count: allProviders.length },
    { id: 'general', name: 'عام', count: stats.categoriesCount.general || 0 },
    { id: 'fast', name: 'سريع', count: stats.categoriesCount.fast || 0 },
    { id: 'research', name: 'البحث', count: stats.categoriesCount.research || 0 },
    { id: 'open-source', name: 'مفتوح المصدر', count: stats.categoriesCount['open-source'] || 0 },
    { id: 'specialized', name: 'متخصص', count: stats.categoriesCount.specialized || 0 }
  ];
  
  const renderProviderCard = (provider: any) => {
    const hasApiKey = !!settings[provider.id as keyof APISettings]?.apiKey;
    const testResult = testResults[provider.id];
    
    return (
      <Card key={provider.id} className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className={`h-5 w-5 ${hasApiKey ? 'text-green-600' : 'text-gray-400'}`} />
              {provider.displayName}
              <Badge variant="secondary" className="text-xs">
                {provider.category}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {hasApiKey && (
                <Badge variant="secondary" className="h-2 w-2 p-0 bg-green-500" />
              )}
              <Badge variant="outline" className="text-xs">
                {provider.models.length} نموذج
              </Badge>
            </div>
          </CardTitle>
          <p className="text-sm text-muted-foreground">{provider.description}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`${provider.id}-key`}>API Key *</Label>
            <div className="relative">
              <Input
                id={`${provider.id}-key`}
                type={showKeys[provider.id] ? "text" : "password"}
                placeholder={provider.apiKeyPrefix ? `${provider.apiKeyPrefix}...` : 'API Key'}
                value={settings[provider.id as keyof APISettings]?.apiKey || ''}
                onChange={(e) => updateSettings(provider.id, 'apiKey', e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute left-2 top-1/2 -translate-y-1/2"
                onClick={() => toggleKeyVisibility(provider.id)}
              >
                {showKeys[provider.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* إعدادات إضافية للمقدمين التي تحتاجها */}
          {provider.id === 'openai' && (
            <div className="space-y-2">
              <Label htmlFor="openai-org">Organization ID (اختياري)</Label>
              <Input
                id="openai-org"
                placeholder="org-..."
                value={settings.openai?.organizationId || ''}
                onChange={(e) => updateSettings('openai', 'organizationId', e.target.value)}
              />
            </div>
          )}

          {/* أزرار الاختبار والعمليات */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={() => testApiKey(provider.id)}
              disabled={!settings[provider.id as keyof APISettings]?.apiKey || testResult === 'testing'}
              variant="outline"
              size="sm"
            >
              {testResult === 'testing' ? (
                <><RefreshCw className="h-3 w-3 animate-spin ml-1" />جاري الاختبار...</>
              ) : (
                'اختبار الاتصال'
              )}
            </Button>
            
            {testResult === 'success' && (
              <Badge variant="secondary" className="gap-1 text-green-600">
                <CheckCircle className="h-3 w-3" />
                يعمل بنجاح
              </Badge>
            )}
            
            {testResult === 'error' && (
              <Badge variant="destructive" className="gap-1">
                <XCircle className="h-3 w-3" />
                خطأ في الاتصال
              </Badge>
            )}
            
            <Button variant="ghost" size="sm" asChild>
              <a href={provider.website} target="_blank" rel="noopener noreferrer">
                <Globe className="h-3 w-3 ml-1" />
                الموقع
              </a>
            </Button>
          </div>

          {/* معلومات النماذج */}
          <div className="mt-4">
            <Label className="text-sm font-medium">النماذج المتاحة:</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              {provider.models.slice(0, 4).map((model: any) => (
                <div key={model.id} className="text-xs p-2 bg-muted/50 rounded">
                  <div className="font-medium">{model.name}</div>
                  <div className="text-muted-foreground">
                    {model.contextLength.toLocaleString()} tokens
                    {model.pricing && (
                      <span className="ml-2">
                        ${model.pricing.input}/${model.pricing.output} /1M
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {provider.models.length > 4 && (
              <div className="text-xs text-muted-foreground mt-1">
                +{provider.models.length - 4} نموذج إضافي
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            إعدادات APIs الذكاء الاصطناعي
          </h1>
          <p className="text-muted-foreground mt-1">
            قم بتكوين مفاتيح API لخدمات الذكاء الاصطناعي المختلفة
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            حفظ الإعدادات
          </Button>
          <Button variant="outline" onClick={handleClear} className="gap-2">
            <Trash2 className="h-4 w-4" />
            مسح الكل
          </Button>
        </div>
      </div>

      {saved && (
        <Alert className="mb-6">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            تم حفظ الإعدادات بنجاح!
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="providers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="providers" className="gap-2">
            <Zap className="h-4 w-4" />
            مقدمو الخدمة
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            الإحصائيات
          </TabsTrigger>
          <TabsTrigger value="backup" className="gap-2">
            <Download className="h-4 w-4" />
            النسخ الاحتياطي
          </TabsTrigger>
          <TabsTrigger value="advanced" className="gap-2">
            <Settings className="h-4 w-4" />
            إعدادات متقدمة
          </TabsTrigger>
        </TabsList>

        {/* تبويب مقدمي الخدمة */}
        <TabsContent value="providers" className="space-y-6">
          {/* شريط التصفية */}
          <div className="flex flex-wrap gap-2 items-center">
            <Label className="font-medium">فلترة حسب الفئة:</Label>
            {categories.map(category => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="gap-1"
              >
                {category.name}
                <Badge variant="secondary" className="text-xs">
                  {category.count}
                </Badge>
              </Button>
            ))}
          </div>

          {/* بطاقات مقدمي الخدمة */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredProviders.map(renderProviderCard)}
          </div>
        </TabsContent>

        {/* تبويب الإحصائيات */}
        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold">{stats.totalProviders}</div>
                    <div className="text-sm text-muted-foreground">إجمالي المقدمين</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold">{stats.availableProviders}</div>
                    <div className="text-sm text-muted-foreground">المقدمين المتاحين</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="text-2xl font-bold">{stats.totalModels}</div>
                    <div className="text-sm text-muted-foreground">إجمالي النماذج</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-orange-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      {Math.round((stats.availableProviders / stats.totalProviders) * 100)}%
                    </div>
                    <div className="text-sm text-muted-foreground">معدل التفعيل</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* تفصيل الفئات */}
          <Card>
            <CardHeader>
              <CardTitle>توزيع المقدمين حسب الفئة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.categoriesCount).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="capitalize">{category}</span>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(count / stats.totalProviders) * 100} 
                        className="w-24" 
                      />
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب النسخ الاحتياطي */}
        <TabsContent value="backup" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  تصدير الإعدادات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  احفظ جميع إعداداتك ومفاتيح API كنسخة احتياطية
                </p>
                <Button onClick={exportSettings} className="w-full">
                  <Download className="h-4 w-4 ml-2" />
                  تصدير الإعدادات
                </Button>
                {exportData && (
                  <div className="space-y-2">
                    <Label>البيانات المُصدرة:</Label>
                    <Textarea 
                      value={exportData} 
                      readOnly 
                      className="h-32 text-xs" 
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigator.clipboard.writeText(exportData)}
                    >
                      <Copy className="h-3 w-3 ml-1" />
                      نسخ
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  استيراد الإعدادات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  استعد إعداداتك من نسخة احتياطية سابقة
                </p>
                <div className="space-y-2">
                  <Label>بيانات الإعدادات:</Label>
                  <Textarea 
                    value={importData}
                    onChange={(e) => setImportData(e.target.value)}
                    placeholder="الصق بيانات الإعدادات هنا..."
                    className="h-32"
                  />
                </div>
                <Button 
                  onClick={importSettings} 
                  disabled={!importData.trim()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 ml-2" />
                  استيراد الإعدادات
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* تبويب الإعدادات المتقدمة */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات النظام</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>مقدم الخدمة الافتراضي</Label>
                <Select 
                  value={llmManager.getDefaultProvider() || ''} 
                  onValueChange={(value) => llmManager.setDefaultProvider(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر مقدم الخدمة الافتراضي" />
                  </SelectTrigger>
                  <SelectContent>
                    {allProviders.filter(p => llmManager.hasValidApiKey(p.id)).map(provider => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>مقدمو الخدمة الاحتياطيون</Label>
                <p className="text-sm text-muted-foreground">
                  في حالة فشل مقدم الخدمة الأساسي، سيتم استخدام هذه الخيارات
                </p>
                {/* يمكن إضافة multi-select هنا */}
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>تفعيل التسجيل المفصل</Label>
                  <p className="text-sm text-muted-foreground">
                    سجل جميع طلبات API للتشخيص
                  </p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>التبديل التلقائي للمقدمين</Label>
                  <p className="text-sm text-muted-foreground">
                    انتقل تلقائياً لمقدم آخر في حالة الخطأ
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* باقي المحتوى محذوف لصالح النظام الجديد */}
      </Tabs>

      <Alert className="mt-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>تنبيه أمني:</strong> مفاتيح API يتم حفظها محلياً في متصفحك فقط ولا يتم إرسالها لأي خادم.
          تأكد من عدم مشاركة هذه المفاتيح مع أي شخص آخر. جميع الاتصالات مشفرة ومحمية.
        </AlertDescription>
      </Alert>
    </div>
  );
}