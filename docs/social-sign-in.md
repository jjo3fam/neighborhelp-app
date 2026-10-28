# Google and Facebook sign-in setup

The integration is prepared for the current Android application. It cannot authenticate real Google or Facebook users until the provider apps and credentials below are configured and a development APK containing the native SDKs is installed.

## Current identifiers

| Item | Value |
| --- | --- |
| API | `https://api.avaella.net` |
| Android package | `com.neighborhelp.mobile` |
| Android activity | `com.neighborhelp.mobile.MainActivity` |
| Android signing SHA-1 | `11:C0:6B:4C:7E:20:76:E0:94:B1:25:E3:CD:28:F5:C0:FA:41:6B:8B` |
| Facebook Android key hash | `EcBrTH4gduCUsSXjzSj1wPpBa4s=` |

Fingerprints were extracted from EAS development build `565e557b-1093-4ab4-be6b-f3e773a05e59`. Keep the same EAS Android keystore for the next build. Google Play distribution may use a different signing certificate that must also be registered.

## Google Cloud configuration (October 28, 2026)

- Project: `centering-cable-513011-t1`, owned by the signed-in Avaella Google account.
- Consent branding: **Avaella**, external audience in **Testing** mode; support and developer contact `justin@avaella.net`.
- Test user: `justin@avaella.net`.
- Android client **Avaella Android development**: `412010476007-8g4l827kks0f4jmldf68r0unp5o83pih.apps.googleusercontent.com`.
- Server audience client **Avaella server sign-in**: `412010476007-lkngvkkm0ac2ghde774t7fqe29tq1e45.apps.googleusercontent.com`.
- The server audience client has no browser origins or redirect URIs, because this Android integration exchanges a Google ID token directly with the API. Its client secret is not used or stored by the app.

OAuth client IDs are public identifiers. Facebook setup and real phone sign-in verification are still pending.

Google is enabled in the API, and the EAS `development` environment contains the HTTPS API address and server audience client ID. Android build `c48e33ed-177f-4e0c-b7c7-ea89a7317e87` finished successfully and includes the Google native bridge. Its APK certificate matches the SHA-1 above. [Download the development APK](https://expo.dev/artifacts/eas/tXXIumFAZP_ojIwgRABjKszd2oyhXfGlGSori5AJefo.apk).

Phone verification: install this APK over the existing development app, connect to Metro, choose Google sign-in, and use the allowed test account. Real successful sign-in, returning-user sign-in, and cancellation still require device testing. Facebook remains disabled until its Meta application is configured.

## Google

1. Sign into [Google Cloud Console](https://console.cloud.google.com/) with the LLC-controlled Google account and create/select a project for this application.
2. Set up Google Auth Platform branding and audience. Use a provisional app display name if needed, a real support contact, and external audience for users outside the LLC. While testing, add the test Google accounts to the allowed test users.
3. Create an **Android** OAuth client using the package and SHA-1 above.
4. Create a **Web application** OAuth client for the server audience. The native Android flow uses its client ID to request an ID token. This flow does not need a Google client secret or a browser callback URL.
5. Set `GOOGLE_CLIENT_IDS` in `apps/api/.env` to that Web client ID, and `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in the mobile build environment to the same value.

The server uses Google's ID-token verifier to check signatures, issuer, expiry and audience, and requires a verified email. It does not trust names, email or user IDs supplied directly by the mobile app.

References: [Google backend verification](https://developers.google.com/identity/sign-in/web/backend-auth), [Expo Google authentication](https://docs.expo.dev/guides/google-authentication/).

## Facebook / Meta

1. Sign into [Meta for Developers](https://developers.facebook.com/apps/) with the business's authorized administrator and create a consumer app with the Facebook Login use case. Associate it with the LLC's business portfolio when appropriate.
2. Add Android as a platform using the package, activity and key hash above. Enable the login email permission and add developer/tester accounts for testing.
3. Set the app's **App ID** as `FACEBOOK_APP_ID` in the API environment and `EXPO_PUBLIC_FACEBOOK_APP_ID` in the mobile build environment.
4. Set the **App Secret** only as `FACEBOOK_APP_SECRET` in the API environment. Never put the App Secret in mobile code, Expo public variables, or Git.
5. Set the **Client Token** as `EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN` in the mobile build environment. A Facebook Client Token is distinct from the server App Secret.
6. Use `FACEBOOK_GRAPH_VERSION` to pin the server Graph API version (prepared default: `v24.0`). Configure valid privacy-policy and user-data-deletion information reflecting the LLC's actual handling of data before public release and complete any review Meta requires.

The server checks Facebook's token inspector for the expected app and user, validates expiry, fetches the corresponding profile using an app-secret proof, and requires an email address. Only Android Facebook login is enabled in this iteration. Facebook Limited Login for iOS requires a separate verification flow before enabling its button on iOS.

Reference: [Facebook SDK integration](https://github.com/thebergamo/react-native-fbsdk-next).

## Activation

1. Provider IDs belong in the mobile build environment; use the EAS `development` environment for the cloud development build, not only a local `.env` file.
2. Backend settings go in `/root/neighborhelp-app/apps/api/.env`. Restart the API after setting them. Protect that file and keep it out of Git.
3. Build configuration is in `apps/mobile/app.config.js`; native provider plugins are enabled when their IDs are configured. Install a new EAS development APK after those settings are present.
4. Restart Metro with the same public provider variables so the JavaScript and native settings match.
5. Confirm real Google and Facebook sign-up/sign-in on the phone, cancellation, returning-user sign-in, and existing-email handling. Real provider login is still pending; automated tests mock provider responses and do not replace this check.

Buttons appear only when the mobile settings and server availability endpoint both indicate that the provider is configured. Existing email/password sign-in remains available. Social sign-in creates a new account or finds it by stable provider subject. Matching email alone never attaches a social login to an existing account; account linking is not implemented yet.

`apps/mobile/react-native.config.js` also excludes Facebook from native autolinking until both public Facebook settings are present in the build environment. Hiding the JavaScript button alone is insufficient: the Android bridge initializes Facebook native modules at startup and requires its native configuration.

The API accepts social credentials only over HTTPS via Caddy. The mobile client also rejects social requests if its API URL is not HTTPS. The proxy configuration is in `deploy/Caddyfile`.
