# 🏫 Fitur Pengawas Sekolah — Implementation Plan

> **Konteks**: Pengawas adalah akses khusus untuk pihak sekolah (guru BK, wali kelas, kepala sekolah) yang dapat memonitor seluruh siswa dari sekolah yang sama. Siswa terhubung ke sekolah melalui field `asal_sekolah` saat onboarding, yang sudah dinormalisasi ke tabel `sekolah` di database.

---

## 📊 Status Saat Ini — Apa yang Sudah Ada

### ✅ Backend (Sudah Selesai — Sangat Solid)

| Endpoint | Fungsi | Status |
|----------|--------|--------|
| `POST /pengamat/register` | Daftar akun Pengawas → pending approval | ✅ Done |
| `GET /pengamat/status` | Cek status approval (pending/approved/rejected) | ✅ Done |
| `GET /pengamat/me` | Profil pengawas | ✅ Done |
| `GET /pengamat/overview` | Statistik ringkasan sekolah | ✅ Done |
| `GET /pengamat/siswa` | List siswa (search, sort, paginated) | ✅ Done |
| `GET /pengamat/siswa/{id}` | Detail 1 siswa (sesi, progres mapel, kelemahan) | ✅ Done |
| `GET /pengamat/ranking` | Ranking siswa (minggu/bulan/all-time) | ✅ Done |
| `GET /pengamat/aktivitas-harian` | Chart aktivitas 7/14/30 hari | ✅ Done |
| `GET /pengamat/kelemahan-kelas` | Kelemahan agregat seluruh kelas | ✅ Done |
| `GET /pengamat/at-risk` | Siswa berisiko (3 kategori) | ✅ Done |
| `GET /pengamat/sekolah/list` | Cari sekolah saat register | ✅ Done |

### ❌ Backend — Gap yang Harus Dibangun

| Fitur | Endpoint yang Dibutuhkan | Prioritas |
|-------|--------------------------|-----------|
| Kirim pengumuman ke semua siswa | `POST /pengamat/pengumuman` | 🔴 High |
| Target belajar untuk kelas | `POST /pengamat/target-kelas` | 🟡 Medium |
| Export laporan PDF | `GET /pengamat/export/laporan` | 🟡 Medium |
| Perbandingan nasional | `GET /pengamat/benchmark` | 🟡 Medium |
| Notifikasi when student at-risk | (backend scheduler/job) | 🔴 High |
| Approve/reject sendiri (tanpa admin) | Perlu rethink approval flow | 🔴 High |

### ❌ Mobile App — Belum Ada Sama Sekali

Seluruh Pengawas mobile experience **belum dibangun**. Ini yang perlu dibuat dari nol.

### ⚠️ Web Frontend — Ada Tapi Belum Diulas

Web dashboard `/pengamat` ada tapi belum diperiksa kualitasnya.

---

## 🔴 CRITICAL ISSUES — Harus Diperbaiki Sebelum Build Mobile

### Issue 1: Approval Flow Membingungkan

**Problem**: Pengawas register → status `pending` → harus menunggu admin app approve. Ini berarti:
- Siapa admin yang approve? App admin (kamu) atau kepala sekolah?
- Berapa lama waiting time? Jika 3 hari, pengawas akan uninstall.
- Tidak ada notifikasi ke pengawas saat diapprove.

**Critique**: Flow ini memiliki UX yang sangat buruk untuk growth. Setiap pengawas baru harus menunggu approval manual → friction tinggi.

**Solusi yang Diusulkan**:

**Option A (Recommended)**: Self-approval dengan verifikasi email sekolah
```
Pengawas daftar dengan email @sman1jakarta.sch.id
→ sistem auto-approve karena domain email cocok dengan domain sekolah
→ tidak perlu manual approval untuk email sekolah resmi
```

**Option B**: Invite code dari admin sekolah
```
Admin app generate invite code per sekolah
→ pengawas input kode saat register
→ auto-approved
```

