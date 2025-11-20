import * as fs from "fs";
import * as path from "path";
import http from "http";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import express from "express";
import * as WebSocket from "ws";
import { InventoryZDM8 } from "./api/inventoryZDM8";
import { SocketServerESSPKiosk } from "./api/socketServerNV9_Kiosk";
import {
  EClientCommand,
  EMessage,
  IBaseClass,
  IMMoneyConfirm,
  IReqModel,
  IResModel,
} from "./entities/system.model";
import { PrintError, PrintSucceeded } from "./services/service";
import { parse } from "url";
import { CreateDatabase } from "./entities";
import { LaabVendingAPI } from "./api/laab.vending";
import { CashNV9LAAB } from "./api/cashNV9LAAB";
import { InventoryLocker } from "./api/inventoryLocker";
import { ControlVersionAPI } from "./api/controlVersion";
import dotenv from "dotenv";
import { initBundle } from "./services/appupdate";
import { initialize } from "./services/topup.service";
import { createLogger, format, transports } from 'winston';
import axios from "axios";
import { apiQueue } from "./api/queue.services";

// const f = fs.readFileSync(__dirname + "/.env", "utf8");
// const env = JSON.parse(f); //../
process.env.backendKey = process.env.backendKey;
process.env.production = process.env.production;
process.env.name = process.env.name;
process.env._image_path = path.join(__dirname, "..", "public");
process.env._log_path = path.join(__dirname, "..", "logs");

