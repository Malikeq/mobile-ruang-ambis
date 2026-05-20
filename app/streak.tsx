import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Platform, ActivityIndicator, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { API_BASE } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const { width } = Dimensions.get('window');
const SZ = 68;
const RH = 108;

const SECTIONS = [
  { label: 'Dasar SNBT',       color: Colors.primary, bg: '#0A1A3A', unit: 1, at: 0  },
  { label: 'TPA & Penalaran',  color: '#CE82FF',      bg: '#2A1A3A', unit: 2, at: 5  },
  { label: 'Literasi',         color: '#FF9600',      bg: '#3A2200', unit: 3, at: 10 },
  { label: 'Matematika',       color: '#1CB0F6',      bg: '#002A3A', unit: 4, at: 15 },
];

// SNBT 2026 key dates for calendar markers
const SNBT_EVENTS: { date: string; label: string; color: string; emoji: string }[] = [
  { date: '2026-01-06', label: 'Reg SNBP',  color: '#58CC02', emoji: '📋' },
  { date: '2026-02-18', label: 'SNBP',      color: '#58CC02', emoji: '🎓' },
  { date: '2026-03-18', label: 'SNBP Hasil',color: '#10B981', emoji: '📊' },
  { date: '2026-03-20', label: 'Reg SNBT',  color: Colors.primary, emoji: '📝' },
  { date: '2026-04-23', label: 'SNBT H1',   color: Colors.primary, emoji: '🔔' },
  { date: '2026-04-24', label: 'SNBT H2',   color: Colors.primary, emoji: '🔔' },
  { date: '2026-06-17', label: 'Hasil SNBT',color: '#FF9600', emoji: '🏆' },
  { date: '2026-06-01', label: 'UM UGM',    color: '#CE82FF', emoji: '🏛️' },
  { date: '2026-06-08', label: 'USMI ITB',  color: '#FF4B4B', emoji: '⚙️' },
  { date: '2026-06-15', label: 'SIMAK UI',  color: '#FF9600', emoji: '🏫' },
];

const EXAMS = [
  { id: 'snbt', label: 'SNBT 2026',  emoji: '📝', color: '#1CB0F6', date: new Date('2026-04-23') },
  { id: 'snbp', label: 'SNBP 2026',  emoji: '🎓', color: '#58CC02', date: new Date('2026-03-18') },
  { id: 'ugm',  label: 'UM UGM',     emoji: '🏛️', color: '#CE82FF', date: new Date('2026-06-01') },
  { id: 'ui',   label: 'SIMAK UI',   emoji: '🏫', color: '#FF9600', date: new Date('2026-06-15') },
  { id: 'itb',  label: 'USMI ITB',   emoji: '⚙️', color: '#FF4B4B', date: new Date('2026-06-08') },
];

const PATH_X  = [0.48, 0.70, 0.78, 0.60, 0.38, 0.18, 0.15, 0.32, 0.52, 0.72, 0.80, 0.60, 0.36, 0.16, 0.22, 0.46, 0.68, 0.76, 0.55, 0.30];
const NODE_ICONS = ['⭐','📖','🎯','⚡','🏅','🔬','📐','💡','🚀','🤖','🧠','📊','✏️','🗺️','🌟','🎪','🔑','💎','🏆','✍️'];
const TIPS = [
  '🤖 AI: Fokus pada soal Penalaran Umum — kelemahan terbesarmu!',
  '📊 AI: Rata-rata skor SNBT peserta PTN targetmu: 680-720',
  '🎯 AI: Kerjakan 20 soal/hari untuk lolos dalam 60 hari!',
  '🧠 AI: Strategi terbaik: mulai dari mapel paling lemah dulu',
];

function daysLeft(d: Date) { return Math.max(0, Math.ceil((d.getTime() - Date.now()) / 86400000)); }
function getSection(idx: number) { return [...SECTIONS].reverse().find(s => idx >= s.at) ?? SECTIONS[0]; }

/** Tiered streak emoji — upgrades every 10 days */
function streakEmoji(streak: number): string {
  if (streak >= 100) return '🌋';
  if (streak >= 60)  return '⚡🔥';
  if (streak >= 50)  return '💥';
  if (streak >= 40)  return '🔥🌟';
  if (streak >= 30)  return '🔥🔥🔥';
  if (streak >= 20)  return '🔥🔥';
  if (streak >= 10)  return '🔥✨';
  return '🔥';
}

