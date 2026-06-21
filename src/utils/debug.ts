// src/utils/debug.ts
// Comprehensive debugging utilities for production

/**
 * Утиліти для дебагінгу в production
 */

// Зберігаємо всі виклики конструкторів
export const constructorLog: Array<{
  name: string;
  time: number;
  args: number;
  stack: string;
}> = [];

/**
 * Перевіряємо всі глобальні об'єкти
 */
export function checkGlobals(): void {
  console.log('=== 🌍 ПЕРЕВІРКА ГЛОБАЛЬНИХ ОБ\'ЄКТІВ ===');
  
  const globals: Record<string, unknown> = {
    // Браузерні API
    'window': typeof window,
    'document': typeof document,
    'navigator': typeof navigator,
    'localStorage': typeof localStorage,
    'sessionStorage': typeof sessionStorage,
    
    // Стандартні конструктори
    'Date': typeof Date,
    'Error': typeof Error,
    'Promise': typeof Promise,
    'Map': typeof Map,
    'Set': typeof Set,
    'URL': typeof URL,
    'URLSearchParams': typeof URLSearchParams,
    
    // Специфічні
    'crypto': typeof crypto,
    'crypto.randomUUID': typeof (typeof crypto !== 'undefined' ? crypto.randomUUID : undefined),
    'BroadcastChannel': typeof BroadcastChannel,
    'Notification': typeof Notification,
    
    // Telegram
    'Telegram': typeof (typeof window !== 'undefined' ? window.Telegram : undefined),
    'Telegram.WebApp': typeof (typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined),
    
    // React
    'React': typeof React,
    'ReactDOM': typeof ReactDOM,
  };
  
  console.table(globals);
  
  // Перевіряємо чи є "jr"
  if (typeof window !== 'undefined') {
    const keys = Object.keys(window);
    const jrKeys = keys.filter(k => 
      k.toLowerCase().includes('jr') || 
      k === 'J' || 
      k === 'JR'
    );
    
    if (jrKeys.length > 0) {
      console.warn('⚠️ ЗНАЙДЕНО "jr" В ГЛОБАЛЬНОМУ ОБ\'ЄКТІ:', jrKeys);
      jrKeys.forEach(key => {
        console.log(`  ${key}:`, (window as Record<string, unknown>)[key]);
      });
    }
  }
}

/**
 * Перевірка всіх конструкторів на етапі завантаження
 */
export function checkConstructors(): void {
  console.log('=== 🔧 ПЕРЕВІРКА КОНСТРУКТОРІВ ===');
  
  const constructors = [
    'Object', 'Array', 'Function', 'String', 'Number', 'Boolean',
    'Date', 'Error', 'Map', 'Set', 'WeakMap', 'WeakSet',
    'Promise', 'Proxy', 'Symbol', 'BigInt',
    'URL', 'URLSearchParams', 'AbortController',
    'MutationObserver', 'IntersectionObserver', 'ResizeObserver',
    'BroadcastChannel', 'MessageChannel', 'Notification',
    'Event', 'CustomEvent', 'PointerEvent', 'KeyboardEvent',
  ];
  
  constructors.forEach(name => {
    try {
      const ctor = (window as Record<string, unknown>)[name];
      const isFunction = typeof ctor === 'function';
      console.log(`  ${name}: ${isFunction ? '✅' : '❌'} (${typeof ctor})`);
      
      if (isFunction && name !== 'Function') {
        // Спробуємо перевірити, чи можна створити екземпляр
        try {
          // Не створюємо реальні екземпляри, просто перевіряємо
          const proto = Object.getPrototypeOf(ctor as object);
          console.log(`    Prototype: ${proto?.constructor?.name || 'none'}`);
        } catch {
          // Ігноруємо помилки
        }
      }
    } catch (e) {
      console.warn(`  ${name}: ❌ Помилка - ${e}`);
    }
  });
}

/**
 * Налаштування глобального обробника помилок
 */
export function setupGlobalErrorHandling(): void {
  // Зберігаємо оригінальний console.error
  const originalError = console.error;
  console.error = function(...args: unknown[]) {
    // Шукаємо "jr is not a constructor"
    const message = args.join(' ');
    if (message.includes('jr') && message.includes('constructor')) {
      console.warn('🚨 ЗНАЙДЕНО ПОМИЛКУ ПРО "jr":', message);
      console.trace('Повний стек:');
      
      // Перевіряємо всі глобальні змінні
      checkGlobals();
    }
    originalError.apply(console, args);
  };
  
  // Перехоплюємо window.onerror
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      console.error('=== 🔴 ГЛОБАЛЬНА ПОМИЛКА ===');
      console.error('Повідомлення:', event.message);
      console.error('Файл:', event.filename);
      console.error('Рядок:', event.lineno);
      console.error('Колонка:', event.colno);
      console.error('Об\'єкт:', event.error);
      console.error('Stack:', event.error?.stack);
      
      if (event.message?.includes('jr')) {
        console.error('🚨 ПОМИЛКА МІСТИТЬ "jr"!');
        checkGlobals();
      }
    });
    
    // Перехоплюємо необроблені Promise помилки
    window.addEventListener('unhandledrejection', (event) => {
      console.error('=== 🔄 НЕОБРОБЛЕНА PROMISE ПОМИЛКА ===');
      console.error('Причина:', event.reason);
      console.error('Stack:', event.reason?.stack);
    });
  }
}

