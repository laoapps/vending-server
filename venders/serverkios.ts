

import { KiosServer } from './api/kios.essp';
import { SocketKiosClient } from './api/socketClient.kios';



new KiosServer(new SocketKiosClient())