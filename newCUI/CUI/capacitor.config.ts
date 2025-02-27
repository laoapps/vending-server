import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.laoapps.vendingmachine',
  appName: 'cui',
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
		CapacitorUpdater: {
			autoUpdate: true,
			resetWhenUpdate: false,
      version: "1.0.0"
		},
    CapacitorSQLite: {
      iosDatabaseLocation: 'Library', // Recommended for iOS
      iosIsEncryption: false, // Optional: enable encryption if needed
      androidIsEncryption: false, // Optional
    }
	}
};

export default config;
