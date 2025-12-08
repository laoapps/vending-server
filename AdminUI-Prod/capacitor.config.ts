// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.laoapps.vendingadminpro',
  appName: 'AdminUI',
  webDir: 'www',
  bundledWebRuntime: false,

  // ← DELETE the entire "server" block or make it look like this:
  // server: {
  //   hostname: 'localhost'   // optional, harmless
  // },

  // This is important for Mac Catalyst apps that call real APIs
  plugins: {
    CapacitorHttp: {
      enabled: true   // allows http + self-signed HTTPS on Mac
    }
  }
};

export default config;