import * as fs from 'fs';
import * as path from 'path';
import https from 'https';
import http from 'http';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import express, { Router } from 'express';
import * as WebSocket from 'ws';
import { SocketServerZDM8 } from './api/socketServerZDM8';
import { InventoryZDM8 } from './api/inventoryZDM8';
import { SocketServerVMC } from './api/socketServerVMC';
import { InventoryVMC } from './api/inventoryVMC';
import { InventoryM102 } from './api/inventoryM102';
import { SocketServerM102 } from './api/socketServerM102';
import { SocketServerESSP } from './api/socketServerNV9';
import { CashNV9 } from './api/cashNV9';
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
const wss = new WebSocket.Server({ server });


const ssZDM8 = new SocketServerZDM8();
const invZDM8 =new InventoryZDM8(app, wss, ssZDM8);

const ssVMC = new SocketServerVMC();
const invVMC =new InventoryVMC(app, wss, ssVMC);

const ssM102 = new SocketServerM102();
const invM102 =new InventoryM102(app, wss, ssM102);

const ssNV9 = new SocketServerESSP();
const cashNV9 =new CashNV9(app, wss, ssNV9);



server.listen(process.env.PORT || 9009, async function () {
  console.log('HTTP listening on port ' + process.env.PORT || 9009);
});


process.on('exit', (code:number)=>{
  console.log('exit code',code);
  
  invZDM8.ssocket.sclients.forEach(v=>{
    v.destroy();
  });

  invVMC.ssocket.sclients.forEach(v=>{
    v.destroy();
  });

  invM102.ssocket.sclients.forEach(v=>{
    v.destroy();
  });
  cashNV9.ssocket.sclients.forEach(v=>{
    v.destroy();
  });
  wss.close();
  ssZDM8.server.close();
  ssM102.server.close();
  ssVMC.server.close();
});
