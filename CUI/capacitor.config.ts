import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.laoapps.vendingmachine',
  appName: 'cui3',
  webDir: 'www',
  bundledWebRuntime: false,
  server: {
    allowNavigation: [],
    cleartext: true
  },
  android: {
    allowMixedContent: true
  },
  plugins: {
    LiveUpdate: {
      appId: '6e351b4f-69a7-415e-a057-4567df7ffe94',
      autoDeleteBundles: undefined,
      defaultChannel: 'production',
      httpTimeout: undefined,
      publicKey: '-----BEGIN PUBLIC KEY-----MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDDodf1SD0OOn6hIlDuKBza0Ed0OqtwyVJwiyjmE9BJaZ7y8ZUfcF+SKmd0l2cDPM45XIg2tAFux5n29uoKyHwSt+6tCi5CJA5Z1/1eZruRRqABLonV77KS3HUtvOgqRLDnKSV89dYZkM++NwmzOPgIF422mvc+VukcVOBfc8/AHQIDAQAB-----END PUBLIC KEY-----',
      readyTimeout: 10000,
      serverDomain: undefined,
    },
    CapacitorSQLite: {
      iosDatabaseLocation: 'Library', // Recommended for iOS
      iosIsEncryption: false, // Optional: enable encryption if needed
      androidIsEncryption: false, // Optional
    }
  }
};

export default config;
