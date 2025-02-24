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
  cordova: {
    preferences: {
      ScrollEnabled: 'false',
      'android-minSdkVersion': '19',
      'android-targetSdkVersion': '30',
      'android-compileSdkVersion': '30',
      BackupWebStorage: 'none',
      SplashMaintainAspectRatio: 'true',
      FadeSplashScreenDuration: '300',
      SplashShowOnlyFirstTime: 'false',
      SplashScreen: 'screen',
      SplashScreenDelay: '3000',
      WKWebViewOnly: 'true',
      AndroidXEnabled: 'false'
    }
  },
  "plugins": {
		"CapacitorUpdater": {
			"autoUpdate": true,
			"resetWhenUpdate": false,
      "version": "1.0.0"
		}
	}
};

export default config;
