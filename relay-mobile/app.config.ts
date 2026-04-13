import type { ExpoConfig } from 'expo/config';
const config: ExpoConfig = {
  name: 'Relay',
  slug: 'relay-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  scheme: 'relay',
  newArchEnabled: true,
  updates: {
    url: 'https://u.expo.dev/07182d9d-8b69-4704-92e5-9d46ba89c3ed',
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.relay.mobile',
    buildNumber: '1',
    infoPlist: {
      CFBundleURLTypes: [
        {
          CFBundleURLSchemes: ['relay'],
        },
      ],
    },
  },
  android: {
    package: 'com.relay.mobile',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#1A7A76',
    },
    edgeToEdgeEnabled: true,
    intentFilters: [
      {
        action: 'VIEW',
        data: [{ scheme: 'relay' }],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: ['expo-secure-store', '@react-native-community/datetimepicker'],
  extra: {
    eas: {
      projectId: '07182d9d-8b69-4704-92e5-9d46ba89c3ed',
    },
  },
};
export default config;