import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig ={
  "appId": "com.laoapps.smartcb",
  "appName": "Tasmota Control",
  "webDir": "www",
   plugins: {
    EdgeToEdge: {
      backgroundColor: "#ffffff",
    },
  },
}

export default config;
