export const environment = {
  production: true,
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

  // url: 'https://vendingserviceapi.laoapps.com/zdm8',
  // wsurl: 'wss://vendingserviceapi.laoapps.com/zdm8',
  // vending_server: 'https://vendingserviceapi.laoapps.com',
  // filemanagerurl: 'https://filemanager-api.laoapps.com/api/v1/file/',
  // apiUrl: 'https://smartcb-api.laoapps.com/api',



  // url: 'https://tvending4.khamvong.com/zdm8',
  // wsurl: 'wss://tvending4.khamvong.com/zdm8',
  // vending_server: 'https://tvending4.khamvong.com',
  // filemanagerurl: 'https://filemanager-api.laoapps.com/api/v1/file/',

  versionId: '1.1.21',
<<<<<<< HEAD
  demoStartMs: 180000, // attract auto  (demo: 3000)
=======
    demoStartMs: 18000, // attract auto  (demo: 3000)
>>>>>>> 78029e2804eb5c4c0be9c8293a088afa4cdc264e
  idleClearMs: 180000,  // clear checkout
  demoItemMs: 10000,   // each product photo in attract
  // attract / showcase row
  holdMs :10000,   // photo before story
  // videoMs:12000,   // vertical video this one from Admin defined
  // dock
<<<<<<< HEAD
  qrWaitMs:3000,    // quiet time after add/remove, then QR + float
=======
  qrWaitMs:1500,    // quiet time after add/remove, then QR + float
>>>>>>> 78029e2804eb5c4c0be9c8293a088afa4cdc264e
  cartMax : 10
};
