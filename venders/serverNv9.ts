


import { KiosESSP } from './api/kios.essp';
import { SocketKiosClient } from './api/socketClient.kios';


try {
    const x = new SocketKiosClient();
    process.on('exit', (code: number) => {
        x.close();
    });
} catch (error) {
    console.log((error));

}
