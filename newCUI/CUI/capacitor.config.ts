import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.laoapps.vendingmachine',
  appName: 'cui',
  webDir: 'www',
  bundledWebRuntime: false,
  server: {
    allowNavigation: []
  },
  android: {
    allowMixedContent: true
  },
  plugins: {
		CapacitorUpdater: {
			autoUpdate: true,
			resetWhenUpdate: false,
      version: "1.0.0"
		}
	}
};

export default config;
