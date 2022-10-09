
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';

import * as WebSocket from 'ws';
import { KiosServer } from './api/kios';
import { SocketKiosClient } from './api/socketClient.kios';
import { PrintSucceeded } from './services/service';


new KiosServer(new SocketKiosClient())