import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';

type Props = {
  token: string;
  userId: string;
  taskId: string;
  onBack: () => void;
  onInterested: () => void;
};

export default function TaskDetailScreen({ token, userId, taskId, onBack, onInterested }: Props) {
  const [offerAmount, setOfferAmount] = React.useState('70');
  const [message, setMessage] = React.useState('I can do this this weekend.');
  const [offerSent, setOfferSent] = React.useState(false);
  const [exactLocationText, setExactLocationText] = React.useState('Exact location is hidden until a match is accepted.');

  const handleOffer = async () => {
    try {
      const res = await fetch('http://localhost:3000/offers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ postId: taskId, userId, offerAmount: Number(offerAmount), message }),
      });

      if (!res.ok) throw new Error('Failed');
      setOfferSent(true);
      setExactLocationText('Offer sent. Exact location will unlock after the task owner accepts the match.');
      Alert.alert('Offer sent', 'Your offer was sent.');
      onInterested();
    } catch (error) {
      Alert.alert('Error', 'Unable to send offer.');
    }
  };

  const handleAcceptMatch = async () => {
    try {
      const res = await fetch(`http://localhost:3000/offers/${taskId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      const match = data?.match;
      if (match?.exactLocationRevealed) {
        setExactLocationText(`Exact location unlocked: ${match.exactLocationLabel || 'Accepted match location'} (${match.exactLatitude}, ${match.exactLongitude})`);
      }
      Alert.alert('Match accepted', 'Exact location has been unlocked for the matched parties.');
    } catch (error) {
      Alert.alert('Error', 'Unable to accept the match.');
    }
  };

  return (
    <ScrollView style={styles.safeArea} contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={onBack}>
        <Text style={styles.back}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.category}>Auto / Car</Text>
      <Text style={styles.title}>Need alternator changed</Text>
      <Text style={styles.description}>Need local help replacing the alternator in my car.</Text>

      <Text style={styles.locationNotice}>{exactLocationText}</Text>

      <Text style={styles.label}>Offer amount</Text>
      <TextInput style={styles.input} value={offerAmount} onChangeText={setOfferAmount} keyboardType="numeric" />

      <Text style={styles.label}>Message</Text>
      <TextInput style={[styles.input, styles.textArea]} value={message} onChangeText={setMessage} multiline />

      <TouchableOpacity style={styles.primaryButton} onPress={handleOffer}>
        <Text style={styles.primaryButtonText}>{offerSent ? 'Offer sent' : 'Send offer'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={handleAcceptMatch}>
        <Text style={styles.secondaryButtonText}>Accept match and reveal exact location</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f3f6fb' },
  container: { padding: 18, paddingBottom: 40 },
  back: { color: '#2563eb', fontWeight: '700', marginBottom: 16 },
  category: { color: '#3b82f6', fontWeight: '700', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 12 },
  description: { color: '#374151', lineHeight: 22, marginBottom: 20 },
  locationNotice: { backgroundColor: '#e0f2fe', borderWidth: 1, borderColor: '#bae6fd', borderRadius: 12, padding: 12, color: '#0f172a', fontWeight: '600', marginBottom: 18 },
  label: { fontWeight: '700', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, padding: 12, marginBottom: 12 },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  primaryButton: { backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryButton: { backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#86efac', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 14 },
  secondaryButtonText: { color: '#166534', fontWeight: '700', fontSize: 16 },
});
