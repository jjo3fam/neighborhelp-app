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
    {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
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
