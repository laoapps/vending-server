
import { SocketClientM102 } from './api/socketClient.m102';
import { SocketClientZDM8 } from './api/socketClient.zdm8';
import fs from 'fs';

process.env.clientkey= fs.readFileSync(__dirname + "/certs/client/client.key")+'';
process.env.clientcert = fs.readFileSync(__dirname + "/certs/client/client.crt")+'';
process.env.ca = fs.readFileSync(__dirname+'/certs/ca/ca.crt')+'';
process.env.machineId = (fs.readFileSync(__dirname+'/machineId')+'').trim()||'11111111'

var clients=new Array<any>();
try {
  clients = [

    new SocketClientZDM8(),
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
  clients.length=0;
  setTimeout(() => {
    clients = [

      new SocketClientZDM8()];
  }, 5000);
  

}