/** Format date to YYYY-MM-DD for event lookup */
function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
const EVENT_MAP = Object.fromEntries(SNBT_EVENTS.map(e => [e.date, e]));

function PathNode({ icon, done, active, xFrac, isChest, section }: {
  icon: string; done: boolean; active: boolean; xFrac: number; isChest?: boolean; section: typeof SECTIONS[0];
}) {
  const pulse = useRef(new Animated.Value(1)).current;
  const glow  = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) return;
    Animated.loop(Animated.sequence([
      Animated.parallel([
        Animated.timing(pulse, { toValue: 1.14, duration: 750, useNativeDriver: true }),
        Animated.timing(glow,  { toValue: 1,    duration: 750, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(pulse, { toValue: 1,    duration: 750, useNativeDriver: true }),
        Animated.timing(glow,  { toValue: 0.2,  duration: 750, useNativeDriver: true }),
      ]),
    ])).start();
  }, [active]);

  const sz    = isChest ? 54 : SZ;
  const left  = xFrac * (width - sz - 32) + 16;
  const color = done ? section.color : active ? section.color : '#3A4560';
  const bg    = done ? section.bg : active ? section.bg : '#1A2030';

  return (
    <View style={[s.row, { height: RH }]}>
      <Animated.View style={[s.node, {
        width: sz, height: sz, borderRadius: sz / 2,
        backgroundColor: bg, borderColor: color, left,
        transform: [{ scale: active ? pulse : 1 }],
        shadowColor: color, shadowOpacity: done || active ? 0.6 : 0, shadowRadius: active ? 20 : 10, elevation: active ? 14 : done ? 6 : 1,
      }]}>
        <View style={[s.shine, { width: sz * 0.5, top: sz * 0.1 }]} />
        <Text style={{ fontSize: isChest ? 26 : 28 }}>
          {done ? (isChest ? '🎁' : icon) : active ? icon : isChest ? '📦' : '🔒'}
        </Text>
        {!done && !active && (
          <View style={[s.lockBadge, { borderColor: '#3A4560' }]}>
            <Ionicons name="lock-closed" size={8} color="#5A6580" />
          </View>
        )}
        {done && !isChest && (
          <View style={[s.checkBadge, { backgroundColor: section.color }]}>
            <Ionicons name="checkmark" size={10} color="#fff" />
          </View>
        )}
        {active && (
          <Animated.View style={[s.glowRing, { opacity: glow, width: sz + 22, height: sz + 22, borderRadius: (sz + 22) / 2, borderColor: color, left: -11, top: -11 }]} />
        )}
      </Animated.View>
      {active && (
        <View style={[s.bubble, { left: left + sz + 10, borderColor: section.color }]}>
          <Text style={[s.bubbleTxt, { color: section.color }]}>Latihan Sekarang!</Text>
        </View>
      )}
    </View>
  );
}

function SectionBanner({ sec }: { sec: typeof SECTIONS[0] }) {
  return (
    <View style={[s.banner, { backgroundColor: sec.color }]}>
      <View style={{ flex: 1 }}>
        <Text style={s.bannerSub}>UNIT {sec.unit}</Text>
        <Text style={s.bannerTitle}>{sec.label}</Text>
      </View>
      <TouchableOpacity style={s.bannerBtn} onPress={() => router.push('/ai-chat')}>
        <Ionicons name="list" size={18} color={sec.color} />
      </TouchableOpacity>
    </View>
  );
}

function TipCard({ streak }: { streak: number }) {
  const tip = TIPS[streak % TIPS.length];
  return (
    <View style={s.tipCard}>
      <View style={s.tipIcon}><Ionicons name="sparkles" size={16} color="#CE82FF" /></View>
      <Text style={s.tipTxt}>{tip}</Text>
    </View>
  );
}

interface Dash { streak: number; points: number; total_soal_dikerjakan: number; akurasi_overall: number; }

