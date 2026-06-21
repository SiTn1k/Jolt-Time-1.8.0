// scripts/analyze-build.js
// Build analysis script for finding "jr" constructor issue

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== 📊 АНАЛІЗ BUILD ===\n');

// 1. Find all JS files in dist
const distPath = path.join(__dirname, '../dist');
const assetsPath = path.join(distPath, 'assets');

if (!fs.existsSync(assetsPath)) {
  console.error('❌ dist/assets не знайдено. Спочатку виконайте npm run build');
  process.exit(1);
}

const jsFiles = fs.readdirSync(assetsPath)
  .filter(f => f.endsWith('.js') && !f.endsWith('.map'));

console.log(`📁 Знайдено ${jsFiles.length} JS файлів:`);
jsFiles.forEach(f => {
  const size = fs.statSync(path.join(assetsPath, f)).size;
  console.log(`  - ${f} (${(size / 1024).toFixed(2)} KB)`);
});

console.log('\n=== 🔍 ПОШУК "jr" ===\n');

let totalJrFound = 0;

jsFiles.forEach(filename => {
  const filePath = path.join(assetsPath, filename);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Look for "jr" in context of "new"
  const matches = [];
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    // Skip very long lines that are likely minified
    if (line.length > 500) return;
    
    if (line.includes('jr') && (line.includes('new') || line.includes('jr('))) {
      matches.push({
        line: index + 1,
        content: line.trim().substring(0, 200)
      });
    }
  });
  
  if (matches.length > 0) {
    totalJrFound += matches.length;
    console.log(`⚠️ ЗНАЙДЕНО "jr" В ${filename}:`);
    matches.forEach(m => {
      console.log(`  Рядок ${m.line}: ${m.content}`);
    });
    
    // Check source map
    const mapFile = filename + '.map';
    if (fs.existsSync(path.join(assetsPath, mapFile))) {
      console.log(`  📍 Source map: ${mapFile}`);
      
      try {
        const mapContent = JSON.parse(
          fs.readFileSync(path.join(assetsPath, mapFile), 'utf8')
        );
        console.log(`  🗺️ Source map має ${mapContent.sources?.length || 0} джерел`);
        
        // Look for original file names with "jr"
        if (mapContent.sources) {
          const originalSources = mapContent.sources
            .filter(s => s.includes('jr') || s.includes('J'))
            .map(s => `    - ${s}`);
          
          if (originalSources.length > 0) {
            console.log('  📂 Оригінальні файли з "jr":');
            originalSources.forEach(s => console.log(s));
          }
        }
      } catch (e) {
        console.error(`  Помилка аналізу source map:`, e.message);
      }
    }
  }
});

if (totalJrFound === 0) {
  console.log('✅ "jr" не знайдено в JS файлах');
}

// 2. Check HTML
const htmlFiles = fs.readdirSync(distPath)
  .filter(f => f.endsWith('.html'));

htmlFiles.forEach(filename => {
  const content = fs.readFileSync(path.join(distPath, filename), 'utf8');
  if (content.includes('telegram-web-app') || content.includes('sad.min.js')) {
    console.log(`\n📄 ${filename} завантажує зовнішні скрипти:`);
    
    // Extract script tags
    const scriptMatches = content.match(/<script[^>]*>/g) || [];
    scriptMatches.forEach(tag => {
      console.log(`  ${tag}`);
    });
  }
});

console.log('\n=== 🔧 КОМАНДИ ДЛЯ ДЕБАГІНГУ ===');
console.log('1. Перевірити source map:');
console.log('   npx source-map dist/assets/*.js.map --find jr');
console.log('\n2. Пошук в білді:');
console.log('   grep -r "jr" dist/ | grep -v ".map"');
console.log('\n3. Запустити preview:');
console.log('   npm run preview');
console.log('\n✅ Аналіз завершено');