**Option C (Current flow)**: Keep manual admin approval, tapi tambah:
- Email notifikasi ke pengawas saat approved/rejected
- Status page yang informatif ("Permintaanmu sedang direview, biasanya 1-2 hari kerja")
- Admin dashboard yang mudah untuk approve batch

> [!IMPORTANT]
> Putuskan Option mana sebelum build mobile, karena ini mempengaruhi seluruh auth flow.

---

### Issue 2: Satu Pengawas Hanya Bisa Monitor 1 Sekolah

**Problem**: Tabel `pengamat_sekolah` punya `UNIQUE(pengamat_id, sekolah_id)`. Ini sudah benar. Tapi field ini tidak support pengawas yang mengawasi beberapa kelas/angkatan di sekolah yang sama.

**Critique**: Tidak ada filter berdasarkan angkatan/kelas. Jika SMA punya 300 siswa di tiga angkatan (10, 11, 12), guru BK kelas 12 tidak bisa lihat hanya siswanya saja — dia lihat semua 300 siswa.

**Solusi**: Tambah filter `angkatan` (tahun masuk) di API siswa. Karena user memilih `target PTN` (bukan kelas), gunakan `created_at` tahun sebagai proxy angkatan, atau tambah field `angkatan` ke user profile.

---

### Issue 3: Data Sekolah Bergantung pada Free Text Onboarding

**Problem**: `asal_sekolah` di onboarding adalah free text. Jika 10 siswa dari "SMAN 1 Jakarta" menulis:
- "SMAN 1 Jakarta"
- "SMA N 1 Jakarta"  
- "SMA Negeri 1 Jakarta"
- "SMAN1JKT"

→ Migration membuat 4 sekolah berbeda → pengawas hanya melihat sebagian siswa.

**Solusi**: Di onboarding, ganti input `asal_sekolah` dari free text menjadi **autocomplete dari tabel `sekolah`**. Gunakan endpoint yang sudah ada: `GET /pengamat/sekolah/list`.

```tsx
// Bukan lagi:
<TextInput placeholder="Nama sekolahmu" />

// Tapi:
<SekolahPicker 
  onSelect={(sekolah) => setSekolahId(sekolah.id)}
  placeholder="Cari nama sekolahmu..."
/>
```

Ini adalah perubahan kecil tapi **sangat kritis** untuk integritas data.

---

## 📱 MOBILE APP — Pengawas Mode

### Arsitektur: Mode Terpisah, Bukan App Terpisah

**Pendekatan yang direkomendasikan**: Satu app, dua mode. Setelah login, `AuthContext` mendeteksi `user.role`:

```
role === 'user'     → Student app (existing)
role === 'pengamat' → Pengawas app (new)
```

**Routing struktur**:
```
app/
├── (tabs)/                    ← existing student tabs
│   ├── index.tsx
│   ├── latihan.tsx
│   └── ...
└── (pengawas)/                ← NEW: pengawas tab layout
    ├── _layout.tsx            ← Pengawas tab bar (berbeda dari student)
    ├── index.tsx              ← Dashboard sekolah
    ├── siswa.tsx              ← List semua siswa
    ├── siswa/[id].tsx         ← Detail siswa
    ├── ranking.tsx            ← Ranking kelas
    ├── analisis.tsx           ← Kelemahan kelas + chart aktivitas
    └── pengaturan.tsx         ← Profil pengawas + info sekolah
```

Root layout yang sudah ada deteksi role dan redirect:
```tsx
// app/_layout.tsx
if (user.role === 'pengamat') {
  const approval = await checkApprovalStatus();
  if (approval.status === 'approved') {
    router.replace('/(pengawas)');
  } else {
    router.replace('/pengawas-pending');  // Pending screen
  }
}
```

---

## 📱 SCREEN DESIGNS — Mobile Pengawas

### Screen 1: Login & Onboarding Pengawas

**Flow**:
```
Splash → Login Screen → [Pilih: Siswa / Pengawas] → Pengawas Login
                                                    → Belum punya akun? → Register Pengawas
```

