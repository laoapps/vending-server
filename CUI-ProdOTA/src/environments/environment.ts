// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  // url: 'https://tvending4.khamvong.com/zdm8',
  // wsurl: 'wss://tvending4.khamvong.com/zdm8',
  // vending_server: 'https://tvending4.khamvong.com',
  // filemanagerurl: 'http://filemanager-api.laoapps.com/api/v1/file/',



  // url: 'https://vendingserviceapi.laoapps.com/zdm8',
  // wsurl: 'wss://vendingserviceapi.laoapps.com/zdm8',
  // vending_server: 'https://vendingserviceapi.laoapps.com',
  // filemanagerurl: 'https://filemanager-api.laoapps.com/api/v1/file/',

  url: (localStorage.getItem('isLTC') ? true : false) ? 'https://vendingserviceapi.laoapps.com/zdm8' : 'https://vending-service-api5.laoapps.com/zdm8',
  wsurl: (localStorage.getItem('isLTC') ? true : false) ? 'wss://vendingserviceapi.laoapps.com/zdm8' : 'wss://vending-service-api5.laoapps.com/zdm8',
  vending_server: (localStorage.getItem('isLTC') ? true : false) ? 'https://vendingserviceapi.laoapps.com' : 'https://vending-service-api5.laoapps.com',
  filemanagerurl: 'https://filemanager-api.laoapps.com/api/v1/file/',
  apiUrl: 'https://smartcb-api.laoapps.com/api',


  urlLTC: 'https://vendingserviceapi.laoapps.com/zdm8',
  wsLTC: 'wss://vendingserviceapi.laoapps.com/zdm8',
  vendingLTC: 'https://vendingserviceapi.laoapps.com',

  urlHM: 'https://vending-service-api5.laoapps.com/zdm8',
  wsHM: 'wss://vending-service-api5.laoapps.com/zdm8',
  vendingHM: 'https://vending-service-api5.laoapps.com',

  versionId: '1.1.21'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
