import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { createTask } from '../api';

type Props = {
  token: string;
  onBack: () => void;
  onSubmit: () => void;
};

type SelectedLocation = {
  latitude: number;
  longitude: number;
  approximateLocationName: string;
};

const roundToApproximateCoordinate = (value: number) => Math.round(value * 1000) / 1000;

async function requestLocationPermission() {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') {
    throw new Error('Allow location access to find the approximate task area.');
  }
}

async function getApproximateAreaName(latitude: number, longitude: number) {
  try {
    const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
    // Never publish the street name or street number on a public task.
    return address?.district || address?.subregion || address?.city || address?.region || 'Nearby area';
  } catch {
    return 'Nearby area';
  }
}

export default function CreateTaskScreen({ token, onBack, onSubmit }: Props) {
  const [title, setTitle] = useState('Need alternator changed');
  const [description, setDescription] = useState('Need local help replacing the alternator in my car.');
  const [category, setCategory] = useState('Auto / Car');
  const [address, setAddress] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  const useCurrentLocation = async () => {
    try {
      setLocating(true);
      await requestLocationPermission();
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = position.coords;
      const approximateLocationName = await getApproximateAreaName(latitude, longitude);

      setSelectedLocation({
        latitude: roundToApproximateCoordinate(latitude),
        longitude: roundToApproximateCoordinate(longitude),
        approximateLocationName,
      });
      setAddress(`Current location near ${approximateLocationName}`);
    } catch (error) {
      Alert.alert('Could not get location', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLocating(false);
    }
  };

  const findAddressLocation = async (enteredAddress: string): Promise<SelectedLocation> => {
    await requestLocationPermission();
    const [result] = await Location.geocodeAsync(enteredAddress);
    if (!result) {
      throw new Error('We could not find that address. Try adding a city or ZIP code.');
    }

    const approximateLocationName = await getApproximateAreaName(result.latitude, result.longitude);
    return {
      latitude: roundToApproximateCoordinate(result.latitude),
      longitude: roundToApproximateCoordinate(result.longitude),
      approximateLocationName,
    };
  };

  const submit = async () => {
    if (!address.trim()) {
      Alert.alert('Add a location', 'Enter an address or use your current location.');
      return;
    }

    try {
      setLoading(true);
      const location = selectedLocation ?? await findAddressLocation(address.trim());
      await createTask(
        {
          title,
          description,
          category,
          approximateLatitude: location.latitude,
          approximateLongitude: location.longitude,
          approximateLocationName: location.approximateLocationName,
        },
        token,
      );

      Alert.alert('Task posted', 'Your task is now live.');
      onSubmit();
    } catch (error) {
      Alert.alert('Could not post task', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.safeArea} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <TouchableOpacity style={styles.backButton} onPress={onBack} accessibilityRole="button" accessibilityLabel="Back to Home">
        <Text style={styles.backButtonText}>←  Back to Home</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Post a task</Text>

      <Text style={styles.label}>Title</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} selectionColor="#60a5fa" />

      <Text style={styles.label}>Description</Text>
      <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline selectionColor="#60a5fa" />

      <Text style={styles.label}>Category</Text>
      <TextInput style={styles.input} value={category} onChangeText={setCategory} selectionColor="#60a5fa" />

      <Text style={styles.label}>Task location</Text>
      <TextInput
        style={styles.input}
        value={address}
        onChangeText={(value) => {
          setAddress(value);
          setSelectedLocation(null);
        }}
        placeholder="Street address, city, or ZIP code"
        placeholderTextColor="#64748b"
        selectionColor="#60a5fa"
        autoCapitalize="words"
        returnKeyType="done"
      />
      <Text style={styles.locationHint}>
        We use this to find the approximate area. Your street address won’t appear on the public task.
      </Text>

      <TouchableOpacity style={styles.locationButton} onPress={useCurrentLocation} disabled={locating || loading}>
        {locating ? <ActivityIndicator color="#2563eb" /> : <Text style={styles.locationButtonText}>◎  Use my current location</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.primaryButton} onPress={submit} disabled={loading || locating}>
        <Text style={styles.primaryButtonText}>{loading ? 'Posting...' : 'Publish task'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0b1120' },
  container: { padding: 18, paddingBottom: 40 },
  backButton: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#172554', marginBottom: 12 },
  backButtonText: { color: '#93c5fd', fontWeight: '700', fontSize: 15 },
  title: { fontSize: 28, fontWeight: '800', color: '#f8fafc', marginBottom: 18 },
  label: { marginBottom: 8, fontWeight: '700', color: '#cbd5e1', marginTop: 12 },
  input: { color: '#f8fafc', borderWidth: 1, borderColor: '#334155', backgroundColor: '#0f172a', borderRadius: 12, padding: 12 },
  textArea: { minHeight: 110, textAlignVertical: 'top' },
  locationHint: { marginTop: 8, color: '#94a3b8', fontSize: 13, lineHeight: 18 },
  locationButton: { marginTop: 12, minHeight: 48, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#3b82f6', borderRadius: 12, backgroundColor: '#111827' },
  locationButtonText: { color: '#93c5fd', fontWeight: '700', fontSize: 15 },
  primaryButton: { marginTop: 22, backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
