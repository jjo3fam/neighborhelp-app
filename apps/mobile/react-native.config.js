// Facebook creates native modules during React Native startup, even when its
// JavaScript button is hidden. Link it only in builds with complete settings.
const facebookConfigured = Boolean(
  process.env.EXPO_PUBLIC_FACEBOOK_APP_ID && process.env.EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN
);

module.exports = {
  dependencies: facebookConfigured ? {} : {
    'react-native-fbsdk-next': {
      platforms: { android: null, ios: null },
    },
  },
};
