const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'https://api.avaella.net').replace(/\/$/, '');

export type Task = {
  id: string;
  userId: string;
  title: string;
  description: string;
  category?: string;
  approximateLocationName?: string;
  distanceMiles?: number;
};

export type TaskOffer = {
  id: string;
  postId: string;
  userId: string;
  message?: string | null;
  status: 'pending' | 'accepted' | 'rejected';
};

export type Conversation = {
  postId: string;
  postTitle: string | null;
  otherUserId: string | null;
  otherName: string | null;
  otherAvatarUrl: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
};

export type ChatMessage = {
  id: string;
  postId: string;
  senderId: string;
  receiverId: string;
  body: string;
  createdAt: string;
};

export type UserProfile = {
  id: string;
  email?: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  homeLocationName?: string | null;
  ratingAverage: number;
  ratingCount: number;
  ratings: ProfileRating[];
};

export type ProfileRating = {
  id: string;
  score: number;
  feedback?: string | null;
  createdAt: string;
  from: { displayName: string; avatarUrl?: string | null };
};

export type AcceptedMatch = {
  id: string;
  postId: string;
  offerId: string;
  posterId: string;
  workerId: string;
  createdAt: string;
  postTitle: string;
  posterName?: string | null;
  posterAvatarUrl?: string | null;
  workerName?: string | null;
  workerAvatarUrl?: string | null;
};

type AuthResponse = {
  accessToken: string;
  user: { id: string; email: string; displayName?: string };
};

export type SocialProvider = 'google' | 'facebook';

export function getSocialProviders() {
  return request<Record<SocialProvider, boolean>>('/auth/social/config');
}

export function loginSocialUser(payload: { provider: SocialProvider; token: string }) {
  if (!BASE_URL.startsWith('https://')) throw new Error('Social sign-in requires a secure server connection.');
  return request<AuthResponse>('/auth/social', { method: 'POST', headers: jsonHeaders(), body: JSON.stringify(payload) });
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, init);
  if (!response.ok) {
    const body = await response.json().catch(() => undefined);
    const message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
    throw new Error(message || `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

const jsonHeaders = (token?: string) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

export function registerUser(payload: { email: string; password: string; displayName?: string }) {
  return request<AuthResponse>('/auth/register', {
    method: 'POST', headers: jsonHeaders(), body: JSON.stringify(payload),
  });
}

export function loginUser(payload: { email: string; password: string }) {
  return request<AuthResponse>('/auth/login', {
    method: 'POST', headers: jsonHeaders(), body: JSON.stringify(payload),
  });
}

export function getMyProfile(token: string) {
  return request<UserProfile>('/users/me', { headers: jsonHeaders(token) });
}

export function getUserProfile(userId: string, token: string) {
  return request<UserProfile>(`/users/${encodeURIComponent(userId)}`, { headers: jsonHeaders(token) });
}

export function getMyMatches(token: string) {
  return request<AcceptedMatch[]>('/matches/me', { headers: jsonHeaders(token) });
}

export function getMyRatings(token: string) {
  return request<Array<{ id: string; matchId: string; score: number }>>('/ratings/me', { headers: jsonHeaders(token) });
}

export function rateAcceptedTask(payload: { matchId: string; score: number; feedback?: string }, token: string) {
  return request('/ratings', {
    method: 'POST', headers: jsonHeaders(token), body: JSON.stringify(payload),
  });
}

export async function uploadMyAvatar(uri: string, token: string) {
  const form = new FormData();
  form.append('avatar', { uri, name: 'profile.jpg', type: 'image/jpeg' } as any);
  const response = await fetch(`${BASE_URL}/users/me/avatar`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => undefined);
    const message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
    throw new Error(message || `Photo upload failed (${response.status})`);
  }
  return response.json() as Promise<{ avatarUrl: string }>;
}

export function getMediaUrl(path?: string | null) {
  if (!path) return null;
  return /^https?:\/\//i.test(path) ? path : `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

export function getNearbyTasks(latitude: number, longitude: number, radiusMiles = 25) {
  const query = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude), radiusMiles: String(radiusMiles) });
  return request<Task[]>(`/posts/nearby?${query}`);
}

export function getTask(taskId: string) {
  return request<Task>(`/posts/${encodeURIComponent(taskId)}`);
}

export function createTask(payload: {
  title: string;
  description: string;
  category?: string;
  approximateLatitude: number;
  approximateLongitude: number;
  approximateLocationName?: string;
  radiusMiles?: number;
}, token: string) {
  return request<Task>('/posts', {
    method: 'POST', headers: jsonHeaders(token), body: JSON.stringify(payload),
  });
}

export function createOffer(payload: { postId: string; message?: string }, token: string) {
  return request('/offers', {
    method: 'POST', headers: jsonHeaders(token), body: JSON.stringify(payload),
  });
}

export function getOffersForPost(postId: string, token: string) {
  return request<TaskOffer[]>(`/offers/post/${encodeURIComponent(postId)}`, { headers: jsonHeaders(token) });
}

export function acceptOffer(offerId: string, token: string) {
  return request(`/offers/${encodeURIComponent(offerId)}/accept`, { method: 'PATCH', headers: jsonHeaders(token) });
}

export function getInbox(token: string) {
  return request<Conversation[]>('/messages/inbox', { headers: jsonHeaders(token) });
}

export function getMessagesForPost(postId: string, token: string, before?: string) {
  const query = before ? `?before=${encodeURIComponent(before)}` : '';
  return request<ChatMessage[]>(`/messages/post/${encodeURIComponent(postId)}${query}`, {
    headers: jsonHeaders(token),
  });
}

export function sendMessage(payload: { postId: string; body: string }, token: string) {
  return request<ChatMessage>('/messages', {
    method: 'POST', headers: jsonHeaders(token), body: JSON.stringify(payload),
  });
}