**Register Pengawas Screen** (`/pengawas-register`):
```
1. Nama lengkap (wajib)
2. Email (wajib)
3. Password (min 8 karakter)
4. Jabatan: [Guru BK | Wali Kelas | Kepala Sekolah | Lainnya]
5. Pilih Sekolah (autocomplete dari API)
6. [Daftar Sebagai Pengawas]
```

**Pending Approval Screen** (`/pengawas-pending`):
```
┌─────────────────────────────────────┐
│           ⏳                        │
│    Akun Sedang Diverifikasi         │
│                                     │
│  Kami sedang memverifikasi bahwa    │
│  kamu adalah pengawas dari         │
│  [Nama Sekolah].                    │
│                                     │
│  Biasanya memakan waktu 1-2 hari    │
│  kerja. Kamu akan mendapat email    │
│  saat akun disetujui.               │
│                                     │
│  [Cek Status Sekarang]              │
│  [Hubungi Admin]                    │
└─────────────────────────────────────┘
```

---

### Screen 2: Dashboard Sekolah (`(pengawas)/index.tsx`)

**Hierarchy**: Satu informasi paling penting di atas fold → "Kondisi kelas hari ini"

```
┌─────────────────────────────────────┐
│ 🏫 SMAN 1 Jakarta        [Notif 🔔] │
│ Selamat pagi, Bu Ratna              │
├─────────────────────────────────────┤
│  KONDISI KELAS HARI INI             │
│ ┌─────────────┬─────────────┐       │
│ │  47/124     │   🔥 78     │       │
│ │  Aktif hari │   Avg SNBT  │       │
│ │  ini        │   Estimasi  │       │
│ └─────────────┴─────────────┘       │
├─────────────────────────────────────┤
│  ⚠️ PERLU PERHATIAN       [Lihat →] │
│  3 siswa tidak aktif > 7 hari       │
│  5 siswa akurasi < 40%              │
│  12 siswa belum pernah latihan      │
├─────────────────────────────────────┤
│  📊 AKTIVITAS 7 HARI                │
│  [Mini bar chart — siswa aktif/hari]│
├─────────────────────────────────────┤
│  🏆 TOP SISWA MINGGU INI            │
│  1. Budi Santoso     780 SNBT       │
│  2. Sari Dewi        765 SNBT       │
│  3. Ahmad Fauzi      751 SNBT       │
│                    [Lihat Semua →]  │
├─────────────────────────────────────┤
│  📚 KELEMAHAN KELAS TERBESAR        │
│  • Penalaran Matematika  38% akurasi│
│  • Pemahaman Bacaan      42% akurasi│
│                    [Lihat Detail →] │
└─────────────────────────────────────┘
```

**API call**: `GET /pengamat/overview` + `GET /pengamat/at-risk` (summary only) + `GET /pengamat/ranking?periode=minggu&limit=3` + `GET /pengamat/kelemahan-kelas?limit=2`

---

### Screen 3: Daftar Siswa (`(pengawas)/siswa.tsx`)

```
┌─────────────────────────────────────┐
│ ← Semua Siswa (124)                 │
│ [🔍 Cari nama...]  [Sort ▼] [Filter]│
├─────────────────────────────────────┤
│ FILTER CEPAT:                       │
│ [Semua] [Aktif] [Berisiko] [Premium]│
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 🔴  Budi Santoso               │ │
│ │     SNBT: 780 | Streak: 14 🔥  │ │
│ │     Aktif 2 jam lalu           │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ ⚠️  Sari Dewi                  │ │
│ │     SNBT: 421 | Streak: 0      │ │
│ │     Tidak aktif 9 hari         │ │
│ └─────────────────────────────────┘ │
│ ... (paginated, 20 per page)        │
└─────────────────────────────────────┘
```

**Design notes**:
- Status indicator: 🟢 Aktif hari ini / 🟡 Aktif minggu ini / 🔴 Tidak aktif >7 hari
- Card tappable → buka detail siswa
- Pull-to-refresh
- Infinite scroll / load more

