import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'AdminUI',
  webDir: 'www',
  bundledWebRuntime: false,
  "server": {
    "hostname": "localhost",
    "iosScheme": "https",
    "androidScheme": "https",
    "url": "http://localhost",
    "allowNavigation": [
    ]
  }
};

export default config;
