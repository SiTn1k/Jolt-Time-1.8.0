# SECURITY AUDIT

**Project:** Jolt-Time - Ukrainian Historical Tapper Game  
**Audit Date:** 2026-06-19

---

## 1. CLIENT-SIDE EXPLOITS

### 1.1 localStorage Exploits

#### 1.1.1 Game State Manipulation
**Risk:** User can modify localStorage directly via DevTools

**Current Protection:**
- Expedition state synced to Supabase
- Critical actions validated server-side
- LocalStorage used as cache only

**Status:** ⚠️ PARTIAL - Some state can be manipulated locally

#### 1.1.2 Exploitable Data in localStorage
```typescript
// expedition store state
localStorage.setItem('expedition_state', JSON.stringify({...}));

// game progress
localStorage.setItem('game_progress', JSON.stringify({...}));
```

**Status:** ⚠️ MEDIUM RISK - Untrusted data from client

---

### 1.2 XP Exploits

#### 1.2.1 XP Manipulation
**Risk:** Modify XP in localStorage or via RPC

**Current Protection:**
- XP stored in Supabase
- Level ups validated server-side via `rpcUpgradeTap()`
- But: XP calculated client-side for UI

**Status:** ⚠️ PARTIAL - UI shows untrusted data

#### 1.2.2 Passive XP Exploits
**Risk:** Manipulate passive_xp_per_second

**Current Protection:**
- Server calculates passive XP on sync
- Client-side calculation for UI only

**Status:** ✅ OK - Server is authoritative

---

### 1.3 Currency Exploits

#### 1.3.1 Currency Manipulation
**Risk:** Set currency to any value

**Current Protection:**
- RLS allows anon writes (CRITICAL ISSUE)
- No server-side validation for most currency operations

**Status:** ❌ CRITICAL - Anyone can modify any user's currency

#### 1.3.2 Purchase Exploits
**Risk:** Free purchases via manipulation

**Current Protection:**
- Telegram Stars validated server-side
- No free currency generation

**Status:** ✅ OK - Payments protected

---

### 1.4 Prestige Exploits

#### 1.4.1 Force Prestige
**Risk:** Trigger prestige at any time

**Current Protection:**
- `perform-prestige` edge function
- Server-side validation

**Status:** ✅ OK - Protected

#### 1.4.2 Duplicate Prestige
**Risk:** Prestige multiple times

**Current Protection:**
- One prestige per session (enforced client-side)
- Server validates reset

**Status:** ⚠️ MEDIUM - Client-side check can be bypassed

---

### 1.5 Expedition Exploits

#### 1.5.1 Fake Expeditions
**Risk:** Create fake expedition completions

**Current Protection:**
- Expeditions stored client-side
- No server validation for completion
- Rewards credited locally

**Status:** ❌ CRITICAL - Can create infinite artifacts/prestige

#### 1.5.2 Time Manipulation
**Risk:** Speed up expeditions via clock manipulation

**Current Protection:**
- Server doesn't track expedition timers
- Client-side completion checks

**Status:** ⚠️ MEDIUM - Exploitable but limited impact

---

### 1.6 Stars Exploits

#### 1.6.1 Free Stars
**Risk:** Get boosters without paying

**Current Protection:**
- Telegram Stars validated server-side
- Webhook verification

**Status:** ✅ OK - Protected

---

## 2. RATE LIMITING

### 2.1 Missing Protections
| Action | Rate Limit | Status |
|--------|------------|--------|
| RPC calls | None | ❌ MISSING |
| Supabase writes | None | ❌ MISSING |
| Ad rewards | Server-side | ✅ OK |

---

## 3. INPUT VALIDATION

### 3.1 Client Inputs
| Input | Validation | Status |
|-------|------------|--------|
| telegram_id | HMAC validated | ✅ OK |
| booster_id | Server check | ✅ OK |
| expedition data | None | ❌ MISSING |
| quest objectives | None | ⚠️ PARTIAL |

---

## 4. DATA EXPOSURE

### 4.1 Sensitive Data
| Data | Exposure | Status |
|------|---------|--------|
| Telegram ID | Public via initData | ✅ OK |
| Bot Token | Server-side only | ✅ OK |
| User Currency | Public via RLS | ❌ ISSUE |

---

## 5. FINDINGS SUMMARY

| Category | Issues | Severity |
|----------|--------|----------|
| localStorage Exploits | 2 | MEDIUM |
| XP Exploits | 2 | MEDIUM |
| Currency Exploits | 1 | CRITICAL |
| Prestige Exploits | 2 | MEDIUM |
| Expedition Exploits | 2 | CRITICAL |
| Stars Exploits | 0 | - |
| Rate Limiting | 2 | HIGH |
| Input Validation | 2 | MEDIUM |

---

## 6. CRITICAL ISSUES

### 6.1 RLS Bypass (CRITICAL)
**File:** `supabase/migrations/001_game_progress.sql`

```sql
CREATE POLICY "anon_insert_progress" ON game_progress FOR INSERT
  TO anon, authenticated WITH CHECK (true);
```

**Impact:** Anyone can modify any user's game state

**Fix:** Move all writes to edge functions

### 6.2 Expedition Validation (CRITICAL)
**File:** `src/expedition/store.ts`

```typescript
// No server-side validation for expedition completion
// Rewards credited client-side
```

**Impact:** Infinite artifacts/prestige

**Fix:** Server must track expedition timers and completions

---

## 7. RECOMMENDATIONS

### P0 (MUST FIX)
1. **Move all game_progress writes to edge functions**
2. **Server-side expedition validation**
3. **Add rate limiting to RPC calls**
4. **Validate all expedition state changes server-side**

### P1 (SHOULD FIX)
1. **Add input validation for all client data**
2. **Add server-side achievement validation**
3. **Add expedition timer tracking to Supabase**
4. **Add daily purchase limits at DB level**

### P2 (NICE TO HAVE)
1. **Add anomaly detection for suspicious patterns**
2. **Add audit log for all state changes**
3. **Add server-side replay protection**

---

## 8. SECURITY SCORE: **40/100**

**Reason:** Critical RLS bypass, no expedition validation, no rate limiting

---

*End of Security Audit*
