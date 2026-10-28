import React from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { acceptOffer, createOffer, getOffersForPost, getTask, Task, TaskOffer } from '../api';

type Props = {
  token: string;
  userId: string;
  taskId: string;
  onBack: () => void;
  onInterested: () => void;
  onViewProfile: (userId: string) => void;
};

export default function TaskDetailScreen({ token, userId, taskId, onBack, onInterested, onViewProfile }: Props) {
  const [task, setTask] = React.useState<Task | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [message, setMessage] = React.useState('I can help with this task.');
  const [submitting, setSubmitting] = React.useState(false);
  const [offers, setOffers] = React.useState<TaskOffer[]>([]);
  const [acceptingOfferId, setAcceptingOfferId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    getTask(taskId)
      .then(async (value) => {
        if (!active) return;
        setTask(value);
        if (value.userId === userId) {
          const taskOffers = await getOffersForPost(taskId, token);
          if (active) setOffers(taskOffers);
        }
      })
      .catch(() => { if (active) Alert.alert('Error', 'Unable to load this task.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [taskId, token, userId]);

  const handleOffer = async () => {
    try {
      setSubmitting(true);
      await createOffer({ postId: taskId, message }, token);
      Alert.alert('Offer sent', 'Your offer was sent to the task owner.');
      onInterested();
    } catch (error) {
      Alert.alert('Could not send offer', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptOffer = async (offer: TaskOffer) => {
    try {
      setAcceptingOfferId(offer.id);
      await acceptOffer(offer.id, token);
      Alert.alert('Offer accepted', 'The task is now matched. You can message and rate each other from your profile.');
      onInterested();
    } catch (error) {
      Alert.alert('Could not accept offer', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setAcceptingOfferId(null);
    }
  };

  return (
    <ScrollView style={styles.safeArea} contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={onBack} accessibilityRole="button" accessibilityLabel="Back to Home">
        <Text style={styles.back}>←  Back to Home</Text>
      </TouchableOpacity>

      {loading ? <ActivityIndicator size="large" color="#2563eb" /> : !task ? (
        <Text style={styles.description}>This task could not be found.</Text>
      ) : <>
        <Text style={styles.category}>{task.category || 'General'}</Text>
        <Text style={styles.title}>{task.title}</Text>
        <Text style={styles.description}>{task.description}</Text>
        <Text style={styles.locationNotice}>
          {task.approximateLocationName || 'Nearby area'} · Exact location stays private.
        </Text>
        <TouchableOpacity style={styles.profileButton} onPress={() => onViewProfile(task.userId)}>
          <Text style={styles.profileButtonText}>View task owner profile</Text>
        </TouchableOpacity>

        {task.userId === userId ? (
          <>
            <Text style={styles.ownerNotice}>This is your task. You cannot make an offer on it.</Text>
            <Text style={styles.label}>Offers</Text>
            {offers.length === 0 ? <Text style={styles.ownerNotice}>No offers yet.</Text> : offers.map((offer) => (
              <View key={offer.id} style={styles.offerCard}>
                <Text style={styles.offerStatus}>{offer.status.toUpperCase()}</Text>
                <Text style={styles.offerMessage}>{offer.message || 'I can help with this task.'}</Text>
                {offer.status === 'pending' ? (
                  <TouchableOpacity style={styles.primaryButton} onPress={() => handleAcceptOffer(offer)} disabled={acceptingOfferId !== null}>
                    <Text style={styles.primaryButtonText}>{acceptingOfferId === offer.id ? 'Accepting…' : 'Accept offer'}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ))}
          </>
        ) : <>
          <Text style={styles.label}>Message to the task owner</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={1000}
            placeholderTextColor="#64748b"
            selectionColor="#60a5fa"
          />
          <TouchableOpacity style={styles.primaryButton} onPress={handleOffer} disabled={submitting}>
            <Text style={styles.primaryButtonText}>{submitting ? 'Sending...' : 'Send offer'}</Text>
          </TouchableOpacity>
        </>}
      </>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0b1120' },
  container: { padding: 18, paddingBottom: 40 },
  backButton: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#172554', marginBottom: 16 },
  back: { color: '#93c5fd', fontWeight: '700' },
  category: { color: '#3b82f6', fontWeight: '700', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: '#f8fafc', marginBottom: 12 },
  description: { color: '#cbd5e1', lineHeight: 22, marginBottom: 20 },
  locationNotice: { backgroundColor: '#0c2538', borderWidth: 1, borderColor: '#164e63', borderRadius: 12, padding: 12, color: '#bae6fd', fontWeight: '600', marginBottom: 18 },
  profileButton: { alignSelf: 'flex-start', minHeight: 42, justifyContent: 'center', paddingHorizontal: 13, borderRadius: 10, backgroundColor: '#1e293b', marginBottom: 18 },
  profileButtonText: { color: '#bfdbfe', fontWeight: '700' },
  ownerNotice: { color: '#94a3b8', fontWeight: '600', marginTop: 4 },
  offerCard: { backgroundColor: '#111827', borderWidth: 1, borderColor: '#263449', borderRadius: 12, padding: 14, marginTop: 10 },
  offerStatus: { color: '#60a5fa', fontSize: 12, fontWeight: '800' },
  offerMessage: { color: '#cbd5e1', lineHeight: 20, marginTop: 6 },
  label: { fontWeight: '700', color: '#cbd5e1', marginBottom: 8 },
  input: { color: '#f8fafc', backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 12, padding: 12, marginBottom: 12 },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  primaryButton: { backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
