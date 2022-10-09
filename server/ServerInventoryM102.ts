import * as fs from 'fs';
import * as path from 'path';
import https from 'https';
import http from 'http';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import express, { Router } from 'express';
import * as WebSocket from 'ws';
import { InventoryM102 } from './api/inventoryM102';
import { SocketServerM102 } from './api/socketServerM102';


const app = express();
const router = express.Router();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 5000 }));
app.use(cors());
app.use(cookieParser());
app.disable('x-powered-by');
app.use(helmet.hidePoweredBy());
app.use('/public', express.static(path.join(__dirname, 'public')))
const server = http.createServer(app)
server.listen(process.env.PORT || 9009, async function () {
  console.log('HTTP listening on port ' + process.env.PORT || 9009);
});
const wss = new WebSocket.Server({ server });
const ss = new SocketServerM102();
new InventoryM102(app, wss, ss);