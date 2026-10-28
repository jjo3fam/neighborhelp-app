import { Platform } from 'react-native';
import { loginSocialUser, SocialProvider } from './api';

export const socialClientConfigured = {
  google: Boolean(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID),
  facebook: Platform.OS === 'android' && Boolean(process.env.EXPO_PUBLIC_FACEBOOK_APP_ID && process.env.EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN),
};

export async function signInWithSocialAccount(provider: SocialProvider) {
  if (provider === 'google') {
    // Load native SDKs only when selected, keeping email login usable in older dev builds.
    const { GoogleSignin, statusCodes } = require('@react-native-google-signin/google-signin') as typeof import('@react-native-google-signin/google-signin');
    GoogleSignin.configure({ webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID });
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const result = await GoogleSignin.signIn();
      if (result.type === 'cancelled') return null;
      const token = result.data.idToken;
      if (!token) throw new Error('Google did not return a sign-in token. Please try again.');
      return loginSocialUser({ provider, token });
    } catch (error) {
      if ((error as { code?: string }).code === statusCodes.SIGN_IN_CANCELLED) return null;
      throw error;
    }
  }

  const { Settings, LoginManager, AccessToken } = require('react-native-fbsdk-next') as typeof import('react-native-fbsdk-next');
  Settings.initializeSDK();
  const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
  if (result.isCancelled) return null;
  const credential = await AccessToken.getCurrentAccessToken();
  if (!credential?.accessToken) throw new Error('Facebook did not return a sign-in token. Please try again.');
  return loginSocialUser({ provider, token: credential.accessToken });
}