---

### Screen 4: Detail Siswa (`(pengawas)/siswa/[id].tsx`)

```
┌─────────────────────────────────────┐
│ ←  Ahmad Fauzi            [Kirim 📨]│
│     ahmad@email.com                 │
│     📍 SMAN 1 Jakarta               │
├─────────────────────────────────────┤
│  🎯 Target PTN                      │
│  UI - Teknik Informatika            │
│  ITB - Teknik Elektro               │
├─────────────────────────────────────┤
│  STATISTIK UTAMA                    │
│ ┌────┬────┬────┬────┐               │
│ │751 │ 68%│ 14 │ 47 │               │
│ │SNBT│Akur│Stre│Soal│               │
│ └────┴────┴────┴────┘               │
├─────────────────────────────────────┤
│  📈 SKOR SNBT 30 HARI               │
│  [Line chart — trend skor]          │
├─────────────────────────────────────┤
│  📚 PROGRES MAPEL                   │
│  Matematika      ████░░  72%        │
│  Penalaran Umum  ███░░░  58%        │
│  Literasi        ██████  91%        │
├─────────────────────────────────────┤
│  ⚠️ KELEMAHAN UTAMA                 │
│  1. Integral Tentu        28%       │
│  2. Silogisme             34%       │
│  3. Paragraf Kesimpulan   41%       │
├─────────────────────────────────────┤
│  🕐 RIWAYAT LATIHAN (30 hari)       │
│  • 25 Mei - Matematika - 750 SNBT   │
│  • 24 Mei - Penalaran - 680 SNBT    │
│  • 22 Mei - Mixed - 720 SNBT        │
└─────────────────────────────────────┘
```

**Tombol [Kirim 📨]** → bottom sheet untuk kirim pesan/motivasi langsung ke siswa ini (NEW backend endpoint needed)

---

### Screen 5: Analisis Kelas (`(pengawas)/analisis.tsx`)

**Tabs**: Aktivitas | Kelemahan | Perbandingan

**Tab Aktivitas**:
- Bar chart: siswa aktif per hari (7/14/30 hari toggle)
- Peak hours heatmap (bonus, needs backend)
- Total sesi per minggu trend

**Tab Kelemahan**:
- Tabel kelemahan kelas diurutkan akurasi terendah
- Tiap row: nama sub-materi, mapel, % siswa yang lemah, rata-rata akurasi
- Tappable → buka list siswa yang lemah di sub-materi itu

**Tab Perbandingan** *(Backend baru diperlukan)*:
```
┌─────────────────────────────────────┐
│  SMAN 1 Jakarta vs Nasional         │
├─────────────────────────────────────┤
│  Rata-rata SNBT Sekolah:   698      │
│  Rata-rata SNBT Nasional:  612 ✅   │
│  (Sekolah kamu 14% di atas rata-rata│
│   nasional!)                        │
├─────────────────────────────────────┤
│  Mapel Terkuat (vs nasional):       │
│  🟢 Literasi          +18%          │
│  🟡 Penalaran Umum    +3%           │
│  Mapel Terlemah (vs nasional):      │
│  🔴 Matematika        -11%          │
└─────────────────────────────────────┘
```

---

### Screen 6: Siswa Berisiko (At-Risk) — Sub-screen dari Dashboard

Accessible via "Perlu Perhatian" card di dashboard:

```
┌─────────────────────────────────────┐
│ ← Siswa Perlu Perhatian             │
│ [Tidak Aktif] [Akurasi Rendah] [Baru]│
├─────────────────────────────────────┤
│ TIDAK AKTIF > 7 HARI (3 siswa)      │
│ ┌─────────────────────────────────┐ │
│ │ Budi      Tidak aktif 12 hari   │ │
│ │ [Kirim Motivasi] [Lihat Profil] │ │
│ └─────────────────────────────────┘ │
│ ...                                 │
├─────────────────────────────────────┤
│ [Kirim Pesan ke Semua (3 siswa) →]  │
└─────────────────────────────────────┘
```

