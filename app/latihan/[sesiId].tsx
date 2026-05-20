import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Platform, ActivityIndicator, Dimensions, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { API_BASE } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const { width } = Dimensions.get('window');

interface Pilihan { id: number; label: string; konten: string; }
interface Soal { id: number; konten: string; wacana?: string; pembahasan?: string; pilihan_jawaban: Pilihan[]; }
type Phase = 'loading' | 'soal' | 'answered' | 'submitting' | 'hasil' | 'error';

export default function SesiScreen() {
  const { sesiId, total: totalParam, timer: timerParam } = useLocalSearchParams<{ sesiId: string; total?: string; timer?: string }>();
  const { token } = useAuth();
  const total      = parseInt(totalParam ?? '10', 10);
  const timerMenit = parseInt(timerParam  ?? '0',  10); // 0 = no countdown
  const isCountdown = timerMenit > 0;

  const [phase,      setPhase]      = useState<Phase>('loading');
  const [soal,       setSoal]       = useState<Soal | null>(null);
  const [index,      setIndex]      = useState(0);
  const [errorMsg,   setError]      = useState('');
  const [hasilSkor,  setHasilSkor]  = useState(0);
  const [hasilAkhir, setHasilAkhir] = useState(0); // SNBT scale 400-800
  const [hasilBenar, setHasilBenar] = useState(0);
  const [hasilTotal, setHasilTotal] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [correctId,  setCorrectId]  = useState<number | null>(null);
  const [isCorrect,  setIsCorrect]  = useState<boolean | null>(null);
  const [answers,    setAnswers]    = useState<Record<number, number>>({});
  const [results,    setResults]    = useState<Record<number, boolean>>({});
  const [dcsef,     setDcsef]     = useState<any | null>(null);
  const [aiLoading,  setAiLoading]  = useState(false);
  const [aiError,    setAiError]    = useState('');

  const timerRef  = useRef<ReturnType<typeof setInterval>>();
  const startMs   = useRef(Date.now());
  const totalTime = useRef(0);
  // countdown: starts at timerMenit*60 and counts down; count-up: starts at 0 and counts up
  const [timer, setTimer] = useState(isCountdown ? timerMenit * 60 : 0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const H = { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' };

  useEffect(() => {
    fetchSoal(0);
    if (isCountdown) {
      // Countdown: tick down, auto-finish at 0
      timerRef.current = setInterval(() => {
        setTimer(t => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            finishSesi();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      // Count-up timer
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, []);

  // Pulse animation when time is critical (< 30s)
  useEffect(() => {
    if (!isCountdown || timer > 30) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 400, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [isCountdown, timer <= 30]);

  const animIn = () => { fadeAnim.setValue(0); Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }).start(); };

  const fetchSoal = async (idx: number) => {
    setPhase('loading'); setSelectedId(null); setCorrectId(null); setIsCorrect(null); setDcsef(null); setAiError('');
    startMs.current = Date.now();
    try {
      const res  = await fetch(`${API_BASE}/latihan/${sesiId}/soal/${idx}`, { headers: { Authorization: H.Authorization, Accept: H.Accept } });
      const json = await res.json();
      if (!json?.success) { setError(json?.message ?? 'Soal tidak ditemukan'); setPhase('error'); return; }
      setSoal(json.data);
      if (answers[idx] !== undefined) { setSelectedId(answers[idx]); setPhase('answered'); }
      else { setPhase('soal'); }
      animIn();
    } catch { setError('Gagal memuat soal. Periksa koneksi.'); setPhase('error'); }
  };

  const submitJawab = async (pid: number) => {
    if (phase === 'answered') return;
    const waktu = Date.now() - startMs.current;
    setSelectedId(pid); setAnswers(p => ({ ...p, [index]: pid })); setPhase('answered');
    try {
      const res  = await fetch(`${API_BASE}/latihan/${sesiId}/jawab`, {
        method: 'POST', headers: H,
        body: JSON.stringify({ soal_id: soal!.id, jawaban_id: pid, waktu_ms: waktu }),
      });
      const json = await res.json();
      if (json?.data) {
        const ic = json.data.is_correct ?? false;
        setIsCorrect(ic); setCorrectId(json.data.correct_id ?? null);
        setResults(p => ({ ...p, [index]: ic }));
      }
    } catch {}
  };

  const fetchAi = async () => {
    if (!soal || aiLoading) return;
    setAiLoading(true); setAiError('');
    try {
      const res  = await fetch(`${API_BASE}/ai/explanation/${soal.id}`, { headers: { Authorization: H.Authorization, Accept: H.Accept } });
      const json = await res.json();
      if (json?.success && json?.data) {
        setDcsef(json.data);
      } else {
        setAiError(json?.message ?? 'Gagal memuat analisis.');
      }
    } catch { setAiError('Gagal memuat analisis AI.'); }
    finally { setAiLoading(false); }
  };

  const goNext = () => { if (index + 1 >= total) { finishSesi(); return; } const n = index + 1; setIndex(n); fetchSoal(n); };
  const goPrev = () => { if (index === 0) return; const p = index - 1; setIndex(p); fetchSoal(p); };

  const finishSesi = async () => {
    clearInterval(timerRef.current); totalTime.current = timer; setPhase('submitting');
    try {
      const res  = await fetch(`${API_BASE}/latihan/${sesiId}/selesai`, { method: 'POST', headers: H });
      const json = await res.json();
      setHasilSkor(Math.round(json?.data?.skor_raw ?? 0));
      setHasilAkhir(Math.round(json?.data?.skor_akhir ?? 0));
      setHasilBenar(json?.data?.total_benar ?? 0);
      setHasilTotal(json?.data?.total_soal ?? total);
    } catch {}
    setPhase('hasil'); animIn();
  };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  // Header timer color for countdown urgency
  const timerColor = !isCountdown
    ? Colors.secondary
    : timer > 120  ? Colors.success
    : timer > 60   ? Colors.secondary
    : timer > 30   ? '#F59E0B'
    : Colors.error;

  // ── Question Grid ──────────────────────────────────────────────────────────
  function QuestionGrid() {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.gridScroll} contentContainerStyle={st.gridContent}>
        {Array.from({ length: total }, (_, i) => {
          const isCurrent = i === index;
          const hasAns    = answers[i] !== undefined;
          const correct   = results[i];
          let bg = Colors.surfaceElevated, border = Colors.border, color = Colors.textMuted;
          if (isCurrent) { bg = Colors.primary; border = Colors.primary; color = '#fff'; }
          else if (hasAns && correct) { bg = Colors.success + '30'; border = Colors.success; color = Colors.success; }
          else if (hasAns && !correct) { bg = Colors.error + '30'; border = Colors.error; color = Colors.error; }
          return (
            <TouchableOpacity key={i} style={[st.gridDot, { backgroundColor: bg, borderColor: border }]}
              onPress={() => { setIndex(i); fetchSoal(i); }}>
              <Text style={[st.gridNum, { color }]}>{i + 1}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  }

  if (phase === 'loading' || phase === 'submitting') return (
    <View style={[st.container, st.center]}>
      <ActivityIndicator color={Colors.primary} size="large" />
      <Text style={st.mutedText}>{phase === 'submitting' ? 'Menghitung hasil...' : 'Memuat soal...'}</Text>
    </View>
  );

  if (phase === 'error') return (
    <View style={[st.container, st.center]}>
      <Ionicons name="alert-circle-outline" size={52} color={Colors.error} />
      <Text style={st.errorTitle}>Oops!</Text>
      <Text style={st.mutedText}>{errorMsg}</Text>
      <TouchableOpacity style={[st.bigBtn, { backgroundColor: Colors.primary }]} onPress={() => fetchSoal(index)}>
        <Text style={st.bigBtnText}>Coba Lagi</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
        <Text style={st.mutedText}>← Kembali</Text>
      </TouchableOpacity>
    </View>
  );

  if (phase === 'hasil') {
    const acc = hasilSkor; // 0-100
    const snbt = hasilAkhir || Math.round(400 + (acc / 100) * 400);
    const benarCount = hasilBenar || Object.values(results).filter(Boolean).length;
    const totalCount = hasilTotal || total;
    const color = acc >= 70 ? Colors.success : acc >= 50 ? Colors.secondary : Colors.error;
    const emoji = acc >= 70 ? '🏆' : acc >= 50 ? '📈' : '💪';
    return (
      <View style={st.container}>
        <Animated.ScrollView style={{ opacity: fadeAnim }} contentContainerStyle={st.hasilScroll}>
          <Text style={{ fontSize: 72 }}>{emoji}</Text>
          <Text style={st.hasilTitle}>Sesi Selesai!</Text>

          {/* SNBT Score Card */}
          <View style={[st.scoreCard, { borderColor: color + '50', backgroundColor: color + '08' }]}>
            <Text style={[st.scoreLabel, { color }]}>Estimasi Skor SNBT</Text>
            <Text style={[st.scoreNum, { color, fontSize: 52 }]}>{snbt}</Text>
            <Text style={[st.scoreMax, { color: Colors.textMuted }]}>dari 800</Text>
            <View style={{ height: 1, backgroundColor: color + '30', marginVertical: 10, width: '80%', alignSelf: 'center' }} />
            <Text style={st.scoreLabel}>Akurasi Jawaban</Text>
            <Text style={[st.scoreNum, { color, fontSize: 32 }]}>{acc}<Text style={{ fontSize: 16 }}>%</Text></Text>
          </View>

          {/* Stats Row */}
          <View style={st.statsRow}>
            <View style={st.stat}>
              <Text style={[st.statVal, { color: Colors.success }]}>{benarCount}</Text>
              <Text style={st.statLabel}>Benar</Text>
            </View>
            <View style={st.stat}>
              <Text style={[st.statVal, { color: Colors.error }]}>{totalCount - benarCount}</Text>
              <Text style={st.statLabel}>Salah</Text>
            </View>
            <View style={st.stat}>
              <Text style={st.statVal}>{fmt(totalTime.current)}</Text>
              <Text style={st.statLabel}>Waktu</Text>
            </View>
            <View style={st.stat}>
              <Text style={[st.statVal, { color: Colors.primary }]}>{totalCount}</Text>
              <Text style={st.statLabel}>Soal</Text>
            </View>
          </View>

          {/* Motivasi */}
          <View style={[st.motivasiCard, { borderColor: color + '40' }]}>
            <Text style={{ fontSize: 20 }}>{emoji}</Text>
            <Text style={[st.motivasi, { flex: 1 }]}>
              {acc >= 70 ? 'Luar biasa! Pertahankan konsistensi ini! 🚀'
               : acc >= 50 ? 'Bagus! Terus tingkatkan — kamu hampir mencapai target! 📈'
               : 'Jangan menyerah! Setiap latihan membuatmu lebih kuat! 💪'}
            </Text>
          </View>

          <TouchableOpacity style={[st.bigBtn, { backgroundColor: Colors.primary }]} onPress={() => router.back()}>
            <Ionicons name="book-outline" size={18} color="#fff" />
            <Text style={st.bigBtnText}>Latihan Lagi</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[st.bigBtn, { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border }]} onPress={() => router.replace('/(tabs)')}>
            <Ionicons name="home-outline" size={18} color={Colors.textSecondary} />
            <Text style={[st.bigBtnText, { color: Colors.textSecondary }]}>Ke Beranda</Text>
          </TouchableOpacity>
          <View style={{ height: 60 }} />
        </Animated.ScrollView>
      </View>
    );
  }

  const answered = phase === 'answered';
  const prog = (index + 1) / total;

  return (
    <View style={st.container}>
      {/* Header */}
      <View style={st.header}>
        <TouchableOpacity onPress={() => Alert.alert('Keluar?', 'Progress disimpan.', [
          { text: 'Batal' }, { text: 'Selesai & Keluar', style: 'destructive', onPress: finishSesi },
        ])}>
          <Ionicons name="close" size={22} color={Colors.textMuted} />
        </TouchableOpacity>
        <View style={st.progressWrap}>
          <View style={st.progressTrack}><View style={[st.progressFill, { width: `${prog * 100}%` as any }]} /></View>
          <Text style={st.progressLabel}>{index + 1} / {total}</Text>
        </View>
        <Animated.View style={[st.timerBadge, { borderColor: timerColor + '40', backgroundColor: timerColor + '14', transform: [{ scale: pulseAnim }] }]}>
          <Ionicons name={isCountdown ? 'hourglass-outline' : 'timer-outline'} size={12} color={timerColor} />
          <Text style={[st.timerText, { color: timerColor }]}>{fmt(timer)}</Text>
        </Animated.View>
      </View>

      {/* Question Grid */}
      <View style={st.gridWrap}><QuestionGrid /></View>

      <Animated.ScrollView style={{ opacity: fadeAnim }} showsVerticalScrollIndicator={false} contentContainerStyle={st.soalScroll}>
        {/* Nomor badge */}
        <View style={st.nomorBadge}><Text style={st.nomorText}>Soal {index + 1}</Text></View>

        {/* Wacana */}
        {!!soal?.wacana && (
          <View style={st.wacanaCard}>
            <View style={st.rowGap}><Ionicons name="document-text-outline" size={13} color={Colors.textMuted} /><Text style={st.wacanaLabel}>Wacana</Text></View>
            <Text style={st.wacanaText}>{soal.wacana}</Text>
          </View>
        )}

        {/* Pertanyaan — auto-detect wacana format */}
        {soal?.konten.startsWith('Bacalah teks berikut!') ? (() => {
          const raw          = soal.konten.replace('Bacalah teks berikut!', '').trim();
          const qMatch       = raw.match(/^([\s\S]+?)\s+((?:[A-Z][^!.?]*\?))$/);
          const wacanaText   = qMatch ? qMatch[1].trim() : raw;
          const questionText = qMatch ? qMatch[2].trim() : '';
          return (
            <View style={{ gap: Spacing.md }}>
              {/* Wacana / Bacaan */}
              <View style={st.wacanaCard}>
                <View style={st.rowGap}>
                  <Ionicons name="book-outline" size={13} color={Colors.textMuted} />
                  <Text style={st.wacanaLabel}>📖 Bacalah teks berikut dengan seksama!</Text>
                </View>
                <Text style={st.wacanaText}>{wacanaText}</Text>
              </View>
              {/* Pertanyaan */}
              {questionText ? (
                <Text style={st.konten}>{questionText}</Text>
              ) : null}
            </View>
          );
        })() : (
          <Text style={st.konten}>{soal?.konten}</Text>
        )}

        {/* Pilihan */}
        <View style={st.pilihanList}>
          {(soal?.pilihan_jawaban ?? []).map(p => {
            const isSel   = selectedId === p.id;
            const isRight = answered && correctId === p.id;
            const isWrong = answered && isSel && correctId !== p.id;
            const bc = isRight ? Colors.success : isWrong ? Colors.error : isSel ? Colors.primary : Colors.border;
            const bg = isRight ? Colors.success + '14' : isWrong ? Colors.error + '14' : isSel && !answered ? Colors.primary + '14' : Colors.surface;
            const lbg = isRight ? Colors.success : isWrong ? Colors.error : isSel && !answered ? Colors.primary : Colors.surfaceElevated;
            const lc = (isRight || isWrong || (isSel && !answered)) ? '#fff' : Colors.textSecondary;
            return (
              <TouchableOpacity key={p.id} style={[st.pilihanCard, { borderColor: bc, backgroundColor: bg }]}
                onPress={() => !answered && submitJawab(p.id)} activeOpacity={answered ? 1 : 0.75}>
                <View style={[st.pilihanLabel, { backgroundColor: lbg }]}><Text style={[st.pilihanLabelText, { color: lc }]}>{p.label}</Text></View>
                <Text style={[st.pilihanKonten, isRight && { color: Colors.success, fontWeight: '600' }, isWrong && { color: Colors.error }]}>{p.konten}</Text>
                {isRight && <Ionicons name="checkmark-circle" size={20} color={Colors.success} />}
                {isWrong && <Ionicons name="close-circle"    size={20} color={Colors.error}   />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Feedback */}
        {answered && isCorrect !== null && (
          <View style={[st.feedbackCard, { borderColor: isCorrect ? Colors.success : Colors.error, backgroundColor: isCorrect ? Colors.success + '10' : Colors.error + '10' }]}>
            <Ionicons name={isCorrect ? 'checkmark-circle' : 'close-circle'} size={20} color={isCorrect ? Colors.success : Colors.error} />
            <Text style={[st.feedbackText, { color: isCorrect ? Colors.success : Colors.error }]}>{isCorrect ? 'Jawaban Benar! +10 poin 🎉' : 'Jawaban Salah'}</Text>
          </View>
        )}

        {/* Pembahasan */}
        {answered && soal?.pembahasan && (
          <View style={st.pembahasanCard}>
            <View style={st.rowGap}><Ionicons name="bulb-outline" size={13} color={Colors.secondary} /><Text style={st.pemLabel}>Pembahasan</Text></View>
            <Text style={st.pemText}>{soal.pembahasan}</Text>
          </View>
        )}

        {/* AI Analisis */}
        {answered && (
          <View style={st.aiCard}>
            <View style={st.aiHeader}>
              <Ionicons name="sparkles" size={16} color="#8B5CF6" />
              <Text style={st.aiTitle}>Analisis AI</Text>
              {!dcsef && !aiLoading && (
                <TouchableOpacity style={st.aiBtn} onPress={fetchAi}>
                  <Text style={st.aiBtnText}>Tampilkan</Text>
                </TouchableOpacity>
              )}
              {aiLoading && <ActivityIndicator size="small" color="#8B5CF6" style={{ marginLeft: 8 }} />}
            </View>
            {!!aiError && <Text style={{ color: Colors.error, fontSize: FontSize.xs, marginTop: 6 }}>{aiError}</Text>}
            {dcsef && (
              <View style={{ gap: Spacing.sm, marginTop: Spacing.sm }}>

                {/* S — Stem */}
                <View style={[st.dcsefSection, { borderLeftColor: '#3B82F6', borderLeftWidth: 3 }]}>
                  <View style={st.dcsefBadgeRow}>
                    <View style={[st.dcsefBadge, { backgroundColor: '#3B82F620' }]}>
                      <Text style={[st.dcsefBadgeLetter, { color: '#3B82F6' }]}>S</Text>
                    </View>
                    <Text style={st.dcsefHead}>Stem — Apa yang Ditanya</Text>
                  </View>
                  {dcsef.dekonstruksi?.ditanya && <Text style={st.dcsefBody}>{dcsef.dekonstruksi.ditanya}</Text>}
                  {(dcsef.dekonstruksi?.diketahui?.length ?? 0) > 0 && (
                    <View style={{ marginTop: 4 }}>
                      <Text style={st.dcsefSubHead}>Yang Diketahui:</Text>
                      {dcsef.dekonstruksi.diketahui.map((d: string, i: number) => (
                        <Text key={i} style={st.dcsefBullet}>• {d}</Text>
                      ))}
                    </View>
                  )}
                  {(dcsef.dekonstruksi?.kata_kunci?.length ?? 0) > 0 && (
                    <View style={st.tagRow}>
                      {dcsef.dekonstruksi.kata_kunci.map((k: string, i: number) => (
                        <View key={i} style={[st.tag, { backgroundColor: '#3B82F615' }]}>
                          <Text style={[st.tagText, { color: '#3B82F6' }]}>{k}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                {/* D — Distractor */}
                {((dcsef.dekonstruksi?.jebakan?.length ?? 0) > 0 || (dcsef.classifier?.jebakan_terdeteksi?.length ?? 0) > 0) && (
                  <View style={[st.dcsefSection, { borderLeftColor: Colors.error, borderLeftWidth: 3 }]}>
                    <View style={st.dcsefBadgeRow}>
                      <View style={[st.dcsefBadge, { backgroundColor: Colors.error + '20' }]}>
                        <Text style={[st.dcsefBadgeLetter, { color: Colors.error }]}>D</Text>
                      </View>
                      <Text style={st.dcsefHead}>Distractor — Jebakan Soal</Text>
                    </View>
                    {(dcsef.dekonstruksi?.jebakan ?? dcsef.classifier?.jebakan_terdeteksi ?? []).map((j: string, i: number) => (
                      <View key={i} style={st.jebakanRow}>
                        <Ionicons name="warning-outline" size={12} color={Colors.error} />
                        <Text style={[st.dcsefBody, { flex: 1 }]}>{j}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* C — Context */}
                {dcsef.strategi && (
                  <View style={[st.dcsefSection, { borderLeftColor: Colors.secondary, borderLeftWidth: 3 }]}>
                    <View style={st.dcsefBadgeRow}>
                      <View style={[st.dcsefBadge, { backgroundColor: Colors.secondary + '20' }]}>
                        <Text style={[st.dcsefBadgeLetter, { color: Colors.secondary }]}>C</Text>
                      </View>
                      <Text style={st.dcsefHead}>Context — Konsep & Strategi</Text>
                    </View>
                    {dcsef.strategi.konsep_utama && <Text style={st.dcsefBody}>{dcsef.strategi.konsep_utama}</Text>}
                    {dcsef.strategi.rumus && dcsef.strategi.rumus !== '-' && (
                      <View style={st.rumusBox}><Text style={st.rumusText}>{dcsef.strategi.rumus}</Text></View>
                    )}
                    {dcsef.strategi.kapan_pakai && (
                      <Text style={[st.dcsefBody, { marginTop: 4 }]}>
                        <Text style={{ fontWeight: '700' }}>Kapan pakai: </Text>{dcsef.strategi.kapan_pakai}
                      </Text>
                    )}
                    {dcsef.strategi.bedakan_dengan && (
                      <Text style={st.dcsefBody}>
                        <Text style={{ fontWeight: '700' }}>Bedakan dengan: </Text>{dcsef.strategi.bedakan_dengan}
                      </Text>
                    )}
                    {dcsef.strategi.tips_cepat && (
                      <View style={[st.tipBox]}>
                        <Ionicons name="flash" size={13} color={Colors.secondary} />
                        <Text style={[st.dcsefBody, { flex: 1, color: Colors.secondary }]}>{dcsef.strategi.tips_cepat}</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* E — Execution */}
                {(dcsef.eksekusi?.langkah?.length ?? 0) > 0 && (
                  <View style={[st.dcsefSection, { borderLeftColor: Colors.success, borderLeftWidth: 3 }]}>
                    <View style={st.dcsefBadgeRow}>
                      <View style={[st.dcsefBadge, { backgroundColor: Colors.success + '20' }]}>
                        <Text style={[st.dcsefBadgeLetter, { color: Colors.success }]}>E</Text>
                      </View>
                      <Text style={st.dcsefHead}>Execution — Langkah Pengerjaan</Text>
                    </View>
                    {dcsef.eksekusi.langkah.map((l: any, i: number) => (
                      <View key={i} style={st.langkahRow}>
                        <View style={st.langkahNum}><Text style={st.langkahNumText}>{l.no}</Text></View>
                        <View style={{ flex: 1 }}>
                          <Text style={st.dcsefBody}>{l.aksi}</Text>
                          {l.hasil && <Text style={[st.dcsefBody, { color: Colors.success, fontWeight: '600', marginTop: 2 }]}>→ {l.hasil}</Text>}
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* F — Framework */}
                {dcsef.output && (
                  <View style={[st.dcsefSection, { borderLeftColor: '#8B5CF6', borderLeftWidth: 3 }]}>
                    <View style={st.dcsefBadgeRow}>
                      <View style={[st.dcsefBadge, { backgroundColor: '#8B5CF620' }]}>
                        <Text style={[st.dcsefBadgeLetter, { color: '#8B5CF6' }]}>F</Text>
                      </View>
                      <Text style={st.dcsefHead}>Framework — Jawaban Final</Text>
                    </View>
                    {dcsef.output.jawaban_akhir && (
                      <View style={[st.finalBox]}>
                        <Text style={[st.dcsefBody, { color: Colors.success, fontWeight: '600' }]}>
                          ✅ Opsi {dcsef.output.opsi_benar} — {dcsef.output.jawaban_akhir}
                        </Text>
                      </View>
                    )}
                    {dcsef.output.cara_cepat && (
                      <Text style={[st.dcsefBody, { marginTop: 6 }]}>
                        <Text style={{ fontWeight: '700' }}>🚀 Cara cepat: </Text>{dcsef.output.cara_cepat}
                      </Text>
                    )}
                    {dcsef.output.waktu_ideal_detik && (
                      <Text style={{ color: Colors.textMuted, fontSize: 10, marginTop: 4 }}>
                        ⏱ Waktu ideal: {dcsef.output.waktu_ideal_detik} detik
                      </Text>
                    )}
                  </View>
                )}

              </View>
            )}
          </View>
        )}


        {/* Navigation */}
        <View style={st.navRow}>
          {index > 0 && (
            <TouchableOpacity style={st.navPrev} onPress={goPrev}>
              <Ionicons name="arrow-back" size={16} color={Colors.textMuted} />
              <Text style={st.navPrevText}>Sebelumnya</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[st.navNext, { backgroundColor: index + 1 >= total ? Colors.success : Colors.primary }, !answered && { opacity: 0.4 }]}
            onPress={goNext} disabled={!answered}>
            <Text style={st.navNextText}>{index + 1 >= total ? 'Selesai ✓' : 'Selanjutnya'}</Text>
            {index + 1 < total && <Ionicons name="arrow-forward" size={16} color="#fff" />}
          </TouchableOpacity>
        </View>
        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  mutedText: { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center', paddingHorizontal: 32 },
  errorTitle: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: '800' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  progressWrap: { flex: 1, gap: 3 },
  progressTrack: { height: 5, backgroundColor: Colors.surfaceElevated, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  progressLabel: { color: Colors.textMuted, fontSize: 9, textAlign: 'right' },
  timerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.surfaceElevated, borderRadius: Radius.lg, paddingHorizontal: 9, paddingVertical: 5 },
  timerText: { color: Colors.secondary, fontSize: 11, fontWeight: '700' },

  // Grid
  gridWrap: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  gridScroll: { flexGrow: 0 },
  gridContent: { paddingHorizontal: Spacing.lg, paddingVertical: 10, gap: 6, flexDirection: 'row' },
  gridDot: { width: 34, height: 34, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  gridNum: { fontSize: 11, fontWeight: '800' },

  soalScroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  nomorBadge: { alignSelf: 'flex-start', backgroundColor: Colors.primary + '20', borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: Colors.primary + '40', marginBottom: Spacing.md },
  nomorText: { color: Colors.primaryLight, fontSize: FontSize.xs, fontWeight: '700' },
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 5 },
  wacanaCard: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.xl, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  wacanaLabel: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '700' },
  wacanaText: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 22 },
  konten: { color: Colors.textPrimary, fontSize: FontSize.base, lineHeight: 26, fontWeight: '500', marginBottom: Spacing.lg },
  pilihanList: { gap: Spacing.sm, marginBottom: Spacing.md },
  pilihanCard: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, borderRadius: Radius.xl, borderWidth: 1.5, padding: Spacing.md },
  pilihanLabel: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  pilihanLabelText: { fontSize: FontSize.sm, fontWeight: '800' },
  pilihanKonten: { flex: 1, color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 22, paddingTop: 4 },
  feedbackCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderRadius: Radius.xl, borderWidth: 1, padding: Spacing.md, marginBottom: Spacing.md },
  feedbackText: { fontSize: FontSize.sm, fontWeight: '700' },
  pembahasanCard: { backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.md },
  pemLabel: { color: Colors.secondary, fontSize: FontSize.xs, fontWeight: '700' },
  pemText: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 22 },
  aiCard: { backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1.5, borderColor: '#8B5CF6' + '40', padding: Spacing.md, marginBottom: Spacing.lg },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  aiTitle: { flex: 1, color: '#8B5CF6', fontSize: FontSize.sm, fontWeight: '800' },
  aiBtn: { backgroundColor: '#8B5CF6' + '20', borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: '#8B5CF6' + '40' },
  aiBtnText: { color: '#8B5CF6', fontSize: FontSize.xs, fontWeight: '700' },
  aiText: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 22, marginTop: Spacing.sm },
  dcsefSection: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.lg, padding: Spacing.sm, gap: 5 },
  dcsefBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  dcsefBadge: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  dcsefBadgeLetter: { fontSize: 13, fontWeight: '900' },
  dcsefHead: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '800' },
  dcsefSubHead: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '700', marginBottom: 2 },
  dcsefBody: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20 },
  dcsefBullet: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20, marginLeft: 4 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 4 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  tagText: { fontSize: 10, fontWeight: '700' },
  jebakanRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 5, marginTop: 2 },
  tipBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 5, backgroundColor: Colors.secondary + '10', borderRadius: Radius.md, padding: 8, marginTop: 4 },
  finalBox: { backgroundColor: Colors.success + '10', borderRadius: Radius.md, padding: 10, marginTop: 4 },
  rumusBox: { backgroundColor: Colors.background, borderRadius: Radius.md, padding: 8, marginTop: 4, borderWidth: 1, borderColor: Colors.border },
  rumusText: { color: Colors.secondary, fontSize: FontSize.sm, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  langkahRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginTop: 4 },
  langkahNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.success + '20', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  langkahNumText: { color: Colors.success, fontSize: 10, fontWeight: '800' },
  navRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  navPrev: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 14, paddingHorizontal: Spacing.md, borderRadius: Radius.xl, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  navPrevText: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '600' },
  navNext: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: Radius.xl },
  navNextText: { color: '#fff', fontSize: FontSize.base, fontWeight: '700' },

  // Hasil
  hasilScroll: { paddingHorizontal: Spacing.lg, paddingTop: Platform.OS === 'ios' ? 80 : 60, alignItems: 'center', gap: Spacing.md },
  hasilTitle: { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: '900' },
  scoreCard: { backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 2, padding: Spacing.xl, alignItems: 'center', gap: 4, width: width * 0.75 },
  scoreLabel: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.5 },
  scoreNum: { fontSize: 72, fontWeight: '900', letterSpacing: -2, lineHeight: 80 },
  scoreMax: { color: Colors.textMuted, fontSize: FontSize.sm },
  statsRow: { flexDirection: 'row', gap: Spacing.lg },
  stat: { alignItems: 'center', gap: 4 },
  statVal: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: '800' },
  statLabel: { color: Colors.textMuted, fontSize: FontSize.xs },
  motivasiCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1, padding: Spacing.md, width: '100%' },
  motivasi: { color: Colors.textSecondary, fontSize: FontSize.sm, textAlign: 'center', lineHeight: 22 },
  bigBtn: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: 15, borderRadius: Radius.xl },
  bigBtnText: { color: '#fff', fontSize: FontSize.base, fontWeight: '700' },
});
