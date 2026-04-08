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
  splash: {
    image: './assets/splash.png',         // ← changed from splash-icon.png
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
      backgroundColor: '#1A7A76',         // ← changed from #ffffff to Relay teal
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
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? '00000000-0000-0000-0000-000000000000',
    },
  },
};

export default config;