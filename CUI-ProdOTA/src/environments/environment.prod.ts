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

  versionId: '1.1.21'
};
