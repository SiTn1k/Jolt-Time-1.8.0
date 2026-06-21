# PHASE 2 REPORT: ACADEMY TIMELINE UNLOCK

**Date:** 2026-06-19
**Status:** Ready for Implementation

---

## CORE RULES (MANDATORY)

1. **Academy Timeline = Phase 2**, not a separate game
2. **Single economy** - no duplicate currencies
3. **Unlock:** `state.prestigeLevel >= 2` ONLY
4. **NO new state:** No rebirthLevel, academyPrestige, academyUnlockedState
5. **Ukrainian default:** `defaultLocale = "uk"`
6. **Supabase persistence** for all new systems

---

## 1. SOURCE OF TRUTH

```typescript
const isAcademyUnlocked = state.prestigeLevel >= 2;
```

**NO additional state variables required.**

---

## 2. UNLOCK TRIGGER LOCATION

**File:** `src/App.tsx` (line 265)

```tsx
if ((state.prestigeLevel || 0) >= 2) {
  return <ExpeditionApp />;
}
```

---

## 3. ACADEMY UNLOCK SEQUENCE

### 3.1 Trigger

- When `prestigeLevel === 2` AND player visits Academy first time
- Show cinematic modal once per player

### 3.2 Modal Content

| Element | Ukrainian |
|---------|----------|
| Title | "Академія Часу Відкрита" |
| Text | "Ваші дослідження змінили саму тканину часу. Відтепер ви можете керувати Академією Часу та досліджувати історію України." |
| Button | "Розпочати дослідження" |

### 3.3 After Close

Show `<ExpeditionApp />`

---

## 4. FILES TO CREATE

| File | Purpose |
|------|---------|
| `src/components/AcademyUnlockModal.tsx` | Cinematic unlock modal |

---

## 5. FILES TO MODIFY

| File | Changes |
|------|---------|
| `src/App.tsx` | Add AcademyUnlockModal integration |
| `src/i18n/uk.json` | Add unlock modal translations |
| `src/i18n/en.json` | Add unlock modal translations |

---

## 6. NO CHANGES REQUIRED

- `supabase/functions/perform-prestige/` — unchanged
- `supabase/migrations/` — unchanged
- `src/expedition/store.ts` — unchanged
- `src/expedition/` screens — unchanged

---

## 7. VERIFICATION CHECKLIST

- [x] prestigeLevel is source of truth
- [x] Unlock condition: prestigeLevel >= 2
- [x] No new state variables
- [x] Ukrainian is default locale
- [x] Files identified

---

**Waiting for approval to begin implementation.**
