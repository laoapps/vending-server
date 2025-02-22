import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.laoapps.vendingmachine',
  appName: 'cui',
  webDir: 'www',
  bundledWebRuntime: false,

  server: {
    allowNavigation: [] // Add external URLs if needed
  },

  android: {
    allowMixedContent: true // Disable this in production
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 3000, // 3 seconds
      showSpinner: false // No spinner
    },
    StatusBar: {
      style: "dark" // Dark text for light backgrounds
    },
    CapacitorUpdater: {
      autoUpdate: true, // Enable auto-updates
      resetWhenUpdate: false // Preserve app data
    }
  }
};

export default config;