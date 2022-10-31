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
import axios from 'axios';
import { EClientCommand, EMessage, IBaseClass, IMMoneyConfirm, IReqModel } from './entities/system.model';
import { PrintError, PrintSucceeded } from './services/service';
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


// const ssZDM8 = new SocketServerZDM8();
const invZDM8 = new InventoryZDM8(app, wss);

// const ssVMC = new SocketServerVMC();
const invVMC = new InventoryVMC(app, wss);

// const ssM102 = new SocketServerM102();
const invM102 = new InventoryM102(app, wss);

// const ssNV9 = new SocketServerESSP();
const cashNV9 = new CashNV9(app, wss);

const sss =Array<IBaseClass>();
sss.push(invM102,invVMC,invZDM8,cashNV9);
app.post('/', (req, res) => {
  const d = req.body as IReqModel;
  try {
    console.log('POST Data', d);
    const c = d.data as IMMoneyConfirm;
    if (d.command == EClientCommand.confirmMMoney) {
      if(c.PhoneNumber==invZDM8.phonenumber&&c.wallet_ids==invVMC.walletId){

      }else if(c.PhoneNumber==invVMC.phonenumber&&c.wallet_ids==invVMC.walletId){

      }
      else if(c.PhoneNumber==invM102.phonenumber&&c.wallet_ids==invM102.walletId){
        
      }
    }
  } catch (error) {
    return res.send(PrintError(d.command, error, EMessage.error));

  }

})

server.listen(process.env.PORT || 9009, async function () {
  console.log('HTTP listening on port ' + process.env.PORT || 9009);
});


process.on('exit', (code: number) => {
  console.log('exit code', code);
  sss.forEach(v=>{
    v.close();
  });
});
