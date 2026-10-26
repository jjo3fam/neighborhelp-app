const BASE_URL = 'http://localhost:3000';

export async function registerUser(payload: { email: string; password: string; displayName?: string; phone?: string }) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error('Register failed');
  return res.json();
}

export async function loginUser(payload: { email: string; password: string }) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error('Login failed');
  return res.json();
}

export async function getNearbyTasks(latitude: number, longitude: number, radiusMiles = 25, token?: string) {
  const res = await fetch(
    `${BASE_URL}/posts/nearby?latitude=${latitude}&longitude=${longitude}&radiusMiles=${radiusMiles}`,
    { method: 'GET', headers: token ? { Authorization: `Bearer ${token}` } : {} },
  );

  if (!res.ok) throw new Error('Failed to load posts');
  return res.json();
}

export async function createTask(payload: any, token: string) {
  const res = await fetch(`${BASE_URL}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error('Create post failed');
  return res.json();
}

export async function createOffer(payload: { postId: string; userId: string; offerAmount?: number; message?: string }, token: string) {
  const res = await fetch(`${BASE_URL}/offers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error('Offer failed');
  return res.json();
}

export async function getMessagesForPost(postId: string, token: string) {
  const res = await fetch(`${BASE_URL}/messages/post/${postId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error('Could not fetch messages');
  return res.json();
}

export async function sendMessage(payload: { postId: string; senderId: string; receiverId: string; content: string }, token: string) {
  const res = await fetch(`${BASE_URL}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error('Could not send message');
  return res.json();
}
