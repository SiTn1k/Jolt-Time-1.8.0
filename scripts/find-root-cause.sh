#!/bin/bash
# scripts/find-root-cause.sh
# Systematic root cause analysis script

echo "=== 🔍 СИСТЕМАТИЧНИЙ ПОШУК ПРИЧИНИ ==="
echo "Time: $(date)"
echo ""

# 1. Check all constructors
echo "1. ПОШУК КОНСТРУКТОРІВ:"
grep -rn "new\s\+[A-Z][a-zA-Z]*(" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -20
echo ""

# 2. Search for 'jr' in code
echo "2. ПОШУК 'jr' В КОДІ:"
grep -rn "jr" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "//.*jr" | head -10
echo ""

# 3. Check imports
echo "3. ПЕРЕВІРКА ІМПОРТІВ:"
grep -rn "^import" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -E "(from.*@|from.*\.)" | head -20
echo ""

# 4. Check for circular dependencies (if madge is available)
echo "4. ЦИРКУЛЯРНІ ЗАЛЕЖНОСТІ:"
if command -v npx &> /dev/null; then
    npx madge --circular --extensions ts,tsx src/ 2>/dev/null || echo "  madge не встановлено"
else
    echo "  npx недоступний"
fi
echo ""

# 5. Analyze build if exists
echo "5. АНАЛІЗ БІЛДУ:"
if [ -d "dist" ]; then
    echo "  Розмір головних файлів:"
    ls -lh dist/assets/*.js 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}' | head -5
    echo ""
    echo "  Пошук 'jr' в білді:"
    grep -r "jr" dist/assets/ --include="*.js" 2>/dev/null | grep -v ".map" | head -5 || echo "  Не знайдено"
    echo ""
    echo "  Пошук 'constructor' в білді:"
    grep -r "constructor" dist/assets/ --include="*.js" 2>/dev/null | grep -v ".map" | head -5 || echo "  Не знайдено"
else
    echo "  dist не знайдено, виконайте npm run build"
fi

echo ""
echo "=== ✅ ГОТОВО ==="
echo ""
echo "Для детального аналізу запустіть:"
echo "  npm run build && node scripts/analyze-build.js"
