import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Animated,
  ActivityIndicator,
  Alert,
  Share,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// ========== DEEPSEEK AI CONFIGURATION ==========
const DEEPSEEK_API_KEY = 'sk-c2e66212666242f7be29cecae4f30d7c';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// Константы
const FREE_LIMIT = 3;
const STORAGE_KEYS = {
  COUNTER: '@analysis_counter',
  HISTORY: '@analysis_history',
  SUBSCRIPTION: '@subscription_status',
  ONBOARDING: '@onboarding_completed',
};

type AnalysisMode = 'red-flag' | 'overthinking' | 'reply';

interface Analysis {
  id: string;
  mode: AnalysisMode;
  input: string;
  result: string;
  timestamp: number;
}

// ========== DEEPSEEK AI INTEGRATION ==========
const analyzeWithDeepSeek = async (mode: AnalysisMode, text: string): Promise<string> => {
  const systemPrompts = {
    'red-flag': `Ты строгий, но спокойный эксперт по психологии отношений. Анализируй переписку на предмет манипуляций, газлайтинга, эмоциональной холодности и токсичных паттернов общения.

ФОРМАТ ОТВЕТА (строго следуй структуре):

🔍 Анализ завершен

• Общая оценка: [краткая оценка ситуации]
• Эмоциональный тон: [описание тона общения]
• Красные флаги: [список тревожных признаков ИЛИ "Критических признаков не обнаружено"]

💡 Рекомендация:
[Конкретный спокойный совет, что делать дальше]

Твой тон: Спокойный аналитик. Не драматизируй, но говори правду. Если опасности нет — успокой. Если есть тревожные признаки — скажи прямо, но без паники.`,

    'overthinking': `Ты эмпатичный психолог когнитивно-поведенческой терапии. Помоги человеку понять, накручивает ли он ситуацию или есть реальные основания для беспокойства.

ФОРМАТ ОТВЕТА:

🧘‍♀️ Вероятность накручивания: [0-100]%

• Альтернативное объяснение: [рациональный взгляд на поведение другого человека]
• Валидация чувств: [признание эмоций пользователя]
• Когнитивное искажение: [если применимо: катастрофизация, чтение мыслей и т.д.]

💭 Рациональный взгляд:
[Спокойный совет, как интерпретировать ситуацию здоровым образом]

Твой тон: Валидируй эмоции, но не усиливай тревогу. Предлагай альтернативные объяснения. Будь заземляющим голосом разума.`,

    'reply': `Ты эксперт по коммуникации в романтических отношениях. Предложи три разных варианта ответа на сообщение.

ФОРМАТ ОТВЕТА (строго три варианта):

💬 Три варианта ответа:

1️⃣ Зрелый и спокойный:
"[Ответ, демонстрирующий эмоциональную зрелость и понимание]"

2️⃣ Игривый и легкий:
"[Легкий, непринужденный ответ]"

3️⃣ Установка границ:
"[Вежливый, но твердый ответ, показывающий самоуважение]"

Каждый вариант — одно сообщение (1-2 предложения максимум).`
  };

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: systemPrompts[mode]
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API Error:', errorText);
      throw new Error('Ошибка подключения к AI');
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content;
    
    if (!result) {
      throw new Error('Пустой ответ от AI');
    }

    return result;
  } catch (error: any) {
    console.error('AI Analysis Error:', error);
    throw new Error(error.message || 'Не удалось выполнить анализ. Проверь интернет-соединение.');
  }
};