/**
 * Виводить інформацію про завантажені скрипти
 */
export function checkLoadedScripts(): void {
  console.log('=== 📜 ЗАВАНТАЖЕНІ СКРИПТИ ===');
  
  if (typeof document !== 'undefined') {
    document.querySelectorAll('script').forEach((script, i) => {
      const src = script.src || 'inline';
      const loaded = script.getAttribute('data-loaded');
      console.log(`  ${i + 1}. ${src}${loaded ? ' [LOADED]' : ''}`);
    });
  }
}

/**
 * Перевіряє Telegram WebApp
 */
export function checkTelegramWebApp(): void {
  console.log('=== 📱 TELEGRAM WEBAPP ===');
  
  if (typeof window !== 'undefined' && window.Telegram) {
    console.log('  Telegram SDK: ✅ Завантажено');
    
    if (window.Telegram.WebApp) {
      console.log('  WebApp: ✅ Доступно');
      console.log('    Platform:', window.Telegram.WebApp.platform);
      console.log('    Version:', window.Telegram.WebApp.version);
      console.log('    initDataAvailable:', !!window.Telegram.WebApp.initData);
    } else {
      console.log('  WebApp: ❌ Недоступно');
    }
  } else {
    console.log('  Telegram SDK: ❌ Не завантажено');
  }
}

/**
 * Шукає "jr" в поточних скриптах
 */
export async function searchJrInScripts(): Promise<void> {
  console.log('=== 🔍 ПОШУК "jr" У СКРИПТАХ ===');
  
  if (typeof document === 'undefined') return;
  
  const scripts = document.querySelectorAll('script');
  for (const script of scripts) {
    if (script.src) {
      try {
        const response = await fetch(script.src);
        const text = await response.text();
        if (text.includes('jr') || text.includes('new jr')) {
          console.warn(`⚠️ ЗНАЙДЕНО "jr" В СКРИПТІ: ${script.src}`);
          // Показуємо контекст
          const lines = text.split('\n');
          lines.forEach((line, i) => {
            if (line.includes('jr')) {
              console.log(`  Рядок ${i + 1}: ${line.trim().substring(0, 150)}`);
            }
          });
        }
      } catch {
        // ignore CORS errors for external scripts
      }
    }
  }
}

/**
 * Логує конструктор виклик
 */
export function logConstructorCall(name: string, argsCount: number, stack: string): void {
  constructorLog.push({
    name,
    time: Date.now(),
    args: argsCount,
    stack,
  });
  
  // Якщо це "jr" - попереджаємо
  if (name === 'jr' || name.includes('jr')) {
    console.warn('🚨 ЗНАЙДЕНО КОНСТРУКТОР З "jr":', name);
    console.log('Stack:', stack);
  }
}

/**
 * Автоматичний запуск
 */
export function initDebug(): void {
  console.log('=== 🐛 ІНІЦІАЛІЗАЦІЯ ДЕБАГІНГУ ===');
  console.log('Час:', new Date().toISOString());
  console.log('User Agent:', typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A');
  
  // Налаштовуємо обробник помилок
  setupGlobalErrorHandling();
  
  // Перевіряємо глобальні об'єкти
  checkGlobals();
  
  // Перевіряємо конструктори
  checkConstructors();
  
  // Перевіряємо Telegram WebApp
  checkTelegramWebApp();
  
  // Перевіряємо скрипти
  checkLoadedScripts();
  
  // Запускаємо перевірку через 1 секунду
  setTimeout(() => {
    console.log('=== 🔄 ПОВТОРНА ПЕРЕВІРКА (1 секунда) ===');
    checkGlobals();
    checkTelegramWebApp();
  }, 1000);
  
  // І через 5 секунд
  setTimeout(() => {
    console.log('=== 🔄 ПОВТОРНА ПЕРЕВІРКА (5 секунд) ===');
    checkGlobals();
    searchJrInScripts();
  }, 5000);
  
  // Перевіряємо при unload
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      console.log('=== 👋 ДОДАТОК ЗАКРИВАЄТЬСЯ ===');
      console.log('Конструктори викликані:', constructorLog.length);
    });
  }
}

// Експортуємо для використання
export default {
  initDebug,
  checkGlobals,
  checkConstructors,
  checkTelegramWebApp,
  checkLoadedScripts,
  searchJrInScripts,
  logConstructorCall,
  constructorLog,
};
