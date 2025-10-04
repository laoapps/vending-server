// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  server_onlinestore:'https://hangmistore-api.laoapps.com/api/v1/',
  server_inventory:'https://onlineinventory-api.laoapps.com/api/v1/',
  server_orderbilling:'https://orderbilling-api.laoapps.com/api/v1/',
  server_notification:'https://laab-notify.laoapps.com/api/v1',
  server_url:'https://laabx-api.laoapps.com/api/v1/',
  wsurl: 'wss://vending-service-api5.laoapps.com/zdm8',
  serverFile:'https://filemanager-api.laoapps.com/api/v1/',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
