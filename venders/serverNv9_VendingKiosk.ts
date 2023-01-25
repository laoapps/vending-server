


import { KiosESSP } from './api/kios.essp';
import { SocketKiosClient } from './api/socketClient.kiosk';
import { SocketKiosClientVending } from './api/socketClient.kiosk.vending';


try {
    const x = new SocketKiosClientVending();
    process.on('exit', (code: number) => {
        x.close();
    });
} catch (error) {
    console.log((error));

}
