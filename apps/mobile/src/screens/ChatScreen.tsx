import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ChatMessage, Conversation, getMessagesForPost, sendMessage } from '../api';

type Props = { token: string; userId: string; conversation: Conversation; onBack: () => void };

function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]) {
  const byId = new Map(current.map((message) => [message.id, message]));
  incoming.forEach((message) => byId.set(message.id, message));
  return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
}

export default function ChatScreen({ token, userId, conversation, onBack }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [hasEarlier, setHasEarlier] = useState(false);
  const [error, setError] = useState('');
  const list = useRef<FlatList<ChatMessage>>(null);
  const scrollAfterLayout = useRef(true);

  useEffect(() => {
    let active = true;
    let pending = false;
    let firstLoad = true;
    const load = async () => {
      if (pending) return;
      pending = true;
      try {
        const batch = await getMessagesForPost(conversation.postId, token);
        if (active) {
          setMessages((current) => mergeMessages(current, batch));
          if (firstLoad) { setHasEarlier(batch.length === 100); firstLoad = false; }
          setError('');
        }
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : 'Could not load messages.');
      } finally {
        pending = false;
        if (active) setLoading(false);
      }
    };
    void load();
    const interval = setInterval(() => { if (AppState.currentState === 'active') void load(); }, 5000);
    return () => { active = false; clearInterval(interval); };
  }, [conversation.postId, token]);

  const loadEarlier = async () => {
    if (!messages[0] || loadingEarlier) return;
    setLoadingEarlier(true);
    try {
      const batch = await getMessagesForPost(conversation.postId, token, messages[0].id);
      setMessages((current) => mergeMessages(current, batch));
      setHasEarlier(batch.length === 100);
    } catch (reason) { Alert.alert('Could not load earlier messages', reason instanceof Error ? reason.message : 'Try again.'); }
    finally { setLoadingEarlier(false); }
  };

  const send = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const message = await sendMessage({ postId: conversation.postId, body }, token);
      scrollAfterLayout.current = true;
      setMessages((current) => mergeMessages(current, [message]));
      setDraft((current) => current.trim() === body ? '' : current);
    } catch (reason) { Alert.alert('Message not sent', reason instanceof Error ? reason.message : 'Please try again.'); }
    finally { setSending(false); }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack} accessibilityRole="button"><Text style={styles.back}>←  Inbox</Text></TouchableOpacity>
          <Text style={styles.name}>{conversation.otherName || 'NeighborHelp member'}</Text>
          <Text style={styles.task} numberOfLines={1}>{conversation.postTitle || 'Accepted task'}</Text>
        </View>
        {error ? <Text style={styles.error} accessibilityRole="alert">{error} Retrying…</Text> : null}
        {loading ? <ActivityIndicator style={styles.loading} color="#60a5fa" /> : (
          <FlatList
            ref={list}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messages}
            keyboardShouldPersistTaps="handled"
            maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
            onContentSizeChange={() => { if (scrollAfterLayout.current && messages.length) { list.current?.scrollToEnd({ animated: false }); scrollAfterLayout.current = false; } }}
            ListHeaderComponent={hasEarlier ? <TouchableOpacity style={styles.earlier} onPress={loadEarlier} disabled={loadingEarlier}><Text style={styles.back}>{loadingEarlier ? 'Loading…' : 'Load earlier messages'}</Text></TouchableOpacity> : null}
            ListEmptyComponent={<Text style={styles.empty}>Start the conversation about this task.</Text>}
            renderItem={({ item }) => (
              <View style={[styles.bubble, item.senderId === userId ? styles.mine : styles.theirs]}>
                <Text style={styles.body}>{item.body}</Text>
                <Text style={styles.time}>{new Date(item.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</Text>
              </View>
            )}
          />
        )}
        <View style={styles.composer}>
          <TextInput style={styles.input} value={draft} onChangeText={setDraft} multiline maxLength={2000} placeholder="Write a message" placeholderTextColor="#64748b" selectionColor="#60a5fa" accessibilityLabel="Message" />
          <TouchableOpacity style={[styles.send, (!draft.trim() || sending) && styles.disabled]} onPress={send} disabled={!draft.trim() || sending} accessibilityRole="button" accessibilityLabel="Send message"><Text style={styles.sendText}>{sending ? '…' : 'Send'}</Text></TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0b1120' },
  header: { padding: 18, borderBottomWidth: 1, borderBottomColor: '#263449' },
  backButton: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
  back: { color: '#93c5fd', fontWeight: '700' },
  name: { color: '#f8fafc', fontWeight: '800', fontSize: 22, marginTop: 4 },
  task: { color: '#94a3b8', marginTop: 5 },
  loading: { flex: 1 },
  messages: { padding: 18, paddingBottom: 12, flexGrow: 1 },
  bubble: { maxWidth: '86%', borderRadius: 14, padding: 12, marginBottom: 10 },
  mine: { backgroundColor: '#1e40af', alignSelf: 'flex-end' },
  theirs: { backgroundColor: '#1e293b', alignSelf: 'flex-start' },
  body: { color: '#f8fafc', lineHeight: 21, fontSize: 15 },
  time: { color: '#cbd5e1', fontSize: 10, marginTop: 7 },
  empty: { color: '#94a3b8', textAlign: 'center', marginTop: 30 },
  error: { color: '#fca5a5', paddingHorizontal: 18, paddingVertical: 8 },
  earlier: { alignItems: 'center', padding: 12 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, borderTopWidth: 1, borderTopColor: '#263449', padding: 14 },
  input: { flex: 1, minHeight: 46, maxHeight: 120, color: '#f8fafc', backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 12, padding: 12 },
  send: { minHeight: 46, justifyContent: 'center', borderRadius: 12, backgroundColor: '#2563eb', paddingHorizontal: 16 },
  sendText: { color: '#fff', fontWeight: '700' },
  disabled: { opacity: 0.5 },
});
