import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { AcceptedMatch, getMediaUrl, getMyMatches, getMyProfile, getMyRatings, getUserProfile, rateAcceptedTask, uploadMyAvatar, UserProfile } from '../api';

type Props = {
  token: string;
  userId?: string;
  onBack: () => void;
};

export default function ProfileScreen({ token, userId, onBack }: Props) {
  const isOwnProfile = userId === undefined;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [matches, setMatches] = useState<AcceptedMatch[]>([]);
  const [myRatings, setMyRatings] = useState<Array<{ id: string; matchId: string; score: number }>>([]);
  const [ratingMatchId, setRatingMatchId] = useState<string | null>(null);
  const [selectedScores, setSelectedScores] = useState<Record<string, number>>({});
  const [feedbackByMatch, setFeedbackByMatch] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [savingRating, setSavingRating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      isOwnProfile ? getMyProfile(token) : getUserProfile(userId as string, token),
      isOwnProfile ? getMyMatches(token) : Promise.resolve([]),
      isOwnProfile ? getMyRatings(token) : Promise.resolve([]),
    ])
      .then(([value, acceptedMatches, authoredRatings]) => {
        if (!active) return;
        setProfile(value);
        setMatches(acceptedMatches);
        setMyRatings(authoredRatings);
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Could not load your profile.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isOwnProfile, token, userId]);

  const choosePhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Photo access needed', 'Allow photo access to choose a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (result.canceled || !result.assets[0]) return;

      setUploading(true);
      const photo = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 256 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
      );
      const uploaded = await uploadMyAvatar(photo.uri, token);
      setProfile((current) => current ? { ...current, avatarUrl: uploaded.avatarUrl } : current);
    } catch (reason) {
      Alert.alert('Could not update photo', reason instanceof Error ? reason.message : 'Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const submitRating = async (matchId: string) => {
    const score = selectedScores[matchId];
    if (score === undefined) {
      Alert.alert('Choose a rating', 'Select a score from 0 to 10.');
      return;
    }
    const feedback = (feedbackByMatch[matchId] ?? '').trim();
    if (feedback && feedback.split(/\s+/).length > 20) {
      Alert.alert('Feedback is too long', 'Please keep feedback to 20 words or fewer.');
      return;
    }

    try {
      setSavingRating(true);
      await rateAcceptedTask({ matchId, score, ...(feedback ? { feedback } : {}) }, token);
      const [updatedProfile, updatedRatings] = await Promise.all([getMyProfile(token), getMyRatings(token)]);
      setProfile(updatedProfile);
      setMyRatings(updatedRatings);
      setRatingMatchId(null);
      Alert.alert('Rating saved', 'Your feedback has been added to this member’s profile.');
    } catch (reason) {
      Alert.alert('Could not save rating', reason instanceof Error ? reason.message : 'Please try again.');
    } finally {
      setSavingRating(false);
    }
  };

  const changeFeedback = (matchId: string, value: string) => {
    const words = value.trim() ? value.trim().split(/\s+/) : [];
    setFeedbackByMatch((current) => ({ ...current, [matchId]: words.length > 20 ? words.slice(0, 20).join(' ') : value }));
  };

  const avatarUri = getMediaUrl(profile?.avatarUrl);
  const initials = (profile?.displayName || profile?.email || 'Me').trim().slice(0, 1).toUpperCase();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backButton} onPress={onBack} accessibilityRole="button" accessibilityLabel="Back to Home">
          <Text style={styles.backButtonText}>←  Back to Home</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{isOwnProfile ? 'Your profile' : 'Member profile'}</Text>
        <Text style={styles.subtitle}>{isOwnProfile ? 'Manage how you appear to your neighbors.' : 'Profile, ratings, and feedback from neighbors.'}</Text>

        {loading ? (
          <View style={styles.loading}><ActivityIndicator size="large" color="#60a5fa" /></View>
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : profile ? (
          <View style={styles.card}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} accessibilityLabel="Your profile photo" />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.initials}>{initials}</Text>
              </View>
            )}

            {isOwnProfile ? <TouchableOpacity
              style={styles.photoButton}
              onPress={choosePhoto}
              disabled={uploading}
              accessibilityRole="button"
              accessibilityLabel={avatarUri ? 'Change profile photo' : 'Add profile photo'}
            >
              {uploading ? <ActivityIndicator color="#93c5fd" /> : <Text style={styles.photoButtonText}>{avatarUri ? 'Change photo' : 'Add a photo'}</Text>}
            </TouchableOpacity> : null}
            {isOwnProfile ? <Text style={styles.photoHint}>Choose a square photo, up to 1.5 MB.</Text> : null}

            <View style={styles.divider} />
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{profile.displayName || 'NeighborHelp member'}</Text>
            {isOwnProfile ? <>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{profile.email}</Text>
            </> : null}
            {profile.homeLocationName ? <>
              <Text style={styles.label}>Area</Text>
              <Text style={styles.value}>{profile.homeLocationName}</Text>
            </> : null}
            <View style={styles.ratingSummary}>
              <Text style={styles.ratingScore}>{profile.ratingCount ? `${profile.ratingAverage.toFixed(1)} / 10` : 'No ratings yet'}</Text>
              <Text style={styles.ratingCount}>{profile.ratingCount} {profile.ratingCount === 1 ? 'rating' : 'ratings'}</Text>
            </View>
          </View>
        ) : null}
        {!loading && !error && profile ? <>
          {isOwnProfile ? <>
          <Text style={styles.sectionTitle}>Accepted tasks</Text>
          <Text style={styles.sectionHint}>After an offer is accepted, you can rate the other person here.</Text>
          {matches.length === 0 ? (
            <Text style={styles.emptyText}>Accepted tasks will appear here.</Text>
          ) : matches.map((match) => {
            const otherName = match.posterId === profile.id
              ? match.workerName || 'NeighborHelp member'
              : match.posterName || 'NeighborHelp member';
            const existingRating = myRatings.find((rating) => rating.matchId === match.id);
            const formOpen = ratingMatchId === match.id;

            return (
              <View key={match.id} style={styles.matchCard}>
                <Text style={styles.matchTitle}>{match.postTitle || 'Accepted task'}</Text>
                <Text style={styles.matchPerson}>With {otherName}</Text>
                {existingRating ? (
                  <Text style={styles.alreadyRated}>Your rating: {existingRating.score}/10</Text>
                ) : formOpen ? (
                  <>
                    <Text style={styles.label}>Your score (0–10 stars)</Text>
                    <View style={styles.scoreOptions}>
                      {Array.from({ length: 11 }, (_, score) => (
                        <TouchableOpacity
                          key={score}
                          style={[styles.scoreOption, selectedScores[match.id] === score && styles.scoreOptionSelected]}
                          onPress={() => setSelectedScores((current) => ({ ...current, [match.id]: score }))}
                          accessibilityRole="button"
                          accessibilityLabel={`${score} out of 10`}
                          accessibilityState={{ selected: selectedScores[match.id] === score }}
                        >
                          <Text style={[styles.scoreOptionText, selectedScores[match.id] === score && styles.scoreOptionTextSelected]}>{score}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <Text style={styles.label}>Feedback (optional, up to 20 words)</Text>
                    <TextInput
                      style={styles.feedbackInput}
                      value={feedbackByMatch[match.id] ?? ''}
                      onChangeText={(value) => changeFeedback(match.id, value)}
                      multiline
                      maxLength={300}
                      placeholder="Share a short note about working together"
                      placeholderTextColor="#64748b"
                      selectionColor="#60a5fa"
                    />
                    <Text style={styles.wordCount}>{(feedbackByMatch[match.id]?.trim().split(/\s+/).filter(Boolean).length ?? 0)}/20 words</Text>
                    <View style={styles.formActions}>
                      <TouchableOpacity style={styles.cancelButton} onPress={() => setRatingMatchId(null)} disabled={savingRating}>
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.submitButton} onPress={() => submitRating(match.id)} disabled={savingRating}>
                        <Text style={styles.submitButtonText}>{savingRating ? 'Saving…' : 'Save rating'}</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <TouchableOpacity style={styles.rateButton} onPress={() => setRatingMatchId(match.id)}>
                    <Text style={styles.rateButtonText}>Rate {otherName}</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
          </> : null}

          <Text style={styles.sectionTitle}>Feedback from neighbors</Text>
          {profile.ratings.length === 0 ? (
            <Text style={styles.emptyText}>Ratings and feedback you receive will appear here.</Text>
          ) : profile.ratings.map((rating) => (
            <View key={rating.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewAuthor}>{rating.from.displayName}</Text>
                <Text style={styles.reviewScore}>{rating.score}/10</Text>
              </View>
              {rating.feedback ? <Text style={styles.reviewFeedback}>{rating.feedback}</Text> : <Text style={styles.noFeedback}>No written feedback</Text>}
            </View>
          ))}
        </> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0b1120' },
  container: { padding: 18, paddingBottom: 36 },
  backButton: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#172554', marginBottom: 18 },
  backButtonText: { color: '#93c5fd', fontWeight: '700', fontSize: 15 },
  title: { fontSize: 28, fontWeight: '800', color: '#f8fafc' },
  subtitle: { color: '#94a3b8', fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 18 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { alignItems: 'center', backgroundColor: '#111827', borderRadius: 16, borderWidth: 1, borderColor: '#263449', padding: 20 },
  avatar: { width: 104, height: 104, borderRadius: 52, borderWidth: 2, borderColor: '#334155' },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e293b' },
  initials: { color: '#cbd5e1', fontSize: 38, fontWeight: '700' },
  photoButton: { minWidth: 132, minHeight: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: '#172554', borderRadius: 12, marginTop: 14, paddingHorizontal: 16 },
  photoButtonText: { color: '#93c5fd', fontWeight: '700' },
  photoHint: { color: '#64748b', fontSize: 12, marginTop: 8 },
  divider: { alignSelf: 'stretch', height: 1, backgroundColor: '#263449', marginVertical: 20 },
  label: { alignSelf: 'stretch', color: '#94a3b8', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginTop: 10 },
  value: { alignSelf: 'stretch', color: '#f8fafc', fontSize: 16, marginTop: 5 },
  error: { color: '#fca5a5', fontSize: 15, lineHeight: 22, marginTop: 20 },
  ratingSummary: { alignSelf: 'stretch', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#263449', marginTop: 20, paddingTop: 14 },
  ratingScore: { color: '#fbbf24', fontSize: 20, fontWeight: '800' },
  ratingCount: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  sectionTitle: { color: '#f8fafc', fontSize: 20, fontWeight: '800', marginTop: 26, marginBottom: 4 },
  sectionHint: { color: '#94a3b8', fontSize: 13, lineHeight: 18, marginBottom: 10 },
  emptyText: { color: '#64748b', fontSize: 14, lineHeight: 20, marginTop: 10, marginBottom: 8 },
  matchCard: { backgroundColor: '#111827', borderRadius: 14, borderWidth: 1, borderColor: '#263449', padding: 16, marginTop: 10 },
  matchTitle: { color: '#f8fafc', fontSize: 16, fontWeight: '700' },
  matchPerson: { color: '#94a3b8', fontSize: 13, marginTop: 5, marginBottom: 12 },
  alreadyRated: { color: '#34d399', fontWeight: '700', marginTop: 4 },
  scoreOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 8 },
  scoreOption: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, borderColor: '#334155', backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' },
  scoreOptionSelected: { backgroundColor: '#1d4ed8', borderColor: '#60a5fa' },
  scoreOptionText: { color: '#cbd5e1', fontWeight: '700' },
  scoreOptionTextSelected: { color: '#fff' },
  feedbackInput: { minHeight: 76, textAlignVertical: 'top', color: '#f8fafc', backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 10, padding: 11, marginTop: 2 },
  wordCount: { alignSelf: 'flex-end', color: '#64748b', fontSize: 11, marginTop: 4 },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 },
  cancelButton: { minHeight: 42, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#1e293b' },
  cancelButtonText: { color: '#cbd5e1', fontWeight: '700' },
  submitButton: { minHeight: 42, justifyContent: 'center', paddingHorizontal: 15, borderRadius: 10, backgroundColor: '#2563eb' },
  submitButtonText: { color: '#fff', fontWeight: '700' },
  rateButton: { alignSelf: 'flex-start', minHeight: 40, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#172554' },
  rateButtonText: { color: '#93c5fd', fontWeight: '700' },
  reviewCard: { backgroundColor: '#111827', borderRadius: 12, borderWidth: 1, borderColor: '#263449', padding: 14, marginTop: 10 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewAuthor: { color: '#e2e8f0', fontWeight: '700' },
  reviewScore: { color: '#fbbf24', fontWeight: '800' },
  reviewFeedback: { color: '#cbd5e1', fontSize: 14, lineHeight: 20, marginTop: 8 },
  noFeedback: { color: '#64748b', fontSize: 13, marginTop: 8 },
});
