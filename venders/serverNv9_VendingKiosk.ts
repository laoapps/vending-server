


// import { KiosESSP } from './api/kios.essp';
// import { SocketKiosClient } from './api/socketClient.kiosk';

// import fs from 'fs';

// var clients=new Array<any>();
// try {
//   clients = [

//     new SocketKiosClientVending()];

//   process.on('exit', (code: number) => {
//     console.log('exit code', code);

//     clients.forEach(v => {
//       v.close();
//     })
//   });
// } catch (error) {
//   console.log((error));
//   const e = error as any;
//   fs.appendFile(__dirname + '/config.json', JSON.stringify(e), (err) => {
//     console.log(err);
//   });
//   clients.length=0;
//   setTimeout(() => {
//     clients = [

//       new SocketKiosClientVending()];
//   }, 5000);
  

// }
