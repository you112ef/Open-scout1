import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Code,
  Search,
  Image,
  FileText,
  Database,
  Globe,
  Zap,
  Play,
  Pause,
  Square,
  MoreHorizontal,
  AlertCircle,
  Plus,
  Settings,
  Download,
  Upload,
  Trash2,
  Edit,
  Copy,
  Eye,
  Brain,
  Mic,
  Video,
  Palette
} from 'lucide-react';
import { AIServiceManager } from '../services/ai-services';
import LLMManager from '../services/llm-manager';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused' | 'cancelled';
  progress: number;
  tool: string;
  createdAt: Date;
  completedAt?: Date;
  estimatedDuration?: number;
  actualDuration?: number;
  result?: string;
  error?: string;
  aiProvider?: string;
  prompt?: string;
  taskType: 'ai-chat' | 'code-review' | 'documentation' | 'image-generation' | 'data-analysis' | 'web-search' | 'file-processing' | 'translation' | 'summarization' | 'custom';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags?: string[];
  outputs?: {
    text?: string;
    files?: string[];
    images?: string[];
    data?: any;
  };
  dependencies?: string[];
  childTasks?: string[];
}

interface Tool {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  status: 'available' | 'busy' | 'disabled';
  currentTask?: string;
  requiresAI?: boolean;
  supportedProviders?: string[];
  category: 'ai' | 'utility' | 'analysis' | 'media' | 'development';
  usageCount: number;
  lastUsed?: Date;
  estimatedTime?: number;
}

