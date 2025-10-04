import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.laoapps.vendingmachine',
  appName: 'cui3',
  webDir: 'www',
  bundledWebRuntime: false,
  "server": {
    "hostname": "localhost",
    "iosScheme": "https",
    "androidScheme": "https",
    "allowNavigation": [],
    cleartext: true
  },
  android: {
    allowMixedContent: true
  },
  plugins: {
    LiveUpdate: {
      appId: '6e351b4f-69a7-415e-a057-4567df7ffe94',
      defaultChannel: 'production',
      autoDeleteBundles: true,
      readyTimeout: 10000,
      enabled: true,
      resetOnUpdate: true
    },
    CapacitorSQLite: {
      iosDatabaseLocation: 'Library',
      iosIsEncryption: false,
      androidIsEncryption: false
    },
    CapacitorUpdater: {
      autoUpdate: false, // Disable auto-updates to control manually
      resetWhenUpdate: true // Reset to default bundle if update fails
    }
  }
};

export default config;