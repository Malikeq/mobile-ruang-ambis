import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, Platform, ActivityIndicator,
  TextInput, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { API_BASE, paymentApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatures } from '@/hooks/useFeatures';

// ─── Feature display map ──────────────────────────────────────────────────────
const FEATURES: Record<string, { icon: string; label: string }> = {
  ai_tutor:              { icon: '🤖', label: 'AI Tutor Chat' },
  ai_tanya_harian:       { icon: '💬', label: 'Tanya AI' },
  ai_photo_solve:        { icon: '📷', label: 'Foto Soal AI' },
  latihan_soal_per_sesi: { icon: '📝', label: 'Soal/sesi' },
  tryout_penuh:          { icon: '🎯', label: 'Tryout Penuh SNBT' },
  akses_semua_mapel:     { icon: '📚', label: 'Semua Mapel SNBT' },
  soal_adaptif:          { icon: '🧠', label: 'Soal Adaptif AI' },
  review_jawaban:        { icon: '🔍', label: 'Review Jawaban' },
  riwayat_latihan:       { icon: '📊', label: 'Riwayat Latihan' },
  analisis_kelemahan:    { icon: '⚠️', label: 'Analisis Kelemahan' },
  export_hasil:          { icon: '📄', label: 'Export PDF' },
  leaderboard:           { icon: '🏆', label: 'Leaderboard' },
  bonus_poin_streak:     { icon: '🔥', label: 'Bonus Streak' },
};

function getActiveFeatures(fiturJson: any): { icon: string; label: string; val: any }[] {
  if (!fiturJson) return [];
  return Object.entries(FEATURES)
    .filter(([key]) => {
      const v = fiturJson[key];
      return v === true || (typeof v === 'number' && v !== 0);
    })
    .map(([key, { icon, label }]) => ({
      icon, label,
      val: fiturJson[key],
    }))
    .slice(0, 8);
}

// ─── Package Card ─────────────────────────────────────────────────────────────
function PackageCard({ pkg, isPopular, pulse, onPress, loading, isCurrent }: {
  pkg: any; isPopular: boolean; pulse: Animated.Value;
  onPress: () => void; loading: boolean; isCurrent: boolean;
}) {
  const features = getActiveFeatures(pkg.fitur_json ?? {});
  const accent   = isPopular ? Colors.secondary : Colors.primaryLight;
  const priceK   = Math.round(pkg.harga_idr / 1000);

  const content = (
    <View style={[styles.cardInner, { backgroundColor: isPopular ? '#0F1E3C' : Colors.surface }]}>
      {isPopular && (
        <View style={[styles.badge, { backgroundColor: Colors.secondary }]}>
          <Text style={styles.badgeText}>⚡ TERPOPULER</Text>
        </View>
      )}

      {/* Price */}
      <View style={styles.priceHeader}>
        <Text style={[styles.planLabel, { color: isPopular ? Colors.textPrimary : Colors.textSecondary }]}>
          {pkg.nama}
        </Text>
        <View style={styles.priceRow}>
          <Text style={[styles.priceRp, { color: accent }]}>Rp </Text>
          <Text style={[styles.priceNum, { color: accent }]}>
            {priceK < 1 ? pkg.harga_idr.toLocaleString() : `${priceK}k`}
          </Text>
          <Text style={styles.pricePer}>/{pkg.durasi_hari === 1 ? 'hari' : `${pkg.durasi_hari} hari`}</Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: accent + '30' }]} />

      {/* Features */}
      <View style={styles.featureList}>
        {features.map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <View style={[styles.featureIconWrap, { backgroundColor: accent + '20' }]}>
              <Text style={styles.featureIconText}>✓</Text>
            </View>
            <Text style={styles.featureText}>
              {f.icon} {f.label}
              {typeof f.val === 'number' && f.val !== true && (
                <Text style={{ color: accent, fontWeight: '800' }}>
                  {f.val === -1 ? ' ∞' : ` ${f.val}`}
                </Text>
              )}
            </Text>
          </View>
        ))}
      </View>

      {/* CTA */}
      {isCurrent ? (
        <View style={styles.currentBadge}>
          <Text style={styles.currentBadgeText}>✅ Paket Aktifmu</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.cta, { backgroundColor: accent, opacity: loading ? 0.7 : 1 }]}
          onPress={onPress}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator size="small" color={isPopular ? '#000' : '#fff'} />
            : <Text style={[styles.ctaText, { color: isPopular ? '#000' : '#fff' }]}>
                {isPopular ? '🎯 Mulai Premium' : '⚡ Beli Day Pass'}
              </Text>
          }
        </TouchableOpacity>
      )}
    </View>
  );

  if (isPopular) {
    return (
      <Animated.View style={[styles.card, { transform: [{ scale: pulse }], borderColor: accent, borderWidth: 2 }]}>
        {content}
      </Animated.View>
    );
  }
  return (
    <View style={[styles.card, { borderColor: accent + '60', borderWidth: 1.5 }]}>
      {content}
    </View>
  );
}

