

import { KiosServer } from './api/kios';
import { SocketKiosClient } from './api/socketClient.kios';



new KiosServer(new SocketKiosClient())