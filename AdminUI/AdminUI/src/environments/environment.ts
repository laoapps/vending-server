// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  url:'http://localhost:9006',
  wsurl:'',
  laaburl: 'http://localhost:30000/api/v1/laoapps_ewallet/',
  testVending: 'http://localhost:30777/vending/api/',
};

// ws://laoapps.com:9006/zdm8
// http://laoapps.com:9006/zdm8

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
