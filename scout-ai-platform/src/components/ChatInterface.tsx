import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Send,
  Paperclip,
  Mic,
  MicOff,
  Image,
  Code,
  Search,
  FileText,
  MoreHorizontal,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Bot,
  User,
  Loader2,
  AlertCircle,
  Settings,
  Languages,
  BarChart3,
  Lightbulb,
  Globe
} from 'lucide-react';
import { AIServiceManager } from '../services/ai-services';
import LLMManager from '../services/llm-manager';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type: 'text' | 'code' | 'image' | 'file';
  status?: 'sending' | 'sent' | 'error';
  tools?: string[];
  provider?: string;
  model?: string;
  tokens?: {
    input: number;
    output: number;
  };
}

interface Tool {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'مرحباً! أنا Scout، مساعدك الذكي للبرمجة والمشاريع. كيف يمكنني مساعدتك اليوم؟\n\nملاحظة: تأكد من إعداد مفاتيح API في تبويب الإعدادات لتفعيل الوظائف الكاملة.',
      sender: 'ai',
      timestamp: new Date(),
      type: 'text'
    }
  ]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [useStreaming, setUseStreaming] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'error'>('connected');
  const [tokenUsage, setTokenUsage] = useState({ input: 0, output: 0 });
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const aiService = useRef(new AIServiceManager());
  const llmManager = useRef(LLMManager.getInstance());

  const tools: Tool[] = [
    {
      id: 'code',
      name: 'محرر الكود',
      icon: <Code className="h-4 w-4" />,
      description: 'كتابة وتعديل الكود'
    },
    {
      id: 'search',
      name: 'البحث',
      icon: <Search className="h-4 w-4" />,
      description: 'البحث في الإنترنت'
    },
    {
      id: 'image',
      name: 'إنشاء صور',
      icon: <Image className="h-4 w-4" />,
      description: 'إنشاء صور بالذكاء الاصطناعي'
    },
    {
      id: 'translate',
      name: 'الترجمة',
      icon: <Languages className="h-4 w-4" />,
      description: 'ترجمة النصوص بين اللغات'
    },
    {
      id: 'analysis',
      name: 'تحليل',
      icon: <BarChart3 className="h-4 w-4" />,
      description: 'تحليل البيانات والنصوص'
    },
    {
      id: 'brainstorm',
      name: 'عصف ذهني',
      icon: <Lightbulb className="h-4 w-4" />,
      description: 'توليد أفكار وحلول إبداعية'
    },
    {
      id: 'file',
      name: 'الملفات',
      icon: <FileText className="h-4 w-4" />,
      description: 'إدارة الملفات والمستندات'
    },
    {
      id: 'web',
      name: 'ويب',
      icon: <Globe className="h-4 w-4" />,
      description: 'تطوير مواقع ومشاريع ويب'
    }
  ];

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // تحديد مقدم الخدمة الافتراضي عند التحميل
  useEffect(() => {
    const availableProviders = llmManager.current.getAllProviders().filter(p => 
      llmManager.current.hasValidApiKey(p.id)
    );
    
    if (availableProviders.length > 0 && !selectedProvider) {
      const defaultProvider = llmManager.current.getDefaultProvider() || availableProviders[0].id;
      setSelectedProvider(defaultProvider);
      
      // تحديد النموذج الافتراضي
      const provider = llmManager.current.getProvider(defaultProvider);
      if (provider?.models && provider.models.length > 0) {
        setSelectedModel(provider.models[0].id);
      }
    }
  }, [selectedProvider]);

  const handleSend = async () => {
    if (!input.trim()) return;
    if (!selectedProvider || !llmManager.current.hasValidApiKey(selectedProvider)) {
      alert('يرجى إعداد مفتاح API في تبويب الإعدادات');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date(),
      type: 'text',
      status: 'sent',
      provider: selectedProvider,
      model: selectedModel
    };

    const messageHistory = [...messages, userMessage];
    setMessages(messageHistory);
    const currentInput = input;
    setInput('');
    setIsTyping(true);
    setConnectionStatus('connecting');

    try {
      // تحويل التاريخ إلى تنسيق API
      const apiMessages = messageHistory
        .filter(msg => msg.sender === 'user' || msg.sender === 'ai')
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

      let aiResponse = '';
      const aiMessageId = (Date.now() + 1).toString();
      const startTime = Date.now();

      // إضافة رسالة مؤقتة للـ AI
      const tempAiMessage: Message = {
        id: aiMessageId,
        content: '',
        sender: 'ai',
        timestamp: new Date(),
        type: 'text',
        tools: ['code', 'search'],
        provider: selectedProvider,
        model: selectedModel
      };
      
      setMessages(prev => [...prev, tempAiMessage]);
      setConnectionStatus('connected');

      // التحقق من دعم البث المباشر
      const supportedProviders = ['openai', 'anthropic', 'gemini', 'huggingface', 'cohere', 'mistral'];
      const normalizedProvider = supportedProviders.includes(selectedProvider) ? 
        selectedProvider as ('openai' | 'anthropic' | 'gemini' | 'huggingface' | 'cohere' | 'mistral') : 
        'openai';

      if (useStreaming && selectedProvider === 'openai') {
        // استخدام البث المباشر للـ OpenAI
        await aiService.current.streamMessage(
          apiMessages,
          'openai' as const,
          (chunk: string) => {
            aiResponse += chunk;
            setMessages(prev => 
              prev.map(msg => 
                msg.id === aiMessageId 
                  ? { ...msg, content: aiResponse }
                  : msg
              )
            );
          },
          selectedModel || undefined
        );
      } else {
        // استخدام الاستجابة العادية
        aiResponse = await aiService.current.sendMessage(
          apiMessages,
          normalizedProvider,
          selectedModel || undefined
        );
        
        setMessages(prev => 
          prev.map(msg => 
            msg.id === aiMessageId 
              ? { 
                  ...msg, 
                  content: aiResponse,
                  tokens: {
                    input: Math.ceil(currentInput.length / 4), // تقدير تقريبي
                    output: Math.ceil(aiResponse.length / 4)
                  }
                }
              : msg
          )
        );
      }
      
      // تحديث إحصائيات استخدام الـ tokens
      const inputTokens = Math.ceil(currentInput.length / 4);
      const outputTokens = Math.ceil(aiResponse.length / 4);
      setTokenUsage(prev => ({
        input: prev.input + inputTokens,
        output: prev.output + outputTokens
      }));
    } catch (error) {
      console.error('Error sending message:', error);
      setConnectionStatus('error');
      
      let errorMsg = 'حدث خطأ غير متوقع';
      
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          errorMsg = 'مفتاح API غير صحيح أو غير موجود. يرجى التحقق من إعدادات API.';
        } else if (error.message.includes('quota')) {
          errorMsg = 'تم تجاوز حد الاستخدام لهذا الشهر. يرجى التحقق من حسابك.';
        } else if (error.message.includes('network')) {
          errorMsg = 'مشكلة في الاتصال. يرجى التحقق من اتصال الإنترنت.';
        } else {
          errorMsg = `خطأ: ${error.message}`;
        }
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: errorMsg,
        sender: 'ai',
        timestamp: new Date(),
        type: 'text',
        status: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setTimeout(() => setConnectionStatus('connected'), 2000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ar-SA', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const chunks: BlobPart[] = [];
        
        recorder.ondataavailable = (e) => {
          chunks.push(e.data);
        };
        
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/wav' });
          setAudioBlob(blob);
          handleAudioTranscription(blob);
        };
        
        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);
      } catch (error) {
        console.error('Error accessing microphone:', error);
        alert('خطأ في الوصول إلى الميكروفون');
      }
    } else {
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
      }
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };
  
  const handleAudioTranscription = async (audioBlob: Blob) => {
    if (!selectedProvider || !llmManager.current.hasValidApiKey(selectedProvider)) {
      alert('يرجى إعداد مفتاح API في تبويب الإعدادات');
      return;
    }
    
    try {
      if (selectedProvider === 'openai') {
        const transcription = await aiService.current.transcribeAudio(audioBlob, 'openai');
        setInput(prevInput => prevInput + ' ' + transcription);
      } else {
        alert('تحويل الصوت مدعوم فقط مع OpenAI حالياً');
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
      alert('خطأ في تحويل الصوت إلى نص');
    }
  };
  
  const handleToolClick = async (toolId: string) => {
    setSelectedTool(toolId);
    
    if (toolId === 'image') {
      const imagePrompt = input.trim();
      if (!imagePrompt) {
        alert('يرجى كتابة وصف للصورة التي تريد إنشاءها');
        return;
      }
      
      if (!selectedProvider || !llmManager.current.hasValidApiKey(selectedProvider)) {
        alert('يرجى إعداد مفتاح API في تبويب الإعدادات');
        return;
      }
      
      if (selectedProvider !== 'openai') {
        alert('إنشاء الصور مدعوم فقط مع OpenAI حالياً');
        return;
      }
      
      await handleImageGeneration(imagePrompt);
    } else if (toolId === 'code') {
      // التبديل إلى محرر الكود - يمكن تنفيذه في MainLayout
      alert('سيتم التبديل إلى محرر الكود');
    } else if (toolId === 'search') {
      // إضافة وظيفة البحث في الإنترنت
      const searchQuery = input.trim() || window.prompt('أدخل استعلام البحث:');
      if (searchQuery) {
        setInput(`بحث في الإنترنت: ${searchQuery}`);
      }
    } else if (toolId === 'translate') {
      const textToTranslate = input.trim() || window.prompt('أدخل النص المراد ترجمته:');
      const targetLang = window.prompt('أدخل اللغة المطلوبة (مثال: إنجليزية، فرنسية، إسبانية):');
      if (textToTranslate && targetLang) {
        setInput(`ترجم إلى اللغة ال${targetLang}: ${textToTranslate}`);
      }
    } else if (toolId === 'analysis') {
      const dataToAnalyze = input.trim() || window.prompt('أدخل البيانات أو النص المراد تحليله:');
      if (dataToAnalyze) {
        setInput(`حلل هذه البيانات وقدم رؤى وتوصيات: ${dataToAnalyze}`);
      }
    } else if (toolId === 'brainstorm') {
      const topic = input.trim() || window.prompt('أدخل الموضوع المراد العصف الذهني حوله:');
      if (topic) {
        setInput(`عصف ذهني وتوليد أفكار إبداعية حول: ${topic}`);
      }
    } else if (toolId === 'web') {
      const projectType = window.prompt('أي نوع من مشاريع الويب تريد إنشاءه؟ (موقع شخصي، متجر إلكتروني، مدونة، إلخ):');
      if (projectType) {
        setInput(`أريد إنشاء ${projectType}. هل يمكنك مساعدتي في تطويره وتقديم الكود والتوجيهات اللازمة؟`);
      }
    }
  };
  
  const handleImageGeneration = async (prompt: string) => {
    setIsGeneratingImage(true);
    
    try {
      const imageUrl = await aiService.current.generateImage(prompt, 'openai');
      
      const imageMessage: Message = {
        id: Date.now().toString(),
        content: `تم إنشاء صورة بناءً على: "${prompt}"\n\n![Generated Image](${imageUrl})`,
        sender: 'ai',
        timestamp: new Date(),
        type: 'image',
        provider: selectedProvider,
        model: 'dall-e-3'
      };
      
      setMessages(prev => [...prev, imageMessage]);
      setInput('');
    } catch (error) {
      console.error('Error generating image:', error);
      alert('خطأ في إنشاء الصورة');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // الحصول على قائمة مقدمي الخدمة المتاحين من LLMManager
  const availableProviders = llmManager.current.getAllProviders().filter(p => 
    llmManager.current.hasValidApiKey(p.id)
  );
  
  // الحصول على نماذج مقدم الخدمة المختار
  const currentProvider = selectedProvider ? llmManager.current.getProvider(selectedProvider) : null;
  const currentModels = currentProvider?.models || [];
  
  // وظائف مساعدة
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // يمكن إضافة إشعار نجاح هنا
    });
  };
  
  const regenerateResponse = async (messageId: string) => {
    // العثور على آخر رسالة مستخدم قبل هذه الرسالة
    const msgIndex = messages.findIndex(m => m.id === messageId);
    if (msgIndex > 0) {
      const previousUserMsg = [...messages].reverse().find((m, i) => 
        messages.length - 1 - i < msgIndex && m.sender === 'user'
      );
      
      if (previousUserMsg) {
        setInput(previousUserMsg.content);
        // حذف الرسالة الحالية وإعادة الإرسال
        setMessages(prev => prev.filter(m => m.id !== messageId));
        setTimeout(() => handleSend(), 100);
      }
    }
  };
  
  const getProviderStatus = () => {
    if (connectionStatus === 'connecting') return 'جاري الاتصال...';
    if (connectionStatus === 'error') return 'خطأ في الاتصال';
    if (availableProviders.length === 0) return 'لا توجد مفاتيح API معدة';
    return `متصل بـ ${availableProviders.length} مقدم خدمة`;
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* AI Settings Panel */}
      <div className="border-b border-border p-4 bg-muted/30">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">مقدم الخدمة:</label>
              <Select value={selectedProvider} onValueChange={(value) => {
                setSelectedProvider(value);
                // إعادة تعيين النموذج عند تغيير المقدم
                const provider = llmManager.current.getProvider(value);
                if (provider?.models && provider.models.length > 0) {
                  setSelectedModel(provider.models[0].id);
                }
              }}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="اختر مقدم الخدمة" />
                </SelectTrigger>
                <SelectContent>
                  {availableProviders.map(provider => (
                    <SelectItem key={provider.id} value={provider.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        {provider.displayName}
                        <Badge variant="outline" className="text-xs">
                          {provider.models?.length || 0}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">النموذج:</label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-52">
                  <SelectValue placeholder="اختر النموذج" />
                </SelectTrigger>
                <SelectContent>
                  {currentModels.map(model => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex flex-col">
                        <span>{model.name}</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>🧠 {(model.contextLength / 1000).toFixed(0)}K</span>
                          {model.supportsStreaming && <span>⚡</span>}
                          {model.supportsImages && <span>🖼️</span>}
                          {model.pricing && (
                            <span>${model.pricing.input.toFixed(3)}</span>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProvider === 'openai' && (
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="streaming" 
                  checked={useStreaming} 
                  onChange={(e) => setUseStreaming(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="streaming" className="text-sm">البث المباشر</label>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' :
              connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <span className="text-muted-foreground">{getProviderStatus()}</span>
            
            {tokenUsage.input > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <span>|</span>
                <span>💬 {tokenUsage.input + tokenUsage.output} tokens</span>
              </div>
            )}
          </div>
        </div>
        
        {availableProviders.length === 0 && (
          <Alert className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              لم يتم إعداد أي مفاتيح API. توجه إلى تبويب الإعدادات لإضافتها.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.sender === 'ai' && (
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}

              <div className={`flex flex-col max-w-[70%] ${message.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <Card className={`${message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
                  <CardContent className="p-3">
                    <div className="prose prose-sm max-w-none">
                      {message.type === 'code' ? (
                        <pre className="bg-muted p-2 rounded text-sm overflow-x-auto">
                          <code>{message.content}</code>
                        </pre>
                      ) : message.type === 'image' ? (
                        <div className="space-y-2">
                          {message.content.split('\n').map((line, index) => {
                            if (line.includes('![Generated Image]')) {
                              const imageUrl = line.match(/\((.+?)\)/)?.[1];
                              return imageUrl ? (
                                <div key={index} className="space-y-2">
                                  <img 
                                    src={imageUrl} 
                                    alt="Generated Image" 
                                    className="max-w-full h-auto rounded-lg border shadow-sm"
                                    loading="lazy"
                                  />
                                  <p className="text-xs text-muted-foreground">صورة تم إنشاؤها بالذكاء الاصطناعي</p>
                                </div>
                              ) : null;
                            } else if (line.trim()) {
                              return <p key={index} className="whitespace-pre-wrap">{line}</p>;
                            }
                            return null;
                          }).filter(Boolean)}
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      )}
                    </div>
                    
                    {message.tools && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {message.tools.map((toolId) => {
                          const tool = tools.find(t => t.id === toolId);
                          return tool ? (
                            <Badge key={toolId} variant="secondary" className="text-xs gap-1">
                              {tool.icon}
                              {tool.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {formatTime(message.timestamp)}
                  </span>
                  
                  {message.sender === 'ai' && (
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard(message.content)}
                        title="نسخ"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="إعجاب">
                        <ThumbsUp className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="عدم إعجاب">
                        <ThumbsDown className="h-3 w-3" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => regenerateResponse(message.id)}>
                            <RefreshCw className="h-4 w-4 ml-2" />
                            إعادة إنشاء
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => copyToClipboard(message.content)}>
                            <Copy className="h-4 w-4 ml-2" />
                            نسخ
                          </DropdownMenuItem>
                          {message.provider && (
                            <DropdownMenuLabel className="text-xs text-muted-foreground">
                              {message.provider} • {message.model}
                            </DropdownMenuLabel>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              </div>

              {message.sender === 'user' && (
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 justify-start">
              <Avatar className="h-8 w-8 mt-1">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <Card className="bg-card">
                <CardContent className="p-3">
                  <div className="flex items-center gap-1">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Scout يكتب...</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-border p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2 mb-3 flex-wrap">
            {tools.map((tool) => (
              <Button
                key={tool.id}
                variant={selectedTool === tool.id ? "default" : "outline"}
                size="sm"
                className="gap-2 text-xs"
                onClick={() => handleToolClick(tool.id)}
                disabled={isTyping || isGeneratingImage}
                title={tool.description}
              >
                {tool.icon}
                {tool.name}
                {isGeneratingImage && tool.id === 'image' && (
                  <Loader2 className="h-3 w-3 animate-spin" />
                )}
              </Button>
            ))}
          </div>

          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="اكتب رسالتك هنا... (اضغط Enter للإرسال، Shift+Enter لسطر جديد)"
                className="min-h-[60px] max-h-32 resize-none pl-12"
                dir="rtl"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-2 bottom-2 h-8 w-8 p-0"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant={isRecording ? "destructive" : "outline"}
              size="sm"
              onClick={toggleRecording}
              className="h-12 w-12 p-0"
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>

            <Button
              onClick={handleSend}
              disabled={!input.trim() || isTyping || availableProviders.length === 0}
              className="h-12 w-12 p-0"
            >
              {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>

          <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
            <span>استخدم الأدوات أعلاه لتحسين تجربة المحادثة</span>
            <div className="flex items-center gap-2">
              <span>Shift + Enter للسطر الجديد</span>
              {selectedProvider && selectedModel && (
                <Badge variant="outline" className="text-xs">
                  {llmManager.current.getProvider(selectedProvider)?.displayName} • {selectedModel}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}