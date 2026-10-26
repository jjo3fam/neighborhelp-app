import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getNearbyTasks } from '../api';

type Props = {
  onOpenTask: (taskId: string) => void;
  onCreateTask: () => void;
};

export default function HomeScreen({ onOpenTask, onCreateTask }: Props) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getNearbyTasks(39.7392, -104.9903, 25);
        setTasks(data);
      } catch (error) {
        Alert.alert('Error', 'Unable to load nearby tasks.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filtered = tasks.filter((task) => {
    const text = query.toLowerCase();
    return task.title.toLowerCase().includes(text) || task.categoryId.toLowerCase().includes(text);
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Nearby tasks</Text>
        <TouchableOpacity style={styles.createButton} onPress={onCreateTask}>
          <Text style={styles.createButtonText}>Post task</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Search tasks or categories"
        value={query}
        onChangeText={setQuery}
      />

      {loading ? (
        <View style={styles.loading}><ActivityIndicator size="large" color="#2563eb" /></View>
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => onOpenTask(item.id)}>
              <View style={styles.rowBetween}>
                <Text style={styles.category}>{item.categoryId || 'General'}</Text>
                <Text style={styles.distance}>~5 mi</Text>
              </View>
              <Text style={styles.taskTitle}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
              <View style={styles.rowBetween}>
                <Text style={styles.price}>{item.priceType === 'fixed' ? `$${item.priceAmount ?? 0}` : 'Open to offers'}</Text>
                <Text style={styles.area}>{item.approximateLocationName || 'Nearby area'}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f3f6fb' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingTop: 18, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  createButton: { backgroundColor: '#2563eb', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  createButtonText: { color: '#fff', fontWeight: '700' },
  search: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginHorizontal: 18, marginBottom: 12 },
  list: { paddingHorizontal: 18, paddingBottom: 24 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#e5e7eb', padding: 16, marginBottom: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  category: { color: '#3b82f6', fontWeight: '700', fontSize: 12 },
  distance: { color: '#6b7280', fontSize: 12 },
  taskTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginVertical: 6 },
  description: { color: '#374151', fontSize: 14, lineHeight: 20, marginBottom: 12 },
  price: { color: '#10b981', fontWeight: '700' },
  area: { color: '#6b7280', fontSize: 12, fontWeight: '600' },
});