**Killer feature**: "Kirim Motivasi" → kirim push notification + pesan in-app ke siswa yang tidak aktif. Ini adalah fitur yang **langsung menghasilkan nilai nyata** bagi pengawas.

---

### Screen 7: Ranking (`(pengawas)/ranking.tsx`)

```
┌─────────────────────────────────────┐
│ ← Ranking Sekolah                   │
│ [Minggu] [Bulan] [All-time]         │
├─────────────────────────────────────┤
│  🥇 Budi Santoso         780 SNBT   │
│     🔥 14 hari | 47 soal            │
├─────────────────────────────────────┤
│  🥈 Sari Dewi            765 SNBT   │
│     🔥 21 hari | 62 soal            │
├─────────────────────────────────────┤
│  🥉 Ahmad Fauzi          751 SNBT   │
│     🔥 8 hari | 33 soal             │
├─────────────────────────────────────┤
│  4. Ratna Wulandari       738       │
│  5. Deni Prasetyo         721       │
│  ...                                │
└─────────────────────────────────────┘
```

**Unique feature**: Share ranking sebagai gambar → "🏆 Ranking belajar SNBT SMAN 1 Jakarta minggu ini" → WhatsApp group kelas → viral loop.

---

### Screen 8: Pengumuman / Pesan (`(pengawas)/pengumuman.tsx`)

*Backend baru diperlukan: `POST /pengamat/pengumuman`*

```
┌─────────────────────────────────────┐
│ ← Kirim Pengumuman                  │
│                                     │
│ KIRIM KE:                           │
│ ○ Semua siswa (124)                 │
│ ○ Siswa tidak aktif (3)             │
│ ○ Siswa akurasi rendah (5)          │
│ ○ Pilih manual...                   │
│                                     │
│ PESAN:                              │
│ ┌─────────────────────────────────┐ │
│ │ Halo pejuang PTN! SNBT tinggal  │ │
│ │ 30 hari lagi. Jangan lupa       │ │
│ │ latihan setiap hari!            │ │
│ └─────────────────────────────────┘ │
│                                     │
│ TEMPLATE CEPAT:                     │
│ [📣 Motivasi] [⚠️ Pengingat] [🎉 Apresiasi]│
│                                     │
│ [Kirim Sekarang]                    │
└─────────────────────────────────────┘
```

---

## 🆕 FITUR BARU YANG HARUS DITAMBAHKAN

### Fitur 1: Pengumuman / Broadcast Message ⭐⭐⭐
**Kenapa kritikal**: Ini adalah fitur yang membuat Pengawas *dapat bertindak*, bukan hanya melihat data. Tanpa ini, Pengawas hanya punya data tapi tidak bisa melakukan apa-apa.

**Backend**:
```php
// POST /pengamat/pengumuman
// Payload: { pesan, target: 'all'|'at_risk'|'tidak_aktif'|int[] }
// Action: simpan ke tabel `pengumuman`, kirim push notification via FCM
```

**Siswa side**: Push notification + tampil di tab baru "Notifikasi" yang sudah direncanakan.

---

### Fitur 2: Target Belajar Kelas ⭐⭐
Pengawas bisa set target: "Semua siswa kerjakan minimal 10 soal hari ini"

**Backend**: `POST /pengamat/target-kelas`  
**Siswa app**: Banner di home "🎯 Bu Ratna memberikan tantangan: 10 soal hari ini!"  
**Pengawas**: Progress bar real-time berapa siswa yang sudah mencapai target

---

### Fitur 3: Laporan Mingguan Otomatis ⭐⭐
Setiap Senin pagi, email laporan otomatis ke pengawas:
- Siswa paling aktif minggu lalu
- Siswa yang perlu perhatian
- Rata-rata skor SNBT sekolah vs minggu sebelumnya
- Mapel dengan penurunan akurasi terbesar