// ========== ONBOARDING SCREEN ==========
const OnboardingScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const slides = [
    {
      title: 'Узнай правду',
      subtitle: 'AI анализирует переписки и раскрывает настоящие намерения',
      emoji: '🔍',
      gradient: ['#0f0e1a', '#1a1526', '#2a1f3d'],
    },
    {
      title: 'Перестань накручивать',
      subtitle: 'Получи объективный взгляд и успокой тревогу',
      emoji: '🧘‍♀️',
      gradient: ['#1a1526', '#2a1f3d', '#3a2f52'],
    },
    {
      title: 'Отвечай с уверенностью',
      subtitle: 'Умные варианты ответов для любой ситуации',
      emoji: '💬',
      gradient: ['#2a1f3d', '#3a2f52', '#4a3f68'],
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  return (
    <LinearGradient colors={slides[currentSlide].gradient} style={styles.onboardingContainer}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.onboardingSafeArea}>
        <Animated.View style={[styles.onboardingContent, { opacity: fadeAnim }]}>
          <Text style={styles.onboardingEmoji}>{slides[currentSlide].emoji}</Text>
          <Text style={styles.onboardingTitle}>{slides[currentSlide].title}</Text>
          <Text style={styles.onboardingSubtitle}>{slides[currentSlide].subtitle}</Text>
          
          <View style={styles.dotsContainer}>
            {slides.map((_, index) => (
              <View key={index} style={[styles.dot, index === currentSlide && styles.activeDot]} />
            ))}
          </View>
          
          <TouchableOpacity style={styles.continueButton} onPress={handleNext} activeOpacity={0.85}>
            <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.continueButtonGradient} start={{x:0,y:0}} end={{x:1,y:0}}>
              <Text style={styles.continueButtonText}>
                {currentSlide === slides.length - 1 ? 'Начать' : 'Далее'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
};

// ========== HOME SCREEN - APP STORE FEATURED QUALITY ==========
const HomeScreen = ({
  onAnalyze,
  onShowHistory,
  analysisCounter,
  freeLimit,
}: {
  onAnalyze: (mode: AnalysisMode, text: string) => void;
  onShowHistory: () => void;
  analysisCounter: number;
  freeLimit: number;
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedMode, setSelectedMode] = useState<AnalysisMode>('red-flag');

  const modes = [
    { id: 'red-flag' as AnalysisMode, label: 'Красные флаги', icon: '🚩', color: '#ef4444' },
    { id: 'overthinking' as AnalysisMode, label: 'Накручивание', icon: '🤔', color: '#8b5cf6' },
    { id: 'reply' as AnalysisMode, label: 'Варианты ответов', icon: '💡', color: '#6366f1' },
  ];

  const remainingAnalyses = Math.max(0, freeLimit - analysisCounter);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0f0e1a', '#1a1526', '#2a1f3d']} style={styles.gradient}>
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex:1}}>
            <ScrollView 
              style={styles.scrollView} 
              contentContainerStyle={styles.scrollContent} 
              keyboardShouldPersistTaps="handled" 
              showsVerticalScrollIndicator={false}
            >
              
              {/* Header - тихий, не кричащий */}
              <View style={styles.header}>
                <View>
                  <Text style={styles.logo}>LoveDecoder</Text>
                  <Text style={styles.subtitle}>AI психолог отношений</Text>
                </View>
                <TouchableOpacity onPress={onShowHistory} style={styles.historyButton} activeOpacity={0.7}>
                  <Text style={styles.historyIcon}>📋</Text>
                </TouchableOpacity>
              </View>

              {/* Лимит - облегченный, не тревожный */}
              {remainingAnalyses > 0 && (
                <View style={styles.limitBadge}>
                  <Text style={styles.limitText}>Осталось: {remainingAnalyses}</Text>
                  <Text style={styles.limitHint}>анализа</Text>
                </View>
              )}

              {/* Поле ввода - визуальный центр, безопасное пространство */}
              <View style={styles.inputSection}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Опиши ситуацию или вставь переписку. Можно без цензуры."
                    placeholderTextColor="#6b7280"
                    multiline
                    value={inputText}
                    onChangeText={setInputText}
                    textAlignVertical="top"
                    maxLength={5000}
                  />
                  <Text style={styles.charCounter}>{inputText.length}/5000</Text>
                </View>
              </View>

              {/* Режимы анализа - карточки с выбором, без чекбоксов */}
              <Text style={styles.modesLabel}>Режим анализа</Text>
              <View style={styles.modesContainer}>
                {modes.map((mode) => (
                  <TouchableOpacity
                    key={mode.id}
                    style={[
                      styles.modeCard,
                      selectedMode === mode.id && styles.modeCardActive,
                    ]}
                    onPress={() => setSelectedMode(mode.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.modeCardContent}>
                      <Text style={styles.modeIcon}>{mode.icon}</Text>
                      <Text style={[
                        styles.modeLabel,
                        selectedMode === mode.id && styles.modeLabelActive
                      ]}>
                        {mode.label}
                      </Text>
                    </View>
                    {selectedMode === mode.id && (
                      <View style={[styles.modeGlow, { backgroundColor: mode.color + '20' }]} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* CTA кнопка - главный акцент, subtle glow */}
              <TouchableOpacity
                style={[styles.analyzeButton, !inputText.trim() && styles.analyzeButtonDisabled]}
                onPress={() => {
                  if (inputText.trim() && inputText.trim().length >= 10) {
                    onAnalyze(selectedMode, inputText.trim());
                  } else if (inputText.trim()) {
                    Alert.alert('', 'Добавь еще несколько слов для анализа');
                  }
                }}
                disabled={!inputText.trim()}
                activeOpacity={0.85}
              >
                <LinearGradient 
                  colors={inputText.trim() ? ['#6366f1', '#4f46e5'] : ['#1f2937', '#111827']} 
                  style={styles.analyzeButtonGradient}
                  start={{x:0,y:0}} 
                  end={{x:1,y:0}}
                >
                  <Text style={styles.analyzeButtonText}>
                    {inputText.trim() ? 'Запустить анализ' : 'Введи текст для анализа'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <Text style={styles.footerText}>Анализ выполняется с помощью DeepSeek AI</Text>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

// ========== LOADING SCREEN ==========
const LoadingScreen = () => {
  const [statusText, setStatusText] = useState('Анализирую ситуацию...');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const statuses = [
    'Анализирую ситуацию...',
    'Оцениваю эмоциональный тон...',
    'Формулирую выводы...',
  ];

  useEffect(() => {
    let index = 0;
    
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();

    const interval = setInterval(() => {
      index = (index + 1) % statuses.length;
      setStatusText(statuses[index]);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <LinearGradient colors={['#0f0e1a', '#1a1526', '#2a1f3d']} style={styles.loadingContainer}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.loadingContent}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <View style={styles.loaderWrapper}>
            <ActivityIndicator size="large" color="#6366f1" />
          </View>
        </Animated.View>
        <Animated.Text style={[styles.loadingText, { opacity: fadeAnim }]}>
          {statusText}
        </Animated.Text>
      </SafeAreaView>
    </LinearGradient>
  );
};

// ========== RESULT SCREEN ==========
const ResultScreen = ({ 
  result, 
  mode, 
  onNewAnalysis 
}: { 
  result: string; 
  mode: AnalysisMode; 
  onNewAnalysis: () => void 
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }).start();
  }, []);

  const getModeInfo = () => {
    const modes = {
      'red-flag': { title: 'Анализ красных флагов', icon: '🚩', color: '#ef4444' },
      'overthinking': { title: 'Анализ накручивания', icon: '🤔', color: '#8b5cf6' },
      'reply': { title: 'Варианты ответов', icon: '💡', color: '#6366f1' },
    };
    return modes[mode];
  };

  const modeInfo = getModeInfo();

  return (
    <LinearGradient colors={['#0f0e1a', '#1a1526', '#2a1f3d']} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <Animated.View style={[styles.resultHeader, { transform: [{ scale: scaleAnim }] }]}>
            <Text style={styles.resultIcon}>{modeInfo.icon}</Text>
            <Text style={styles.resultTitle}>{modeInfo.title}</Text>
          </Animated.View>
          
          <View style={styles.resultCard}>
            <ScrollView style={styles.resultScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
              <Text style={styles.resultText}>{result}</Text>
            </ScrollView>
          </View>

          <View style={styles.resultActions}>
            <TouchableOpacity 
              style={styles.shareButton} 
              onPress={async () => {
                await Share.share({ message: `LoveDecoder - Анализ\n\n${result}` });
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.shareButtonText}>Поделиться</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.newAnalysisButton} onPress={onNewAnalysis} activeOpacity={0.85}>
              <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.newAnalysisGradient} start={{x:0,y:0}} end={{x:1,y:0}}>
                <Text style={styles.newAnalysisText}>Новый анализ</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          
          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              Это рекомендации AI. При серьезных проблемах обратись к специалисту.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

// ========== PAYWALL ==========
const PaywallScreen = ({ onRestore, onClose }: { onRestore: () => void; onClose: () => void }) => {
  return (
    <LinearGradient colors={['#0f0e1a', '#1a1526', '#2a1f3d']} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.paywallContent} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.paywallTitle}>Безлимитный AI-психолог</Text>
          <Text style={styles.paywallSubtitle}>Продолжай получать анализы и поддержку</Text>

          <View style={styles.features}>
            {[
              { icon: '✨', text: 'Безлимитные анализы' },
              { icon: '🔒', text: 'Полная анонимность' },
              { icon: '🤖', text: 'DeepSeek AI' },
            ].map((f, i) => (
              <View key={i} style={styles.feature}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
                <Text style={styles.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.planCard} activeOpacity={0.9}>
            <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.planGradient} start={{x:0,y:0}} end={{x:1,y:0}}>
              <View style={styles.planContent}>
                <View>
                  <Text style={styles.planTitle}>Подписка на неделю</Text>
                  <Text style={styles.planDesc}>Попробуй без риска</Text>
                </View>
                <Text style={styles.planPrice}>299 ₽</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.lifetimeCard} activeOpacity={0.9}>
            <View style={styles.bestBadge}>
              <Text style={styles.bestBadgeText}>💎 Лучшее</Text>
            </View>
            <View style={styles.lifetimeContent}>
              <View>
                <Text style={styles.lifetimeTitle}>Навсегда</Text>
                <Text style={styles.lifetimeDesc}>Одна покупка на всю жизнь</Text>
              </View>
              <View>
                <Text style={styles.oldPrice}>3990 ₽</Text>
                <Text style={styles.lifetimePrice}>1990 ₽</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={onRestore} style={styles.restoreButton} activeOpacity={0.7}>
            <Text style={styles.restoreText}>Восстановить покупки</Text>
          </TouchableOpacity>

          <Text style={styles.legal}>Нажимая "Купить", вы соглашаетесь с условиями использования</Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

// ========== HISTORY ==========
const HistoryScreen = ({ history, onClose }: { history: Analysis[]; onClose: () => void }) => {
  return (
    <LinearGradient colors={['#0f0e1a', '#1a1526', '#2a1f3d']} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>История анализов</Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView showsVerticalScrollIndicator={false}>
          {history.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>История пуста</Text>
            </View>
          ) : (
            history.map((item) => (
              <View key={item.id} style={styles.historyItem}>
                <View style={styles.historyItemHeader}>
                  <Text style={styles.historyItemMode}>
                    {item.mode === 'red-flag' ? '🚩 Красные флаги' : 
                     item.mode === 'overthinking' ? '🤔 Накручивание' : 
                     '💡 Ответы'}
                  </Text>
                  <Text style={styles.historyItemDate}>
                    {new Date(item.timestamp).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </Text>
                </View>
                <Text style={styles.historyItemInput} numberOfLines={2}>{item.input}</Text>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

// ========== MAIN APP ==========
export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<'home' | 'loading' | 'result' | 'paywall' | 'history'>('home');
  const [analysisCounter, setAnalysisCounter] = useState(0);
  const [currentMode, setCurrentMode] = useState<AnalysisMode>('red-flag');
  const [currentResult, setCurrentResult] = useState('');
  const [history, setHistory] = useState<Analysis[]>([]);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [onboarding, counter, hist, sub] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING),
        AsyncStorage.getItem(STORAGE_KEYS.COUNTER),
        AsyncStorage.getItem(STORAGE_KEYS.HISTORY),
        AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTION),
      ]);

      if (onboarding === 'true') setShowOnboarding(false);
      if (counter) setAnalysisCounter(parseInt(counter));
      if (hist) setHistory(JSON.parse(hist));
      if (sub === 'premium') setIsPremium(true);
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveData = async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const handleAnalyze = async (mode: AnalysisMode, text: string) => {
    if (!isPremium && analysisCounter >= FREE_LIMIT) {
      setCurrentScreen('paywall');
      return;
    }

    setCurrentMode(mode);
    setCurrentScreen('loading');

    try {
      const result = await analyzeWithDeepSeek(mode, text);
      setCurrentResult(result);
      
      const newCounter = analysisCounter + 1;
      setAnalysisCounter(newCounter);
      saveData(STORAGE_KEYS.COUNTER, newCounter.toString());

      const newAnalysis: Analysis = {
        id: Date.now().toString(),
        mode,
        input: text,
        result,
        timestamp: Date.now(),
      };
      const newHistory = [newAnalysis, ...history].slice(0, 50);
      setHistory(newHistory);
      saveData(STORAGE_KEYS.HISTORY, JSON.stringify(newHistory));

      setCurrentScreen('result');
    } catch (error: any) {
      Alert.alert('Ошибка анализа', error.message || 'Не удалось выполнить анализ');
      setCurrentScreen('home');
    }
  };

  if (showOnboarding) {
    return <OnboardingScreen onComplete={() => { 
      setShowOnboarding(false); 
      saveData(STORAGE_KEYS.ONBOARDING, 'true'); 
    }} />;
  }

  if (currentScreen === 'loading') return <LoadingScreen />;
  if (currentScreen === 'result') return <ResultScreen result={currentResult} mode={currentMode} onNewAnalysis={() => setCurrentScreen('home')} />;
  if (currentScreen === 'paywall') return <PaywallScreen onRestore={() => Alert.alert('', 'Покупки не найдены')} onClose={() => setCurrentScreen('home')} />;
  if (currentScreen === 'history') return <HistoryScreen history={history} onClose={() => setCurrentScreen('home')} />;

  return <HomeScreen onAnalyze={handleAnalyze} onShowHistory={() => setCurrentScreen('history')} analysisCounter={analysisCounter} freeLimit={FREE_LIMIT} />;
}

// ========== STYLES - APP STORE FEATURED QUALITY ==========
const styles = StyleSheet.create({
  // Base
  container: { flex: 1 },
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40 },

  // Onboarding
  onboardingContainer: { flex: 1 },
  onboardingSafeArea: { flex: 1, justifyContent: 'center' },
  onboardingContent: { alignItems: 'center', paddingHorizontal: 40 },
  onboardingEmoji: { fontSize: 96, marginBottom: 32 },
  onboardingTitle: { fontSize: 32, fontWeight: '700', color: '#f9fafb', marginBottom: 12, textAlign: 'center', letterSpacing: -0.5 },
  onboardingSubtitle: { fontSize: 17, color: '#9ca3af', textAlign: 'center', lineHeight: 26, marginBottom: 64 },
  dotsContainer: { flexDirection: 'row', marginBottom: 48 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#374151', marginHorizontal: 4 },
  activeDot: { backgroundColor: '#6366f1', width: 24 },
  continueButton: { borderRadius: 16, overflow: 'hidden', ...Platform.select({ ios: { shadowColor: '#6366f1', shadowOffset: {width:0,height:8}, shadowOpacity: 0.3, shadowRadius: 16 }, android: { elevation: 8 }})},
  continueButtonGradient: { paddingVertical: 16, paddingHorizontal: 48 },
  continueButtonText: { color: '#fff', fontSize: 17, fontWeight: '600', textAlign: 'center' },

  // Home - Header (тихий, не кричащий)
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  logo: { fontSize: 26, fontWeight: '600', color: '#e5e7eb', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 2, fontWeight: '400' },
  historyButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#1f2937', justifyContent: 'center', alignItems: 'center' },
  historyIcon: { fontSize: 20 },

  // Limit badge (облегченный)
  limitBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1f2937', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 16, marginBottom: 24, alignSelf: 'center', gap: 6 },
  limitText: { fontSize: 14, color: '#d1d5db', fontWeight: '500' },
  limitHint: { fontSize: 13, color: '#6b7280' },

  // Input (визуальный центр, безопасное пространство)
  inputSection: { marginBottom: 28 },
  inputContainer: { position: 'relative' },
  textInput: { backgroundColor: '#1f2937', borderRadius: 20, padding: 24, paddingBottom: 48, fontSize: 16, color: '#f9fafb', minHeight: 180, lineHeight: 24, borderWidth: 1, borderColor: '#374151' },
  charCounter: { position: 'absolute', bottom: 16, right: 20, fontSize: 13, color: '#6b7280' },

  // Modes (карточки, без чекбоксов)
  modesLabel: { fontSize: 15, fontWeight: '500', color: '#9ca3af', marginBottom: 12, letterSpacing: -0.2 },
  modesContainer: { gap: 10, marginBottom: 28 },
  modeCard: { position: 'relative', backgroundColor: '#1f2937', borderRadius: 16, borderWidth: 1, borderColor: '#374151', overflow: 'hidden' },
  modeCardActive: { borderColor: '#6366f1', backgroundColor: '#1e1b4b' },
  modeCardContent: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 12, zIndex: 2 },
  modeIcon: { fontSize: 20 },
  modeLabel: { fontSize: 16, fontWeight: '500', color: '#9ca3af', flex: 1 },
  modeLabelActive: { color: '#e0e7ff', fontWeight: '600' },
  modeGlow: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.15 },

  // CTA (главный акцент, subtle glow)
  analyzeButton: { borderRadius: 16, overflow: 'hidden', marginBottom: 16, ...Platform.select({ ios: { shadowColor: '#6366f1', shadowOffset: {width:0,height:8}, shadowOpacity: 0.4, shadowRadius: 16 }, android: { elevation: 8 }})},
  analyzeButtonDisabled: { opacity: 0.5, ...Platform.select({ ios: { shadowOpacity: 0 }, android: { elevation: 0 }})},
  analyzeButtonGradient: { paddingVertical: 18 },
  analyzeButtonText: { color: '#fff', fontSize: 17, fontWeight: '600', textAlign: 'center', letterSpacing: -0.3 },
  footerText: { textAlign: 'center', color: '#6b7280', fontSize: 13, marginTop: 4 },

  // Loading
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingContent: { alignItems: 'center', padding: 40 },
  loaderWrapper: { marginBottom: 24 },
  loadingText: { fontSize: 17, color: '#9ca3af', textAlign: 'center', fontWeight: '500' },

  // Result
  resultHeader: { alignItems: 'center', marginBottom: 28 },
  resultIcon: { fontSize: 48, marginBottom: 12 },
  resultTitle: { fontSize: 20, fontWeight: '600', color: '#e5e7eb', letterSpacing: -0.3 },
  resultCard: { backgroundColor: '#1f2937', borderRadius: 20, padding: 24, marginBottom: 24, maxHeight: height * 0.5, borderWidth: 1, borderColor: '#374151' },
  resultScroll: { maxHeight: height * 0.45 },
  resultText: { fontSize: 16, color: '#d1d5db', lineHeight: 26 },
  resultActions: { gap: 12, marginBottom: 20 },
  shareButton: { backgroundColor: '#1f2937', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#374151' },
  shareButtonText: { fontSize: 16, fontWeight: '600', color: '#9ca3af', textAlign: 'center' },
  newAnalysisButton: { borderRadius: 14, overflow: 'hidden' },
  newAnalysisGradient: { padding: 16 },
  newAnalysisText: { fontSize: 16, fontWeight: '600', color: '#fff', textAlign: 'center' },
  disclaimer: { padding: 16, backgroundColor: '#1f2937', borderRadius: 12, borderWidth: 1, borderColor: '#374151' },
  disclaimerText: { fontSize: 13, color: '#6b7280', textAlign: 'center', lineHeight: 20 },

  // Paywall
  paywallContent: { padding: 24, paddingTop: 60 },
  closeButton: { position: 'absolute', top: 20, right: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: '#1f2937', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  closeButtonText: { fontSize: 22, color: '#9ca3af' },
  paywallTitle: { fontSize: 28, fontWeight: '700', color: '#f9fafb', textAlign: 'center', marginBottom: 12, letterSpacing: -0.5 },
  paywallSubtitle: { fontSize: 16, color: '#9ca3af', textAlign: 'center', marginBottom: 40 },
  features: { marginBottom: 32, gap: 16 },
  feature: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1f2937', padding: 16, borderRadius: 14, gap: 12, borderWidth: 1, borderColor: '#374151' },
  featureIcon: { fontSize: 24 },
  featureText: { fontSize: 16, color: '#d1d5db', fontWeight: '500' },
  planCard: { marginBottom: 16, borderRadius: 18, overflow: 'hidden' },
  planGradient: { padding: 20 },
  planContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 4 },
  planDesc: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  planPrice: { fontSize: 28, fontWeight: '700', color: '#fff' },
  lifetimeCard: { backgroundColor: '#1f2937', padding: 20, borderRadius: 18, borderWidth: 2, borderColor: '#6366f1', position: 'relative', marginBottom: 24 },
  bestBadge: { position: 'absolute', top: -12, right: 20, backgroundColor: '#6366f1', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  bestBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  lifetimeContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lifetimeTitle: { fontSize: 18, fontWeight: '600', color: '#f9fafb', marginBottom: 4 },
  lifetimeDesc: { fontSize: 14, color: '#9ca3af' },
  oldPrice: { fontSize: 16, color: '#6b7280', textDecorationLine: 'line-through', textAlign: 'right', marginBottom: 4 },
  lifetimePrice: { fontSize: 28, fontWeight: '700', color: '#6366f1', textAlign: 'right' },
  restoreButton: { marginTop: 8, padding: 12 },
  restoreText: { color: '#6366f1', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  legal: { fontSize: 12, color: '#6b7280', textAlign: 'center', lineHeight: 18, marginTop: 16 },

  // History
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#374151' },
  historyTitle: { fontSize: 24, fontWeight: '700', color: '#f9fafb' },
  emptyState: { padding: 60, alignItems: 'center' },
  emptyStateText: { fontSize: 16, color: '#6b7280' },
  historyItem: { backgroundColor: '#1f2937', borderRadius: 16, padding: 18, margin: 12, borderWidth: 1, borderColor: '#374151' },
  historyItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  historyItemMode: { fontSize: 14, fontWeight: '600', color: '#9ca3af' },
  historyItemDate: { fontSize: 13, color: '#6b7280' },
  historyItemInput: { fontSize: 15, color: '#d1d5db', lineHeight: 22 },
});
