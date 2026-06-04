# Analisis `implementation_plan_baru.md` — Status vs Kode Aktual

> **Terakhir diperbarui: 31 Mei 2026 (cross-check #2)** — diverifikasi ulang + push notifications.

---

## ✅ CROSS-CHECK — 31 MEI 2026 #2 (polish + push)

### Baru selesai (sesi ini)

| Item | Status | Bukti |
|------|--------|-------|
| **Polish 1** Skeleton `riwayat-latihan` | ✅ | `SkeletonRiwayatCards` + `riwayat-latihan.tsx` |
| **Polish 2** Quota UI AI Chat | ✅ | `GET /ai/quota` + badge header `ai-chat.tsx` |
| **Polish 3** Android `BackHandler` sesi | ✅ | `[sesiId].tsx` — konfirmasi keluar |
| **Polish 4** Error boundary root | ✅ | `components/ErrorBoundary.tsx` + `_layout.tsx` |
| **Polish 5** Streak broken + tip kelemahan | ✅ | `streak.tsx` — banner, tip, field dashboard fix |
| **3.1** Push Notifications | ✅ **Fondasi** | `expo-notifications`, `lib/push-notifications.ts`, `notifikasi.tsx`, backend scheduler |

### Push notifications — detail implementasi

| Lapisan | File / endpoint |
|---------|-----------------|
| Mobile register | `hooks/usePushNotifications.ts` → `POST /notifications/register` |
| Settings UI | `app/notifikasi.tsx` — toggle streak + laporan mingguan |
| Profil menu | `profil.tsx` → `/notifikasi` (bukan Alert lagi) |
| Backend token | `push_tokens` table + `NotificationController` |
| Scheduler | `notifications:streak-reminders` 08:00 & 20:00 WIB; `notifications:weekly-report` Minggu 09:00 WIB |
| Delivery | `ExpoPushService` → Expo Push API |

**Catatan produksi:** push di device fisik butuh build EAS + `projectId`. Scheduler butuh cron: `* * * * * php artisan schedule:run`.

### Koreksi dari cross-check #1 (sudah outdated)

| Entri cross-check #1 | **Aktual sekarang** |
|----------------------|---------------------|
| Skeleton riwayat = ActivityIndicator | ✅ Skeleton |
| Quota UI belum | ✅ Counter + endpoint |
| Error boundary belum | ✅ Ada |
| BackHandler belum | ✅ Ada |
| Streak pesan putus generik | ✅ Banner + tip kelemahan |
| **3.1** Push belum | ✅ Fondasi lengkap |

### Masih terbuka (verified)

| Item | Bukti gap |
|------|-----------|
| **3.4** AI Study Plan | Tidak ada screen/API |
| **3.7–3.8** Light mode / Google OAuth | Belum |
| **Streak S8** Kalender `active_dates` | Masih logika client; butuh `GET /streak/active-dates` |
| **Payment gateway** | Belum |
| **Purple hardcoded** | Masih di `pengawas/*`, `onboarding/university`, PBM di `latihan` |
| **Exam countdown push** | Belum (hanya streak + weekly report) |
| **Free tier AI 5 chat/hari** | Free masih blocked total (`CheckTier`) |

### Phase completion (revisi #2)

| Phase | **% aktual** |
|-------|--------------|
| Phase 1 | **~100%** |
| Phase 2 | **~90%** (quota UI, skeleton riwayat, error boundary) |
| Phase 3 | **~50%** (push fondasi, leaderboard, foto soal, review, share) |

---

## ✅ CROSS-CHECK — 31 MEI 2026 (vs kode aktual)

### Koreksi dokumen (plan lama ≠ kode sekarang)

| Entri plan | Status di dokumen lama | **Aktual di kode** |
|------------|------------------------|---------------------|
| Profil → Riwayat Latihan | Alert + link Analisis | ✅ `router.push('/riwayat-latihan')` — **bukan Alert** |
| **3.6** Share Results | ❌ Belum | ✅ `lib/share-result.ts` + tombol di hasil sesi |
| **2.6** `[sesiId].tsx` purple | ⚠️ belum | ✅ `Colors.aiAccent` (perbaikan replace sudah benar) |
| Leaderboard / Foto Soal matrix | ❌ / dead tap | ✅ Screen ada & navigasi jalan |
| Review ganda di hasil sesi | — | ✅ Diperbaiki: hanya `ReviewCtaBanner` |
| Tombol Per Bab ketutup tab | — | ✅ `TAB_BAR_CLEARANCE` + padding footer `latihan.tsx` |

### Phase completion (revisi)

| Phase | % sebelumnya | **% aktual** |
|-------|--------------|--------------|
| Phase 1 | ~100% | **~100%** (riwayat profil sudah benar di kode) |
| Phase 2 | ~80% | **~85%** |
| Phase 3 | parsial | **~35%** (banyak fitur growth belum) |

### Masih benar-benar terbuka (verified)

| Item | Bukti gap |
|------|-----------|
| **2.4** Skeleton `riwayat-latihan` | ✅ Skeleton |
| **2.8** Quota UI AI Chat | ✅ Counter + endpoint |
| **3.1** Push notifications | ✅ Fondasi (`expo-notifications` + scheduler) |
| **3.4** AI Study Plan | Tidak ada screen/API |
| **Streak S7** Pesan streak putus | ✅ Banner + tip kelemahan |
| **Error boundary** | ✅ Ada |
| **Android BackHandler** di sesi latihan | ✅ Ada |
| **Payment gateway** | Belum |
| **Purple hardcoded** | Masih di `pengawas/*`, `riwayat-latihan`, `onboarding/university`, PBM di `latihan` |

---

## 🗓️ UPDATE STATUS — 31 MEI 2026

### Yang Baru Selesai (Prioritas Tinggi — 31 Mei)

| Item | Status | Bukti |
|------|--------|-------|
| **Backend gate sesi** | ✅ | `LatihanController::mulai` + `config/ailolos.php` (2/hari free) |
| **Client sync 403** | ✅ | `latihan.tsx` → `upgrade_required` + modal |
| **Review akses** | ✅ | Banner `ReviewCtaBanner`, explore riwayat tap → review |
| **Riwayat profil** | ✅ | Menu → `/riwayat-latihan` + deskripsi review |
| **Share hasil** | ✅ | `lib/share-result.ts` + tombol di layar hasil sesi |
| **UX** Review tunggal di hasil | ✅ | Hanya `ReviewCtaBanner` (tombol duplikat dihapus) |
| **UX** Tab bar vs tombol Per Bab | ✅ | `TAB_BAR_CLEARANCE` di `latihan.tsx` |

### Yang Baru Selesai (Sesi 31 Mei — batch 2)

| Item Plan | Status | Bukti di Kode |
|-----------|--------|---------------|
| **2.6** Warna AI di `[sesiId].tsx` | ✅ **SELESAI** | Semua `#8B5CF6` → `Colors.aiAccent` |
| **Feature flags** | ✅ **Fondasi** | `lib/feature-flags.ts` + `useFeatureFlags()` |
| **PremiumGateModal** | ✅ **SELESAI** | `components/PremiumGateModal.tsx` |
| **Gate multi-sesi** | ✅ **SELESAI** | `latihan.tsx` — max 2 sesi/hari free |
| **3.3** Foto Soal screen | ✅ **SELESAI** | `foto-soal.tsx` + `expo-image-picker` |
| **SafeArea** sesi latihan | ✅ **SELESAI** | `[sesiId].tsx` header |

### Yang Baru Selesai (Sesi 31 Mei — lanjutan)

| Item Plan | Status | Bukti di Kode |
|-----------|--------|---------------|
| **2.4** Skeleton Home + Profil + Latihan bab | ✅ **SELESAI** | `SkeletonHome`, `SkeletonProfileTargets`; index/profil/latihan |
| **SafeArea** tab utama | ✅ **SELESAI** | `index`, `profil`, `latihan`, `explore` — `useSafeAreaInsets` |
| **2.6** Warna AI di tab bar & tabs | ✅ **SELESAI** | `_layout`, `index`, `profil`, `latihan`, `explore` → `Colors.aiAccent` |
| **A.5** Tab label 9pt → 10pt | ✅ **SELESAI** | `_layout.tsx` tabLabel + centerLabel |

### Yang Baru Selesai (Sesi 31 Mei)

| Item Plan | Status | Bukti di Kode |
|-----------|--------|---------------|
| **1.1** Dead tap AI Chat CTA di explore | ✅ **SELESAI** | `explore.tsx` — `onPress={() => router.push('/ai-chat')}` |
| **2.3** Tab Rekomendasi → rename "Fokus" | ✅ **SELESAI** | `explore.tsx` — label `🎯 Fokus`, header tanpa false AI branding |
| **2.4** Skeleton loading | ✅ **SELESAI (Analisis)** | `components/ui/Skeleton.tsx` + dipakai di `explore.tsx` |
| **2.6** Hardcoded `#8B5CF6` → theme | ✅ **SELESAI (sebagian)** | `theme.ts` → `Colors.aiAccent`, dipakai di explore + ai-chat |
| **2.7** AI Chat markdown rendering | ✅ **SELESAI** | `MarkdownText.tsx` + `ai-chat.tsx` |
| **2.9** AI quick suggestion auto-send | ✅ **Sudah ada** | `ai-chat.tsx:187` — `sendMsg(q)` langsung |
| **1.3** Onboarding step counter | ✅ **Sudah ada** | `challenge/university/pricing.tsx` — Langkah 1–3 |
| **1.5** Block onboarding skip user baru | ✅ **SELESAI** | `welcome.tsx` — skip hanya jika `onboarding_completed` |
| **3.2** Leaderboard screen | ✅ **Sudah ada** | `leaderboard.tsx` (full screen + SafeArea) |
| **3.5** Session Review screen | ✅ **Sudah ada** | `latihan/review.tsx` |
| **welcome** Fake stats | ✅ **Sudah ada** | benefit-based, bukan angka palsu |

---

## 🗓️ UPDATE STATUS — 30 MEI 2026

### Yang Sudah Selesai Sejak Analisis Pertama

| Item Plan | Status | Bukti di Kode |
|-----------|--------|---------------|
| **T1** Extract `normalizeTarget` ke `lib/utils.ts` | ✅ **SELESAI** | `lib/utils.ts:28` — single source, `profil.tsx:12` import dari sana |
| **T2** Fix `TargetCard` divide-by-zero | ✅ **SELESAI** | `profil.tsx:17` pakai `targetProgress()` dari utils (safe, no div-by-zero) |
| **T3** Fix flame animation memory leak | ✅ **SELESAI** | `index.tsx:42-57` pakai `useFocusEffect` + `return () => anim.stop()` |
| **T4** Home screen `Promise.all` | ✅ **SUDAH ADA** | Tidak perlu dikerjakan |
| **1.1** Dead taps Leaderboard | ✅ **SELESAI** | `profil.tsx:308` → `router.push('/leaderboard')` |
| **1.1** Dead taps Riwayat Latihan | ✅ **SELESAI** | `profil.tsx:321` → `Alert` + link ke Analisis |
| **1.1** Dead taps Notifikasi | ✅ **SELESAI** | `profil.tsx:328` → `Alert` ("segera tersedia") |
| **1.2** SNBT scale "dari 800" → "dari 1000" | ✅ **SELESAI** | `[sesiId].tsx:222` — tampilkan "dari 1000" |
| **1.2** SNBT formula fix (max 800 → 400-1000) | ✅ **SELESAI** | `[sesiId].tsx:207` — `400 + (acc/100)*600` |
| **S1** `streak.tsx` background color | ✅ **SELESAI** | `streak.tsx` fully rewritten, pakai `Colors.background` |
| **S2** Hapus data palsu Poin Harian | ✅ **SELESAI** | Section dihapus dari `streak.tsx` |
| **B.5** Tambah `useSafeAreaInsets` di streak | ✅ **SELESAI** | `streak.tsx` baru pakai `useSafeAreaInsets()` |
| **2.5** `lib/utils.ts` shared functions | ✅ **SELESAI** | `normalizeTarget`, `targetProgress`, `greetByHour`, `accuracyToSnbt` tersedia |

---

## STATUS RINGKAS PER PHASE — TERKINI

### 🔴 PHASE 1 — "Fix Before Anyone Sees It"

| Item | Status Aktual | Catatan |
|------|--------------|---------|
| **1.1** Dead taps: Leaderboard | ✅ **Selesai** | `profil.tsx` → `router.push('/leaderboard')` |
| **1.1** Dead taps: Riwayat Latihan | ✅ **Selesai** | `profil.tsx` → `/riwayat-latihan` |
| **1.1** Dead taps: Notifikasi | ✅ **Selesai** | `profil.tsx` → `/notifikasi` (settings push) |
| **1.1** Dead tap: AI Chat CTA di explore | ✅ **Selesai** | `explore.tsx` — router ke `/ai-chat` |
| **1.2** SNBT scale "dari 800" → "dari 1000" | ✅ **Selesai** | `[sesiId].tsx:222` |
| **1.2** Formula SNBT fix (400-1000) | ✅ **Selesai** | `[sesiId].tsx:207` |
| **1.3** Onboarding step counter | ✅ **Selesai** | Langkah 1–3 di onboarding screens |
| **1.4** APP_KEY backend | ✅ **Tidak relevan** | Backend sudah jalan |
| **1.5** Block onboarding skip user baru | ✅ **Selesai** | `welcome.tsx` — conditional skip |

**Phase 1 completion: ~100%** ✅

---

### 🟡 PHASE 2 — "Make It Excellent"

| Item | Status Aktual | Catatan |
|------|--------------|---------|
| **2.1** Brand color unification | ⏭️ **Skip** | Bikeshedding, tidak ada user-facing impact nyata |
| **2.2** Home screen redesign | ⚠️ **Sebagian** | `useFocusEffect` + `RefreshControl` sudah ada. Layout masih banyak section |
| **2.3** Rekomendasi tab → rename "Fokus" | ✅ **Selesai** | Tab `🎯 Fokus` + CTA latihan per baris |
| **2.4** Skeleton loading | ⚠️ **Sebagian** | Home, Analisis, Profil target, Latihan bab, **Riwayat** ✅; pengawas belum |
| **2.5** Extract shared `utils.ts` | ✅ **Selesai** | `lib/utils.ts` sudah ada dan dipakai |
| **2.6** Hardcoded colors → `theme.ts` | ⚠️ **Sebagian** | Tab utama + sesi + riwayat diagnostic ✅; pengawas, onboarding masih `#8B5CF6` |
| **2.7** AI Chat markdown rendering | ✅ **Selesai** | `MarkdownText` component |
| **2.8** AI Chat rate limit / quota | ✅ **Selesai** | `GET /ai/quota` + badge header premium/daily_pass |
| **2.9** AI Chat quick suggestions auto-send | ✅ **Selesai** | `sendMsg(q)` on press |

**Phase 2 completion: ~90%**

---

### 🟢 PHASE 3 — "Growth & Differentiation"

| Item | Status Aktual | Keterangan |
|------|--------------|------------|
| **3.1** Push Notifications | ✅ **Fondasi** | `expo-notifications` + backend scheduler + settings screen |
| **3.2** Leaderboard screen | ✅ **Selesai** | `leaderboard.tsx` — API + UI lengkap |
| **3.3** Foto Soal screen | ✅ **Selesai** | `foto-soal.tsx` → `POST /ai/photo-solve` |
| **3.4** AI Study Plan real | ❌ Belum | |
| **3.5** Session Review screen | ✅ **Selesai** | `latihan/review.tsx` |
| **3.6** Share Results | ✅ **Selesai** | `lib/share-result.ts` — share teks di layar hasil sesi |
| **3.7** Light Mode | ❌ Belum | |
| **3.8** Google OAuth | ❌ Belum | |
| **NEW** Feature Flags / Premium Gating | ⚠️ **Fondasi** | Hook + modal + gate sesi; backend usage API belum |

---

## TEMUAN KRITIS DARI BACA KODE AKTUAL

### 🔴 Temuan Baru yang TIDAK Ada di Plan

#### T1. `normalizeTarget` Duplikat di 2 File

```
index.tsx:31   — function normalizeTarget(raw: TargetRaw): Target { ... }
profil.tsx:20  — function normalizeTarget(raw: any): Target { ... }
```

Persis seperti yang plan sebut di **2.5**, tapi lebih parah dari yang diasumsikan: kedua versi punya **signature berbeda** (`TargetRaw` vs `any`). Jika ada bug di satu, yang lain tidak ikut terperbaiki. **Wajib diekstrak ke `lib/utils.ts` segera.**

#### T2. `TargetCard` di `profil.tsx:33` — Divide-by-Zero Nyata

```tsx
// profil.tsx:33
const pct = Math.min(100, (target.skor_saat_ini / target.target_nilai) * 100);
```

Jika `target_nilai === 0` (user belum pernah latihan), ini menghasilkan `Infinity` → `Math.min(100, Infinity) = 100`. Progress bar akan selalu tampak 100% untuk user baru. **Ini konfirmasi masalah yang ada di plan B.6.**

Fix yang benar:
```tsx
const pct = target.target_nilai > 0
  ? Math.min(100, (target.skor_saat_ini / target.target_nilai) * 100)
  : 0;
```

#### T3. Flame Animation di Home — Berjalan Selamanya

```tsx
// index.tsx:66-79
useEffect(() => {
  Animated.loop(
    Animated.sequence([...])
  ).start();
}, []);  // ← tidak ada cleanup, tidak ada useFocusEffect
```

Plan menyebut ini di **B.1**: animasi berjalan bahkan ketika tab tidak aktif. Konfirmasi: **tidak ada `return () => anim.stop()`**, dan tidak menggunakan `useFocusEffect`. Setiap kali user pindah tab dan kembali, loop baru dimulai di atas loop lama.

#### T4. Home Screen Sudah Punya `Promise.all` — Plan Salah Informasi

Plan **B.1** mengatakan home screen menggunakan sequential API calls. Tapi kode aktual sudah menggunakan `Promise.all`:

```tsx
// index.tsx:228 — SUDAH PARALLEL!
const [dashRes, targetRes, peluangRes] = await Promise.all([...]);
```

Ini adalah **good news** — satu item plan sudah selesai tanpa disadari. Dan `RefreshControl` juga sudah ada (`index.tsx:262`). Plan tidak perlu mengerjakan item ini.

#### T5. Upgrade Banner — Contrast Issue Nyata

```tsx
// profil.tsx:431
upgradeBannerTitle: { color: '#000', fontSize: FontSize.base, fontWeight: '800' },
upgradeBannerDesc:  { color: '#00000090', fontSize: FontSize.xs, marginTop: 2 },
```

`backgroundColor: Colors.secondary` = `#F59E0B` (amber). `color: '#00000090'` = hitam 56% opacity pada amber = contrast ratio ~3.2:1. WCAG AA butuh 4.5:1 untuk teks kecil. **Plan menyebut ini di B.6.**

#### T6. Streak Card Badges `fontSize: 9` — Di Bawah Threshold

```tsx
streakBadge: { fontSize: 9 },  // index.tsx:539
```

Plan menyebut di **A.5**: minimum acceptable adalah 10pt. Badge "🔥 STREAK AKTIF" dengan 9pt praktis tidak terbaca di arm's length.

#### T7. AI Feature Cards Navigasi Sudah Benar — Tapi Perlu Diverifikasi

```tsx
// index.tsx:401, 412, 423
onPress={() => router.push('/ai-chat')}   // ✅
onPress={() => router.push('/ai-chat')}   // ✅
onPress={() => router.push('/(tabs)/latihan')} // ✅
```

AI feature cards sudah punya `onPress`. Plan **1.1** menyebut explore.tsx CTA yang dead. Ini berbeda — perlu dicek `explore.tsx` secara terpisah.

---

## ANALISIS EFFORT vs IMPACT — Reordering Prioritas

### Kerjakan HARI INI (< 1 jam total, impact tinggi)

| # | Item | File | Effort | Impact |
|---|------|------|--------|--------|
| ✅ | Fix dead taps: Leaderboard, Riwayat, Notifikasi | `profil.tsx:329,336,343` | 5 menit | Trust |
| ✅ | Fix SNBT scale "dari 800" + formula | `latihan/[sesiId].tsx` | 10 menit | Accuracy |
| ✅ | Fix `TargetCard` divide-by-zero | `profil.tsx:33` | 2 menit | Bug |
| ✅ | Fix flame animation memory leak | `index.tsx:66` | 5 menit | Performance |
| ✅ | Fix `EditProfilModal` keyboard (Android) | `profil.tsx:125` | 2 menit | Android UX |
| ✅ | Fix streak badge `fontSize: 9` → `10` | `index.tsx:539` | 1 menit | Accessibility |

### Kerjakan MINGGU INI (1-3 hari, medium effort)

| # | Item | Effort | Mengapa Ini |
|---|------|--------|-------------|
| Extract `normalizeTarget` ke `lib/utils.ts` | 30 menit | Menghilangkan bug drift antara 2 versi |
| SafeArea insets (ganti semua Platform.OS manual) | 1-2 jam | Semua screen broken di Dynamic Island |
| Skeleton loading component | 2-3 jam | Premium feel, simple implementation |
| AI Chat: quick suggestion auto-send | 30 menit | UX jelas lebih baik |
| AI Chat: markdown rendering | 2 jam | Kualitas AI response sangat meningkat |
| Rekomendasi tab: rename "Fokus" + CTA latihan | 30 menit | Menghilangkan false AI branding |
| Onboarding welcome: hapus fake stats | 15 menit | Ethical requirement |
| Hardcoded colors → theme.ts | 1 jam | Design system health |

### Kerjakan BULAN DEPAN (high effort, high impact)

| # | Item | Mengapa Tidak Sekarang |
|---|------|----------------------|
| Leaderboard screen | Butuh screen baru yang well-designed |
| Session Review (lihat jawaban salah) | Feature besar, butuh UX design dulu |
| AI Chat: persist messages | AsyncStorage integration, need testing |
| Android back button handler di Latihan | Edge case tapi penting untuk Android |
| Foto Soal screen | Feature besar, diferensiasi kuat |
| Push Notifications | ✅ Fondasi selesai — butuh EAS build + cron |
| Light mode | ThemeContext architecture |

### JANGAN Kerjakan Sekarang

| Item | Alasan |
|------|--------|
| Brand color unification | Bikeshedding. Tidak ada user-facing impact. |
| Home screen architecture redesign | Butuh A/B testing, bisa menurunkan engagement |
| Google OAuth | Nice to have, bukan blocking |
| Custom font (Inter) | Premature visual optimization |

---

## KORELASI TEMUAN BARU vs PLAN

Plan sudah sangat lengkap, tapi ada 3 hal yang **terlewat sama sekali**:

1. **Error Boundaries** — tidak ada mention. Satu screen crash = seluruh app crash.
2. **`normalizeTarget` dua versi** — plan menyebut duplikat tapi tidak tahu dua versinya beda signature.
3. **Home screen sudah `Promise.all`** — plan salah info, item ini sudah done.

---

## REKOMENDASI EKSEKUSI

### Urutan terbaik untuk hari ini:

```
1. profil.tsx — 3 dead taps + divide-by-zero + keyboard fix  (20 menit)
2. [sesiId].tsx — SNBT scale + formula                        (10 menit)
3. index.tsx — flame animation fix + streak badge size         (10 menit)
4. welcome.tsx — hapus fake stats                              (10 menit)
```

**Total: ~50 menit. Hasilnya**: app langsung terasa lebih production-ready, tidak ada lagi trust-killers yang obvious.

### Urutan terbaik untuk minggu ini:

```
1. lib/utils.ts — extract normalizeTarget, toStr
2. SafeArea — useSafeAreaInsets di semua screen (satu per satu)
3. components/ui/SkeletonCard.tsx — buat dulu, implement belakangan
4. explore.tsx — tab rename + AI Chat CTA fix
5. ai-chat.tsx — quick suggestion auto-send + markdown
```

---

## PERTANYAAN UNTUK KEPUTUSAN

> Sebelum implementasi, perlu jawaban untuk item-item ini:

1. **Leaderboard screen** — apakah mau dibuat sekarang atau masuk backlog? Data API sudah ada (`/leaderboard`, `/leaderboard/me`), tinggal bikin UI.

2. **Session Review** — apakah sudah ada endpoint di backend untuk lihat jawaban per soal setelah sesi selesai? Ini fitur #1 yang paling dibutuhkan siswa.

3. **Welcome screen fake stats** — setuju hapus total dan ganti dengan benefit statements? Atau ada data real yang bisa dipakai?

4. **Onboarding skip** — user yang sudah `onboarding_completed`, skip tetap muncul?

---

## ANALISIS KHUSUS — `streak.tsx` (502 baris)

> Streak screen adalah **layar gamifikasi utama**. Kualitas screen ini sangat mempengaruhi retention. Berikut audit penuh dari kode aktual.

### 🔴 Bug Kritis

#### BUG 1 — Poin Harian adalah Data Palsu (Integrity Issue)

```tsx
// streak.tsx:243 — DATA PALSU!
const dayPts = 10 + (i * 3) % 20;  // formula aritmatik, bukan dari backend
```

Section "📈 Poin Harian" menampilkan poin dengan rumus `10 + (i * 3) % 20` yang **sama sekali tidak berhubungan dengan data nyata**. Hasilnya selalu: 10, 13, 16, 19, 22, 25, 28 — pattern yang sangat obvious. Siswa yang cerdas akan menyadari ini dalam 2 detik.

**Fix**: Tambah endpoint backend `GET /api/streak/history` yang return 7 hari terakhir poin, atau **hapus section ini sama sekali** sampai data nyata tersedia. Menampilkan data palsu lebih buruk dari tidak menampilkan apa-apa.

#### BUG 2 — Background Color Berbeda dari Seluruh App

```tsx
// streak.tsx:444
container: { flex: 1, backgroundColor: '#0F1117' },  // ← berbeda!

// Semua screen lain:
container: { flex: 1, backgroundColor: Colors.background },  // = '#0A0F1E'
```

`#0F1117` vs `#0A0F1E` — saat user navigate ke streak screen dari home, ada **seam visual yang jelas** karena background-nya berbeda. Ini terlihat seperti bug, bukan design intent.

**Fix (1 detik)**:
```tsx
container: { flex: 1, backgroundColor: Colors.background },
```

#### BUG 3 — Calendar Streak Heatmap Menggunakan Logika Salah

```tsx
// streak.tsx:314
const active = !isFuture && daysAgo < streak;
```

Ini mengasumsikan bahwa **semua hari dalam `streak` hari terakhir = aktif**. Padahal streak ≠ aktif setiap hari. Streak 7 artinya 7 hari BERTURUT-TURUT — bukan 7 hari aktif dalam 42 hari terakhir.

**Contoh salah**: User dengan streak 7 akan punya kalender yang menampilkan 7 kotak aktif dari hari ini ke belakang — ini benar secara konsep. TAPI jika user pernah break streak (misalnya sebelumnya streak 30, lalu putus, sekarang streak 3), kalender akan salah menampilkan hanya 3 hari aktif padahal user sudah aktif berminggu-minggu sebelumnya.

**Fix yang benar**: Backend perlu mengirim **array tanggal aktif** (bukan hanya `streak_days`), dan frontend merender berdasarkan array itu:
```tsx
// API response yang dibutuhkan:
interface DashData {
  streak: number;
  active_dates: string[];  // ['2026-05-20', '2026-05-21', ...]
}

// Di kalender:
const active = !isFuture && active_dates.includes(dateKey(d));
```

#### BUG 4 — SafeArea Masih Manual

```tsx
// streak.tsx:445
topBar: { paddingTop: Platform.OS === 'ios' ? 54 : 42 }
```

IPhone 16 Pro Max Dynamic Island membutuhkan 59pt, bukan 54pt. Ini akan broken.

---

### 🟡 UX Issues Penting

#### UX 1 — 20 PathNode Animasi Simultan → Jank di Android

```tsx
// PathNode component — setiap node active punya Animated.loop:
Animated.loop(Animated.sequence([
  Animated.parallel([...]),
  Animated.parallel([...]),
])).start();
```

Hanya 1 node yang `active === true` pada satu waktu, jadi secara teoritis hanya 1 animasi berjalan. **TAPI** tidak ada `stop()` di cleanup — jadi jika component re-render (karena parent state berubah), loop baru dimulai di atas yang lama:

```tsx
// BUG: tidak ada return cleanup di useEffect
useEffect(() => {
  if (!active) return;  // ✅ tidak start jika tidak active
  Animated.loop(...).start();  // ❌ tidak pernah di-stop
}, [active]);  // ❌ jika active berubah dari true→false, cleanup tidak berjalan
```

**Fix**:
```tsx
useEffect(() => {
  if (!active) return;
  const anim = Animated.loop(Animated.sequence([...]));
  anim.start();
  return () => anim.stop();  // ← cleanup
}, [active]);
```

#### UX 2 — TIPS Hardcoded dan Static

```tsx
const TIPS = [
  '🤖 AI: Fokus pada soal Penalaran Umum — kelemahan terbesarmu!',
  ...
];
const tip = TIPS[streak % TIPS.length];  // cycling
```

Tips ini **tidak personalized** — user dengan kelemahan Matematika tetap melihat tip tentang Penalaran Umum. Dan cycling berdasarkan `streak % 4` artinya tip selalu sama untuk streak yang sama (misal: streak 4, 8, 12 selalu dapat tip #0).

Kompromi terbaik jika tidak mau panggil AI: ambil dari backend `GET /dashboard` yang sudah return `kelemahan[]`, lalu gunakan itu:
```tsx
const tip = kelemahan[0]
  ? `💡 Fokus pada ${kelemahan[0].mapel} — akurasi kamu baru ${Math.round(kelemahan[0].skor)}%`
  : TIPS[0];
```

#### UX 3 — Tanggal SNBT Hardcoded 2026 — Akan Stale

```tsx
// streak.tsx:22-31
const SNBT_EVENTS = [
  { date: '2026-01-06', ... },
  { date: '2026-04-23', ... },
  // ...
];
```

Semua tanggal hardcoded untuk 2026. Saat ini sudah 26 Mei 2026 — SNBT April sudah lewat. Semua event yang sudah lewat akan **tidak tampil di "Agenda 90 Hari"** (sudah benar karena filter `diff >= 0`), tapi tanggal hardcoded ini akan menjadi masalah untuk SNBT 2027.

**Minimal fix**: Tambah komentar `// UPDATE SETIAP TAHUN` dan pindahkan ke file constants terpisah.
**Ideal fix**: Ambil dari endpoint konfigurasi backend.

#### UX 4 — Tidak Ada Feedback Saat Streak Putus

Jika user buka app setelah melewatkan 1 hari (streak baru jadi 0), streak screen hanya menampilkan kondisi normal streak 0. Tidak ada:
- Pesan "Streak kamu terputus kemarin"
- Motivasi untuk memulai lagi
- Info berapa hari streak terakhir yang dicapai

Ini adalah **momen emosional yang hilang** — Duolingo menggunakan momen ini sebagai upsell streak freeze. Minimal tampilkan pesan motivasi.

#### UX 5 — Node Path Tidak Terhubung ke Latihan Spesifik

Saat node menampilkan "Latihan Sekarang!", onPress-nya tidak ada. Node hanya `PathNode` tanpa `onPress`:
```tsx
<PathNode
  icon={NODE_ICONS[xi % NODE_ICONS.length]}
  done={done} active={active}
  xFrac={PATH_X[xi % PATH_X.length]}
  isChest={item.type === 'chest'}
  section={sec}
/>
// ← tidak ada onPress!
```

User yang tap node aktif tidak akan navigasi ke manapun. Harus tambah `onPress={() => router.push('/(tabs)/latihan')}`.

#### UX 6 — Section Label "Latihan Sekarang!" di Bubble vs SectionBanner Redundan

Section banner menampilkan unit aktif + judul. PathNode active menampilkan bubble "Latihan Sekarang!". CTA bawah juga menampilkan "Latihan & Jaga Streak!". **Tiga CTA berbeda untuk aksi yang sama** mengurangi kejelasan hierarki.

---

### 🟢 Yang Sudah Baik

- ✅ Milestone system (10 level, progress bar per milestone) — desain bagus
- ✅ Calendar heatmap dengan SNBT event markers — unique feature
- ✅ Streak emoji tiering (`streakEmoji()`) — detail yang menyenangkan
- ✅ Exam countdown dengan filter chip — UX yang clean
- ✅ Back button di topBar — tidak missing
- ✅ Animated fade-in pada mount — smooth

---

### Prioritas Fix Streak Screen

| # | Fix | Effort | Impact |
|---|-----|--------|--------|
| S1 | `backgroundColor: '#0F1117'` → `Colors.background` | 1 detik | Visual seam hilang |
| S2 | Hapus / ganti section "Poin Harian" dengan data nyata | 30 menit | Data integrity |
| S3 | Tambah `onPress` ke PathNode active | 5 menit | Dead tap fix |
| S4 | Fix cleanup animasi PathNode | 5 menit | Memory leak |
| S5 | Tip personalized dari `kelemahan` data | 20 menit | Relevance |
| S6 | SafeArea: ganti `paddingTop: 54` → `useSafeAreaInsets` | 5 menit | Device compatibility |
| S7 | Pesan "streak putus" untuk user streak=0 | 30 menit | Emotional UX |
| S8 | Backend: endpoint `active_dates` untuk kalender akurat | 1-2 jam | Data accuracy |

---

## 🎛️ FEATURE FLAGS — Matrix Enabled / Disabled / Premium

> Dokumen ini memetakan **status aktual setiap fitur** di aplikasi: apakah sudah berjalan, belum ada, atau seharusnya dikunci di balik paywall premium. Ini adalah fondasi untuk monetisasi.

---

### 📊 Master Feature Matrix

| Fitur | Status Teknis | Akses Saat Ini | Seharusnya | Prioritas |
|-------|--------------|----------------|------------|----------|
| **Latihan soal (1 sesi/hari)** | ✅ Berjalan | Semua user (gratis) | 🟢 Free | — |
| **Latihan soal (multi-sesi/hari)** | ✅ Berjalan (tidak ada batas) | Semua user (tidak dikunci) | 🔒 Premium | 🔴 Perlu gating |
| **AI Chat Tutor** | ✅ Berjalan | Semua user (tidak ada limit) | 🔒 Premium (quota limit free) | 🔴 Perlu rate limit |
| **Analisis Performa** | ✅ Berjalan | Semua user | 🟢 Free (basic) | — |
| **Analisis Detail per Mapel** | ✅ Berjalan | Semua user (tidak dikunci) | 🔒 Premium | 🟡 Bisa difencegating |
| **Streak & Gamifikasi** | ✅ Berjalan | Semua user | 🟢 Free | — |
| **Leaderboard** | ✅ Screen lengkap | Aktif | 🟢 Free | ✅ Selesai |
| **Foto Soal (upload gambar)** | ✅ `foto-soal.tsx` | Premium gate | 🔒 Premium | ✅ Selesai |
| **AI Study Plan** | ❌ Belum ada | Tidak tersedia | 🔒 Premium | ❌ Belum dibuat |
| **Session Review (lihat jawaban salah)** | ✅ `latihan/review.tsx` | Aktif | 🟢 Free | ✅ Selesai |
| **Jadwal Latihan (scheduling)** | ❌ Belum ada | Tidak tersedia | 🔒 Premium | ❌ Belum dibuat |
| **Push Notifications** | ✅ Fondasi | Streak + weekly | 🟢 Free | ✅ Fondasi |
| **Share Hasil Latihan** | ✅ `lib/share-result.ts` | Aktif | 🟢 Free | ✅ Selesai |
| **Dashboard Pengawas (guru)** | ✅ Berjalan | Pengawas yang approved | 🟢 Free (institutional) | — |
| **Google OAuth** | ❌ Belum ada | Tidak tersedia | 🟢 Free | ❌ Belum dibuat |
| **Light Mode** | ❌ Belum ada | Tidak tersedia | 🟢 Free | ❌ Belum dibuat |
| **Soal Tak Terbatas** | ✅ Tidak ada batas (database) | Semua user | 🔒 Premium (batas soal free) | 🟡 Perlu diputuskan |
| **Riwayat Sesi Lengkap** | ⚠️ Parsial | Semua user | 🟢 Free (30 hari) / 🔒 Premium (semua) | 🟡 Bisa ditiered |
| **Ekspor Hasil (PDF/CSV)** | ❌ Belum ada | Tidak tersedia | 🔒 Premium | ❌ Belum dibuat |

---

### 🔒 Fitur yang HARUS Segera Di-gate (Monetisasi Paling Obvious)

#### F1. Multi-Sesi Latihan Per Hari

**Kondisi saat ini**: Tidak ada batas — user bisa buka sesi latihan berkali-kali dalam sehari tanpa kendala teknis apapun.

**Masalah**: Ini menghilangkan insentif upgrade. Jika semua bisa dilakukan gratis tanpa batas, kenapa bayar?

**Proposed gating**:
```tsx
// lib/feature-flags.ts
export const LIMITS = {
  free: {
    sesiPerHari: 2,          // 2 sesi/hari untuk free
    soalPerSesi: 20,         // max 20 soal per sesi untuk free
    aiChatPerHari: 5,        // 5 pertanyaan AI/hari untuk free
    riwayatHari: 30,         // riwayat 30 hari untuk free
  },
  premium: {
    sesiPerHari: Infinity,   // unlimited
    soalPerSesi: 50,         // max 50 soal per sesi
    aiChatPerHari: Infinity, // unlimited
    riwayatHari: Infinity,   // semua riwayat
  },
};
```

**Backend check yang dibutuhkan**: `GET /api/v1/me/usage-today` → return `{ sesi_hari_ini: number, ai_chat_hari_ini: number }`

---

#### F2. AI Chat — Perlu Quota System

**Kondisi saat ini**: `ai-chat.tsx` memanggil endpoint AI tanpa cek quota apapun. Setiap user bisa spam tanpa batas → **biaya API OpenAI/Gemini tidak terkontrol**.

**Proposed flow**:
```
User kirim pesan
  ↓
Frontend cek quota (dari cache/context)
  ↓ quota habis
Tampilkan modal upgrade
  ↓ quota masih ada
Kirim ke backend → AI response
  ↓
Update quota counter
```

**Backend yang dibutuhkan**:
- `GET /api/v1/ai/quota` → `{ used: 5, limit: 5, reset_at: '2026-05-31T00:00:00Z' }`
- Backend harus track usage per user per hari

**Frontend gate (belum ada sama sekali)**:
```tsx
// ai-chat.tsx — perlu ditambah
if (quota.used >= quota.limit && !user.is_premium) {
  setShowUpgradeModal(true);
  return;
}
```

---

#### F3. Foto Soal — Natural Premium Feature

**Status**: Backend sudah siap (`/api/v1/foto-soal`), UI belum dibuat.

**Ini adalah fitur premium paling kuat** — memungkinkan siswa foto soal dari buku/lembar ujian dan langsung dapat pembahasan AI. Kompetitor tidak ada yang punya ini di harga free tier.

**Proposed tier**:
- Free: 3 foto/bulan
- Premium: unlimited

---

#### F4. Jadwal Latihan (Scheduling)

**Status**: Belum ada sama sekali — tidak ada di backend maupun frontend.

**Deskripsi fitur**: User set jadwal belajar (misal: Senin-Rabu-Jumat 19:00, 2 sesi, fokus Matematika). App akan:
1. Push notification pengingat
2. Otomatis queue sesi latihan sesuai jadwal
3. Track konsistensi jadwal vs actual

**Proposed tier**: Premium only (karena butuh push notifications + backend scheduling)

**Effort estimasi**: Backend (3-5 hari) + Frontend (2-3 hari) = ~1 minggu

---

#### F5. Analisis Detail — Bisa Ditiered

**Kondisi saat ini**: Semua analisis (per mapel, per submateri, grafik tren) tersedia gratis.

**Proposed tiering**:

| Analisis | Free | Premium |
|----------|------|---------|
| Akurasi total | ✅ | ✅ |
| Akurasi per mapel (6 mapel) | ✅ | ✅ |
| Akurasi per subtopik | ❌ | ✅ |
| Grafik tren 30 hari | ❌ | ✅ |
| Prediksi skor SNBT | ✅ (basic) | ✅ (detail, per PTN) |
| Perbandingan dengan rata-rata | ❌ | ✅ |
| Export laporan PDF | ❌ | ✅ |

---

### ✅ Fitur yang Tetap Gratis (Tidak Perlu Di-gate)

| Fitur | Alasan Gratis |
|-------|---------------|
| Latihan soal (quota harian) | Core loop — wajib gratis agar user aktif |
| Streak & gamifikasi | Retention driver — menghilangkan ini untuk free akan membunuh DAU |
| Leaderboard (read-only) | Social proof — mendorong organik word-of-mouth |
| Analisis akurasi basic | User harus tahu progresnya agar mau upgrade |
| Onboarding + target PTN | Personalization pertama — harus gratis |
| Session Review (lihat jawaban salah) | **Wajib gratis** — ini educational core, bukan fitur luxury |
| Share hasil | Viral loop — gratis = free marketing |

---

### 🏗️ Implementasi Feature Flags — Arsitektur yang Direkomendasikan

#### Opsi A: Client-Side Feature Flags (Sederhana, Mulai Dari Ini)

```tsx
// lib/feature-flags.ts
import { useAuth } from '@/contexts/AuthContext';

export type Plan = 'free' | 'premium';

export interface FeatureFlags {
  canDoMultiSesi: boolean;
  canUseAIChat: boolean;
  aiChatQuota: number; // -1 = unlimited
  canUploadFoto: boolean;
  canSetJadwal: boolean;
  canSeeDetailAnalisis: boolean;
  canExportPDF: boolean;
}

export function useFeatureFlags(): FeatureFlags {
  const { user } = useAuth();
  const isPremium = user?.is_premium === true;

  return {
    canDoMultiSesi:       isPremium,
    canUseAIChat:         true,          // semua bisa, tapi quota berbeda
    aiChatQuota:          isPremium ? -1 : 5,
    canUploadFoto:        isPremium,
    canSetJadwal:         isPremium,
    canSeeDetailAnalisis: isPremium,
    canExportPDF:         isPremium,
  };
}
```

**Penggunaan di komponen**:
```tsx
// Di latihan.tsx — gate multi-sesi
const flags = useFeatureFlags();

if (!flags.canDoMultiSesi && sesiHariIni >= 2) {
  return (
    <PremiumGateModal
      feature="Multi-Sesi Latihan"
      description="Upgrade ke Premium untuk latihan lebih dari 2 sesi per hari"
    />
  );
}
```

#### Opsi B: Server-Side Feature Flags (Ideal jangka panjang)

Backend return `user.features` di response `/api/v1/dashboard`:
```json
{
  "user": {
    "id": 1,
    "name": "...",
    "is_premium": false,
    "features": {
      "sesi_per_hari": 2,
      "ai_quota_per_hari": 5,
      "can_upload_foto": false,
      "can_set_jadwal": false
    }
  }
}
```

Ini lebih aman (tidak bisa di-bypass di frontend) dan memungkinkan A/B testing serta granular control per user.

---

### 🚀 Roadmap Implementasi Feature Gating

#### Minggu 1 — Pondasi (Tidak Perlu Monetisasi Dulu)

```
1. Tambah kolom `is_premium` di tabel `users` (backend)
2. Tambah `is_premium` ke AuthContext (frontend)
3. Buat `lib/feature-flags.ts` dengan useFeatureFlags hook
4. Buat komponen `PremiumGateModal` yang reusable
```

**Effort**: ~4 jam total, tidak ada breaking changes.

#### Minggu 2 — Gate Fitur Paling Obvious

```
5. Gate AI Chat quota (5/hari untuk free)
6. Gate multi-sesi latihan (2/hari untuk free)
7. Tambah `usage_today` tracking di backend
8. Tambah upgrade CTA di profil.tsx (sudah ada UI-nya, tinggal fungsikan)
```

#### Bulan Berikutnya — Fitur Premium Baru

```
9. Foto Soal UI (backend sudah ada)
10. Analisis detail per subtopik
11. Jadwal latihan (butuh push notifications dulu)
12. Export PDF
```

---

### ⚠️ Yang Perlu Diputuskan Sebelum Gating

> Jawab 4 pertanyaan ini dulu sebelum mengimplementasikan paywall:

1. **Harga premium?** — Rp 29.000/bulan? Rp 99.000/3 bulan? Free selamanya untuk early users?

2. **Payment gateway?** — Midtrans? Xendit? Duitku? Ini butuh integrasi backend yang significant.

3. **Model bisnis sekolah?** — Apakah sekolah bisa bayar per-siswa (B2B)? Ini lebih scalable daripada B2C individual.

4. **Grace period free users** — Berapa lama fitur yang sekarang gratis tetap gratis setelah gating diterapkan? Perlu komunikasi ke user existing.

---

### 📋 Summary: Urutan Implementasi Feature Flags

| Langkah | Action | Effort | Impact |
|---------|--------|--------|--------|
| **1** | Tambah `is_premium` ke DB + AuthContext | 1 jam | Fondasi |
| **2** | Buat `useFeatureFlags()` hook | 30 menit | Reusable |
| **3** | Buat `PremiumGateModal` component | 1 jam | UX gating |
| **4** | Gate AI Chat quota (5/hari free) | 2 jam | Revenue protection |
| **5** | Gate multi-sesi (2/hari free) | 1 jam | Revenue protection |
| **6** | Tambah usage tracking di backend | 3 jam | Data untuk gating |
| **7** | Buat Foto Soal UI (premium only) | 3-4 hari | Premium differentiator |
| **8** | Jadwal latihan (premium only) | 1 minggu | Premium differentiator |
| **9** | Payment gateway integration | 1-2 minggu | Actual monetization |

---

## 🚀 REKOMENDASI LANJUTAN

### Sudah kuat (jangan sentuh dulu kecuali bug)

- Phase 1 lengkap · onboarding · SNBT · dead taps · backend + client gate sesi
- Review flow (hasil → banner → `/latihan/review`, explore riwayat, riwayat-latihan)
- Foto Soal · Leaderboard · Feature flags fondasi · Share hasil

### Prioritas menengah — minggu ini (impact tinggi, risiko rendah)

| Urutan | Item | Status |
|--------|------|--------|
| **1** | Skeleton `riwayat-latihan.tsx` | ✅ Selesai |
| **2** | Quota counter di AI Chat | ✅ Selesai |
| **3** | Android `BackHandler` di `[sesiId].tsx` | ✅ Selesai |
| **4** | Error boundary root `_layout.tsx` | ✅ Selesai |
| **5** | Streak: pesan streak putus + tip kelemahan | ✅ Selesai |
| **6** | Bersihkan `#8B5CF6` sisa | ⏳ Terbuka |

### Prioritas growth — butuh keputusan / effort besar

| Item | Status / Blocker |
|------|------------------|
| Push notifications (streak reminder) | ✅ Fondasi — butuh EAS build + cron production |
| Payment (Midtrans/Xendit) | ❌ Harga paket + webhook |
| AI Study Plan | ❌ Desain + API baru |
| Kalender streak akurat | ❌ `GET /streak/active-dates` backend |
| Free tier AI 5 chat/hari | ❌ Ubah `CheckTier` + `RateLimitAI` |
| Light mode / Google OAuth | ❌ Belum |

### Keputusan produk (sebelum coding monetisasi penuh)

1. Free user boleh AI chat terbatas (5/hari) atau tetap premium-only?
2. Harga final Premium / Daily Pass?
3. Payment provider?

**Saran urutan kerja berikutnya:** bersihkan `#8B5CF6` sisa → **payment gateway** → AI Study Plan → exam countdown push → kalender streak akurat.