export default function AgentManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskProvider, setNewTaskProvider] = useState('openai');
  const [newTaskType, setNewTaskType] = useState<Task['taskType']>('ai-chat');
  const [newTaskPriority, setNewTaskPriority] = useState<Task['priority']>('medium');
  const [showAddTask, setShowAddTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [agentStatus, setAgentStatus] = useState<'idle' | 'working' | 'error'>('idle');
  const [filter, setFilter] = useState<'all' | 'running' | 'completed' | 'failed' | 'pending'>('all');
  const [isLoading, setIsLoading] = useState(false);
  
  const aiService = useRef(new AIServiceManager());
  const llmManager = useRef(LLMManager.getInstance());

  const [tools] = useState<Tool[]>([
    {
      id: 'ai-chat',
      name: 'محادثة ذكية',
      icon: <Brain className="h-5 w-5" />,
      description: 'محادثة تفاعلية مع نماذج الذكاء الاصطناعي المختلفة',
      status: 'available',
      requiresAI: true,
      category: 'ai',
      usageCount: 45,
      estimatedTime: 5,
      supportedProviders: ['openai', 'anthropic', 'gemini', 'mistral']
    },
    {
      id: 'ai-code-review',
      name: 'مراجعة الكود',
      icon: <Code className="h-5 w-5" />,
      description: 'مراجعة وتحسين الكود باستخدام الذكاء الاصطناعي',
      status: 'available',
      requiresAI: true,
      category: 'development',
      usageCount: 23,
      estimatedTime: 15,
      supportedProviders: ['anthropic', 'openai', 'gemini']
    },
    {
      id: 'ai-documentation',
      name: 'توليد الوثائق',
      icon: <FileText className="h-5 w-5" />,
      description: 'إنشاء وثائق تفصيلية للمشاريع تلقائياً',
      status: 'available',
      requiresAI: true,
      category: 'development',
      usageCount: 12,
      estimatedTime: 20,
      supportedProviders: ['openai', 'anthropic', 'gemini']
    },
    {
      id: 'ai-image-gen',
      name: 'توليد الصور',
      icon: <Palette className="h-5 w-5" />,
      description: 'إنشاء ومعالجة الصور باستخدام DALL-E',
      status: 'available',
      requiresAI: true,
      category: 'media',
      usageCount: 8,
      estimatedTime: 30,
      supportedProviders: ['openai']
    },
    {
      id: 'ai-translation',
      name: 'الترجمة الذكية',
      icon: <Globe className="h-5 w-5" />,
      description: 'ترجمة النصوص بدقة عالية وسياق محفوظ',
      status: 'available',
      requiresAI: true,
      category: 'ai',
      usageCount: 15,
      estimatedTime: 5,
      supportedProviders: ['openai', 'anthropic', 'gemini']
    },
    {
      id: 'ai-summarization',
      name: 'تلخيص النصوص',
      icon: <FileText className="h-5 w-5" />,
      description: 'تلخيص المستندات والنصوص الطويلة بذكاء',
      status: 'available',
      requiresAI: true,
      category: 'ai',
      usageCount: 18,
      estimatedTime: 10,
      supportedProviders: ['anthropic', 'openai', 'gemini']
    },
    {
      id: 'web-search',
      name: 'البحث الذكي',
      icon: <Search className="h-5 w-5" />,
      description: 'البحث في الإنترنت وجمع المعلومات',
      status: 'available',
      category: 'utility',
      usageCount: 31,
      estimatedTime: 15
    },
    {
      id: 'data-analysis',
      name: 'تحليل البيانات',
      icon: <Database className="h-5 w-5" />,
      description: 'تحليل البيانات وإنشاء رؤى ذكية',
      status: 'available',
      requiresAI: true,
      category: 'analysis',
      usageCount: 9,
      estimatedTime: 25,
      supportedProviders: ['openai', 'anthropic']
    },
    {
      id: 'file-processor',
      name: 'معالج الملفات',
      icon: <Upload className="h-5 w-5" />,
      description: 'معالجة وتحويل الملفات المختلفة',
      status: 'available',
      category: 'utility',
      usageCount: 22,
      estimatedTime: 10
    },
    {
      id: 'audio-transcription',
      name: 'تفريغ الصوتيات',
      icon: <Mic className="h-5 w-5" />,
      description: 'تحويل الملفات الصوتية إلى نصوص',
      status: 'available',
      requiresAI: true,
      category: 'media',
      usageCount: 5,
      estimatedTime: 20,
      supportedProviders: ['openai']
    }
  ]);

  // الحصول على قائمة مقدمي الخدمة المتاحين
  const availableProviders = llmManager.current.getAllProviders().filter(p => 
    llmManager.current.hasValidApiKey(p.id)
  );

  // حفظ واستعادة المهام من localStorage
  const saveTasksToStorage = useCallback((tasksToSave: Task[]) => {
    try {
      localStorage.setItem('scout-agent-tasks', JSON.stringify(tasksToSave));
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  }, []);

  const loadTasksFromStorage = useCallback(() => {
    try {
      const savedTasks = localStorage.getItem('scout-agent-tasks');
      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks).map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt),
          completedAt: task.completedAt ? new Date(task.completedAt) : undefined
        }));
        setTasks(parsedTasks);
      } else {
        // إضافة مهام تجريبية إذا لم توجد مهام محفوظة
        const demoTasks: Task[] = [
          {
            id: '1',
            title: 'مراجعة كود التطبيق',
            description: 'مراجعة شاملة لكود React وتحديد نقاط التحسين',
            status: 'completed',
            progress: 100,
            tool: 'ai-code-review',
            taskType: 'code-review',
            priority: 'high',
            createdAt: new Date(Date.now() - 3600000),
            completedAt: new Date(Date.now() - 3000000),
            actualDuration: 10,
            aiProvider: 'anthropic',
            result: 'تم العثور على 7 تحسينات وتطبيقها بنجاح. الكود أصبح أكثر كفاءة بنسبة 25%.',
            outputs: {
              text: 'تقرير مفصل عن التحسينات المطبقة'
            }
          },
          {
            id: '2',
            title: 'إنشاء وثائق API',
            description: 'توليد وثائق شاملة لجميع endpoints في المشروع',
            status: 'running',
            progress: 75,
            tool: 'ai-documentation',
            taskType: 'documentation',
            priority: 'medium',
            createdAt: new Date(Date.now() - 1800000),
            estimatedDuration: 20,
            aiProvider: 'openai'
          }
        ];
        setTasks(demoTasks);
        saveTasksToStorage(demoTasks);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  }, [saveTasksToStorage]);

  // فلترة المهام
  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  // تحميل المهام عند بدء التشغيل
  useEffect(() => {
    loadTasksFromStorage();
  }, [loadTasksFromStorage]);

  // حفظ المهام عند تغييرها
  useEffect(() => {
    if (tasks.length > 0) {
      saveTasksToStorage(tasks);
    }
  }, [tasks, saveTasksToStorage]);

  // تحديث حالة الوكيل
  useEffect(() => {
    const runningTasks = tasks.filter(task => task.status === 'running');
    if (runningTasks.length > 0) {
      setAgentStatus('working');
    } else {
      setAgentStatus('idle');
    }
  }, [tasks]);

  // محاكاة تحديث التقدم للمهام قيد التنفيذ
  useEffect(() => {
    const interval = setInterval(() => {
      setTasks(prev => prev.map(task => {
        if (task.status === 'running' && task.progress < 100) {
          const newProgress = Math.min(task.progress + Math.random() * 8, 100);
          if (newProgress >= 100) {
            const completedTask = {
              ...task,
              progress: 100,
              status: 'completed' as const,
              completedAt: new Date(),
              actualDuration: task.estimatedDuration || 10,
              result: `تمت المهمة "${task.title}" بنجاح`
            };
            return completedTask;
          }
          return { ...task, progress: newProgress };
        }
        return task;
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-orange-500" />;
      case 'cancelled':
        return <Square className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'running': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'paused': return 'bg-orange-500';
      case 'cancelled': return 'bg-gray-500';
    }
  };

  const getStatusText = (status: Task['status']) => {
    switch (status) {
      case 'pending': return 'في الانتظار';
      case 'running': return 'قيد التنفيذ';
      case 'completed': return 'مكتملة';
      case 'failed': return 'فاشلة';
      case 'paused': return 'متوقفة';
      case 'cancelled': return 'ملغاة';
    }
  };

  const getToolStatusColor = (status: Tool['status']) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'disabled': return 'bg-gray-500';
    }
  };

  const handleTaskAction = (taskId: string, action: 'pause' | 'resume' | 'stop' | 'retry' | 'delete') => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        switch (action) {
          case 'pause':
            return { ...task, status: 'paused' as const };
          case 'resume':
            return { ...task, status: 'running' as const };
          case 'stop':
            return { 
              ...task, 
              status: 'cancelled' as const, 
              error: 'تم إيقاف المهمة بواسطة المستخدم',
              completedAt: new Date()
            };
          case 'retry':
            return { 
              ...task, 
              status: 'running' as const, 
              progress: 0, 
              error: undefined,
              completedAt: undefined 
            };
        }
      }
      return task;
    }).filter(task => !(action === 'delete' && task.id === taskId)));
  };
  
  const executeTask = async (task: Task) => {
    try {
      let result = '';
      const messages = [{ role: 'user', content: task.prompt || task.description }];
      
      // التأكد من أن مقدم الخدمة مدعوم
      const supportedProviders = ['openai', 'anthropic', 'gemini', 'huggingface', 'cohere', 'mistral'];
      const provider = supportedProviders.includes(task.aiProvider!) ? 
        task.aiProvider! as ('openai' | 'anthropic' | 'gemini' | 'huggingface' | 'cohere' | 'mistral') : 
        'openai';
      
      // تنفيذ المهمة حسب نوعها
      switch (task.taskType) {
        case 'ai-chat':
          result = await aiService.current.sendMessage(messages, provider);
          break;
        case 'code-review':
          const codePrompt = `قم بمراجعة هذا الكود وتقديم اقتراحات للتحسين:\n\n${task.description}`;
          result = await aiService.current.sendMessage([{ role: 'user', content: codePrompt }], provider);
          break;
        case 'documentation':
          const docPrompt = `أنشئ وثائق شاملة لما يلي:\n\n${task.description}`;
          result = await aiService.current.sendMessage([{ role: 'user', content: docPrompt }], provider);
          break;
        case 'translation':
          const translatePrompt = `ترجم النص التالي مع الحفاظ على السياق والمعنى:\n\n${task.description}`;
          result = await aiService.current.sendMessage([{ role: 'user', content: translatePrompt }], provider);
          break;
        case 'summarization':
          const summaryPrompt = `لخص النص التالي بشكل شامل ومفيد:\n\n${task.description}`;
          result = await aiService.current.sendMessage([{ role: 'user', content: summaryPrompt }], provider);
          break;
        default:
          result = await aiService.current.sendMessage(messages, provider);
      }
      
      // تحديث المهمة بالنتيجة
      setTasks(prev => prev.map(t => 
        t.id === task.id 
          ? { 
              ...t, 
              status: 'completed' as const, 
              progress: 100, 
              result: result.slice(0, 200) + (result.length > 200 ? '...' : ''),
              completedAt: new Date(),
              actualDuration: Math.floor(Math.random() * 20) + 5,
              outputs: {
                text: result
              }
            }
          : t
      ));
    } catch (error) {
      setTasks(prev => prev.map(t => 
        t.id === task.id 
          ? { 
              ...t, 
              status: 'failed' as const, 
              error: 'فشل في تنفيذ المهمة: ' + (error as Error).message,
              completedAt: new Date()
            }
          : t
      ));
    }
  };

  const addNewTask = async () => {
    if (!newTaskTitle.trim() || !newTaskDescription.trim()) return;
    if (!newTaskProvider || (tools.find(t => t.id === newTaskType)?.requiresAI && !availableProviders.find(p => p.id === newTaskProvider))) {
      alert('يرجى اختيار مقدم خدمة ذكاء اصطناعي متاح');
      return;
    }
    
    setIsLoading(true);
    
    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      description: newTaskDescription,
      status: 'running',
      progress: 0,
      tool: newTaskType,
      taskType: newTaskType,
      priority: newTaskPriority,
      createdAt: new Date(),
      estimatedDuration: tools.find(t => t.id === newTaskType)?.estimatedTime || 15,
      aiProvider: newTaskProvider,
      prompt: newTaskDescription,
      tags: [newTaskType, newTaskPriority]
    };
    
    setTasks(prev => [newTask, ...prev]);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setShowAddTask(false);
    setIsLoading(false);
    
    // تنفيذ المهمة
    setTimeout(() => executeTask(newTask), 1000);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}س ${mins}د` : `${mins}د`;
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `منذ ${days} يوم`;
    if (hours > 0) return `منذ ${hours} ساعة`;
    if (minutes > 0) return `منذ ${minutes} دقيقة`;
    return 'الآن';
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-blue-500';
      case 'low': return 'bg-gray-500';
    }
  };

  const getPriorityText = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent': return 'عاجل';
      case 'high': return 'عالي';
      case 'medium': return 'متوسط';
      case 'low': return 'منخفض';
    }
  };

  const getTaskTypeText = (type: Task['taskType']) => {
    const types = {
      'ai-chat': 'محادثة ذكية',
      'code-review': 'مراجعة كود',
      'documentation': 'توليد وثائق',
      'image-generation': 'توليد صور',
      'data-analysis': 'تحليل بيانات',
      'web-search': 'بحث ويب',
      'file-processing': 'معالجة ملفات',
      'translation': 'ترجمة',
      'summarization': 'تلخيص',
      'custom': 'مخصص'
    };
    return types[type] || type;
  };

  const runningTasks = tasks.filter(task => task.status === 'running').length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const failedTasks = tasks.filter(task => task.status === 'failed').length;
  const totalTasks = tasks.length;

  const clearAllTasks = () => {
    if (confirm('هل أنت متأكد من حذف جميع المهام؟')) {
      setTasks([]);
      localStorage.removeItem('scout-agent-tasks');
    }
  };

  const exportTasks = () => {
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scout-tasks-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Brain className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-semibold">مدير الوكيل الذكي</h2>
              <p className="text-sm text-muted-foreground">
                {agentStatus === 'working' ? `يعمل على ${runningTasks} مهمة` : 
                 agentStatus === 'error' ? 'خطأ في النظام' : 'في وضع الاستعداد'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={agentStatus === 'working' ? 'default' : agentStatus === 'error' ? 'destructive' : 'secondary'}>
              {runningTasks} نشطة
            </Badge>
            <Button size="sm" variant="outline" onClick={exportTasks} disabled={tasks.length === 0}>
              <Download className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={clearAllTasks} disabled={tasks.length === 0}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-gray-600">{totalTasks}</div>
            <div className="text-xs text-muted-foreground">إجمالي</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
            <div className="text-xs text-muted-foreground">مكتملة</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-blue-600">{runningTasks}</div>
            <div className="text-xs text-muted-foreground">قيد التنفيذ</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-red-600">{failedTasks}</div>
            <div className="text-xs text-muted-foreground">فاشلة</div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Tasks Panel */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">المهام الحالية</h3>
              <Button 
                size="sm" 
                onClick={() => setShowAddTask(!showAddTask)}
                className="gap-2"
                disabled={isLoading}
              >
                <Plus className="h-4 w-4" />
                مهمة جديدة
              </Button>
            </div>
            
            {/* Filter buttons */}
            <div className="flex gap-2 flex-wrap">
              {(['all', 'running', 'completed', 'failed', 'pending'] as const).map(status => (
                <Button
                  key={status}
                  size="sm"
                  variant={filter === status ? 'default' : 'outline'}
                  onClick={() => setFilter(status)}
                  className="text-xs"
                >
                  {status === 'all' ? 'الكل' : getStatusText(status)}
                  {status !== 'all' && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {tasks.filter(t => t.status === status).length}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>
          
          {showAddTask && (
            <div className="p-4 border-b border-border bg-muted/30 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="عنوان المهمة"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                />
                <Select value={newTaskPriority} onValueChange={(value: any) => setNewTaskPriority(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="الأولوية" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">منخفضة</SelectItem>
                    <SelectItem value="medium">متوسطة</SelectItem>
                    <SelectItem value="high">عالية</SelectItem>
                    <SelectItem value="urgent">عاجلة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Textarea
                placeholder="وصف المهمة أو الطلب للذكاء الاصطناعي"
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                rows={3}
              />
              
              <div className="grid grid-cols-2 gap-3">
                <Select value={newTaskType} onValueChange={(value: any) => setNewTaskType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="نوع المهمة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ai-chat">محادثة ذكية</SelectItem>
                    <SelectItem value="code-review">مراجعة كود</SelectItem>
                    <SelectItem value="documentation">توليد وثائق</SelectItem>
                    <SelectItem value="translation">ترجمة</SelectItem>
                    <SelectItem value="summarization">تلخيص</SelectItem>
                    <SelectItem value="data-analysis">تحليل بيانات</SelectItem>
                    <SelectItem value="image-generation">توليد صور</SelectItem>
                    <SelectItem value="custom">مخصص</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={newTaskProvider} onValueChange={(value: any) => setNewTaskProvider(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="مقدم الخدمة" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProviders.length > 0 ? (
                      availableProviders.map(provider => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="" disabled>
                        لا توجد مقدمي خدمة متاحين
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button 
                  size="sm" 
                  onClick={addNewTask} 
                  disabled={!newTaskTitle.trim() || !newTaskDescription.trim() || isLoading || availableProviders.length === 0}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'إضافة'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowAddTask(false)}>
                  إلغاء
                </Button>
              </div>
            </div>
          )}
          
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <Card key={task.id} className="group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {getStatusIcon(task.status)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{task.title}</h4>
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(task.status)}`} />
                            <Badge variant="outline" className="text-xs">
                              {getTaskTypeText(task.taskType)}
                            </Badge>
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} title={getPriorityText(task.priority)} />
                            {task.aiProvider && (
                              <Badge variant="secondary" className="text-xs">
                                {task.aiProvider.toUpperCase()}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {task.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                            <span>📅 {formatRelativeTime(task.createdAt)}</span>
                            {task.completedAt && (
                              <span>✅ {formatRelativeTime(task.completedAt)}</span>
                            )}
                            {task.actualDuration && (
                              <span>⏱️ {formatDuration(task.actualDuration)}</span>
                            )}
                          </div>
                          
                          {/* Progress Bar */}
                          {task.status === 'running' && (
                            <div className="space-y-1">
                              <Progress value={task.progress} className="h-2" />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{Math.round(task.progress)}%</span>
                                {task.estimatedDuration && (
                                  <span>
                                    المتبقي: {formatDuration(
                                      Math.round(task.estimatedDuration * (1 - task.progress / 100))
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Result or Error */}
                          {task.result && (
                            <div className="mt-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                              <div className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-sm text-green-700 dark:text-green-300">
                                    {task.result}
                                  </p>
                                  {task.outputs?.text && (
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="mt-2 h-6 text-xs text-green-600" 
                                      onClick={() => {
                                        setSelectedTask(task);
                                        setShowTaskDetails(true);
                                      }}
                                    >
                                      <Eye className="h-3 w-3 mr-1" />
                                      عرض التفاصيل
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {task.error && (
                            <div className="mt-2 p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                                <p className="text-sm text-red-700 dark:text-red-300">
                                  {task.error}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Task Controls */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {task.status === 'running' && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleTaskAction(task.id, 'pause')}
                            >
                              <Pause className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleTaskAction(task.id, 'stop')}
                            >
                              <Square className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        
                        {task.status === 'paused' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleTaskAction(task.id, 'resume')}
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                        )}
                        
                        {task.status === 'failed' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleTaskAction(task.id, 'retry')}
                            title="إعادة المحاولة"
                          >
                            <Loader2 className="h-3 w-3" />
                          </Button>
                        )}
                        
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            setSelectedTask(task);
                            setShowTaskDetails(true);
                          }}
                          title="عرض التفاصيل"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleTaskAction(task.id, 'delete')}
                          title="حذف المهمة"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}

              {filteredTasks.length === 0 && (
                <div className="text-center py-12">
                  <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    {tasks.length === 0 ? 'لا توجد مهام حالياً' : `لا توجد مهام ${getStatusText(filter === 'all' ? 'pending' : filter)}`}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {tasks.length === 0 ? 'ابدأ بإضافة مهمة جديدة' : 'جرب تغيير الفلتر لعرض مهام أخرى'}
                  </p>
                  {tasks.length === 0 && (
                    <Button 
                      className="mt-4" 
                      onClick={() => setShowAddTask(true)}
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      إضافة مهمة جديدة
                    </Button>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Tools Panel */}
        <div className="w-80 border-l border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold">الأدوات المتاحة</h3>
          </div>
          
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {tools.map((tool) => (
                <Card key={tool.id} className="group cursor-pointer hover:shadow-sm transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {tool.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">{tool.name}</h4>
                          <div className={`w-2 h-2 rounded-full ${getToolStatusColor(tool.status)}`} />
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {tool.description}
                        </p>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {tool.category === 'ai' ? 'ذكاء اصطناعي' : 
                             tool.category === 'development' ? 'تطوير' :
                             tool.category === 'media' ? 'وسائط' :
                             tool.category === 'analysis' ? 'تحليل' : 'أدوات'}
                          </Badge>
                          {tool.estimatedTime && (
                            <Badge variant="secondary" className="text-xs">
                              ⏱️ {formatDuration(tool.estimatedTime)}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>استخدم {tool.usageCount} مرة</span>
                          {tool.lastUsed && (
                            <span>{formatRelativeTime(tool.lastUsed)}</span>
                          )}
                        </div>
                        
                        {tool.currentTask && (
                          <Badge variant="secondary" className="text-xs mt-2">
                            {tool.currentTask}
                          </Badge>
                        )}
                        
                        {tool.status === 'disabled' && (
                          <Badge variant="outline" className="text-xs mt-2">
                            غير متاح
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
      
      {/* Task Details Dialog */}
      <Dialog open={showTaskDetails} onOpenChange={setShowTaskDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTask && getStatusIcon(selectedTask.status)}
              {selectedTask?.title}
            </DialogTitle>
          </DialogHeader>
          
          {selectedTask && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">الحالة:</span>
                  <Badge className="ml-2" variant={selectedTask.status === 'completed' ? 'default' : 
                                                  selectedTask.status === 'failed' ? 'destructive' : 'secondary'}>
                    {getStatusText(selectedTask.status)}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">الأولوية:</span>
                  <span className="ml-2">{getPriorityText(selectedTask.priority)}</span>
                </div>
                <div>
                  <span className="font-medium">النوع:</span>
                  <span className="ml-2">{getTaskTypeText(selectedTask.taskType)}</span>
                </div>
                <div>
                  <span className="font-medium">مقدم الخدمة:</span>
                  <span className="ml-2">{selectedTask.aiProvider?.toUpperCase() || 'غير محدد'}</span>
                </div>
                <div>
                  <span className="font-medium">تاريخ الإنشاء:</span>
                  <span className="ml-2">{selectedTask.createdAt.toLocaleString('ar-SA')}</span>
                </div>
                {selectedTask.completedAt && (
                  <div>
                    <span className="font-medium">تاريخ الاكتمال:</span>
                    <span className="ml-2">{selectedTask.completedAt.toLocaleString('ar-SA')}</span>
                  </div>
                )}
              </div>
              
              <div>
                <h4 className="font-medium mb-2">الوصف:</h4>
                <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                  {selectedTask.description}
                </p>
              </div>
              
              {selectedTask.outputs?.text && (
                <div>
                  <h4 className="font-medium mb-2">النتيجة:</h4>
                  <div className="text-sm p-3 bg-muted rounded-lg max-h-60 overflow-y-auto whitespace-pre-wrap">
                    {selectedTask.outputs.text}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedTask.outputs?.text || '');
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    نسخ النتيجة
                  </Button>
                </div>
              )}
              
              {selectedTask.error && (
                <div>
                  <h4 className="font-medium mb-2 text-red-600">الخطأ:</h4>
                  <p className="text-sm text-red-600 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                    {selectedTask.error}
                  </p>
                </div>
              )}
              
              {selectedTask.tags && selectedTask.tags.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">العلامات:</h4>
                  <div className="flex gap-2 flex-wrap">
                    {selectedTask.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}