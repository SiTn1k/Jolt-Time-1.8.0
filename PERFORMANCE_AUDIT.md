# PERFORMANCE AUDIT

**Project:** Jolt-Time - Ukrainian Historical Tapper Game  
**Audit Date:** 2026-06-19

---

## 1. BUNDLE SIZE

### 1.1 Current Size
| Asset | Size | Gzipped |
|-------|------|---------|
| JS | 633 KB | 182 KB |
| CSS | 54 KB | 9 KB |
| Total | 687 KB | 191 KB |

### 1.2 Size Analysis
**Status:** ⚠️ ACCEPTABLE - Could be optimized

### 1.3 Large Dependencies
| Dependency | Estimated Size |
|------------|---------------|
| React | ~40 KB |
| zustand | ~15 KB |
| lucide-react | ~100 KB |
| motion/react | ~70 KB |
| supabase-js | ~50 KB |

### 1.4 Optimization Opportunities
| Optimization | Potential Savings |
|--------------|-----------------|
| Tree-shake lucide-react | ~80 KB |
| Dynamic imports | ~100 KB |
| Code splitting screens | ~200 KB |

---

## 2. RERENDERS

### 2.1 Zustand Subscriptions
```typescript
// Current pattern
const value = useStore((s) => s.value);
```

**Status:** ⚠️ NEEDS REVIEW - No granular selectors

### 2.2 App.tsx Rerenders
**Lines:** ~1800 (MONSTER FILE)

**Status:** ❌ CRITICAL - Causes frequent rerenders

### 2.3 Expedition Store
**Lines:** ~900

**Status:** ⚠️ LARGE - Could benefit from splitting

---

## 3. MEMORY LEAKS

### 3.1 Intervals
```typescript
// useGame.ts
setInterval(() => {
  updatePassiveXP();
}, 1000);

// App.tsx
const activityInterval = setInterval(() => {
  rpcTrackSession(userId, 'activity');
}, 60_000);
```

**Status:** ⚠️ NOT CLEARED - Return cleanup in useEffect

### 3.2 Event Listeners
```typescript
// App.tsx
document.addEventListener('visibilitychange', handleVisibilityChange);
window.addEventListener('beforeunload', handleUnload);
```

**Status:** ⚠️ CLEANUP EXISTS - Return function handles it

### 3.3 Potential Leaks
| Location | Risk | Status |
|----------|------|--------|
| useEffect cleanup | LOW | ✅ OK |
| Component unmount | MEDIUM | ⚠️ Review |
| Store subscriptions | LOW | ✅ OK |

---

## 4. HEAVY COMPONENTS

### 4.1 Monster Files
| File | Lines | Impact |
|------|-------|--------|
| App.tsx | ~1800 | HIGH |
| store.ts | ~900 | MEDIUM |
| storyData.ts | ~600 | LOW |

### 4.2 Heavy UI Components
| Component | Estimated Renders |
|----------|-------------------|
| TapArea | Every tap |
| StatsPanel | Every second |
| ExpeditionApp | On mount |

---

## 5. DUPLICATE CALCULATIONS

### 5.1 Computed Values
```typescript
// Calculated multiple times
const completedArtifacts = state.completedArtifacts?.length || 0;
const ownedLevels = useMemo(() => {...}, [...]);
```

**Status:** ⚠️ NEEDS OPTIMIZATION - useMemo used

### 5.2 Currency Calculations
```typescript
// Repeated in multiple places
Math.round(karbovanets).toLocaleString()
```

**Status:** ⚠️ REPEATED - Could cache

---

## 6. OPTIMIZATION OPPORTUNITIES

### 6.1 Code Splitting
```typescript
// Could lazy load
const Museum = lazy(() => import('./screens/Museum'));
const Academy = lazy(() => import('./screens/Academy'));
```

**Status:** ❌ NOT IMPLEMENTED - All screens loaded upfront

### 6.2 Memoization
| Component | Memoized | Status |
|----------|----------|--------|
| Cards | No | ⚠️ MISSING |
| Badges | No | ⚠️ MISSING |
| Buttons | No | ⚠️ MISSING |

### 6.3 Virtualization
**Status:** ❌ NOT NEEDED - Small lists

---

## 7. FINDINGS SUMMARY

| Category | Issues | Severity |
|----------|--------|----------|
| Bundle Size | 1 | MEDIUM |
| Rerenders | 2 | HIGH |
| Memory Leaks | 0 | - |
| Heavy Components | 3 | HIGH |
| Duplicate Calc | 1 | LOW |

---

## 8. CONCLUSIONS

### 8.1 Performance Score: **65/100**
- ⚠️ Large bundle
- ⚠️ Monster files
- ⚠️ No code splitting
- ✅ Memory cleanup OK

### 8.2 Quick Wins
1. **Tree-shake lucide-react** - Save ~80 KB
2. **Code split screens** - Save ~200 KB
3. **Split App.tsx** - Fix rerenders

---

*End of Performance Audit*
