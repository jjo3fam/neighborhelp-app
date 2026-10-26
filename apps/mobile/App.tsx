import React, { useState } from 'react';
import { View } from 'react-native';
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import CreateTaskScreen from './src/screens/CreateTaskScreen';
import TaskDetailScreen from './src/screens/TaskDetailScreen';

export default function App() {
  const [screen, setScreen] = useState<'auth' | 'home' | 'create' | 'detail'>('auth');
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string>('task-1');

  const handleLogin = (newToken: string, newUserId?: string) => {
    setToken(newToken);
    setUserId(newUserId ?? 'user-1');
    setScreen('home');
  };

  if (screen === 'auth') {
    return <AuthScreen onLogin={handleLogin} />;
  }

  if (screen === 'create') {
    return (
      <View style={{ flex: 1 }}>
        <CreateTaskScreen token={token ?? ''} onSubmit={() => setScreen('home')} />
      </View>
    );
  }

  if (screen === 'detail') {
    return (
      <View style={{ flex: 1 }}>
        <TaskDetailScreen
          token={token ?? ''}
          userId={userId ?? 'user-1'}
          taskId={taskId}
          onBack={() => setScreen('home')}
          onInterested={() => setScreen('home')}
        />
      </View>
    );
  }

  return (
    <HomeScreen
      onOpenTask={(id) => {
        setTaskId(id);
        setScreen('detail');
      }}
      onCreateTask={() => setScreen('create')}
    />
  );
}
