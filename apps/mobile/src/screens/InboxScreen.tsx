import React, { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, FlatList, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Conversation, getInbox, getMediaUrl } from '../api';

type Props = { token: string; onBack: () => void; onOpenConversation: (conversation: Conversation) => void };

export default function InboxScreen({ token, onBack, onOpenConversation }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const refresh = async () => {
    setRefreshing(true);
    try { setConversations(await getInbox(token)); setError(''); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not load your inbox.'); }
    finally { setRefreshing(false); }
  };

  useEffect(() => {
    let active = true;
    let pending = false;
    const load = async () => {
      if (pending) return;
      pending = true;
      try {
        const items = await getInbox(token);
        if (active) { setConversations(items); setError(''); }
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : 'Could not load your inbox.');
      } finally {
        pending = false;
        if (active) setLoading(false);
      }
    };
    void load();
    const interval = setInterval(() => { if (AppState.currentState === 'active') void load(); }, 10000);
    return () => { active = false; clearInterval(interval); };
  }, [token]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} accessibilityRole="button"><Text style={styles.back}>←  Home</Text></TouchableOpacity>
        <Text style={styles.title}>Inbox</Text>
      </View>
      {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : null}
      {loading ? <ActivityIndicator style={styles.loading} color="#60a5fa" size="large" /> : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.postId}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={refresh}
          ListEmptyComponent={<Text style={styles.empty}>{error ? 'Pull down to try again.' : 'No conversations yet. Messages open when a task offer is accepted.'}</Text>}
          renderItem={({ item }) => {
            const photo = getMediaUrl(item.otherAvatarUrl);
            return (
              <TouchableOpacity style={styles.card} onPress={() => onOpenConversation(item)} accessibilityRole="button" accessibilityLabel={`Messages with ${item.otherName || 'NeighborHelp member'} about ${item.postTitle || 'Accepted task'}`}>
                {photo ? <Image source={{ uri: photo }} style={styles.avatar} /> : <View style={[styles.avatar, styles.placeholder]}><Text style={styles.initial}>{(item.otherName || 'N').slice(0, 1).toUpperCase()}</Text></View>}
                <View style={styles.summary}>
                  <Text style={styles.name} numberOfLines={1}>{item.otherName || 'NeighborHelp member'}</Text>
                  <Text style={styles.task} numberOfLines={1}>{item.postTitle || 'Accepted task'}</Text>
                  <Text style={styles.preview} numberOfLines={2}>{item.lastMessage || 'Start the conversation'}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0b1120' },
  header: { padding: 18 },
  backButton: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
  back: { color: '#93c5fd', fontWeight: '700', fontSize: 15 },
  title: { color: '#f8fafc', fontSize: 28, fontWeight: '800', marginTop: 8 },
  list: { paddingHorizontal: 18, paddingBottom: 24, flexGrow: 1 },
  loading: { flex: 1 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', borderColor: '#263449', borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10, gap: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23 },
  placeholder: { backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  initial: { color: '#93c5fd', fontSize: 20, fontWeight: '700' },
  summary: { flex: 1 },
  name: { color: '#f8fafc', fontWeight: '700', fontSize: 16 },
  task: { color: '#60a5fa', fontSize: 12, marginTop: 4 },
  preview: { color: '#94a3b8', fontSize: 14, lineHeight: 20, marginTop: 5 },
  chevron: { color: '#64748b', fontSize: 26 },
  empty: { color: '#94a3b8', textAlign: 'center', lineHeight: 22, paddingVertical: 40 },
  error: { color: '#fca5a5', paddingHorizontal: 18, paddingBottom: 12 },
});
