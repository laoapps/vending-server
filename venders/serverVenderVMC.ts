
import { KiosESSP2 } from './api/kios.essp2';
import { SocketKiosClient } from './api/socketClient.kiosk';
import { SocketClientM102 } from './api/socketClient.m102';
import { SocketClientVMC } from './api/socketClient.vmc';
import { SocketClientZDM8 } from './api/socketClient.zdm8';
import fs from 'fs';

// const app = express();
// const router = express.Router();
// app.use(express.json({ limit: '50mb' }));
// app.use(express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 5000 }));
// app.use(cors());
// app.use(cookieParser());
// app.disable('x-powered-by');
// app.use(helmet.hidePoweredBy());

// const server =http.createServer(app)
// server.listen(process.env.PORT || 9009, async function () {
//     console.log('HTTP listening on port ' + process.env.PORT || 9009);
//   });
process.env.clientkey= fs.readFileSync(__dirname + "/certs/client/client.key")+'';
process.env.clientcert = fs.readFileSync(__dirname + "/certs/client/client.crt")+'';
process.env.ca = fs.readFileSync(__dirname+'/certs/ca/ca.crt')+'';


var clients=new Array<any>();
try {
  clients = [

    new SocketClientVMC(),
    // new SocketKiosClient()
  ];

  process.on('exit', (code: number) => {
    console.log('exit code', code);

    clients.forEach(v => {
      v.close();
    })
  });
} catch (error) {
  console.log((error));
  const e = error as any;
  fs.appendFile(__dirname + '/config.json', JSON.stringify(e), (err) => {
    console.log(err);
  });
  clients.length=0;
  setTimeout(() => {
    clients = [

      new SocketClientVMC()];
  }, 5000);
  

}


