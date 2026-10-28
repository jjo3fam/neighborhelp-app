import React, { useEffect, useState } from 'react';
import { BackHandler, StatusBar, View } from 'react-native';
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import CreateTaskScreen from './src/screens/CreateTaskScreen';
import TaskDetailScreen from './src/screens/TaskDetailScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import InboxScreen from './src/screens/InboxScreen';
import ChatScreen from './src/screens/ChatScreen';
import { Conversation } from './src/api';

export default function App() {
  const [screen, setScreen] = useState<'auth' | 'home' | 'create' | 'detail' | 'profile' | 'inbox' | 'chat'>('auth');
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string>('task-1');
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [profileReturnScreen, setProfileReturnScreen] = useState<'home' | 'detail'>('home');

  // Keep the Android status bar legible across all app screens.
  const statusBar = <StatusBar barStyle="light-content" backgroundColor="#0b1120" />;

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen === 'chat') { setScreen('inbox'); return true; }
      if (screen === 'inbox') { setScreen('home'); return true; }
      if (screen === 'profile') {
        setScreen(profileReturnScreen);
        return true;
      }
      if (screen === 'create' || screen === 'detail') {
        setScreen('home');
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [screen, profileReturnScreen]);

  const handleLogin = (newToken: string, newUserId: string) => {
    setToken(newToken);
    setUserId(newUserId);
    setScreen('home');
  };

  if (screen === 'auth') {
    return <>{statusBar}<AuthScreen onLogin={handleLogin} /></>;
  }

  if (screen === 'create') {
    return (
      <View style={{ flex: 1, backgroundColor: '#0b1120' }}>
        {statusBar}
        <CreateTaskScreen token={token ?? ''} onBack={() => setScreen('home')} onSubmit={() => setScreen('home')} />
      </View>
    );
  }

  if (screen === 'detail') {
    return (
      <View style={{ flex: 1, backgroundColor: '#0b1120' }}>
        {statusBar}
        <TaskDetailScreen
          token={token ?? ''}
          userId={userId ?? 'user-1'}
          taskId={taskId}
          onBack={() => setScreen('home')}
          onInterested={() => setScreen('home')}
          onViewProfile={(id) => {
            setProfileUserId(id);
            setProfileReturnScreen('detail');
            setScreen('profile');
          }}
        />
      </View>
    );
  }

  if (screen === 'profile') {
    return (
      <View style={{ flex: 1, backgroundColor: '#0b1120' }}>
        {statusBar}
        <ProfileScreen
          token={token ?? ''}
          userId={profileUserId ?? undefined}
          onBack={() => setScreen(profileReturnScreen)}
        />
      </View>
    );
  }

  if (screen === 'inbox') {
    return <View style={{ flex: 1, backgroundColor: '#0b1120' }}>{statusBar}<InboxScreen token={token ?? ''} onBack={() => setScreen('home')} onOpenConversation={(item) => { setConversation(item); setScreen('chat'); }} /></View>;
  }

  if (screen === 'chat' && conversation) {
    return <View style={{ flex: 1, backgroundColor: '#0b1120' }}>{statusBar}<ChatScreen token={token ?? ''} userId={userId ?? ''} conversation={conversation} onBack={() => setScreen('inbox')} /></View>;
  }

  return (
    <>
    {statusBar}
    <HomeScreen
      onOpenTask={(id) => {
        setTaskId(id);
        setScreen('detail');
      }}
      onCreateTask={() => setScreen('create')}
      onOpenInbox={() => setScreen('inbox')}
      onOpenProfile={() => {
        setProfileUserId(null);
        setProfileReturnScreen('home');
        setScreen('profile');
      }}
    />
    </>
  );
}
