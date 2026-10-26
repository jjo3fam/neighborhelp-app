import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { loginUser, registerUser } from '../api';

type Props = {
  onLogin: (token: string, userId?: string) => void;
};

export default function AuthScreen({ onLogin }: Props) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('susan@example.com');
  const [password, setPassword] = useState('secret123');
  const [displayName, setDisplayName] = useState('Susan');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    try {
      setLoading(true);
      const res = isSignUp
        ? await registerUser({ email, password, displayName })
        : await loginUser({ email, password });

      if (res?.accessToken) {
        onLogin(res.accessToken, res.user?.id);
      }
    } catch (error) {
      Alert.alert('Auth failed', 'Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>NeighborHelp</Text>
        <Text style={styles.subtitle}>Local help. Local work. Safer by design.</Text>

        <View style={styles.card}>
          {isSignUp && (
            <TextInput
              style={styles.input}
              placeholder="Display name"
              value={displayName}
              onChangeText={setDisplayName}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.primaryButton} onPress={handleAuth} disabled={loading}>
            <Text style={styles.primaryButtonText}>{loading ? 'Please wait...' : isSignUp ? 'Create account' : 'Log in'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsSignUp((prev) => !prev)}>
            <Text style={styles.switchText}>{isSignUp ? 'Already have an account? Log in' : 'New here? Create account'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f3f6fb' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 32, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  subtitle: { color: '#6b7280', fontSize: 15, textAlign: 'center', marginBottom: 24 },
  card: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb', padding: 18 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, padding: 12, marginBottom: 12, backgroundColor: '#f9fafb' },
  primaryButton: { backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  switchText: { textAlign: 'center', color: '#3b82f6', marginTop: 16, fontWeight: '600' },
});
