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
import { SocketServerESSPKiosk } from './api/socketServerNV9_Kiosk';
import { CashNV9 } from './api/cashNV9';
import axios from 'axios';
import { EClientCommand, EMessage, IBaseClass, IMMoneyConfirm, IReqModel } from './entities/system.model';
import { PrintError, PrintSucceeded } from './services/service';
import { parse } from 'url';
import { CreateDatabase } from './entities';


CreateDatabase('').then(r => {
  console.log('DATABASE CREATED OK',r);
  
  const isVending = process.env.VENDING;
  const app = express();
  const router = express.Router();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 5000 }));
  app.use(cors());
  app.use(cookieParser());
  app.disable('x-powered-by');
  app.use(helmet.hidePoweredBy());

  const server = http.createServer(app)
  // const wss = new WebSocket.Server({ server });
  const f = fs.readFileSync(__dirname + '/.env', 'utf8');
  // console.log('F',f);

  const env = JSON.parse(f); //../

  process.env.backendKey = env.backendKey;
  process.env.production = env.production;
  process.env.name = env.name;

  if (isVending) {
    const wss1 = new WebSocket.Server({ noServer: true });
    const wss2 = new WebSocket.Server({ noServer: true });
    const wss3 = new WebSocket.Server({ noServer: true });

    // const ssZDM8 = new SocketServerZDM8();
    const invZDM8 = new InventoryZDM8(app, wss1);

    // const ssVMC = new SocketServerVMC();
    const invVMC = new InventoryVMC(app, wss2);

    // const ssM102 = new SocketServerM102();
    const invM102 = new InventoryM102(app, wss3);



    const sss = Array<IBaseClass>();
    sss.push(invM102, invVMC, invZDM8);
    process.env._image_path=path.join(__dirname, '..', 'public');
    app.use('/vmc/public', express.static(process.env._image_path))
    app.use('/zdm8/public', express.static(process.env._image_path))
    app.use('/m102/public', express.static(process.env._image_path))

    app.post('/', (req, res) => {
      const http = req.protocol; // http
      const host = req.get('Host') // localhost:4000
      const server = http + host;
      const d = req.body as IReqModel;
      try {
        console.log('POST Data', d);
        const c = d.data as IMMoneyConfirm;
        if (d.command == EClientCommand.confirmMMoney) {
          console.log('confirmMMoney');

          if (c.PhoneNumber == invZDM8.phonenumber
            // &&c.wallet_ids==invVMC.walletId
          ) {
            invZDM8.confirmMMoneyOder(c).then(r => {
              console.log(r.data);
              res.send(PrintSucceeded(d.command, r.data, EMessage.succeeded));
            })
          } else if (c.PhoneNumber == invVMC.phonenumber
            // &&c.wallet_ids==invVMC.walletId
          ) {
            invVMC.confirmMMoneyOder(c).then(r => {
              console.log(r.data);
              res.send(PrintSucceeded(d.command, r.data, EMessage.succeeded));
            })
          }
          else if (c.PhoneNumber == invM102.phonenumber
            // &&c.wallet_ids==invM102.walletId
          ) {
            invM102.confirmMMoneyOder(c).then(r => {
              console.log(r.data);
              res.send(PrintSucceeded(d.command, r.data, EMessage.succeeded));
            })
          } else {
            return res.send(PrintError(d?.command, [], EMessage.error));
          }
        } else {
          return res.send(PrintError(d?.command, [], EMessage.error));
        }

      } catch (error) {
        return res.send(PrintError(d.command, error, EMessage.error));

      }

    })

    server.on('upgrade', function upgrade(request, socket, head) {
      try {
        const { pathname } = parse(request.url || '');
        console.log('pathname', pathname);

        if (pathname === '/zdm8') {
          wss1.handleUpgrade(request, socket, head, function done(ws) {
            wss1.emit('connection', ws, request);
          });
        } else if (pathname === '/vmc') {
          wss2.handleUpgrade(request, socket, head, function done(ws) {
            wss2.emit('connection', ws, request);
          });
        }
        else if (pathname === '/m102') {
          wss3.handleUpgrade(request, socket, head, function done(ws) {
            wss3.emit('connection', ws, request);
          });
        }
        else {
          socket.destroy();
        }
      } catch (error) {
        console.log(error);

        socket.destroy();
      }

    });

    server.listen(process.env.PORT || 9008, async function () {
      console.log('HTTP listening on port ' + process.env.PORT || 9008);
    });


    process.on('exit', (code: number) => {
      console.log('exit code', code);
      sss.forEach(v => {
        v.close();
      });
    });
  } else {

    const wss4 = new WebSocket.Server({ noServer: true });


    // const ssNV9 = new SocketServerESSP();
    const cashNV9 = new CashNV9(app, wss4);

    const sss = Array<IBaseClass>();
    sss.push(cashNV9);
    app.use('/cashNV9/public', express.static(path.join(__dirname, 'public')))
    app.post('/', (req, res) => {
      const http = req.protocol; // http
      const host = req.get('Host') // localhost:4000
      const server = http + host;
      const d = req.body as IReqModel;
      try {
        console.log('POST Data', d);
        res.send(PrintSucceeded(d?.command, d, EMessage.succeeded));

      } catch (error) {
        return res.send(PrintError(d.command, error, EMessage.error));

      }

    })

    server.on('upgrade', function upgrade(request, socket, head) {
      try {
        const { pathname } = parse(request.url || '');
        console.log('pathname', pathname);

        if (pathname === '/cashNV9') {
          wss4.handleUpgrade(request, socket, head, function done(ws) {
            wss4.emit('connection', ws, request);
          });
        }
        else {
          socket.destroy();
        }
      } catch (error) {
        console.log(error);

        socket.destroy();
      }

    });

    server.listen(process.env.PORT || 9009, async function () {
      console.log('HTTP listening on port ' + process.env.PORT || 9009);
    });


    process.on('exit', (code: number) => {
      console.log('exit code', code);
      sss.forEach(v => {
        v.close();
      });
    });
  }
}).catch(e => {
  console.log('ERROR CREATED DATABASE', e);

});