**Backend**: `artisan schedule:run` + Mailable `LaporanMingguanPengamat`

---

### Fitur 4: Perbandingan Nasional (Benchmark) ⭐⭐
**Backend**: Agregat anonim semua sekolah → kalkulasi nasional average per mapel

`GET /pengamat/benchmark` mengembalikan:
```json
{
  "sekolah_avg_snbt": 698,
  "nasional_avg_snbt": 612,
  "percentile": 73,  // sekolah ini di top 27%
  "per_mapel": [
    { "mapel": "Matematika", "sekolah": 58, "nasional": 67, "gap": -9 }
  ]
}
```

---

### Fitur 5: Export Laporan PDF/CSV ⭐
`GET /pengamat/export/laporan?format=pdf`  
Untuk keperluan pelaporan formal ke sekolah / dinas pendidikan.

---

### Fitur 6: Angkatan/Filter Kelas ⭐
Karena tidak ada field kelas/angkatan eksplisit, gunakan proxy:
- `tahun_masuk` = tahun user register (sebagian besar siswa kelas 12 akan daftar di tahun yang sama)
- Atau tambah field `angkatan` opsional di profil siswa

---

## 🔴 KRITIK DESAIN — Yang Harus Diperbaiki

### Kritik 1: Approval Flow Terlalu Bergantung pada Admin Manual

**Masalah**: Setiap pengawas harus di-approve manual oleh admin aplikasi. Jika ada 1000 sekolah mendaftar, admin akan kelelahan. Ini tidak skalabel.

**Rekomendasi**: Implementasi auto-approval berbasis domain email sekolah:
```php
// Jika email pengawas berakhiran .sch.id (domain sekolah Indonesia):
if (Str::endsWith($email, '.sch.id')) {
    $status = 'approved';  // auto-approve
} else {
    $status = 'pending';   // manual review
}
```

### Kritik 2: Tidak Ada Aksi Nyata dari Pengawas

**Masalah**: Seluruh API pengamat bersifat **read-only**. Pengawas hanya bisa melihat data. Mereka tidak bisa:
- Kirim pesan ke siswa
- Set target/tantangan
- Approve/reject siswa dari sekolahnya

**Dampak**: Value proposition "monitoring" menjadi lemah karena monitoring tanpa ability to intervene itu terbatas fungsinya. Guru BK yang melihat "Ahmad tidak aktif 12 hari" tapi tidak bisa berbuat apa-apa dari dalam app akan kembali ke WhatsApp.

### Kritik 3: Tidak Ada Notifikasi untuk Pengawas

**Masalah**: Pengawas harus buka app untuk tahu kondisi kelas. Mereka tidak akan buka app setiap hari.

**Rekomendasi**: Push notification harian (08.00 WIB):
- "📊 3 siswa SMAN 1 Jakarta tidak aktif kemarin. Tap untuk lihat siapa saja."
- "🎉 Rata-rata SNBT sekolah naik 12 poin minggu ini!"

### Kritik 4: Data Sekolah Kotor (Sudah Dibahas di atas)

Onboarding siswa masih pakai free text → perlu diganti dengan `SekolahPicker` autocomplete.

### Kritik 5: Tidak Ada Differensiasi Role Pengawas

**Masalah**: Semua pengawas punya akses yang sama. Kepala sekolah dan guru BK melihat hal yang sama.

**Rekomendasi**: Field `jabatan` sudah ada di schema. Buat UI yang sedikit berbeda per jabatan:
- Kepala Sekolah: Fokus pada ranking, benchmark nasional, overview
- Guru BK: Fokus pada at-risk students, individual student detail
- Wali Kelas: Tambah filter angkatan, fokus pada siswa "kelasnya"

---

## 🌐 WEB FRONTEND — Pengawas Dashboard

Web pengawas dashboard (`/pengamat`) sudah ada di Next.js. Yang perlu ditambahkan:

1. **Halaman Pengumuman** — form kirim broadcast + riwayat pengumuman
2. **Halaman Target Kelas** — set & monitor target belajar
3. **Halaman Export** — download PDF/CSV laporan
4. **Halaman Benchmark** — perbandingan nasional dengan visualisasi
5. **Responsive mobile web** — karena pengawas mungkin akses dari HP via browser

---

## 📋 IMPLEMENTASI BERTAHAP

### Tahap 1 — Foundation (1 Minggu)
- [ ] Perbaiki onboarding siswa: free text → SekolahPicker autocomplete
- [ ] Routing: detect `role === 'pengamat'` di root layout, redirect ke `/(pengawas)`
- [ ] Screen: Login/Register Pengawas
- [ ] Screen: Pending Approval state dengan UX yang informatif
- [ ] Screen: Dashboard Pengawas (gunakan `GET /pengamat/overview`)

### Tahap 2 — Core Monitoring (1 Minggu)
- [ ] Screen: Daftar Siswa (list + search + filter)
- [ ] Screen: Detail Siswa (full stats, chart, kelemahan)
- [ ] Screen: Ranking Kelas (3 periode)
- [ ] Screen: Siswa At-Risk
- [ ] Screen: Analisis Kelas (aktivitas + kelemahan tab)

### Tahap 3 — Action Features (2 Minggu)
- [ ] Backend: `POST /pengamat/pengumuman`
- [ ] Backend: Notifikasi push ke pengawas (daily summary)
- [ ] Screen: Kirim Pengumuman / Broadcast
- [ ] Siswa app: Tampilkan notifikasi dari pengawas
- [ ] Backend: Auto-approval domain .sch.id

### Tahap 4 — Growth Features (1 Bulan)
- [ ] Backend: `POST /pengamat/target-kelas`
- [ ] Backend: `GET /pengamat/benchmark` (nasional comparison)
- [ ] Backend: Export PDF laporan
- [ ] Screen: Target Kelas + progress monitoring
- [ ] Screen: Benchmark nasional
- [ ] Feature: Share ranking sebagai gambar (WhatsApp viral loop)
- [ ] Feature: Laporan mingguan otomatis via email

---

## 🎯 Tab Bar Design — Pengawas Mode

```
┌──────────────────────────────────────┐
│                                      │
│                                      │
│          [Screen Content]            │
│                                      │
│                                      │
├──────────────────────────────────────┤
│ [🏠]     [👥]     [📊]     [⚙️]      │
│ Beranda  Siswa   Analisis  Profil    │
└──────────────────────────────────────┘
```

4 tab sederhana (bukan 5 + center button seperti student). Pengawas butuh navigasi yang **lebih sederhana** dan **lebih langsung** — mereka bukan target market yang mau explore, mereka datang untuk cek data spesifik.

Warna tab bar: **Berbeda dari student app** — gunakan warna teal/emerald (`#059669`) sebagai primary untuk Pengawas mode, bukan navy blue. Ini membuat role-switching secara visual obvious jika satu HP dipakai bergantian.

---

## ❓ Open Questions

> [!IMPORTANT]
> Sebelum mulai implementasi, tentukan ini:

1. **Approval flow**: Pilih Option A (domain email), B (invite code), atau C (manual admin)?

2. **Target user pengawas**: Apakah lebih banyak guru BK/wali kelas (per-individual focus) atau kepala sekolah (aggregate focus)? Ini menentukan hierarki informasi di dashboard.

3. **Pengumuman delivery**: Hanya push notification, atau juga in-app message yang siswa bisa baca nanti?

4. **Angkatan/kelas filter**: Apakah perlu tambah field `angkatan` ke profil siswa, atau cukup filter by tahun register?

5. **Satu pengawas, satu sekolah**: Apakah perlu support pengawas yang mengawasi beberapa sekolah? (Misalnya: pengawas dari dinas pendidikan kota)

6. **Premium gating**: Apakah fitur pengawas gratis atau berbayar (untuk sekolah)?
