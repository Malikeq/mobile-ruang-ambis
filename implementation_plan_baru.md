# 🚀 AI Lolos PTN — What to Implement Next

> A prioritized, opinionated proposal. Items are grouped into 3 phases ordered by impact vs. effort. Read the rationale for each — they matter.

---

## 🔴 PHASE 1 — "Fix Before Anyone Sees It" (1–3 Days)

These are blocking issues. A real user hitting any of these in the first 5 minutes will uninstall.

---

### 1.1 Fix All Dead Tap Buttons

**Why first**: Nothing kills trust faster than buttons that do nothing.

**Files to change:**

#### [profil.tsx](file:///c:/Users/muel/Desktop/ruangambis/mobile-ruang-ambis/app/(tabs)/profil.tsx) — 3 dead handlers
```diff
- onPress={() => {}}  // Leaderboard → replace with:
+ onPress={() => router.push('/leaderboard')}

- onPress={() => {}}  // Riwayat Latihan → replace with:
+ onPress={() => { setActiveTab('riwayat'); router.push('/(tabs)/explore'); }}

- onPress={() => {}}  // Notifikasi → replace with:
+ onPress={() => Alert.alert('Segera Hadir', 'Notifikasi push akan tersedia di versi berikutnya! 🔔')}
```

#### [explore.tsx](file:///c:/Users/muel/Desktop/ruangambis/mobile-ruang-ambis/app/(tabs)/explore.tsx) — AI Chat CTA has no onPress
```diff
- <TouchableOpacity style={styles.aiCtaBtn}>
+ <TouchableOpacity style={styles.aiCtaBtn} onPress={() => router.push('/ai-chat')}>
```

---

### 1.2 Fix the Practice Session Result Screen — Wrong SNBT Scale

**Why critical**: The results screen (`[sesiId].tsx` line 207) says **"dari 800"** but the real SNBT scale is **400–1000**. This misleads students about their actual score.

```diff
- <Text style={[st.scoreMax, { color: Colors.textMuted }]}>dari 800</Text>
+ <Text style={[st.scoreMax, { color: Colors.textMuted }]}>dari 1000</Text>
```

Also fix the SNBT estimation formula at line 207:
```diff
- const snbt = hasilAkhir || Math.round(400 + (acc / 100) * 400);  // gives max 800
+ const snbt = hasilAkhir || Math.round(400 + (acc / 100) * 600);  // correct: 400–1000
```

---

### 1.3 Fix Onboarding Step Counter

**File**: `university.tsx`  
**Why**: It says "Langkah 2 dari 3" on a 5-step flow. Students will feel lied to.
```diff
- <Text>Langkah 2 dari 3</Text>
+ <Text>Langkah 3 dari 5</Text>
```

---

### 1.4 Add APP_KEY to Backend

**Why**: Without this, Sanctum tokens fail silently on fresh installs, locking users out.
```bash
cd backend-ruang-ambis
php artisan key:generate
```
Then commit the `.env` change (or better, document it in `.env.example`).

---

### 1.5 Block Onboarding Skip on First Login

**Why**: Users who skip onboarding go to a completely empty dashboard — no target, no data, no AI context. This makes the AI useless and the home screen all "—" placeholders.

**Proposed approach**: In `welcome.tsx`, hide the "Langsung masuk ke dashboard" button if the user has never completed onboarding (check `user.onboarding_completed` from AuthContext).

```tsx
{user?.onboarding_completed && (
  <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
    <Text>Langsung masuk ke dashboard</Text>
  </TouchableOpacity>
)}
```

---

## 🟡 PHASE 2 — "Make It Excellent" (1–2 Weeks)

These are high-ROI improvements that dramatically improve the core experience.

---

### 2.1 🎨 UNIFY THE BRAND COLOR (Highest Visual Impact)

**Problem**: Mobile uses `#1A56DB` (navy blue), Web uses `#0ea5e9` (sky blue). They look like different products.

**Decision**: Pick ONE. My recommendation: **keep the mobile navy `#1A56DB`** — it feels more premium and serious for an exam prep tool. Sky blue feels too playful for SNBT stress.

**Changes needed**:
- `frontend-ruang-ambis/app/globals.css`: Change `--primary: #0ea5e9` → `--primary: #1A56DB`
- `frontend-ruang-ambis/app/globals.css`: Change `--primary-dark: #0284c7` → `--primary-dark: #1E3A8A`
- `frontend-ruang-ambis/app/globals.css`: Change `--primary-light: #38bdf8` → `--primary-light: #3B82F6`
- Update all hardcoded `#0ea5e9` hex values in `page.tsx` and other web components

---

### 2.2 📱 Redesign the Home Screen — Reduce Information Overload

**Problem**: 9 sections on the home screen causes decision paralysis. Students open the app wanting ONE thing: start studying.

**Proposed Home Screen Architecture**:

```
┌─────────────────────────────────────┐
│  Halo, [Name]!  🔥 Streak: 7 hari  │  ← Simple greeting + streak (1 line)
├─────────────────────────────────────┤
│     SNBT Score Hero Card            │  ← Skor & gap (existing, keep it)
├─────────────────────────────────────┤
│  [🎯 Mulai Latihan Sekarang]        │  ← PRIMARY CTA — full-width, bold
├─────────────────────────────────────┤
│  Target PTN (1 card, swipeable)     │  ← Keep, but max 1 card visible
├─────────────────────────────────────┤
│  📊 Progres Hari Ini                │  ← Show only if user has practiced today
│  🤖 AI Tips (1 rotating tip)        │  ← Replace AI Features section
└─────────────────────────────────────┘
```

