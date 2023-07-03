import * as fs from "fs";
import * as path from "path";
import https from "https";
import http from "http";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import express, { Router } from "express";
import * as WebSocket from "ws";
import { SocketServerZDM8 } from "./api/socketServerZDM8";
import { InventoryZDM8 } from "./api/inventoryZDM8";
import { SocketServerVMC } from "./api/socketServerVMC";
import { InventoryVMC } from "./api/inventoryVMC";
import { InventoryM102 } from "./api/inventoryM102";
import { SocketServerM102 } from "./api/socketServerM102";
import { SocketServerESSPKiosk } from "./api/socketServerNV9_Kiosk";
import { CashNV9MMoney } from "./api/cashNV9MMoney";
import axios from "axios";
import {
  EClientCommand,
  EMessage,
  IBaseClass,
  IMMoneyConfirm,
  IReqModel,
} from "./entities/system.model";
import { PrintError, PrintSucceeded } from "./services/service";
import { parse } from "url";
import { CreateDatabase } from "./entities";
import { LaabVendingAPI } from "./api/laab.vending";
import { CashNV9LAAB } from "./api/cashNV9LAAB";

const f = fs.readFileSync(__dirname + "/.env", "utf8");
const env = JSON.parse(f); //../
    process.env.backendKey = env.backendKey;
    process.env.production = env.production;
    process.env.name = env.name; 
    process.env._image_path = path.join(__dirname, "..", "public");
    process.env._log_path = path.join(__dirname, "..", "logs");

    process.env.serverkey = fs.readFileSync(__dirname + '/certs/server/server.key')+'';
    process.env.servercert = fs.readFileSync(__dirname + '/certs/server/server.crt')+'';
    process.env.ca = fs.readFileSync(__dirname+'/certs/ca/ca.crt')+'';
CreateDatabase("")
  .then((r) => {
    console.log("DATABASE CREATED OK", r);

    const isVending = process.env.VENDING || true;
    console.log(`is vending`, isVending);
    const app = express();
    const router = express.Router();
    app.use(express.json({ limit: "200mb" }));
    
    app.use(
      express.urlencoded({
        limit: "200mb",
        extended: true,
        parameterLimit: 5000,
      })
    );
    app.use(express.json());
    app.use(cors());
    app.use(cookieParser());
    app.disable("x-powered-by");
    app.use(helmet.hidePoweredBy());


    
    const server = http.createServer(app);
    // const wss = new WebSocket.Server({ server });
    
    // console.log('F',f);

    
    

    const wss1 = new WebSocket.Server({ noServer: true });
    const wss2 = new WebSocket.Server({ noServer: true });
    //.... VENDING
    // const ssZDM8 = new SocketServerZDM8();
    const invZDM8 = new InventoryZDM8(app, wss1);

    //.... KIOSK
    const kioskport = process.env.KIOSKLAABPORT;

    const laabkioskssock = new SocketServerESSPKiosk(Number(kioskport));
    const laabkiosk = new CashNV9LAAB(app, wss2, laabkioskssock);

    // laab
    const laabVendingAPI = new LaabVendingAPI(app, invZDM8.ssocket);
    const sss = Array<IBaseClass>();
    sss.push(
      // invM102,
      //  invVMC,
      invZDM8
    );
  


  
    fs.existsSync(process.env._log_path) || fs.mkdirSync(process.env._log_path);
    fs.existsSync(process.env._image_path) ||
      fs.mkdirSync(process.env._image_path);

    // app.use("/vmc/public", express.static(process.env._image_path));
    app.use("/zdm8/public", express.static(process.env._image_path));
    // app.use("/m102/public", express.static(process.env._image_path));

    app.post("/", (req, res) => {
      const http = req.protocol; // http
      const host = req.get("Host"); // localhost:4000
      const server = http + host;
      const d = req.body as IReqModel;
      console.log("debug HOST", server, d);

      try {
        console.log("POST Data", d);
        const c = d.data as IMMoneyConfirm;
        if (d.command == EClientCommand.confirmMMoney) {
          console.log("confirmMMoney");
          invZDM8.confirmMMoneyOder(c).then((r) => {
            console.log(r.data);
            res.send(PrintSucceeded(d.command, r.data, EMessage.succeeded));
          });
        } else if (d.command == EClientCommand.confirmLAAB) {
          console.log("confirmLAAB");
          invZDM8.confirmLAABOder(c).then((r) => {
            console.log(r.data);
            res.send(PrintSucceeded(d.command, r.data, EMessage.succeeded));
          });
        } else {
          return res.send(PrintError(d?.command, [], EMessage.error));
        }
      } catch (error) {
        return res.send(PrintError(d.command, error, EMessage.error));
      }
    });

    server.on("upgrade", function upgrade(request, socket, head) {
      try {
        const { pathname } = parse(request.url || "");
        console.log("pathname", pathname);

        if (pathname === "/zdm8") {
          wss1.handleUpgrade(request, socket, head, function done(ws) {
            wss1.emit("connection", ws, request);
          });
        }
        else if (pathname === "/cashNV9LAAB") {
          wss2.handleUpgrade(request, socket, head, function done(ws) {
            wss1.emit("connection", ws, request);
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

    server.listen(process.env.PORT, async function () {
      console.log("HTTP listening on port " + process.env.PORT);
    });

    process.on("exit", (code: number) => {
      console.log("exit code", code);
      sss.forEach((v) => {
        v.close();
      });
    });
  })
  .catch((e) => {
    console.log("ERROR CREATED DATABASE", e);
  });
