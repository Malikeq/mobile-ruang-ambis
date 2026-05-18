import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Platform, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { API_BASE } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Kampus { id: number; nama: string; akronim: string; kota: string; }
interface Jurusan { id: number; nama: string; fakultas: string; passing_grade_estimate: number; }
interface TargetItem { kampus_id: number; jurusan_id: number; kampusLabel: string; jurusanLabel: string; }

type Step = 'list' | 'search_kampus' | 'pick_jurusan';

export default function EditTargetScreen() {
  const { token } = useAuth();
  const [targets,   setTargets]   = useState<TargetItem[]>([]);
  const [step,      setStep]      = useState<Step>('list');
  const [kampusList,setKampusList]= useState<Kampus[]>([]);
  const [jurusanList,setJurusanList]=useState<Jurusan[]>([]);
  const [selKampus, setSelKampus] = useState<Kampus | null>(null);
  const [search,    setSearch]    = useState('');
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [loadingJ,  setLoadingJ]  = useState(false);

  const H = { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' };

  useEffect(() => { fetchTargets(); }, []);

  const fetchTargets = async () => {
    try {
      const res  = await fetch(`${API_BASE}/user/targets`, { headers: H });
      const json = await res.json();
      const items: TargetItem[] = (json?.data ?? []).map((t: any) => ({
        kampus_id:    t.kampus?.id ?? 0,
        jurusan_id:   t.jurusan?.id ?? 0,
        kampusLabel:  t.kampus?.akronim ?? t.kampus?.nama ?? '?',
        jurusanLabel: t.jurusan?.nama ?? '?',
      }));
      setTargets(items);
    } catch {}
    finally { setLoading(false); }
  };

  const searchKampus = async (q: string) => {
    setSearch(q);
    if (q.length < 2) { setKampusList([]); return; }
    try {
      const res  = await fetch(`${API_BASE}/kampus?search=${encodeURIComponent(q)}&size=20`, { headers: H });
      const json = await res.json();
      setKampusList(json?.data ?? []);
    } catch {}
  };

  const pickKampus = async (k: Kampus) => {
    setSelKampus(k);
    setLoadingJ(true);
    setStep('pick_jurusan');
    try {
      const res  = await fetch(`${API_BASE}/kampus/${k.id}/jurusan`, { headers: H });
      const json = await res.json();
      setJurusanList(json?.data ?? []);
    } catch {}
    finally { setLoadingJ(false); }
  };

  const addTarget = (j: Jurusan) => {
    if (!selKampus) return;
    if (targets.length >= 4) { Alert.alert('Maksimal 4 target', 'Hapus target lama untuk menambah baru.'); return; }
    const already = targets.some(t => t.kampus_id === selKampus.id && t.jurusan_id === j.id);
    if (already) { Alert.alert('Sudah ada', 'Target ini sudah ditambahkan.'); return; }
    setTargets(prev => [...prev, {
      kampus_id: selKampus.id, jurusan_id: j.id,
      kampusLabel: selKampus.akronim ?? selKampus.nama,
      jurusanLabel: j.nama,
    }]);
    setStep('list');
    setSearch(''); setKampusList([]);
  };

  const removeTarget = (i: number) => {
    Alert.alert('Hapus Target?', `${targets[i].kampusLabel} — ${targets[i].jurusanLabel}`, [
      { text: 'Batal' },
      { text: 'Hapus', style: 'destructive', onPress: () => setTargets(prev => prev.filter((_, idx) => idx !== i)) },
    ]);
  };

  const saveTargets = async () => {
    if (targets.length === 0) { Alert.alert('Minimal 1 target'); return; }
    setSaving(true);
    try {
      const res  = await fetch(`${API_BASE}/onboarding/target`, {
        method: 'POST', headers: H,
        body: JSON.stringify({ targets: targets.map(t => ({ kampus_id: t.kampus_id, jurusan_id: t.jurusan_id })) }),
      });
      const json = await res.json();
      if (json?.success) { Alert.alert('Tersimpan!', 'Target PTN berhasil diperbarui.', [{ text: 'OK', onPress: () => router.back() }]); }
      else { Alert.alert('Gagal', json?.message ?? 'Coba lagi'); }
    } catch { Alert.alert('Error', 'Gagal menyimpan target.'); }
    finally { setSaving(false); }
  };

  // ── Pick Jurusan screen ──────────────────────────────────────────────────
  if (step === 'pick_jurusan') {
    return (
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => setStep('search_kampus')}>
            <Ionicons name="arrow-back" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>{selKampus?.akronim ?? selKampus?.nama}</Text>
            <Text style={s.headerSub}>Pilih jurusan</Text>
          </View>
        </View>
        {loadingJ ? (
          <View style={s.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
            {jurusanList.length === 0 && (
              <Text style={s.empty}>Belum ada data jurusan</Text>
            )}
            {jurusanList.map(j => (
              <TouchableOpacity key={j.id} style={s.jurusanCard} onPress={() => addTarget(j)}>
                <View style={{ flex: 1 }}>
                  <Text style={s.jurusanNama}>{j.nama}</Text>
                  <Text style={s.jurusanFak}>{j.fakultas}</Text>
                </View>
                {j.passing_grade_estimate > 0 && (
                  <View style={s.pgBadge}>
                    <Text style={s.pgText}>PG {j.passing_grade_estimate}</Text>
                  </View>
                )}
                <Ionicons name="add-circle-outline" size={22} color={Colors.primary} />
              </TouchableOpacity>
            ))}
            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </View>
    );
  }

  // ── Search Kampus screen ─────────────────────────────────────────────────
  if (step === 'search_kampus') {
    return (
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => { setStep('list'); setSearch(''); setKampusList([]); }}>
            <Ionicons name="arrow-back" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { flex: 1 }]}>Cari PTN</Text>
        </View>
        <View style={s.searchWrap}>
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
          <TextInput
            style={s.searchInput}
            placeholder="Nama universitas atau akronim..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={searchKampus}
            autoFocus
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); setKampusList([]); }}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
          {search.length < 2 && <Text style={s.empty}>Ketik minimal 2 karakter untuk mencari</Text>}
          {kampusList.map(k => (
            <TouchableOpacity key={k.id} style={s.kampusCard} onPress={() => pickKampus(k)}>
              <View style={s.kampusAvatar}>
                <Text style={s.kampusAvatarText}>{(k.akronim || k.nama)[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.kampusNama}>{k.akronim || k.nama}</Text>
                <Text style={s.kampusKota}>{k.nama} · {k.kota}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  // ── Target List screen ───────────────────────────────────────────────────
  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { flex: 1 }]}>Edit Target PTN</Text>
        <TouchableOpacity
          style={[s.saveBtn, saving && { opacity: 0.5 }]}
          onPress={saveTargets}
          disabled={saving}
        >
          {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.saveBtnText}>Simpan</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <Text style={s.hint}>Tambahkan hingga 4 target PTN & jurusan impianmu</Text>

        {loading ? (
          <View style={s.center}><ActivityIndicator color={Colors.primary} /></View>
        ) : (
          <>
            {targets.map((t, i) => (
              <View key={i} style={s.targetRow}>
                <View style={s.targetRank}>
                  <Text style={s.targetRankText}>#{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.targetKampus}>{t.kampusLabel}</Text>
                  <Text style={s.targetJurusan}>{t.jurusanLabel}</Text>
                </View>
                <TouchableOpacity onPress={() => removeTarget(i)}>
                  <Ionicons name="trash-outline" size={20} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))}

            {targets.length < 4 && (
              <TouchableOpacity style={s.addBtn} onPress={() => setStep('search_kampus')}>
                <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
                <Text style={s.addBtnText}>Tambah Target PTN</Text>
              </TouchableOpacity>
            )}
          </>
        )}
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  empty: { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center', paddingVertical: Spacing.xl },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.base, fontWeight: '800' },
  headerSub:   { color: Colors.textMuted, fontSize: FontSize.xs },
  saveBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.lg, flexDirection: 'row', alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  hint: { color: Colors.textMuted, fontSize: FontSize.xs, marginBottom: Spacing.md },

  targetRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1.5, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  targetRank: { width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.primary + '20', alignItems: 'center', justifyContent: 'center' },
  targetRankText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '900' },
  targetKampus: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '800' },
  targetJurusan: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    borderWidth: 1.5, borderColor: Colors.primary + '50', borderStyle: 'dashed',
    borderRadius: Radius.xl, padding: Spacing.md, marginBottom: Spacing.sm,
    backgroundColor: Colors.primary + '08',
  },
  addBtnText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '700' },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border,
    margin: Spacing.lg, paddingHorizontal: Spacing.md, paddingVertical: 12,
  },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.sm },

  kampusCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  kampusAvatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.primary + '20', alignItems: 'center', justifyContent: 'center' },
  kampusAvatarText: { color: Colors.primary, fontSize: FontSize.base, fontWeight: '900' },
  kampusNama: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '700' },
  kampusKota: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },

  jurusanCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  jurusanNama: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '700' },
  jurusanFak:  { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  pgBadge: { backgroundColor: Colors.secondary + '20', borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: Colors.secondary + '40' },
  pgText: { color: Colors.secondary, fontSize: 10, fontWeight: '700' },
});
