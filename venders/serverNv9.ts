


import { KiosESSP } from './api/kios.essp';
import { SocketKiosClient } from './api/socketClient.kios';



const x =new SocketKiosClient();
process.on('exit', (code: number) => {
    // port.close();
});