// process.env.serverkey = fs.readFileSync(__dirname + '/certs/server/server.key') + '';
// process.env.servercert = fs.readFileSync(__dirname + '/certs/server/server.crt') + '';
// process.env.ca = fs.readFileSync(__dirname + '/certs/ca/ca.crt') + '';
CreateDatabase("")
  .then((r) => {
    console.log("DATABASE CREATED OK", r);

    initialize();


    const isVending = process.env.VENDING || true;
    console.log(`is vending`, isVending);
    const app = express();
    // const router = express.Router();

    // app.use(express.json({ limit: "2000mb" }));

    app.use((req, res, next) => {
      if (
        req.headers["content-type"] &&
        req.headers["content-type"].includes("application/json")
      ) {
        express.json({ limit: "2000mb" })(req, res, next);
      } else {
        next();
      }
    });



    app.use(
      express.urlencoded({
        limit: "2000mb",
        extended: true,
        parameterLimit: 5000
      })
    );
    // app.use(express.json());
    // app.use(cors());
    // Allow all origins, methods, and headers
    app.use(cors({
      origin: "*", // Allow all origins
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allow all common HTTP methods
      allowedHeaders: ['Content-Type', 'Authorization', 'x-capawesome-app-id'], // Allow common headers
      credentials: true // Allow cookies and credentials if needed
    }));
    app.options('*', cors()); // Handle preflight for all routes

    // app.use(cors({
    //   origin: (origin, callback) => {
    //     // Allow requests with no origin (e.g., same-origin or mobile apps)
    //     if (!origin) return callback(null, true);
    //     // Allow specific origins
    //     const allowedOrigins = ["https://yourdomain.com", "http://localhost:3000"];
    //     if (allowedOrigins.includes(origin)) {
    //       return callback(null, true);
    //     }
    //     return callback(new Error("Not allowed by CORS"));
    //   },
    //   credentials: true
    // }));
    app.use(cookieParser());
    app.disable("x-powered-by");
    app.use(helmet.hidePoweredBy());


    const api = axios.create({
      baseURL: 'https://vending-service-api5.laoapps.com/',
      timeout: 25000,    // mobile networks are slower
      // NO httpAgent/httpsAgent needed in Capacitor/Browser
    });
    app.get('/testQueue', (req: express.Request, res: express.Response) => {
      try {
        for (let index = 0; index < 1200; index++) {
          apiQueue.add(() => {
            api.get<IResModel>('', { headers: { 'Content-Type': 'application/json', timeout: 10000 } }).then((rx) => {
              console.log(index, '-----> RESPONSE :', rx.data);
            })
              .catch((e) => {
                console.log('----->Error RESPONSE :', e);

              });
          });

        }
        return res.send('SUCCESS');
      } catch (error) {
        res.send(`ERROR :${error}`)
      }
    })


    // const wss = new WebSocket.Server({ server });

    // console.log('F',f);




    const wss1 = new WebSocket.Server({ noServer: true });
    const wss2 = new WebSocket.Server({ noServer: true });
    const wss3 = new WebSocket.Server({ noServer: true });
    //.... VENDING
    // const ssZDM8 = new SocketServerZDM8();
    const invZDM8 = new InventoryZDM8(app, wss1);
    const invLocker = new InventoryLocker(app, wss3);
    //.... KIOSK
    const kioskport = process.env.KIOSKLAABPORT;

    const laabkioskssock = new SocketServerESSPKiosk(Number(kioskport));
    const laabkiosk = new CashNV9LAAB(app, wss2, laabkioskssock);

    // laab
    const laabVendingAPI = new LaabVendingAPI(app, invZDM8.ssocket, invZDM8);
    const controlVersionAPI = new ControlVersionAPI(app);
    // const laabVendingAPI3 = new LaabVendingAPI(app, invLocker.ssocket, invLocker);
    const sss = Array<IBaseClass>();
    sss.push(
      // invM102,
      //  invVMC,
      invZDM8,
      invLocker
    );




    fs.existsSync(process.env._log_path) || fs.mkdirSync(process.env._log_path);
    fs.existsSync(process.env._image_path) ||
      fs.mkdirSync(process.env._image_path);

    initBundle(app);


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
            // console.log(r.data);
            // res.send(PrintSucceeded(d.command, r.data, EMessage.succeeded));
            if (r) {
              res.send(PrintSucceeded(d.command, r.data, EMessage.succeeded));
            } else {
              res.send(PrintError(d.command, r, EMessage.error));
            }
          });
        } else if (d.command == EClientCommand.confirmLAAB) {
          console.log("confirmLAAB");
          invZDM8.confirmLAABOder(c).then((r) => {
            // console.log(r.data);
            res.send(PrintSucceeded(d.command, r.data, EMessage.succeeded));
          });
        } else if (d.command == EClientCommand.confirmLAOQR) {
          // console.log('confirmLAOQR');
          invZDM8.confirmLaoQROrder(c).then((r) => {
            // console.log(r.data);
            if (r) {
              res.send(PrintSucceeded(d.command, r, EMessage.succeeded));
            } else {
              res.send(PrintError(d.command, r, EMessage.error));
            }
          }).catch(e => {
            console.log(e);
            res.send(PrintError(d.command, e, EMessage.error));
          });
        } else if (d.command == EClientCommand.confirmLAABX) {
          // console.log('confirmLAOQR');
          invZDM8.confirmLAABXOrder(c).then((r) => {
            // console.log(r.data);
            if (r) {
              res.send(PrintSucceeded(d.command, r, EMessage.succeeded));
            } else {
              res.send(PrintError(d.command, r, EMessage.error));
            }
          }).catch(e => {
            console.log(e);
            res.send(PrintError(d.command, e, EMessage.error));
          });
        } else if (d.command == EClientCommand.findLaoQRPaid) {
          // console.log('findLaoQRPaid');
          invZDM8.findLaoQROrderPaid(c).then((r) => {
            // console.log(r.data);
            if (r) {
              res.send(PrintSucceeded(d.command, r, EMessage.succeeded));
            } else {
              res.send(PrintError(d.command, r, EMessage.error));
            }
          }).catch(e => {
            console.log(e);
            res.send(PrintError(d.command, e, EMessage.error));
          });
        }
        else {
          return res.send(PrintError(d?.command, [], EMessage.error));
        }
      } catch (error) {
        return res.send(PrintError(d.command, error, EMessage.error));
      }
    });
    const server = http.createServer(app);
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
        else if (pathname === "/locker") {
          wss3.handleUpgrade(request, socket, head, function done(ws) {
            wss3.emit("connection", ws, request);
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
    // Global Express error handler
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Express Error:', err.stack);
      logIncident('Express Error', err); // Log to file
      res.status(500).send(PrintError('server_error', err.message, EMessage.error));
    });

    // Enhance WebSocket error handling
    wss1.on('error', (error) => {
      console.error('WebSocket wss1 Error:', error);
      logIncident('WebSocket wss1 Error', error);
    });

    wss2.on('error', (error) => {
      console.error('WebSocket wss2 Error:', error);
      logIncident('WebSocket wss2 Error', error);
    });

    wss3.on('error', (error) => {
      console.error('WebSocket wss3 Error:', error);
      logIncident('WebSocket wss3 Error', error);
    });

    // Handle uncaught exceptions to prevent crashes
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      logIncident('Uncaught Exception', error);
      // Do not exit process to keep server running
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      logIncident('Unhandled Rejection', reason);
      // Do not exit process
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





const logPath = process.env._log_path || path.join(__dirname, '..', 'logs');
const logger = createLogger({
  level: 'error',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.json()
  ),
  transports: [
    new transports.File({ filename: path.join(logPath, 'error.log') }),
    new transports.Console()
  ]
});
function logIncident(type: string, data: any) {
  logger.error({
    type,
    message: data.message || 'No message provided',
    stack: data.stack || 'No stack trace',
    timestamp: new Date().toISOString(),
    details: data
  });
}