**What to REMOVE from home screen**:
- ❌ "AI Feature Cards" (Tanya AI, Foto Soal, Analisis) → move these to the Analisis tab or AI Chat screen
- ❌ "Exam Countdown" section → move to Streak screen (it's already there!)
- ❌ "Mapel Progress" bars → move to Analisis tab (also already there)
- ❌ Peluang Lolos banner → make it part of the Target PTN card, not a separate section

---

### 2.3 🤖 Make "Rekomendasi" Tab Actually AI-Powered

**Problem**: The current "🤖 Rekomen" tab in Analisis just shows top-3 weaknesses reformatted. This is misleading — it's labeled AI but isn't.

**Option A (Quick fix)**: Rename the tab from "🤖 Rekomen" to "📋 Fokus". Remove the AI branding from it. Add a CTA: "Minta rencana belajar personal dari AI →" that opens the AI Chat with a prefilled prompt.

**Option B (Real fix)**: Add a new API endpoint `GET /api/ai/study-plan` that calls Gemini with the user's weaknesses, target PTN, and days until exam. Cache the result for 24 hours. Display this in the Rekomendasi tab.

**Recommendation**: Do Option A now, Option B in Phase 3.

---

### 2.4 Add Skeleton Loading States

**Problem**: Every screen shows a plain spinner. This feels cheap and slow even when it's fast.

**Implementation**: Create a reusable `SkeletonCard` component:

```tsx
// components/SkeletonCard.tsx
import { Animated, View } from 'react-native';

export function SkeletonCard({ height = 80 }: { height?: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.8, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  
  return (
    <Animated.View style={{
      height, borderRadius: 16, backgroundColor: Colors.surfaceElevated, opacity
    }} />
  );
}
```

Replace `ActivityIndicator` on: Home, Analisis, Latihan, Profil screens.

---

### 2.5 Extract Shared Utilities

**Problem**: `normalizeTarget()` and `toStr()` are duplicated across 3+ files.

**Create**: `mobile-ruang-ambis/lib/utils.ts`

```typescript
export function normalizeTarget(raw: any): Target {
  const k = raw.kampus;
  const j = raw.jurusan;
  return {
    kampusLabel:   typeof k === 'string' ? k : (k?.akronim || k?.nama || 'PTN'),
    jurusanLabel:  typeof j === 'string' ? j : (j?.nama || 'Jurusan'),
    target_nilai:  raw.target_nilai ?? (typeof j === 'object' ? j?.passing_grade_estimate : 0) ?? 0,
    skor_saat_ini: raw.skor_saat_ini ?? 0,
  };
}

export function toStr(v: any): string {
  if (!v) return '';
  if (typeof v === 'string') return v;
  return v.nama ?? v.akronim ?? v.kode ?? '';
}
```

Then import from this file in `index.tsx`, `profil.tsx`, `explore.tsx`, `ai-chat.tsx`.

---

### 2.6 Consolidate All Hardcoded Colors into `theme.ts`

**Problem**: Colors like `#8B5CF6`, `#CE82FF`, `#EC4899`, `#FF9600` appear scattered across 8+ files. When you change branding, you'd have to hunt them all down.

**Add to `constants/theme.ts`**:
```typescript
export const Colors = {
  // ... existing
  
  // AI / Purple accent
  ai: '#8B5CF6',
  aiLight: '#CE82FF',
  
  // Extra subject colors (for Latihan screen)  
  pink: '#EC4899',
  orange: '#F97316',
  cyan: '#06B6D4',
  lime: '#84CC16',
  
  // Duolingo-style (for Streak screen)
  streakGreen: '#58CC02',
  streakBlue: '#1CB0F6',
  streakOrange: '#FF9600',
};
```

---

### 2.7 AI Chat — Add Markdown Rendering

**Problem**: AI responses contain `**bold**`, `\n` newlines, bullet points — but the chat renders them as raw strings. The result looks messy for rich AI responses.

**Quick fix**: Use `react-native-markdown-display` (already common in Expo projects):
```bash
npx expo install react-native-markdown-display
```

Replace `<Text style={st.bubbleText}>{m.text}</Text>` with `<Markdown style={markdownStyles}>{m.text}</Markdown>` for AI bubbles only.

---

### 2.8 AI Chat — Add Rate Limit Feedback

**Problem**: When a free user hits the AI rate limit (30/day), they just see a generic error. They won't understand why and will churn.

**Proposed UX**: When the API returns a 429 or a specific rate limit message, show an inline "upgrade" prompt inside the chat bubble:

```tsx
if (json?.message?.includes('limit') || res.status === 429) {
  setMsgs(prev => [...prev, {
    role: 'ai',
    text: '⚡ Kamu sudah mencapai batas chat hari ini.\n\n**Upgrade ke Premium** untuk chat tanpa batas + 30× per hari.\n\n[Lihat Paket Premium →]',
    isUpsell: true,  // triggers special styling + CTA button
  }]);
}
```

---

## 🟢 PHASE 3 — "Growth & Differentiation" (Month 2+)

These features are what will make the app go viral and build long-term retention.

---

### 3.1 📲 Push Notifications (Biggest Retention Driver)

**Why this is critical**: Streak protection is the #1 retention mechanic for edtech. Without push notifications, users forget to open the app after day 3. Duolingo's entire retention model is built on this.

**What to implement**:
- **Daily streak reminder**: "🔥 Jangan putus streak-mu! Latihan sekarang sebelum jam 12 malam."
- **Exam countdown alert**: "📝 SNBT tinggal 30 hari! Kamu butuh +45 poin untuk aman."
- **Weekly progress report**: "📊 Minggu ini: 47 soal dikerjakan, skor naik 8%. Mantap!"

**Implementation**: Use `expo-notifications` + Laravel's notification system + a scheduling job.

---

### 3.2 🏆 Real Leaderboard Screen

**Problem**: The Leaderboard menu item in Profil does nothing. The backend has the `poin_harian`/`ranking` system. This feature is 90% done — just needs a screen.

**Proposed screen features**:
- Weekly leaderboard (resets every Monday)
- Filter by school (`asal_sekolah`)
- Your rank highlighted
- Top 3 get special badges

This is a social feature. Social features drive virality. Students will show their rank to friends → downloads.

---

### 3.3 📸 Photo Scan Feature (Foto Soal)

**Problem**: The landing page prominently sells "📸 Foto Soal → Solusi Instan" but the mobile app has no photo scan screen. The backend endpoint `POST /api/ai/foto-soal` exists — it just needs a UI.

**This is a KEY differentiator** versus Ruangguru/Zenius. Implement it.

**Proposed flow**:
1. User taps "Foto Soal" from home quick actions
2. Camera opens with a cropping guide overlay
3. Photo is sent to `POST /api/ai/foto-soal`
4. AI returns DCSEF explanation
5. User can save or share

---

### 3.4 🧠 Real AI Study Plan in Rekomendasi Tab

Replace the fake Rekomendasi tab with a real AI-generated 7-day or 30-day study plan:

**Prompt to Gemini**:
```
User Profile:
- Target PTN: [kampus] [jurusan] (passing grade: [X])
- Current estimated SNBT score: [Y]
- Days until SNBT: [Z]
- Top 3 weaknesses: [mapel1, mapel2, mapel3]
- Sessions this week: [N]

Generate a specific 7-day study plan with:
1. Which subject to focus each day
2. How many questions per day
3. Which sub-topics to prioritize
4. One tip per day

Format as JSON with day, subject, questions, sub_topics[], tip fields.
```

Cache for 24h. Regenerate on demand.

---

### 3.5 📊 Session Review Screen (Post-Practice Deep Dive)

**Problem**: After finishing a session, you see a score and two buttons (Latihan Lagi / Ke Beranda). There's no way to review which questions you got wrong and WHY.

**Proposed**: Add a "Lihat Pembahasan" button on the results screen that shows:
- All questions in the session
- Green ✓ / Red ✗ indicators
- For wrong answers: correct answer highlighted
- AI explanation inline (lazy-loaded)

This is the #1 feature request in any test-prep app. Students want to understand their mistakes.

---

### 3.6 🔗 Share Results Feature

**Why**: Indonesian students love sharing their progress. "Saya dapat 750 di SNBT estimasi!" is free marketing.

**Implementation**:
- On results screen, add a "Bagikan" button
- Generate a shareable image card (score, subject, streak, PTN target) using `expo-view-shot`
- Share to WhatsApp, Instagram Stories

**Impact**: Each share = potential new user + social proof that replaces the fake stats.

---

### 3.7 🌞 Light Mode for Mobile

**Why**: Dark mode looks great but Indonesian students use their phones outdoors. High ambient brightness makes dark text on dark background unreadable.

**Implementation**:
- Wrap `Colors` in a function that reads from a `ThemeContext`
- ThemeContext provides `dark` (default) or `light`
- Add toggle in Profil screen
- Store preference in AsyncStorage

Light mode palette suggestion:
```typescript
const LightColors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceElevated: '#F1F5F9',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#334155',
  textMuted: '#64748B',
  // Keep primary/secondary/success/error same
};
```

---

### 3.8 🔐 Google OAuth Login

**Why**: Indonesian students hate forms. Most have a Google account. "Masuk dengan Google" removes the biggest signup friction. Critical for conversion.

**Backend**: Laravel Socialite + Google provider  
**Mobile**: `expo-auth-session` + Google OAuth

---

## 📊 Implementation Summary

| Phase | Items | Est. Time | Impact |
|-------|-------|-----------|--------|
| **Phase 1** | 5 critical fixes | 1–3 days | 🔴 Blocking issues resolved |
| **Phase 2** | 8 UX improvements | 1–2 weeks | 🟡 Quality jumps from 60% → 85% |
| **Phase 3** | 8 growth features | 1–2 months | 🟢 Differentiation & virality |

---

## 🤔 Open Questions for You

> [!IMPORTANT]
> Before I start implementing, I need your answers on these:

1. **Brand color**: Do you want to keep mobile navy (`#1A56DB`) or web sky blue (`#0ea5e9`) as the unified primary? Or a different color entirely?

2. **Home screen**: Do you want me to redesign the home screen first (high visual impact), or fix bugs first (lower risk)?

3. **Phase 1 now**: Should I start implementing Phase 1 fixes immediately? They're all small, targeted changes.

4. **Foto Soal priority**: Is the photo scan feature (3.3) high priority for you? It's a strong differentiator but needs more work.

5. **AI Study Plan**: Do you want a real Gemini-powered study plan (3.4) or is the "top 3 weaknesses" display good enough for now?

---

# 🎨 UI/UX Engineering Audit — Mobile App

> Deep-dive analysis of every screen through the lens of production-grade UI/UX engineering. Issues are ranked by severity: 🔴 Critical · 🟡 Important · 🟢 Polish.

---

## A. FOUNDATION ISSUES (Apply Everywhere)

### A.1 🔴 SafeArea — Every Screen Is Broken on Edge-Case Devices

**Problem**: Every screen uses manual platform offsets (`Platform.OS === 'ios' ? 60 : 48`) for top padding. This hardcoded approach breaks on:
- iPhones with Dynamic Island (58px safe area, not 60px)
- iPhones without notch (20px, not 60px)
- Android devices with punch-hole cameras (variable)

**Fix**: Install and use `react-native-safe-area-context` (already a dep in Expo):

```tsx
// Replace this pattern (everywhere):
header: { paddingTop: Platform.OS === 'ios' ? 60 : 48, ... }

// With this:
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const insets = useSafeAreaInsets();
// then:
header: { paddingTop: insets.top + 12, ... }
```

**Files affected**: ALL screens — `index.tsx`, `latihan.tsx`, `explore.tsx`, `profil.tsx`, `[sesiId].tsx`, `ai-chat.tsx`, `peluang-lolos.tsx`, `streak.tsx`.

---

### A.2 🔴 Touch Targets Are Too Small in Critical Places

Apple HIG and Android Material both require minimum **44×44pt** touch targets. These fail:

| Location | Current Size | Problem |
|----------|-------------|----------|
| `gridDot` in session | 34×34 | Question number tiles — primary navigation |
| Tab bar `tabTouch` | ~44×22 (label squishes it) | Primary app navigation |
| Back buttons (arrow icon only) | Icon size only, no padding | Hard to tap, especially one-handed |
| Timer duration chips in latihan | `flex:1` across 7 chips | Each chip ≈28px wide on small phones |
| Filter chips in latihan | `paddingHorizontal: 14, paddingVertical: 8` | 8px vertical = 32pt total — too small |

**Fix pattern** (apply to all):
```tsx
// Bad:
<TouchableOpacity style={{ width: 34, height: 34 }}>

// Good:
<TouchableOpacity 
  style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}  // extends tap area without changing layout
>
```

---

### A.3 🔴 Android Keyboard Handling is Wrong

**Files**: `ai-chat.tsx`, `profil.tsx` (EditProfilModal)

```tsx
// Current (WRONG for Android):
<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

// Fixed:
<KeyboardAvoidingView 
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
>
```

On Android with `undefined`, the keyboard covers the input field entirely. Users cannot see what they're typing.

---

### A.4 🟡 No Custom Font — Typography Breaks Brand Consistency

The web frontend uses **Inter** (via Google Fonts). The mobile app uses the system default (San Francisco on iOS, Roboto on Android). These look visually different.

**Fix**:
```bash
npx expo install expo-font @expo-google-fonts/inter
```

```tsx
// app/_layout.tsx
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold, Inter_900Black } from '@expo-google-fonts/inter';

// In root layout:
const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold, Inter_900Black });
```

Then in `theme.ts`, add font family references:
```typescript
export const FontFamily = {
  regular:   'Inter_400Regular',
  semibold:  'Inter_600SemiBold',
  bold:      'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
  black:     'Inter_900Black',
};
```

---

### A.5 🟡 Font Sizes Below Accessibility Threshold

WCAG 2.1 requires minimum **12pt** for body text. These violate it:

| Value | Used for | Fix |
|-------|----------|-----|
| `fontSize: 9` | Tab labels, list counts, calendar dates | Min 10pt acceptable for labels; 9pt is too small |
| `fontSize: 8` | Calendar day headers, stats sub-labels | Bump to 10pt |
| `fontSize: 10` (many) | Secondary stats, metadata | Acceptable as-is if weight is 600+ |

**Critical**: The tab bar labels at `fontSize: 9` are almost unreadable at arm's length on a phone. Bump to `fontSize: 10` minimum.

---

### A.6 🟡 Accessibility Labels Missing Everywhere

No screen has `accessibilityLabel`, `accessibilityRole`, or `accessibilityHint` on interactive elements. Screen reader (VoiceOver/TalkBack) users cannot use this app.

**Quick wins** (highest impact first):
```tsx
// Tab bar items
<TouchableOpacity accessibilityRole="tab" accessibilityLabel={`${tab.label}, ${focused ? 'selected' : 'not selected'}`}>

// Primary CTA buttons
<TouchableOpacity accessibilityRole="button" accessibilityLabel="Mulai latihan soal">

// Answer options (session screen)
<TouchableOpacity accessibilityRole="radio" accessibilityLabel={`Pilihan ${p.label}: ${p.konten}`} accessibilityState={{ selected: selectedId === p.id }}>
```

---

### A.7 🟡 Color-Only State Indicators (Colorblind Issue)

In `[sesiId].tsx`, correct/wrong answers are shown using **green/red only** with no icon differentiation in the grid dots:

```tsx
// Current: color-only feedback in QuestionGrid
if (hasAns && correct)  { bg = Colors.success + '30'; ... }  // green
if (hasAns && !correct) { bg = Colors.error + '30';   ... }  // red
```

For deuteranopia users (8% of males), green and red look identical.

**Fix**: Add an icon or shape cue:
```tsx
// In QuestionGrid, alongside the number:
{hasAns && correct  && <Text style={{ fontSize: 7 }}>✓</Text>}
{hasAns && !correct && <Text style={{ fontSize: 7 }}>✗</Text>}
```

---

### A.8 🟡 No Haptic Feedback on Key Interactions

Premium apps use haptics for: answering questions, completing sessions, streak milestones, correct answers. It makes the experience feel polished and responsive.

```bash
npx expo install expo-haptics
```

```tsx
import * as Haptics from 'expo-haptics';

// On correct answer:
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

// On wrong answer:
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

// On tab press:
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// On streak milestone:
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
```

---

### A.9 🟡 Android Back Button Breaks 3-Screen Latihan Flow

**File**: `latihan.tsx`

The Latihan screen uses an internal state machine (`screen: 'list' | 'config' | 'bab'`). When a user navigates to `config` and presses Android back, they exit the app instead of returning to `list`.

**Fix**: Use `useEffect` + `BackHandler`:
```tsx
import { BackHandler } from 'react-native';

useEffect(() => {
  const sub = BackHandler.addEventListener('hardwareBackPress', () => {
    if (screen === 'config' || screen === 'bab') {
      setScreen(screen === 'bab' ? 'config' : 'list');
      return true;  // prevent default back behavior
    }
    return false;  // allow default (exit tab)
  });
  return () => sub.remove();
}, [screen]);
```

---

### A.10 🟡 `Colors.secondary` and `Colors.warning` Are Identical

**File**: `theme.ts`

```typescript
secondary: '#F59E0B',  // amber
warning: '#F59E0B',    // amber — SAME!
```

This is a semantic design system error. `secondary` should be a brand color. `warning` should be a semantic state color. They happen to be the same value now, but if you change the secondary brand color, warnings will change too — and vice versa.

**Fix**:
```typescript
secondary: '#F59E0B',   // amber — brand accent
warning:   '#F59E0B',   // keep same for now, but semantically separate
// When you rebrand: secondary could become purple, warning stays amber
```

At minimum, document this distinction in a comment.

---

## B. SCREEN-BY-SCREEN AUDIT

### B.1 Home Screen (`index.tsx`) — Information Architecture Failure

**🔴 9 content sections violates hierarchy principle.** A screen with 9 equal-weight sections has no primary action. Students don't know where to look.

**🔴 5 sequential API calls on mount should be `Promise.all`:**
```tsx
// Current: sequential (slow)
const fetchDashboard = async () => { ... }  // called
const fetchTargets = async () => { ... }     // called separately
const fetchPeluang = async () => { ... }     // called separately

// Better: parallel
const [dash, targets, peluang] = await Promise.all([
  fetch(`${API_BASE}/dashboard`, ...),
  fetch(`${API_BASE}/user/targets`, ...),
  fetch(`${API_BASE}/user/peluang-lolos`, ...),
]);
```
This alone will reduce initial load time by 60%+.

**🟡 The streak flame animation runs even when the tab is not active**, consuming CPU in background. Wrap with `useFocusEffect` from `expo-router`:
```tsx
import { useFocusEffect } from 'expo-router';

useFocusEffect(useCallback(() => {
  const anim = Animated.loop(...);
  anim.start();
  return () => anim.stop();  // cleanup on tab blur
}, []));
```

**🟡 No pull-to-refresh** — students returning to the app want fresh data, not cached data from hours ago. Add `RefreshControl` to the main ScrollView.

**🟡 Quick action buttons have no visual hierarchy** — all 4 are the same size and weight. "Mulai Latihan" should be dominant (larger, filled), others secondary (outlined).

---

### B.2 Latihan Screen (`latihan.tsx`) — Configuration UX

**🟡 Timer duration row overflows on small screens.** 7 chips in a single row (`flex: 1` each) on a 320pt-wide phone gives each chip ~40pt width. On 375pt phones it's fine, but on 320pt iPhones (SE) it will be very cramped.

**Fix**: Wrap in 2 rows or use a horizontal `ScrollView`:
```tsx
// Replace the static row with:
<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm }}>
  {TIMER_OPTS.map(m => (<TimerChip ... />))}
</ScrollView>
```

**🟡 "Tryout" mode shows `count` in the summary as 85** — hardcoded. This should come from the API, not hardcoded. If the backend changes the tryout count, the UI will be wrong.

**🟡 The custom toggle switch has no animation** — the thumb just jumps left/right. Add spring animation:
```tsx
const thumbPos = useRef(new Animated.Value(timerEnabled ? 1 : 0)).current;

const toggleTimer = () => {
  const newVal = !timerEnabled;
  setTimerEnabled(newVal);
  Animated.spring(thumbPos, { toValue: newVal ? 1 : 0, useNativeDriver: true }).start();
};
```

**🟢 Subject cards don't show practice count or last-practiced date** — a missed opportunity to show progress at a glance. Even a small "Terakhir: 2 hari lalu" under the subject name would help students prioritize.

---

### B.3 Practice Session (`[sesiId].tsx`) — The Core Product Loop

**🔴 `QuestionGrid` is defined inside the render function** — it re-creates on every state change:
```tsx
// Current (WRONG): defined inside SesiScreen body
function QuestionGrid() { ... }  // ← re-created every render!

// Fix: move outside SesiScreen, or memoize
const QuestionGrid = React.memo(function QuestionGrid({ total, index, answers, results, onPress }: GridProps) {
  // ...
});
```

**🔴 SNBT scale is wrong**: shows "dari 800", actual scale is 400–1000. Also the fallback formula `Math.round(400 + (acc / 100) * 400)` gives max 800 — wrong.
```diff
- const snbt = hasilAkhir || Math.round(400 + (acc / 100) * 400);
+ const snbt = hasilAkhir || Math.round(400 + (acc / 100) * 600);
```

**🟡 No swipe gesture between questions** — every other exam app (Duolingo, Photomath) supports swipe-left/right for next/prev. Students expect this on mobile. Use `react-native-gesture-handler`'s `PanGestureHandler` or Expo's `expo-gestures`.

**🟡 Answer feedback is only text/color — no animation** — when a student gets the correct answer, there's no celebration moment. A brief scale pop on the correct option + green shimmer would reinforce the learning moment:
```tsx
// On correct answer submit:
Animated.sequence([
  Animated.timing(correctScale, { toValue: 1.06, duration: 120, useNativeDriver: true }),
  Animated.spring(correctScale,  { toValue: 1, useNativeDriver: true }),
]).start();
```

**🟡 Long `wacana` reading passages have no max-height with scroll** — a passage could be 2000 characters, pushing the question and answer choices completely off screen. Wrap in a constrained `ScrollView`:
```tsx
<ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
  <Text style={st.wacanaText}>{soal.wacana}</Text>
</ScrollView>
```

**🟡 "Next" button is disabled until answered, but there's no skip option** — students who are unsure on SNBT can skip and come back. This is how the real test works. Add a "Lewati" option:
```tsx
// When not yet answered:
<TouchableOpacity onPress={goNext} style={st.skipLink}>
  <Text style={st.skipLinkText}>Lewati soal ini →</Text>
</TouchableOpacity>
```

**🟡 Results screen has no "Review Jawaban" CTA** — after seeing the score, students can only "Latihan Lagi" or go home. There's no way to review which specific questions they got wrong. This is the most-requested feature in any test-prep app.

**🟢 The motivational message on results is hardcoded and generic** — it's the same 3 strings for any score. The AI Tutor could generate a short personalized message here (1 sentence). This is a great, low-effort AI touch point.

---

### B.4 Analisis Screen (`explore.tsx`) — Data Visualization Issues

**🔴 `ScoreRing` is not an actual ring** — it's a `View` with a `borderWidth`. This means it's a full circle border, not a partially-filled arc that indicates progress. It's visually misleading — a "score ring" at 42% should show a partial arc at 42%, not a full circle border with "42" inside.

**Fix**: Use `react-native-svg` to draw an actual SVG arc, or use a simpler approach with a library like `react-native-circular-progress`. The current implementation communicates nothing about the actual score level.

**🟡 Bar chart labels are cut at the first word** (`d.mapel.split(' ')[0]`) — this turns "Penalaran Umum" into "Penalaran" and "Pemahaman Bacaan" into "Pemahaman", making the chart labels ambiguous. Use subject codes instead:
```tsx
// Better: use kode (PU, PPU, PBM etc.) which are already short and unambiguous
<Text style={barStyles.label}>{d.kode ?? d.mapel.split(' ')[0]}</Text>
```

**🟡 The "⚠️ Lemah", "📊 Progres" tab labels mix emoji + text inconsistently** — some are truncated on smaller phones. Replace emoji with icon from `Ionicons`:
```tsx
// Instead of emoji tabs:
const TABS = [
  { id: 'kelemahan',   label: 'Lemah',   icon: 'warning-outline' },
  { id: 'progres',     label: 'Progres', icon: 'bar-chart-outline' },
  { id: 'rekomendasi', label: 'Rekomen', icon: 'sparkles-outline' },
  { id: 'riwayat',     label: 'Riwayat', icon: 'time-outline' },
];
```

**🟡 Empty state for "Rekomendasi" has no actionable CTA** — it says "Rekomendasi akan muncul setelah kamu latihan" but doesn't link to Latihan. Add:
```tsx
<TouchableOpacity onPress={() => router.push('/(tabs)/latihan')}>
  <Text>Mulai Latihan Sekarang →</Text>
</TouchableOpacity>
```

**🟡 The AI Chat CTA at the bottom has no `onPress`** — already flagged in Phase 1, but worth noting as a UX pattern issue too: CTAs without navigation are worse than no CTA at all because they erode trust.

---

### B.5 AI Chat (`ai-chat.tsx`) — Conversational UX

**🔴 Messages are lost on screen exit** — there's no persistence. A student asks a long question, gets a great answer, leaves the screen, comes back: gone. Students expect chat history to persist, at minimum for the current session.

**Fix**: Store messages in `AsyncStorage` with a key per user, restore on mount:
```tsx
useEffect(() => {
  AsyncStorage.getItem(`chat_history_${user?.id}`).then(json => {
    if (json) setMsgs(JSON.parse(json));
  });
}, []);

// On new message:
AsyncStorage.setItem(`chat_history_${user?.id}`, JSON.stringify(updatedMsgs));
```

**🟡 Typing indicator is static dots** — no animation. It looks broken:
```tsx
// Replace static dots with animated version:
function TypingIndicator() {
  const dots = [0, 1, 2].map(() => useRef(new Animated.Value(0)).current);
  
  useEffect(() => {
    dots.forEach((dot, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 200),
          Animated.timing(dot, { toValue: -6, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0,  duration: 300, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);
  
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {dots.map((dot, i) => (
        <Animated.View key={i} style={[st.dot, { transform: [{ translateY: dot }] }]} />
      ))}
    </View>
  );
}
```

**🟡 Quick suggestion buttons fill the input but don't auto-send** — students tap a suggestion expecting it to send. The current UX requires a second tap on the send button, which is unexpected and feels broken.

**Fix**: Auto-send on quick suggestion tap:
```tsx
// Current:
onPress={() => { setInput(q); }}

// Better:
onPress={() => {
  setInput(q);
  // Trigger send with the suggestion text directly:
  handleSend(q);  // refactor send() to accept optional override text
}}
```

**🟡 AI response text doesn't render markdown** — bold text (`**bold**`), newlines, bullet points are rendered as raw characters. The quality of AI explanations suffers significantly.

**🟢 No character counter for the 500-char limit** — users who type long questions don't know they're approaching the limit until they suddenly can't type more.
```tsx
// Add below the input:
<Text style={{ color: input.length > 450 ? Colors.error : Colors.textMuted, fontSize: 10 }}>
  {input.length}/500
</Text>
```

---

### B.6 Profile Screen (`profil.tsx`) — Trust & Personalization

**🔴 Dead tap items destroy trust** — already in Phase 1. Repeating here because it's the single biggest trust-breaker on this screen.

**🟡 Avatar is a letter-on-circle with no image upload** — for a product that promises personalization, showing a generic avatar feels impersonal. Either:
- Use `expo-image-picker` to allow profile photo upload
- OR generate unique, beautiful avatar art (e.g., gradient patterns based on user ID) instead of just the first letter

**🟡 Upgrade banner uses black text on amber yellow** — this fails WCAG contrast ratio for body text. `#000000` on `#F59E0B` has a contrast ratio of ~6.5:1 which technically passes AA, but at `fontSize: 11` it fails. Use `#000000` on a lighter amber or go `#fff` on darker amber.

**🟡 Target PTN card's `skor_saat_ini: 0` when user has no score** divides by zero in the percentage calculation:
```tsx
const pct = Math.min(100, (target.skor_saat_ini / target.target_nilai) * 100);
// If target_nilai is 0: NaN → shows 100% (wrong!)
```

**Fix**:
```tsx
const pct = target.target_nilai > 0 
  ? Math.min(100, (target.skor_saat_ini / target.target_nilai) * 100)
  : 0;
```

**🟢 The logout confirmation dialog uses native `Alert`** — on iOS this looks fine, on Android it feels dated. Consider using a custom bottom sheet confirmation instead for a more premium feel.

---

### B.7 Streak Screen (`streak.tsx`) — Gamification Layer

**🔴 Daily points data is completely fake:**
```tsx
// This is fabricated data — not from the API:
const dayPts = 10 + (i * 3) % 20;  // ← fake formula
```
This shows users fabricated point history. If they compare what the app says vs. what they actually remember earning, they'll notice the lie. Fetch real daily points from the backend or don't show this section.

**🔴 Streak screen background color is different from the rest of the app:**
```tsx
// streak.tsx:
container: { backgroundColor: '#0F1117' }  // ← different!

// All other screens:
container: { backgroundColor: Colors.background }  // Colors.background = '#0A0F1E'
```
This creates a visible color seam when navigating between screens. Use `Colors.background`.

**🟡 20 animated path nodes all run simultaneously** — each has its own `Animated.loop` with `useEffect`. On a mid-range Android phone, 20 simultaneous animation loops will cause visible jank.

**Fix**: Only animate the active node, not all 20:
```tsx
// PathNode component:
useEffect(() => {
  if (!active) return;  // already conditional
  // But also stop other animations: only 1 node is ever active
  ...
}, [active]);
// ✓ Already conditionally returns — just ensure old animations are properly cleaned up
```

**🟡 Path node icons are random emojis** (cycling through `NODE_ICONS`) with no semantic meaning. In Duolingo, each node represents a specific lesson topic. Here, they're decorative noise. Either:
- Map each node to a real topic (mapel name)
- Or just use consistent star/checkmark icons for completed vs. locked

**🟢 The SNBT event dates are hardcoded to 2026** — they'll be stale in 2027. Should be fetched from a config endpoint or at minimum stored in a constants file with a clear "UPDATE THIS EVERY YEAR" comment.

---

### B.8 Peluang Lolos (`peluang-lolos.tsx`) — Data Presentation

**🟡 `SkorCompare` uses color alone to distinguish markers** — the amber line (minimum entry score) and green line (safe score) look identical to colorblind users.

**Fix**: Add shape or label cues:
```tsx
// Add text labels directly on/above the markers:
<View style={{ position: 'absolute', left: `${masukPct}%`, top: -16 }}>
  <Text style={{ fontSize: 8, color: '#F59E0B' }}>MIN</Text>
</View>
<View style={{ position: 'absolute', left: `${amanPct}%`, top: -16 }}>
  <Text style={{ fontSize: 8, color: '#10B981' }}>AMAN</Text>
</View>
```

**🟡 "Hitung Estimasi" button has no explanation of what it does** — students don't know if "estimasi" is a real calculation or a guess. Add a brief tooltip or subtitle:
```tsx
<Text style={{ color: Colors.textMuted, fontSize: 10, marginTop: 4 }}>
  Dihitung dari riwayat latihanmu
</Text>
```

**🟢 Priority badge (#1, #2, #3) uses a plain `surfaceElevated` background** — consider using a ranked color system (gold/#1, silver/#2, bronze/#3) to make priorities visually intuitive at a glance.

---

### B.9 Onboarding (`welcome.tsx`) — First Impression

**🔴 Fake stats are a trust liability:**
```tsx
{ value: '10K+', label: 'Pengguna aktif' },  // fabricated
{ value: '50K+', label: 'Soal tersedia' },    // check if real
{ value: '92%',  label: 'Berhasil lolos' },   // definitely fabricated
```

Replace with either real numbers from the API or benefit-focused statements:
```tsx
{ value: '🤖', label: 'AI Personal' },
{ value: 'DCSEF', label: 'Metode 5 Langkah' },
{ value: '4K+', label: 'Kampus & PTN' },  // this one is real from the DB
```

**🟡 The skip button ("Langsung masuk ke dashboard") is always visible** — it should be hidden for first-time users with no onboarding data. Already covered in Phase 1 (1.5), but the UX reason: allowing skip means the AI has zero context, making the core value proposition completely invisible.

**🟢 The particle animation uses `setInterval` with 60ms interval** — that's ~16fps on the JS thread. Consider replacing with a Lottie animation or `react-native-reanimated` worklets that run on the UI thread for smoother 60fps particles.

---

### B.10 Floating Tab Bar (`_layout.tsx`) — Navigation

**🟡 The purple AI center button color (`#7C3AED`) is not in `theme.ts`** — it's a hardcoded third color that doesn't appear anywhere else in the design system:
```tsx
centerBtn: { backgroundColor: '#7C3AED' }  // not in Colors
glowRing:  { backgroundColor: '#8B5CF6' }  // different purple, also not in Colors
centerLabel: { color: '#8B5CF6' }          // third purple variant
```

Add to theme:
```typescript
export const Colors = {
  // ...
  ai:      '#7C3AED',  // AI Tutor purple
  aiLight: '#8B5CF6',  // AI light accent
};
```

**🟡 The glow ring animation** (`Animated.loop` on `opacity` from 0.5→1→0.5) **runs forever in background**. Wrap in `useFocusEffect` or listen to app state to stop when app is backgrounded.

**🟢 The tab bar has no blur/glassmorphism on iOS** — `Colors.surface` (`#111827`) is a flat dark background. On iOS, real tab bars use `UIBlurEffect`. Add via `expo-blur`:
```tsx
import { BlurView } from 'expo-blur';

// Replace the pill's backgroundColor with:
<BlurView intensity={60} tint="dark" style={st.pill}>
  {/* tab items */}
</BlurView>
```

---

## C. COMPONENT ARCHITECTURE RECOMMENDATIONS

### C.1 Create These Shared Components (Currently Missing)

```
mobile-ruang-ambis/components/
├── ui/
│   ├── SkeletonCard.tsx        — Animated loading placeholder
│   ├── ScoreArc.tsx            — Real SVG arc for scores (replace fake ScoreRing)
│   ├── EmptyState.tsx          — Consistent empty state: icon + title + CTA
│   ├── ErrorState.tsx          — Consistent error state: icon + message + retry
│   ├── SectionHeader.tsx       — Consistent section labels
│   └── PressableScale.tsx      — TouchableOpacity with spring scale animation
├── practice/
│   ├── QuestionGrid.tsx        — Extract from [sesiId].tsx
│   ├── AnswerOption.tsx        — Extract from [sesiId].tsx
│   └── DCSEFPanel.tsx          — Extract from [sesiId].tsx (150+ lines)
└── charts/
    ├── ProgressBar.tsx         — Reusable animated progress bar
    └── BarChart.tsx            — Extract from explore.tsx
```

### C.2 Replace All Raw `fetch` with a Centralized API Client

Every screen does:
```tsx
const res = await fetch(`${API_BASE}/endpoint`, {
  headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
});
```

This means: no retry logic, no timeout handling, no global error handling, no token refresh.

**Create `lib/apiClient.ts`**:
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const TIMEOUT_MS = 10_000;

export async function apiGet<T>(path: string, token: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    
    if (res.status === 401) {
      // Token expired — clear and redirect to login
      await clearToken();
      router.replace('/auth/login');
      throw new Error('Unauthorized');
    }
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('Request timeout — periksa koneksi.');
    throw e;
  }
}
```

---

## D. UX IMPROVEMENTS SUMMARY TABLE

| # | Issue | Screen | Severity | Effort |
|---|-------|--------|----------|--------|
| A.1 | SafeArea insets — manual platform values | All | 🔴 | Low |
| A.2 | Touch targets < 44pt | Session, Latihan, Tabs | 🔴 | Low |
| A.3 | Android keyboard handling broken | Chat, Profile modal | 🔴 | Low |
| A.4 | No custom font (Inter) | All | 🟡 | Medium |
| A.5 | Font sizes below 10pt | Tabs, Calendar | 🟡 | Low |
| A.6 | No accessibility labels | All | 🟡 | Medium |
| A.7 | Color-only state indicators | Session grid | 🟡 | Low |
| A.8 | No haptic feedback | Session, Tabs | 🟡 | Low |
| A.9 | Android back breaks Latihan flow | Latihan | 🟡 | Low |
| A.10 | Colors.secondary === Colors.warning | theme.ts | 🟡 | Low |
| B.1 | Sequential API calls (slow home screen) | Home | 🔴 | Low |
| B.1 | Streak animation runs in background | Home | 🟡 | Low |
| B.2 | Timer chips overflow on small phones | Latihan | 🟡 | Low |
| B.3 | QuestionGrid defined inside render | Session | 🔴 | Low |
| B.3 | SNBT scale shows "dari 800" (wrong) | Session | 🔴 | Low |
| B.3 | No swipe between questions | Session | 🟡 | High |
| B.3 | No answer feedback animation | Session | 🟡 | Medium |
| B.3 | Wacana has no max-height | Session | 🟡 | Low |
| B.3 | No skip question option | Session | 🟡 | Medium |
| B.3 | No review wrong answers after session | Session | 🟡 | High |
| B.4 | ScoreRing is not a real arc | Analisis | 🟡 | Medium |
| B.4 | Bar chart cuts subject names | Analisis | 🟡 | Low |
| B.4 | Emoji tabs truncate on small screens | Analisis | 🟡 | Low |
| B.5 | Messages not persisted across sessions | AI Chat | 🔴 | Medium |
| B.5 | Typing indicator has no animation | AI Chat | 🟡 | Low |
| B.5 | Quick suggestions don't auto-send | AI Chat | 🟡 | Low |
| B.5 | No markdown rendering for AI text | AI Chat | 🟡 | Medium |
| B.6 | Divide-by-zero on empty target score | Profile | 🟡 | Low |
| B.7 | Fake daily points data | Streak | 🔴 | Low |
| B.7 | Different background color from rest | Streak | 🔴 | Low |
| B.7 | 20 simultaneous animations | Streak | 🟡 | Medium |
| B.8 | Color-only score comparison markers | Peluang | 🟡 | Low |
| B.9 | Fake social proof stats in onboarding | Welcome | 🔴 | Low |
| C.1 | Missing shared component library | All | 🟡 | High |
| C.2 | No centralized API client | All | 🟡 | High |
