import React, { useEffect, useState } from 'react';
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
import { getSocialProviders, loginUser, registerUser, SocialProvider } from '../api';
import { signInWithSocialAccount, socialClientConfigured } from '../socialAuth';

type Props = {
  onLogin: (token: string, userId: string) => void;
};

export default function AuthScreen({ onLogin }: Props) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [socialProviders, setSocialProviders] = useState({ google: false, facebook: false });

  useEffect(() => {
    let active = true;
    getSocialProviders().then((providers) => {
      if (active) setSocialProviders({ google: providers.google && socialClientConfigured.google, facebook: providers.facebook && socialClientConfigured.facebook });
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  const handleSocialAuth = async (provider: SocialProvider) => {
    if (loading) return;
    setLoading(true);
    setErrorMessage('');
    try {
      const result = await signInWithSocialAccount(provider);
      if (result) onLogin(result.accessToken, result.user.id);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not sign in. Please try again.');
    } finally { setLoading(false); }
  };

  const handleAuth = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const res = isSignUp
        ? await registerUser({ email, password, displayName })
        : await loginUser({ email, password });

      if (res?.accessToken) {
        onLogin(res.accessToken, res.user.id);
      } else {
        throw new Error('Authentication response did not include an access token.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again.';
      setErrorMessage(message);
      Alert.alert('Auth failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>NeighborHelp</Text>
        <Text style={styles.subtitle}>Local help. Local work. Safer by design.</Text>

        <View style={styles.card}>
          {socialProviders.google ? <TouchableOpacity style={styles.socialButton} onPress={() => handleSocialAuth('google')} disabled={loading} accessibilityRole="button"><Text style={styles.socialButtonText}>Continue with Google</Text></TouchableOpacity> : null}
          {socialProviders.facebook ? <TouchableOpacity style={[styles.socialButton, styles.facebookButton]} onPress={() => handleSocialAuth('facebook')} disabled={loading} accessibilityRole="button"><Text style={styles.socialButtonText}>Continue with Facebook</Text></TouchableOpacity> : null}
          {socialProviders.google || socialProviders.facebook ? <Text style={styles.dividerText}>or use email</Text> : null}
          {isSignUp && (
            <TextInput
              key="display-name"
              style={styles.input}
              placeholder="Display name"
              placeholderTextColor="#94a3b8"
              selectionColor="#60a5fa"
              value={displayName}
              onChangeText={setDisplayName}
              editable={!loading}
              showSoftInputOnFocus
            />
          )}

          <TextInput
            key="email"
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#94a3b8"
            selectionColor="#60a5fa"
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            editable={!loading}
            showSoftInputOnFocus
          />

          <TextInput
            key="password"
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#94a3b8"
            selectionColor="#60a5fa"
            autoCorrect={false}
            spellCheck={false}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!loading}
            showSoftInputOnFocus
            returnKeyType="done"
            onSubmitEditing={handleAuth}
          />

          {errorMessage ? <Text accessibilityRole="alert" style={styles.error}>{errorMessage}</Text> : null}

          <TouchableOpacity style={styles.primaryButton} onPress={handleAuth} disabled={loading}>
            <Text style={styles.primaryButtonText}>{loading ? 'Please wait...' : isSignUp ? 'Create account' : 'Log in'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsSignUp((prev) => !prev)} disabled={loading}>
            <Text style={styles.switchText}>{isSignUp ? 'Already have an account? Log in' : 'New here? Create account'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0b1120' },
  container: { flexGrow: 1, justifyContent: 'flex-start', padding: 24, paddingTop: 48, paddingBottom: 32 },
  title: { color: '#f8fafc', fontSize: 32, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  subtitle: { color: '#94a3b8', fontSize: 15, textAlign: 'center', marginBottom: 24 },
  card: { backgroundColor: '#111827', borderRadius: 16, borderWidth: 1, borderColor: '#263449', padding: 18 },
  input: { color: '#f8fafc', borderWidth: 1, borderColor: '#334155', borderRadius: 12, padding: 12, marginBottom: 12, backgroundColor: '#0f172a' },
  primaryButton: { backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  switchText: { textAlign: 'center', color: '#60a5fa', marginTop: 16, fontWeight: '600' },
  error: { color: '#fca5a5', marginTop: 8 },
  socialButton: { minHeight: 48, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#475569', backgroundColor: '#1e293b', borderRadius: 12, marginBottom: 10 },
  facebookButton: { backgroundColor: '#1e3a8a', borderColor: '#3b82f6' },
  socialButtonText: { color: '#f8fafc', fontWeight: '700', fontSize: 15 },
  dividerText: { color: '#94a3b8', textAlign: 'center', marginVertical: 12 },
});