export default function StreakScreen() {
  const { token } = useAuth();
  const [data,  setData]  = useState<Dash | null>(null);
  const [load,  setLoad]  = useState(true);
  const [exam,  setExam]  = useState(EXAMS[0]);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetch(`${API_BASE}/dashboard`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } })
      .then(r => r.json()).then(j => setData(j?.data)).catch(() => {}).finally(() => setLoad(false));
    Animated.timing(fade, { toValue: 1, duration: 450, useNativeDriver: true }).start();
  }, []);

  if (load) return <View style={[s.container, { alignItems: 'center', justifyContent: 'center' }]}><ActivityIndicator color={Colors.primary} size="large" /></View>;

  const streak = data?.streak ?? 0;
  const pts    = data?.points ?? 0;
  const acc    = Math.round(data?.akurasi_overall ?? 0);
  const soal   = data?.total_soal_dikerjakan ?? 0;

  // Build path items: section banners + nodes + chests
  const items: { type: string; idx: number }[] = [];
  for (let i = 0; i < 20; i++) {
    if (SECTIONS.some(sec => sec.at === i)) items.push({ type: 'section', idx: i });
    if (i > 0 && i % 5 === 0) items.push({ type: 'chest', idx: i });
    items.push({ type: 'node', idx: i });
  }

  let ni = 0;
  const curSec = getSection(streak);

  return (
    <View style={s.container}>
      {/* Duolingo-style top stats bar */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={22} color="#fff" /></TouchableOpacity>
        <View style={s.statRow}>
          <View style={s.stat}><Text style={{ fontSize: 16 }}>{streakEmoji(streak)}</Text><Text style={s.statVal}>{streak}</Text></View>
          <View style={s.stat}><Text style={{ fontSize: 16 }}>💎</Text><Text style={[s.statVal, { color: '#1CB0F6' }]}>{pts}</Text></View>
          <View style={s.stat}><Text style={{ fontSize: 16 }}>⚡</Text><Text style={[s.statVal, { color: '#FF9600' }]}>{soal}</Text></View>
          <View style={s.stat}><Text style={{ fontSize: 16 }}>🎯</Text><Text style={[s.statVal, { color: '#58CC02' }]}>{acc}%</Text></View>
        </View>
      </View>

      <Animated.ScrollView style={{ opacity: fade }} showsVerticalScrollIndicator={false}>
        {/* Active section banner */}
        <SectionBanner sec={curSec} />

        {/* AI Tip */}
        <TipCard streak={streak} />

        {/* Winding path */}
        <View style={{ paddingBottom: 8 }}>
          {items.map((item, ii) => {
            if (item.type === 'section' && item.idx > 0) {
              const sec = getSection(item.idx);
              return (
                <View key={`sec-${ii}`} style={s.divRow}>
                  <View style={[s.divLine, { backgroundColor: sec.color + '30' }]} />
                  <Text style={[s.divTxt, { color: sec.color }]}>{sec.label}</Text>
                  <View style={[s.divLine, { backgroundColor: sec.color + '30' }]} />
                </View>
              );
            }
            if (item.type === 'section') return null;
            const xi = ni++;
            const done   = item.idx < streak;
            const active = item.idx === streak;
            const sec    = getSection(item.idx);
            return (
              <PathNode key={`n-${ii}`}
                icon={NODE_ICONS[xi % NODE_ICONS.length]}
                done={done} active={active}
                xFrac={PATH_X[xi % PATH_X.length]}
                isChest={item.type === 'chest'}
                section={sec}
              />
            );
          })}
        </View>

        {/* Daily points earned */}
        <View style={s.section}>
          <Text style={s.sTitle}>📈 Poin Harian</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {Array.from({ length: Math.min(streak, 7) }, (_, i) => {
              const dayPts = 10 + (i * 3) % 20;
              const today  = new Date(); today.setDate(today.getDate() - (streak - 1 - i));
              return (
                <View key={i} style={s.dayPtCard}>
                  <Text style={s.dayPtDay}>{today.toLocaleDateString('id-ID', { weekday: 'short' })}</Text>
                  <Text style={{ fontSize: 16 }}>🔥</Text>
                  <Text style={s.dayPtVal}>+{dayPts}</Text>
                  <Text style={s.dayPtLabel}>poin</Text>
                </View>
              );
            })}
            {streak === 0 && (
              <View style={[s.dayPtCard, { opacity: 0.5 }]}>
                <Text style={s.dayPtDay}>Hari ini</Text>
                <Text style={{ fontSize: 16 }}>🌱</Text>
                <Text style={s.dayPtVal}>+10</Text>
                <Text style={s.dayPtLabel}>setelah latihan</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Upcoming exams countdown */}
        <View style={s.section}>
          <Text style={s.sTitle}>⏳ Jadwal Ujian</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
            {EXAMS.map(e => (
              <TouchableOpacity key={e.id} style={[s.examChip, exam.id === e.id && { backgroundColor: e.color + '20', borderColor: e.color }]} onPress={() => setExam(e)}>
                <Text>{e.emoji}</Text>
                <Text style={[s.examChipTxt, exam.id === e.id && { color: e.color, fontWeight: '800' }]}>{e.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={[s.countCard, { borderColor: exam.color + '60' }]}>
            <Text style={{ fontSize: 38 }}>{exam.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[s.countName, { color: exam.color }]}>{exam.label}</Text>
              <Text style={s.countDate}>{exam.date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
              <Text style={s.countHint}>Butuh {Math.max(0, Math.floor(daysLeft(exam.date) / 30))} bulan lagi untuk persiapan optimal</Text>
            </View>
            <View style={[s.countCircle, { borderColor: exam.color }]}>
              <Text style={[s.countNum, { color: exam.color }]}>{daysLeft(exam.date)}</Text>
              <Text style={s.countUnit}>hari</Text>
            </View>
          </View>
        </View>

        {/* Calendar heatmap with dates + SNBT events */}
        <View style={s.section}>
          <Text style={s.sTitle}>📅 Kalender Aktivitas</Text>
          <View style={s.calCard}>
            {/* Day headers */}
            <View style={{ flexDirection: 'row', marginBottom: 4 }}>
              {['Min','Sen','Sel','Rab','Kam','Jum','Sab'].map((d, i) => (
                <Text key={i} style={s.calHdr}>{d}</Text>
              ))}
            </View>
            {(() => {
              const today    = new Date();
              today.setHours(0,0,0,0);
              // Anchor to Sunday of 6 weeks ago
              const startDay = new Date(today);
              startDay.setDate(today.getDate() - 41);
              // Shift back to Sunday
              startDay.setDate(startDay.getDate() - startDay.getDay());

              const cells = Array.from({ length: 42 }, (_, i) => {
                const d = new Date(startDay); d.setDate(startDay.getDate() + i);
                const daysAgo   = Math.round((today.getTime() - d.getTime()) / 86400000);
                const isFuture  = daysAgo < 0;
                const isToday   = daysAgo === 0;
                const active    = !isFuture && daysAgo < streak;
                const key       = dateKey(d);
                const event     = EVENT_MAP[key];
                return { d, daysAgo, active, isToday, isFuture, event };
              });
              const weeks: typeof cells[] = [];
              for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i+7));

              return (
                <View style={{ flexDirection: 'row', gap: 3 }}>
                  {weeks.map((w, wi) => (
                    <View key={wi} style={{ gap: 3, flex: 1 }}>
                      {w.map((c, ci) => (
                        <View key={ci} style={{ position: 'relative' }}>
                          <View style={[s.calCell,
                            c.isFuture  && { backgroundColor: '#151A25', opacity: 0.4 },
                            c.active    && { backgroundColor: Colors.primary },
                            c.isToday   && { borderWidth: 2, borderColor: '#F59E0B', backgroundColor: c.active ? Colors.primary : '#1A2030' },
                            c.event     && { borderWidth: 1.5, borderColor: c.event.color },
                          ]} />
                          {/* Date number */}
                          <Text style={[s.calDate,
                            c.active   && { color: '#fff' },
                            c.isToday  && { color: '#F59E0B', fontWeight: '900' },
                            c.isFuture && { color: '#2A3550' },
                          ]}>{c.d.getDate()}</Text>
                          {/* Event emoji dot */}
                          {c.event && (
                            <Text style={s.calEventDot}>{c.event.emoji}</Text>
                          )}
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              );
            })()}

            {/* Legend */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, alignItems: 'center' }}>
              <View style={s.legRow}><View style={[s.calCell, { width: 14, height: 14 }]} /><Text style={s.legTxt}>Tidak aktif</Text></View>
              <View style={s.legRow}><View style={[s.calCell, { width: 14, height: 14, backgroundColor: Colors.primary }]} /><Text style={s.legTxt}>Aktif</Text></View>
              <View style={s.legRow}><View style={[s.calCell, { width: 14, height: 14, borderWidth: 2, borderColor: '#F59E0B' }]} /><Text style={s.legTxt}>Hari ini</Text></View>
              <View style={s.legRow}><View style={[s.calCell, { width: 14, height: 14, borderWidth: 1.5, borderColor: Colors.primary }]} /><Text style={s.legTxt}>Event SNBT</Text></View>
            </View>

            {/* Upcoming SNBT events in next 90 days */}
            {(() => {
              const upcoming = SNBT_EVENTS
                .filter(e => {
                  const d = new Date(e.date);
                  const diff = Math.ceil((d.getTime() - Date.now()) / 86400000);
                  return diff >= 0 && diff <= 90;
                })
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .slice(0, 4);
              if (!upcoming.length) return null;
              return (
                <View style={{ marginTop: 12, gap: 6 }}>
                  <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>AGENDA 90 HARI KE DEPAN</Text>
                  {upcoming.map(e => {
                    const diff = Math.ceil((new Date(e.date).getTime() - Date.now()) / 86400000);
                    return (
                      <View key={e.date} style={[s.eventRow, { borderLeftColor: e.color }]}>
                        <Text style={{ fontSize: 16 }}>{e.emoji}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[s.eventLabel, { color: e.color }]}>{e.label}</Text>
                          <Text style={s.eventDate}>{new Date(e.date).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' })}</Text>
                        </View>
                        <View style={[s.eventPill, { backgroundColor: e.color + '20', borderColor: e.color }]}>
                          <Text style={[s.eventPillTxt, { color: e.color }]}>{diff}h lagi</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              );
            })()}
          </View>
        </View>

        {/* Milestones */}
        <View style={s.section}>
          <Text style={s.sTitle}>🏅 Milestone Streak</Text>
          <View style={{ gap: 8 }}>
            {[
              { days: 3,   emoji: '🌱',    label: '3 Hari — Bibit',          color: '#58CC02' },
              { days: 7,   emoji: '🔥',    label: '1 Minggu — Mulai Panas',  color: '#FF9600' },
              { days: 10,  emoji: '🔥✨',  label: '10 Hari — Api Menyala',  color: '#F59E0B' },
              { days: 14,  emoji: '⚡',    label: '2 Minggu — Kilat',        color: '#1CB0F6' },
              { days: 20,  emoji: '🔥🔥',  label: '20 Hari — Api Kembar',   color: '#EF4444' },
              { days: 30,  emoji: '🔥🔥🔥',label: '1 Bulan — Inferno',      color: '#CE82FF' },
              { days: 40,  emoji: '🔥🌟',  label: '40 Hari — Bintang Api',  color: '#A855F7' },
              { days: 50,  emoji: '💥',    label: '50 Hari — Ledakan',      color: '#FF4B4B' },
              { days: 60,  emoji: '⚡🔥',  label: '60 Hari — Petir Api',    color: '#06B6D4' },
              { days: 100, emoji: '🌋',    label: '100 Hari — Gunung Api',  color: '#DC2626' },
            ].map(m => {
              const done = streak >= m.days;
              const pct  = Math.min(1, streak / m.days);
              return (
                <View key={m.days} style={[s.msCard, done && { borderColor: m.color + '50', backgroundColor: m.color + '10' }]}>
                  <Text style={[{ fontSize: 24 }, !done && { opacity: 0.25 }]}>{m.emoji}</Text>
                  <View style={{ flex: 1, gap: 5 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={[s.msLabel, done && { color: m.color }]}>{m.label}</Text>
                      <Text style={[s.msPct, { color: m.color }]}>{Math.min(streak, m.days)}/{m.days}</Text>
                    </View>
                    <View style={s.msTrack}>
                      <View style={[s.msFill, { width: `${pct * 100}%` as any, backgroundColor: m.color }]} />
                    </View>
                  </View>
                  {done && <Ionicons name="checkmark-circle" size={22} color={m.color} />}
                </View>
              );
            })}
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, paddingBottom: 140, paddingTop: 8 }}>
          <TouchableOpacity style={[s.cta, { backgroundColor: curSec.color }]} onPress={() => router.push('/(tabs)/latihan')}>
            <Ionicons name="flash" size={20} color="#fff" />
            <Text style={s.ctaTxt}>Latihan & Jaga Streak!</Text>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1117' },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 54 : 42, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1C2333', gap: 12 },
  statRow: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 18 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statVal: { color: '#fff', fontSize: 15, fontWeight: '800' },
  banner: { margin: 16, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center' },
  bannerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  bannerTitle: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 2 },
  bannerBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  tipCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#1E1A2E', borderRadius: 14, borderWidth: 1.5, borderColor: '#CE82FF40', padding: 14, marginHorizontal: 16, marginBottom: 8 },
  tipIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#CE82FF20', alignItems: 'center', justifyContent: 'center' },
  tipTxt: { flex: 1, color: '#D4AAFF', fontSize: 12, lineHeight: 18 },
  row: { position: 'relative', width: '100%' },
  node: { position: 'absolute', top: (RH - SZ) / 2, borderWidth: 3.5, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  shine: { position: 'absolute', height: 10, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 5 },
  glowRing: { position: 'absolute', borderWidth: 3 },
  lockBadge: { position: 'absolute', bottom: 3, right: 3, width: 18, height: 18, borderRadius: 9, backgroundColor: '#1A2030', borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  checkBadge: { position: 'absolute', bottom: 3, right: 3, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#0F1117' },
  bubble: { position: 'absolute', top: '30%', borderRadius: 10, borderWidth: 2, backgroundColor: '#0F1117', paddingHorizontal: 10, paddingVertical: 5 },
  bubbleTxt: { fontSize: 11, fontWeight: '800' },
  divRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 10 },
  divLine: { flex: 1, height: 1.5 },
  divTxt: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  section: { paddingHorizontal: 16, paddingTop: 16, marginBottom: 4 },
  sTitle: { color: '#fff', fontSize: 14, fontWeight: '800', marginBottom: 10 },
  dayPtCard: { backgroundColor: '#1C2333', borderRadius: 14, borderWidth: 1.5, borderColor: '#2A3550', padding: 12, alignItems: 'center', gap: 3, marginRight: 10, width: 76 },
  dayPtDay: { color: '#6B7280', fontSize: 9, fontWeight: '700' },
  dayPtVal: { color: '#FF9600', fontSize: 16, fontWeight: '900' },
  dayPtLabel: { color: '#6B7280', fontSize: 9 },
  examChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#1C2333', borderRadius: 99, borderWidth: 1.5, borderColor: '#2A3550', paddingHorizontal: 12, paddingVertical: 7, marginRight: 8 },
  examChipTxt: { color: '#9CA3AF', fontSize: 11, fontWeight: '600' },
  countCard: { backgroundColor: '#1C2333', borderRadius: 16, borderWidth: 2, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8 },
  countName: { fontSize: 16, fontWeight: '800' },
  countDate: { color: '#9CA3AF', fontSize: 11, marginTop: 2 },
  countHint: { color: '#6B7280', fontSize: 10, marginTop: 4 },
  countCircle: { width: 70, height: 70, borderRadius: 35, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  countNum: { fontSize: 22, fontWeight: '900', lineHeight: 26 },
  countUnit: { color: '#6B7280', fontSize: 9, fontWeight: '700' },
  calCard: { backgroundColor: '#1C2333', borderRadius: 16, borderWidth: 1, borderColor: '#2A3550', padding: 14 },
  calHdr: { color: '#6B7280', fontSize: 8, flex: 1, textAlign: 'center' },
  calCell: { flex: 1, aspectRatio: 1, borderRadius: 3, backgroundColor: '#2A3550' },
  calDate: { position: 'absolute', bottom: 1, right: 2, fontSize: 6, color: '#6B7280', fontWeight: '600' },
  calEventDot: { position: 'absolute', top: -4, right: -4, fontSize: 8 },
  legRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legTxt: { color: '#6B7280', fontSize: 9, marginRight: 4 },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#151A25', borderRadius: 10, padding: 10, borderLeftWidth: 3 },
  eventLabel: { fontSize: 12, fontWeight: '800' },
  eventDate: { color: '#6B7280', fontSize: 10, marginTop: 1 },
  eventPill: { borderRadius: 99, borderWidth: 1.5, paddingHorizontal: 8, paddingVertical: 4 },
  eventPillTxt: { fontSize: 10, fontWeight: '800' },
  msCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1C2333', borderRadius: 14, borderWidth: 1, borderColor: '#2A3550', padding: 14 },
  msLabel: { color: '#fff', fontSize: 12, fontWeight: '700' },
  msPct: { fontSize: 11, fontWeight: '700' },
  msTrack: { height: 7, backgroundColor: '#2A3550', borderRadius: 4, overflow: 'hidden' },
  msFill: { height: '100%', borderRadius: 4 },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, paddingVertical: 16, marginTop: 8 },
  ctaTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
