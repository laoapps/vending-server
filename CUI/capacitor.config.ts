import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.laoapps.vendingmachine',
  appName: 'VendingMachine',
  webDir: 'www',
  bundledWebRuntime: false,
  server: {
    url: 'http://localhost',
    cleartext: true
  }
};

export default config;