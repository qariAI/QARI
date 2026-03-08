import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.qari.ai',
  appName: 'QARI',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '284616519796-bre587n3jilglr8sjft871kt4tqb0v1p.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  }
};

export default config;
