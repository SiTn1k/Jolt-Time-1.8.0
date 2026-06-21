// ===== ДІАГНОСТИКА НА ПОЧАТКУ =====
console.log('=== 🚀 MAIN.TSX ЗАВАНТАЖЕНО ===');
console.log('Час:', new Date().toISOString());

// Перевірка глобальних об'єктів
console.log('📦 ГЛОБАЛЬНІ ОБ\'ЄКТИ:');
console.log('  window.Telegram:', typeof window.Telegram);
console.log('  window.WebApp:', window.Telegram?.WebApp ? '✅' : '❌');
console.log('  crypto.randomUUID:', typeof crypto?.randomUUID);
console.log('  BroadcastChannel:', typeof BroadcastChannel);
console.log('  Notification:', typeof Notification);
console.log('  localStorage:', typeof localStorage);

// Запуск debug утиліт
import { initDebug, checkGlobals, logConstructorCall } from './utils/debug';
initDebug();

// ===== ІМПОРТИ =====
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

console.log('✅ Всі імпорти виконано, монтуємо React...');

// ===== МОНТУВАННЯ =====
try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Елемент #root не знайдено!');
  }
  
  console.log('📦 Монтуємо React додаток...');
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
  console.log('✅ React змонтовано успішно');
} catch (error) {
  console.error('❌ ПОМИЛКА МОНТУВАННЯ REACT:', error);
  document.body.innerHTML = `
    <div style="padding: 20px; background: red; color: white;">
      <h1>❌ Помилка запуску додатку</h1>
      <pre>${(error as Error).stack || (error as Error).message}</pre>
    </div>
  `;
}
