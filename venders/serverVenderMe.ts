

import fs from 'fs';
import { SocketClientMe } from './api/socketClient.me';

process.env.clientkey = fs.readFileSync(__dirname + "/certs/client/client.key") + '';
process.env.clientcert = fs.readFileSync(__dirname + "/certs/client/client.crt") + '';
process.env.ca = fs.readFileSync(__dirname + '/certs/ca/ca.crt') + '';
process.env.machineId = (fs.readFileSync(__dirname + '/machineId') + '').trim() || '11111111'

var clients = new Array<any>();
try {
  clients = [

    new SocketClientMe(),
    // new SocketKiosClient()
  ];

  process.on('exit', (code: number) => {
    console.log('exit code', code);

    clients.forEach(v => {
      v.close();
    })
  });
} catch (error) {
  console.log((error));
  const e = error as any;
  fs.appendFile(__dirname + '/config.json', JSON.stringify(e), (err) => {
    console.log(err);
  });
  clients.length = 0;
  setTimeout(() => {
    clients = [

      new SocketClientMe()];
  }, 5000);


}