// ─── Promo Input ──────────────────────────────────────────────────────────────
function PromoInput({ onApply }: { onApply: (kode: string) => void }) {
  const [kode, setKode]       = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]         = useState('');
  const [ok, setOk]           = useState(false);

  const apply = async () => {
    if (!kode.trim()) return;
    setLoading(true); setMsg('');
    try {
      const res = await paymentApi.applyPromo(kode.trim());
      const d   = (res as any)?.data?.diskon_persen ?? 0;
      setOk(true); setMsg(`✅ Promo aktif! Diskon ${d}%`);
      onApply(kode.trim());
    } catch {
      setOk(false); setMsg('❌ Kode promo tidak valid.');
    } finally { setLoading(false); }
  };

  return (
    <View style={styles.promoWrap}>
      <Text style={styles.promoLabel}>🎁 Kode Promo</Text>
      <View style={styles.promoRow}>
        <TextInput
          style={styles.promoInput}
          value={kode}
          onChangeText={setKode}
          placeholder="Masukkan kode"
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="characters"
        />
        <TouchableOpacity style={styles.promoBtn} onPress={apply} disabled={loading}>
          {loading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.promoBtnText}>Pakai</Text>
          }
        </TouchableOpacity>
      </View>
      {!!msg && <Text style={{ color: ok ? Colors.success : '#ef4444', fontSize: FontSize.xs, marginTop: 4 }}>{msg}</Text>}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PricingScreen() {
  const insets                = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();
  const { invalidate }        = useFeatures();

  const [packages, setPackages]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [buyingId, setBuyingId]   = useState<number | null>(null);
  const [promoCode, setPromoCode] = useState('');

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  const startAnimations = useCallback(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.02, duration: 1200, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,    duration: 1200, useNativeDriver: true }),
    ])).start();
  }, []);

  useEffect(() => {
    startAnimations();
    loadPackages();
  }, []);

  const loadPackages = async () => {
    setError(null);
    setLoading(true);
    try {
      const res  = await paymentApi.getPackages();
      // Handle { success, data: [...] } or { success, data: { data: [...] } }
      const body = (res as any);
      const raw  = body?.data ?? body;
      const list = Array.isArray(raw) ? raw
                 : Array.isArray(raw?.data) ? raw.data
                 : [];
      const active = list.filter((p: any) => p.is_active !== false);
      setPackages(active);
      if (active.length === 0) setError('empty');
    } catch (e: any) {
      console.error('[PricingScreen] loadPackages error:', e?.message ?? e);
      setError(e?.message ?? 'Gagal memuat paket. Pastikan koneksi internet aktif.');
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (pkg: any) => {
    if (!user) {
      Alert.alert('Login Diperlukan', 'Silakan login terlebih dahulu untuk melanjutkan pembelian.', [
        { text: 'Login', onPress: () => router.push('/auth/login') },
        { text: 'Batal', style: 'cancel' },
      ]);
      return;
    }

    setBuyingId(pkg.id);
    try {
      const res     = await paymentApi.initiate(pkg.id, promoCode || undefined);
      const payment = (res as any)?.data;

      if (!payment?.snap_url) throw new Error('Snap URL tidak ditemukan dari server');

      // Open Midtrans Snap in full-screen in-app browser
      await WebBrowser.openBrowserAsync(payment.snap_url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        toolbarColor: '#0B0B1A',
        controlsColor: '#8B5CF6',
        showTitle: true,
      });

      // ALWAYS check status when browser closes — regardless of result.type
      pollStatus(payment.order_id, pkg);

    } catch (e: any) {
      console.error('[PricingScreen] handleBuy error:', e?.message ?? e);
      Alert.alert('Gagal', e?.message ?? 'Gagal memproses pembayaran. Coba lagi.', [{ text: 'OK' }]);
    } finally {
      setBuyingId(null);
    }
  };

  const pollStatus = async (orderId: string, pkg: any) => {
    let attempts = 0;
    const maxAttempts = 10;
    const intervalMs  = 2000; // 2 detik

    const check = async (): Promise<void> => {
      try {
        attempts++;
        const res    = await paymentApi.status(orderId);
        const body   = (res as any);
        // Handle { success, data: { status } } or { success, data: { data: { status } } }
        const status = body?.data?.status ?? body?.status;

        console.log(`[pollStatus] attempt ${attempts}, status: ${status}`);

        if (status === 'paid') {
          // ✅ Paid — refresh auth + navigate
          try { await refreshUser?.(); } catch { /* ignore */ }
          invalidate();
          router.replace({ pathname: '/payment-success', params: { pkg: pkg.nama } });
          return;
        }

        if (status === 'failed') {
          Alert.alert('Pembayaran Gagal', 'Pembayaran tidak berhasil. Silakan coba lagi.', [{ text: 'OK' }]);
          return;
        }

        // Still pending — retry up to maxAttempts
        if (attempts < maxAttempts) {
          setTimeout(check, intervalMs);
        } else {
          Alert.alert(
            'Cek Status Pembayaran',
            'Pembayaran sedang diproses. Jika sudah bayar, refresh halaman atau hubungi support.',
            [{ text: 'OK' }]
          );
        }
      } catch (e: any) {
        console.warn('[pollStatus] error:', e?.message);
        if (attempts < maxAttempts) {
          setTimeout(check, intervalMs * 2); // back off on error
        }
      }
    };

    // First check immediately
    await check();
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const premiumPkgs    = packages.filter(p => p.tier === 'premium');
  const dailyPassPkgs  = packages.filter(p => p.tier === 'daily_pass');

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.glowBlue} />
      <View style={styles.glowGold} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Kembali</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Pilih Paket{'\n'}Belajarmu 🚀</Text>
          <Text style={styles.subtitle}>Bayar sekali, akses tak terbatas. Batalkan kapan saja.</Text>
        </View>

        {/* ─── States ─── */}
        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.stateText}>Memuat paket...</Text>
          </View>

        ) : error === 'empty' ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateEmoji}>📦</Text>
            <Text style={[styles.stateText, { color: Colors.textSecondary }]}>Paket belum tersedia</Text>
            <Text style={[styles.stateText, { fontSize: 11, marginTop: 4 }]}>Admin sedang menyiapkan paket. Cek kembali nanti!</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadPackages}>
              <Text style={styles.retryText}>🔄 Refresh</Text>
            </TouchableOpacity>
          </View>

        ) : error ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateEmoji}>⚠️</Text>
            <Text style={[styles.stateText, { color: '#ef4444' }]}>Gagal memuat paket</Text>
            <Text style={[styles.stateText, { fontSize: 11, marginTop: 4, paddingHorizontal: 16 }]}>{error}</Text>
            <Text style={[styles.stateText, { fontSize: 10, marginTop: 4, color: Colors.textMuted }]}>
              Server: {API_BASE}
            </Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadPackages}>
              <Text style={styles.retryText}>Coba Lagi</Text>
            </TouchableOpacity>
          </View>

        ) : (
          <View style={styles.cards}>
            {premiumPkgs.map(pkg => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                isPopular
                pulse={pulseAnim}
                onPress={() => handleBuy(pkg)}
                loading={buyingId === pkg.id}
                isCurrent={user?.tier === 'premium'}
              />
            ))}
            {dailyPassPkgs.map(pkg => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                isPopular={false}
                pulse={pulseAnim}
                onPress={() => handleBuy(pkg)}
                loading={buyingId === pkg.id}
                isCurrent={user?.tier === 'daily_pass'}
              />
            ))}
          </View>
        )}

        {/* Promo + Free plan */}
        {!loading && !error && packages.length > 0 && (
          <PromoInput onApply={setPromoCode} />
        )}

        <View style={styles.freePlan}>
          <Text style={styles.freeTitle}>Paket Gratis</Text>
          <Text style={styles.freeSub}>Selalu gratis · mulai tanpa kartu kredit</Text>
          {user?.tier === 'free' && (
            <View style={[styles.currentBadge, { marginTop: 8 }]}>
              <Text style={styles.currentBadgeText}>✅ Paket Aktifmu</Text>
            </View>
          )}
        </View>

        {/* Trust signals */}
        <View style={styles.trustRow}>
          {['🔒 Aman', '⚡ Instan', '🔄 Fleksibel'].map((t, i) => (
            <View key={i} style={styles.trustBadge}>
              <Text style={styles.trustText}>{t}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          Pembayaran aman via Midtrans · SSL Encrypted{'\n'}
          Butuh bantuan? support@ailolosiptn.com
        </Text>

        <View style={{ height: Platform.OS === 'ios' ? insets.bottom + 20 : 24 }} />
      </ScrollView>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  glowBlue: {
    position: 'absolute', top: -40, left: -80,
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: Colors.primary + '12',
  },
  glowGold: {
    position: 'absolute', top: 180, right: -80,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: Colors.secondary + '10',
  },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: 32 },

  header:   { marginBottom: Spacing.xl, gap: 6 },
  backBtn:  { alignSelf: 'flex-start', marginBottom: 8 },
  backText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '600' },
  title:    { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: '800', lineHeight: 36, letterSpacing: -0.4 },
  subtitle: { color: Colors.textSecondary, fontSize: FontSize.sm },

  // State boxes
  stateBox:   { alignItems: 'center', paddingVertical: 48, gap: 10 },
  stateEmoji: { fontSize: 44 },
  stateText:  { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center' },
  retryBtn:   { marginTop: 8, backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingHorizontal: 24, paddingVertical: 10 },
  retryText:  { color: '#fff', fontWeight: '700', fontSize: FontSize.sm },

  // Cards
  cards:     { gap: Spacing.lg, marginBottom: Spacing.xl },
  card:      { borderRadius: Radius.xl, overflow: 'hidden' },
  cardInner: { padding: Spacing.lg, gap: Spacing.md, borderRadius: Radius.xl },

  badge:     { alignSelf: 'flex-start', borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 4 },
  badgeText: { color: '#000', fontSize: FontSize.xs, fontWeight: '800', letterSpacing: 1 },

  priceHeader: { gap: 2 },
  planLabel:   { fontSize: FontSize.base, fontWeight: '700' },
  priceRow:    { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  priceRp:     { fontSize: FontSize.lg, fontWeight: '700', marginBottom: 4 },
  priceNum:    { fontSize: 42, fontWeight: '900', lineHeight: 48, letterSpacing: -1 },
  pricePer:    { color: Colors.textMuted, fontSize: FontSize.sm, marginBottom: 6 },

  divider:        { height: 1 },
  featureList:    { gap: 8 },
  featureRow:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureIconWrap:{ width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  featureIconText:{ fontSize: 11, fontWeight: '800', color: '#fff' },
  featureText:    { color: Colors.textSecondary, fontSize: FontSize.sm, flex: 1 },

  cta:     { paddingVertical: 14, borderRadius: Radius.xl, alignItems: 'center' },
  ctaText: { fontSize: FontSize.base, fontWeight: '800' },

  currentBadge:     { borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.success + '50', backgroundColor: Colors.success + '12', paddingVertical: 10, alignItems: 'center' },
  currentBadgeText: { color: Colors.success, fontWeight: '700', fontSize: FontSize.sm },

  // Promo
  promoWrap:  { marginBottom: Spacing.xl, gap: 6 },
  promoLabel: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '700' },
  promoRow:   { flexDirection: 'row', gap: Spacing.sm },
  promoInput: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 10,
    color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '700', letterSpacing: 2,
  },
  promoBtn:    { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingHorizontal: 18, justifyContent: 'center' },
  promoBtnText:{ color: '#fff', fontWeight: '800', fontSize: FontSize.sm },

  // Free plan
  freePlan:  { backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, marginBottom: Spacing.xl },
  freeTitle: { color: Colors.textSecondary, fontSize: FontSize.base, fontWeight: '700' },
  freeSub:   { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },

  // Trust
  trustRow:   { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: Spacing.lg },
  trustBadge: { backgroundColor: Colors.surface, borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: Colors.border },
  trustText:  { color: Colors.textMuted, fontSize: FontSize.xs },

  footer: { color: Colors.textMuted, fontSize: 11, textAlign: 'center', lineHeight: 18 },
});
