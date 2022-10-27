
import { SocketClientM102 } from './api/socketClient.m102';
import { SocketClientVMC } from './api/socketClient.vmc';
import { SocketClientZDM8 } from './api/socketClient.zdm8';


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
const clients =[

  new SocketClientVMC()];

  process.on('exit', (code:number)=>{
    console.log('exit code',code);
    
    clients.forEach(v=>{
      v.close();
    })
  });

