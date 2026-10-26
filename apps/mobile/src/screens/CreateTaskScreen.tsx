import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { createTask } from '../api';

type Props = {
  token: string;
  onSubmit: () => void;
};

export default function CreateTaskScreen({ token, onSubmit }: Props) {
  const [title, setTitle] = useState('Need alternator changed');
  const [description, setDescription] = useState('Need local help replacing the alternator in my car.');
  const [categoryId, setCategoryId] = useState('auto_car');
  const [priceType, setPriceType] = useState<'fixed' | 'open_to_offers' | 'accept_offers'>('fixed');
  const [priceAmount, setPriceAmount] = useState('80');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    try {
      setLoading(true);
      await createTask(
        {
          title,
          description,
          categoryId,
          postType: 'need_help',
          priceType,
          priceAmount: Number(priceAmount),
          approximateLatitude: 39.7392,
          approximateLongitude: -104.9903,
          approximateLocationName: 'Downtown Denver',
          radiusMiles: 15,
        },
        token,
      );

      Alert.alert('Task posted', 'Your task is now live.');
      onSubmit();
    } catch (error) {
      Alert.alert('Could not post task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.safeArea} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Post a task</Text>

      <Text style={styles.label}>Title</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} />

      <Text style={styles.label}>Description</Text>
      <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline />

      <Text style={styles.label}>Category</Text>
      <TextInput style={styles.input} value={categoryId} onChangeText={setCategoryId} />

      <Text style={styles.label}>Price type</Text>
      <View style={styles.row}>
        {(['fixed', 'open_to_offers', 'accept_offers'] as const).map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.pill, priceType === type && styles.pillSelected]}
            onPress={() => setPriceType(type)}
          >
            <Text style={styles.pillText}>{type}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {priceType === 'fixed' && (
        <>
          <Text style={styles.label}>Price</Text>
          <TextInput style={styles.input} value={priceAmount} onChangeText={setPriceAmount} keyboardType="numeric" />
        </>
      )}

      <TouchableOpacity style={styles.primaryButton} onPress={submit} disabled={loading}>
        <Text style={styles.primaryButtonText}>{loading ? 'Posting...' : 'Publish task'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f3f6fb' },
  container: { padding: 18, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 18 },
  label: { marginBottom: 8, fontWeight: '700', color: '#374151', marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff', borderRadius: 12, padding: 12 },
  textArea: { minHeight: 110, textAlignVertical: 'top' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: { borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, marginBottom: 8 },
  pillSelected: { backgroundColor: '#dbeafe', borderColor: '#93c5fd' },
  pillText: { fontWeight: '600', color: '#374151', textTransform: 'capitalize' },
  primaryButton: { marginTop: 22, backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
