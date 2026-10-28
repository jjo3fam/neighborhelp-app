const base = require('./app.json').expo;

module.exports = () => {
  const plugins = [...base.plugins];
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  // Android uses autolinking plus the registered package/signing certificate.
  if (process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID && iosClientId) {
    plugins.push(['@react-native-google-signin/google-signin', { iosUrlScheme: iosClientId.split('.').reverse().join('.') }]);
  }
  const facebookAppId = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID;
  const facebookClientToken = process.env.EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN;
  if (facebookAppId && facebookClientToken) {
    plugins.push(['react-native-fbsdk-next', {
      appID: facebookAppId,
      clientToken: facebookClientToken,
      displayName: base.name,
      scheme: `fb${facebookAppId}`,
      isAutoInitEnabled: false,
      advertiserIDCollectionEnabled: false,
      autoLogAppEventsEnabled: false,
    }]);
  }
  return { ...base, plugins };
};
