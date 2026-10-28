import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { getNearbyTasks } from '../api';

type Props = {
  onOpenTask: (taskId: string) => void;
  onCreateTask: () => void;
  onOpenProfile: () => void;
  onOpenInbox: () => void;
};

export default function HomeScreen({ onOpenTask, onCreateTask, onOpenProfile, onOpenInbox }: Props) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [locationLabel, setLocationLabel] = useState('Finding your location…');
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadNearbyTasks = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);

      let permission = await Location.getForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        permission = await Location.requestForegroundPermissionsAsync();
      }
      if (permission.status !== 'granted') {
        throw new Error('Allow location access to find tasks near you.');
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const latitude = Math.round(position.coords.latitude * 1000) / 1000;
      const longitude = Math.round(position.coords.longitude * 1000) / 1000;

      let areaName = 'your current area';
      try {
        const [area] = await Location.reverseGeocodeAsync({ latitude, longitude });
        areaName = area?.district || area?.subregion || area?.city || area?.region || areaName;
      } catch {
        // Nearby tasks can still load if reverse geocoding is unavailable.
      }
      setLocationLabel(areaName);

      const data = await getNearbyTasks(latitude, longitude, 25);
      setTasks(data);
    } catch (error) {
      setTasks([]);
      setLocationLabel('Location unavailable');
      setLoadError(error instanceof Error ? error.message : 'Unable to load nearby tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNearbyTasks();
  }, [loadNearbyTasks]);

  const filtered = tasks.filter((task) => {
    const text = query.toLowerCase();
    return task.title.toLowerCase().includes(text) || (task.category ?? '').toLowerCase().includes(text);
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.inboxButton} onPress={onOpenInbox} accessibilityRole="button" accessibilityLabel="Open message inbox">
          <Text style={styles.inboxIcon}>✉</Text>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.profileButton} onPress={onOpenProfile} accessibilityRole="button" accessibilityLabel="Open profile">
            <Text style={styles.profileButtonText}>Me</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.createButton} onPress={onCreateTask}>
            <Text style={styles.createButtonText}>Post task</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.locationBar}>
        <Text style={styles.locationText}>Near {locationLabel}</Text>
        <TouchableOpacity onPress={loadNearbyTasks} disabled={loading}>
          <Text style={styles.refreshText}>{loading ? 'Updating…' : 'Refresh'}</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Search tasks or categories"
        placeholderTextColor="#64748b"
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
          ListEmptyComponent={(
            <Text style={styles.emptyState}>
              {loadError || (query ? 'No tasks match your search.' : 'No nearby tasks yet. Post the first one.')}
            </Text>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => onOpenTask(item.id)}>
              <View style={styles.rowBetween}>
                <Text style={styles.category}>{item.category || 'General'}</Text>
                <Text style={styles.distance}>{item.distanceMiles == null ? '' : `~${item.distanceMiles} mi`}</Text>
              </View>
              <Text style={styles.taskTitle}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
              <View style={styles.rowBetween}>
                <Text style={styles.price}>Open to offers</Text>
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
  safeArea: { flex: 1, backgroundColor: '#0b1120' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingTop: 18, paddingBottom: 12 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locationBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingBottom: 12 },
  locationText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  refreshText: { color: '#2563eb', fontWeight: '700', paddingVertical: 4, paddingHorizontal: 6 },
  inboxButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#172554', borderWidth: 1, borderColor: '#334155' },
  inboxIcon: { fontSize: 29, color: '#bfdbfe' },
  createButton: { backgroundColor: '#2563eb', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  profileButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  profileButtonText: { color: '#cbd5e1', fontWeight: '700' },
  createButtonText: { color: '#fff', fontWeight: '700' },
  search: { color: '#f8fafc', backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginHorizontal: 18, marginBottom: 12 },
  list: { paddingHorizontal: 18, paddingBottom: 24 },
  emptyState: { color: '#94a3b8', fontSize: 15, lineHeight: 22, textAlign: 'center', paddingVertical: 36 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#111827', borderRadius: 14, borderWidth: 1, borderColor: '#263449', padding: 16, marginBottom: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  category: { color: '#3b82f6', fontWeight: '700', fontSize: 12 },
  distance: { color: '#94a3b8', fontSize: 12 },
  taskTitle: { fontSize: 18, fontWeight: '700', color: '#f8fafc', marginVertical: 6 },
  description: { color: '#cbd5e1', fontSize: 14, lineHeight: 20, marginBottom: 12 },
  price: { color: '#34d399', fontWeight: '700' },
  area: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
});
