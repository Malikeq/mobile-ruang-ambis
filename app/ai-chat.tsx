import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { API_BASE } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Msg { role: 'user' | 'ai'; text: string; }

function toStr(v: any): string {
  if (!v) return '';
  if (typeof v === 'string') return v;
  return v.nama ?? v.akronim ?? '';
}

export default function AiChatScreen() {
  const { token, user } = useAuth();
  const [msgs,    setMsgs]    = useState<Msg[]>([]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const [ctxReady,setCtxReady]= useState(false);
  const [targets, setTargets] = useState<any[]>([]);
  const [weakList,setWeak]    = useState<any[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  const H = { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' };

  useEffect(() => { buildContext(); }, []);

  const buildContext = async () => {
    try {
      const [tRes, wRes] = await Promise.all([
        fetch(`${API_BASE}/user/targets`, { headers: H }),
        fetch(`${API_BASE}/weakness`, { headers: H }),
      ]);
      const tJson = await tRes.json();
      const wJson = await wRes.json();
      const t = tJson?.data ?? [];
      const w = wJson?.data ?? [];
      setTargets(t);
      setWeak(w);

      // Build opening greeting with context
      const targetStr = t.map((x: any, i: number) =>
        `${i+1}. ${toStr(x.kampus)} — ${toStr(x.jurusan)}`
      ).join(', ') || 'belum diatur';

      const weakStr = w.slice(0, 3).map((x: any) =>
        `${toStr(x.mapel || x.sub_materi)}`
      ).join(', ') || 'belum ada data';

      const greeting = `Halo ${user?.name?.split(' ')[0] ?? 'Pejuang'}! 👋\n\nAku AI Tutor personalisasimu. Berdasarkan profilmu:\n🎯 **Target PTN:** ${targetStr}\n⚠️ **Area kelemahan:** ${weakStr}\n\nAku siap bantu kamu strategi belajar, analisis soal, atau motivasi. Apa yang ingin kamu tanyakan?`;

      setMsgs([{ role: 'ai', text: greeting }]);
    } catch {
      setMsgs([{ role: 'ai', text: 'Halo! Aku AI Tutor-mu. Ada yang bisa aku bantu untuk persiapan SNBT-mu? 🚀' }]);
    }
    setCtxReady(true);
  };

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput('');
    setMsgs(prev => [...prev, { role: 'user', text: q }]);
    setLoading(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    try {
      const res  = await fetch(`${API_BASE}/ai/tanya`, {
        method: 'POST', headers: H,
        body: JSON.stringify({ soal_id: 0, pertanyaan: q }),
      });
      const json = await res.json();
      const reply = json?.data?.jawaban ?? json?.message ?? 'Maaf, coba lagi ya.';
      setMsgs(prev => [...prev, { role: 'ai', text: reply }]);
    } catch {
      setMsgs(prev => [...prev, { role: 'ai', text: 'Koneksi bermasalah. Coba lagi ya! 🔄' }]);
    }
    setLoading(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const QUICK = [
    '📊 Analisis peluang lolosku',
    '📅 Strategi belajar 30 hari',
    '⚠️ Fokus kelemahan saya',
    '🎯 Tips soal TPA SNBT',
  ];

  return (
    <KeyboardAvoidingView style={st.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={st.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.textMuted} />
        </TouchableOpacity>
        <View style={st.headerCenter}>
          <View style={st.aiAvatar}><Ionicons name="sparkles" size={16} color="#fff" /></View>
          <View>
            <Text style={st.headerTitle}>AI Tutor</Text>
            <Text style={st.headerSub}>Personalisasi untuk {user?.name?.split(' ')[0] ?? 'kamu'}</Text>
          </View>
        </View>
        <View style={st.onlineDot} />
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={st.msgList}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {/* Context pills */}
        {targets.length > 0 && (
          <View style={st.ctxRow}>
            {targets.slice(0, 2).map((t, i) => (
              <View key={i} style={st.ctxPill}>
                <Text style={st.ctxPillText}>🎯 {toStr(t.kampus)}</Text>
              </View>
            ))}
          </View>
        )}

        {msgs.map((m, i) => (
          <View key={i} style={[st.bubble, m.role === 'user' ? st.bubbleUser : st.bubbleAI]}>
            {m.role === 'ai' && (
              <View style={st.aiBubbleIcon}><Ionicons name="sparkles" size={12} color="#8B5CF6" /></View>
            )}
            <Text style={[st.bubbleText, m.role === 'user' && st.bubbleTextUser]}>{m.text}</Text>
          </View>
        ))}

        {loading && (
          <View style={[st.bubble, st.bubbleAI]}>
            <View style={st.typingDots}>
              {[0,1,2].map(i => <View key={i} style={st.dot} />)}
            </View>
          </View>
        )}

        {/* Quick suggestions */}
        {msgs.length <= 1 && !loading && (
          <View style={st.quickWrap}>
            <Text style={st.quickTitle}>Tanya sesuatu:</Text>
            {QUICK.map((q, i) => (
              <TouchableOpacity key={i} style={st.quickBtn} onPress={() => { setInput(q); }}>
                <Text style={st.quickBtnText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Input */}
      <View style={st.inputRow}>
        <TextInput
          style={st.input}
          value={input}
          onChangeText={setInput}
          placeholder="Tanya apapun tentang SNBT..."
          placeholderTextColor={Colors.textMuted}
          multiline
          maxLength={500}
          onSubmitEditing={send}
        />
        <TouchableOpacity
          style={[st.sendBtn, (!input.trim() || loading) && { opacity: 0.4 }]}
          onPress={send}
          disabled={!input.trim() || loading}
        >
          {loading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Ionicons name="send" size={18} color="#fff" />
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  aiAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '800' },
  headerSub: { color: Colors.textMuted, fontSize: 10 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },

  msgList: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  ctxRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: Spacing.md },
  ctxPill: { backgroundColor: Colors.primary + '20', borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: Colors.primary + '40' },
  ctxPillText: { color: Colors.primaryLight, fontSize: 10, fontWeight: '700' },

  bubble: { maxWidth: '85%', borderRadius: Radius.xl, padding: Spacing.md, marginBottom: Spacing.sm },
  bubbleAI: { backgroundColor: Colors.surface, alignSelf: 'flex-start', borderWidth: 1, borderColor: Colors.border },
  bubbleUser: { backgroundColor: Colors.primary, alignSelf: 'flex-end' },
  aiBubbleIcon: { marginBottom: 4 },
  bubbleText: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 22 },
  bubbleTextUser: { color: '#fff' },

  typingDots: { flexDirection: 'row', gap: 4, paddingVertical: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.textMuted },

  quickWrap: { gap: Spacing.sm, marginTop: Spacing.md },
  quickTitle: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '700' },
  quickBtn: { backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md },
  quickBtnText: { color: Colors.textSecondary, fontSize: FontSize.sm },

  inputRow: {
    flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.border,
    backgroundColor: Colors.background,
    paddingBottom: Platform.OS === 'ios' ? 32 : Spacing.md,
  },
  input: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md,
    paddingVertical: 12, color: Colors.textPrimary, fontSize: FontSize.sm, maxHeight: 100,
  },
  sendBtn: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: '#8B5CF6',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 8,
  },
});
